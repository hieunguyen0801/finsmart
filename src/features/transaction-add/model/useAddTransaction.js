/**
 * Transaction-add feature model layer
 * Custom hooks for transaction creation logic
 */
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { addTransactionAPI } from "../api/addTransaction";
import { userRepository } from "../../../entities/user";
import { TRANSACTION_TYPES } from "../../../shared/config";

export const useAddTransaction = (userId) => {
  const navigate = useNavigate();
  const [limits, setLimits] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchLimits = useCallback(async () => {
    try {
      const data = await addTransactionAPI.fetchLimits(userId);
      setLimits(data);
    } catch (error) {
      console.error("Error fetching limits:", error.message);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      fetchLimits();
    }
  }, [userId, fetchLimits]);

  const addTransaction = async (transactionData) => {
    if (!userId) {
      alert("Không xác thực được người dùng. Vui lòng đăng nhập lại.");
      navigate("/login");
      return;
    }

    const amountNumber = parseFloat(transactionData.amount);

    if (
      !transactionData.amount ||
      !transactionData.category ||
      !transactionData.date
    ) {
      alert("Vui lòng nhập đầy đủ số tiền, chọn hạng mục và ngày giao dịch.");
      return;
    }

    if (isNaN(amountNumber) || amountNumber <= 0) {
      alert("Số tiền không hợp lệ. Vui lòng nhập số lớn hơn 0.");
      return;
    }

    // Validate date
    const selectedDate = new Date(transactionData.date);
    const currentDate = new Date();
    if (selectedDate > currentDate) {
      alert("Ngày giao dịch không hợp lệ. Vui lòng chọn lại ngày.");
      return;
    }

    setLoading(true);

    try {
      // Get wallet information
      const walletInfo = await userRepository.getWalletId(userId);
      const walletId = walletInfo.wallet_id;
      const currentBalance = walletInfo.balance;

      // Prepare transaction data
      const finalTransactionData = {
        user_id: userId,
        wallet_id: walletId,
        category: transactionData.category,
        amount: amountNumber,
        created_at: new Date(transactionData.date).toISOString(),
        note: transactionData.note || null,
      };

      let newBalance;
      const transactionType = transactionData.type;

      if (transactionType === TRANSACTION_TYPES.INCOME) {
        newBalance = currentBalance + amountNumber;
      } else {
        newBalance = currentBalance - amountNumber;

        // Check if balance is sufficient
        if (newBalance < 0) {
          throw new Error("Số dư không đủ để thực hiện giao dịch này.");
        }

        // Handle limit updates if applicable
        if (transactionData.limitId) {
          const selectedLimit = limits.find(
            (limit) => limit.limit_id === transactionData.limitId
          );

          if (selectedLimit) {
            const newUsedAmount = (selectedLimit.used || 0) + amountNumber;

            // Check if limit would be exceeded
            if (newUsedAmount > selectedLimit.limit_amount) {
              alert(
                `Hạn mức "${selectedLimit.limit_name}" đã vượt quá giới hạn ${selectedLimit.limit_amount}. Vui lòng chọn danh mục khác hoặc hạn mức khác`
              );
              return;
            }

            // Update limit usage
            await addTransactionAPI.updateLimitUsage(
              selectedLimit.limit_id,
              newUsedAmount
            );
            finalTransactionData.limit_id = transactionData.limitId;
          }
        }
      }

      // Add transaction to database
      await addTransactionAPI.addTransaction(
        finalTransactionData,
        transactionType
      );

      // Update wallet balance
      await userRepository.updateWalletBalance(walletId, newBalance);

      alert("Thêm giao dịch thành công.");
      return true;
    } catch (error) {
      console.error("Lỗi khi xử lý giao dịch:", error.message || error);
      alert(
        `Đã xảy ra lỗi: ${
          error.message || "Thêm giao dịch không thành công. Vui lòng thử lại."
        }`
      );
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    limits,
    addTransaction,
    loading,
    refetchLimits: fetchLimits,
  };
};
