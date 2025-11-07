/**
 * Authentication feature model layer
 * Custom hooks for authentication logic
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CryptoJS from 'crypto-js';
import { authAPI } from '../api/authAPI';
import { SECRET_KEY } from '../../../shared/config';

export const useAuth = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const user = await authAPI.login(email, password);
      
      // Encrypt user ID and store in localStorage
      const encryptedUserId = CryptoJS.AES.encrypt(user.user_id.toString(), SECRET_KEY).toString();
      localStorage.setItem("user_id", encryptedUserId);
      
      navigate("/home");
      return user;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    setLoading(true);
    try {
      const user = await authAPI.register(userData);
      
      // Encrypt user ID and store in localStorage
      const encryptedUserId = CryptoJS.AES.encrypt(user.user_id.toString(), SECRET_KEY).toString();
      localStorage.setItem("user_id", encryptedUserId);
      
      navigate("/home");
      return user;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("user_id");
    navigate("/");
  };

  const resetPassword = async (email) => {
    setLoading(true);
    try {
      const result = await authAPI.resetPassword(email);
      return result;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    login,
    register,
    logout,
    resetPassword,
    loading,
  };
};
