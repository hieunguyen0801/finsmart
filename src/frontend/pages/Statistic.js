import "./Statistic.css";
import { useNavigate } from "react-router-dom";
import React, { useState, useEffect } from "react";
import CryptoJS from "crypto-js";
import supabase from "../../database/supabase";
import { Pie, Bar, Line } from "react-chartjs-2";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { FaCalendarAlt } from "react-icons/fa";

const SECRET_KEY = process.env.REACT_APP_SECRET_KEY;
const encryptedUserId = localStorage.getItem("user_id");
let user_id = 0;
if (encryptedUserId && SECRET_KEY) {
  const bytes = CryptoJS.AES.decrypt(encryptedUserId, SECRET_KEY);
  user_id = parseInt(bytes.toString(CryptoJS.enc.Utf8), 10);
}

function Statistic() {
  const navigate = useNavigate();
  const handleHome = () => navigate("/home");
  const handleTransaction = () => navigate("/transaction");
  const handleAI = () => navigate("/ai");
  const handleProfile = () => navigate("/profile");
  const handleEconomical = () => navigate("/economical");
  const handlePreodic = () => navigate("/preodic");

  const [pieData, setPieData] = useState(null);
  const [barData, setBarData] = useState(null);
  const [lineData, setLineData] = useState(null);

  // Filter state
  const [pieFilter, setPieFilter] = useState({ from: null, to: null });
  const [barFilter, setBarFilter] = useState({ from: null, to: null });
  const [lineFilter, setLineFilter] = useState({ from: null, to: null });

  // Popup show/hide state
  const [showPieFilter, setShowPieFilter] = useState(false);
  const [showBarFilter, setShowBarFilter] = useState(false);
  const [showLineFilter, setShowLineFilter] = useState(false);

  // Temp filter state for popup
  const [tempPieFilter, setTempPieFilter] = useState({ from: null, to: null });
  const [tempBarFilter, setTempBarFilter] = useState({ from: null, to: null });
  const [tempLineFilter, setTempLineFilter] = useState({
    from: null,
    to: null,
  });

  useEffect(() => {
    fetchStatistic();
    // eslint-disable-next-line
  }, [pieFilter, barFilter, lineFilter]);

  const fetchStatistic = async () => {
    if (!user_id) return;

    const expenseCategories = [
      "ăn uống",
      "mua sắm",
      "sinh hoạt",
      "giải trí",
      "di chuyển",
      "học tập",
      "thể thao",
      "công việc",
      "khác",
    ];

    // Pie chart (expense by category)
    let expenseQuery = supabase
      .from("transactions")
      .select("category, amount, created_at")
      .eq("user_id", user_id);
    if (pieFilter.from)
      expenseQuery = expenseQuery.gte(
        "created_at",
        pieFilter.from.toISOString()
      );
    if (pieFilter.to) {
      const endOfDay = new Date(pieFilter.to);
      endOfDay.setHours(23, 59, 59, 999); // ✅ bao gồm cả ngày đó
      expenseQuery = expenseQuery.lte("created_at", endOfDay.toISOString());
    }
    const { data: expenseData, error: expenseError } = await expenseQuery;
    if (expenseError)
      return console.error("Lỗi lấy dữ liệu chi tiêu:", expenseError);

    const categorySummary = {};
    expenseData.forEach((item) => {
      const normalizedCategory = item.category?.toLowerCase() || "";
      const matchedCategory = expenseCategories.find(
        (cat) => cat.toLowerCase() === normalizedCategory
      );
    
      const cat = matchedCategory || "Khác";
      categorySummary[cat] = (categorySummary[cat] || 0) + item.amount;
    });
    
    setPieData({
      labels: Object.keys(categorySummary),
      datasets: [
        {
          label: "Tổng chi tiêu",
          data: Object.values(categorySummary),
          backgroundColor: [
            "#ff6384",
            "#36a2eb",
            "#ffce56",
            "#4bc0c0",
            "#9966ff",
            "#ff9f40",
            "#8bc34a",
            "#e91e63",
            "#607d8b",
          ],
        },
      ],
    });

    // Bar chart (income & expense by month)
    let incomeQuery = supabase
      .from("income")
      .select("amount, created_at")
      .eq("user_id", user_id);
    if (barFilter.from)
      incomeQuery = incomeQuery.gte("created_at", barFilter.from.toISOString());
    if (barFilter.to) {
      const endOfDay = new Date(barFilter.to);
      endOfDay.setHours(23, 59, 59, 999);
      incomeQuery = incomeQuery.lte("created_at", endOfDay.toISOString());
    }

    let expenseQuery2 = supabase
      .from("transactions")
      .select("amount, created_at")
      .eq("user_id", user_id);
    if (barFilter.from)
      expenseQuery2 = expenseQuery2.gte(
        "created_at",
        barFilter.from.toISOString()
      );
    if (barFilter.to) {
      const endOfDay = new Date(barFilter.to);
      endOfDay.setHours(23, 59, 59, 999);
      expenseQuery2 = expenseQuery2.lte("created_at", endOfDay.toISOString());
    }

    const { data: incomeData, error: incomeError } = await incomeQuery;
    const { data: expenseData2, error: expenseError2 } = await expenseQuery2;
    if (incomeError || expenseError2)
      return console.error(
        "Lỗi dữ liệu thu/chi:",
        incomeError || expenseError2
      );

    const groupByMonth = (data) => {
      const result = {};
      data.forEach((item) => {
        const date = new Date(item.created_at);
        const key = `${date.getFullYear()}-${(date.getMonth() + 1)
          .toString()
          .padStart(2, "0")}`;
        result[key] = (result[key] || 0) + item.amount;
      });
      return result;
    };

    const incomeByMonth = groupByMonth(incomeData);
    const expenseByMonth = groupByMonth(expenseData2);
    const allMonths = Array.from(
      new Set([...Object.keys(incomeByMonth), ...Object.keys(expenseByMonth)])
    ).sort();

    setBarData({
      labels: allMonths,
      datasets: [
        {
          label: "Thu nhập",
          backgroundColor: "#77dd77",
          data: allMonths.map((m) => incomeByMonth[m] || 0),
        },
        {
          label: "Chi tiêu",
          backgroundColor: "#ef5350",
          data: allMonths.map((m) => expenseByMonth[m] || 0),
        },
      ],
    });

    // Line chart (balance fluctuation)
    let incomeQueryLine = supabase
      .from("income")
      .select("amount, created_at")
      .eq("user_id", user_id);
    if (lineFilter.from)
      incomeQueryLine = incomeQueryLine.gte(
        "created_at",
        lineFilter.from.toISOString()
      );
    if (lineFilter.to)
      incomeQueryLine = incomeQueryLine.lte(
        "created_at",
        lineFilter.to.toISOString()
      );

    let expenseQueryLine = supabase
      .from("transactions")
      .select("amount, created_at")
      .eq("user_id", user_id);
    if (lineFilter.from)
      expenseQueryLine = expenseQueryLine.gte(
        "created_at",
        lineFilter.from.toISOString()
      );
    if (lineFilter.to)
      expenseQueryLine = expenseQueryLine.lte(
        "created_at",
        lineFilter.to.toISOString()
      );

    const { data: incomeDataLine, error: incomeErrorLine } =
      await incomeQueryLine;
    const { data: expenseDataLine, error: expenseErrorLine } =
      await expenseQueryLine;
    if (incomeErrorLine || expenseErrorLine)
      return console.error(
        "Lỗi dữ liệu thu/chi line:",
        incomeErrorLine || expenseErrorLine
      );

    const incomeByMonthLine = groupByMonth(incomeDataLine);
    const expenseByMonthLine = groupByMonth(expenseDataLine);
    const allMonthsLine = Array.from(
      new Set([
        ...Object.keys(incomeByMonthLine),
        ...Object.keys(expenseByMonthLine),
      ])
    ).sort();

    let balance = 0;
    const balanceMap = {};
    allMonthsLine.forEach((m) => {
      balance += (incomeByMonthLine[m] || 0) - (expenseByMonthLine[m] || 0);
      balanceMap[m] = balance;
    });
    setLineData({
      labels: allMonthsLine,
      datasets: [
        {
          label: "Số dư ví",
          data: allMonthsLine.map((m) => balanceMap[m]),
          borderColor: "#388e3c",
          backgroundColor: "#388e3c",
          fill: false,
        },
      ],
    });
  };

  // Popup filter component
  const renderFilterPopup = (
    tempFilter,
    setTempFilter,
    setFilter,
    setShowFilter
  ) => (
    <div className="filter-popup">
      <DatePicker
        selected={tempFilter.from}
        onChange={(date) => setTempFilter((prev) => ({ ...prev, from: date }))}
        placeholderText="Từ ngày"
        dateFormat="yyyy-MM-dd"
        isClearable
      />
      <DatePicker
        selected={tempFilter.to}
        onChange={(date) => setTempFilter((prev) => ({ ...prev, to: date }))}
        placeholderText="Đến ngày"
        dateFormat="yyyy-MM-dd"
        isClearable
      />
      <div className="filter-actions">
        <button
          onClick={() => {
            setFilter(tempFilter);
            setShowFilter(false);
          }}
        >
          Xác nhận
        </button>
        <button
          onClick={() => {
            setFilter({ from: null, to: null });
            setTempFilter({ from: null, to: null });
            setShowFilter(false);
          }}
        >
          Xoá bộ lọc
        </button>
      </div>
    </div>
  );

  // Chart render with popup filter
  const renderChart = (
    ChartComponent,
    data,
    title,
    filter,
    setFilter,
    showFilter,
    setShowFilter,
    tempFilter,
    setTempFilter
  ) => (
    <div className="statistic-cell">
      <div className="chart-header">
        <span className="chart-title">{title}</span>
        <button
          className="calendar-btn"
          onClick={() => {
            setTempFilter(filter);
            setShowFilter(true);
          }}
        >
          <FaCalendarAlt />
        </button>
      </div>
      {showFilter &&
        renderFilterPopup(tempFilter, setTempFilter, setFilter, setShowFilter)}
      {data ? (
        <ChartComponent
          data={data}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { position: "bottom", labels: { padding: 15 } },
              title: { display: false },
            },
            layout: { padding: 10 },
          }}
        />
      ) : (
        <p>Đang tải dữ liệu...</p>
      )}
    </div>
  );

  return (
    <div className="bodyStatistic">
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
          <button className="nav-btn eco">
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

      <div className="mainStatistic">
        <div className="statistic-grid">
          {renderChart(
            Pie,
            pieData,
            "Chi tiêu theo danh mục",
            pieFilter,
            setPieFilter,
            showPieFilter,
            setShowPieFilter,
            tempPieFilter,
            setTempPieFilter
          )}
          {renderChart(
            Bar,
            barData,
            "Thu chi theo tháng",
            barFilter,
            setBarFilter,
            showBarFilter,
            setShowBarFilter,
            tempBarFilter,
            setTempBarFilter
          )}

          {/* Thêm đoạn này để line chart chiếm hàng dưới */}
          <div className="statistic-cell statistic-cell-wide">
            <div className="chart-header">
              <span className="chart-title">Số dư ví theo thời gian</span>
              <button
                className="calendar-btn"
                onClick={() => {
                  setTempLineFilter(lineFilter);
                  setShowLineFilter(true);
                }}
              >
                <FaCalendarAlt />
              </button>
            </div>
            {showLineFilter &&
              renderFilterPopup(
                tempLineFilter,
                setTempLineFilter,
                setLineFilter,
                setShowLineFilter
              )}
            {lineData ? (
              <Line
                data={lineData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { position: "bottom", labels: { padding: 5 } },
                    title: { display: false },
                  },
                  layout: { padding: 10 },
                }}
              />
            ) : (
              <p>Đang tải dữ liệu...</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
export default Statistic;
