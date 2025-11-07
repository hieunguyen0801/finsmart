import "./History.css";
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

function History() {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    const fetchHistory = async () => {
      const [incomeRes, transactionRes] = await Promise.all([
        supabase
          .from("income")
          .select("category, amount, created_at, note")
          .eq("user_id", user_id),
        supabase
          .from("transactions")
          .select("category, amount, created_at, note")
          .eq("user_id", user_id),
      ]);

      if (incomeRes.error || transactionRes.error) {
        console.error(
          "Error fetching data:",
          incomeRes.error || transactionRes.error
        );
        return;
      }

      const incomes = incomeRes.data.map((item) => ({
        name: item.category,
        amount: item.amount,
        date: item.created_at,
        note: item.note || "",
      }));

      const expenses = transactionRes.data.map((item) => ({
        name: item.category,
        amount: -item.amount,
        date: item.created_at,
        note: item.note || "",
      }));

      const all = [...incomes, ...expenses].sort(
        (a, b) => new Date(b.date) - new Date(a.date)
      );

      setTransactions(all);
    };

    fetchHistory();
  }, []);

  // Lọc theo khoảng thời gian nếu người dùng chọn
  const filteredTransactions = transactions.filter((t) => {
    const transactionDate = new Date(t.date);
    const startDateObj = startDate ? new Date(startDate) : null;
    const endDateObj = endDate ? new Date(endDate) : null;

    // Đặt giờ về 00:00:00 để so sánh ngày chính xác
    if (startDateObj) startDateObj.setHours(0, 0, 0, 0);
    if (endDateObj) endDateObj.setHours(23, 59, 59, 999); // Kết thúc ngày là 23:59:59

    // Nếu không có ngày bắt đầu/kết thúc thì coi như thỏa mãn điều kiện
    const afterStart = startDateObj ? transactionDate >= startDateObj : true;
    const beforeEnd = endDateObj ? transactionDate <= endDateObj : true;

    return afterStart && beforeEnd;
  });

  return (
    <div className="history">
      <h3>Lịch Sử Giao Dịch</h3>

      <div className="filters">
        <label>
          Từ ngày:
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </label>
        <label>
          Đến ngày:
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </label>
      </div>

      <div className="transaction-list-hist">
        {filteredTransactions.length > 0 ? (
          filteredTransactions.map((t, index) => (
            <div key={index} className="transaction-hist">
              <p>{t.name}</p>
              {t.note && <small className="note">Ghi chú: {t.note}</small>}
              <span>
                {new Date(t.date).toLocaleString("vi-VN", {
                  hour: "2-digit",
                  minute: "2-digit",
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })}
              </span>
              <span className={t.amount > 0 ? "positive" : "negative"}>
                {t.amount.toLocaleString("vi-VN")}
              </span>
            </div>
          ))
        ) : (
          <p>Không có giao dịch nào trong khoảng thời gian này.</p>
        )}
      </div>

      <button className="back-home" onClick={() => navigate("/home")}>
        Quay lại Home
      </button>
    </div>
  );
}

export default History;
