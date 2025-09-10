const mongoose = require("mongoose");

const productGroupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    products: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId, // Reference to individual product
          ref: "Product",
          required: true,
        },
        quantity: {
          type: Number, // Quantity of the product in the group
          required: true,
          min: 1,
        },
      },
    ],
    price: {
      type: Number,
      required: true, // Group-level price
    },
    available: {
      type: Boolean,
      default: true,
    },
    image: {type:String, required:true,},
  },
  { timestamps: true },
);

module.exports  = mongoose.model("ProductGroup", productGroupSchema);


