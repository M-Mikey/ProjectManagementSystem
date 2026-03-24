import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "./Navbar.css";
import {
  getNotifications,
} from "../../api/notificationApi";

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const userId   = sessionStorage.getItem("userId");

  const [unreadCount, setUnreadCount] = useState(0);

  const isActive = (path) => location.pathname === path;

  // Load unread count on mount + every 30s
  useEffect(() => {
    if (!userId) return;
    loadUnreadCount();
    const interval = setInterval(loadUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [userId]);

  const loadUnreadCount = async () => {
    try {
      const result = await getNotifications(userId);
      setUnreadCount(result.unreadCount || 0);
    } catch (err) {
      console.error("Failed to load unread count:", err);
    }
  };

  // Navigate to the dedicated notifications page
  const handleBellClick = () => {
    navigate("/notifications");
  };

  return (
    <div className="sidebar">

      {/* ── TOP NAV ITEMS */}
      <div className="sidebar-top">

        <Link
          to="/AddProject"
          className={`menu-item create-item ${
            isActive("/AddProject") ? "active" : ""}`}
        >
          <div className="icon-box">
            <i className="bi bi-plus"></i>
          </div>
          <span>CREATE</span>
        </Link>

        <Link
          to="/dashboard"
          className={`menu-item ${isActive("/dashboard") ? "active" : ""}`}
        >
          <i className="bi bi-house-door-fill"></i>
          <span>HOME</span>
        </Link>

        <Link
          to="/project_dashboard"
          className={`menu-item ${
            isActive("/project_dashboard") ? "active" : ""}`}
        >
          <i className="bi bi-box-seam"></i>
          <span>PROJECTS</span>
        </Link>

        <Link
          to="/reports"
          className={`menu-item ${isActive("/reports") ? "active" : ""}`}
        >
          <i className="bi bi-grid-1x2"></i>
          <span>REPORTS</span>
        </Link>

        <Link
          to="/project_approval"
          className={`menu-item ${
            isActive("/project_approval") ? "active" : ""}`}
        >
          <i className="bi bi-patch-check-fill"></i>
          <span>APPROVAL</span>
        </Link>

        <Link
          to="/user_dashboard"
          className={`menu-item ${
            isActive("/user_dashboard") ? "active" : ""}`}
        >
          <i className="bi bi-speedometer2"></i>
          <span>USER DASHBOARD</span>
        </Link>

      </div>

      {/* ── BOTTOM — BELL (navigates to /notifications page) */}
      <div className="sidebar-bottom">
        <div
          className="sidebar-icon-wrap"
          onClick={handleBellClick}
          style={{ position: "relative", cursor: "pointer" }}
        >
          <i
            className={`bi bi-bell bell-icon ${
              location.pathname === "/notifications" ? "text-primary" : ""
            }`}
          />

          {/* Unread count badge */}
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
      </div>

    </div>
  );
};

export default Navbar;