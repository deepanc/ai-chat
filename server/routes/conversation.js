const express = require("express");
const router = express.Router();
const Conversation = require("../models/Conversation");
const Room = require("../models/Room"); // Add this import

// GET /api/room-messages?roomId=...
router.get("/room-messages", async (req, res) => {
  const { roomId } = req.query;
  if (!roomId) {
    return res.status(400).json({ error: "roomId is required" });
  }
  let conversation = await Conversation.findOne({ roomId });
  if (!conversation) {
    return res.json({ messages: [] });
  }
  // Return messages as objects
  return res.json({
    messages: (conversation.messages || []).map((msg) => ({
      text: msg.text,
      userId: msg.userId,
      username: msg.username,
      timestamp: msg.timestamp,
    })),
  });
});

router.post("/join", async (req, res) => {
  const { roomId, username } = req.body; // Accept username from client
  let conversation = await Conversation.findOne({ roomId });
  if (!conversation) {
    conversation = new Conversation({ roomId, messages: [] });
    await conversation.save();
  }

  // Add user to Room.users if not already present
  if (roomId && username) {
    let room = await Room.findOne({ roomId });
    if (room && !room.users.includes(username)) {
      room.users.push(username);
      await room.save();
    }
  }

  // Return messages as objects
  res.json({
    ...conversation.toObject(),
    messages: (conversation.messages || []).map((msg) => ({
      text: msg.text,
      userId: msg.userId,
      username: msg.username, // Added username
      timestamp: msg.timestamp,
    })),
  });
});

module.exports = router;
