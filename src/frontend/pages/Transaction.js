import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Transaction.css";
import CryptoJS from "crypto-js";
import supabase from "../../database/supabase";
import { startSpeechRecognition } from "../../frontend/speech";
import { GoogleGenerativeAI } from "../../shared/lib/generativeAI";

const SECRET_KEY = process.env.REACT_APP_SECRET_KEY;
const genAI = new GoogleGenerativeAI(process.env.REACT_APP_GOOGLE_API);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
// Mảng để lưu trữ các hạng mục thu nhập và chi tiêu
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

function Transaction() {
  const navigate = useNavigate();
  const [transactionType, setTransactionType] = useState("thu");
  const [activeCategory, setActiveCategory] = useState(null);
  const [activeLimit, setActiveLimit] = useState(null);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState("");
  const [userId, setUserId] = useState(null);
  const [limits, setLimits] = useState([]);
  const [selectCategory, setSelectCategory] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [inputtext, setInputText] = useState("");
  const [jsonResult, setJsonResult] = useState(null);
  useEffect(() => {
    console.log(date);
  }, [date]);
  useEffect(() => {
    try {
      const encryptedUserId = localStorage.getItem("user_id");
      if (encryptedUserId && SECRET_KEY) {
        const bytes = CryptoJS.AES.decrypt(encryptedUserId, SECRET_KEY);
        const decryptedId = parseInt(bytes.toString(CryptoJS.enc.Utf8), 10);
        if (!isNaN(decryptedId)) {
          setUserId(decryptedId);
        } else {
          console.error("Failed to parse decrypted user ID.");
          navigate("/login");
        }
      } else {
        console.error("User ID or Secret Key not found.");
        navigate("/login");
      }
    } catch (error) {
      console.error("Error decrypting user ID:", error);
      navigate("/login");
    }
  }, [navigate]);

  // Thêm useEffect để fetch danh sách hạn mức từ Supabase
  useEffect(() => {
    if (userId) {
      const fetchLimits = async () => {
        try {
          const { data, error } = await supabase
            .from("limit")
            .select("*")
            .eq("user_id", userId);

          if (error) throw error;
          setLimits(data || []);
        } catch (error) {
          console.error("Error fetching limits:", error.message);
        }
      };

      fetchLimits();
    }
  }, [userId]);

  const handleHome = () => navigate("/home");
  const handleAI = () => navigate("/ai");
  const handleProfile = () => navigate("/profile");
  const handleEconomical = () => navigate("/economical");
  const handlePreodic = () => navigate("/preodic");
  const handleStatistic = () => navigate("/statistic");

  function handleVoiceInput() {
    setIsListening(true);
    startSpeechRecognition(
      async (text) => {
        setInputText(text);
        const result = await analyzeUserIntent(text);
        setJsonResult(result);
        console.log(result);
        if (result.add_transaction === true) {
          setAmount(result.amount);
          setSelectCategory(result.category);
          setNote(result.note);
          setDate(result.datetime);
        } else {
          alert(result.response_message);
        }
        console.log(" Intent Analysis:", result);
        // You might want to store the result in state too:
        // setIntentResult(result);
      },
      () => setIsListening(false),
      (err) => {
        console.error("Error during recognition:", err);
        setIsListening(false); // handle end even if errored
      },
      () => setIsListening(true)
    );
  }

  const handleTransactionType = (type) => {
    setTransactionType(type);
    setActiveCategory(null);
    setActiveLimit(null);
  };

  const handleCategoryClick = (categoryValue) => {
    setSelectCategory(categoryValue);
  };

  const handleLimitClick = (limitId) => {
    if (activeLimit === limitId) {
      // Nếu người dùng bấm lại hạn mức đang chọn, thì bỏ chọn nó
      setActiveLimit(null);
    } else {
      setActiveLimit(limitId);
    }
  };

  const resetForm = () => {
    setAmount("");
    setNote("");
    setDate("");
    setActiveCategory(null);
    setActiveLimit(null);
  };

  //Xử lí xác nhận giao dịch và push lên database
  const handleConfirm = async () => {
    if (!userId) {
      alert("Không xác thực được người dùng. Vui lòng đăng nhập lại.");
      navigate("/login");
      return;
    }

    const amountNumber = parseFloat(amount);

    if (!amount || !selectCategory || !date) {
      alert("Vui lòng nhập đầy đủ số tiền, chọn hạng mục và ngày giao dịch.");
      return;
    }

    if (isNaN(amountNumber) || amountNumber <= 0) {
      alert("Số tiền không hợp lệ. Vui lòng nhập số lớn hơn 0.");
      return;
    }

    // Kiểm tra ngày hợp lệ
    const selectedDate = new Date(date);
    console.log(date);
    const currentDate = new Date(); // Lấy ngày hiện tại
    if (selectedDate > currentDate) {
      alert("Ngày giao dịch không hợp lệ. Vui lòng chọn lại ngày.");
      return;
    }

    let successMessage = "Thêm giao dịch thành công.";
    let failureMessage = "Thêm giao dịch không thành công. Vui lòng thử lại.";

    try {
      // Lấy ví
      const { data: wallets, error: walletError } = await supabase
        .from("wallets")
        .select("wallet_id, balance")
        .eq("user_id", userId)
        .limit(1);

      if (walletError) throw walletError;
      if (!wallets || wallets.length === 0) {
        alert("Không tìm thấy ví của bạn. Vui lòng tạo ví trước.");
        return;
      }

      const wallet = wallets[0];
      const walletId = wallet.wallet_id;
      const currentBalance = wallet.balance;

      // --- Xử lý giao dịch ---
      let newBalance;
      let transactionData = {
        user_id: userId,
        wallet_id: walletId,
        category: selectCategory,
        amount: amountNumber,
        created_at: new Date(date).toISOString(),
        note: note || null,
      };
      let tableName;

      if (transactionType === "thu") {
        tableName = "income";
        newBalance = currentBalance + amountNumber;
      } else {
        // transactionType === "chi"
        tableName = "transactions";
        newBalance = currentBalance - amountNumber;

        // Kiểm tra số dư trước khi thêm giao dịch chi tiền
        if (newBalance < 0) {
          throw new Error("Số dư không đủ để thực hiện giao dịch này.");
        }

        let applicableLimits = [];

        if (activeLimit) {
          // Nếu người dùng đã chọn hạn mức cụ thể
          const selectedLimit = limits.find(
            (limit) => limit.limit_id === activeLimit
          );
          if (selectedLimit) {
            applicableLimits.push(selectedLimit);
            transactionData.limit_id = activeLimit;
          }
        }
        // } else {
        //   // Người dùng chưa chọn hạn mức, lọc các hạn mức theo category
        //   applicableLimits = limits.filter(
        //     (limit) => limit.limit_category === activeCategory
        //   );

        //   if (applicableLimits.length > 1) {
        //     const confirmApply = window.confirm(
        //       `Có ${applicableLimits.length} hạn mức cho danh mục "${activeCategory}".\nBạn có muốn cộng giao dịch này vào tất cả các hạn mức đó không?\n\nChọn "OK" để cộng vào tất cả.\nChọn "Hủy" để quay lại và chọn hạn mức cụ thể.`
        //     );
        //     if (!confirmApply) {
        //       alert("Vui lòng chọn một hạn mức cụ thể để tiếp tục.");
        //       return;
        //     }
        //   }
        // }

        // Duyệt qua tất cả các hạn mức liên quan để kiểm tra và cập nhật used
        for (const selectedLimit of applicableLimits) {
          const newUsedAmount = (selectedLimit.used || 0) + amountNumber;

          // Kiểm tra xem có vượt quá hạn mức không
          if (newUsedAmount > selectedLimit.limit_amount) {
            alert(
              `Hạn mức "${selectedLimit.limit_name}" đã vượt quá giới hạn ${selectedLimit.limit_amount}. Vui lòng chọn danh mục khác hoặc hạn mức khác`
            );
            return; // Huỷ giao dịch nếu vượt quá
          }

          // Cập nhật used trong bảng limit
          const { error: updateLimitError } = await supabase
            .from("limit")
            .update({ used: newUsedAmount })
            .eq("limit_id", selectedLimit.limit_id);

          if (updateLimitError) throw updateLimitError;
        }
      }

      // Thêm giao dịch vào bảng tương ứng
      const { error: insertError } = await supabase
        .from(tableName)
        .insert([transactionData]);

      if (insertError) throw insertError;

      // Cập nhật số dư ví
      const { error: updateError } = await supabase
        .from("wallets")
        .update({ balance: newBalance })
        .eq("wallet_id", walletId);

      if (updateError) {
        failureMessage =
          "Lưu giao dịch thành công nhưng cập nhật số dư thất bại. Vui lòng kiểm tra lại.";
        throw new Error(failureMessage);
      }

      alert(successMessage);
      resetForm();
    } catch (error) {
      console.error("Lỗi khi xử lý giao dịch:", error.message || error);
      alert(`Đã xảy ra lỗi: ${error.message || failureMessage}`);
    }
  };

  async function analyzeUserIntent(userMessage) {
    try {
      console.log(new Date());
      const prompt = `
Phân tích yêu cầu của người dùng bên dưới và trả về **duy nhất một đối tượng JSON hợp lệ** theo định dạng sau:

{
  "add_transaction": boolean,
  "amount": number | null,  // số tiền tính theo VNĐ (nếu không có thì null)
  "category": string | null, // loại giao dịch như "Ăn uống", "Mua sắm", "Sinh hoạt", "Di chuyển", "Tiền lương", "Bố mẹ chuyển", v.v. (nếu không xác định thì null), có thể thêm loại khác không có ở đây
  "note": string | null, // nội dung ghi chú nếu có, nếu không thì null
  "response_message": string // câu phản hồi tự nhiên phù hợp với người dùng
  "datetime": string | null,  //phải tự xác định và chuyển về định dạng ISO 8601: "YYYY-MM-DDThh:mm" nếu xác định được thời gian, nếu không thì null, nếu người dùng chỉ nói ngày tháng thì mặc định giờ là giờ là giờ hiện tại ngay lúc đó, thời gian hiện tại là ${new Date()}, đây là một ví dụ: 2025-04-13T21:41
}

 Yêu cầu:
- Nếu đây là yêu cầu thêm giao dịch thì add_transaction phải là true
- Nếu không phải yêu cầu thêm giao dịch thì add_transaction là false và các giá trị khác (trừ response_message) là null
- Không tự suy diễn dữ liệu nếu không có trong yêu cầu
- Trả về đúng định dạng JSON, không thêm chú thích hay văn bản ngoài JSON

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
          {/*Chọn giao dịch thu hoặc chi tiền*/}
          <div className="head-button">
            <div className="categories">
              <button
                onClick={() => handleTransactionType("thu")}
                className={transactionType === "thu" ? "active" : ""}
              >
                Thu tiền
              </button>
              <button
                onClick={() => handleTransactionType("chi")}
                className={transactionType === "chi" ? "active" : ""}
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

          {/* Nhập số tiền */}
          <input
            type="number"
            className="input"
            placeholder="Nhập số tiền"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min="0"
          />

          {/* Danh sách các hạng mục và hạn mức */}
          <div className="select-categoryies">
            {transactionType === "thu" && (
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

            {transactionType === "chi" && (
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

          {/* Nhập ghi chú */}
          <div className="input-container">
            <input
              type="text"
              className="input note-input"
              placeholder="Nhập ghi chú..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          {/* Nhập ngày */}
          <input
            type="datetime-local"
            className="date-picker"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />

          {/* Xác nhận */}
          <div className="confirm-container">
            <button className="confirm" onClick={handleConfirm}>
              Xác nhận
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}

export default Transaction;
