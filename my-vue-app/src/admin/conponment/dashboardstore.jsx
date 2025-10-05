import React, { useEffect, useState } from "react";
import { Bar, Line } from "react-chartjs-2";
import axios from "axios";
import "chart.js/auto";

function Dashboardnotinstore() {
  // إحصائيات الطلبات
  const [mode, setMode] = useState("days"); // days or months
  const [chartType, setChartType] = useState("bar"); // bar or line
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [chartData, setChartData] = useState({ labels: [], datasets: [] });

  // أكثر المنتجات مبيعًا
  const [topMode, setTopMode] = useState("days");
  const [topStart, setTopStart] = useState("");
  const [topEnd, setTopEnd] = useState("");
  const [topProductsData, setTopProductsData] = useState({ labels: [], datasets: [] });
  const [topChartType, setTopChartType] = useState("bar");

  // إحصائيات منتج محدد
  const [productsList, setProductsList] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [prodStart, setProdStart] = useState("");
  const [prodEnd, setProdEnd] = useState("");
  const [prodChartType, setProdChartType] = useState("bar");
  const [prodChartData, setProdChartData] = useState({ labels: [], datasets: [] });

  // جلب قائمة المنتجات
  useEffect(() => {
    axios.get("https://cafe-resto-c1i3.onrender.com/api/products").then((res) => {
      setProductsList(res.data);
    });
  }, []);

  // جلب بيانات الطلبات حسب الفترة والنوع
  useEffect(() => {
    if (!start || !end) return;
    let url =
      mode === "days"
        ? `https://cafe-resto-c1i3.onrender.com/api/orders/stats/days/in-store?start=${start}&end=${end}`
        : `https://cafe-resto-c1i3.onrender.com/api/orders/stats/months/in-store?start=${start}&end=${end}`;
    axios.get(url).then((res) => {
      setChartData({
        labels: res.data.map((item) => item._id),
        datasets: [
          {
            label: mode === "days" ? "عدد الطلبات لكل يوم" : "عدد الطلبات لكل شهر",
            data: res.data.map((item) => item.count),
            backgroundColor: "rgba(75,192,192,0.7)",
            borderColor: "rgba(75,192,192,1)",
            fill: true,
            tension: 0.2,
          },
        ],
      });
    });
  }, [mode, start, end]);

  // جلب أكثر المنتجات مبيعًا حسب الفترة والنوع
  useEffect(() => {
    if (!topStart || !topEnd) return;
    axios
      .get(
        `https://cafe-resto-c1i3.onrender.com/api/orders/stats/top-products-all/in-store?mode=${topMode}&start=${topStart}&end=${topEnd}`
      )
      .then((res) => {
        // ترتيب البيانات: كل منتج له بيانات لكل فترة
        const periods = [...new Set(res.data.map((item) => item.period))];
        const products = [...new Set(res.data.map((item) => item.name))];
        const datasets = products.map((name) => ({
          label: name,
          data: periods.map((period) => {
            const found = res.data.find(
              (i) => i.name === name && i.period === period
            );
            return found ? found.totalSold : 0;
          }),
          backgroundColor: "#" + Math.floor(Math.random() * 16777215).toString(16),
        }));
        setTopProductsData({
          labels: periods,
          datasets,
        });
      });
  }, [topMode, topStart, topEnd, topChartType]);

  // جلب إحصائيات منتج محدد حسب الأيام
  useEffect(() => {
    if (!selectedProduct || !prodStart || !prodEnd) return;
    axios
      .get(
        `https://cafe-resto-c1i3.onrender.com/api/orders/stats/product/${selectedProduct}/days/in-store?start=${prodStart}&end=${prodEnd}`
      )
      .then((res) => {
        setProdChartData({
          labels: res.data.map((item) => item.date),
          datasets: [
            {
              label: "عدد الطلبات لهذا المنتج في اليوم",
              data: res.data.map((item) => item.count),
              backgroundColor: "rgba(255, 159, 64, 0.7)",
              borderColor: "rgba(255, 159, 64, 1)",
              fill: true,
              tension: 0.2,
            },
          ],
        });
      });
  }, [selectedProduct, prodStart, prodEnd, prodChartType]);

const dashboardStyles = {
  container: {
    maxWidth: 900,
    margin: "auto",
    padding: 24,
    fontFamily: "Segoe UI, Tahoma, Geneva, Verdana, sans-serif",
    background: "#f8fafd",
    borderRadius: 16,
    boxShadow: "0 2px 16px 0 #0001",
    minHeight: "100vh"
  },
  section: {
    marginTop: 40,
    padding: "24px 0 0 0",
    borderTop: "1px solid #e0e0e0"
  },
  controls: {
    display: "flex",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 18,
    alignItems: "center"
  },
  select: {
    padding: "7px 12px",
    borderRadius: 6,
    border: "1px solid #d0d7de",
    background: "#fff",
    fontSize: 15,
    minWidth: 120
  },
  input: {
    padding: "7px 12px",
    borderRadius: 6,
    border: "1px solid #d0d7de",
    background: "#fff",
    fontSize: 15
  },
  chartBox: {
    background: "#fff",
    borderRadius: 12,
    padding: 18,
    boxShadow: "0 1px 8px 0 #0001",
    marginBottom: 24
  },
  h2: {
    fontWeight: 600,
    color: "#1a202c",
    marginBottom: 10
  }
};

// ...inside your component:
return (
  <div style={dashboardStyles.container}>
    <h2 style={dashboardStyles.h2}>إحصائيات الطلبات</h2>
    <div style={dashboardStyles.controls}>
      <select style={dashboardStyles.select} value={mode} onChange={e => setMode(e.target.value)}>
        <option value="days">حسب الأيام</option>
        <option value="months">حسب الأشهر</option>
      </select>
      {mode === "days" ? (
        <>
          <input style={dashboardStyles.input} type="date" value={start} onChange={e => setStart(e.target.value)} />
          <input style={dashboardStyles.input} type="date" value={end} onChange={e => setEnd(e.target.value)} />
        </>
      ) : (
        <>
          <input style={dashboardStyles.input} type="month" value={start} onChange={e => setStart(e.target.value)} />
          <input style={dashboardStyles.input} type="month" value={end} onChange={e => setEnd(e.target.value)} />
        </>
      )}
      <select style={dashboardStyles.select} value={chartType} onChange={e => setChartType(e.target.value)}>
        <option value="bar">Bar</option>
        <option value="line">Line</option>
      </select>
    </div>
    <div style={dashboardStyles.chartBox}>
      {chartData.labels.length > 0 ? (
        chartType === "bar" ? <Bar data={chartData} /> : <Line data={chartData} />
      ) : (
        <p>اختر الفترة الزمنية لعرض الإحصائيات</p>
      )}
    </div>

    <div style={dashboardStyles.section}>
      <h2 style={dashboardStyles.h2}>أكثر المنتجات مبيعًا</h2>
      <div style={dashboardStyles.controls}>
        <select style={dashboardStyles.select} value={topMode} onChange={e => setTopMode(e.target.value)}>
          <option value="days">حسب الأيام</option>
          <option value="months">حسب الأشهر</option>
        </select>
        {topMode === "days" ? (
          <>
            <input style={dashboardStyles.input} type="date" value={topStart} onChange={e => setTopStart(e.target.value)} />
            <input style={dashboardStyles.input} type="date" value={topEnd} onChange={e => setTopEnd(e.target.value)} />
          </>
        ) : (
          <>
            <input style={dashboardStyles.input} type="month" value={topStart} onChange={e => setTopStart(e.target.value)} />
            <input style={dashboardStyles.input} type="month" value={topEnd} onChange={e => setTopEnd(e.target.value)} />
          </>
        )}
        <select style={dashboardStyles.select} value={topChartType} onChange={e => setTopChartType(e.target.value)}>
          <option value="bar">Bar</option>
          <option value="line">Line</option>
        </select>
      </div>
      <div style={dashboardStyles.chartBox}>
        {topProductsData.labels.length > 0 ? (
          topChartType === "bar" ? <Bar data={topProductsData} /> : <Line data={topProductsData} />
        ) : (
          <p>اختر الفترة الزمنية لعرض الإحصائيات</p>
        )}
      </div>
    </div>

    <div style={dashboardStyles.section}>
      <h2 style={dashboardStyles.h2}>إحصائيات منتج محدد حسب الأيام</h2>
      <div style={dashboardStyles.controls}>
        <select
          style={dashboardStyles.select}
          value={selectedProduct}
          onChange={e => setSelectedProduct(e.target.value)}
        >
          <option value="">اختر منتجًا</option>
          {productsList.map((prod) => (
            <option key={prod._id} value={prod._id}>
              {prod.name}
            </option>
          ))}
        </select>
        <input
          style={dashboardStyles.input}
          type="date"
          value={prodStart}
          onChange={e => setProdStart(e.target.value)}
        />
        <input
          style={dashboardStyles.input}
          type="date"
          value={prodEnd}
          onChange={e => setProdEnd(e.target.value)}
        />
        <select
          style={dashboardStyles.select}
          value={prodChartType}
          onChange={e => setProdChartType(e.target.value)}
        >
          <option value="bar">Bar</option>
          <option value="line">Line</option>
        </select>
      </div>
      <div style={dashboardStyles.chartBox}>
        {prodChartData.labels.length > 0 ? (
          prodChartType === "bar" ? <Bar data={prodChartData} /> : <Line data={prodChartData} />
        ) : (
          <p>اختر منتجًا وفترة زمنية لعرض الإحصائيات</p>
        )}
      </div>
    </div>
  </div>
);
}

export default Dashboardnotinstore;
