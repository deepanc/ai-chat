const mongoose = require("mongoose");

const RoomSchema = new mongoose.Schema({
  roomId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  template: { type: mongoose.Schema.Types.ObjectId, ref: "Template" },
});

module.exports = mongoose.model("Room", RoomSchema);
