import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "../style/admin.css";

function Admin() {
  const [open, setOpen] = useState(true);

  return (
    <>
      {/* Button to show sidebar if hidden */}
      {!open && (
        <button
          className="admin-toggle-btn icon-btn"
          onClick={() => setOpen(true)}
          aria-label="Show admin menu"
        >
          <i className="bi bi-list"></i>
        </button>
      )}

      {/* Sidebar */}
      <div className={`admin-sidebar-fixed${open ? " open" : ""}`}>
        <div className="admin-sidebar-content">
          <button
            className="admin-close-btn icon-btn"
            onClick={() => setOpen(false)}
            aria-label="Close admin menu"
          >
            <i className="bi bi-x-lg"></i>
          </button>
          <h2 className="admin-title">📊 Admin Panel</h2>
          <nav className="admin-nav">
            <ul>
              <li>
                <Link to="/store"><i className="bi bi-house-door"></i> Store</Link>
              </li>
              <li>
                <Link to="/admin/users"><i className="bi bi-people"></i> Users</Link>
              </li>
              <li>
                <Link to="/admin/categories"><i className="bi bi-tags"></i> Categories</Link>
              </li>
              <li>
                <Link to="/admin/productsAdmin"><i className="bi bi-box"></i> Products</Link>
              </li>
              <li>
                <Link to="/admin/group-product"><i className="bi bi-boxes"></i> Group Products</Link>
              </li>
              <li>
                <Link to="/admin/ordersAdminPage"><i className="bi bi-receipt"></i> Orders</Link>
              </li>
                            <li>
                <Link to="/admin/statdashboard"><i className="bi bi-receipt"></i> stats</Link>
              </li>
              <li>
                <Link to="/admin/tableAdmin"><i className="bi bi-table"></i> Table</Link>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </>
  );
}

export default Admin;