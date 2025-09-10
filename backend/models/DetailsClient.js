const mongoose = require("mongoose");

const DetailsClientSchema = new mongoose.Schema({
  idorder: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
  firstname: { type: String, required: true },
  lastname: { type: String, required: true },
  city: { type: String, required: true },
  address: { type: String, required: true },
  postcode: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("DetailsClient", DetailsClientSchema);
