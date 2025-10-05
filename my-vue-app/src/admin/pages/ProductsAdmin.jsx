import React, { useState, useEffect } from "react";
import axios from "axios";
import "../style/Product.css";
import Admin from "./admin";

const ProductsAdmin = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [token] = useState(localStorage.getItem("token") || "");
  const [editProduct, setEditProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    quantity: "",
    isUnlimited: false,
    image: null,
  });

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await axios.get("https://cafe-resto-c1i3.onrender.com/api/products");
      setProducts(response.data);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get("https://cafe-resto-c1i3.onrender.com/api/categorys", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCategories(response.data);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const deleteProduct = async (id) => {
    try {
      await axios.delete(`https://cafe-resto-c1i3.onrender.com/api/products/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchProducts();
    } catch (error) {
      alert("Failed to delete product: " + (error.response?.data?.error || error.message));
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === "isUnlimited") {
      setFormData({
        ...formData,
        isUnlimited: checked,
        quantity: checked ? "" : formData.quantity,
      });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleFileChange = (e) => {
    setFormData({ ...formData, image: e.target.files[0] });
  };

  const handleEdit = (product) => {
    setEditProduct(product._id);
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      category: product.category._id || product.category,
      quantity: product.quantity === null ? "" : product.quantity.toString(),
      isUnlimited: product.quantity === null,
      image: null,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    data.append("name", formData.name);
    data.append("description", formData.description);
    data.append("price", formData.price);
    data.append("category", formData.category);
    // إذا كان غير محدود quantity أرسل ""
    data.append("quantity", formData.isUnlimited ? "" : formData.quantity);
    if (formData.image) data.append("image", formData.image);

    try {
      if (editProduct) {
        await axios.put(
          `https://cafe-resto-c1i3.onrender.com/api/products/${editProduct}`,
          data,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "multipart/form-data",
            },
          }
        );
      } else {
        await axios.post(
          "https://cafe-resto-c1i3.onrender.com/api/products",
          data,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "multipart/form-data",
            },
          }
        );
      }
      setFormData({
        name: "",
        description: "",
        price: "",
        category: "",
        quantity: "",
        isUnlimited: false,
        image: null,
      });
      setEditProduct(null);
      fetchProducts();
    } catch (error) {
      let errorMessage = "An unexpected error occurred";
      if (error.response) {
        if (typeof error.response.data === "string") {
          errorMessage = "Server error: Please check your data";
        } else {
          errorMessage = error.response.data?.error || JSON.stringify(error.response.data);
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      alert("Error: " + errorMessage);
    }
  };

  return (
    <div className="products-admin">
      <Admin />
      <h1>{editProduct ? "Edit Product" : "Add a New Product"}</h1>
      <form onSubmit={handleSubmit} className="product-form">
        <div className="form-group">
          <label>Name:</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            required
          />
        </div>
        <div className="form-group">
          <label>Description:</label>
          <input
            type="text"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            required
          />
        </div>
        <div className="form-group">
          <label>Price:</label>
          <input
            type="number"
            name="price"
            value={formData.price}
            onChange={handleInputChange}
            required
            min="0"
            step="0.01"
          />
        </div>
        <div className="form-group">
          <label>Category:</label>
          <select
            name="category"
            value={formData.category}
            onChange={handleInputChange}
            required
          >
            <option value="">Select a category</option>
            {categories.map((category) => (
              <option key={category._id} value={category._id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Quantity:</label>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <input
              type="number"
              name="quantity"
              value={formData.isUnlimited ? "" : formData.quantity}
              onChange={handleInputChange}
              min="0"
              disabled={formData.isUnlimited}
              placeholder="Enter quantity"
              style={{ width: "120px" }}
              required={!formData.isUnlimited}
            />
            <label style={{ display: "flex", alignItems: "center", gap: "5px" }}>
              <input
                type="checkbox"
                name="isUnlimited"
                checked={formData.isUnlimited}
                onChange={handleInputChange}
              />
              غير محدود
            </label>
          </div>
        </div>
        <div className="form-group">
          <label>Image:</label>
          <input
            type="file"
            name="image"
            onChange={handleFileChange}
            accept="image/*"
          />
        </div>
        <button type="submit" className="submit-btn">
          {editProduct ? "Update Product" : "Add Product"}
        </button>
        {editProduct && (
          <button
            type="button"
            className="cancel-btn"
            onClick={() => {
              setEditProduct(null);
              setFormData({
                name: "",
                description: "",
                price: "",
                category: "",
                quantity: "",
                isUnlimited: false,
                image: null,
              });
            }}
          >
            Cancel
          </button>
        )}
      </form>

      <h2>Product List</h2>
      <div className="row">
        {products.filter(product => product.isActive).map((product) => (
          <div key={product._id} className="col-lg-3 col-md-6 col-sm-6 mb-4">
            <img
              src={product.image}
              alt={product.name}
              className="product-image"
            />
            <div className="product-details">
              <h3>{product.name}</h3>
              <p>{product.description}</p>
              <p>Price: ${product.price}</p>
              <p>
                Quantity:{" "}
                {product.quantity === null || product.quantity === undefined
                  ? "غير محدود"
                  : product.quantity}
              </p>
              <div className="product-actions">
                <button
                  className="edit-btn"
                  onClick={() => handleEdit(product)}
                >
                  Edit
                </button>
                <button
                  className="delete-btn"
                  onClick={() => deleteProduct(product._id)}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductsAdmin;
