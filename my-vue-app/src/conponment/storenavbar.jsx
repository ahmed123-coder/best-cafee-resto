import React, { useState, useEffect } from "react";
import "../styles/navbar.css";

const Navbar = ({
  isCartOpen,
  setIsCartOpen,
  darkMode,
  setDarkMode,
  setcartorderdetails,
  iscartorderdetails,
  token,
  onSearchChange,
  to
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const toggleNavbar = () => setIsOpen(!isOpen);
  const toggleCart = () => setIsCartOpen(!isCartOpen);
  const toggleOrderDetails = () => setcartorderdetails(!iscartorderdetails);

  useEffect(() => {
    document.body.classList.toggle("dark-mode", darkMode);
    localStorage.setItem("darkMode", darkMode ? "enabled" : "disabled");
  }, [darkMode]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    onSearchChange(e.target.value); // ترسل القيمة للـ HomePage
  };

  return (
    <header className="navbar-container">
      <div className="navbar">
        {/* Logo */}
        <div className="navbar-logo">
          <a href={to || "/"}>
            <i className="bi bi-shop-window"></i>
          </a>
        </div>

        {/* Search bar */}
        <div className="search-box">
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={handleSearchChange}
          />
          <i className="bi bi-search"></i>
        </div>

        {/* Links */}
        <nav className={`navbar-links ${isOpen ? "active" : ""}`}>
          <a href="/store"><i className="bi bi-house-door"></i> Store</a>
          {token ? (
            <>
              <a href="/logout"><i className="bi bi-box-arrow-right"></i> Logout</a>
              <a onClick={toggleOrderDetails}><i className="bi bi-receipt-cutoff"></i> Orders</a>
            </>
          ) : (
            <a href="/login"><i className="bi bi-person"></i> Login</a>
          )}
        </nav>

        {/* Icons */}
        <div className="navbar-icons">
          <button onClick={toggleCart} className="icon-btn">
            <i className="bi bi-cart"></i>
          </button>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="icon-btn"
            aria-label="Toggle dark mode"
          >
            {darkMode ? (
              <i className="bi bi-sun-fill"></i>
            ) : (
              <i className="bi bi-moon-stars-fill"></i>
            )}
          </button>
          <button className="navbar-toggle icon-btn" onClick={toggleNavbar}>
            <i className="bi bi-list"></i>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
