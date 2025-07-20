const mongoose = require("mongoose");

const RoomSchema = new mongoose.Schema({
  roomId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  template: { type: mongoose.Schema.Types.ObjectId, ref: "Template" },
  magicLink: { type: String },
  users: [{ type: String }], // <-- Add this line to store usernames
});

module.exports = mongoose.model("Room", RoomSchema);
