// --- Room Archiving Job ---
const ONE_DAY_MS = 24 * 60 * 60 * 1000;
setInterval(async () => {
  const now = new Date();
  const cutoff = new Date(now.getTime() - ONE_DAY_MS);
  const result = await Room.updateMany(
    { archived: false, createdAt: { $lt: cutoff } },
    { $set: { archived: true } }
  );
  if (result.modifiedCount > 0) {
    console.log(`Archived ${result.modifiedCount} room(s) older than 1 day.`);
  }
}, 60 * 60 * 1000); // Run every hour
require("dotenv").config();

// Add this import for GoogleGenerativeAI
const { GoogleGenerativeAI } = require("@google/generative-ai");

const express = require("express");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const mongoose = require("mongoose");
const Conversation = require("./models/Conversation");
const Template = require("./models/Template");
const Room = require("./models/Room"); // <-- Add this import

const app = express();
app.use(cors());
app.use(express.json()); // Needed for POST body parsing

// Serve static files from the React app
app.use(express.static(path.join(__dirname, "../client/build")));

// Mount conversation routes (for /api/room-messages and others)
const conversationRoutes = require("./routes/conversation");
app.use("/api", conversationRoutes);

// Health check endpoint
app.get("/health", (req, res) => res.send("OK"));

// API to get room info (name) by roomId
app.get("/api/room-info", async (req, res) => {
  const { roomId } = req.query;
  if (!roomId) return res.status(400).json({ error: "roomId required" });
  const room = await Room.findOne({ roomId });
  if (room) {
    return res.json({ exists: true, roomId: room.roomId, roomName: room.name });
  }
  res.json({ exists: false });
});

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
});

// In-memory rooms object (cleared on server restart)
const rooms = {};
const socketRoomMap = {};
let userIdCounter = 1;
const users = {}; // socket.id -> { userId, username, roomId }
const messagesByRoom = {}; // roomId -> [ { userId, username, roomId, text } ]
const usersByRoom = {}; // roomId -> [ { userId, username } ]

// --- AI Observer Setup ---
const AI_OBSERVER_NAME = "AI Observer";
const AI_OBSERVER_USERID = 0; // Reserved userId for AI
const AI_OBSERVER_INTERVAL_MS = 30000; // 30 seconds between possible AI responses
const AI_OBSERVER_MIN_MESSAGES = 3; // Only respond if at least this many messages in room

// Set your Google Generative AI API key in env var GOOGLE_GENAI_API_KEY
const genAI = process.env.GOOGLE_GENAI_API_KEY
  ? new GoogleGenerativeAI(process.env.GOOGLE_GENAI_API_KEY)
  : null;
console.log(`Google Generative AI ${genAI ? "enabled" : "disabled"}`);

// Helper to generate conversation summary using AI
async function generateConversationSummary(messages, roomId) {
  console.log(
    `[SUMMARY] Starting summary generation for room ${roomId} with ${messages.length} messages`
  );

  if (!genAI) {
    console.log(`[SUMMARY] GenAI not available`);
    return "";
  }

  if (!messages || messages.length === 0) {
    console.log(`[SUMMARY] No messages to summarize`);
    return "";
  }

  try {
    // Filter out AI messages for summary (keep only real user messages)
    const realMessages = messages.filter(
      (msg) => msg.userId !== AI_OBSERVER_USERID
    );

    console.log(`[SUMMARY] Filtered to ${realMessages.length} real messages`);

    if (realMessages.length === 0) {
      console.log(`[SUMMARY] No real messages after filtering`);
      return "";
    }

    // Build summary prompt
    let summaryPrompt = `Please create a concise summary of the following conversation. Focus on key topics discussed, important decisions made, and main themes. Keep it brief but informative.

Conversation to summarize:
`;

    for (const msg of realMessages) {
      summaryPrompt += `${msg.username || "User"}: ${msg.text}\n`;
    }

    summaryPrompt += `\nProvide a summary in 2-3 sentences that captures the essence of this conversation:`;

    console.log(
      `[SUMMARY] Built prompt with ${summaryPrompt.length} characters`
    );

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    console.log(`[SUMMARY] Calling Gemini API...`);

    const result = await model.generateContent(summaryPrompt);
    const summary =
      result?.response?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ||
      "";

    console.log(
      `[SUMMARY] Generated summary for room ${roomId} (${summary.length} chars):`,
      summary
    );
    return summary;
  } catch (err) {
    console.error(
      `[SUMMARY] Error generating summary for room ${roomId}:`,
      err.message || err
    );
    return "";
  }
}

