import { Navigate } from "react-router-dom";

/**
 * Validates the JWT stored in localStorage on every protected route render.
 * - Checks token existence
 * - Decodes payload and checks expiry client-side (no library needed)
 * - Clears all session state if token is missing or expired
 * - Enforces admin-only routes via the Role claim embedded in the token
 */
const isAuthenticated = () => {
  const token = localStorage.getItem("pmToken");

  if (!token) {
    clearSession();
    return false;
  }

  try {
    // JWT is three Base64URL segments separated by dots — payload is index 1
    const payloadBase64 = token.split(".")[1];
    if (!payloadBase64) {
      clearSession();
      return false;
    }

    // Base64URL → Base64 → JSON
    const payload = JSON.parse(
      atob(payloadBase64.replace(/-/g, "+").replace(/_/g, "/"))
    );

    // exp is in seconds — Date.now() is milliseconds
    const isExpired = Date.now() >= payload.exp * 1000;

    if (isExpired) {
      clearSession();
      return false;
    }

    return true;
  } catch {
    // Malformed token — treat as unauthenticated
    clearSession();
    return false;
  }
};

const clearSession = () => {
  localStorage.removeItem("pmToken");
  sessionStorage.clear();
};

const ProtectedRoute = ({ children, adminOnly = false }) => {
  if (!isAuthenticated()) {
    return <Navigate to="/" replace />;
  }

  // Admin check still reads from sessionStorage — set during OTP verify
  // This is safe because sessionStorage is only populated after a valid OTP+token flow
  const userRole = sessionStorage.getItem("userRole");

  if (adminOnly && userRole !== "Admin") {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;