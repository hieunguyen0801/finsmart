/**
 * TransactionList widget UI component
 * Composite widget that displays a list of transactions
 */
import React from "react";
import { TransactionCard } from "../../../entities/transaction";

const TransactionList = ({ history, onViewAll }) => {
  return (
    <div className="transaction-history">
      <div className="tabs">
        <p>Lịch sử giao dịch</p>
      </div>
      <div className="transaction-list">
        {history.map((item, index) => (
          <TransactionCard key={index} item={item} index={index} />
        ))}
      </div>
      <button className="view-history" onClick={onViewAll}>
        Xem Toàn Bộ Lịch Sử
      </button>
    </div>
  );
};

export default TransactionList;
