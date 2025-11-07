import React, { useState } from "react";
import "./RegisterPage.css";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import supabase from "../../database/supabase";
import bcrypt from "bcryptjs";


function RegisterPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: "",
    dob: "",
    email: "",
    phone: "",
    username: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const createWallet = async (username) => {
    const { data, err } = await supabase
        .from("users")
        .select("user_id")
        .eq("user_name", username)
        .single();

      if (err || !data) {
        alert("Sai tài khoản hoặc mật khẩu!");
        return;
      }
      const userId = data.user_id;
    const { error } = await supabase.from("wallets").insert([
      {
        user_id: userId,
        wallet_name: "Ví chính",
        balance: 0,
      },
    ]);

    if (error) {
      console.error("Error creating wallet:", error);
    } 
  };

  async function handleSignUp(email, password, username, fullName, dob, phone) {

    const { data: existingUser, error: checkError } = await supabase
    .from("users")
    .select("user_id")
    .eq("user_name", username)
    .single();

  if (existingUser) {
    alert("Tên đăng nhập đã tồn tại. Vui lòng chọn tên khác.");
    return;
  }
    // Băm mật khẩu với bcryptjs (10 rounds)
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);
  
    // Lưu user vào Supabase
    const { data, error } = await supabase.from("users").insert([
      {
        email: email,
        password_hash: passwordHash,
        user_name: username,
        full_name: fullName,
        date_of_birth: dob,
        phone_number: phone,
      },
    ]);
  
    if (error) {
      console.error("❌ Đăng ký thất bại:", error.message);
      alert("Đăng ký thất bại");
    } else {
  
      alert("✅ Đăng ký thành công!");
      createWallet(username);
    }
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleTogglePassword = () => {
    setShowPassword(!showPassword);
  };

  const handleToggleConfirmPassword = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    await handleSignUp(
      formData.email,
      formData.password,
      formData.username,
      formData.fullName,
      formData.dob,
      formData.phone
    );
    console.log("Dữ liệu đăng ký:", formData);
  };

  return (
    <div className="register-page-card">
      <div className="register-page-container">
        <form className="register-form" onSubmit={handleRegister}>
          {/* Họ và Tên - Ngày Sinh */}
          <div className="input-row">
            <div className="input-group">
              <label>Họ Và Tên</label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="nguyen anh tuan"
                required
              />
            </div>
            <div className="input-group">
              <label>Date Of Birth</label>
              <input
                type="text"
                name="dob"
                value={formData.dob}
                onChange={handleChange}
                placeholder="DD / MM / YYYY"
                required
              />
            </div>
          </div>

          {/* Email - Số Điện Thoại */}
          <div className="input-row">
            <div className="input-group">
              <label>Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="example@example.com"
                required
              />
            </div>
            <div className="input-group">
              <label>Mobile Number</label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+ 123 456 789"
                required
              />
            </div>
          </div>

          <div className="input-group">
            <label>User Name</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
            />
          </div>
          {/* Mật Khẩu */}
          <div className="input-group">
            <label>Password</label>
            <div className="password-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
              />
              <span className="password-toggle" onClick={handleTogglePassword}>
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>
          </div>

          {/* Xác Nhận Mật Khẩu */}
          <div className="input-group">
            <label>Confirm Password</label>
            <div className="password-wrapper">
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
              <span
                className="password-toggle"
                onClick={handleToggleConfirmPassword}
              >
                {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>
          </div>

          {/* Nút Đăng Ký và Quay Lại */}
          <button type="submit" className="register-button">
            Đăng Ký
          </button>
          <button
            type="button"
            className="back-button"
            onClick={() => navigate("/")}
          >
            Quay Lại
          </button>
        </form>
      </div>
    </div>
  );
}

export default RegisterPage;
