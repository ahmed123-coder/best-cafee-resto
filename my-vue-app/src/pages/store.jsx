import React, { useState, useEffect } from "react";
import { useLocation, useSearchParams } from "react-router-dom"; 
import Products from "../conponment/products";
import GroupProducts from "../conponment/grouproducts";
import CartUserSidebarstore from "../conponment/storecartuser";
import Navbar from "../conponment/storenavbar";
import Orderstore from "../conponment/orderstore";
import axios from "axios";
import { io } from "socket.io-client";  // 👈


function Store() {
  const [searchParams] = useSearchParams();
  const tableId = searchParams.get("tableId");   // ⬅️ هنا ناخذ tableId من QR
  const socket = io("https://cafe-resto-c1i3.onrender.com"); // 👈 غيّر الرابط حسب سيرفرك
  const location = useLocation();
  const token = localStorage.getItem("token") || "";
  const { productId, groupId, quantity } = location.state || {};
  const [searchTerm, setSearchTerm] = useState("");
  const [user, setUser] = useState({});
  const [products, setProducts] = useState([]);
  const [groups, setGroups] = useState([]);
  const [cartProducts, setCartProducts] = useState([]);
  const [cartGroups, setCartGroups] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartorderdetails, setCartOrderDetails] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("darkMode") === "enabled";
  });

  // ✅ نحفظ tableId في localStorage عشان نستعمله عند عمل order
  useEffect(() => {
    if (tableId) {
      localStorage.setItem("selectedTableId", tableId);
      console.log("📌 Current Table:", tableId);
    }
  }, [tableId]);

  useEffect(() => {
    if(token === ""){
      window.location.href = "/login";
      return;
    }
    const fetchuser = async () => {
      try {
        const response = await axios.get("https://cafe-resto-c1i3.onrender.com/api/users/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(response.data);
        if (response.data.role === "server" || response.data.role === "chef") {
          window.location.href = "/login";
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };
    fetchuser();

    axios.get("https://cafe-resto-c1i3.onrender.com/api/products").then((res) => {
      setProducts(res.data);
    });

    axios.get("https://cafe-resto-c1i3.onrender.com/api/groupproducts").then((res) => {
      setGroups(res.data);
    });

    const storedCart = JSON.parse(localStorage.getItem("guestCart")) || {
      products: [],
      groupproducts: [],
    };
    setCartProducts(storedCart.products || []);
    setCartGroups(storedCart.groupproducts || []);
      socket.on("newProduct", (newProduct) => {
    setProducts((prev) => [newProduct, ...prev]);
  });
  socket.on("updateProduct", (updatedProduct) => {
    setProducts((prev) =>
      prev.map((p) => (p._id === updatedProduct._id ? updatedProduct : p))
    );
  });
  socket.on("deleteProduct", (id) => {
    setProducts((prev) => prev.filter((p) => p._id !== id));
    
  });
  socket.on("newProductGroup", (newProductGroup) => {
    setGroups((prev) => [newProductGroup, ...prev]);
  });
  socket.on("updateProductGroup", (updatedProductGroup) => {
    setGroups((prev) =>
      prev.map((p) => (p._id === updatedProductGroup._id ? updatedProductGroup : p))
    );
  });
  socket.on("deleteProductGroup", (id) => {
    setGroups((prev) => prev.filter((p) => p._id !== id));
  });

    return () => {
      socket.off("newProduct");
      socket.off("updateProduct");
      socket.off("deleteProduct");
      socket.off("newProductGroup");
      socket.off("updateProductGroup");
      socket.off("deleteProductGroup");
    };
  }, [token]);

  const handleSearch = (term) => setSearchTerm(term.toLowerCase());

  const updateLocalStorage = (products, groups) => {
    localStorage.setItem(
      "guestCart",
      JSON.stringify({ products, groupproducts: groups })
    );
  };

  const onAddToCart = (id, type, details) => {
    if (type === "product") {
      const exists = cartProducts.find((item) => item.product === id);
      let updated = exists
        ? cartProducts.map((item) =>
            item.product === id
              ? { ...item, quantity: item.quantity + 1, image: details.image, name: details.name , price: details.price }
              : item
          )
        : [...cartProducts, { product: id, quantity: 1 , image: details.image, name: details.name , price: details.price }];

      setCartProducts(updated);
      updateLocalStorage(updated, cartGroups);
    } else {
      const exists = cartGroups.find((item) => item.group === id);
      let updated = exists
        ? cartGroups.map((item) =>
            item.group === id
              ? { ...item, quantity: item.quantity + 1, image: details.image, name: details.name , price: details.price }
              : item
          )
        : [...cartGroups, { group: id, quantity: 1 , image: details.image , name: details.name , price: details.price }];
      setCartGroups(updated);
      updateLocalStorage(cartProducts, updated);
    }
  };

  const handleUpdateQuantity = (id, type, newQty) => {
    if (type === "product") {
      const updated = cartProducts.map((item) =>
        item.product === id ? { ...item, quantity: newQty } : item
      );
      setCartProducts(updated);
      updateLocalStorage(updated, cartGroups);
    } else {
      const updated = cartGroups.map((item) =>
        item.group === id ? { ...item, quantity: newQty } : item
      );
      setCartGroups(updated);
      updateLocalStorage(cartProducts, updated);
    }
  };

  const handleRemoveItem = (id, type) => {
    if (type === "product") {
      const updated = cartProducts.filter((item) => item.product !== id);
      setCartProducts(updated);
      updateLocalStorage(updated, cartGroups);
    } else {
      const updated = cartGroups.filter((item) => item.group !== id);
      setCartGroups(updated);
      updateLocalStorage(cartProducts, updated);
    }
  };

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchTerm));
  const filteredGroups = groups.filter(g => g.name.toLowerCase().includes(searchTerm));

  return (
    <div className="homepage">
      <Navbar 
        to={"/store"}
        token={token}
        isCartOpen={isCartOpen}
        setIsCartOpen={setIsCartOpen}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        setcartorderdetails={setCartOrderDetails}
        iscartorderdetails={cartorderdetails}
        onSearchChange={handleSearch}
      />
      <CartUserSidebarstore
        cartProducts={cartProducts}
        setProducts={setCartProducts}
        setGroups={setCartGroups}
        cartGroups={cartGroups}
        onQuantityChange={handleUpdateQuantity}
        onRemove={handleRemoveItem}
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        darkMode={darkMode}
        tableId={tableId}   // ⬅️ مرر tableId إلى الـ cart
      />
      <div className="projectsandservices">
        {cartorderdetails ? (
          <Orderstore onClose={() => setCartOrderDetails(false)}/>
        ) : (
          <>
            <Products products={filteredProducts} onAddToCart={onAddToCart} darkMode={darkMode} user={user}/>
            <GroupProducts groups={filteredGroups} onAddToCart={onAddToCart} darkMode={darkMode} user={user}/>
          </>
        )}
      </div>
    </div>
  );
}

export default Store;