// Helper to generate dynamic system notes for AI context
function generateSystemNotes(roomId, messages) {
  const systemNotes = [];
  const currentParticipants = usersByRoom[roomId] || [];

  // Find recent joins by looking at participant changes in recent messages
  const recentMessages = messages.slice(-10);
  const recentUsernames = new Set();
  const messageUsernames = new Set();

  // Collect usernames from recent messages and current participants
  for (const msg of recentMessages) {
    if (!msg.isSystemNote && msg.userId !== AI_OBSERVER_USERID) {
      recentUsernames.add(msg.username);
    }
  }

  for (const msg of messages) {
    if (!msg.isSystemNote && msg.userId !== AI_OBSERVER_USERID) {
      messageUsernames.add(msg.username);
    }
  }

  // Check for new participants (in current participants but with very few messages)
  for (const participant of currentParticipants) {
    const userMessages = messages.filter(
      (m) =>
        m.username === participant.username &&
        !m.isSystemNote &&
        m.userId !== AI_OBSERVER_USERID
    );
    if (userMessages.length <= 2 && recentUsernames.has(participant.username)) {
      systemNotes.push(
        `A participant "${participant.username}" recently joined the room.`
      );
    }
  }

  // Add participant count info
  if (currentParticipants.length > 0) {
    systemNotes.push(
      `There are currently ${currentParticipants.length} participants in the room.`
    );
  }

  return systemNotes;
}

// Helper to get last N messages as a prompt, using template if available
async function buildPrompt(messages, roomId) {
  // Find the room and populate its template
  const room = await Room.findOne({ roomId }).populate("template");
  let basePrompt =
    (room && room.template && room.template.prompt) ||
    `You are an AI observer in a chat room (${roomId}). Occasionally, you provide helpful, insightful, or fun comments, but you do not dominate the conversation.`;

  // Get current room participants for dynamic replacements
  const currentParticipants = usersByRoom[roomId] || [];
  const participantCount = currentParticipants.length;
  const exampleName =
    currentParticipants.length > 0
      ? currentParticipants[participantCount - 1].username
      : "";

  // Get conversation summary and recent messages since summary
  let conversationContext = "";
  let lastSummaryAt = 0;

  try {
    const conversation = await Conversation.findOne({ roomId });
    if (conversation && conversation.summary) {
      conversationContext += `\nConversation summary: ${conversation.summary}\n`;
      lastSummaryAt = conversation.lastSummaryAt || 0;
    }
  } catch (err) {
    console.error(
      `Error loading conversation summary for room ${roomId}:`,
      err
    );
  }

  // Generate dynamic system notes for context
  const systemNotes = generateSystemNotes(roomId, messages);
  if (systemNotes.length > 0) {
    conversationContext += `\nCurrent room status:\n`;
    for (const note of systemNotes) {
      conversationContext += `System note: ${note}\n`;
    }
  }

  // Add messages since last summary (or recent messages if no summary)
  const realMessages = messages.filter((msg) => !msg.isSystemNote);
  let messagesToShow;

  if (lastSummaryAt > 0 && realMessages.length > lastSummaryAt) {
    // Show messages since last summary
    messagesToShow = realMessages.slice(lastSummaryAt);
    conversationContext += `\nMessages since last summary:\n`;
  } else {
    // No summary yet, show recent messages
    messagesToShow = realMessages.slice(-8);
    conversationContext += `\nRecent conversation:\n`;
  }

  for (const msg of messagesToShow) {
    conversationContext += `${msg.username || "User"}: ${msg.text}\n`;
  }

  // Replace dynamic placeholders in the prompt
  basePrompt = basePrompt.replace(/\$\{roomId\}/g, roomId);
  basePrompt = basePrompt.replace(/<name>/g, exampleName);
  basePrompt = basePrompt.replace(/<number>/g, participantCount.toString());
  basePrompt = basePrompt.replace(
    /\$\{recentConversation\}/g,
    conversationContext
  );

  let prompt = basePrompt;

  // Optionally, you can append a final instruction if not already in the template
  if (!basePrompt.includes("[NO_REPLY]")) {
    prompt += `\nAs the AI Observer, reply with a short, relevant, and friendly message. Do not mention room IDs or room codes in your response. If you have nothing to add, reply with "[NO_REPLY]".\nAI Observer:`;
  }
  console.log(prompt);
  return prompt;
}

