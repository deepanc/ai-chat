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

// Health check endpoint
app.get("/health", (req, res) => res.send("OK"));

// Connect to MongoDB
mongoose
  .connect("mongodb://127.0.0.1:27017/ai-chat", {
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
// Track which room each socket is in
const socketRoomMap = {};
let userIdCounter = 1;
const users = {}; // socket.id -> { userId, username, roomId }
const messagesByRoom = {}; // roomId -> [ { userId, username, roomId, text } ]

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
      callback({ success: false, error: "Missing roomId or username" });
      return;
    }
    const userId = userIdCounter++;
    users[socket.id] = { userId, username, roomId };
    socketRoomMap[socket.id] = roomId;
    socket.join(roomId);

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

    callback({
      success: true,
      messages: messagesByRoom[roomId],
      userId,
      username,
    });
  });

  socket.on("chat-message", (msg) => {
    const user = users[socket.id];
    if (!user || !msg.roomId) return;
    const message = {
      userId: user.userId,
      username: user.username,
      roomId: msg.roomId,
      text: msg.text,
    };
    messagesByRoom[msg.roomId] = messagesByRoom[msg.roomId] || [];
    messagesByRoom[msg.roomId].push(message);
    io.to(msg.roomId).emit("chat-message", message);
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
  const { roomId, roomName, templateName } = req.body;
  if (!roomId || !roomName) {
    return res.status(400).json({ error: "roomId and roomName required" });
  }
  // Always use provided templateName or fallback to "General"
  let template =
    (templateName && (await Template.findOne({ name: templateName }))) ||
    (await Template.findOne({ name: "General" }));

  // Create or update Room
  let room = await Room.findOne({ roomId });
  if (!room) {
    room = new Room({
      roomId,
      name: roomName,
      template: template ? template._id : null,
    });
    await room.save();
  } else {
    // Always update template if not set or if a new template is chosen
    if (
      (!room.template && template) ||
      (template && !room.template?.equals(template._id))
    ) {
      room.template = template ? template._id : null;
      await room.save();
    }
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
  res.json({ success: true, roomId, template: template?.name });
});

// Add this catch-all route after your API routes
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../client/build", "index.html"));
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
