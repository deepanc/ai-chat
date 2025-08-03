const mongoose = require("mongoose");

const RoomSchema = new mongoose.Schema({
  roomId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  template: { type: mongoose.Schema.Types.ObjectId, ref: "Template" },
  magicLink: { type: String },
  users: [{ type: String }],
  archived: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Room", RoomSchema);
