const mongoose = require("mongoose");
const express = require("express");
const router = express.Router();
const Table = require("../models/Table");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const JWT_SECRET = process.env.JWT_SECRET;

// ✅ إضافة طاولة جديدة (Admin فقط)
router.post("/", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "No token provided" });

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    if (user.role !== "admin") return res.status(403).json({ error: "Unauthorized" });

    const { number, capacity, status, serverId } = req.body;

    if (!number || !capacity) {
      return res.status(400).json({ error: "Number and capacity are required" });
    }

    const newTable = new Table({
      number,
      capacity,
      status: status || "free",
      serverId: serverId || null,
    });

    await newTable.save();
    res.status(201).json(newTable);
  } catch (error) {
    console.error("❌ Error in POST /tables:", error);
    res.status(500).json({ error: error.message });
  }
});

// ✅ جلب جميع الطاولات
router.get("/", async (req, res) => {
  try {
    const tables = await Table.find().populate("serverId", "firstName lastName email");
    res.status(200).json(tables);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ تعديل طاولة (Admin فقط)
router.put("/:id", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "No token provided" });

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    if (user.role !== "admin") return res.status(403).json({ error: "Unauthorized" });

    const { number, capacity, status, serverId } = req.body;

    if (serverId && !mongoose.Types.ObjectId.isValid(serverId)) {
      return res.status(400).json({ error: "Invalid serverId" });
    }

    const table = await Table.findById(req.params.id);
    if (!table) return res.status(404).json({ error: "Table not found" });

    if (number) table.number = number;
    if (capacity) table.capacity = capacity;
    if (status) table.status = status;
    if (serverId) table.serverId = serverId;

    await table.save();
    res.status(200).json(table);
  } catch (error) {
    console.error("❌ Error in PUT /tables:", error);
    res.status(500).json({ error: error.message });
  }
});

// ✅ حذف طاولة (Admin فقط)
router.delete("/:id", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "No token provided" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.role !== "admin") {
      return res.status(403).json({ message: "Only admins can delete tables" });
    }

    await Table.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Table deleted successfully" });
  } catch (error) {
    console.error("❌ Error deleting table:", error);
    res.status(500).json({ error: error.message });
  }
});

// معالج أخطاء
router.use((err, req, res, next) => {
  console.error("❌ Server Error:", err);
  res.status(500).json({ error: err.message || "Internal server error" });
});

//my tables by userid
router.get("/my-tables", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No token provided" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    if(user.role !== "server") return res.status(403).json({ error: "Unauthorized" });
    const tables = await Table.find({ serverId: user._id });
    res.status(200).json(tables);
  } catch (error) {
    console.error("❌ Error in GET /tables/my-tables:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
