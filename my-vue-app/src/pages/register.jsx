import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import "../styles/login.css";

function Register() {
  const [formdata, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
  });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { value, name } = e.target;
    setFormData({ ...formdata, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formdata.password !== formdata.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    try {
      await axios.post("https://cafe-resto-c1i3.onrender.com/api/users", formdata);
      navigate("/login");
    } catch (error) {
      setError(error.response?.data?.message || "An error occurred during registration.");
    }
  };

  return (
    <div style={{ maxWidth: "400px", margin: "0 auto", padding: "20px" }}>
      <h1>Register:</h1>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <div>
          <label>First Name:</label>
          <input
            type="text"
            name="firstName"
            value={formdata.firstName}
            onChange={handleInputChange}
            required
            style={{ width: "100%", padding: "8px", margin: "10px 0" }}
          />
        </div>
        <div>
          <label>Last Name:</label>
          <input
            type="text"
            name="lastName"
            value={formdata.lastName}
            onChange={handleInputChange}
            required
            style={{ width: "100%", padding: "8px", margin: "10px 0" }}
          />
        </div>
        <div>
          <label>Email:</label>
          <input
            type="email"
            name="email"
            value={formdata.email}
            onChange={handleInputChange}
            required
            style={{ width: "100%", padding: "8px", margin: "10px 0" }}
          />
        </div>
        <div>
          <label>Password:</label>
          <input
            type="password"
            name="password"
            value={formdata.password}
            onChange={handleInputChange}
            required
            style={{ width: "100%", padding: "8px", margin: "10px 0" }}
          />
        </div>
        <div>
          <label>Confirm Password:</label>
          <input
            type="password"
            name="confirmPassword"
            value={formdata.confirmPassword}
            onChange={handleInputChange}
            required
            style={{ width: "100%", padding: "8px", margin: "10px 0" }}
          />
        </div>
        <button
          type="submit"
          style={{
            width: "100%",
            padding: "10px",
            backgroundColor: "#007BFF",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Register
        </button>
      </form>
    </div>
  );
}

export default Register;