// AI Observer logic: periodically checks rooms and may send a message
async function aiObserverTick(io, messagesByRoom) {
  if (!genAI) return;
  for (const [roomId, messages] of Object.entries(messagesByRoom)) {
    // Filter out AI messages for counting real user messages
    const realMessages = messages.filter(
      (msg) => msg.userId !== AI_OBSERVER_USERID
    );
    if (!realMessages || realMessages.length < AI_OBSERVER_MIN_MESSAGES)
      continue;

    // Don't reply if last message was from AI
    const lastMsg = messages[messages.length - 1];
    if (lastMsg && lastMsg.userId === AI_OBSERVER_USERID) {
      // If last AI message was recent (within 1 minute), skip to avoid spam
      const timeSinceLastAI = new Date() - new Date(lastMsg.timestamp || 0);
      if (timeSinceLastAI < 60000) continue; // 60 seconds
    }

    try {
      const prompt = await buildPrompt(messages, roomId);
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      const result = await model.generateContent(prompt);
      // Extract text from Gemini result
      const aiText =
        result?.response?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ||
        "";
      if (
        aiText &&
        !aiText.startsWith("[NO_REPLY]") &&
        aiText.length < 500 // avoid long responses
      ) {
        const aiMsg = {
          userId: AI_OBSERVER_USERID,
          username: AI_OBSERVER_NAME,
          roomId,
          text: aiText,
          timestamp: new Date(),
        };
        messagesByRoom[roomId].push(aiMsg);
        io.to(roomId).emit("chat-message", aiMsg);
      }
    } catch (err) {
      console.error(`AI Observer error in room ${roomId}:`, err.message || err);
    }
  }
}

// Start AI Observer interval
if (genAI) {
  setInterval(
    () => aiObserverTick(io, messagesByRoom),
    AI_OBSERVER_INTERVAL_MS
  );
}

