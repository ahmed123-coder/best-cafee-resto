// models/Table.js
const mongoose = require("mongoose");

const tableSchema = new mongoose.Schema({
  number: { type: Number, required: true, unique: true },
  capacity: { type: Number, required: true },
  status: {
    type: String,
    enum: ["free", "awaiting", "reserved"],
    default: "free",
  },
  serverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
});

module.exports = mongoose.model("Table", tableSchema);
