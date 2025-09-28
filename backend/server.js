require("dotenv").config();
const cors = require("cors");
const path = require("path");
const express = require("express");
const mongoose = require("mongoose");
const http = require("http");              // 🟢 نحتاج http
const { Server } = require("socket.io");  // 🟢 نحتاج socket.io

const app = express();
const server = http.createServer(app); // بدل app.listen
const io = new Server(server, {
  cors: {
    origin: "*", // عدلها لو عندك دومين معين
    methods: ["GET", "POST", "PUT", "DELETE"],
  },
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ✅ مرر io إلى كل request
app.use((req, res, next) => {
  req.io = io;
  next();
});

require("./config/connect");

// استدعاء الروترات
const routercategory = require("./routes/Category");
const routeruser = require("./routes/User");
const routerproducts = require("./routes/Product");
const routerorders = require("./routes/Order");
const routergroupproducts = require("./routes/Groupproducts");
const routerdetails = require("./routes/DetailsClient");
const tableRoutes = require("./routes/Table");

app.use("/api/tables", tableRoutes);
app.use("/api/orders", routerorders);
app.use("/api/categorys", routercategory);
app.use("/api/users", routeruser);
app.use("/api/products", routerproducts);
app.use("/api/groupproducts", routergroupproducts);
app.use("/api/details", routerdetails);

const PORT = process.env.PORT || 4000;

server.listen(PORT, () => {   // 🟢 استعمل server.listen مش app.listen
  console.log(`Server is running on port ${PORT}`);
});

// Default route
app.get("/", (req, res) => {
  res.send("Server is running...");
});

// 🟢 Socket.IO events
io.on("connection", (socket) => {
  console.log("⚡ A client connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("❌ Client disconnected:", socket.id);
  });
});
