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

// Helper to get last N messages as a prompt
function buildPrompt(messages, roomId) {
  const lastMsgs = messages.slice(-8);
  let prompt = `You are an AI observer in a chat room (${roomId}). Occasionally, you provide helpful, insightful, or fun comments, but you do not dominate the conversation. Here is the recent conversation:\n`;
  for (const msg of lastMsgs) {
    prompt += `${msg.username || "User"}: ${msg.text}\n`;
  }
  prompt += `\nAs the AI Observer, reply with a short, relevant, and friendly message. If you have nothing to add, reply with "[NO_REPLY]".\nAI Observer:`;
  return prompt;
}

// AI Observer logic: periodically checks rooms and may send a message
async function aiObserverTick(io, messagesByRoom) {
  if (!genAI) return;
  for (const [roomId, messages] of Object.entries(messagesByRoom)) {
    if (!messages || messages.length < AI_OBSERVER_MIN_MESSAGES) continue;
    // Don't reply if last message was from AI
    const lastMsg = messages[messages.length - 1];
    if (lastMsg && lastMsg.userId === AI_OBSERVER_USERID) continue;

    try {
      const prompt = buildPrompt(messages, roomId);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
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
    if (room && !room.users.includes(username)) {
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
        }));
      } else {
        messagesByRoom[roomId] = [];
      }
    }

    // Emit initial room data (messages and users) to the joining socket
    socket.emit("roomData", {
      messages: messagesByRoom[roomId] || [],
      users: usersByRoom[roomId] || [],
    });

    if (typeof callback === "function") {
      callback({
        success: true,
        messages: messagesByRoom[roomId],
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
          const prompt = buildPrompt(messages, msg.roomId);
          const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
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
