import "./AI.css";
import { data, useNavigate } from "react-router-dom";
import React, { useState, useEffect, useRef } from "react";
import CryptoJS from "crypto-js";
import supabase from "../../database/supabase";
import { startSpeechRecognition } from "../../frontend/speech";

import { GoogleGenerativeAI } from "../../shared/lib/generativeAI";

// 1. Khởi tạo Gemini với API Key
const genAI = new GoogleGenerativeAI(process.env.REACT_APP_GOOGLE_API);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

let user_id = 0;

function Home() {
  const navigate = useNavigate();
  const handleHome = () => {
    navigate("/home");
  };
}
function Transaction() {
  const navigate = useNavigate();
  const handleTransaction = () => {
    navigate("/transaction");
  };
}
function Profile() {
  const navigate = useNavigate();
  const handleProfile = () => {
    navigate("/profile");
  };
}

function AI() {

  const sessionId = useRef(`session-${new Date().toISOString().split("T")[0]}-${Math.floor(Math.random() * 10000)}`);

  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const handleHome = () => {
    navigate("/home");
  };
  const handleTransaction = () => {
    navigate("/transaction");
  };
  const handleProfile = () => {
    navigate("/profile");
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

  const [messages, setMessages] = useState([
    {
      sender: "bot",
      type: "text",
      content: "Xin chào! Tôi có thể giúp gì cho bạn?",
    },
  ]);

  useEffect(() => {
    const SECRET_KEY = process.env.REACT_APP_SECRET_KEY;
    const encryptedUserId = localStorage.getItem("user_id");
    const bytes = CryptoJS.AES.decrypt(encryptedUserId, SECRET_KEY);
    user_id = parseInt(bytes.toString(CryptoJS.enc.Utf8), 10);
    console.log(user_id);
  }, [user_id]);

   // Lấy danh sách sessions
   useEffect(() => {
    if (!user_id) return;
    async function fetchSessions() {
      const { data, error } = await supabase
        .from("chat_history")
        .select("session_id, created_at, title")
        .eq("user_id", user_id)
        .order("updated_at", { ascending: false });

      if (error) console.error("Fetch error:", error);
      else setSessions(data);
    }
    fetchSessions();
  }, [user_id]);

    // Tạo phiên chat mới
    useEffect(() => {
      handleCreateNewSession();
    }, [])
    const handleCreateNewSession = async () => {
      let message = {
        sender: "bot",
        type: "text",
        content: "Xin chào! Tôi có thể giúp gì cho bạn?",
      };

      const sid = sessionId.current;

      // Cập nhật state session mới
      setSelectedSession({ session_id: sid });
      setMessages([message]);
    };

  return (
    <>
      <div className="bodyAI">
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
          <button className="nav-btn eco" onClick={handleEconomical}>
            <img src="Soucre/economy-icon.png" alt="Tiết kiệm" />
            <span className="nav-label">Tiết kiệm</span>
          </button>
            <button className="nav-btn AI">
              <img src="Soucre/AI.png" alt="Chatbot" />
              <span className="nav-label">Chatbot</span>
            </button>
            <button className="nav-btn user" onClick={handleProfile}>
              <img src="Soucre/Logout.png" alt="Đăng xuất" />
              <span className="nav-label">Thông tin cá nhân</span>
            </button>
          </nav>
        </div>
      </div>
      <section>
        <div className="chat_container">
      <div className="chat-history-sessions">
      <button 
          className="new-session-btn"
          onClick={handleCreateNewSession}
        >
          <i className="fas fa-plus"></i>
          + Đoạn chat mới
        </button>
          <h4>Lịch sử Chat</h4>
          {sessions.map((s) => (
            <button
              key={s.session_id}
              className={`chat-session-item ${selectedSession?.session_id === s.session_id ? "active" : ""}`}
              onClick={() => setSelectedSession(s)}
            >
              <p>{s.title}</p>
              <small>{new Date(s.created_at).toLocaleString()}</small>
            </button>
          ))}
        </div>
        <ChatWindow  session={selectedSession} messages={messages} setMessages={setMessages} sessionId={sessionId} />
        </div>
      </section>
    </>
  );
}

function ChatWindow({session, messages, setMessages, sessionId}) {

  const [questionHistory, setQuestionHistory] = useState([]);
  const [answerHistory, setAnswerHistory] = useState([]);

  const [transactions, setTransactions] = useState("");
  const [income, setIncome] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [suggestions, setSuggestions] = useState([
    "Vẽ biểu đồ dự đoán tài chính của tôi sau 1 tháng",
    "Vẽ biểu đồ dự đoán chi tiêu của tôi sau 1 tháng",
  ]);

  
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef(null); // Ref đến vị trí cuối tin nhắn

  async function analyzeUserIntent(userMessage) {
    try {
      const prompt = `
      Phân tích yêu cầu của người dùng và trả về JSON theo định dạng:
      {
        "is_prediction_request": boolean,
        "chart_type": "transactions" | "financial" | null,
        "periods": number (mặc định 30 nếu không xác định được),
        "response_message": string (phản hồi tự nhiên)
      }
      Nếu yêu cầu là vẽ biểu đồ dự đoán tài chính thì chart_type là "financial", nếu là vẽ biểu đồ dự đoán chi tiêu thì chart_type là "transactions", nếu không phải cả hai thì là null
      Yêu cầu: "${userMessage}"
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

  async function handleGoogleChat(userQuestion, questionHistory, answerHistory) {
    const prompt = `
  Dữ liệu chi tiêu: ${transactions}
  Dữ liệu thu nhập: ${income}
  Lịch sử câu hỏi trước đó ${questionHistory}
  Lịch sử câu trả lời trước đó ${answerHistory}

  Câu hỏi: "${userQuestion}"
  → Hãy tổng hợp và trả lời bằng tiếng Việt.
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().replace(/\*+/g, "\n").trim();
  }

  useEffect(() => {
    async function getUserData() {
      const { data: transactionsData } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user_id);
      setTransactions(JSON.stringify(transactionsData));

      const { data: incomeData } = await supabase
        .from("income")
        .select("*")
        .eq("user_id", user_id);
      setIncome(JSON.stringify(incomeData));
    }
    getUserData();
  }, [user_id]);

  // Tự động cuộn khi có tin nhắn mới
  useEffect(() => {
    scrollToBottom();
  }, [messages]); // Kích hoạt khi messages thay đổi

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  async function handleSend(text = inputText) {
    if (!text.trim()) return;
    console.log(messages.length,messages.length === 1);
    if (messages.length === 1) {
      saveChatToSupabase(messages);
      await supabase
        .from("chat_history")
        .update({ title: text }) // text là câu hỏi đầu tiên của user
        .eq("session_id", session.session_id)
        .eq("user_id", user_id);
    }
    // Thêm tin nhắn người dùng
    setMessages([...messages, { sender: "user", type: "text", content: text }]);
    setQuestionHistory([...questionHistory, text]);
    const newMessages = [...messages, { sender: "user", type: "text", content: text }];

    const analysis = await analyzeUserIntent(text);
    if (analysis.is_prediction_request === true) {
      if (analysis.chart_type === "transactions") {
        setMessages([
          ...messages,
          { sender: "user", content: text },
          {
            sender: "bot",
            type: "image",
            content: (
              <AiPredictTransactions
                periods={analysis.periods}
                message={analysis.response_message}
              />
            ),
          },
        ]);
      } else if (String(analysis.chart_type).trim() === "financial") {
        setMessages([
          ...messages,
          { sender: "user", content: text },
          {
            sender: "bot",
            type: "image",
            content: (
              <AiPredictFinancial
                periods={analysis.periods}
                message={analysis.response_message}
              />
            ),
          },
        ]);
      }
    } else {
      // Giả lập phản hồi từ bot (có thể thay bằng API call)
      setTimeout(async () => {
        let chatbotAnswer = await handleGoogleChat(text, questionHistory, answerHistory);
        setAnswerHistory(chatbotAnswer);
      
        setMessages((prev) => {
          const updated = [
            ...prev,
            {
              sender: "bot",
              type: "text",
              content: chatbotAnswer,
            },
          ];
      
          // Lưu đúng bản cập nhật ngay tại đây!
          let cleanedMessages = cleanMessagesBeforeSave(updated);
          saveChatToSupabase(cleanedMessages);
      
          return updated;
        });
      }, 1000);
      
    }
    
    setInputText("");
  }

  function cleanMessagesBeforeSave(messages) {
  return messages.map((msg) => {
    if (msg.type === "image") {
      return {
        ...msg,
        content: null, // Loại bỏ React component nếu là ảnh
      };
    }
    return msg;
  });
}


  const handleVoiceInput = () => {
    setIsListening(true);
    startSpeechRecognition(
      (text) => setInputText(text),
      () => setIsListening(false),
      (err) => console.error("Error during recognition:", err),
      () => setIsListening(true)
    );
  };

  useEffect(() => {
    if (!session) return;

    async function fetchSessionMessages() {
      if (!session || !session.session_id) {
        console.warn(" session không hợp lệ:", session);
        return;
      }
    
      const { data, error } = await supabase
        .from("chat_history")
        .select("messages")
        .eq("session_id", session.session_id)
        .maybeSingle();
    
      if (error) {
        console.error(" Lỗi Supabase:", error.message);
        return;
      }
    
      if (!data) {
        console.warn("Không có dữ liệu cho session:", session.session_id);
        return;
      }
    
      const loadedMessages = data.messages;

    // Phân loại lịch sử
    const qHistory = loadedMessages
      .filter((msg) => msg.sender === "user" && msg.type === "text")
      .map((msg) => msg.content);

    const aHistory = loadedMessages
      .filter((msg) => msg.sender === "bot" && msg.type === "text")
      .map((msg) => msg.content);

    setMessages(loadedMessages);
    setQuestionHistory(qHistory);
    setAnswerHistory(aHistory);
    }

    fetchSessionMessages();
  }, [session]);

  async function saveChatToSupabase(newMessages) {
    if (!user_id) return;
  
    const { error } = await supabase
      .from("chat_history")
      .upsert(
        {
          user_id: user_id,
          session_id: session.session_id,
          messages: newMessages,
          updated_at: new Date().toISOString(),
        },
        { onConflict: ["user_id", "session_id"] }
      );
  
    if (error) console.error("Lỗi lưu lịch sử chat:", error);
  }
  

  return (
    <div className="chat-window">
      {/* Phần tin nhắn (cuộn độc lập) */}
      <div className="messages-container">
        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.sender}-message`}>
            <div className="avatar">{msg.sender === "bot" ? "🤖" : ""}</div>
            <div className="text">{msg.content}</div>
          </div>
        ))}
        <div ref={messagesEndRef} /> {/* Marker cuối danh sách */}
      </div>

      {/* Phần gợi ý câu hỏi */}
      <div className="suggestions-container">
        {suggestions.map((suggestion, index) => (
          <div
            key={index}
            className="suggestion-bubble"
            onClick={() => {
              handleSend(suggestion);
            }}
          >
            {suggestion}
          </div>
        ))}
      </div>
      {/* Phần input (cố định ở dưới) */}
      <div className="input-area">
        <div className="chat-input">
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
              <p style={{ fontSize: "25px" }}>🎙️</p>
            </button>
          )}

          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                // Kiểm tra phím Enter (không giữ Shift)
                e.preventDefault(); // Ngăn xuống dòng nếu là textarea
                handleSend(); // Gọi hàm gửi tin nhắn
              }
            }}
            className="chat-input-box"
            placeholder="Hỏi bất cứ điều gì về vấn đề tài chính..."
          />
          <button className="in-chat-button" onClick={() => handleSend()}>
            <img
              src="Soucre/send.jpg"
              width="25"
              height="30"
              className="chat-icon"
            />
          </button>
        </div>
      </div>
    </div>
  );
}

function AiPredictFinancial({ periods, message }) {
  const [imageData, setImageData] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    async function getPredictions() {
      try {
        const response = await fetch(
          `http://localhost:5000/predict/financial?user_id=${user_id}&periods=${periods}&full_data=${"false"}`
        );

        // Kiểm tra status code
        if (!response.ok) {
          const errorData = await response.json();
          setErrorMessage(errorData.message || "Lỗi không xác định từ server");
          setImageData(null);
        } else {
          const data = await response.json();
          setImageData(`data:image/png;base64,${data.plot}`);
          setErrorMessage(null);
        }
      } catch (error) {
        console.error("Lỗi khi lấy dự đoán:", error);
      }
    }
    getPredictions();
  }, []);

  return (
    <div>
      {errorMessage ? (
        <div className="error-message">
          {errorMessage}
          <p>Vui lòng thử lại sau</p>
        </div>
      ) : imageData ? (
        <div>
          <p>{message}</p>
          <img
            src={imageData}
            alt="Forecast"
            style={{ maxWidth: "500px", borderRadius: "8px" }}
          />
        </div>
      ) : (
        <p>Đang tải dữ liệu...</p>
      )}
    </div>
  );
}

function AiPredictTransactions({ periods, message }) {
  const [imageData, setImageData] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    async function getPredictions() {
      try {
        const response = await fetch(
          `http://localhost:5000/predict/transactions?user_id=${user_id}&periods=${periods}&full_data=${"false"}`
        );

        // Kiểm tra status code
        if (!response.ok) {
          const errorData = await response.json();
          setErrorMessage(errorData.message || "Lỗi không xác định từ server");
          setImageData(null);
        } else {
          const data = await response.json();
          setImageData(`data:image/png;base64,${data.plot}`);
          setErrorMessage(null);
        }
      } catch (error) {
        console.error("Lỗi khi lấy dự đoán:", error);
      }
    }
    getPredictions();
  }, []);

  return (
    <div>
      {errorMessage ? (
        <div className="error-message">
          {errorMessage}
          <p>Vui lòng thử lại sau</p>
        </div>
      ) : imageData ? (
        <div>
          <p>{message}</p>
          <img
            src={imageData}
            alt="Forecast"
            style={{ maxWidth: "500px", borderRadius: "8px" }}
          />
        </div>
      ) : (
        <p>Đang tải dữ liệu...</p>
      )}
    </div>
  );
}

export default AI;
