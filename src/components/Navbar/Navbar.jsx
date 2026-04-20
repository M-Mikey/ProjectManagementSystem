import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import "./Navbar.css";
import { getNotifications } from "../../api/notificationApi";

export const useUnreadCount = (userId) => {
  const [unreadCount, setUnreadCount] = useState(0);

  const load = async () => {
    if (!userId) return;
    try {
      const result = await getNotifications(userId);
      setUnreadCount(result.unreadCount || 0);
    } catch (err) {
      console.error("Failed to load unread count:", err);
    }
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, [userId]);

  return unreadCount;
};

const Navbar = ({ isNavOpen, isMobile, onClose }) => {
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  return (
    <>
      <aside
        id="app-sidebar"
        className={[
          "sidebar",
          isNavOpen  ? "sidebar--open"   : "sidebar--closed",
          isMobile   ? "sidebar--mobile" : "",
        ]
          .filter(Boolean)
          .join(" ")}
        inert={!isNavOpen ? "" : undefined}
      >
        <div className="sidebar-top">

          <Link
            to="/AddProject"
            className={`menu-item create-item ${isActive("/AddProject") ? "active" : ""}`}
            onClick={isMobile ? onClose : undefined}
          >
            <div className="icon-box">
              <i className="bi bi-plus" />
            </div>
            <span>CREATE</span>
          </Link>

          <Link
            to="/dashboard"
            className={`menu-item ${isActive("/dashboard") ? "active" : ""}`}
            onClick={isMobile ? onClose : undefined}
          >
            <i className="bi bi-house-door-fill" />
            <span>HOME</span>
          </Link>

          <Link
            to="/project_dashboard"
            className={`menu-item ${isActive("/project_dashboard") ? "active" : ""}`}
            onClick={isMobile ? onClose : undefined}
          >
            <i className="bi bi-box-seam" />
            <span>PROJECTS</span>
          </Link>

          <Link
            to="/reports"
            className={`menu-item ${isActive("/reports") ? "active" : ""}`}
            onClick={isMobile ? onClose : undefined}
          >
            <i className="bi bi-grid-1x2" />
            <span>REPORTS</span>
          </Link>

          <Link
            to="/project_approval"
            className={`menu-item ${isActive("/project_approval") ? "active" : ""}`}
            onClick={isMobile ? onClose : undefined}
          >
            <i className="bi bi-patch-check-fill" />
            <span>APPROVAL</span>
          </Link>

          <Link
            to="/user_dashboard"
            className={`menu-item ${isActive("/user_dashboard") ? "active" : ""}`}
            onClick={isMobile ? onClose : undefined}
          >
            <i className="bi bi-speedometer2" />
            <span>USER DASHBOARD</span>
          </Link>

        </div>

        <div className="sidebar-bottom" />
      </aside>
    </>
  );
};

export default Navbar;