import "./Profile.css";
import { useNavigate } from "react-router-dom";

function Profile() {
  const navigate = useNavigate();
  const handleHome = () => {
    navigate("/home");
  };
  const handleTransaction = () => {
    navigate("/transaction");
  };
  const handleAI = () => {
    navigate("/ai");
  };
  const handleEditProfile = () => {
    navigate("/update-profile");
  };
  const handleLogout = () => {
    localStorage.removeItem("user_id");
    navigate("/");
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
    <div className="bodyProfile">
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
          <button className="nav-btn AI" onClick={handleAI}>
            <img src="Soucre/AI.png" alt="Chatbot" />
            <span className="nav-label">Chatbot</span>
          </button>
          <button className="nav-btn user">
            <img src="Soucre/Logout.png" alt="Đăng xuất" />
            <span className="nav-label">Thông tin cá nhân</span>
          </button>
        </nav>
      </div>

      <section>
        <img className="imageProfile" src="Soucre/Profile.jpg" alt="Profile" />
        <div className="profile-options">
          <button className="profile-option" onClick={handleEditProfile}>
            Thông tin cá nhân
          </button>
          <button className="profile-option" onClick={handleLogout}>
            Đăng xuất
          </button>
        </div>
      </section>
    </div>
  );
}

export default Profile;
