const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema(
  {
    text: { type: String, required: true },
    userId: { type: String, required: true },
    username: { type: String, required: true }, // Added username
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const ConversationSchema = new mongoose.Schema({
  roomId: { type: String, required: true, unique: true },
  messages: { type: [MessageSchema], default: [] },
  template: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Template",
    default: null,
  }, // <-- add this
  room: { type: mongoose.Schema.Types.ObjectId, ref: "Room" }, // <-- Add this line
});

module.exports = mongoose.model("Conversation", ConversationSchema);
