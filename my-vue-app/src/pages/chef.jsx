import React, { useState, useEffect } from "react";
import Products from "../conponment/products";
import GroupProducts from "../conponment/grouproducts";
import CartSidebarserverchef from "../conponment/serverchefcartuser";
import SelectTablechef from "../conponment/Selecttablechef";
import Navbar from "../conponment/storenavbar";
import OrderChefPage from "../conponment/orderchef";
import axios from "axios";
import { useLocation } from "react-router-dom";
import { io } from "socket.io-client";  // 👈

function Server() {
  const location = useLocation();
  const Socket = io("https://cafe-resto-c1i3.onrender.com"); // 👈 غيّر الرابط حسب سيرفرك
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
  const [selectedTable, setSelectedTable] = useState(null);
  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchTerm));
  const filteredGroups = groups.filter(g => g.name.toLowerCase().includes(searchTerm));

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
        if (response.data.role === "customer" || response.data.role === "server") {
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

    const storedCart = JSON.parse(localStorage.getItem("chefCart")) || {
      products: [],
      groupproducts: [],
    };
    setCartProducts(storedCart.products || []);
    setCartGroups(storedCart.groupproducts || []);
    Socket.on("newProduct", (newProduct) => {
      setProducts((prev) => [newProduct, ...prev]);
    });
    Socket.on("updateProduct", (updatedProduct) => {
      setProducts((prev) =>
        prev.map((p) => (p._id === updatedProduct._id ? updatedProduct : p))
      );
    });
    Socket.on("deleteProduct", (id) => {
      setProducts((prev) => prev.filter((p) => p._id !== id));
    });
    Socket.on("newProductGroup", (newProductGroup) => {
      setGroups((prev) => [newProductGroup, ...prev]);
    });
    Socket.on("updateProductGroup", (updatedProductGroup) => {
      setGroups((prev) =>
        prev.map((p) => (p._id === updatedProductGroup._id ? updatedProductGroup : p))
      );
    });
    Socket.on("deleteProductGroup", (id) => {
      setGroups((prev) => prev.filter((p) => p._id !== id));
    });
    return () => {
      Socket.off("newProduct");
      Socket.off("updateProduct");
      Socket.off("deleteProduct");
      Socket.off("newProductGroup");
      Socket.off("updateProductGroup");
      Socket.off("deleteProductGroup");
  };
}, []);


  const handleSearch = (term) => {
    setSearchTerm(term.toLowerCase());
  };

  const updateLocalStorage = (products, groups) => {
    localStorage.setItem(
      "chefCart",
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
    console.log("cartproducts", cartProducts);
    console.log("cartgroups", cartGroups);
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

  return (
    <div className="homepage">
      <Navbar 
        token={token}
        to={"/chef"}
        isCartOpen={isCartOpen}
        setIsCartOpen={setIsCartOpen}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        setcartorderdetails={setCartOrderDetails}
        iscartorderdetails={cartorderdetails}
        onSearchChange={handleSearch}
      />
      <CartSidebarserverchef
        cartProducts={cartProducts}
        setProducts={setCartProducts}
        setGroups={setCartGroups}
        cartGroups={cartGroups}
        onQuantityChange={handleUpdateQuantity}
        onRemove={handleRemoveItem}
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        darkMode={darkMode}
        selectedTable={selectedTable}   // pass table here
      />
      <div className="projectsandservices">
        {cartorderdetails === true ? (
          <OrderChefPage onClose={() => setCartOrderDetails(false)}/>
        ) : (
          <>
                <SelectTablechef
        selectedTable={selectedTable}
        setSelectedTable={setSelectedTable}
      />
            <Products products={filteredProducts} onAddToCart={onAddToCart} darkMode={darkMode} user={user} />
            <GroupProducts groups={filteredGroups} onAddToCart={onAddToCart} darkMode={darkMode} user={user}/>
          </>
        )}
      </div>
    </div>
  );
}

export default Server;
