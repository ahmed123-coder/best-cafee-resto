const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema({
    name :{type: String, required: true, unique: true},
    description: {type: String, required: true},
    createdAt: {type: Date, default: Date.now},
    isActive: {
        type: Boolean,
        default: true, // للتحكم في حالة التصنيف (مفعل أو غير مفعل)
      },
});
module.exports = mongoose.model("Category", categorySchema);