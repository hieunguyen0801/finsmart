/**
 * User entity model layer
 * Custom hooks for user data management
 */
import { useState, useEffect, useCallback } from "react";
import { userRepository } from "../api/userRepository";

export const useUser = (userId) => {
  const [username, setUsername] = useState("");
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchUserData = useCallback(async () => {
    if (!userId) return;

    try {
      const [userData, walletData] = await Promise.all([
        userRepository.fetchUser(userId),
        userRepository.fetchWallet(userId),
      ]);

      if (userData) {
        setUsername(userData.full_name);
      }
      if (walletData) {
        setBalance(walletData.balance);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  return {
    username,
    balance,
    loading,
    refetch: fetchUserData,
  };
};
