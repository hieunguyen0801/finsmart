/**
 * Transaction entity model layer
 * Custom hooks for transaction data management
 */
import { useState, useEffect, useCallback } from "react";
import { transactionRepository } from "../api/transactionRepository";

export const useTransactions = (userId) => {
  const [history, setHistory] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [chartDataDefault, setChartDataDefault] = useState([]);
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalIncomeDefault, setTotalIncomeDefault] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);
  const [totalExpenseDefault, setTotalExpenseDefault] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchTransactionData = useCallback(async () => {
    if (!userId) return;

    try {
      const [historyData, chartDataResult, chartDataDefaultResult] =
        await Promise.all([
          transactionRepository.fetchHistory(userId),
          transactionRepository.fetchChartData(userId),
          transactionRepository.fetchChartDataDefault(userId),
        ]);

      setHistory(historyData);
      setChartData(chartDataResult.chartData);
      setChartDataDefault(chartDataDefaultResult.chartData);
      setTotalIncome(chartDataResult.totalIncome);
      setTotalIncomeDefault(chartDataDefaultResult.totalIncome);
      setTotalExpense(chartDataResult.totalExpense);
      setTotalExpenseDefault(chartDataDefaultResult.totalExpense);
    } catch (error) {
      console.error("Error fetching transaction data:", error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchTransactionData();
  }, [userId, fetchTransactionData]);

  return {
    history,
    chartData,
    chartDataDefault,
    totalIncome,
    totalIncomeDefault,
    totalExpense,
    totalExpenseDefault,
    loading,
    refetch: fetchTransactionData,
  };
};
