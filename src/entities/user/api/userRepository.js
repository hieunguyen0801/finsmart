/**
 * User entity API layer
 * Handles all user-related database operations
 */
import { supabase } from '../../../shared';

export const userRepository = {
  // Fetch user information by ID
  async fetchUser(userId) {
    const { data, error } = await supabase
      .from("users")
      .select("full_name")
      .eq("user_id", userId)
      .single();

    if (error) {
      console.error("Error fetching user:", error);
      return null;
    }

    return data;
  },

  // Fetch user's wallet information
  async fetchWallet(userId) {
    const { data, error } = await supabase
      .from("wallets")
      .select("balance")
      .eq("user_id", userId)
      .single();

    if (error) {
      console.error("Error fetching wallet:", error);
      return null;
    }

    return data;
  },

  // Update user's wallet balance
  async updateWalletBalance(walletId, newBalance) {
    const { error } = await supabase
      .from("wallets")
      .update({ balance: newBalance })
      .eq("wallet_id", walletId);

    if (error) {
      console.error("Error updating wallet balance:", error);
      throw error;
    }
  },

  // Get user's wallet ID
  async getWalletId(userId) {
    const { data, error } = await supabase
      .from("wallets")
      .select("wallet_id, balance")
      .eq("user_id", userId)
      .limit(1);

    if (error) {
      console.error("Error fetching wallet ID:", error);
      throw error;
    }

    if (!data || data.length === 0) {
      throw new Error("Không tìm thấy ví của bạn. Vui lòng tạo ví trước.");
    }

    return data[0];
  },
};
