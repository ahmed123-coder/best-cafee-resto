const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const router = express.Router();
const Order = require("../models/Order");
const Product = require("../models/Product");
const DetailsClient = require("../models/DetailsClient");
const ProductGroup = require("../models/ProductGroup");
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET;

// ----------- STATIC ROUTES FIRST -----------

// Create a new order in store
router.post("/in-store", async (req, res) => {
  try {
    const { customer, products, productGroups, paymentMethod, status, tableId } = req.body;
    let totalPrice = 0;

    // التحقق من المنتجات وتحديث الكميات
    for (const item of products) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(404).json({ error: `Product with ID ${item.product} not found` });
      }
      // إذا الكمية null اعتبرها غير محدودة ولا تنقصها ولا تتحقق منها
      if (product.quantity !== null && product.quantity < item.quantity) {
        return res.status(400).json({ error: `Insufficient quantity for product ${product.name}` });
      }
      totalPrice += product.price * item.quantity;
      if (product.quantity !== null) {
        product.quantity -= item.quantity;
        await product.save();
      }
    }

    // التحقق من مجموعات المنتجات وتحديث الكميات
    for (const groupItem of productGroups) {
      const group = await ProductGroup.findById(groupItem.group).populate("products.product");
      if (!group) {
        return res.status(404).json({ error: `Product group with ID ${groupItem.group} not found` });
      }
      for (const item of group.products) {
        // إذا الكمية null اعتبرها غير محدودة ولا تنقصها ولا تتحقق منها
        if (item.product.quantity !== null && item.product.quantity < item.quantity * groupItem.quantity) {
          return res.status(400).json({ error: `Insufficient quantity for product ${item.product.name} in group ${group.name}` });
        }
        if (item.product.quantity !== null) {
          item.product.quantity -= item.quantity * groupItem.quantity;
          await item.product.save();
        }
      }
      totalPrice += group.price * groupItem.quantity;
    }

    const lastOrder = await Order.findOne({ isInStore: true }).sort({ queueNumber: -1 });
    let queueNumber = 1;
    if (lastOrder && typeof lastOrder.queueNumber === "number" && !isNaN(lastOrder.queueNumber)) {
      queueNumber = lastOrder.queueNumber + 1;
    }

    const order = new Order({
      customer,
      products,
      productGroups,
      totalPrice,
      status: status || "pending",
      paymentMethod: paymentMethod || "cash",
      isInStore: true,
      queueNumber,
      createdAt: new Date(),
      tableId: tableId,
    });

    await order.save();

    // Populate details for response
    const populatedOrder = await Order.findById(order._id)
      .populate("products.product", "name price image")
      .populate("productGroups.group", "name price image");

    res.status(201).json(populatedOrder);
  } catch (error) {
    console.error("Error creating order:", error.message || error);
    res.status(500).json({ error: error.message || "Error creating order" });
  }
});


// GET order in store
router.get('/in-store', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (user.role !== "admin" && user.role !== "chef") {
      return res.status(403).json({ message: "Not authorized to view all orders" });
    }

    // Date filter support
    let { start, end } = req.query;
    let filter = { isInStore: true };
    if (start && end) {
      filter.createdAt = {
        $gte: new Date(start),
        $lte: new Date(end)
      };
    }

    const orders = await Order.find(filter)
      .populate("customer", "firstName lastName email")
      .populate("products.product", "name price image")
      .populate("productGroups.group", "name price image")
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching not in-store orders' });
  }
});

// GET order in store by server
router.get('/in-store/server/:id', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id);
    if(!user){
      return res.status(404).json({ message: "User not found" });
    }
    else if(user.role === "server" || user.role === "admin" || user.role === "chef") {
    // Date filter support
    let { start, end } = req.query;
    let filter = { isInStore: true, customer: req.params.id };
    if (start && end) {
      filter.createdAt = {
        $gte: new Date(start),
        $lte: new Date(end)
      };
    }

    const orders = await Order.find(filter)
      .populate("customer", "firstName lastName email")
      .populate("products.product", "name price image")
      .populate("productGroups.group", "name price image")
      .sort({ createdAt: -1 });
    res.json(orders);
    }
    else{
      return res.status(403).json({ message: "Unauthorized" });
    }
  } catch (err) {
    res.status(500).json({ message: 'Error fetching not in-store orders' });
  }
});

