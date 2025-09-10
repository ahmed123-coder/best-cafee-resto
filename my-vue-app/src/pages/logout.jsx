import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/login.css";

const Logout = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // حذف التوكن وبيانات المستخدم
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    // توجيه المستخدم إلى صفحة تسجيل الدخول أو الرئيسية
    navigate("/login"); // أو "/"
  }, [navigate]);

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h2>🚪 جاري تسجيل الخروج...</h2>
    </div>
  );
};

export default Logout;
