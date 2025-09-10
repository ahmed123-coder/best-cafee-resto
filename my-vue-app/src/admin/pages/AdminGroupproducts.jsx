import React, { useState, useEffect } from "react";
import axios from "axios";
import "../style/Groupproducts.css";
import Admin from "./admin";

const AdminOrder = () => {
  const [productGroups, setProductGroups] = useState([]);
  const [products, setProducts] = useState([]);
  const [editGroupProduct, setEditGroupProduct] = useState(null);
  const [token] = useState(localStorage.getItem("token"));

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    products: [],
    image: null,
  });

  useEffect(() => {
    fetchProductGroups();
    fetchProducts();
  }, []);

  const fetchProductGroups = async () => {
  try {
    const response = await axios.get("http://localhost:3000/api/groupproducts");
    setProductGroups(response.data);
  } catch (error) {
    console.error("Error fetching product groups:", error.response?.data || error.message);
    // أضف تنبيه للمستخدم
    alert("فشل تحميل المجموعات: " + (error.response?.data?.error || error.message));
  }
};

  const fetchProducts = async () => {
    try {
      const response = await axios.get("http://localhost:3000/api/products");
      setProducts(response.data);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    setFormData({ ...formData, image: e.target.files[0] });
  };

  const handleProductChange = (index, field, value) => {
    const updatedProducts = [...formData.products];
    updatedProducts[index][field] = value;
    setFormData({ ...formData, products: updatedProducts });
  };

  const addProduct = () => {
    setFormData({ ...formData, products: [...formData.products, { product: "", quantity: 1 }] });
  };

  const removeProduct = (index) => {
    setFormData({ ...formData, products: formData.products.filter((_, i) => i !== index) });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    data.append("name", formData.name);
    data.append("description", formData.description);
    data.append("price", formData.price);
    if (formData.image) data.append("image", formData.image);
    formData.products.forEach((item, index) => {
      data.append(`products[${index}][product]`, item.product);
      data.append(`products[${index}][quantity]`, item.quantity);
    });

    try {
      if (editGroupProduct) {
        await axios.put(`http://localhost:3000/api/groupproducts/${editGroupProduct._id}`, data, {
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
        });
      } else {
        await axios.post("http://localhost:3000/api/groupproducts", data, {
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
        });
      }
      setFormData({ name: "", description: "", price: "", products: [], image: null });
      setEditGroupProduct(null);
      fetchProductGroups();
    } catch (error) {
      console.error("Error saving product group:", error);
    }
  };

  const handleEdit = (group) => {
    setEditGroupProduct(group);
    setFormData({
      name: group.name,
      description: group.description,
      price: group.price,
      products: group.products.map((p) => ({ product: p.product._id, quantity: p.quantity })),
      image: null,
    });
  };

  const deleteProductGroup = async (id) => {
    try {
      await axios.delete(`http://localhost:3000/api/groupproducts/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchProductGroups();
    } catch (error) {
      console.error("Error deleting product group:", error);
    }
  };
  // قبل العرض:
  return (
    <div className="admin-order">
      <Admin />
      <h1>Manage Product Groups</h1>
      <form onSubmit={handleSubmit} className="product-group-form">
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
          />
        </div>
        <div className="form-group">
          <label>Image:</label>
          <input type="file" name="image" onChange={handleFileChange} />
        </div>

        <div className="product-list">
          {formData.products.map((item, index) => (
            <div key={index} className="product-item">
              <div className="form-group">
                <label>Product:</label>
                <select
                  value={item.product}
                  onChange={(e) => handleProductChange(index, "product", e.target.value)}
                  required
                >
                  <option value="">Select a product</option>
                  {products.map((product) => (
                    <option key={product._id} value={product._id}>
                      {product.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Quantity:</label>
                <input
                  type="number"
                  value={item.quantity}
                  onChange={(e) => handleProductChange(index, "quantity", e.target.value)}
                  min="1"
                  required
                />
              </div>
              <button type="button" className="remove-btn" onClick={() => removeProduct(index)}>
                Remove
              </button>
            </div>
          ))}
        </div>
        <button type="button" className="add-product-btn" onClick={addProduct}>
          Add Product
        </button>
        <button type="submit" className="submit-btn">
          {editGroupProduct ? "Update Product Group" : "Save Product Group"}
        </button>
      </form>

      <h2>Product Groups</h2>
      <div className="product-groups row">
        {productGroups.map((group) => (
          <div key={group._id} className="group-item">
                        {group.image && (
              <img
                src={group.image}
                alt={group.name}
                className="group-image"
              />
            )}
            <h3>{group.name}</h3>
            <p>{group.description}</p>
            <p>Price: ${group.price}</p>
            <p>Products:</p>
            <ul>
              {group.products.map((item, index) => (
                <li key={index}>
  {item.product?.name || "Product deleted"} (Quantity: {item.quantity})
</li>
              ))}
            </ul>
            <div className="group-actions">
              <button className="edit-btn" onClick={() => handleEdit(group)}>
                Edit
              </button>
              <button className="delete-btn" onClick={() => deleteProductGroup(group._id)}>
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminOrder;