io.on("connection", (socket) => {
  socket.on("join-room", async ({ roomId, username }, callback) => {
    if (!roomId || !username) {
      if (typeof callback === "function")
        callback({ success: false, error: "Missing roomId or username" });
      return;
    }
    const userId = userIdCounter++;
    users[socket.id] = { userId, username, roomId };
    socketRoomMap[socket.id] = roomId;
    socket.join(roomId);

    // Always sync usersByRoom from DB before emitting
    let room = await Room.findOne({ roomId });
    const isNewUser = room && !room.users.includes(username);
    if (isNewUser) {
      room.users.push(username);
      await room.save();
    }
    // Sync in-memory usersByRoom from DB
    if (room && Array.isArray(room.users)) {
      usersByRoom[roomId] = room.users.map((uname, idx) => ({
        userId: idx + 1,
        username: uname,
      }));
    }

    // Load messages from DB if not in memory
    if (!messagesByRoom[roomId]) {
      // Try to load from MongoDB
      const conversation = await Conversation.findOne({ roomId });
      if (conversation && conversation.messages) {
        messagesByRoom[roomId] = conversation.messages.map((msg) => ({
          userId: msg.userId,
          username: msg.username,
          roomId,
          text: msg.text,
          timestamp: msg.timestamp,
        }));
      } else {
        messagesByRoom[roomId] = [];
      }
    }

    // Trigger AI to generate a welcome greeting specifically for new users
    if (isNewUser && messagesByRoom[roomId]) {
      setTimeout(async () => {
        if (!genAI) return;
        try {
          // Build a specific welcome prompt for the new user
          const room = await Room.findOne({ roomId }).populate("template");
          let welcomePrompt =
            (room && room.template && room.template.prompt) ||
            `You are an AI observer in a chat room (${roomId}). A new participant "${username}" has just joined.`;

          // Replace placeholders with context information
          welcomePrompt = welcomePrompt.replace(/\$\{roomId\}/g, roomId);
          welcomePrompt = welcomePrompt.replace(/<name>/g, username);
          welcomePrompt = welcomePrompt.replace(
            /<number>/g,
            (usersByRoom[roomId] || []).length.toString()
          );

          // Add specific welcome instruction
          welcomePrompt += `\n\nA new participant "${username}" has just joined. Welcome them warmly by name with a brief, friendly greeting. Do not mention the room ID or room code in your message.`;

          console.log("AI Welcome Prompt:", welcomePrompt);

          const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
          const result = await model.generateContent(welcomePrompt);
          const aiText =
            result?.response?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ||
            "";
          if (
            aiText &&
            !aiText.startsWith("[NO_REPLY]") &&
            aiText.length < 500
          ) {
            const aiGreeting = {
              userId: AI_OBSERVER_USERID,
              username: AI_OBSERVER_NAME,
              roomId,
              text: aiText,
              timestamp: new Date(),
            };
            messagesByRoom[roomId].push(aiGreeting);
            io.to(roomId).emit("chat-message", aiGreeting);
          }
        } catch (err) {
          console.error(
            `AI welcome greeting error in room ${roomId}:`,
            err.message || err
          );
        }
      }, 3000); // Wait 3 seconds before greeting to let user settle in
    }

    // Get all messages for display (system notes are now generated dynamically for AI only)
    const displayMessages = messagesByRoom[roomId] || [];

    // Emit initial room data (messages and users) to the joining socket
    socket.emit("roomData", {
      messages: displayMessages,
      users: usersByRoom[roomId] || [],
    });

    if (typeof callback === "function") {
      callback({
        success: true,
        messages: displayMessages,
        userId,
        username,
        users: usersByRoom[roomId],
      });
    }
    // Always emit the latest users list
    if (roomId && usersByRoom[roomId]) {
      socket.emit("room-users", usersByRoom[roomId]);
      io.to(roomId).emit("room-users", usersByRoom[roomId]);
    }
  });

  socket.on("sendMessage", (msg) => {
    const user = users[socket.id];
    if (!user || !msg.roomId) return;
    const message = {
      userId: user.userId,
      username: user.username,
      roomId: msg.roomId,
      text: msg.text,
      timestamp: new Date(),
    };
    messagesByRoom[msg.roomId] = messagesByRoom[msg.roomId] || [];
    messagesByRoom[msg.roomId].push(message);
    io.to(msg.roomId).emit("chat-message", message);

    // Check if we need to generate a summary (every 10 real messages)
    (async () => {
      try {
        // Count real messages (excluding AI messages)
        const realMessages = messagesByRoom[msg.roomId].filter(
          (m) => m.userId !== AI_OBSERVER_USERID
        );

        // Check if we should generate a summary
        if (realMessages.length > 0 && realMessages.length % 10 === 0) {
          console.log(
            `Triggering summary generation for room ${msg.roomId} at ${realMessages.length} messages`
          );

          // Get or create conversation document
          let conversation = await Conversation.findOne({ roomId: msg.roomId });
          if (!conversation) {
            conversation = new Conversation({
              roomId: msg.roomId,
              messages: [],
            });
            console.log(
              `Created new conversation document for room ${msg.roomId}`
            );
          }

          console.log(
            `Current lastSummaryAt: ${conversation.lastSummaryAt}, realMessages.length: ${realMessages.length}`
          );

          // Only generate summary if we haven't already summarized these messages
          if (realMessages.length > conversation.lastSummaryAt) {
            // Get messages since last summary
            const messagesToSummarize = realMessages.slice(
              conversation.lastSummaryAt
            );

            console.log(`Messages to summarize: ${messagesToSummarize.length}`);

            // Generate new summary
            const newSummary = await generateConversationSummary(
              messagesToSummarize,
              msg.roomId
            );

            console.log(`Generated summary: "${newSummary}"`);

            if (newSummary) {
              // Combine with existing summary if any
              let combinedSummary = newSummary;
              if (conversation.summary) {
                combinedSummary = `${conversation.summary} ${newSummary}`;
                console.log(`Combined with existing summary`);
              }

              // Update conversation with new summary
              conversation.summary = combinedSummary;
              conversation.lastSummaryAt = realMessages.length;

              console.log(
                `Saving conversation with summary: "${combinedSummary.substring(
                  0,
                  100
                )}..."`
              );
              await conversation.save();

              console.log(`Summary successfully saved for room ${msg.roomId}`);
            } else {
              console.log(`No summary generated (empty result)`);
            }
          } else {
            console.log(
              `Skipping summary generation - already summarized up to ${conversation.lastSummaryAt}`
            );
          }
        } else {
          if (realMessages.length % 5 === 0) {
            console.log(
              `Real message count for room ${msg.roomId}: ${realMessages.length} (waiting for multiple of 10)`
            );
          }
        }
      } catch (err) {
        console.error(`Error in summarization for room ${msg.roomId}:`, err);
      }
    })();

    // Explicit AI invocation: if message starts with @AI (case-insensitive)
    if (
      typeof msg.text === "string" &&
      msg.text.trim().toLowerCase().startsWith("@ai")
    ) {
      // Use the same logic as aiObserverTick, but only for this room
      (async () => {
        if (!genAI) return;
        const messages = messagesByRoom[msg.roomId] || [];
        // Don't reply if last message was from AI
        const lastMsg = messages[messages.length - 1];
        if (lastMsg && lastMsg.userId === AI_OBSERVER_USERID) return;
        try {
          const prompt = await buildPrompt(messages, msg.roomId);
          const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
          const result = await model.generateContent(prompt);
          const aiText =
            result?.response?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ||
            "";
          if (
            aiText &&
            !aiText.startsWith("[NO_REPLY]") &&
            aiText.length < 500
          ) {
            const aiMsg = {
              userId: AI_OBSERVER_USERID,
              username: AI_OBSERVER_NAME,
              roomId: msg.roomId,
              text: aiText,
              timestamp: new Date(),
            };
            messagesByRoom[msg.roomId].push(aiMsg);
            io.to(msg.roomId).emit("chat-message", aiMsg);
          }
        } catch (err) {
          console.error(
            `Explicit AI error in room ${msg.roomId}:`,
            err.message || err
          );
        }
      })();
    }
  });

  socket.on("disconnect", async () => {
    const user = users[socket.id];
    const roomId = socketRoomMap[socket.id];

    // Note: We don't generate "left the room" system notes for disconnects
    // because closing a browser window just ends the session, it doesn't mean
    // the user has left the room. They remain a participant and may return.

    // Save messages to MongoDB if roomId exists and messages exist
    if (roomId && messagesByRoom[roomId]) {
      let conversation = await Conversation.findOne({ roomId });
      if (!conversation) {
        conversation = new Conversation({ roomId, messages: [] });
      }
      // Save all messages for this room
      conversation.messages = messagesByRoom[roomId].map((msg) => ({
        userId: msg.userId,
        username: msg.username,
        text: msg.text,
        timestamp: msg.timestamp || new Date(),
      }));
      await conversation.save();
    }

    // Remove user from usersByRoom
    if (roomId && usersByRoom[roomId]) {
      usersByRoom[roomId] = usersByRoom[roomId].filter(
        (u) => u.userId !== (user && user.userId)
      );
      if (usersByRoom[roomId].length === 0) delete usersByRoom[roomId];
    }

    delete users[socket.id];
    if (roomId && rooms[roomId]) {
      rooms[roomId] = rooms[roomId].filter((id) => id !== socket.id);
      if (rooms[roomId].length === 0) delete rooms[roomId];
    }
    delete socketRoomMap[socket.id];
    console.log(`Socket ${socket.id} disconnected from room ${roomId}`);
  });
});

