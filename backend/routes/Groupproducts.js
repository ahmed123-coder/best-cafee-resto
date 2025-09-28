const express = require("express");
const dotenv = require("dotenv");
const multer = require("multer");
const router = express.Router();
const ProductGroup = require("../models/ProductGroup");
const Product = require("../models/Product");
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../cloudinaryConfig");

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "uploads",
    upload_preset:process.env.CLOUDINARY_UPLOAD_PRESET,
    allowed_formats: ["jpg", "png", "jpeg", "webp"],
    transformation: [{ width: 800, crop: "limit" }],
  },
});

const upload = multer({ storage });
router.get("/", async (req, res)=>{
    try{
        const productGroups = await ProductGroup.find().populate("products.product", "name price quantity");
        res.status(200).json(productGroups);
    }catch(error){
        res.status(500).json({error: error.message});
    }
});
// Get a single product group by ID
router.get("/:id", async (req, res) => {
    try {
      const group = await ProductGroup.findById(req.params.id)
        .populate("products.product", "name price quantity");
      if (!group) {
        return res.status(404).json({ error: "Product group not found" });
      }
      res.status(200).json(group);
    } catch (error) {
      res.status(500).json({ error: "Error fetching product group" });
    }
  });
  router.put("/:id", upload.single("image"), async (req, res)=>{
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }
    const decode = jwt.verify(token, JWT_SECRET);
    try{
        const user = await User.findById(decode.id);
        if(!user){
          return res.status(404).json({ message: "User not found" });
        }
        if(user.role === "admin"){
          const updateData = req.body;
          if (req.file) updateData.image = req.file.path;
          const group = await ProductGroup.findById(req.params.id);
          if(!group){
              return res.status(404).json({ error: `Product with ID ${item.product} not found`});
          }
          if(updateData.products){
              for(const item of updateData.products){
                  const product = await Product.findById(item.product);
                  if(!product){
                    res.status(404).json({ error: `Product with ID ${item.product} not found` });
                  }
              }
          }
          const updatedGroup = await ProductGroup.findByIdAndUpdate(req.params.id, updateData, { new: true });
          req.emit("updateProductGroup", updatedGroup);
          res.status(200).json(updatedGroup);
        }
    }catch(error){
        res.status(500).json({ error: "Error updating product group" });
    }
  });
router.post("/", upload.single("image"),async (req, res)=>{
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }
    const decode = jwt.verify(token, JWT_SECRET);
    try{
        const user = await User.findById(decode.id);
        if(!user){
            return res.status(404).json({ message: "User not found" });
        }
        if (user.role === "admin"){
            const image = req.file ? req.file.path : null; // Save the file path
            const {name, description, products, price} =req.body;
            for(const item of products){
                const product = await Product.findById(item.product);
                if(!product){
                    res.status(404).json({ error: `Product with ID ${item.product} not found` });
                }
            }
            const productGroup = new ProductGroup({name, description, products, price, image});
            await productGroup.save();
            req.emit("newProductGroup", productGroup);
            res.status(201).json(productGroup);
        }
    }catch(error){
        res.status(500).json({error: "Error creating product group"})
    }
});
router.delete("/:id", async (req, res)=>{
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
      const idgroup = req.params.id;
      await ProductGroup.findByIdAndDelete(idgroup);
      req.emit("deleteProductGroup", idgroup);
      res.status(200).json({ message: "Product group deleted successfully" });
    }
  }catch(error){
    res.status(200).json({error: error.message});
  }
});

module.exports = router;