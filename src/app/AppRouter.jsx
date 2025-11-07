/**
 * App layer - Application Router
 * Main routing configuration for the application
 */
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import ProtectedRoute from "../shared/ui/ProtectedRoute";

// Import pages
import HomePage from "../pages/HomePage";
import TransactionsPage from "../pages/TransactionsPage";
import ProfilePage from "../pages/ProfilePage";

// Import legacy pages (will be refactored later)
import Login from "../frontend/pages/LandingPage";
import AI from "../frontend/pages/AI";
import History from "../frontend/pages/History";
import LandingPage from "../frontend/pages/LandingPage";
import LoginPage from "../frontend/pages/LoginPage";
import RegisterPage from "../frontend/pages/RegisterPage";
import ForgotPasswordPage from "../frontend/pages/ForgotPasswordPage";
import UpdateProfile from "../frontend/pages/UpdateProfile";
import Economical from "../frontend/pages/Economical";
import Preodic from "../frontend/pages/Preodic";
import Statistic from "../frontend/pages/Statistic";

function AppRouter() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/transaction"
          element={
            <ProtectedRoute>
              <TransactionsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/preodic"
          element={
            <ProtectedRoute>
              <Preodic />
            </ProtectedRoute>
          }
        />
        <Route
          path="/statistic"
          element={
            <ProtectedRoute>
              <Statistic />
            </ProtectedRoute>
          }
        />
        <Route
          path="/economical"
          element={
            <ProtectedRoute>
              <Economical />
            </ProtectedRoute>
          }
        />
        <Route
          path="/ai"
          element={
            <ProtectedRoute>
              <AI />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/history"
          element={
            <ProtectedRoute>
              <History />
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route
          path="/update-profile"
          element={
            <ProtectedRoute>
              <UpdateProfile />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default AppRouter;
