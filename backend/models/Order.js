const mongoose = require("mongoose");
const { Schema, Types } = mongoose;

const OrderSchema = new Schema({
  customer: {
    type: Schema.Types.Mixed, // ← يسمح ب ObjectId أو String مثل "Guest"
    required: true,
  },
  products: [
    {
      product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
      quantity: { type: Number, required: true },
    },
  ],
  productGroups: [
    {
      group: { type: Schema.Types.ObjectId, ref: "ProductGroup", required: true },
      quantity: { type: Number, required: true },
    },
  ],
  totalPrice: { type: Number, required: true },
  status: {
    type: String,
    enum: ["pending", "confirmed", "rejected", "started", "canceled", "delivered", "completed",  "paid"],
    default: "pending"
  },
  paymentMethod: {
    type: String,
    enum: ["cash", "credit card", "paypal"],
    required: true,
  },
  createdAt: { type: Date, default: Date.now },
  tableId: { type: Schema.Types.ObjectId, ref: "Table", required: true },
  queueNumber: { type: Number }, // رقم الزبون في الطابور
  isInStore: { type: Boolean, default: false }, // هل الطلب داخلي
});

module.exports = mongoose.model("Order", OrderSchema);