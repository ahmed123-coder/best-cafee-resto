import React, { useEffect, useState } from "react";
import axios from "axios";

function SelectTable({ selectedTable, setSelectedTable }) {
  const [tables, setTables] = useState([]);
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchTables = async () => {
      try {
        const res = await axios.get("http://localhost:3000/api/tables/my-tables", {
          headers: { Authorization: `Bearer ${token}` }
        });
        setTables(res.data);
      } catch (err) {
        console.error("Error fetching tables:", err);
      }
    };
    if (token) fetchTables();
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

export default SelectTable;
