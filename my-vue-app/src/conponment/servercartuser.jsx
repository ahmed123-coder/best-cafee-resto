import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../styles/CartSidebar.css";
import axios from "axios";
import { useState, useEffect } from "react";

function ServerCartUserSidebarstore({
  cartProducts = [],
  cartGroups = [],
  onQuantityChange,
  onRemove,
  onClose,
  isOpen,
  darkMode,
  setProducts,
  setGroups,
  selectedTable,
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { productId, groupId, quantity } = location.state || {};
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      const fetchUser = async () => {
        try {
          const response = await axios.get("http://localhost:3000/api/users/me", {
            headers: { Authorization: `Bearer ${token}` },
          });
          setUser(response.data);
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      };
      fetchUser();
    }
  }, []);

  // توليد نص الفاتورة للطباعة
  function generateReceipt(order) {
    let receipt = `رقم الدور: ${order.queueNumber}\n`;
    receipt += `-----------------------------\n`;
    receipt += `المنتجات:\n`;
    if (order.products && order.products.length > 0) {
      order.products.forEach((item) => {
        receipt += `- ${item.product.name} x${item.quantity} = ${item.product.price * item.quantity} دج\n`;
      });
    }
    if (order.productGroups && order.productGroups.length > 0) {
      receipt += `مجموعات المنتجات:\n`;
      order.productGroups.forEach((item) => {
        receipt += `- ${item.group.name} x${item.quantity} = ${item.group.price * item.quantity} دج\n`;
      });
    }
    receipt += `-----------------------------\n`;
    receipt += `الإجمالي: ${order.totalPrice} دج\n`;
    receipt += `طريقة الدفع: ${order.paymentMethod}\n`;
    receipt += `-----------------------------\n`;
    receipt += `شكراً لتسوقكم معنا!\n`;
    return receipt;
  }
  function printOrder(order) {
  const receipt = generateReceipt(order).replace(/\n/g, "<br>");
  const printWindow = window.open("", "_blank", "width=300,height=600");
  printWindow.document.write(`
    <html>
      <head>
        <title>فاتورة الطلب</title>
        <style>
          body {
            font-family: 'Cairo', 'Tahoma', 'monospace', Arial, sans-serif;
            font-size: 15px;
            direction: rtl;
            text-align: right;
            margin: 0;
            padding: 0;
            background: #fff;
          }
          .receipt {
            width: 260px;
            margin: 0 auto;
            padding: 12px 0;
          }
          .receipt-title {
            font-size: 18px;
            font-weight: bold;
            text-align: center;
            margin-bottom: 8px;
            letter-spacing: 1px;
          }
          .receipt hr {
            border: none;
            border-top: 1.5px dashed #888;
            margin: 8px 0;
          }
          .receipt .total {
            font-size: 16px;
            font-weight: bold;
            margin-top: 8px;
            text-align: center;
          }
          .receipt .thanks {
            text-align: center;
            margin-top: 12px;
            font-size: 15px;
            letter-spacing: 1px;
          }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="receipt-title">فاتورة الطلب</div>
          <hr>
          ${receipt}
          <hr>
          <div class="thanks">نتمنى لكم يوماً سعيداً</div>
        </div>
        <script>
          window.onload = function() {
            window.print();
            setTimeout(() => window.close(), 500);
          }
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
}
  const handlePostCart = async () => {
    const token = localStorage.getItem("token");
    if (!selectedTable) {
      alert("⚠️ Please select a table first!");
      return;
    }
    try {
      let orderData = {
        customer: token && user?._id ? user._id : "Guest",
        products: [],
        productGroups: [],
        paymentMethod: "cash",
        status: "confirmed",
        tableId: selectedTable,
        isInStore: true
      };

      if (productId) {
        orderData.products.push({ product: productId, quantity });
      }

      if (groupId) {
        orderData.productGroups.push({ group: groupId, quantity });
      }

      if (!productId && !groupId) {
        orderData.products = cartProducts.map((p) => ({
          product: p.product,
          quantity: p.quantity,
        }));
        orderData.productGroups = cartGroups.map((g) => ({
          group: g.group,
          quantity: g.quantity,
        }));
      }
      // إرسال الطلب إلى الخادم
      const responseOrder = await axios.post(
        "http://localhost:3000/api/orders/in-store",
        orderData,
        {
          headers: { "Content-Type": "application/json" },
        }
      );
      console.log("Order created successfully:", responseOrder.data);
      localStorage.removeItem("guestCart");

      // طباعة الفاتورة مباشرة
      printOrder(responseOrder.data);
      // remove the cart from local storage
      localStorage.removeItem("guestCart");
      // remove setCartProducts and setCartGroups
      setProducts([]);
      setGroups([]);
      navigate("/store");
    } catch (err) {
      console.error("Error creating order:", err);
      alert("حدث خطأ أثناء إنشاء الطلب: " + (err.response?.data?.error || err.message));
    }
  };

  return (
    <div className={`cart-sidebar ${darkMode ? "dark-mode" : ""}  ${isOpen ? "open" : ""}`}>
      <button className="close-btn" onClick={onClose}>
        ×
      </button>
      <h2>🛒 سلة المشتريات</h2>

      {cartProducts.length === 0 && cartGroups.length === 0 ? (
        <p>السلة فارغة</p>
      ) : (
        <div className="cart-items">
          {cartProducts.map((item, index) => (
            <div key={index} className="cart-item">
              <div className="item-details">
                <h3>name: {item.name}</h3>
                <img src={item.image} alt={item.name} className="cart-item-image" />
                <p>السعر: {item.price} دولار</p>
                <div className="quantity-controls">
                  <button
                    onClick={() => onQuantityChange(item.product, "product", item.quantity - 1)}
                    disabled={item.quantity <= 1}
                  >
                    -
                  </button>
                  <span>{item.quantity}</span>
                  <button
                    onClick={() => onQuantityChange(item.product, "product", item.quantity + 1)}
                  >
                    +
                  </button>
                </div>
                <button className="remove-btn" onClick={() => onRemove(item.product, "product")}>
                  حذف
                </button>
              </div>
            </div>
          ))}

          {cartGroups.map((item, index) => (
            <div key={index} className="cart-item">
              <div className="item-details">
                <h3>name: {item.name}</h3>
                <img src={item.image} alt={item.name} className="cart-item-image" />
                <p>السعر: {item.price} دولار</p>
                <div className="quantity-controls">
                  <button
                    onClick={() => onQuantityChange(item.group, "groupproduct", item.quantity - 1)}
                    disabled={item.quantity <= 1}
                  >
                    -
                  </button>
                  <span>{item.quantity}</span>
                  <button
                    onClick={() => onQuantityChange(item.group, "groupproduct", item.quantity + 1)}
                  >
                    +
                  </button>
                </div>
                <button className="remove-btn" onClick={() => onRemove(item.group, "groupproduct")}>
                  حذف
                </button>
              </div>
            </div>
          ))}

          <div className="total-price">
            <h3>إجمالي السعر:</h3>
            <p>
              {cartProducts.reduce((total, item) => total + item.price * item.quantity, 0) +
                cartGroups.reduce((total, item) => total + item.price * item.quantity, 0)}{" "}
              دولار
            </p>
          </div>

          <div className="checkout-btn-container">
            <button className="checkout-btn" onClick={handlePostCart}>
              إتمام الشراء
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ServerCartUserSidebarstore;