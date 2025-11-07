/**
 * Transaction-add feature API layer
 * Handles transaction creation and related operations
 */
import { supabase } from '../../../shared';
import { API_ENDPOINTS, TRANSACTION_TYPES } from '../../../shared/config';

export const addTransactionAPI = {
  // Add a new transaction (income or expense)
  async addTransaction(transactionData, transactionType) {
    const tableName = transactionType === TRANSACTION_TYPES.INCOME 
      ? API_ENDPOINTS.INCOME 
      : API_ENDPOINTS.TRANSACTIONS;

    const { error } = await supabase
      .from(tableName)
      .insert([transactionData]);

    if (error) throw error;
  },

  // Fetch user's limits/budgets
  async fetchLimits(userId) {
    const { data, error } = await supabase
      .from(API_ENDPOINTS.LIMITS)
      .select("*")
      .eq("user_id", userId);

    if (error) throw error;
    return data || [];
  },

  // Update limit usage
  async updateLimitUsage(limitId, newUsedAmount) {
    const { error } = await supabase
      .from(API_ENDPOINTS.LIMITS)
      .update({ used: newUsedAmount })
      .eq("limit_id", limitId);

    if (error) throw error;
  },
};