// ----------- DYNAMIC ROUTES AFTER STATIC ROUTES -----------


// Update status to pending when the order is in store
router.put("/:id/pending/in-store", async (req, res) => {
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

      const order = await Order.findById(req.params.id);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      if (!order.isInStore) {
        return res.status(400).json({ error: "Order is not in store" });
      }
      // to pending when you admin or chef or order.tableId.serverId === user._id
      if (user.role === "admin" || user.role === "chef" || String(order.tableId?.serverId) === String(user._id)) {
        order.status = "pending";
        await order.save();
        res.status(200).json(order);
      } else {
        return res.status(403).json({ error: "You are not authorized to update this order" });
      }
  } catch (error) {
    res.status(500).json({ error: "Error updating delivery status" });
  }
});


router.put("/:id/completed/in-store", async (req, res) => {
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

      const order = await Order.findById(req.params.id);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      if (!order.isInStore) {
        return res.status(400).json({ error: "Order is not in store" });
      }
      // to pending when you admin or chef or order.tableId.serverId === user._id
      if (user.role === "admin" || user.role === "chef") {
        order.status = "completed";
        await order.save();
        res.status(200).json(order);
      } else {
        return res.status(403).json({ error: "You are not authorized to update this order" });
      }
  } catch (error) {
    res.status(500).json({ error: "Error updating delivery status" });
  }
});

// Update delivery status to delivered when the order in store
router.put("/:id/delivered/in-store", async (req, res) => {
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
      const order = await Order.findById(req.params.id);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      if (!order.isInStore) {
        return res.status(400).json({ error: "Order is not in store" });
      }
      if (user.role === "admin" || user.role === "chef" || String(order.tableId?.serverId) === String(user._id)) {
        order.status = "delivered";
      await order.save();
      res.status(200).json(order);
    }
  }
} catch (error) {
    res.status(500).json({ error: "Error updating delivery status" });
  }
});



// Update order when the order is in store
router.put("/:id/in-store", async (req, res) => {
  try {
    const token  = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "No token provided" });

    const decode = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decode.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const { customer, products, productGroups, paymentMethod, status, tableId } = req.body;
    const order = await Order.findById(req.params.id).populate("tableId");

    if (!order) return res.status(404).json({ error: "Order not found" });
    if (!order.isInStore) return res.status(400).json({ message: "Cannot update not in-store orders" });

    // ✅ تحقق من الصلاحيات
    if (
      user.role === "admin" ||
      user.role === "chef" ||
      (user.role === "server" &&
        (order.status === "pending" || order.status === "confirmed")) ||
      (user.role === "customer" &&
        String(order.customer) === String(user._id) &&
        (order.status === "pending" || order.status === "confirmed")) ||
      (String(order.tableId?.serverId) === String(user._id))
    ) {
      let totalPrice = 0;

      // 🔄 استعادة الكميات السابقة (فقط للمنتجات ذات quantity != null)
      for (const item of order.products) {
        const product = await Product.findById(item.product);
        if (product && product.quantity !== null) {
          product.quantity += item.quantity;
          await product.save();
        }
      }

      for (const groupItem of order.productGroups) {
        const group = await ProductGroup.findById(groupItem.group).populate("products.product");
        if (group) {
          for (const item of group.products) {
            if (item.product.quantity !== null) {
              item.product.quantity += item.quantity * groupItem.quantity;
              await item.product.save();
            }
          }
        }
      }

      // ✅ التحقق من المنتجات الجديدة وتحديث المخزون
      for (const item of products) {
        const product = await Product.findById(item.product);
        if (!product) return res.status(404).json({ error: `Product with ID ${item.product} not found` });

        if (product.quantity !== null) {
          if (product.quantity < item.quantity) {
            return res.status(400).json({ error: `Insufficient quantity for product ${product.name}` });
          }
          product.quantity -= item.quantity;
          await product.save();
        }

        totalPrice += product.price * item.quantity;
      }

      // ✅ التحقق من مجموعات المنتجات الجديدة
      for (const groupItem of productGroups) {
        const group = await ProductGroup.findById(groupItem.group).populate("products.product");
        if (!group) return res.status(404).json({ error: `Product group with ID ${groupItem.group} not found` });

        for (const item of group.products) {
          if (item.product.quantity !== null) {
            if (item.product.quantity < item.quantity * groupItem.quantity) {
              return res.status(400).json({
                error: `Insufficient quantity for product ${item.product.name} in group ${group.name}`,
              });
            }
            item.product.quantity -= item.quantity * groupItem.quantity;
            await item.product.save();
          }
        }

        totalPrice += group.price * groupItem.quantity;
      }

      // 📝 تحديث الطلب
      order.customer = customer || order.customer;
      order.products = products || order.products;
      order.productGroups = productGroups || order.productGroups;
      order.totalPrice = totalPrice;
      order.paymentMethod = paymentMethod || order.paymentMethod;
      order.status = status || order.status;
      order.tableId = tableId || order.tableId;

      await order.save();
      return res.status(200).json(order);
    } else {
      return res.status(403).json({ message: "Not authorized" });
    }
  } catch (err) {
    console.error("Error updating order:", err);
    res.status(500).json({ error: err.message });
  }
});


