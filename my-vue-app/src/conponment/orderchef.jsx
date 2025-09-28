import { useEffect, useState } from "react";
import axios from "axios";
import "../admin/style/Ordere.css";
import SelectTablechef from "./Selecttablechef";
import { io } from "socket.io-client";  // 👈

const OrderChefPage = () => {
  const [details, setDetails] = useState();
  const [status, setStatus] = useState(null);
  const [selectedServer, setSelectedServer] = useState("");
  const [selectchef, setSelectchef] = useState("");
  const socket = io("http://localhost:3000"); // 👈 غيّر الرابط حسب سيرفرك

  const [me, setMe] = useState({});

    const [dataorder, setDataorder] = useState({
      customer: "",
      products: [],
      productGroups: [],
      paymentMethod: "cash",
      status: "confirmed",
      isInStore: true,
      tableId: null,
    });

  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [productGroups, setProductGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [token] = useState(localStorage.getItem("token"));
  const [editorder, setEditorder] = useState(null);


  // Fetch orders with server/date filter
  const fetchOrders = async (server = selectedServer, chef = selectchef) => {
    let url = "";
    // حساب start (قبل 24 ساعة) و end (الوقت الحالي)
    const end = new Date();
    const start = new Date();
    start.setHours(start.getHours() - 24);
    if (server) {
      url = `http://localhost:3000/api/orders/in-store/server/${server}`;
    }
    else if (chef) {
  url = `http://localhost:3000/api/orders/in-store/chef/${chef}`;
}

    else {
      url = `http://localhost:3000/api/orders/in-store`;
    }
    setLoading(true);
    try {
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          start: start.toISOString(),
          end: end.toISOString(),
        },
      });
      setOrders(response.data.filter(order => order.status !== "pending"));
    } catch (err) {
      console.error("Error fetching orders:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchme();
    fetchUsers();
    fetchProducts();
    fetchProductGroups();
    fetchOrders();
           // 📡 لو أوردر اتعمله create
  socket.on("orderCreated", (newOrder) => {
    setOrders((prev) => [newOrder, ...prev]);
  });

  // 📡 لو أوردر اتعمله update
  socket.on("orderUpdated", (updatedOrder) => {
    setOrders((prev) =>
      prev.map((o) => (o._id === updatedOrder._id ? updatedOrder : o))
    );
  });

  // 📡 لو أوردر اتعمله delete
  socket.on("orderDeleted", (id) => {
    setOrders((prev) => prev.filter((o) => o._id !== id));
  });
  // all soket io of users
  socket.on("newUser", (newUser) => {
    setUsers((prev) => [newUser, ...prev]);
  });
  socket.on("updateUser", (updatedUser) => {
    setUsers((prev) =>
      prev.map((u) => (u._id === updatedUser._id ? updatedUser : u))
    );
  });
  socket.on("deleteUser", (id) => {
    setUsers((prev) => prev.filter((u) => u._id !== id));
  });
  // all soket io of products and product groups
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
    setProductGroups((prev) => [newProductGroup, ...prev]);
  });
  socket.on("updateProductGroup", (updatedProductGroup) => {
    setProductGroups((prev) =>
      prev.map((p) => (p._id === updatedProductGroup._id ? updatedProductGroup : p))
    );
  });
  socket.on("deleteProductGroup", (id) => {
    setProductGroups((prev) => prev.filter((p) => p._id !== id));
  });
  return () => {
    socket.off("orderCreated");
    socket.off("orderUpdated");
    socket.off("orderDeleted");
    socket.off("newUser");
    socket.off("updateUser");
    socket.off("deleteUser");
    socket.off("newProduct");
    socket.off("updateProduct");
    socket.off("deleteProduct");
    socket.off("newProductGroup");
    socket.off("updateProductGroup");
    socket.off("deleteProductGroup");
  };
    // eslint-disable-next-line
  }, [token]);

  // Refetch orders when server or date filter changes
  useEffect(() => {
    fetchOrders(selectedServer, selectchef);
    // eslint-disable-next-line
  }, [selectedServer, selectchef]);

  const fetchme = async () => {
    try {
      const response = await axios.get("http://localhost:3000/api/users/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMe(response.data);
      if (response.data.role === "customer" || response.data.role === "server") {
        window.location.href = "/login";
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await axios.get("http://localhost:3000/api/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(response.data);
    } catch (error) {
      console.error("Error fetching users:", error);
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

  const fetchProductGroups = async () => {
    try {
      const response = await axios.get("http://localhost:3000/api/groupproducts");
      setProductGroups(response.data);
    } catch (error) {
      console.error("Error fetching product groups:", error);
    }
  };

  const updateorder = async (id) => {
    try {
      await axios.put(`http://localhost:3000/api/orders/${id}/in-store`, dataorder, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (err) {
      alert("Error updating order");
    }
  };

  const updateStatus = async (id) => {
    try {
      await axios.put(`http://localhost:3000/api/orders/${id}/delivered/in-store`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (err) {
      alert("Error updating status");
    }
  };

    const updateStatuspaid = async (id) => {
    try {
      await axios.put(
        `http://localhost:3000/api/orders/${id}/paid/in-store`
      );
    } catch (err) {
      alert("Error updating status to paid");
    }
  };

  const updateStatusstarted = async (id) => {
    try {
      await axios.put(`http://localhost:3000/api/orders/${id}/started/in-store`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (err) {
      alert("Error updating status");
    }
  };

  const updateStatuscompleted = async (id) => {
    try {
      await axios.put(`http://localhost:3000/api/orders/${id}/completed/in-store`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (err) {
      alert("Error updating status");
    }
  };

  const updateStatusrejected = async (id) => {
    try {
      await axios.put(`http://localhost:3000/api/orders/${id}/rejected/in-store`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (error) {
      alert("Error updating status");
    }
  };

  const deleteOrder = async (id) => {
    if (!window.confirm("Are you sure you want to delete this order?")) return;
    try {
      await axios.delete(`http://localhost:3000/api/orders/${id}/in-store`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await axios.delete(`http://localhost:3000/api/details/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (err) {
      alert("Error deleting order");
    }
  };

    function printOrder(order) {
  const receipt = generateReceipt(order).replace(/\n/g, "<br>");
  const printWindow = window.open("", "_blank", "width=300,height=600");
  printWindow.document.write(`
    <html>
      <head>
        <title>فاتورة الطلب</title>
        <style>
          body {
            font-family: 'Cairo', 'Tahoma', 'monospace', Arial, sans-serif;
            font-size: 15px;
            direction: rtl;
            text-align: right;
            margin: 0;
            padding: 0;
            background: #fff;
          }
          .receipt {
            width: 260px;
            margin: 0 auto;
            padding: 12px 0;
          }
          .receipt-title {
            font-size: 18px;
            font-weight: bold;
            text-align: center;
            margin-bottom: 8px;
            letter-spacing: 1px;
          }
          .receipt hr {
            border: none;
            border-top: 1.5px dashed #888;
            margin: 8px 0;
          }
          .receipt .total {
            font-size: 16px;
            font-weight: bold;
            margin-top: 8px;
            text-align: center;
          }
          .receipt .thanks {
            text-align: center;
            margin-top: 12px;
            font-size: 15px;
            letter-spacing: 1px;
          }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="receipt-title">فاتورة الطلب</div>
          <hr>
          ${receipt}
          <hr>
          <div class="thanks">نتمنى لكم يوماً سعيداً</div>
        </div>
        <script>
          window.onload = function() {
            window.print();
            setTimeout(() => window.close(), 500);
          }
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
}

  // توليد نص الفاتورة للطباعة
  function generateReceipt(order) {
    let receipt = `رقم الدور: ${order.queueNumber}\n`;
    receipt += `-----------------------------\n`;
    receipt += `المنتجات:\n`;
    if (order.products && order.products.length > 0) {
      order.products.forEach((item) => {
        receipt += `- ${item.product.name} x${item.quantity} = ${item.product.price * item.quantity} دج\n`;
      });
    }
    if (order.productGroups && order.productGroups.length > 0) {
      receipt += `مجموعات المنتجات:\n`;
      order.productGroups.forEach((item) => {
        receipt += `- ${item.group.name} x${item.quantity} = ${item.group.price * item.quantity} دج\n`;
      });
    }
    receipt += `-----------------------------\n`;
    receipt += `الإجمالي: ${order.totalPrice} دج\n`;
    receipt += `طريقة الدفع: ${order.paymentMethod}\n`;
    receipt += `-----------------------------\n`;
    receipt += `شكراً لتسوقكم معنا!\n`;
    return receipt;
  }
  const editedorder = async (order) => {
    setEditorder(order._id);
    setDataorder({
      customer: order.customer?._id || "",
      products: order.products.map((p) => ({ product: p.product._id, quantity: p.quantity })),
      productGroups: order.productGroups.map((pg) => ({ group: pg.group._id, quantity: pg.quantity })),
      paymentMethod: order.paymentMethod,
      status: order.status,
      isInStore: order.isInStore,
      tableId: order.tableId || null,
    });
    console.log("order", order);
  };

  const handleProductChange = (index, field, value) => {
    const updatedProducts = [...dataorder.products];
    updatedProducts[index][field] = value;
    setDataorder({ ...dataorder, products: updatedProducts });
  };

  const handleGroupChange = (index, field, value) => {
    const updatedProductGroups = [...dataorder.productGroups];
    updatedProductGroups[index][field] = value;
    setDataorder({ ...dataorder, productGroups: updatedProductGroups });
  };

  const removeProduct = (index) => {
    setDataorder({ ...dataorder, products: dataorder.products.filter((_, i) => i !== index) });
  };

  const removeGroup = (index) => {
    setDataorder({ ...dataorder, productGroups: dataorder.productGroups.filter((_, i) => i !== index) });
  };

  const addProduct = () => {
    setDataorder({ ...dataorder, products: [...dataorder.products, { product: "", quantity: 1 }] });
  };

  const addGroup = () => {
    setDataorder({ ...dataorder, productGroups: [...dataorder.productGroups, { group: "", quantity: 1 }] });
  };

  const handleInputChangeorder = (e) => {
    const { name, value } = e.target;
    setDataorder({ ...dataorder, [name]: value });
  };

  // Handle server filter change
  const handleServerChange = async (e) => {
    const serverId = e.target.value;
    setSelectedServer(serverId);
    setSelectchef("");
    // fetchOrders will be called by useEffect
  };

  const handleChefChange = async (e) => {
    const chefId = e.target.value;
    setSelectchef(chefId);
    // fetchOrders will be called by useEffect
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editorder) {
        await updateorder(editorder);
      } else {
         await axios.post("http://localhost:3000/api/orders/in-store", dataorder, {
          headers: { "Content-Type": "application/json" },
        });
      }

      setDataorder({ customer: "", products: [], productGroups: [], paymentMethod: "cash", status: "pending", isInStore: true, tableId: null });
      setEditorder(null);
    } catch (err) {
      console.error("Error saving order:", err);
      alert("Error saving order");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4 text-center md:text-left">Orders Management</h1>
      <form onSubmit={handleSubmit} className="form space-y-4 bg-white p-6 rounded-lg shadow-md">
        {/* Customer selection */}
                {/* Customer hidden input */}
        <input type="hidden" name="customer" value={me._id || ""} />

        {/* Select Table */}
        <SelectTablechef
          selectedTable={dataorder.tableId}
          setSelectedTable={(id) => setDataorder({ ...dataorder, tableId: id })}
        />

        {/* Products section */}
        <div className="input-group">
          <h3 className="text-lg font-medium text-gray-700">Products</h3>
          {dataorder.products.map((item, index) => (
            <div key={index} className="flex items-center space-x-2 mt-2">
              <select
                value={item.product}
                onChange={(e) => handleProductChange(index, "product", e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              >
                <option value="">Select a product</option>
                {products.map((product) => (
                  <option key={product._id} value={product._id}>
                    {product.name}
                  </option>
                ))}
              </select>
              <input
                type="number"
                value={item.quantity}
                onChange={(e) => handleProductChange(index, "quantity", e.target.value)}
                className="mt-1 block w-20 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
              <button
                type="button"
                onClick={() => removeProduct(index)}
                className="bg-red-500 text-white px-2 py-1 rounded"
              >
                Remove
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addProduct}
            className="mt-2 bg-blue-500 text-white px-4 py-2 rounded"
          >
            Add Product
          </button>
        </div>

        {/* Product Groups section */}
        <div className="input-group">
          <h3 className="text-lg font-medium text-gray-700">Product Groups</h3>
          {dataorder.productGroups.map((item, index) => (
            <div key={index} className="flex items-center space-x-2 mt-2">
              <select
                value={item.group}
                onChange={(e) => handleGroupChange(index, "group", e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              >
                <option value="">Select a product group</option>
                {productGroups.map((group) => (
                  <option key={group._id} value={group._id}>
                    {group.name}
                  </option>
                ))}
              </select>
              <input
                type="number"
                value={item.quantity}
                onChange={(e) => handleGroupChange(index, "quantity", e.target.value)}
                className="mt-1 block w-20 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
              <button
                type="button"
                onClick={() => removeGroup(index)}
                className="bg-red-500 text-white px-2 py-1 rounded"
              >
                Remove
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addGroup}
            className="mt-2 bg-blue-500 text-white px-4 py-2 rounded"
          >
            Add Product Group
          </button>
        </div>

        {/* Submit Button */}
        <button
          type="button"
          className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          onClick={() => {
            setDataorder({ customer: "", products: [], productGroups: [], paymentMethod: "cash", status: "pending", isInStore: true, tableId: null });
            setEditorder(null);
          }}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          {loading ? "Loading..." : "Submit"}
        </button>
      </form>

      <div className="details mt-6">
        <h2 className="text-xl font-bold mb-4">Order Details</h2>
        {details && (
          <div className="bg-white p-4 rounded shadow-md">
            <button onClick={() => setDetails(null)} className="text-red-500 mb-4">x</button>
            {orders.map((order) => (
              order._id === details._id ? (
                <div key={order._id}>
                  <p><strong>Products:</strong></p>
                  <ul>
                    {order.products.map((product) => (
                      <li key={product.product._id}>
                        {product.product.name} - Quantity: {product.quantity}
                        <br />
                        Price: {product.product.price} - Total: {product.product.price * product.quantity}
                        <br />
                        <img src={product.product.image} alt={product.product.name} className="w-20 h-20" />
                      </li>
                    ))}
                  </ul>
                  <p><strong>Product Groups:</strong></p>
                  <ul>
                    {order.productGroups.map((group) => (
                      <li key={group.group._id}>
                        {group.group.name} - Quantity: {group.quantity}
                        <br />
                        Price: {group.group.price} - Total: {group.group.price * group.quantity}
                        <br />
                        <img src={group.group.image} alt={group.group.name} className="w-20 h-20" />
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="text-xl mt-6 container width align-center mt-5">Orders List</h2>
        {loading ? (
          <p>Loading orders...</p>
        ) : (
          <div className="container p-6 bg-gray-100 min-h-screen">


            {/* Status Filter Buttons */}
            <div className="filter-buttons">
              <button onClick={() => setStatus("cancelled")} className="canceled">
                Canceled
              </button>
              <button onClick={() => setStatus("delivered")} className="completed">
                Completed
              </button>
              <button onClick={() => setStatus("pending")} className="pending">
                Pending
              </button>
              <button onClick={() => setStatus(null)} className="all">
                All
              </button>
            </div>
            {/* select server from user */}
            <button onClick={() => { setSelectchef(me._id); setSelectedServer(""); }} className="all">me  the chef</button>
            <div className="filter-buttons">
              <select
                value={selectedServer}
                onChange={handleServerChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">Select user</option>
                {/* user.role = customer */}
                {users
                  .filter((user) => user.role === "server")
                  .map((user) => ( 
                    <option key={user._id} value={user._id}>
                      {user.firstName} {user.lastName}
                    </option>
                  ))}
              </select>
            </div>

            {/* Table Container */}
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Paymeny methode</th>
                    <th>Total Price</th>
                    <th>Status</th>
                    <th>To Status</th>
                  </tr>
                </thead>
                <tbody>
                  {orders
                    .filter((order) => status === null || order.status === status)
                    .map((order) => (
                      <tr key={order._id}>
                        <td>{order.customer ? `${order.customer.firstName} ${order.customer.lastName}` : "N/A"}</td>
                        <td>{order.paymentMethod}</td>
                        <td>{order.totalPrice}</td>
                        <td>
                          <button className="status">{order.status}</button>
                        </td>
                        <td className="table-actions">
                          {order.status !== "delivered" && (
                            <button onClick={() => updateStatus(order._id)} className="status">
                              Mark Delivered
                            </button>
                          )}
                          {order.status !== "rejected" && (
                            <button onClick={() => updateStatusrejected(order._id)} className="status">
                              Rejected
                            </button>
                          )}
                          {
                            order.status !== "paid" && (
                              <button onClick={() => updateStatuspaid(order._id)} className="status">
                                Mark Paid
                              </button>
                            )}
                          {
                            order.status !== "started" && (
                              <button onClick={() => updateStatusstarted(order._id)} className="status">
                                Mark Started
                              </button>
                            )}
                            {order.status !== "completed" && (
                            <button onClick={() => updateStatuscompleted(order._id)} className="status">
                              Mark Completed
                            </button>
                          )}
                          <button onClick={() => deleteOrder(order._id)} className="delete">
                            Delete
                          </button>
                          <button onClick={() => editedorder(order)} className="edit">
                            Edit
                          </button>
                          <button className="edit" onClick={() => setDetails(order)}>
                            Details
                          </button>
                          <button onClick={() => printOrder(order)} className="edit">
                            Print
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderChefPage;