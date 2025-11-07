import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/LandingPage.js";
import Home from "./pages/Home.js";
import Transaction from "./pages/Transaction.js";
import AI from "./pages/AI.js";
import Profile from "./pages/Profile.js";
import History from "./pages/History.js";
import LandingPage from "./pages/LandingPage.js";
import LoginPage from "./pages/LoginPage.js";
import RegisterPage from "./pages/RegisterPage.js";
import ForgotPasswordPage from "./pages/ForgotPasswordPage.js";
import UpdateProfile from "./pages/UpdateProfile.js";
import ProtectedRoute from "./ProtectedRoute";
import Economical from "./pages/Economical.js";
import Preodic from "./pages/Preodic.js";
import Statistic from "./pages/Statistic.js";

function AppRouter() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route
          path="/home"
          element={
            <ProtectedRoute>
              {" "}
              <Home />{" "}
            </ProtectedRoute>
          }
        />
        <Route
          path="/transaction"
          element={
            <ProtectedRoute>
              {" "}
              <Transaction />{" "}
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
              <Profile />
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