// Delete order when the order is in store
router.delete("/:id/in-store", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const decode = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decode.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const order = await Order.findById(req.params.id)
      .populate("tableId")
      .populate("customer");
    if (!order) return res.status(404).json({ error: "Order not found" });

    if (!order.isInStore) {
      return res.status(400).json({ error: "Order is not in store" });
    }

    // ✅ تحقق من صلاحيات الحذف
    let canDelete = false;

    // Admin أو Chef
    if (user.role === "admin" || user.role === "chef") {
      canDelete = true;
    }

    // Server المسؤول عن الطاولة
    else if (
      user.role === "server" &&
      order.tableId &&
      String(order.tableId.serverId) === String(user._id) &&
      (order.status === "pending" || order.status === "confirmed")
    ) {
      canDelete = true;
    }

    // Customer وصاحب الطلب
    else if (
      user.role === "customer" &&
      String(order.customer) === String(user._id) &&
      (order.status === "pending" || order.status === "confirmed")
    ) {
      canDelete = true;
    }

    if (!canDelete) {
      return res.status(403).json({ error: "Not authorized to delete this order" });
    }

    // 🔄 استرجاع الكميات (مع مراعاة المنتجات غير المحدودة)
    for (const item of order.products) {
      const product = await Product.findById(item.product);
      if (product && product.quantity !== null) {
        product.quantity += item.quantity;
        await product.save();
      }
    }

    for (const groupItem of order.productGroups) {
      const group = await ProductGroup.findById(groupItem.group).populate(
        "products.product"
      );
      if (group) {
        for (const item of group.products) {
          if (item.product.quantity !== null) {
            item.product.quantity += item.quantity * groupItem.quantity;
            await item.product.save();
          }
        }
      }
    }

    await Order.findByIdAndDelete(req.params.id);

    res.status(200).json({ message: "Order deleted successfully" });
  } catch (err) {
    console.error("Error deleting order:", err);
    res.status(500).json({ error: err.message });
  }
});


// GET /api/orders/:id => جلب الأوردر والتفاصيل المرتبطة به
router.get("/:id/detailclient", async (req, res) => {
  try {
    const orderId = req.params.id;

    // 1. جلب الأوردر
    const order = await Order.findById(orderId);
    if (order.isInStore) {
      return res.status(400).json({ message: "الطلب داخلي ولا يحتوي على تفاصيل عميل" });
    }

    if (!order) return res.status(404).json({ message: "الطلب غير موجود" });
    
    // 2. جلب بيانات DetailsClient
    const detailsClient = await DetailsClient.findOne({ idorder: orderId });

    res.json(detailsClient);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "حدث خطأ أثناء جلب البيانات" });
  }
});

router.put("/:id/canceled", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const decode = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decode.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }
    if (order.isInStore) {
      return res.status(400).json({ error: "Order is not in store" });
    }
    // if user id not equal id customer in order
    if (String(order.customer) !== String(user._id) && user.role !== "admin") {
      return res.status(403).json({ error: "You are not authorized to cancel this order" });
    }
    order.status = "canceled";
    await order.save();
    res.status(200).json(order);
  } catch (error) {
    res.status(500).json({ error: "Error updating delivery status" });
  }
});


