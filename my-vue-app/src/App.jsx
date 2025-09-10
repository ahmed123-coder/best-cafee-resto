import { useState } from "react";
import { Link, Routes, Route } from "react-router-dom";
import "./App.css";
import User from "./admin/pages/User";
import Category from "./admin/pages/Category";
import Login from "./pages/Login";
import ProductsAdmin from "./admin/pages/ProductsAdmin";
import AdminOrder from "./admin/pages/AdminGroupproducts";
import Register from "./pages/register";
import Admin from "./admin/pages/admin";
import Logout from "./pages/logout";
import Store from "./pages/store";
import Dashboard from "./admin/pages/Dashboard";
import OrdersAdminPage from "./admin/pages/ordere";
import TableAdminPage from "./admin/pages/TableAdmin";

function App() {
  const [count, setCount] = useState(0);
    const [darkMode, setDarkMode] = useState(() => {
      return localStorage.getItem("darkMode") === "enabled";
    });

  return (
    <>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Login />} />
        <Route path="/logout" element={<Logout />} />
        <Route path="/register" element={<Register />} />
        <Route path="/admin" element={<Admin darkMode={darkMode}/>} />
        <Route path="/store" element={<Store />} />
        {/* Nested Admin Routes */}
        <Route path="/admin/users" element={<User />} />
        <Route path="/admin/categories" element={<Category />} />
        <Route path="/admin/productsAdmin" element={<ProductsAdmin />} />
        <Route path="/admin/group-product" element={<AdminOrder />} />
        <Route path="/admin/statdashboard" element={<Dashboard/>} />
        <Route path="/admin/ordersAdminPage" element={<OrdersAdminPage/>} />
        <Route path="/admin/tableAdmin" element={<TableAdminPage/>} />
        {/* Fallback route */}
      </Routes>
    </>
  );
}

export default App;