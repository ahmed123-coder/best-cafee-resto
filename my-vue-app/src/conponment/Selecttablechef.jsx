import React, { useEffect, useState } from "react";
import axios from "axios";
import { io } from "socket.io-client";  // 👈

function SelectTablechef({ selectedTable, setSelectedTable }) {
  const [tables, setTables] = useState([]);
  const token = localStorage.getItem("token");
  const Socket = io("http://localhost:3000"); // 👈 غيّر الرابط حسب سيرفرك

  useEffect(() => {
    const fetchTables = async () => {
      try {
        const res = await axios.get("http://localhost:3000/api/tables", {
          headers: { Authorization: `Bearer ${token}` }
        });
        setTables(res.data);
      } catch (err) {
        console.error("Error fetching tables:", err);
      }
    };
    if (token) fetchTables();
    // all soket io of table updated
    Socket.on("updateTable", (updatedTable) => {
      setTables((prevTables) =>
        prevTables.map((table) =>
          table._id === updatedTable._id ? updatedTable : table
        )
      );
    });
    Socket.on("deleteTable", (deletedTableId) => {
      setTables((prevTables) =>
        prevTables.filter((table) => table._id !== deletedTableId)
      );
    });
    Socket.on("newTable", (newTable) => {
      setTables((prevTables) => [...prevTables, newTable]);
    });
    return () => {
      Socket.off("updateTable");
      Socket.off("deleteTable");
      Socket.off("newTable");
    };
  }, [token]);

  return (
    <div className="select-table">
      <label htmlFor="table-select">🪑 Select a Table:</label>
      <select
        id="table-select"
        value={selectedTable || ""}
        onChange={(e) => setSelectedTable(e.target.value)}
      >
        <option value="">-- Choose Table --</option>
        {tables.map((table) => (
          <option key={table._id} value={table._id}>
            {table.name || `Table #${table._id.substring(0, 5)}`} 
          </option>
        ))}
      </select>
    </div>
  );
}

export default SelectTablechef;
