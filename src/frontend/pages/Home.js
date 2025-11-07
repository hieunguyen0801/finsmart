import "./Home.css";
import { useLocation, useNavigate } from "react-router-dom";
import React, { useState, useEffect, useRef } from "react";
import CryptoJS from "crypto-js";
import supabase from "../../database/supabase";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

const SECRET_KEY = process.env.REACT_APP_SECRET_KEY;
const encryptedUserId = localStorage.getItem("user_id");
let user_id = 0;
if (encryptedUserId) {
  const bytes = CryptoJS.AES.decrypt(encryptedUserId, SECRET_KEY);
  user_id = parseInt(bytes.toString(CryptoJS.enc.Utf8), 10);
}

const incomeCategories = [
  { value: "tiền lương", label: "💼 Tiền lương" },
  { value: "bán hàng", label: "🛒 Bán hàng" },
  { value: "cho thuê", label: "🏠 Cho thuê" },
  { value: "tiền thưởng", label: "💵 Tiền thưởng" },
  { value: "đầu tư", label: "📈 Đầu tư" },
  { value: "cổ tức", label: "💰 Cổ tức" },
  { value: "quảng cáo", label: "📢 Thu nhập từ quảng cáo" },
  { value: "đối tác", label: "👫 Tiền thưởng từ đối tác" },
  { value: "tài sản", label: "🏢 Thu nhập từ sở hữu tài sản" },
  { value: "thu động", label: "🏖️ Thu nhập thụ động" },
  { value: "bố mẹ chuyển", label: "👨‍👩‍👧‍👦 Tiền bố mẹ chuyển" },
];

const expenseCategories = [
  { value: "ăn uống", label: "🍔 Ăn uống" },
  { value: "mua sắm", label: "🛍️ Mua sắm" },
  { value: "sinh hoạt", label: "🏡 Sinh hoạt" },
  { value: "giải trí", label: "🎧 Giải trí" },
  { value: "di chuyển", label: "🚗 Di chuyển" },
  { value: "học tập", label: "📚 Học tập" },
  { value: "thể thao", label: "⚽ Thể thao" },
  { value: "công việc", label: "💼 Công việc" },
];

const allCategories = [...incomeCategories, ...expenseCategories];

const categoryIcons = {};
allCategories.forEach((item) => {
  const emoji = item.label.split(" ")[0];
  categoryIcons[item.value.toLowerCase()] = emoji;
});

const fetchUser = async (userId) => {
  const { data, error } = await supabase
    .from("users")
    .select("full_name")
    .eq("user_id", userId)
    .single();

  if (error) {
    console.error("Error fetching user:", error);
    return null;
  }

  return data;
};

const fetchWallet = async (userId) => {
  const { data, error } = await supabase
    .from("wallets")
    .select("balance")
    .eq("user_id", userId)
    .single();

  if (error) {
    console.error("Error fetching wallet:", error);
    return null;
  }

  return data;
};

const fetchHistory = async (userId) => {
  const [incomeRes, transactionRes] = await Promise.all([
    supabase
      .from("income")
      .select("category, amount, created_at")
      .eq("user_id", userId),
    supabase
      .from("transactions")
      .select("category, amount, created_at")
      .eq("user_id", userId),
  ]);

  if (incomeRes.error || transactionRes.error) {
    console.error(
      "Error fetching history:",
      incomeRes.error || transactionRes.error
    );
    return [];
  }

  const incomes = incomeRes.data.map((item) => ({
    ...item,
    type: "income",
  }));

  const transactions = transactionRes.data.map((item) => ({
    ...item,
    type: "transaction",
  }));

  const all = [...incomes, ...transactions].sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at)
  );

  return all.slice(0, 15);
};

