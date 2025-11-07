import React, { useState } from "react";
import "./UpdateProfile.css";
import { useNavigate } from "react-router-dom";
import supabase from "../../database/supabase";
import CryptoJS from "crypto-js";

const SECRET_KEY = process.env.REACT_APP_SECRET_KEY;

function UpdateProfile() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: "",
    dob: "",
    email: "",
    phone: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();

    const encryptedUserId = localStorage.getItem("user_id");
    if (!encryptedUserId) {
      alert("Không tìm thấy user_id. Vui lòng đăng nhập lại.");
      navigate("/login");
      return;
    }

    let userId = "";
    try {
      const bytes = CryptoJS.AES.decrypt(encryptedUserId, SECRET_KEY);
      userId = bytes.toString(CryptoJS.enc.Utf8);
      if (!userId) throw new Error("Không giải mã được user_id");
    } catch (err) {
      console.error("Giải mã user_id thất bại:", err);
      alert("Lỗi xác thực. Vui lòng đăng nhập lại.");
      navigate("/login");
      return;
    }

    const updates = {};
    if (formData.fullName) updates.full_name = formData.fullName;
    if (formData.dob) updates.date_of_birth = formData.dob;
    if (formData.email) updates.email = formData.email;
    if (formData.phone) updates.phone_number = formData.phone;

    if (Object.keys(updates).length === 0) {
      alert("Không có thông tin nào để cập nhật.");
      return;
    }

    const { error } = await supabase
      .from("users")
      .update(updates)
      .eq("user_id", userId)
      .select();

    if (error) {
      console.error("Cập nhật thất bại:", error);
      alert("Có lỗi xảy ra khi cập nhật thông tin.");
    } else {
      alert("Cập nhật thành công!");
      navigate("/profile");
    }
  };

  return (
    <div className="register-page-card">
      <div className="register-page-container">
        <form className="register-form" onSubmit={handleUpdate}>
          <div className="input-row">
            <div className="input-group">
              <label>Họ Và Tên</label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="Nguyễn Anh Tuấn"
              />
            </div>
            <div className="input-group">
              <label>Date Of Birth</label>
              <input
                type="date"
                name="dob"
                value={formData.dob}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="input-row">
            <div className="input-group">
              <label>Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="example@example.com"
              />
            </div>
            <div className="input-group">
              <label>Mobile Number</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+123 456 789"
              />
            </div>
          </div>

          <button type="submit" className="register-button">
            Cập nhật
          </button>
          <button
            type="button"
            className="back-button"
            onClick={() => navigate("/profile")}
          >
            Quay Lại
          </button>
        </form>
      </div>
    </div>
  );
}

export default UpdateProfile;
