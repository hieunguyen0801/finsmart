import "./Economical.css";
import { useNavigate } from "react-router-dom";
import React, { useState, useEffect } from "react";
import CryptoJS from "crypto-js";
import supabase from "../../database/supabase";

const SECRET_KEY = process.env.REACT_APP_SECRET_KEY;
const encryptedUserId = localStorage.getItem("user_id");
let user_id = 0;

if (encryptedUserId) {
  const bytes = CryptoJS.AES.decrypt(encryptedUserId, SECRET_KEY);
  user_id = parseInt(bytes.toString(CryptoJS.enc.Utf8), 10);
}

function Economical() {
  const navigate = useNavigate();
  const handleHome = () => navigate("/home");
  const handleTransaction = () => navigate("/transaction");
  const handleAI = () => navigate("/ai");
  const handleProfile = () => navigate("/profile");
  const handlePreodic = () => navigate("/preodic");
  const handleStatistic = () => navigate("/statistic");

  const [goals, setGoals] = useState([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [currentGoal, setCurrentGoal] = useState(null);
  const [formData, setFormData] = useState({
    target_name: "",
    target_amount: "",
    current_amount: "",
    deadline: "",
  });
  const [amount, setAmount] = useState();
  const [filterType, setFilterType] = useState("Tất cả");
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    fetchGoals();
  }, []);

  useEffect(() => {
    const now = new Date();

    const oneWeekFromNow = new Date();
    oneWeekFromNow.setDate(now.getDate() + 7);

    const upcomingDeadlines = goals.filter((goal) => {
      const deadline = new Date(goal.deadline);
      return deadline > now && deadline <= oneWeekFromNow;
    });

    const overdueGoals = goals.filter((goal) => {
      const deadline = new Date(goal.deadline);
      return deadline < now && goal.status === "pending";
    });

    setNotifications([...upcomingDeadlines, ...overdueGoals]);
  }, [goals]);

  const fetchGoals = async () => {
    try {
      const { data, error } = await supabase
        .from("economical")
        .select("*")
        .eq("user_id", user_id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setGoals(data || []);
    } catch (error) {
      console.error("Error fetching goals:", error);
    }
  };


  const handleInputChange = (e) => {
    const { name, value } = e.target;

    // Validate số tiền không âm
    if (name.includes("amount")) {
      const numericValue = Math.max(0, parseFloat(value) || 0);
      setFormData({ ...formData, [name]: numericValue });
      return;
    }

    // Validate ngày không trong quá khứ
    if (name === "deadline") {
      const selectedDate = new Date(value);
      selectedDate.setHours(0, 0, 0, 0);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (selectedDate < today) {
        alert("Ngày hạn không thể là ngày trong quá khứ");
        return;
      }
    }

    setFormData({ ...formData, [name]: value });
  };

  const handleAddGoal = async () => {
    try {
      // Validate input
      if (formData.target_amount <= 0) {
        alert("Số tiền mục tiêu phải lớn hơn 0");
        return;
      }

      const deadlineDate = new Date(formData.deadline);
      deadlineDate.setHours(0, 0, 0, 0);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (deadlineDate < today) {
        alert("Ngày hạn không thể là ngày trong quá khứ");
        return;
      }

      const newGoal = {
        user_id,
        target_name: formData.target_name,
        target_amount: formData.target_amount,
        current_amount: formData.current_amount,
        deadline: new Date(formData.deadline).toISOString(),
        status: "pending",
      };

      const { data, error } = await supabase
        .from("economical")
        .insert([newGoal])
        .select();

      if (error) throw error;

      setGoals([data[0], ...goals]);
      setIsAddModalOpen(false);
      resetForm();
    } catch (error) {
      console.error("Error adding goal:", error);
    }
  };

  const handleEditGoal = async () => {
    if (!currentGoal) return;
    const deadlineDate = new Date(formData.deadline);
    const now = new Date();

    // Kiểm tra mục tiêu đã quá hạn chưa
    if (
      new Date(currentGoal.deadline) < now &&
      currentGoal.status === "pending"
    ) {
      alert("Không thể chỉnh sửa mục tiêu đã quá hạn");
      return;
    }

    // Kiểm tra ngày hạn mới
    if (deadlineDate < now) {
      alert("Ngày hạn không thể là ngày trong quá khứ");
      return;
    }

    // Tiếp tục cập nhật
    try {
      const updatedGoal = {
        target_name: formData.target_name,
        target_amount: formData.target_amount,
        deadline: deadlineDate.toISOString(),
      };

      const { error } = await supabase
        .from("economical")
        .update(updatedGoal)
        .eq("id", currentGoal.id);

      if (error) throw error;

      setGoals(
        goals.map((goal) =>
          goal.id === currentGoal.id ? { ...goal, ...updatedGoal } : goal
        )
      );
      setIsEditModalOpen(false);
      resetForm();
    } catch (error) {
      console.error("Error updating goal:", error);
      alert("Có lỗi xảy ra khi cập nhật mục tiêu");
    }
  };

  const handleDeleteGoal = async (goalId) => {
    if (!window.confirm("Bạn có chắc muốn xóa mục tiêu này?")) return;
    try {
      const { error } = await supabase
        .from("economical")
        .delete()
        .eq("id", goalId);

      if (error) throw error;

      // Cập nhật lại danh sách goals sau khi xóa
      alert("Xóa mục tiêu thành công");
      setGoals(goals.filter((goal) => goal.id !== goalId));
    } catch (error) {
      console.error("Lỗi khi xóa mục tiêu:", error);
      alert("Có lỗi xảy ra khi xóa mục tiêu");
    }
  };

  const handleDeposit = async () => {
    if (!currentGoal || amount <= 0) return;

    // Kiểm tra mục tiêu đã quá hạn chưa
    if (
      new Date(currentGoal.deadline) < new Date() &&
      currentGoal.status === "pending"
    ) {
      alert("Không thể thêm tiền cho mục tiêu đã quá hạn");
      return;
    }

    try {
      const newAmount = currentGoal.current_amount + amount;
      const newStatus =
        newAmount >= currentGoal.target_amount
          ? "completed"
          : currentGoal.status;

      const { error } = await supabase
        .from("economical")
        .update({ current_amount: newAmount, status: newStatus })
        .eq("id", currentGoal.id);

      if (error) throw error;

      setGoals(
        goals.map((goal) =>
          goal.id === currentGoal.id
            ? { ...goal, current_amount: newAmount, status: newStatus }
            : goal
        )
      );
      setIsDepositModalOpen(false);
      setAmount(0);
    } catch (error) {
      console.error("Error depositing to goal:", error);
    }
  };

  const resetForm = () => {
    setFormData({
      target_name: "",
      target_amount: "",
      current_amount: "",
      deadline: new Date().toISOString().slice(0, 10),
    });
    setCurrentGoal(null);
  };

  const openEditModal = (goal) => {
    setCurrentGoal(goal);
    setFormData({
      target_name: goal.target_name,
      target_amount: goal.target_amount,
      current_amount: goal.current_amount,
      deadline: new Date(goal.deadline).toISOString().slice(0, 10),
    });
    setIsEditModalOpen(true);
  };

  const openDepositModal = (goal) => {
    setCurrentGoal(goal);
    setIsDepositModalOpen(true);
  };

  const calculateProgress = (current, target) => {
    return Math.min(Math.round((current / target) * 100), 100);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN").format(amount);
  };

  const filteredGoals = goals.filter((goal) => {
    if (filterType === "Hiện tại") {
      return goal.status === "pending";
    } else if (filterType === "Hoàn thành") {
      return goal.status === "completed";
    }
    return true;
  });

  return (
    <div className="bodyEco">
      <div className="sidebarhome">
        <div className="logo">
          <img src="Soucre/Logo.png" alt="Logo FinSmart" />
          <span className="logo-text">FinSmart</span>
        </div>
        <nav>
          <button className="nav-btn home" onClick={handleHome}>
            <img src="Soucre/Dashboard.png" alt="Trang chủ" />
            <span className="nav-label">Trang chủ</span>
          </button>
          <button className="nav-btn add" onClick={handleTransaction}>
            <img src="Soucre/AddTransaction.png" alt="Thêm Giao dịch" />
            <span className="nav-label">Giao dịch</span>
          </button>
          <button className="nav-btn eco" onClick={handlePreodic}>
            <img src="Soucre/preodic-icon.png" alt="Tiết kiệm" />
            <span className="nav-label">Định kỳ</span>
          </button>
          <button className="nav-btn eco" onClick={handleStatistic}>
            <img src="Soucre/statistic.png" alt="Thống kê" />
            <span className="nav-label">Thống kê</span>
          </button>
          <button className="nav-btn eco">
            <img src="Soucre/economy-icon.png" alt="Tiết kiệm" />
            <span className="nav-label">Tiết kiệm</span>
          </button>
          <button className="nav-btn AI" onClick={handleAI}>
            <img src="Soucre/AI.png" alt="Chatbot" />
            <span className="nav-label">Chatbot</span>
          </button>
          <button className="nav-btn user" onClick={handleProfile}>
            <img src="Soucre/Logout.png" alt="Đăng xuất" />
            <span className="nav-label">Thông tin cá nhân</span>
          </button>
        </nav>
      </div>

      <div className="mainEco">
        <div className="saving-goals-box">
          <div className="header-row">
            <div className="title-filter">
              <h2>Tiết kiệm</h2>
              <div className="dropdown-filter">
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                >
                  <option value="Tất cả">Tất cả</option>
                  <option value="Hiện tại">Hiện tại</option>
                  <option value="Hoàn thành">Hoàn thành</option>
                </select>
              </div>
            </div>
            <button
              className="add-goal-btn"
              onClick={() => setIsAddModalOpen(true)}
            >
              +
            </button>
          </div>

          <div className="goals-grid">
            {filteredGoals.length > 0 ? (
              filteredGoals.map((goal) => (
                <div key={goal.id} className="goal-card">
                  <div className="goal-header">
                    <span>{goal.target_name}</span>
                    <div className="goal-header">
                      <button
                        className="edit-btn"
                        onClick={() => openEditModal(goal)}
                      >
                        ✎
                      </button>
                      <button
                        className="delete-btn"
                        onClick={() => handleDeleteGoal(goal.id)}
                      >
                        X
                      </button>
                    </div>
                  </div>
                  <div
                    className="progress-circle"
                    onClick={() => openDepositModal(goal)}
                  >
                    <span>
                      {calculateProgress(
                        goal.current_amount,
                        goal.target_amount
                      )}
                      %
                    </span>
                  </div>
                  <div className="goal-details">
                    <p className="goal-amount">
                      <span className="current-amount">
                        {formatCurrency(goal.current_amount)}
                      </span>
                      <span className="separator">/</span>
                      <span className="target-amount">
                        {formatCurrency(goal.target_amount)} VND
                      </span>
                    </p>
                    <p className="goal-deadline">
                      <span className="deadline-label">Hạn:</span>{" "}
                      {new Date(goal.deadline).toLocaleDateString("vi-VN")}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <p>Bạn chưa có mục tiêu nào. Tạo mục tiêu mới ngay!</p>
              </div>
            )}
          </div>
        </div>

        <div className="reminder-box">
          <h3>Nhắc nhở</h3>
          <div className="reminder-list">
            {notifications.length > 0 ? (
              notifications.map((notification, index) => {
                const isOverdue =
                  new Date(notification.deadline) < new Date() &&
                  notification.status === "pending";
                return (
                  <div
                    key={index}
                    className="reminder-item"
                    style={{ color: isOverdue ? "red" : "black" }}
                  >
                    <p>
                      Mục tiêu "<b>{notification.target_name}</b>"{" "}
                      {isOverdue ? "đã quá hạn" : "sắp đến hạn"} vào{" "}
                      {new Date(notification.deadline).toLocaleDateString(
                        "vi-VN"
                      )}
                    </p>
                  </div>
                );
              })
            ) : (
              <p className="no-notifications">
                Không có mục tiêu nào cần chú ý
              </p>
            )}
          </div>
        </div>

        {/* Add Goal Modal */}
        {isAddModalOpen && (
          <div className="modal-overlay">
            <div className="modal-container">
              <div className="modal-header">
                <h2>Tạo Mục tiêu Mới</h2>
                <button
                  className="close-btn"
                  onClick={() => setIsAddModalOpen(false)}
                >
                  ×
                </button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label>Tên mục tiêu</label>
                  <input
                    type="text"
                    name="target_name"
                    value={formData.target_name}
                    onChange={handleInputChange}
                    placeholder="Nhập tên mục tiêu"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Số tiền mục tiêu (VND)</label>
                  <input
                    type="number"
                    name="target_amount"
                    value={formData.target_amount}
                    onChange={handleInputChange}
                    placeholder="Nhập số tiền mục tiêu"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Số tiền ban đầu (VND)</label>
                  <input
                    type="number"
                    name="current_amount"
                    value={formData.current_amount}
                    onChange={handleInputChange}
                    placeholder="Nhập số tiền ban đầu"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Ngày hạn</label>
                  <input
                    type="date"
                    name="deadline"
                    value={formData.deadline}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  className="cancel-btn"
                  onClick={() => setIsAddModalOpen(false)}
                >
                  Hủy
                </button>
                <button className="save-btn" onClick={handleAddGoal}>
                  Lưu
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Goal Modal */}
        {isEditModalOpen && (
          <div className="modal-overlay">
            <div className="modal-container">
              <div className="modal-header">
                <h2>Chỉnh sửa Mục tiêu</h2>
                <button
                  className="close-btn"
                  onClick={() => setIsEditModalOpen(false)}
                >
                  ×
                </button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label>Tên mục tiêu</label>
                  <input
                    type="text"
                    name="target_name"
                    value={formData.target_name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Số tiền mục tiêu (VND)</label>
                  <input
                    type="number"
                    name="target_amount"
                    value={formData.target_amount}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Ngày hạn</label>
                  <input
                    type="date"
                    name="deadline"
                    value={formData.deadline}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  className="cancel-btn"
                  onClick={() => setIsEditModalOpen(false)}
                >
                  Hủy
                </button>
                <button className="save-btn" onClick={handleEditGoal}>
                  Lưu
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Deposit Modal */}
        {isDepositModalOpen && currentGoal && (
          <div className="modal-overlay">
            <div className="modal-container">
              <div className="modal-header">
                <h2>Thêm Tiết kiệm</h2>
                <button
                  className="close-btn"
                  onClick={() => setIsDepositModalOpen(false)}
                >
                  ×
                </button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label>Mục tiêu</label>
                  <select
                    value={currentGoal.id}
                    onChange={(e) => {
                      const selected = goals.find(
                        (goal) => goal.id === parseInt(e.target.value)
                      );
                      setCurrentGoal(selected);
                    }}
                  >
                    {goals.map((goal) => (
                      <option key={goal.id} value={goal.id}>
                        {goal.target_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Số tiền thêm (VND)</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(parseFloat(e.target.value))}
                    placeholder="Nhập số tiền thêm"
                    required
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  className="cancel-btn"
                  onClick={() => setIsDepositModalOpen(false)}
                >
                  Hủy
                </button>
                <button className="save-btn" onClick={handleDeposit}>
                  Thêm
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Economical;
