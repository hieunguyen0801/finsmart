import React from "react";
import "./ForgotPasswordPage.css";
import { useNavigate } from "react-router-dom";

const ForgotPasswordPage = () => {
  const navigate = useNavigate();

  const handleForgotPassword = (e) => {
    e.preventDefault();
    // Xử lý quên mật khẩu ở đây
    console.log("Gửi yêu cầu khôi phục mật khẩu...");
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>Quên Mật Khẩu</h2>
        <form onSubmit={handleForgotPassword}>
          <div className="input-group">
            <label>Email</label>
            <input type="email" placeholder="nhập email của bạn" required />
          </div>
          <button type="submit" className="login-button btn">
            Gửi Yêu Cầu
          </button>
        </form>
        <p onClick={() => navigate("/login")} style={{ cursor: "pointer" }}>
          Quay lại đăng nhập
        </p>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
