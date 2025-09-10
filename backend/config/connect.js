const mongoose = require("mongoose");
require("dotenv").config(); // لتفعيل قراءة المتغيرات من .env

// الاتصال بقاعدة البيانات
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("✅ Connected to MongoDB"))
.catch((error) => console.error("❌ Connection error:", error));

// تصدير الاتصال لاستخدامه في أماكن أخرى
const db = mongoose.connection;

db.on("error", console.error.bind(console, "MongoDB connection error:"));

module.exports = db;
