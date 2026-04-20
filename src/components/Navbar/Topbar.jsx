import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { HiClipboardCheck } from "react-icons/hi";
import "./Topbar.css";
import { useUnreadCount } from "./Navbar.jsx";

const ADMIN_ROUTES = [
  "/dashboard-admin",
  "/adduser",
  "/editUser",
];

const Topbar = ({ isNavOpen, onToggleNav }) => {
  const location = useLocation();
  const navigate  = useNavigate();

  const userId   = sessionStorage.getItem("userId");
  const userRole = sessionStorage.getItem("userRole");
  const userName = sessionStorage.getItem("userName");
  const initials = userName ? userName.substring(0, 2).toUpperCase() : "PS";

  const isAdminPage = ADMIN_ROUTES.some((route) =>
    location.pathname.startsWith(route)
  );
  const isAdmin = userRole === "Admin";

  const [showPopup, setShowPopup] = useState(false);

  const unreadCount = useUnreadCount(userId);

  const handleAdmin   = () => navigate("/dashboard-admin");
  const handleHome    = () => navigate("/dashboard");
  const handleProfile = () => { navigate("/profile"); setShowPopup(false); };
  const handleBell    = () => navigate("/notifications");
  const handleLogout  = () => {
    sessionStorage.clear();
    localStorage.clear();
    navigate("/", { replace: true });
  };

  return (
    <>
      <header className="topbar">
        <div className="topbar-left">

          {/* Hamburger toggle — always visible */}
          <button
            className="hamburger-btn"
            onClick={onToggleNav}
            aria-label="Toggle navigation"
            aria-expanded={isNavOpen}
            aria-controls="app-sidebar"
            type="button"
          >
            <i className="bi bi-list" />
          </button>

          <HiClipboardCheck className="topbar-icon" />
          <span className="project-title">Project Hub</span>
        </div>

        <div className="topbar-right">

          {isAdminPage && (
            <div className="admin-btn" onClick={handleHome}>
              <i className="bi bi-house me-1" />
              Home
            </div>
          )}

          {isAdmin && !isAdminPage && (
            <div className="admin-btn" onClick={handleAdmin}>
              <i className="bi bi-shield-lock me-1" />
              Admin
            </div>
          )}

          {/* Bell icon */}
          <div
            onClick={handleBell}
            style={{
              position:    "relative",
              cursor:      "pointer",
              display:     "flex",
              alignItems:  "center",
              color:       "#fff",
            }}
          >
            <i
              className={`bi bi-bell bell-icon ${
                location.pathname === "/notifications" ? "text-primary" : ""
              }`}
              style={{ fontSize: 20, color: "#fff" }}
            />
            {unreadCount > 0 && (
              <span style={{
                position:       "absolute",
                top:            -4,
                right:          -4,
                background:     "#dc3545",
                color:          "#fff",
                borderRadius:   "50%",
                fontSize:       9,
                fontWeight:     700,
                width:          16,
                height:         16,
                display:        "flex",
                alignItems:     "center",
                justifyContent: "center",
                lineHeight:     1,
              }}>
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </div>

          {/* Profile circle */}
          <div
            className="profile-section"
            onClick={() => setShowPopup((p) => !p)}
          >
            <div className="profile-circle">{initials}</div>
            <span className="dropdown-arrow">▾</span>
          </div>

        </div>
      </header>

      {showPopup && (
        <>
          <div className="popup-backdrop" onClick={() => setShowPopup(false)} />

          <div className="popup-box">
            <div className="popup-header">
              <div className="popup-avatar">{initials}</div>
              <div>
                <div className="popup-name">{userName || "Project Hub"}</div>
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