router.put("/:id/confirmed", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const decode = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decode.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }
    if (order.isInStore) {
      return res.status(400).json({ error: "Order is not in store" });
    }
    // if user id not equal id customer in order
    if (String(order.customer) !== String(user._id) && user.role !== "admin") {
      return res.status(403).json({ error: "You are not authorized to cancel this order" });
    }
    // to confirmed when admin or chef or server 
    if (user.role === "admin" || user.role === "chef" || String(order.tableId?.serverId) === String(user._id)) {
      order.status = "confirmed";
      await order.save();
      res.status(200).json(order);
    } else {
      return res.status(403).json({ error: "You are not authorized to update this order" });
    }
  } catch (error) {
    res.status(500).json({ error: "Error updating delivery status" });
  }
});

router.put("/:id/started", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const decode = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decode.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }
    if (order.isInStore) {
      return res.status(400).json({ error: "Order is not in store" });
    }
    // if user id not equal id customer in order
    if (String(order.customer) !== String(user._id) && user.role !== "admin") {
      return res.status(403).json({ error: "You are not authorized to cancel this order" });
    }
    // to confirmed when admin or chef
    if (user.role === "admin" || user.role === "chef") {
      order.status = "started";
      await order.save();
      res.status(200).json(order);
    } else {
      return res.status(403).json({ error: "You are not authorized to update this order" });
    }
  } catch (error) {
    res.status(500).json({ error: "Error updating delivery status" });
  }
});

router.put("/:id/rejected", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const decode = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decode.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }
    if (order.isInStore) {
      return res.status(400).json({ error: "Order is not in store" });
    }
    // if not admin or not chef
    if (user.role !== "admin" && user.role !== "chef") {
      return res.status(403).json({ error: "You are not authorized to reject this order" });
    }
    order.status = "rejected";
    await order.save();
    res.status(200).json(order);
  } catch (error) {
    res.status(500).json({ error: "Error updating delivery status" });
  }
});

router.put("/:id/paid", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }
    if (order.isInStore) {
      return res.status(400).json({ error: "Order is not in store" });
    }
    order.status = "paid";
    await order.save();
    res.status(200).json(order);
  } catch (error) {
    res.status(500).json({ error: "Error updating delivery status" });
  }
});

