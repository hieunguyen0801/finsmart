/**
 * Budget entity UI component
 * Right panel component for displaying spending limits
 */
import React, { useState, useRef } from 'react';
import BudgetForm from './BudgetForm';

const SpendingLimitsPanel = ({ 
  budgets, 
  onAddBudget, 
  onUpdateBudget, 
  onDeleteBudget 
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const formRef = useRef(null);

  const handleAddBudget = async (budgetData) => {
    try {
      await onAddBudget(budgetData);
      setShowAddForm(false);
    } catch (error) {
      console.error("Error adding budget:", error);
    }
  };

  const handleUpdateBudget = async (limitId, budgetData) => {
    try {
      await onUpdateBudget(limitId, budgetData);
      setEditingBudget(null);
      setShowAddForm(false);
    } catch (error) {
      console.error("Error updating budget:", error);
    }
  };

  const handleDeleteBudget = async (limitId) => {
    try {
      await onDeleteBudget(limitId);
    } catch (error) {
      console.error("Error deleting budget:", error);
    }
  };

  return (
    <div className="spending-limit">
      <p className="title">Hạn Mức Chi Tiêu</p>
      <button
        onClick={() => {
          setShowAddForm(true);
          setEditingBudget(null);
          setTimeout(() => {
            formRef.current?.scrollIntoView({ behavior: "smooth" });
          }, 100);
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
                      setEditingBudget(budget);
                      setShowAddForm(false);
                    }}
                  >
                    Sửa
                  </button>
                  <button onClick={() => handleDeleteBudget(budget.limit_id)}>
                    Xóa
                  </button>
                </div>

                {editingBudget?.limit_id === budget.limit_id && (
                  <BudgetForm
                    budget={editingBudget}
                    onSave={handleUpdateBudget}
                    onCancel={() => setEditingBudget(null)}
                  />
                )}
              </li>
            ))}
          </ul>
        )}

        {showAddForm && !editingBudget && (
          <div ref={formRef}>
            <BudgetForm
              budget={{
                name: "",
                current: 0,
                max: 0,
                timePeriod: "month",
              }}
              onSave={handleAddBudget}
              onCancel={() => setShowAddForm(false)}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default SpendingLimitsPanel;
