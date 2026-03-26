import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children, adminOnly = false }) => {
    const userId   = sessionStorage.getItem("userId");
    const userRole = sessionStorage.getItem("userRole");  // "Admin" or "User"


    if (!userId) {
        return <Navigate to="/" replace />;
    }

    // Admin only route → non-admin gets redirected to dashboard
    if (adminOnly && userRole !== "Admin") {
        return <Navigate to="/dashboard" replace />;
    }

    return children;
};

export default ProtectedRoute;