function Home() {
  const location = useLocation();
  useEffect(() => {
    console.log("cac");
    console.log(user_id);
  }, [location.pathname]);

  const navigate = useNavigate();
  const handleTransaction = () => {
    navigate("/transaction");
  };
  const handleAI = () => {
    navigate("/ai");
  };
  const handleProfile = () => {
    navigate("/profile");
  };
  const handleHistory = () => {
    navigate("/history");
  };
  const handleEconomical = () => {
    navigate("/economical");
  };
  const handlePreodic = () => {
    navigate("/preodic");
  };
  const handleStatistic = () => {
    navigate("/statistic");
  };

  const formRef = useRef(null);

  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(true);

  const [balance, setBalance] = useState(0);

  const [history, setHistory] = useState([]);

  const [chartData, setChartData] = useState([]);
  const [chartDataDefault, setChartDataDefault] = useState([]);
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalIncomeDefault, setTotalIncomeDefault] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);
  const [totalExpenseDefault, setTotalExpenseDefault] = useState(0);
  const [chartStartDate, setChartStartDate] = useState("");
  const [chartEndDate, setChartEndDate] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [filteredChartData, setFilteredChartData] = useState([]);

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

    // Lọc tổng thu/chi theo ngày đã lọc
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

    // Cập nhật tổng thu/chi sau khi lọc
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

  const [budgets, setBudgets] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);

  const fetchBudgets = async () => {
    try {
      const cached = localStorage.getItem("budgets");
      if (cached) {
        setBudgets(JSON.parse(cached));
      }

      const { data, error } = await supabase
        .from("limit")
        .select("*")
        .eq("user_id", user_id);

      if (error) throw error;

      if (!cached || JSON.stringify(data) !== cached) {
        setBudgets(data);
        localStorage.setItem("budgets", JSON.stringify(data));
      }
    } catch (error) {
      console.error("Lỗi khi lấy dữ liệu hạn mức:", error);
    }
  };

  const handleAddBudgets = async (newBudget) => {
    const { data, error } = await supabase
      .from("limit")
      .insert([
        {
          user_id: user_id,
          limit_category: newBudget.category,
          limit_amount: newBudget.max,
          used: newBudget.current,
          limit_name: newBudget.name,
          limit_time: newBudget.timePeriod,
          start_date: new Date(newBudget.startDate).toISOString(),
        },
      ])
      .select("*");
    if (error) {
      console.error("Loi khi them han muc", error);
    } else {
      setBudgets((prevBudgets) => [...prevBudgets, data[0]]);
      localStorage.setItem("budgets", JSON.stringify([...budgets, data[0]]));
    }
  };

  const handleSave = async (limit_id, updatedData) => {
    const { data, error } = await supabase
      .from("limit")
      .update({
        limit_category: updatedData.category,
        limit_amount: updatedData.max,
        used: updatedData.current,
        limit_name: updatedData.name,
        limit_time: updatedData.timePeriod,
        start_date: new Date(updatedData.startDate).toISOString(),
      })
      .eq("limit_id", limit_id)
      .select();

    if (error) {
      console.error("Lỗi khi cập nhật hạn mức:", error);
    } else {
      const updatedBudgets = budgets.map((budget) =>
        budget.limit_id === limit_id ? { ...budget, ...data[0] } : budget
      );

      setBudgets(updatedBudgets);
      localStorage.setItem("budgets", JSON.stringify(updatedBudgets));

      setShowAddForm(false);
      setEditingBudget(null);
    }
  };

  const handleDelete = async (id) => {
    const { error } = await supabase.from("limit").delete().eq("limit_id", id);

    if (error) {
      console.error("Lỗi khi xóa hạn mức:", error);
    } else {
      const updatedBudgets = budgets.filter((budget) => budget.limit_id !== id);
      setBudgets(updatedBudgets);
      localStorage.setItem("budgets", JSON.stringify(updatedBudgets));
    }
  };

  const checkAndResetBudgets = async () => {
    const now = new Date();

    const updatedBudgets = await Promise.all(
      budgets.map(async (budget) => {
        const startDate = new Date(budget.start_date);
        const endDate = getEndDate(
          new Date(budget.start_date),
          budget.limit_time
        );
        console.log("Now: ", now);
        console.log("EndDate: ", endDate);
        console.log("Now (ms): ", now.getTime());
        console.log("EndDate (ms): ", endDate.getTime());
        console.log("Đã hết hạn? ", now.getTime() >= endDate.getTime());

        if (now >= endDate) {
          console.log("Da het 5 phut");
          // Đã hết chu kỳ => reset
          const newStartDate = new Date();

          const { data, error } = await supabase
            .from("limit")
            .update({
              used: 0,
              start_date: newStartDate.toISOString(),
            })
            .eq("limit_id", budget.limit_id)
            .select();

          if (error) {
            console.error("Lỗi khi reset hạn mức:", error);
            return budget;
          }

          return { ...budget, used: 0, start_date: newStartDate.toISOString() };
        } else {
          return budget;
        }
      })
    );

    setBudgets(updatedBudgets);
    localStorage.setItem("budgets", JSON.stringify(updatedBudgets));
  };

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
  const [currentDateTime, setCurrentDateTime] = useState(
    getFormattedDateTime()
  );
  useEffect(() => {
    const fetchUserData = async () => {
      const userData = await fetchUser(user_id);
      const walletData = await fetchWallet(user_id);
      const historyData = await fetchHistory(user_id);

      if (userData) {
        setUsername(userData.full_name);
      }
      if (walletData) {
        setBalance(walletData.balance);
      }
      if (historyData) {
        setHistory(historyData);
      }

      setLoading(false);
    };
    fetchUserData();

    const fetchChartData = async () => {
      try {
        const { data: incomeDataRaw, error: incomeError } = await supabase
          .from("income")
          .select("amount, created_at")
          .eq("user_id", user_id);

        if (incomeError) throw incomeError;

        const { data: transactionDataRaw, error: transactionError } =
          await supabase
            .from("transactions")
            .select("amount, created_at")
            .eq("user_id", user_id);

        if (transactionError) throw transactionError;

        const incomeTotal = incomeDataRaw.reduce((sum, i) => sum + i.amount, 0);
        const expenseTotal = transactionDataRaw.reduce(
          (sum, t) => sum + t.amount,
          0
        );

        setTotalIncome(incomeTotal);
        setTotalExpense(expenseTotal);

        const dateMap = {};

        incomeDataRaw.forEach((item) => {
          const date = new Date(item.created_at).toLocaleDateString("vi-VN");
          if (!dateMap[date]) dateMap[date] = { income: 0, expense: 0, date };
          dateMap[date].income += item.amount;
        });

        transactionDataRaw.forEach((item) => {
          const date = new Date(item.created_at).toLocaleDateString("vi-VN");
          if (!dateMap[date]) dateMap[date] = { income: 0, expense: 0, date };
          dateMap[date].expense += item.amount;
        });

        const chartArray = Object.values(dateMap).sort(
          (a, b) =>
            new Date(a.date.split("/").reverse().join("-")) -
            new Date(b.date.split("/").reverse().join("-"))
        );

        setChartData(chartArray);
        if (filteredChartData.length > 0) {
          const totalIncomeFiltered = filteredChartData.reduce(
            (sum, item) => sum + item.income,
            0
          );
          const totalExpenseFiltered = filteredChartData.reduce(
            (sum, item) => sum + item.expense,
            0
          );

          setTotalIncome(totalIncomeFiltered);
          setTotalExpense(totalExpenseFiltered);
        } else {
          setTotalIncome(0);
          setTotalExpense(0);
        }
      } catch (error) {
        console.error("Lỗi khi fetch dữ liệu biểu đồ:", error.message);
      }
    };
    fetchChartData();

    fetchBudgets();

    const timer = setInterval(() => {
      setCurrentDateTime(getFormattedDateTime());
    }, 1000);

    return () => clearInterval(timer);
  }, [user_id]);

  useEffect(() => {
    const interval = setInterval(() => {
      checkAndResetBudgets();
    }, 10000); // Gọi mỗi 10 giây (10000 ms)

    return () => clearInterval(interval); // Dọn sạch interval khi component unmount
  }, [budgets]);

  useEffect(() => {
    const fetchChartDataDefault = async () => {
      try {
        const { data: incomeDataRaw, error: incomeError } = await supabase
          .from("income")
          .select("amount, created_at")
          .eq("user_id", user_id);

        if (incomeError) throw incomeError;

        const { data: transactionDataRaw, error: transactionError } =
          await supabase
            .from("transactions")
            .select("amount, created_at")
            .eq("user_id", user_id);

        if (transactionError) throw transactionError;

        // 👉 Chỉ lấy dữ liệu trong 1 tháng gần nhất
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

        const incomeData = incomeDataRaw.filter(
          (item) => new Date(item.created_at) >= oneMonthAgo
        );

        const transactionData = transactionDataRaw.filter(
          (item) => new Date(item.created_at) >= oneMonthAgo
        );

        // 👉 Tính tổng thu – chi trong 1 tháng gần nhất
        const incomeTotal = incomeData.reduce((sum, i) => sum + i.amount, 0);
        const expenseTotal = transactionData.reduce(
          (sum, t) => sum + t.amount,
          0
        );

        setTotalIncomeDefault(incomeTotal);
        setTotalExpenseDefault(expenseTotal);

        const dateMap = {};

        incomeData.forEach((item) => {
          const date = new Date(item.created_at).toLocaleDateString("vi-VN");
          if (!dateMap[date]) dateMap[date] = { income: 0, expense: 0, date };
          dateMap[date].income += item.amount;
        });

        transactionData.forEach((item) => {
          const date = new Date(item.created_at).toLocaleDateString("vi-VN");
          if (!dateMap[date]) dateMap[date] = { income: 0, expense: 0, date };
          dateMap[date].expense += item.amount;
        });

        const chartArray = Object.values(dateMap).sort(
          (a, b) =>
            new Date(a.date.split("/").reverse().join("-")) -
            new Date(b.date.split("/").reverse().join("-"))
        );

        setChartDataDefault(chartArray);
      } catch (error) {
        console.error("Lỗi khi fetch dữ liệu biểu đồ:", error.message);
      }
    };
    fetchChartDataDefault();

    const timer = setInterval(() => {
      setCurrentDateTime(getFormattedDateTime());
    }, 1000);

    return () => clearInterval(timer);
  }, [balance]);
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

        <div className="transaction-history">
          <div className="tabs">
            <p>Lịch sử giao dịch</p>
          </div>
          <div className="transaction-list">
            {history.map((item, index) => {
              const isIncome = item.type === "income";
              const amount = isIncome
                ? item.amount.toLocaleString("vi-VN")
                : `-${item.amount.toLocaleString("vi-VN")}`;
              const time = new Date(item.created_at).toLocaleString("vi-VN", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              });

              return (
                <div className="transaction" key={index}>
                  <div className="icon">
                    {categoryIcons[item.category.toLowerCase()] || "💸"}
                  </div>
                  <div className="details">
                    <p>{item.category}</p>
                    <span>{time}</span>
                  </div>
                  <span
                    className={`amount ${isIncome ? "positive" : "negative"}`}
                  >
                    {amount}
                  </span>
                </div>
              );
            })}
          </div>
          <a href="#" className="view-history" onClick={handleHistory}>
            Xem Toàn Bộ Lịch Sử
          </a>
        </div>

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
                      tickFormatter={() => ""} // Ẩn số nhưng vẫn giữ trục và lưới
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
                      tickFormatter={() => ""} // Ẩn số nhưng vẫn giữ trục và lưới
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
        <div className="spending-limit">
          <p className="title">Hạn Mức Chi Tiêu</p>
          <button
            onClick={() => {
              setShowAddForm(true); // Chỉ hiển thị form Thêm Hạn Mức
              setEditingBudget(null); // Đảm bảo không có form Sửa nào hiển thị
              setTimeout(() => {
                formRef.current?.scrollIntoView({ behavior: "smooth" });
              }, 100); // delay để form render xong
            }}
            className="add-button"
          >
            + Thêm Hạn Mức
          </button>

          <div className="limit-scroll-area">
            {budgets.length === 0 ? (
              <p>Chưa có hạn mức nào.</p>
            ) : (
              <ul className="limit-list">
                {budgets.map((budget) => (
                  <li key={budget.limit_id} className="limit-item">
                    <div className="limit-info">
                      <p>
                        <strong>{budget.limit_name}</strong>
                      </p>

                      <div className="progress-bar-wrapper">
                        <div
                          className="progress-bar-fill"
                          style={{
                            width: `${
                              (budget.used / budget.limit_amount) * 100
                            }%`,
                            backgroundColor:
                              budget.used / budget.limit_amount >= 1
                                ? "#f44336"
                                : "#5c6bc0",
                          }}
                        ></div>
                      </div>

                      <p className="progress-text">
                        {budget.used}₫ / {budget.limit_amount}₫ (
                        {budget.limit_time})
                      </p>
                    </div>
                    <div className="limit-actions">
                      <button
                        onClick={() => {
                          setEditingBudget(budget); // Chỉ hiển thị form sửa khi nhấn "Sửa"
                          setShowAddForm(false); // Đảm bảo không hiển thị form thêm
                        }}
                      >
                        Sửa
                      </button>
                      <button onClick={() => handleDelete(budget.limit_id)}>
                        Xóa
                      </button>
                    </div>

                    {editingBudget?.limit_id === budget.limit_id && (
                      <EditBudgetForm
                        budget={editingBudget}
                        onSave={(id, data) => {
                          handleSave(id, data);
                          setEditingBudget(null);
                        }}
                        onCancel={() => setEditingBudget(null)}
                      />
                    )}
                  </li>
                ))}
              </ul>
            )}

            {showAddForm && !editingBudget && (
              <EditBudgetForm
                budget={{
                  name: "",
                  current: 0,
                  max: 0,
                  timePeriod: "month",
                }}
                onSave={(id, data) => {
                  handleAddBudgets(data);
                  setShowAddForm(false); // Ẩn form sau khi lưu
                }}
                onCancel={() => setShowAddForm(false)} // Ẩn form khi hủy
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function getEndDate(startDate, timePeriod) {
  const end = new Date(startDate); // tạo bản sao

  switch (timePeriod) {
    case "5min":
      end.setMinutes(end.getMinutes() + 5);
      break;
    case "day":
      end.setDate(end.getDate() + 1);
      break;
    case "week":
      end.setDate(end.getDate() + 7);
      break;
    case "month":
      end.setMonth(end.getMonth() + 1);
      break;
    case "year":
      end.setFullYear(end.getFullYear() + 1);
      break;
    default:
      break;
  }

  return new Date(end);
}

function EditBudgetForm({ budget, onSave, onCancel }) {
  const [current, setCurrent] = useState(budget.current || 0);
  const [max, setMax] = useState(budget.max || 0);
  const [timePeriod, setTimePeriod] = useState(budget.timePeriod || "month");
  const [name, setName] = useState(budget.name || "");
  const [startDate, setStartDate] = useState(
    budget.startDate ? new Date(budget.startDate) : new Date()
  );

  const formatDateTimeLocal = (date) => {
    const pad = (n) => n.toString().padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
      date.getDate()
    )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (Number(current) < 0 || Number(max) < 0) {
      alert("Giá trị không được âm.");
      return;
    }

    if (Number(current) > Number(max)) {
      alert("Số tiền đã dùng không được lớn hơn hạn mức tối đa.");
      return;
    }
    onSave(budget.limit_id, {
      name,
      current: Number(current),
      max: Number(max),
      timePeriod,
      startDate: startDate.toISOString(),
    });
  };
  useEffect(() => {
    if (budget.limit_id) {
      setCurrent(budget.used || 0);
      setMax(budget.limit_amount || 0);
      setTimePeriod(budget.limit_time || "month");
      setName(budget.limit_name || "");
      setStartDate(budget.startDate ? new Date(budget.startDate) : new Date());
    } else {
      setCurrent(0);
      setMax(0);
      setTimePeriod("month");
      setName("");
      setStartDate(new Date());
    }
  }, [budget.limit_id]);

  return (
    <div className="edit-limit-form">
      <h4>{budget.limit_id ? "Chỉnh sửa hạn mức" : "Thêm hạn mức"}</h4>
      <form onSubmit={handleSubmit}>
        <label>
          Tên hạn mức
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </label>

        <label>
          Đã dùng
          <input
            type="number"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            min="0"
          />
        </label>

        <label>
          Hạn mức tối đa
          <input
            type="number"
            value={max}
            onChange={(e) => setMax(e.target.value)}
            min="0"
            required
          />
        </label>

        <label>
          Thời gian
          <select
            value={timePeriod}
            onChange={(e) => setTimePeriod(e.target.value)}
          >
            <option value="5min">5 phút</option>
            <option value="day">Ngày</option>
            <option value="week">Tuần</option>
            <option value="month">Tháng</option>
            <option value="year">Năm</option>
          </select>
        </label>

        <label>
          Ngày bắt đầu
          <input
            type="datetime-local"
            value={formatDateTimeLocal(startDate)}
            onChange={(e) => setStartDate(new Date(e.target.value))}
          />
        </label>

        <div className="edit-actions">
          <button type="button" onClick={onCancel}>
            Hủy
          </button>
          <button type="submit">Lưu</button>
        </div>
      </form>
    </div>
  );
}

export default Home;
