import { Navigate } from "react-router-dom";
import CryptoJS from "crypto-js";

const SECRET_KEY = process.env.REACT_APP_SECRET_KEY;

const ProtectedRoute = ({ children }) => {
  const encryptedUserId = localStorage.getItem("user_id");

  if (!encryptedUserId) {
    return <Navigate to="/login" />; // Chưa đăng nhập, quay lại login
  }

  try {
    const bytes = CryptoJS.AES.decrypt(encryptedUserId, SECRET_KEY);
    const userId = parseInt(bytes.toString(CryptoJS.enc.Utf8), 10);
    if (!userId) {
      return <Navigate to="/login" />;
    }
  } catch (error) {
    return <Navigate to="/login" />;
  }

  return children;
};

export default ProtectedRoute;
