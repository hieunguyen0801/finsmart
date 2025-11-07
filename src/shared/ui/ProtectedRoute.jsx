/**
 * Shared UI component - Protected Route
 * Wrapper component that protects routes requiring authentication
 */
import React from 'react';
import { useAuth } from '../hooks';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>Yêu cầu đăng nhập</h2>
        <p>Vui lòng đăng nhập để truy cập trang này.</p>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
