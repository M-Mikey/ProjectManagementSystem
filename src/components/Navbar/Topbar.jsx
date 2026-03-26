import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { HiClipboardCheck } from "react-icons/hi";
import "./Topbar.css";

// All admin-related routes
const ADMIN_ROUTES = [
    "/dashboard-admin",
    "/adduser",
    "/editUser"
];

const Topbar = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const userId   = sessionStorage.getItem("userId");
    const userRole = sessionStorage.getItem("userRole");   // "Admin" or "User"
    const userName = sessionStorage.getItem("userName");
    const initials = userName
        ? userName.substring(0, 2).toUpperCase()
        : "PS";

    const isAdminPage = ADMIN_ROUTES.some(route =>
        location.pathname.startsWith(route)
    );

    const isAdmin = userRole === "Admin";

    const [showPopup, setShowPopup] = useState(false);

    const handleAdmin   = () => navigate("/dashboard-admin");
    const handleHome    = () => navigate("/dashboard");
    const handleProfile = () => { navigate("/profile"); setShowPopup(false); };
    const handleLogout  = () => {
        sessionStorage.clear();
        localStorage.clear();
        navigate("/", { replace: true });
    };

    return (
        <>
            <header className="topbar">
                <div className="topbar-left">
                    <HiClipboardCheck className="topbar-icon" />
                    <span className="project-title">Project Hub</span>
                </div>

                <div className="topbar-right">

                    {/* Show Home button when on admin pages */}
                    {isAdminPage && (
                        <div className="admin-btn" onClick={handleHome}>
                            <i className="bi bi-house me-1" />
                            Home
                        </div>
                    )}

                    {/* Show Admin button only for Admin role users
                        and only when NOT on admin pages */}
                    {isAdmin && !isAdminPage && (
                        <div className="admin-btn" onClick={handleAdmin}>
                            <i className="bi bi-shield-lock me-1" />
                            Admin
                        </div>
                    )}

                    <div className="profile-section"
                        onClick={() => setShowPopup(p => !p)}>
                        <div className="profile-circle">{initials}</div>
                        <span className="dropdown-arrow">▾</span>
                    </div>
                </div>
            </header>

            {/* POPUP MODAL */}
            {showPopup && (
                <>
                    <div className="popup-backdrop"
                        onClick={() => setShowPopup(false)} />

                    <div className="popup-box">
                        <div className="popup-header">
                            <div className="popup-avatar">{initials}</div>
                            <div>
                                <div className="popup-name">
                                    {userName || "Project Hub"}
                                </div>
                                <div className="popup-role">{userRole || "User"}</div>
                            </div>
                        </div>

                        <div className="popup-divider" />

                        <button className="popup-btn" onClick={handleProfile}>
                            <i className="bi bi-person me-1" /> View Profile
                        </button>

                        <button className="popup-btn logout-btn" onClick={handleLogout}>
                            <i className="bi bi-box-arrow-right me-1" /> Logout
                        </button>
                    </div>
                </>
            )}
        </>
    );
};

export default Topbar;