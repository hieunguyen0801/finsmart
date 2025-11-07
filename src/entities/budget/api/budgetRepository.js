/**
 * Budget entity API layer
 * Handles all budget/limit-related database operations
 */
import { supabase } from '../../../shared';
import { API_ENDPOINTS } from '../../../shared/config';

export const budgetRepository = {
  // Fetch user's budgets/limits
  async fetchBudgets(userId) {
    const { data, error } = await supabase
      .from(API_ENDPOINTS.LIMITS)
      .select("*")
      .eq("user_id", userId);

    if (error) throw error;
    return data || [];
  },

  // Add new budget
  async addBudget(budgetData) {
    const { data, error } = await supabase
      .from(API_ENDPOINTS.LIMITS)
      .insert([budgetData])
      .select("*");

    if (error) throw error;
    return data[0];
  },

  // Update budget
  async updateBudget(limitId, updateData) {
    const { data, error } = await supabase
      .from(API_ENDPOINTS.LIMITS)
      .update(updateData)
      .eq("limit_id", limitId)
      .select();

    if (error) throw error;
    return data[0];
  },

  // Delete budget
  async deleteBudget(limitId) {
    const { error } = await supabase
      .from(API_ENDPOINTS.LIMITS)
      .delete()
      .eq("limit_id", limitId);

    if (error) throw error;
  },

  // Reset budget usage (when period expires)
  async resetBudgetUsage(limitId) {
    const now = new Date();
    const { data, error } = await supabase
      .from(API_ENDPOINTS.LIMITS)
      .update({
        used: 0,
        start_date: now.toISOString(),
      })
      .eq("limit_id", limitId)
      .select();

    if (error) throw error;
    return data[0];
  },
};
