import "./AI.css";
import { useNavigate } from "react-router-dom";
import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import CryptoJS from "crypto-js";
import supabase from "../../database/supabase";
import { startSpeechRecognition } from "../../frontend/speech";

import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.REACT_APP_GOOGLE_API);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

const DEFAULT_MESSAGE = {
  sender: "bot",
  type: "text",
  content: "Xin chào! Tôi có thể giúp gì cho bạn?",
};

const SECRET_KEY = process.env.REACT_APP_SECRET_KEY;

function AI() {
  const navigate = useNavigate();
  const sessionId = useRef(
    `session-${new Date().toISOString().split("T")[0]}-${Math.floor(
      Math.random() * 10000
    )}`
  );
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [messages, setMessages] = useState([DEFAULT_MESSAGE]);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const encryptedUserId = localStorage.getItem("user_id");
    if (!encryptedUserId || !SECRET_KEY) {
      return;
    }

    try {
      const bytes = CryptoJS.AES.decrypt(encryptedUserId, SECRET_KEY);
      const parsed = parseInt(bytes.toString(CryptoJS.enc.Utf8), 10);
      if (!Number.isNaN(parsed)) {
        setUserId(parsed);
      }
    } catch (error) {
      console.error("Không thể giải mã user_id:", error);
    }
  }, []);

  const handleCreateNewSession = useCallback(() => {
    const sid = sessionId.current;
    setSelectedSession({ session_id: sid });
    setMessages([DEFAULT_MESSAGE]);
  }, []);

  useEffect(() => {
    handleCreateNewSession();
  }, [handleCreateNewSession]);

  useEffect(() => {
    if (!userId) return;

    async function fetchSessions() {
      const { data, error } = await supabase
        .from("chat_history")
        .select("session_id, created_at, title")
        .eq("user_id", userId)
        .order("updated_at", { ascending: false });

      if (error) {
        console.error("Fetch error:", error);
      } else {
        setSessions(data ?? []);
      }
    }

    fetchSessions();
  }, [userId]);

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
                className={`chat-session-item ${
                  selectedSession?.session_id === s.session_id ? "active" : ""
                }`}
                onClick={() => setSelectedSession(s)}
              >
                <p>{s.title}</p>
                <small>{new Date(s.created_at).toLocaleString()}</small>
              </button>
            ))}
          </div>
          <ChatWindow
            session={selectedSession}
            messages={messages}
            setMessages={setMessages}
            userId={userId}
          />
        </div>
      </section>
    </>
  );
}

