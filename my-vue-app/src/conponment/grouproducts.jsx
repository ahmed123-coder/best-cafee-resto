import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function GroupProducts({onAddToCart, groups, darkMode, user, printOrder }) {
  const navigate = useNavigate();

    const handleBuyNow = async (productId) => {
    try {
      // إذا لم يكن المستخدم مسجلاً، يمكنك إعادة توجيهه أو منعه
      if (!user || !user._id) {
        alert("يجب تسجيل الدخول أولاً لإتمام الطلب.");
        return;
      }

      let orderData = {
        customer: user._id,
        products: [],
        productGroups: [],
        paymentMethod: "cash",
        status: "pending",
      };

      orderData.productGroups.push({ group: productId, quantity: 1 });

      // إرسال الطلب إلى الخادم
      const responseOrder = await axios.post(
        "https://cafe-resto-c1i3.onrender.com/api/orders/in-store",
        orderData,
        {
          headers: { "Content-Type": "application/json" },
        }
      );
      alert("Order created successfully!");
      console.log("Order created successfully:", responseOrder.data);
      printOrder(responseOrder.data);
      // يمكنك إعادة التوجيه أو تحديث الحالة هنا إذا أردت
      // navigate("/orders"); // مثال
    } catch (error) {
      alert("حدث خطأ أثناء إنشاء الطلب");
      console.error(error);
    }
  };

  return (
    <div  className={`projects ${darkMode ? "dark-mode" : ""}`}>
      <div className="container">
        <h2 className="text-center title-div">group products</h2>
                <div className="products-flex-list">
          {groups.filter(group => group.available).map((group) => (
            <div
              key={group._id}
              className="product-flex-item"
            >
              <div className="card h-100 text-center">
                {group.image && group.image.startsWith("https://") && (
                  <img
                    src={group.image}
                    alt={group.name}
                    className="card-img-top"
                    style={{ maxHeight: "200px", objectFit: "cover" }}
                  />
                )}
                <div className="card-body">
                  <h5 className="card-title">{group.name}</h5>
                  <p className="card-text">{group.description}</p>
                  <p className="card-text">
                    <strong>السعر:</strong> {group.price}
                  </p>
                  <button
                    onClick={() => onAddToCart(group._id, "groupproduct", group)}
                    className="button-add"
                  >
                    Add To Cart
                  </button>
                  <button
                    onClick={() => handleBuyNow(group._id)}
                    className="button-buy"
                  >
                    Buy
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default GroupProducts;
