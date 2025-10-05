import React, { useEffect, useState } from "react";
import axios from "axios";
import "../style/User.css"; // Import the CSS file for styling
import Admin from "./admin";


function User() {
  const [users, setUsers] = useState([]);
  const [token, setToken] = useState(localStorage.getItem("token")); // Store token in state
  const [formdata, setFormdata] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    role: "customer", // Default role
  });
  const [editUser, setEditUser] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormdata({ ...formdata, [name]: value });
  };

  const fetchUsers = async () => {
    try {
      const response = await axios.get("https://cafe-resto-c1i3.onrender.com/api/users", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log("Fetched users:", response.data); // Debug the API response
      setUsers(response.data);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const addUser = async (formdata) => {
    try {
      await axios.post("https://cafe-resto-c1i3.onrender.com/api/users/admin", formdata, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      fetchUsers();
      setEditUser(null);
      setFormdata({ firstName: "", lastName: "", email: "", password: "" , role: "customer" }); // Reset form data
    } catch (error) {
      console.error("Error adding user:", error);
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      await axios.delete(`https://cafe-resto-c1i3.onrender.com/api/users/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      fetchUsers();
    } catch (error) {
      console.error("Error deleting user:", error);
    }
  };

  const handleEditUser = async (user) => {
    setEditUser(user);
    setFormdata({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      password: "", // You might want to handle passwords differently
      role: user.role,
    });
  };

  const updateUser = async (userId) => {
    try {
      await axios.put(`https://cafe-resto-c1i3.onrender.com/api/users/${userId}`, formdata, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      fetchUsers();
      setEditUser(null);
      setFormdata({ firstName: "", lastName: "", email: "", password: "" , role: "customer" }); // Reset form data
    } catch (error) {
      console.error("Error updating user:", error);
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    if (editUser) {
      await updateUser(editUser._id);
    } else {
      await addUser(formdata);
    }
  };

  useEffect(() => {
    fetchUsers();
    console.log("Token:", token); // Print token in console
  }, []);

  return (
    <div className="user-management">
      <Admin />
      <h1>User Management</h1>

      {/* User Form */}
      <form onSubmit={handleFormSubmit} className="user-form">
        <div className="form-group">
          <label>First Name:</label>
          <input
            type="text"
            name="firstName"
            value={formdata.firstName}
            onChange={handleInputChange}
            required
          />
        </div>
        <div className="form-group">
          <label>Last Name:</label>
          <input
            type="text"
            name="lastName"
            value={formdata.lastName}
            onChange={handleInputChange}
            required
          />
        </div>
        <div className="form-group">
          <label>Email:</label>
          <input
            type="email"
            name="email"
            value={formdata.email}
            onChange={handleInputChange}
            required
          />
        </div>
        <div className="form-group">
          <label>Password:</label>
          <input
            type="password"
            name="password"
            value={formdata.password}
            onChange={handleInputChange}
            required
          />
        </div>
        <div className="form-group">
          <label>Role:</label>
          <select
            name="role"
            value={formdata.role}
            onChange={handleInputChange}
          >
            <option value="customer">Customer</option>
            <option value="admin">Admin</option>
            <option value="server">Server</option>
            <option value="chef">Chef</option>
          </select>
        </div>
        <div className="form-actions">
          <button type="submit" className="submit-btn">
            {editUser ? "Update User" : "Add User"}
          </button>
          {editUser && (
            <button type="button" className="cancel-btn" onClick={() => setEditUser(null)}>
              Cancel
            </button>
          )}
        </div>
      </form>

      {/* User List */}
      <div className="user-list">
        <h2>User List</h2>
        {users.length > 0 ? (
          <ul>
            {users.map((user) => (
              <li key={user._id} className="user-item">
                <p>
                  {user.firstName} {user.lastName} - {user.email} <span className="edit-btn">{user.role}</span>
                </p>
                <div className="user-actions">
                  <button className="edit-btn" onClick={() => handleEditUser(user)}>
                    Edit
                  </button>
                  <button className="delete-btn" onClick={() => handleDeleteUser(user._id)}>
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p>No users available</p>
        )}
      </div>
    </div>
  );
}

export default User;
