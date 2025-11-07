/**
 * Shared authentication hook
 * Provides user authentication state and utilities
 */
import { useState, useEffect } from 'react';
import CryptoJS from 'crypto-js';
import { SECRET_KEY } from '../config';

export const useAuth = () => {
  const [userId, setUserId] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    try {
      const encryptedUserId = localStorage.getItem("user_id");
      if (encryptedUserId && SECRET_KEY) {
        const bytes = CryptoJS.AES.decrypt(encryptedUserId, SECRET_KEY);
        const decryptedId = parseInt(bytes.toString(CryptoJS.enc.Utf8), 10);
        if (!isNaN(decryptedId)) {
          setUserId(decryptedId);
          setIsAuthenticated(true);
        }
      }
    } catch (error) {
      console.error("Error decrypting user ID:", error);
      setUserId(null);
      setIsAuthenticated(false);
    }
  }, []);

  const logout = () => {
    localStorage.removeItem("user_id");
    setUserId(null);
    setIsAuthenticated(false);
  };

  return {
    userId,
    isAuthenticated,
    logout,
  };
};
