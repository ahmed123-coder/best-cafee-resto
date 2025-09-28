import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";  // 👈

function OrderStore({ onClose }) {
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const navigate = useNavigate();
  const Socket = io("http://localhost:3000");

  const handleDeleteOrder = async (orderId) => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        await axios.put(`http://localhost:3000/api/orders/${orderId}/canceled`);
        setOrders(orders.filter((order) => order._id !== orderId));
      } catch (error) {
        console.error("Error deleting order:", error);
      }
    } else {
      alert("يجب تسجيل الدخول لحذف الطلب");
    }
  };

  const handleEditOrder = (orderId) => {
    alert("تعديل الطلب غير مفعل في هذا النموذج. يمكنك تنفيذ التنقل أو فتح مودال.");
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      const fetchUserAndOrders = async () => {
        try {
          const userRes = await axios.get("http://localhost:3000/api/users/me", {
            headers: { Authorization: `Bearer ${token}` },
          });
          const userData = userRes.data;
          setUser(userData);

          const ordersRes = await axios.get(`http://localhost:3000/api/orders/in-store/user/${userData._id}`);
          setOrders(ordersRes.data);
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      };

      fetchUserAndOrders();
      // 🟢 إعداد اتصال Socket.IO
      const Socket = io("http://localhost:3000");
      Socket.on("orderCreated", (newOrder) => {
        setOrders((prev) => [newOrder, ...prev]);
      });
      Socket.on("orderUpdated", (updatedOrder) => {
        setOrders((prev) =>
          prev.map((o) => (o._id === updatedOrder._id ? updatedOrder : o))
        );
      });
      Socket.on("orderDeleted", (id) => {
        setOrders((prev) => prev.filter((o) => o._id !== id));
      });
  // all soket io of users
  Socket.on("newUser", (newUser) => {
    setUsers((prev) => [newUser, ...prev]);
  });
  Socket.on("updateUser", (updatedUser) => {
    setUsers((prev) =>
      prev.map((u) => (u._id === updatedUser._id ? updatedUser : u))
    );
  });
  Socket.on("deleteUser", (id) => {
    setUsers((prev) => prev.filter((u) => u._id !== id));
  });

    } else {
      alert("عند تسجيل حساب ستتمتع بعديد المزايا");
      navigate("/");
    }
    return () => {
      Socket.off("orderCreated");
      Socket.off("orderUpdated");
      Socket.off("orderDeleted");
      Socket.off("newUser");
      Socket.off("updateUser");
      Socket.off("deleteUser");
    };
  }, [navigate]);

  return (
    <div className="container py-5">
      <h2 className="mb-4 text-center text-primary">تفاصيل الطلب (قيد التنفيذ)</h2>
      <button className="btn btn-secondary mb-4" onClick={onClose}>x</button>
      {orders.filter(order => order.status === "pending").map((order) => (
        <div key={order._id} className="card mb-4 shadow-sm">
          <div className="card-body">
            <h5 className="card-title">الطلب رقم: {order._id}</h5>
            <p className="card-text">التاريخ:{new Date(order.createdAt).toLocaleDateString()}</p>
            <p>طريقة الدفع: <strong>{order.paymentMethod}</strong></p>
            <p>الحالة: <span className="badge bg-warning text-dark">{order.status}</span></p>

            <h6>المنتجات:</h6>
            <ul className="list-group mb-3">
              {order.products.map((product) => (
                <li key={product.product._id} className="list-group-item d-flex justify-content-between align-items-center">
                  <div>
                    <img src={product.product.image} alt={product.product.name} width="60" height="60" className="me-2" />
                    {product.product.name} - الكمية: {product.quantity}
                  </div>
                  <span>{product.product.price} دينار</span>
                </li>
              ))}
            </ul>

            <h6>المجموعات:</h6>
            <ul className="list-group mb-3">
              {order.productGroups.map((group) => (
                <li key={group.group._id} className="list-group-item d-flex justify-content-between align-items-center">
                  <div>
                    <img src={group.group.image} alt={group.group.name} width="60" height="60" className="me-2" />
                    {group.group.name} - الكمية: {group.quantity}
                  </div>
                  <span>{group.group.price} دينار</span>
                </li>
              ))}
            </ul>

            <h5 className="text-end">المجموع الكلي: {order.totalPrice} دينار</h5>

            {user && user.role === "admin" && (
              <div className="mt-3 d-flex gap-2">
                <button onClick={() => handleDeleteOrder(order._id)} className="btn btn-danger">حذف الطلب</button>
              </div>
            )}
          </div>
        </div>
      ))}

      <h2 className="mb-4 mt-5 text-center text-success">الطلبات التي تم توصيلها</h2>
      {orders.filter(order => order.status === "delivered").map((order) => (
        <div key={order._id} className="card mb-4 shadow-sm">
          <div className="card-body">
            <h5 className="card-title">الطلب رقم: {order._id}</h5>
            <p className="card-text">التاريخ: {new Date(order.createdAt).toLocaleDateString()}</p>
            <p>طريقة الدفع: <strong>{order.paymentMethod}</strong></p>
            <p>الحالة: <span className="badge bg-success">{order.status}</span></p>

            <h6>المنتجات:</h6>
            <ul className="list-group mb-3">
              {order.products.map((product) => (
                <li key={product.product._id} className="list-group-item d-flex justify-content-between align-items-center">
                  <div>
                    <img src={`http://localhost:3000/${product.product.image}`} alt={product.product.name} width="40" height="40" className="me-2" />
                    {product.product.name} - الكمية: {product.quantity}
                  </div>
                  <span>{product.product.price} دينار</span>
                </li>
              ))}
            </ul>

            <h6>المجموعات:</h6>
            <ul className="list-group mb-3">
              {order.productGroups.map((group) => (
                <li key={group.group._id} className="list-group-item d-flex justify-content-between align-items-center">
                  <div>
                    <img src={`http://localhost:3000/${group.group.image}`} alt={group.group.name} width="40" height="40" className="me-2" />
                    {group.group.name} - الكمية: {group.quantity}
                  </div>
                  <span>{group.group.price} دينار</span>
                </li>
              ))}
            </ul>

            <h5 className="text-end">المجموع الكلي: {order.totalPrice} دينار</h5>
          </div>
        </div>
      ))}
    </div>
  );
}

export default OrderStore;