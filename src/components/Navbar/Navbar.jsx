import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "./Navbar.css";
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead
} from "../../api/notificationApi";

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const userId   = sessionStorage.getItem("userId");

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount]     = useState(0);
  const [showPanel, setShowPanel]         = useState(false);
  const [loading, setLoading]             = useState(false);

  const panelRef = useRef(null);

  const isActive = (path) => location.pathname === path;

  // ─────────────────────────────────────────
  // Load notifications on mount + every 30s
  // ─────────────────────────────────────────
  useEffect(() => {
    if (!userId) return;
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, [userId]);

  // Close panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setShowPanel(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const loadNotifications = async () => {
    try {
      const result = await getNotifications(userId);
      console.log("Notifications result:", result);
      setNotifications(result.notifications || []);
      setUnreadCount(result.unreadCount || 0);
    } catch (err) {
      console.error("Failed to load notifications:", err);
    }
  };

  const handleBellClick = async () => {
    setShowPanel(prev => !prev);
    if (!showPanel) {
      setLoading(true);
      await loadNotifications();
      setLoading(false);
    }
  };

  const handleNotifClick = async (notif) => {
    try {
      await markNotificationRead(notif.id, userId);
      setNotifications(prev => prev.filter(n => n.id !== notif.id));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error(err);
    }
    if (notif.linkUrl) {
      setShowPanel(false);
      navigate(notif.linkUrl);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead(userId);
      setNotifications([]);
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  // ─────────────────────────────────────────
  // ✅ All notification types per flow
  // ─────────────────────────────────────────
  const getNotifIcon = (type) => {
    switch (type) {
      // Existing
      case "APPROVAL":
        return "bi bi-check-circle-fill text-success";
      case "REMARK":
        return "bi bi-chat-left-text-fill text-primary";
      case "STATUS":
        return "bi bi-arrow-repeat text-warning";
      case "TASK_ASSIGNED":
        return "bi bi-person-check-fill text-info";
      // ✅ New per flow
      case "TASK_ACK":
        return "bi bi-hand-thumbs-up-fill text-success";
      case "MILESTONE_ACK":
        return "bi bi-flag-fill text-primary";
      case "PROJECT_ACK":
        return "bi bi-folder-check text-primary";
      case "MILESTONE_CLOSED":
        return "bi bi-flag-fill text-success";
      case "PROJECT_CLOSED":
        return "bi bi-folder-x text-success";
      case "TASK_COMPLETION":
        return "bi bi-clipboard-check-fill text-success";
      default:
        return "bi bi-bell-fill text-secondary";
    }
  };

  // ─────────────────────────────────────────
  // Notification type label
  // ─────────────────────────────────────────
  const getNotifLabel = (type) => {
    switch (type) {
      case "APPROVAL":        return { text: "Approval",           color: "#198754" };
      case "REMARK":          return { text: "Remark",             color: "#0d6efd" };
      case "STATUS":          return { text: "Status Update",      color: "#ffc107" };
      case "TASK_ASSIGNED":   return { text: "Task Assigned",      color: "#0dcaf0" };
      case "TASK_ACK":        return { text: "Task ACK",           color: "#198754" };
      case "MILESTONE_ACK":   return { text: "Milestone ACK",      color: "#0d6efd" };
      case "PROJECT_ACK":     return { text: "Project ACK",        color: "#0d6efd" };
      case "MILESTONE_CLOSED":return { text: "Milestone Closed",   color: "#198754" };
      case "PROJECT_CLOSED":  return { text: "Project Closed",     color: "#198754" };
      case "TASK_COMPLETION": return { text: "Task Completion",    color: "#198754" };
      default:                return { text: "Notification",       color: "#6c757d" };
    }
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

      {/* ── BOTTOM — BELL */}
      <div className="sidebar-bottom">
        <div ref={panelRef} style={{ position: "relative" }}>

          {/* Bell Button */}
          <div
            className="sidebar-icon-wrap"
            onClick={handleBellClick}
            style={{ position: "relative", cursor: "pointer" }}
          >
            <i className="bi bi-bell bell-icon"></i>

            {/* ✅ Unread count badge */}
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

          {/* ── NOTIFICATION PANEL */}
          {showPanel && (
            <div style={{
              position:      "absolute",
              bottom:        40,
              left:          50,
              width:         340,
              maxHeight:     480,
              background:    "#fff",
              borderRadius:  12,
              boxShadow:     "0 8px 32px rgba(0,0,0,0.18)",
              zIndex:        9999,
              overflow:      "hidden",
              display:       "flex",
              flexDirection: "column",
            }}>

              {/* Panel Header */}
              <div style={{
                padding:        "12px 16px",
                borderBottom:   "1px solid #e9ecef",
                display:        "flex",
                alignItems:     "center",
                justifyContent: "space-between",
                background:     "#0b2d6b",
              }}>
                <div style={{
                  display:    "flex",
                  alignItems: "center",
                  gap:        8
                }}>
                  <i className="bi bi-bell-fill"
                    style={{ color: "#fff", fontSize: 14 }} />
                  <span style={{
                    fontWeight: 700,
                    fontSize:   14,
                    color:      "#fff"
                  }}>
                    Notifications
                  </span>

                  {/* ✅ Count badge in header */}
                  {unreadCount > 0 && (
                    <span style={{
                      background:   "#dc3545",
                      color:        "#fff",
                      borderRadius: 10,
                      padding:      "2px 8px",
                      fontSize:     11,
                      fontWeight:   700,
                    }}>
                      {unreadCount} unread
                    </span>
                  )}
                </div>

                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    style={{
                      background: "none",
                      border:     "1px solid rgba(255,255,255,0.4)",
                      color:      "#fff",
                      fontSize:   11,
                      cursor:     "pointer",
                      fontWeight: 600,
                      borderRadius: 6,
                      padding:    "2px 8px",
                    }}
                  >
                    Mark all read
                  </button>
                )}
              </div>

              {/* ✅ Summary count bar */}
              {unreadCount > 0 && (
                <div style={{
                  padding:    "6px 16px",
                  background: "#f0f4ff",
                  borderBottom: "1px solid #e9ecef",
                  fontSize:   11,
                  color:      "#0b2d6b",
                  fontWeight: 600,
                }}>
                  <i className="bi bi-info-circle me-1" />
                  You have {unreadCount} unread notification
                  {unreadCount > 1 ? "s" : ""}
                </div>
              )}

              {/* Notifications List */}
              <div style={{ overflowY: "auto", flex: 1 }}>
                {loading ? (
                  <div style={{ padding: 20, textAlign: "center" }}>
                    <div className="spinner-border spinner-border-sm
                      text-primary" />
                  </div>
                ) : notifications.length === 0 ? (
                  <div style={{
                    padding:   "32px 16px",
                    textAlign: "center",
                    color:     "#6c757d",
                    fontSize:  13,
                  }}>
                    <i className="bi bi-bell-slash" style={{
                      fontSize:     28,
                      display:      "block",
                      marginBottom: 8
                    }} />
                    No new notifications
                  </div>
                ) : (
                  notifications.map((notif) => {
                    const label = getNotifLabel(notif.notifType);
                    return (
                      <div
                        key={notif.id}
                        onClick={() => handleNotifClick(notif)}
                        style={{
                          padding:      "12px 16px",
                          borderBottom: "1px solid #f0f0f0",
                          cursor:       "pointer",
                          display:      "flex",
                          gap:          10,
                          alignItems:   "flex-start",
                          background:   notif.isRead === 0
                            ? "#f0f4ff" : "#fff",
                          transition:   "background 0.15s",
                        }}
                        onMouseEnter={e =>
                          e.currentTarget.style.background = "#e8eeff"}
                        onMouseLeave={e =>
                          e.currentTarget.style.background =
                            notif.isRead === 0 ? "#f0f4ff" : "#fff"}
                      >
                        {/* Icon */}
                        <i
                          className={getNotifIcon(notif.notifType)}
                          style={{ fontSize: 18, marginTop: 2 }}
                        />

                        <div style={{ flex: 1, minWidth: 0 }}>

                          {/* ✅ Type label tag */}
                          <span style={{
                            fontSize:     9,
                            fontWeight:   700,
                            color:        "#fff",
                            background:   label.color,
                            borderRadius: 4,
                            padding:      "1px 5px",
                            marginBottom: 3,
                            display:      "inline-block",
                            textTransform: "uppercase",
                            letterSpacing: 0.5,
                          }}>
                            {label.text}
                          </span>

                          {/* Title */}
                          <div style={{
                            fontWeight:  600,
                            fontSize:    12.5,
                            color:       "#1a2a4a",
                            marginBottom: 2,
                          }}>
                            {notif.title}
                          </div>

                          {/* Message */}
                          <div style={{
                            fontSize:     11.5,
                            color:        "#6c757d",
                            marginBottom: 3,
                            overflow:     "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace:   "nowrap",
                          }}>
                            {notif.message}
                          </div>

                          {/* Date */}
                          <div style={{
                            fontSize: 10.5,
                            color:    "#adb5bd"
                          }}>
                            <i className="bi bi-clock me-1" />
                            {notif.createdOn}
                          </div>
                        </div>

                        {/* ✅ Unread dot */}
                        {notif.isRead === 0 && (
                          <div style={{
                            width:        7,
                            height:       7,
                            borderRadius: "50%",
                            background:   "#0b2d6b",
                            marginTop:    6,
                            flexShrink:   0,
                          }} />
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* ✅ Footer with total count */}
              {notifications.length > 0 && (
                <div style={{
                  padding:      "8px 16px",
                  borderTop:    "1px solid #e9ecef",
                  background:   "#f8f9fa",
                  textAlign:    "center",
                  fontSize:     11,
                  color:        "#6c757d",
                }}>
                  Showing {notifications.length} of {unreadCount} unread
                </div>
              )}

            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default Navbar;