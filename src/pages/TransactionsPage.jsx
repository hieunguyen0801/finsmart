/**
 * TransactionsPage - Transaction management page
 * Layout-level component for adding and managing transactions
 */
import React, { useState } from "react";
// Import CSS styles for TransactionsPage layout and components
import "../frontend/pages/Transaction.css";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../shared/hooks";
import { useAddTransaction } from "../features/transaction-add";
import { incomeCategories, expenseCategories, TRANSACTION_TYPES } from "../shared/config";
import { startSpeechRecognition } from "../frontend/speech";
import { GoogleGenerativeAI } from "../shared/lib/generativeAI";

const genAI = new GoogleGenerativeAI(process.env.REACT_APP_GOOGLE_API);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

const TransactionsPage = () => {
  const navigate = useNavigate();
  const { userId } = useAuth();
  const { limits, addTransaction, loading } = useAddTransaction(userId);

  const [transactionType, setTransactionType] = useState(TRANSACTION_TYPES.INCOME);
  const [activeCategory, setActiveCategory] = useState(null);
  const [activeLimit, setActiveLimit] = useState(null);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState("");
  const [selectCategory, setSelectCategory] = useState("");
  const [isListening, setIsListening] = useState(false);

  // Navigation handlers
  const handleHome = () => navigate("/home");
  const handleAI = () => navigate("/ai");
  const handleProfile = () => navigate("/profile");
  const handleEconomical = () => navigate("/economical");
  const handlePreodic = () => navigate("/preodic");
  const handleStatistic = () => navigate("/statistic");

  // Voice input handler
  function handleVoiceInput() {
    setIsListening(true);
    startSpeechRecognition(
      async (text) => {
        const result = await analyzeUserIntent(text);
        console.log(result);
        if (result.add_transaction === true) {
          setAmount(result.amount);
          setSelectCategory(result.category);
          setNote(result.note);
          setDate(result.datetime);
        } else {
          alert(result.response_message);
        }
      },
      () => setIsListening(false),
      (err) => {
        console.error("Error during recognition:", err);
        setIsListening(false);
      },
      () => setIsListening(true)
    );
  }

  // Transaction type handler
  const handleTransactionType = (type) => {
    setTransactionType(type);
    setActiveCategory(null);
    setActiveLimit(null);
  };

  // Category selection handler
  const handleCategoryClick = (categoryValue) => {
    setSelectCategory(categoryValue);
  };

  // Limit selection handler
  const handleLimitClick = (limitId) => {
    if (activeLimit === limitId) {
      setActiveLimit(null);
    } else {
      setActiveLimit(limitId);
    }
  };

  // Form reset
  const resetForm = () => {
    setAmount("");
    setNote("");
    setDate("");
    setActiveCategory(null);
    setActiveLimit(null);
    setSelectCategory("");
  };

  // AI intent analysis
  async function analyzeUserIntent(userMessage) {
    try {
      const prompt = `
Phân tích yêu cầu của người dùng bên dưới và trả về **duy nhất một đối tượng JSON hợp lệ** theo định dạng sau:

{
  "add_transaction": boolean,
  "amount": number | null,
  "category": string | null,
  "note": string | null,
  "response_message": string
  "datetime": string | null,
}

Yêu cầu của người dùng: "${userMessage}"
`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const jsonString = response
        .text()
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();
      return JSON.parse(jsonString);
    } catch (error) {
      console.error("Lỗi phân tích ý định:", error);
      return {
        is_prediction_request: false,
        response_message: "Xin lỗi, tôi không hiểu yêu cầu của bạn",
      };
    }
  }

  // Confirm transaction
  const handleConfirm = async () => {
    const transactionData = {
      type: transactionType,
      amount,
      category: selectCategory,
      note,
      date,
      limitId: activeLimit,
    };

    const success = await addTransaction(transactionData);
    if (success) {
      resetForm();
    }
  };

  return (
    <div className="bodyadd">
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
          <button className="nav-btn add">
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
            <img src="Soucre/Logout.png" alt="Tài khoản" />
            <span className="nav-label">Thông tin cá nhân</span>
          </button>
        </nav>
      </div>

      <main>
        <section>
          <div className="head-button">
            <div className="categories">
              <button
                onClick={() => handleTransactionType(TRANSACTION_TYPES.INCOME)}
                className={transactionType === TRANSACTION_TYPES.INCOME ? "active" : ""}
              >
                Thu tiền
              </button>
              <button
                onClick={() => handleTransactionType(TRANSACTION_TYPES.EXPENSE)}
                className={transactionType === TRANSACTION_TYPES.EXPENSE ? "active" : ""}
              >
                Chi tiền
              </button>
            </div>
            <div>
              {isListening ? (
                <p
                  style={{
                    marginTop: "10px",
                    color: "red",
                    fontWeight: "bold",
                    fontSize: "16px",
                  }}
                >
                  🔴 Listening...
                </p>
              ) : (
                <button className="mic-button" onClick={handleVoiceInput}>
                  <p style={{ fontSize: "30px" }}>🎙️</p>
                </button>
              )}
            </div>
          </div>

          <input
            type="number"
            className="input"
            placeholder="Nhập số tiền"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min="0"
          />

          <div className="select-categoryies">
            {transactionType === TRANSACTION_TYPES.INCOME && (
              <div>
                <div>
                  <input
                    type="text"
                    className="input note-input"
                    placeholder="Chọn mục thu tiền"
                    value={selectCategory}
                    onChange={(e) => setSelectCategory(e.target.value)}
                  />
                </div>
                <div className="category-row">
                  {incomeCategories.map((category) => (
                    <button
                      key={category.value}
                      className={`category ${
                        activeCategory === category.value ? "active" : ""
                      }`}
                      onClick={() => handleCategoryClick(category.value)}
                    >
                      {category.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {transactionType === TRANSACTION_TYPES.EXPENSE && (
              <div>
                <div>
                  <input
                    type="text"
                    className="input note-input"
                    placeholder="Chọn mục chi tiền"
                    value={selectCategory}
                    onChange={(e) => setSelectCategory(e.target.value)}
                  />
                </div>
                <div className="category-row">
                  {expenseCategories.map((category) => (
                    <button
                      key={category.value}
                      className={`category ${
                        activeCategory === category.value ? "active" : ""
                      }`}
                      onClick={() => handleCategoryClick(category.value)}
                    >
                      {category.label}
                    </button>
                  ))}
                </div>
                <h1>Hạn mức</h1>
                <div className="limit-row">
                  {limits.map((limit) => (
                    <button
                      key={limit.limit_id}
                      className={`limit ${
                        activeLimit === limit.limit_id ? "active" : ""
                      }`}
                      onClick={() => handleLimitClick(limit.limit_id)}
                    >
                      {`💰 ${limit.limit_name}`}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="input-container">
            <input
              type="text"
              className="input note-input"
              placeholder="Nhập ghi chú..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          <input
            type="datetime-local"
            className="date-picker"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />

          <div className="confirm-container">
            <button className="confirm" onClick={handleConfirm} disabled={loading}>
              {loading ? "Đang xử lý..." : "Xác nhận"}
            </button>
          </div>
        </section>
      </main>
    </div>
  );
};

export default TransactionsPage;
