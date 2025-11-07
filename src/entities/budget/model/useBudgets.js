/**
 * Budget entity model layer
 * Custom hooks for budget/limit data management
 */
import { useState, useEffect, useCallback } from 'react';
import { budgetRepository } from '../api/budgetRepository';

export const useBudgets = (userId) => {
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchBudgets = useCallback(async () => {
    if (!userId) return;

    try {
      // Check localStorage cache first
      const cached = localStorage.getItem("budgets");
      if (cached) {
        setBudgets(JSON.parse(cached));
      }

      const data = await budgetRepository.fetchBudgets(userId);

      // Update cache if data changed
      if (!cached || JSON.stringify(data) !== cached) {
        setBudgets(data);
        localStorage.setItem("budgets", JSON.stringify(data));
      }
    } catch (error) {
      console.error("Lỗi khi lấy dữ liệu hạn mức:", error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const addBudget = useCallback(async (budgetData) => {
    try {
      const newBudget = await budgetRepository.addBudget({
        ...budgetData,
        user_id: userId,
        start_date: new Date(budgetData.startDate).toISOString(),
      });

      setBudgets(prevBudgets => [...prevBudgets, newBudget]);
      localStorage.setItem("budgets", JSON.stringify([...budgets, newBudget]));
      return newBudget;
    } catch (error) {
      console.error("Lỗi khi thêm hạn mức:", error);
      throw error;
    }
  }, [userId, budgets]);

  const updateBudget = useCallback(async (limitId, updateData) => {
    try {
      const updatedBudget = await budgetRepository.updateBudget(limitId, {
        limit_category: updateData.category,
        limit_amount: updateData.max,
        used: updateData.current,
        limit_name: updateData.name,
        limit_time: updateData.timePeriod,
        start_date: new Date(updateData.startDate).toISOString(),
      });

      const updatedBudgets = budgets.map((budget) =>
        budget.limit_id === limitId ? { ...budget, ...updatedBudget } : budget
      );

      setBudgets(updatedBudgets);
      localStorage.setItem("budgets", JSON.stringify(updatedBudgets));
      return updatedBudget;
    } catch (error) {
      console.error("Lỗi khi cập nhật hạn mức:", error);
      throw error;
    }
  }, [budgets]);

  const deleteBudget = useCallback(async (limitId) => {
    try {
      await budgetRepository.deleteBudget(limitId);
      const updatedBudgets = budgets.filter((budget) => budget.limit_id !== limitId);
      setBudgets(updatedBudgets);
      localStorage.setItem("budgets", JSON.stringify(updatedBudgets));
    } catch (error) {
      console.error("Lỗi khi xóa hạn mức:", error);
      throw error;
    }
  }, [budgets]);

  // Check and reset expired budgets
  const checkAndResetBudgets = useCallback(async () => {
    const now = new Date();

    const updatedBudgets = await Promise.all(
      budgets.map(async (budget) => {
        const startDate = new Date(budget.start_date);
        const endDate = getEndDate(startDate, budget.limit_time);

        if (now >= endDate) {
          try {
            await budgetRepository.resetBudgetUsage(budget.limit_id);
            return { ...budget, used: 0, start_date: now.toISOString() };
          } catch (error) {
            console.error("Lỗi khi reset hạn mức:", error);
            return budget;
          }
        }
        return budget;
      })
    );

    setBudgets(updatedBudgets);
    localStorage.setItem("budgets", JSON.stringify(updatedBudgets));
  }, [budgets]);

  useEffect(() => {
    fetchBudgets();
  }, [fetchBudgets]);

  return {
    budgets,
    loading,
    addBudget,
    updateBudget,
    deleteBudget,
    checkAndResetBudgets,
    refetch: fetchBudgets,
  };
};

// Helper function to calculate end date based on time period
function getEndDate(startDate, timePeriod) {
  const end = new Date(startDate);

  switch (timePeriod) {
    case "5min":
      end.setMinutes(end.getMinutes() + 5);
      break;
    case "day":
      end.setDate(end.getDate() + 1);
      break;
    case "week":
      end.setDate(end.getDate() + 7);
      break;
    case "month":
      end.setMonth(end.getMonth() + 1);
      break;
    case "year":
      end.setFullYear(end.getFullYear() + 1);
      break;
    default:
      break;
  }

  return end;
}
