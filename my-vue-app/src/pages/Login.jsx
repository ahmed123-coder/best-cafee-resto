import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/login.css";

function Login() {
      const [darkMode, setDarkMode] = useState(() => {
        return localStorage.getItem("darkMode") === "enabled";
      });
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post("http://localhost:3000/api/users/login", formData);

      if (response.data.token) {
        // Store the token in localStorage
        localStorage.setItem("token", response.data.token);

        // Fetch user details to check the role
        const userResponse = await axios.get("http://localhost:3000/api/users/me", {
          headers: { Authorization: `Bearer ${response.data.token}` },
        });

        // Check the user role
        if (userResponse.data.role === "admin") {
          navigate("/admin"); // Navigate to admin page if role is admin
        } else if (userResponse.data.role === "server") {
          navigate("/server"); // Navigate to server page if role is server
        }
        else if (userResponse.data.role === "chef") {
          navigate("/chef"); // Navigate to chef page if role is chef
        }
        else {
          navigate("/store"); // Default navigation for other roles
        }
      }
    } catch (err) {
      setError("Invalid email or password. Please try again.");
    }
  };

  return (
    <div className={`login-container ${darkMode ? "dark-mode" : ""}`}>
      <div className="login-box">
        <h1>Login</h1>
        {error && <p className="error-message">{error}</p>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email:</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Password:</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              required
            />
          </div>
          <button type="submit" className="login-button">
            Login
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