// API to create a room with a template
app.post("/api/create-room", async (req, res) => {
  const { roomId, roomName, templateName, username } = req.body;
  if (!roomId || !roomName) {
    return res.status(400).json({ error: "roomId and roomName required" });
  }
  // Always use provided templateName or fallback to "General"
  let template =
    (templateName && (await Template.findOne({ name: templateName }))) ||
    (await Template.findOne({ name: "General" }));

  // Generate magic link
  const magicLink = `${
    process.env.PUBLIC_URL || "http://localhost:3000"
  }/room/${roomId}`;

  // Create or update Room
  let room = await Room.findOne({ roomId });
  if (!room) {
    room = new Room({
      roomId,
      name: roomName,
      template: template ? template._id : null,
      magicLink, // store magic link
      users: username ? [username] : [], // <-- Add creator to users array
    });
    await room.save();
  } else {
    // Always update template if not set or if a new template is chosen
    let changed = false;
    if (
      (!room.template && template) ||
      (template && !room.template?.equals(template._id))
    ) {
      room.template = template ? template._id : null;
      changed = true;
    }
    // Set magicLink if not present
    if (!room.magicLink) {
      room.magicLink = magicLink;
      changed = true;
    }
    // Add username to users array if not present
    if (username && !room.users.includes(username)) {
      room.users.push(username);
      changed = true;
    }
    if (changed) await room.save();
  }

  // Create conversation if not exists, and associate with Room and Template
  let conversation = await Conversation.findOne({ roomId });
  if (!conversation) {
    conversation = new Conversation({
      roomId,
      name: roomName,
      messages: [],
      room: room._id,
      template: template ? template._id : null,
    });
    await conversation.save();
  } else {
    // Optionally update room/template ref if needed
    let changed = false;
    if (!conversation.room) {
      conversation.room = room._id;
      changed = true;
    }
    if (!conversation.template && template) {
      conversation.template = template._id;
      changed = true;
    }
    if (changed) await conversation.save();
  }

  // Optionally, add creator as first user in usersByRoom
  if (username) {
    usersByRoom[roomId] = usersByRoom[roomId] || [];
    if (!usersByRoom[roomId].some((u) => u.username === username)) {
      // Use userId 1 for creator (or you can generate a new one)
      usersByRoom[roomId].push({ userId: 1, username });
    }
  }

  res.json({
    success: true,
    roomId,
    template: template?.name,
    magicLink: room.magicLink,
    users: usersByRoom[roomId] || [],
  });
});

