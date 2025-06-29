const express = require("express");
const router = express.Router();
const Conversation = require("../models/Conversation");

router.post("/join", async (req, res) => {
  const { roomId } = req.body;
  let conversation = await Conversation.findOne({ roomId });
  if (!conversation) {
    conversation = new Conversation({ roomId, messages: [] });
    await conversation.save();
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
