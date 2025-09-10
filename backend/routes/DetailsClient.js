const express = require("express");
const dotenv = require("dotenv");
const router = express.Router();
const DetailsClient = require("../models/DetailsClient");
const Order = require("../models/Order");
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET;

// Create DetailsClient entry
// routes/DetailsClient.js
router.post("/", async (req, res) => {
  try {
    const newDetails = new DetailsClient(req.body);
    await newDetails.save();
    res.status(201).json(newDetails);
  } catch (error) {
    res.status(500).json({ message: "Error creating client details", error });
  }
});
// Get details by order ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Fetch details using order ID
    const details = await DetailsClient.findById(id);
    if (!details) {
      return res.status(404).json({ message: "Order details not found." });
    }

    res.status(200).json(details);
  } catch (error) {
    console.error("Error fetching order details:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});
router.get("/", async (req, res)=>{
  try{
        const token = req.headers.authorization?.split(" ")[1];
    
        if (!token) {
          return res.status(401).json({ message: "No token provided" });
        }
        const decode = jwt.verify(token, JWT_SECRET);
        const user = await User.findById(decode.id);
        if(!user){
          return res.status(401).json({ message: "No token provided" });
        }
        if(user.role === "admin"){
          const detailsclient = await DetailsClient.find();
          res.status(200).json(detailsclient);
        }
  }catch(err){
    res.status(500).json({ message: "Internal server error" });
  }
});
router.delete("/:id", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }
    const decode = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decode.id);
    if (!user) {
      return res.status(401).json({ message: "No token provided" });
    }
    if (user.role === "admin") {
      const { id } = req.params;
      const deleted = await DetailsClient.findOneAndDelete({ idorder: id });
      if (!deleted) {
        return res.status(404).json({ message: "Order details not found." });
      }
      res.status(200).json({ message: "Order details deleted successfully" });
    }
  } catch (err) {
    res.status(500).json({ message: "Internal server error" });
  }
});


module.exports = router;