// API to get users in a room
app.get("/api/room-users", async (req, res) => {
  const { roomId } = req.query;
  if (!roomId) return res.status(400).json({ error: "roomId required" });

  // Always fetch from DB for source of truth
  const room = await Room.findOne({ roomId });
  let users = [];
  if (room && Array.isArray(room.users)) {
    // Return as array of { username }
    users = room.users.map((username) => ({ username }));
    // Optionally, sync in-memory usersByRoom for consistency
    usersByRoom[roomId] = users.map((u, idx) => ({
      userId: idx + 1,
      username: u.username,
    }));
    // Return with userId for frontend compatibility
    users = usersByRoom[roomId];
  } else {
    users = usersByRoom[roomId] || [];
  }
  res.json({ users });
});

// Add this API endpoint before the catch-all route
app.get("/api/room-by-name", async (req, res) => {
  const { roomName } = req.query;
  if (!roomName) return res.status(400).json({ error: "roomName required" });
  const room = await Room.findOne({ name: roomName });
  if (room) {
    return res.json({
      exists: true,
      roomId: room.roomId,
      magicLink: room.magicLink,
    });
  }
  res.json({ exists: false });
});

// --- ADD: API to join a room (add user to room.users and usersByRoom) ---
app.post("/api/join", async (req, res) => {
  const { roomId, username } = req.body;
  if (!roomId || !username) {
    return res.status(400).json({ error: "roomId and username required" });
  }
  // Add username to Room.users array in DB if not present
  const room = await Room.findOne({ roomId });
  if (room && !room.users.includes(username)) {
    room.users.push(username);
    await room.save();
  }
  // Add to in-memory usersByRoom (if not present)
  usersByRoom[roomId] = usersByRoom[roomId] || [];
  if (!usersByRoom[roomId].some((u) => u.username === username)) {
    // Assign a new userId (find max userId in room and add 1)
    const maxUserId =
      usersByRoom[roomId].length > 0
        ? Math.max(...usersByRoom[roomId].map((u) => u.userId || 1))
        : 1;
    usersByRoom[roomId].push({ userId: maxUserId + 1, username });
  }
  res.json({ success: true });
});

// Add this catch-all route after your API routes
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../client/build", "index.html"));
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
