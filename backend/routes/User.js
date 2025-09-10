const express = require("express");
const dotenv = require("dotenv");
const router = express.Router();
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET;
const bcrypt = require("bcrypt");
const ProductGroup = require("../models/ProductGroup"); // تأكد أن المسار صحيح
const Product = require("../models/Product"); // تأكد أن المسار صحيح


router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      console.log("User not found");
      return res.status(404).json({ message: "User not found" });
    }

    console.log("User found:", user);

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log("Password mismatch");
      return res.status(401).json({ message: "Invalid credentials" });
    }

    console.log("Password matched");

    const payload = { id: user._id, email: user.email, role: user.role };
    const token = jwt.sign(payload, "your_secret_key", { expiresIn: "24h" });

    res.status(200).json({ token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "An error occurred" });
  }
});
router.get("/me", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET); // افحص صحة التوكن
    const user = await User.findById(decoded.id).populate([
      {
        path: "cart.products.productId", // لجلب تفاصيل المنتج
        select: "name price image",
      },
      {
        path: "cart.groupProducts.groupId", // لجلب تفاصيل المجموعة
        select: "name price image",
      },
    ]);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user);
  } catch (err) {
    console.error("Error fetching user:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/", async (req, res) => {
  const { email, password, firstName, lastName } = req.body; // احذف role من هنا

  try {
    if (password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters long" });
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const newUser = new User({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      role: "admin", // اجبر الدور على customer فقط
      cart: { products: [], groupProducts: [] }
    });

    await newUser.save();
    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "An error occurred" });
  }
});


// create account only for admin
router.post("/admin", async (req, res) => {
    const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }

    const { email, password, firstName, lastName, role } = req.body;

    if (password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters long" });
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const newUser = new User({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      role,
      cart: { products: [], groupProducts: [] }
    });

    await newUser.save();
    res.status(201).json({ message: "Admin registered successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "An error occurred" });
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
      return res.status(404).json({ message: "User not found" });
    }
    if(user.role === "admin"){
      const users = await User.find();
      res.status(200).json(users);
    }
}catch(err){
    res.status(500).json({err:err.message});
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
        return res.status(404).json({ message: "User not found" });
      }
      if(user.role === "admin"){
        const userid = req.params.id;
        await User.findByIdAndDelete(userid);
        res.status(200).json({ message: "User deleted successfully" });
      }
    }catch(error){
        res.status(200).json({error: error.message});
    }
});
// Update User by ID
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { firstName, lastName, email, password, cart, role } = req.body;

  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }
    const decode = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decode.id);
    if(!user){
      return res.status(404).json({ message: "User not found" });
    }
    if(user.role === "admin"){
            // Find the user by ID
            const userput = await User.findById(id);
            if (!userput) {
                return res.status(404).json({ message: "User not found" });
            }
      
            // Update user details if provided
            if (firstName) userput.firstName = firstName;
            if (lastName) userput.lastName = lastName;
            if (email) userput.email = email;
            if (password) userput.password = password; // Consider hashing before saving
            if (role) userput.role = role; // Update role if provided
      
            // Update cart if provided
            if (cart) {
                if (cart.products) {
                    userput.cart.products = cart.products;
                }
                if (cart.groupProducts) {
                    userput.cart.groupProducts = cart.groupProducts;
                }
            }
      
            // Save the updated user
            await userput.save();
      
            res.status(200).json({ message: "User updated successfully", userput });
    }
  } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Error updating user", error });
  }
});

  // Fetch user's cart by userId
router.get("/cart/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
      // Find the user by ID
      const user = await User.findById(userId).populate([
          { path: "cart.products.productId", select: "name price" },
          { path: "cart.groupProducts.groupId", select: "name price" },
      ]);

      if (!user) {
          return res.status(404).json({ message: "User not found" });
      }

      // Return the user's cart
      res.status(200).json({ cart: user.cart });
  } catch (error) {
      console.error("Error fetching user's cart:", error);
      res.status(500).json({ message: "An error occurred while fetching the cart" });
  }
});


// Add a product to the cart
router.post("/cart/product", async (req, res) => {
  const { productId, quantity } = req.body;
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) return res.status(401).json({ message: "No token provided" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: "Product not found" });

    if (!user.cart) user.cart = { products: [], groupProducts: [] };

    const existingProduct = user.cart.products.find((p) => p.productId.toString() === productId);
    if (existingProduct) {
      existingProduct.quantity += parseInt(quantity, 10);
    } else {
      user.cart.products.push({ productId, quantity: parseInt(quantity, 10) });
    }

    await user.save();
    res.status(200).json({ message: "Product added to cart", cart: user.cart });
  } catch (err) {
    console.error("Error adding product to cart:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});


// Add a group product to the cart
router.post("/cart/groupproduct", async (req, res) => {
  const { groupId, quantity } = req.body;
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) return res.status(401).json({ message: "No token provided" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const groupProduct = await ProductGroup.findById(groupId);
    if (!groupProduct) return res.status(404).json({ message: "Group product not found" });

    if (!user.cart) user.cart = { products: [], groupProducts: [] };

    const existingGroup = user.cart.groupProducts.find((g) => g.groupId.toString() === groupId);
    if (existingGroup) {
      existingGroup.quantity += parseInt(quantity, 10);
    } else {
      user.cart.groupProducts.push({ groupId, quantity: parseInt(quantity, 10) });
    }

    await user.save();
    res.status(200).json({ message: "Group product added to cart", cart: user.cart });
  } catch (err) {
    console.error("Error adding group product to cart:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Delete a product from the cart
router.delete("/cart/product/:productId", async (req, res) => {
  const { productId } = req.params;
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) return res.status(401).json({ message: "No token provided" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Remove the product from the cart
    user.cart.products = user.cart.products.filter((p) => p.productId.toString() !== productId);
    await user.save();

    res.status(200).json({ message: "Product removed from cart", cart: user.cart });
  } catch (err) {
    console.error("Error removing product from cart:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Delete a group product from the cart
router.delete("/cart/groupproduct/:groupId", async (req, res) => {
  const { groupId } = req.params;
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) return res.status(401).json({ message: "No token provided" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Remove the group product from the cart
    user.cart.groupProducts = user.cart.groupProducts.filter((g) => g.groupId.toString() !== groupId);
    await user.save();

    res.status(200).json({ message: "Group product removed from cart", cart: user.cart });
  } catch (err) {
    console.error("Error removing group product from cart:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.put("/updateCart/:iduser", async (req, res) => {
  try {
    const iduser = req.params.iduser; // Correctly access the route parameter
    const user = await User.findById(iduser);
    if (!user) return res.status(404).json({ message: "User not found" });

    const { type, id, quantity } = req.body;

    if (type === "products") {
      const product = user.cart.products.find((p) => p.productId.toString() === id);
      if (product) product.quantity = quantity;
    } else if (type === "groupProducts") {
      const group = user.cart.groupProducts.find((g) => g.groupId.toString() === id);
      if (group) group.quantity = quantity;
    }

    await user.save();
    res.json({ message: "Cart updated successfully" });
  } catch (err) {
    console.error("Error updating cart:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

  router.put("/:id/dishargeCart", async (req, res) => {
    try {
        const id = req.params.id;
        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        user.cart.products = [];
        user.cart.groupProducts = [];
        await user.save();

        return res.json({ message: "Cart cleared successfully" });
    } catch (error) {
        console.error("Error updating cart:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});



  
module.exports = router;