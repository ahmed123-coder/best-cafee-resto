
const mongoose = require("mongoose");
const express = require("express");
const router = express.Router();
const Product = require("../models/Product");
const multer = require("multer");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../cloudinaryConfig");

const JWT_SECRET = process.env.JWT_SECRET;

// إعداد التخزين باستخدام Cloudinary
// Cloudinary storage config
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: { // بدل الدالة الغير متزامنة
    folder: "uploads",
    upload_preset: process.env.CLOUDINARY_UPLOAD_PRESET,
    allowed_formats: ["jpg", "png", "jpeg", "webp"],
    transformation: [{ width: 800, crop: "limit" }]
  }
});

const upload = multer({ storage });
// ✅ إضافة منتج (يدعم الكمية غير المحدودة)
router.post("/", upload.single("image"), async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "No token provided" });

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    if (user.role !== "admin") return res.status(403).json({ error: "Unauthorized" });

    const { name, description, price, category, quantity, isActive } = req.body;
    const image = req.file?.path;

    if (!image) return res.status(400).json({ error: "Image is required" });

    // دعم الكمية غير المحدودة: إذا كانت الكمية فارغة أو -1 أو null اعتبرها غير محدودة
    const finalQuantity =
      quantity === "" || quantity === undefined || quantity === null || quantity === "-1" || quantity === -1
        ? null
        : Number(quantity);

    const newProduct = new Product({
      name,
      description,
      price,
      category,
      quantity: finalQuantity,
      image,
      isActive,
    });
    await newProduct.save();
    res.status(201).json(newProduct);
  } catch (error) {
    console.error("❌ Error in POST /products:", error);
    res.status(500).json({ error: error.message });
  }
});

// ✅ جلب جميع المنتجات
router.get("/", async (req, res) => {
  try {
    const products = await Product.find().populate("category", "name");
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ تعديل منتج (يدعم الكمية غير المحدودة)
router.put("/:id", upload.single("image"), async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "No token provided" });

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    if (user.role !== "admin") return res.status(403).json({ error: "Unauthorized" });

    // تحقق من صحة category ID
    const { category } = req.body;
    if (category && !mongoose.Types.ObjectId.isValid(category)) {
      return res.status(400).json({ error: "Invalid category ID" });
    }

    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: "Product not found" });

    const { name, description, price, quantity, isActive } = req.body;
    const image = req.file?.path;

    // تحديث الحقول
    if (name) product.name = name;
    if (description) product.description = description;
    if (price) product.price = price;
    if (category) product.category = category;
    // دعم الكمية غير المحدودة
    if (typeof quantity !== "undefined") {
      product.quantity =
        quantity === "" || quantity === undefined || quantity === null || quantity === "-1" || quantity === -1
          ? null
          : Number(quantity);
    }
    if (typeof isActive !== "undefined") product.isActive = isActive;
    if (image) product.image = image;

    await product.save();
    res.status(200).json(product);
  } catch (error) {
    console.error("❌ Error in PUT /products:", error);
    res.status(500).json({ error: error.message });
  }
});

// ✅ حذف منتج
router.delete("/:id", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) return res.status(401).json({ message: "No token provided" });

  try {
    const decode = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decode.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.role !== "admin") {
      return res.status(403).json({ message: "Only admins can delete products" });
    }

    await Product.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("❌ Error deleting product:", error);
    res.status(500).json({ error: error.message });
  }
});

// معالج أخطاء مخصص
router.use((err, req, res, next) => {
  console.error("❌ Server Error:", err);
  res.status(500).json({ error: err.message || "Internal server error" });
});

module.exports = router;
