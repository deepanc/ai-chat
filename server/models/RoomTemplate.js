const mongoose = require("mongoose");

const RoomTemplateSchema = new mongoose.Schema({
  roomId: { type: String, required: true, ref: "Room" },
  templateId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "Template",
  },
});

module.exports = mongoose.model("RoomTemplate", RoomTemplateSchema);
