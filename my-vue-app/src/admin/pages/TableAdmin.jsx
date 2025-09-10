import React, { useEffect, useState } from "react";
import axios from "axios";
import "../style/Table.css";
import Admin from "./admin";
import { QRCodeCanvas } from "qrcode.react";

function TableAdminPage() {
  const [tables, setTables] = useState([]);
  const [users, setUsers] = useState([]); // ✅ قائمة المستخدمين (السرفرات)
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
      // ✅ نحتفظ فقط بالمستخدمين role = server
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
    fetchUsers(); // ✅ نجيب المستخدمين عند تحميل الصفحة
  }, []);

  return (
    <div className="table-management">
      <Admin />
      <h1>Table Management</h1>

      {/* Table Form */}
      <form onSubmit={handleFormSubmit} className="table-form">
        <div className="form-group">
          <label>Table Number:</label>
          <input
            type="number"
            name="number"
            value={formdata.number}
            onChange={handleInputChange}
            required
          />
        </div>
        <div className="form-group">
          <label>Capacity:</label>
          <input
            type="number"
            name="capacity"
            value={formdata.capacity}
            onChange={handleInputChange}
            required
          />
        </div>
        <div className="form-group">
          <label>Status:</label>
          <select
            name="status"
            value={formdata.status}
            onChange={handleInputChange}
          >
            <option value="free">Free</option>
            <option value="awaiting">Awaiting</option>
            <option value="reserved">Reserved</option>
          </select>
        </div>

        {/* ✅ Select server */}
        <div className="form-group">
          <label>Assign Server:</label>
          <select
            name="serverId"
            value={formdata.serverId}
            onChange={handleInputChange}
          >
            <option value="">-- Select a server --</option>
            {users.map((user) => (
              <option key={user._id} value={user._id}>
                {user.firstName} {user.lastName} ({user.email})
              </option>
            ))}
          </select>
        </div>

        <div className="form-actions">
          <button type="submit" className="submit-btn">
            {editTable ? "Update Table" : "Add Table"}
          </button>
          {editTable && (
            <button
              type="button"
              className="cancel-btn"
              onClick={() => setEditTable(null)}
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      {/* Table List */}
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
