const mongoose = require("mongoose");
const productSchema = new mongoose.Schema({
    name:{type:String, required:true, trim: true,},
    description : {type: String, trim: true,},
    price : {type:Number, required:true, },
    category: {
        type: mongoose.Schema.Types.ObjectId, // ربط المنتج بتصنيف
        ref: "Category",
        required: true,
    },
        quantity: {
        type: Number,
        min: 0,
        required: false, // اجعلها غير مطلوبة
        default: null    // null = غير محدود
    },
    image: {
        type: String,
        required: true, // رابط لصورة المنتج
    },
    isActive: {
        type: Boolean,
        default: true,
    },

});
module.exports = mongoose.model("Product", productSchema);