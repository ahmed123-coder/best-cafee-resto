import React, { useEffect, useState } from "react";
import axios from "axios";
import "../style/Category.css";
import Admin from "./admin";

function Category() {
    const [categories, setCategories] = useState([]);
    const [formdata, setFormdata] = useState({
        name: "",
        description: "",
        isActive: true,
    });
    const [token, setToken] = useState(localStorage.getItem("token")); // Store token in state
    const [editCategory, setEditCategory] = useState(null);

    const fetchCategories = async () => {
        try {
            const response = await axios.get("http://localhost:3000/api/categorys", {
                headers: { Authorization: `Bearer ${token}` },
            });
            setCategories(response.data);
        } catch (error) {
            console.error("Error fetching categories:", error);
        }
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormdata({
            ...formdata,
            [name]: type === "checkbox" ? checked : value,
        });
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editCategory) {
                const response = await axios.put(
                    `http://localhost:3000/api/categorys/${editCategory}`,
                    formdata,
                    {
                        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                    }
                );
                console.log("Category updated:", response.data);
            } else {
                const response = await axios.post(
                    "http://localhost:3000/api/categorys",
                    formdata,
                    {
                        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                    }
                );
                console.log("Category added:", response.data);
            }
            setFormdata({ name: "", description: "", isActive: true });
            setEditCategory(null);
            fetchCategories();
        } catch (error) {
            console.error("Error saving category:", error);
        }
    };

    const handleEditCategory = (category) => {
        setEditCategory(category._id);
        setFormdata({
            name: category.name,
            description: category.description,
            isActive: category.isActive,
        });
    };

    const handleDeleteCategory = async (categoryId) => {
        try {
            const response = await axios.delete(
                `http://localhost:3000/api/categorys/${categoryId}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            fetchCategories();
        } catch (error) {
            console.error("Error deleting category:", error);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    return (
        <div className="category-management">
            <Admin />
            <h1>Category Management</h1>

            {/* Category Form */}
            <form onSubmit={handleFormSubmit} className="category-form">
                <div className="form-group">
                    <label>Name:</label>
                    <input
                        type="text"
                        name="name"
                        value={formdata.name}
                        onChange={handleInputChange}
                        required
                    />
                </div>
                <div className="form-group">
                    <label>Description:</label>
                    <input
                        type="text"
                        name="description"
                        value={formdata.description}
                        onChange={handleInputChange}
                        required
                    />
                </div>
                <div className="form-group checkbox-group">
                    <label>
                        Active:
                        <input
                            type="checkbox"
                            name="isActive"
                            checked={formdata.isActive}
                            onChange={handleInputChange}
                        />
                    </label>
                </div>
                <div className="form-actions">
                    <button type="submit" className="submit-btn">
                        {editCategory ? "Update Category" : "Add Category"}
                    </button>
                    {editCategory && (
                        <button type="button" className="cancel-btn" onClick={() => setEditCategory(null)}>
                            Cancel
                        </button>
                    )}
                </div>
            </form>

            {/* Category List */}
            <div className="category-list">
                <h2>Category List</h2>
                {categories.length > 0 ? (
                    <ul>
                        {categories.map((category) => (
                            <li key={category._id} className="category-item">
                                <p>
                                    <strong>{category.name}</strong>: {category.description} -{" "}
                                    {category.isActive ? (
                                        <span className="active-status">Active</span>
                                    ) : (
                                        <span className="inactive-status">Inactive</span>
                                    )}
                                </p>
                                <div className="category-actions">
                                    <button className="edit-btn" onClick={() => handleEditCategory(category)}>
                                        Edit
                                    </button>
                                    <button className="delete-btn" onClick={() => handleDeleteCategory(category._id)}>
                                        Delete
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p>No categories available</p>
                )}
            </div>
        </div>
    );
}

export default Category;
