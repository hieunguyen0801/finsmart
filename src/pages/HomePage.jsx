/**
 * HomePage - Main dashboard page
 * Layout-level component that assembles widgets and features for the home page
 */
import React, { useState, useEffect } from "react";
// Import CSS styles for HomePage layout and components
import "../frontend/pages/Home.css";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../shared/hooks";
import { useUser } from "../entities/user";
import { useTransactions } from "../entities/transaction";
import { useBudgets, SpendingLimitsPanel } from "../entities/budget";
import { TransactionList } from "../widgets";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

const HomePage = () => {
  const navigate = useNavigate();
  const { userId } = useAuth();
  const { username, balance, loading: userLoading } = useUser(userId);
  const {
    history,
    chartData,
    chartDataDefault,
    totalIncome: initialTotalIncome,
    totalIncomeDefault,
    totalExpense: initialTotalExpense,
    totalExpenseDefault,
    loading: transactionLoading,
  } = useTransactions(userId);

  // Budget/limit management hook
  const {
    budgets,
    addBudget,
    updateBudget,
    deleteBudget,
    checkAndResetBudgets,
  } = useBudgets(userId);

  const [totalIncome, setTotalIncome] = useState(initialTotalIncome);
  const [totalExpense, setTotalExpense] = useState(initialTotalExpense);

  const [chartStartDate, setChartStartDate] = useState("");
  const [chartEndDate, setChartEndDate] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [filteredChartData, setFilteredChartData] = useState([]);
  const [currentDateTime, setCurrentDateTime] = useState("");

  const loading = userLoading || transactionLoading;

  // Navigation handlers
  const handleTransaction = () => navigate("/transaction");
  const handleAI = () => navigate("/ai");
  const handleProfile = () => navigate("/profile");
  const handleHistory = () => navigate("/history");
  const handleEconomical = () => navigate("/economical");
  const handlePreodic = () => navigate("/preodic");
  const handleStatistic = () => navigate("/statistic");

  // Chart filter handlers
  const handleFilterChart = () => {
    if (!chartStartDate || !chartEndDate) return;

    const start = new Date(chartStartDate);
    const end = new Date(chartEndDate);
    end.setHours(23, 59, 59, 999);

    const filtered = chartData.filter((item) => {
      const [day, month, year] = item.date.split("/");
      const itemDate = new Date(`${year}-${month}-${day}`);
      return itemDate >= start && itemDate <= end;
    });

    setFilteredChartData(filtered);

    const filteredIncomeData = filtered.map((item) => item.income);
    const filteredExpenseData = filtered.map((item) => item.expense);

    const totalIncomeFiltered = filteredIncomeData.reduce(
      (sum, amount) => sum + amount,
      0
    );
    const totalExpenseFiltered = filteredExpenseData.reduce(
      (sum, amount) => sum + amount,
      0
    );

    setTotalIncome(totalIncomeFiltered);
    setTotalExpense(totalExpenseFiltered);
    setShowDatePicker(false);
  };

  const resetChartFilter = () => {
    setChartStartDate("");
    setChartEndDate("");
    setFilteredChartData([]);

    const totalIncomeAll = chartData.reduce(
      (sum, item) => sum + item.income,
      0
    );
    const totalExpenseAll = chartData.reduce(
      (sum, item) => sum + item.expense,
      0
    );

    setTotalIncome(totalIncomeAll);
    setTotalExpense(totalExpenseAll);
    setShowDatePicker(false);
  };

  // Date/time formatting
  const getFormattedDateTime = () => {
    const now = new Date();
    const datePart = now.toLocaleDateString("vi-VN", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    const timePart = now.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
    return `${datePart}, ${timePart}`;
  };

  useEffect(() => {
    setCurrentDateTime(getFormattedDateTime());
    const timer = setInterval(() => {
      setCurrentDateTime(getFormattedDateTime());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Check and reset budgets periodically
  useEffect(() => {
    if (budgets.length > 0) {
      const interval = setInterval(() => {
        checkAndResetBudgets();
      }, 10000); // Check every 10 seconds

      return () => clearInterval(interval);
    }
  }, [budgets, checkAndResetBudgets]);

  return (
    <div className="bodyhome">
      <div className="sidebarhome">
        <div className="logo">
          <img src="Soucre/Logo.png" alt="Logo FinSmart" />
          <span className="logo-text">FinSmart</span>
        </div>
        <nav>
          <button className="nav-btn home">
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
          <button className="nav-btn eco" onClick={handleEconomical}>
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

      <div className="main-content">
        <h1>Xin chào {loading ? "Đang tải..." : username || "Người dùng"}!</h1>
        <div className="balance-card">
          <p>Tổng số dư</p>
          <h2>{loading ? "Đang tải..." : balance}</h2>
        </div>

        <TransactionList history={history} onViewAll={handleHistory} />

        <div className="chart-container">
          <div className="chart-header" style={{ position: "relative" }}>
            <h3>Biểu Đồ Thu Chi</h3>
            <button
              className="calendar-button"
              onClick={() => setShowDatePicker(!showDatePicker)}
            >
              📅
            </button>

            {showDatePicker && (
              <div className="date-picker-popup">
                <label>
                  Từ:
                  <input
                    type="date"
                    value={chartStartDate}
                    onChange={(e) => setChartStartDate(e.target.value)}
                  />
                </label>
                <label>
                  Đến:
                  <input
                    type="date"
                    value={chartEndDate}
                    onChange={(e) => setChartEndDate(e.target.value)}
                  />
                </label>
                <div className="date-picker-buttons">
                  <button onClick={handleFilterChart}>Lọc</button>
                  <button
                    onClick={resetChartFilter}
                    style={{ marginLeft: "8px" }}
                  >
                    Xóa lọc
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="chart-content">
            <div className="chart-image">
              {filteredChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={filteredChartData}>
                    <CartesianGrid stroke="#ccc" strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={() => ""}
                      stroke="#ccc"
                    />
                    <YAxis tickFormatter={() => ""} stroke="#ccc" />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="income"
                      stroke="#4caf50"
                      name="Thu Vào"
                    />
                    <Line
                      type="monotone"
                      dataKey="expense"
                      stroke="#f44336"
                      name="Chi Tiêu"
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={chartDataDefault}>
                    <CartesianGrid stroke="#ccc" strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={() => ""}
                      stroke="#ccc"
                    />
                    <YAxis tickFormatter={() => ""} stroke="#ccc" />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="income"
                      stroke="#4caf50"
                      name="Thu Vào"
                    />
                    <Line
                      type="monotone"
                      dataKey="expense"
                      stroke="#f44336"
                      name="Chi Tiêu"
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="chart-summary">
              {filteredChartData.length > 0 ? (
                <>
                  <div className="summary-item">
                    <img
                      src="Soucre/Income.png"
                      alt="Thu Vào"
                      className="summary-icon"
                    />
                    <div className="income">
                      <p>Thu Vào</p>
                      <h2>{totalIncome.toLocaleString()}₫</h2>
                    </div>
                  </div>
                  <div className="summary-item">
                    <img
                      src="Soucre/Outcome.png"
                      alt="Chi Tiêu"
                      className="summary-icon"
                    />
                    <div className="expense">
                      <p>Chi Tiêu</p>
                      <h2>{totalExpense.toLocaleString()}₫</h2>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="summary-item">
                    <img
                      src="Soucre/Income.png"
                      alt="Thu Vào"
                      className="summary-icon"
                    />
                    <div className="income">
                      <p>Thu Vào</p>
                      <h2>{totalIncomeDefault.toLocaleString()}₫</h2>
                    </div>
                  </div>
                  <div className="summary-item">
                    <img
                      src="Soucre/Outcome.png"
                      alt="Chi Tiêu"
                      className="summary-icon"
                    />
                    <div className="expense">
                      <p>Chi Tiêu</p>
                      <h2>{totalExpenseDefault.toLocaleString()}₫</h2>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="right-panel">
        <p id="currentTime">{currentDateTime}</p>
        <SpendingLimitsPanel
          budgets={budgets}
          onAddBudget={addBudget}
          onUpdateBudget={updateBudget}
          onDeleteBudget={deleteBudget}
        />
      </div>
    </div>
  );
};

export default HomePage;
