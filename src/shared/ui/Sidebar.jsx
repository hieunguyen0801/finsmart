/**
 * Shared UI component - Sidebar
 * Reusable sidebar navigation component
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';

const Sidebar = ({ currentPath }) => {
  const navigate = useNavigate();

  const handleHome = () => navigate("/home");
  const handleTransaction = () => navigate("/transaction");
  const handleAI = () => navigate("/ai");
  const handleProfile = () => navigate("/profile");
  const handleEconomical = () => navigate("/economical");
  const handlePreodic = () => navigate("/preodic");
  const handleStatistic = () => navigate("/statistic");

  const navItems = [
    { path: "/home", label: "Trang chủ", icon: "Dashboard.png", handler: handleHome },
    { path: "/transaction", label: "Giao dịch", icon: "AddTransaction.png", handler: handleTransaction },
    { path: "/preodic", label: "Định kỳ", icon: "preodic-icon.png", handler: handlePreodic },
    { path: "/statistic", label: "Thống kê", icon: "statistic.png", handler: handleStatistic },
    { path: "/economical", label: "Tiết kiệm", icon: "economy-icon.png", handler: handleEconomical },
    { path: "/ai", label: "Chatbot", icon: "AI.png", handler: handleAI },
    { path: "/profile", label: "Thông tin cá nhân", icon: "Logout.png", handler: handleProfile },
  ];

  return (
    <div className="sidebarhome">
      <div className="logo">
        <img src="Soucre/Logo.png" alt="Logo FinSmart" />
        <span className="logo-text">FinSmart</span>
      </div>
      <nav>
        {navItems.map((item) => (
          <button
            key={item.path}
            className={`nav-btn ${currentPath === item.path ? 'active' : ''}`}
            onClick={item.handler}
          >
            <img src={`Soucre/${item.icon}`} alt={item.label} />
            <span className="nav-label">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;
