/**
 * Transaction entity UI component
 * Reusable transaction card component for displaying transaction items
 */
import React from 'react';
import { categoryIcons } from '../../../shared/config';

const TransactionCard = ({ item, index }) => {
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
      <span className={`amount ${isIncome ? "positive" : "negative"}`}>
        {amount}
      </span>
    </div>
  );
};

export default TransactionCard;
