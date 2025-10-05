import React from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/products.css";

function Products({ onAddToCart, products, darkMode, user, printOrder }) {
  const navigate = useNavigate();

  // تحديث handleBuyNow ليقوم بإنشاء الطلب مباشرة
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

      orderData.products.push({ product: productId, quantity: 1 });

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
    <div className={`projects ${darkMode ? "dark-mode" : ""}`}>
      <div className="container">
        <h2 className="text-center title-div">products</h2>
        <div className="products-flex-list">
          {products.filter((product) => product.isActive).map((product) => (
            <div key={product._id} className="product-flex-item">
              <div className="card h-100 text-center">
                {product.image && product.image.startsWith("https://") && (
                  <img
                    src={product.image}
                    alt={product.name}
                    className="card-img-top"
                    style={{ maxHeight: "200px", objectFit: "cover" }}
                  />
                )}
                <div className="card-body">
                  <h5 className="card-title">{product.name}</h5>
                  <p className="card-text">{product.description}</p>
                  <p className="card-text">
                    <strong>السعر:</strong> {product.price}
                  </p>
                  <button
                    onClick={() => onAddToCart(product._id, "product", product)}
                    className="button-add"
                  >
                    Add To Cart
                  </button>
                  <button
                    onClick={() => handleBuyNow(product._id)}
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

export default Products;
