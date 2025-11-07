import "./LandingPage.css";
import { useNavigate } from "react-router-dom";
import React from "react";

const LandingPage = () => {
  const navigate = useNavigate();
  return (
    <div className="login-container">
      <div className="login-card">
        <div className="icon">
          <img src="Soucre/Logo.png" alt="Logo" className="login-logo" />
          <h1 className="app-name">FIN SMART</h1>
        </div>

        <button className="login-button btn" data-testid="login-button" onClick={() => navigate("/login")}>
          Đăng Nhập
        </button>
        <button
          className="register-button btn"
          onClick={() => navigate("/register")}
        >
          Đăng Ký
        </button>
        <p
          className="forgot-password"
          onClick={() => navigate("/home")}
          style={{ cursor: "pointer" }}
        >
          Quên Mật Khẩu
        </p>
      </div>
    </div>
  );
};

export default LandingPage;
