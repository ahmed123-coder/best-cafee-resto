const mongoose = require("mongoose");
const userSchema = new mongoose.Schema({
    firstName :{type: String, required:true},
    lastName :{type: String, required:true},
    email : {type: String, required: true, unique: true},
    password: {type: String, required: true},
    role: {type: String, enum : ["admin", "customer", "chef","server"], default: "customer"},
    cart: {
        products: [
            {
                productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
                quantity: { type: Number, default: 1 },
            },
        ],
        groupProducts: [
            {
                groupId: { type: mongoose.Schema.Types.ObjectId, ref: "ProductGroup", required: true },
                quantity: { type: Number, default: 1 },
            },
        ],
    },
    createdAt: {type: Date, default: Date.now},
});
module.exports = mongoose.model("User", userSchema);