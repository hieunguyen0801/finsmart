import React, { useState } from "react";
import "./LoginPage.css";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import supabase from "../../database/supabase";
import bcrypt from "bcryptjs";
import CryptoJS from "crypto-js";

const SECRET_KEY = process.env.REACT_APP_SECRET_KEY;

function LoginPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState("");

  const handleTogglePassword = () => {
    setShowPassword(!showPassword);
  };

  const handleLogin = (e) => {
    e.preventDefault();
    async function signIn(username, password) {
      // Lấy user từ bảng "users"
      const { data, error } = await supabase
        .from("users")
        .select("user_id, password_hash")
        .eq("user_name", username)
        .single();

      if (error || !data) {
        alert("Sai tài khoản hoặc mật khẩu!");
        return;
      }

      // Kiểm tra mật khẩu nhập vào có khớp với hash không
      const isMatch = await bcrypt.compare(password, data.password_hash);
      if (isMatch) {
        console.log(`Đăng nhập thành công! Xin chào, ${username}`);
        alert(`Đăng nhập thành công! Xin chào, ${username}`);

        const encryptedUserId = CryptoJS.AES.encrypt(
          data.user_id.toString(),
          SECRET_KEY
        ).toString();
        localStorage.setItem("user_id", encryptedUserId); // Lưu user_id đã mã hóa

        navigate("/home");
        setTimeout(() => window.location.reload(), 100); //load lai cac bien
      } else {
        alert("Sai tài khoản hoặc mật khẩu!");
      }
    }
    signIn(username, password);
  };

  return (
    <div className="login-page-card">
      <div className="login-page-container">
        <form className="login-form" onSubmit={handleLogin}>
          {/* Tài Khoản/Email */}
          <div className="input-group">
            <label>Tài Khoản</label>
            <input
              data-testid="input-account"
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              placeholder="Nhập tài khoản của bạn"
            />
          </div>

          {/* Mật Khẩu (có icon mắt) */}
          <div className="input-group">
            <label htmlFor="password">Mật Khẩu</label>
            <div className="password-wrapper">
              <input
                data-testid="input-password"
                type={showPassword ? "text" : "password"}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Nhập mật khẩu của bạn"
              />
              <span className="password-toggle" onClick={handleTogglePassword}>
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>
          </div>

          {/* Nút Đăng Nhập */}
          <button type="submit" data-testid="login-button" className="login-button">
            Đăng Nhập
          </button>

          {/* Nút Đăng Ký */}
          <button
            type="button"
            className="goback-button"
            onClick={() => navigate("/")}
          >
            Quay Lại
          </button>

          {/* Link Quên Mật Khẩu */}
          <p className="forgot-password">Quên Mật Khẩu</p>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;