// Get orders for a specific user
router.get("/user/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    const orders = await Order.find({ customer: userId })
      .populate({ path: "customer", select: "firstName lastName email", strictPopulate: false })
      .populate("products.product", "name price image")
      .populate("productGroups.group", "name price image")
      .sort({ createdAt: -1 });

    res.status(200).json(orders);
  } catch (err) {
    console.error("Error fetching user orders:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get orders for a specific user in store
router.get("/in-store/user/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    const orders = await Order.find({ customer: userId, isInStore: true })
      .populate({ path: "customer", select: "firstName lastName email", strictPopulate: false })
      .populate("products.product", "name price image")
      .populate("productGroups.group", "name price image")
      .sort({ createdAt: -1 });

    res.status(200).json(orders);
  } catch (err) {
    console.error("Error fetching user orders:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// GET /api/orders/stats/days/in-store?start=YYYY-MM-DD&end=YYYY-MM-DD
router.get('/stats/days/in-store', async (req, res) => {
  let { start, end } = req.query;
  let startDate = start ? new Date(start) : new Date("2000-01-01");
  let endDate = end ? new Date(end) : new Date();
  endDate.setHours(23,59,59,999);

  const orders = await Order.aggregate([
    { $match: { createdAt: { $gte: startDate, $lte: endDate }, isInStore: true } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);
  res.json(orders);
});
// GET /api/orders/stats/months/in-store?start=YYYY-MM&end=YYYY-MM
router.get('/stats/months/in-store', async (req, res) => {
  let { start, end } = req.query;
  let startDate = start ? new Date(start + "-01") : new Date("2000-01-01");
  let endDate = end ? new Date(end + "-31") : new Date();
  endDate.setHours(23,59,59,999);

  const orders = await Order.aggregate([
    { $match: { createdAt: { $gte: startDate, $lte: endDate }, isInStore: true } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);
  res.json(orders);
});
// GET /api/orders/stats/top-products-all/in-store?mode=days|months&start=YYYY-MM-DD|YYYY-MM&end=YYYY-MM-DD|YYYY-MM
router.get('/stats/top-products-all/in-store', async (req, res) => {
  try {
    const { mode = "days", start, end } = req.query;
    let startDate, endDate, groupFormat;
    if (mode === "months") {
      startDate = start ? new Date(start + "-01") : new Date("2000-01-01");
      endDate = end ? new Date(end + "-31") : new Date();
      groupFormat = { $dateToString: { format: "%Y-%m", date: "$createdAt" } };
    } else {
      startDate = start ? new Date(start) : new Date("2000-01-01");
      endDate = end ? new Date(end) : new Date();
      groupFormat = { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } };
    }
    endDate.setHours(23,59,59,999);

    // المنتجات المفردة
    const singleProducts = await Order.aggregate([
      { $match: { createdAt: { $gte: startDate, $lte: endDate }, isInStore: true } },
      { $unwind: "$products" },
      {
        $group: {
          _id: {
            product: "$products.product",
            period: groupFormat
          },
          totalSold: { $sum: "$products.quantity" }
        }
      }
    ]);

    // مجموعات المنتجات
    const groupProducts = await Order.aggregate([
      { $match: { createdAt: { $gte: startDate, $lte: endDate }, isInStore: true } },
      { $unwind: "$productGroups" },
      {
        $lookup: {
          from: "productgroups",
          localField: "productGroups.group",
          foreignField: "_id",
          as: "groupInfo"
        }
      },
      { $unwind: "$groupInfo" },
      { $unwind: "$groupInfo.products" },
      {
        $group: {
          _id: {
            product: "$groupInfo.products.product",
            period: groupFormat
          },
          totalSold: {
            $sum: {
              $multiply: [
                "$groupInfo.products.quantity",
                "$productGroups.quantity"
              ]
            }
          }
        }
      }
    ]);

    // دمج النتائج
    const totals = {};
    singleProducts.forEach(p => {
      const key = `${p._id.product}_${p._id.period}`;
      totals[key] = (totals[key] || 0) + p.totalSold;
    });
    groupProducts.forEach(p => {
      const key = `${p._id.product}_${p._id.period}`;
      totals[key] = (totals[key] || 0) + p.totalSold;
    });

    // جلب بيانات المنتجات
    const Product = require("../models/Product");
    const productIds = [...new Set(Object.keys(totals).map(k => k.split("_")[0]))];
    const products = await Product.find({ _id: { $in: productIds } });

    // تجهيز الرد النهائي
    const result = [];
    Object.entries(totals).forEach(([key, totalSold]) => {
      const [prodId, period] = key.split("_");
      const prod = products.find(p => p._id.toString() === prodId);
      if (prod) {
        result.push({
          productId: prod._id,
          name: prod.name,
          period,
          totalSold,
          price: prod.price,
          image: prod.image
        });
      }
    });
    result.sort((a, b) => a.period.localeCompare(b.period) || b.totalSold - a.totalSold);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }  
});
// GET /api/orders/stats/product/:productId/days/in-store?start=YYYY-MM-DD&end=YYYY-MM-DD
router.get('/stats/product/:productId/days/in-store', async (req, res) => {
  const { productId } = req.params;
  let { start, end } = req.query;
  let startDate = start ? new Date(start) : new Date("2000-01-01");
  let endDate = end ? new Date(end) : new Date();
  endDate.setHours(23,59,59,999);

  // المنتجات المفردة
  const single = await Order.aggregate([
    { $match: { createdAt: { $gte: startDate, $lte: endDate }, isInStore: true } },
    { $unwind: "$products" },
    { $match: { "products.product": new mongoose.Types.ObjectId(productId) } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        count: { $sum: "$products.quantity" }
      }
    }
  ]);

  // مجموعات المنتجات
  const group = await Order.aggregate([
    { $match: { createdAt: { $gte: startDate, $lte: endDate }, isInStore: true } },
    { $unwind: "$productGroups" },
    {
      $lookup: {
        from: "productgroups",
        localField: "productGroups.group",
        foreignField: "_id",
        as: "groupInfo"
      }
    },
    { $unwind: "$groupInfo" },
    { $unwind: "$groupInfo.products" },
    { $match: { "groupInfo.products.product": new mongoose.Types.ObjectId(productId) } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        count: {
          $sum: { $multiply: ["$groupInfo.products.quantity", "$productGroups.quantity"] }
        }
      }
    }
  ]);

  // دمج النتائج
  const totals = {};
  single.forEach(d => { totals[d._id] = (totals[d._id] || 0) + d.count; });
  group.forEach(d => { totals[d._id] = (totals[d._id] || 0) + d.count; });

  const result = Object.keys(totals)
    .filter(date => date >= start && date <= end)
    .sort()
    .map(date => ({
      date,
      count: totals[date]
    }));

  res.json(result);
});

module.exports = router;