import React, { useState, useEffect } from "react";
import Products from "../conponment/products";
import GroupProducts from "../conponment/grouproducts";
import ServerCartUserSidebarstore from "../conponment/servercartuser";
import SelectTable from "../conponment/SelectTable";
import Navbar from "../conponment/storenavbar";
import Orderstore from "../conponment/orderstore";
import axios from "axios";
import { useLocation } from "react-router-dom";

function Server() {
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
        const response = await axios.get("http://localhost:3000/api/users/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(response.data);
        if (response.data.role === "customer") {
          window.location.href = "/login";
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };
    fetchuser();

    axios.get("http://localhost:3000/api/products").then((res) => {
      setProducts(res.data);
    });

    axios.get("http://localhost:3000/api/groupproducts").then((res) => {
      setGroups(res.data);
    });

    const storedCart = JSON.parse(localStorage.getItem("guestCart")) || {
      products: [],
      groupproducts: [],
    };
    setCartProducts(storedCart.products || []);
    setCartGroups(storedCart.groupproducts || []);
  }, []);


  const handleSearch = (term) => {
    setSearchTerm(term.toLowerCase());
  };

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
        isCartOpen={isCartOpen}
        setIsCartOpen={setIsCartOpen}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        setcartorderdetails={setCartOrderDetails}
        iscartorderdetails={cartorderdetails}
        onSearchChange={handleSearch}
      />
      <ServerCartUserSidebarstore
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
      <SelectTable
        selectedTable={selectedTable}
        setSelectedTable={setSelectedTable}
      />
      <div className="projectsandservices">
        {cartorderdetails === true ? (
          <Orderstore onClose={() => setCartOrderDetails(false)}/>
        ) : (
          <>
            <Products products={filteredProducts} onAddToCart={onAddToCart} darkMode={darkMode} user={user} printOrder={printOrder}/>
            <GroupProducts groups={filteredGroups} onAddToCart={onAddToCart} darkMode={darkMode} user={user} printOrder={printOrder}/>
          </>
        )}
      </div>
    </div>
  );
}

export default Server;