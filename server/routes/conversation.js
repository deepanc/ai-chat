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

module.exports = router;
