/**
 * Authentication feature API layer
 * Handles authentication-related operations
 */
import { supabase } from '../../../shared';

export const authAPI = {
  // Login user
  async login(email, password) {
    const { data, error } = await supabase
      .from('users')
      .select('user_id, email, full_name')
      .eq('email', email)
      .eq('password', password)
      .single();

    if (error) {
      throw new Error('Email hoặc mật khẩu không đúng');
    }

    return data;
  },

  // Register new user
  async register(userData) {
    const { data, error } = await supabase
      .from('users')
      .insert([userData])
      .select()
      .single();

    if (error) {
      throw new Error('Đăng ký thất bại. Vui lòng thử lại.');
    }

    // Create wallet for new user
    await this.createWallet(data.user_id);
    
    return data;
  },

  // Create wallet for user
  async createWallet(userId) {
    const { error } = await supabase
      .from('wallets')
      .insert([{
        user_id: userId,
        balance: 0
      }]);

    if (error) {
      throw new Error('Không thể tạo ví cho người dùng');
    }
  },

  // Reset password
  async resetPassword(email) {
    // This would typically involve sending an email
    // For now, just return success
    return { success: true };
  },
};
