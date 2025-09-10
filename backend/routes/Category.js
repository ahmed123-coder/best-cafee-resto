const express = require("express");
const dotenv = require("dotenv");
const router = express.Router();
const Category = require("../models/Category");
const User = require("../models/User");
const JWT_SECRET = process.env.JWT_SECRET;
const jwt = require("jsonwebtoken");

router.post("/", async (req, res)=>{
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
            const category = new Category(req.body);
            await category.save();
            res.status(201).json(category);
        }
    }catch(error){
        res.status(400).json({error: error.message})
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
            const categorys = await Category.find();
            res.status(200).json(categorys);
        }
    }catch(error){
        res.status(500).json({error: error.message})
    }
});
router.put("/:id",async (req, res)=>{
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
            const {id} = req.params;
            const {name ,description, isActive} = req.body;
            const updatecategory = await Category.findByIdAndUpdate(id, {name ,description, isActive}, { new: true, runValidators: true });
            if(!updatecategory){
                return res.status(404).json({ message: "Category not found" });
            }
            res.status(200).json(updatecategory);
        }
        else {
            return res.status(403).json({ message: "Access denied" });
        }
        
    }catch(error){
        res.status(500).json({ error: error.message });
    }
});
router.delete("/:id", async (req, res) => {
    const { id } = req.params;
    try {
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
            const deletedCategory = await Category.findByIdAndDelete(id);

            if (!deletedCategory) {
                return res.status(404).json({ message: "Category not found" });
            }
    
            res.status(200).json({ message: "Category deleted successfully" });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
module.exports = router;