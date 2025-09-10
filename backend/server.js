require("dotenv").config(); // ✅ لقراءة ملف .env
const cors = require("cors");
const path = require("path");
const express = require("express");
const bodyParser = require('body-parser');
const mongoose = require("mongoose");
const app = express();
app.use(cors());
// Middleware to parse JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

require("./config/connect"); // Ensure this file connects to MongoDB
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
app.use("/api/groupproducts", routergroupproducts)
app.use("/api/details", routerdetails);
// zWhsGl7YvxbyyruV  achrafkhmirii
const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

app.get("/", (req, res) => {
  res.send("Server is running...");
});




import React, { useEffect, useState } from "react";
import axios from "axios";
import { QRCodeCanvas } from "qrcode.react";
import "../style/Table.css";
import Admin from "./admin";

function TableAdminPage() {
  const [tables, setTables] = useState([]);
  const [users, setUsers] = useState([]);
  const [token] = useState(localStorage.getItem("token"));
  const [formdata, setFormdata] = useState({
    number: "",
    capacity: "",
    status: "free",
    serverId: ""
  });
  const [editTable, setEditTable] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormdata({ ...formdata, [name]: value });
  };

  const fetchTables = async () => {
    try {
      const response = await axios.get("http://localhost:3000/api/tables", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTables(response.data);
    } catch (error) {
      console.error("Error fetching tables:", error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await axios.get("http://localhost:3000/api/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(response.data.filter((u) => u.role === "server"));
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const addTable = async () => {
    try {
      await axios.post("http://localhost:3000/api/tables", formdata, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchTables();
      setFormdata({ number: "", capacity: "", status: "free", serverId: "" });
      setEditTable(null);
    } catch (error) {
      console.error("Error adding table:", error);
    }
  };

  const handleDeleteTable = async (tableId) => {
    try {
      await axios.delete(`http://localhost:3000/api/tables/${tableId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchTables();
    } catch (error) {
      console.error("Error deleting table:", error);
    }
  };

  const handleEditTable = (table) => {
    setEditTable(table);
    setFormdata({
      number: table.number,
      capacity: table.capacity,
      status: table.status,
      serverId: table.serverId || ""
    });
  };

  const updateTable = async (tableId) => {
    try {
      await axios.put(`http://localhost:3000/api/tables/${tableId}`, formdata, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchTables();
      setEditTable(null);
      setFormdata({ number: "", capacity: "", status: "free", serverId: "" });
    } catch (error) {
      console.error("Error updating table:", error);
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (editTable) {
      await updateTable(editTable._id);
    } else {
      await addTable();
    }
  };

  useEffect(() => {
    fetchTables();
    fetchUsers();
  }, []);

  return (
    <div className="table-management">
      <Admin />
      <h1>Table Management</h1>

      {/* ✅ Form */}
      <form onSubmit={handleFormSubmit} className="table-form">
        {/* ... باقي الفورم مثل قبل */}
      </form>

      {/* ✅ Table List */}
      <div className="table-list">
        <h2>Table List</h2>
        {tables.length > 0 ? (
          <ul>
            {tables.map((table) => (
              <li key={table._id} className="table-item">
                <p>
                  Table #{table.number} - Capacity: {table.capacity} - Status:{" "}
                  <span>{table.status}</span>
                </p>
                <p>
                  Assigned to:{" "}
                  {table.serverId
  ? `${table.serverId.firstName} ${table.serverId.lastName}`
  : "No server"}

                </p>

                {/* ✅ QR Code */}
                <div className="qr-code">
                  <QRCodeCanvas value={`http://localhost:5173/store?tableId=${table._id}`} size={128} />
                  <p>Scan to order</p>
                </div>

                <div className="table-actions">
                  <button
                    className="edit-btn"
                    onClick={() => handleEditTable(table)}
                  >
                    Edit
                  </button>
                  <button
                    className="delete-btn"
                    onClick={() => handleDeleteTable(table._id)}
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p>No tables available</p>
        )}
      </div>
    </div>
  );
}

export default TableAdminPage;