function ChatWindow({ session, messages, setMessages, userId }) {
  const [questionHistory, setQuestionHistory] = useState([]);
  const [answerHistory, setAnswerHistory] = useState([]);

  const [transactions, setTransactions] = useState("");
  const [income, setIncome] = useState("");
  const [isListening, setIsListening] = useState(false);
  const suggestions = useMemo(
    () => [
      "Vẽ biểu đồ dự đoán tài chính của tôi sau 1 tháng",
      "Vẽ biểu đồ dự đoán chi tiêu của tôi sau 1 tháng",
    ],
    []
  );

  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef(null);

  const analyzeUserIntent = useCallback(async (userMessage) => {
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
  }, []);

  const handleGoogleChat = useCallback(
    async (userQuestion, historyQuestions, historyAnswers) => {
      const prompt = `
  Dữ liệu chi tiêu: ${transactions}
  Dữ liệu thu nhập: ${income}
  Lịch sử câu hỏi trước đó ${historyQuestions}
  Lịch sử câu trả lời trước đó ${historyAnswers}

  Câu hỏi: "${userQuestion}"
  → Hãy tổng hợp và trả lời bằng tiếng Việt.
`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text().replace(/\*+/g, "\n").trim();
    },
    [income, transactions]
  );

  useEffect(() => {
    if (!userId) return;

    async function getUserData() {
      const { data: transactionsData } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", userId);
      setTransactions(JSON.stringify(transactionsData));

      const { data: incomeData } = await supabase
        .from("income")
        .select("*")
        .eq("user_id", userId);
      setIncome(JSON.stringify(incomeData));
    }
    getUserData();
  }, [userId]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleVoiceInput = () => {
    setIsListening(true);
    startSpeechRecognition(
      (text) => setInputText(text),
      () => setIsListening(false),
      (err) => console.error("Error during recognition:", err),
      () => setIsListening(true)
    );
  };

  const saveChatToSupabase = useCallback(
    async (newMessages) => {
      if (!userId || !session?.session_id) return;

      const { error } = await supabase
        .from("chat_history")
        .upsert(
          {
            user_id: userId,
            session_id: session.session_id,
            messages: newMessages,
            updated_at: new Date().toISOString(),
          },
          { onConflict: ["user_id", "session_id"] }
        );

      if (error) console.error("Lỗi lưu lịch sử chat:", error);
    },
    [session, userId]
  );

  const cleanMessagesBeforeSave = useCallback((items) => {
    return items.map((msg) => {
      if (msg.type === "image") {
        return {
          ...msg,
          content: null,
        };
      }
      return msg;
    });
  }, []);

  const handleSend = async (text = inputText) => {
    if (!text.trim()) return;
    if (!session?.session_id || !userId) return;

    const updatedQuestions = [...questionHistory, text];
    setQuestionHistory(updatedQuestions);

    const userMessage = { sender: "user", type: "text", content: text };
    setMessages((prev) => [...prev, userMessage]);

    const analysis = await analyzeUserIntent(text);
    if (analysis.is_prediction_request === true) {
      const botMessageContent =
        analysis.chart_type === "transactions" ? (
          <AiPredictTransactions
            periods={analysis.periods}
            message={analysis.response_message}
            userId={userId}
          />
        ) : analysis.chart_type?.trim() === "financial" ? (
          <AiPredictFinancial
            periods={analysis.periods}
            message={analysis.response_message}
            userId={userId}
          />
        ) : null;

      if (botMessageContent) {
        setMessages((prev) => {
          const updated = [
            ...prev,
            { sender: "bot", type: "image", content: botMessageContent },
          ];
          saveChatToSupabase(cleanMessagesBeforeSave(updated));
          return updated;
        });
      }
    } else {
      if (messages.length === 1) {
        await supabase
          .from("chat_history")
          .update({ title: text })
          .eq("session_id", session.session_id)
          .eq("user_id", userId);
      }

      setTimeout(async () => {
        const chatbotAnswer = await handleGoogleChat(
          text,
          updatedQuestions,
          answerHistory
        );
        setAnswerHistory((prev) => [...prev, chatbotAnswer]);

        setMessages((prev) => {
          const updated = [
            ...prev,
            {
              sender: "bot",
              type: "text",
              content: chatbotAnswer,
            },
          ];
          saveChatToSupabase(cleanMessagesBeforeSave(updated));
          return updated;
        });
      }, 1000);
    }

    setInputText("");
  };

  useEffect(() => {
    if (!session?.session_id || !userId) return;

    async function fetchSessionMessages() {
      const { data, error } = await supabase
        .from("chat_history")
        .select("messages")
        .eq("session_id", session.session_id)
        .eq("user_id", userId)
        .maybeSingle();

      if (error) {
        console.error("Lỗi Supabase:", error.message);
        return;
      }

      if (!data) {
        return;
      }

      const loadedMessages = data.messages || [];
      const qHistory = loadedMessages
        .filter((msg) => msg.sender === "user" && msg.type === "text")
        .map((msg) => msg.content);

      const aHistory = loadedMessages
        .filter((msg) => msg.sender === "bot" && msg.type === "text")
        .map((msg) => msg.content);

      setMessages(loadedMessages.length ? loadedMessages : [DEFAULT_MESSAGE]);
      setQuestionHistory(qHistory);
      setAnswerHistory(aHistory);
    }

    fetchSessionMessages();
  }, [session, setMessages, userId]);

  return (
    <div className="chat-window">
      <div className="messages-container">
        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.sender}-message`}>
            <div className="avatar">{msg.sender === "bot" ? "🤖" : ""}</div>
            <div className="text">{msg.content}</div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="suggestions-container">
        {suggestions.map((suggestion) => (
          <div
            key={suggestion}
            className="suggestion-bubble"
            onClick={() => {
              handleSend(suggestion);
            }}
          >
            {suggestion}
          </div>
        ))}
      </div>

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
                e.preventDefault();
                handleSend();
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
              alt="Gửi tin nhắn"
            />
          </button>
        </div>
      </div>
    </div>
  );
}

function AiPredictFinancial({ periods, message, userId }) {
  const [imageData, setImageData] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    if (!userId) return;

    async function getPredictions() {
      try {
        const response = await fetch(
          `http://localhost:5000/predict/financial?user_id=${userId}&periods=${periods}&full_data=${"false"}`
        );

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
  }, [periods, userId]);

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

function AiPredictTransactions({ periods, message, userId }) {
  const [imageData, setImageData] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    if (!userId) return;

    async function getPredictions() {
      try {
        const response = await fetch(
          `http://localhost:5000/predict/transactions?user_id=${userId}&periods=${periods}&full_data=${"false"}`
        );

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
  }, [periods, userId]);

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
