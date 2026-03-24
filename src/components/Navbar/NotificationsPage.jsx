import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Topbar from "../Navbar/Topbar.jsx";
import UserNavbar from "../Navbar/Navbar.jsx";
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "../../api/notificationApi";

const getNotifIcon = (type) => {
  switch (type) {
    case "APPROVAL":         return "bi bi-check-circle-fill text-success";
    case "REMARK":           return "bi bi-chat-left-text-fill text-primary";
    case "STATUS":           return "bi bi-arrow-repeat text-warning";
    case "TASK_ASSIGNED":    return "bi bi-person-check-fill text-info";
    case "TASK_ACK":         return "bi bi-hand-thumbs-up-fill text-success";
    case "MILESTONE_ACK":    return "bi bi-flag-fill text-primary";
    case "PROJECT_ACK":      return "bi bi-folder-check text-primary";
    case "MILESTONE_CLOSED": return "bi bi-flag-fill text-success";
    case "PROJECT_CLOSED":   return "bi bi-folder-x text-success";
    case "TASK_COMPLETION":  return "bi bi-clipboard-check-fill text-success";
    default:                 return "bi bi-bell-fill text-secondary";
  }
};

const getNotifLabel = (type) => {
  switch (type) {
    case "APPROVAL":         return { text: "Approval",         color: "#198754" };
    case "REMARK":           return { text: "Remark",           color: "#0d6efd" };
    case "STATUS":           return { text: "Status Update",    color: "#ffc107" };
    case "TASK_ASSIGNED":    return { text: "Task Assigned",    color: "#0dcaf0" };
    case "TASK_ACK":         return { text: "Task ACK",         color: "#198754" };
    case "MILESTONE_ACK":    return { text: "Milestone ACK",    color: "#0d6efd" };
    case "PROJECT_ACK":      return { text: "Project ACK",      color: "#0d6efd" };
    case "MILESTONE_CLOSED": return { text: "Milestone Closed", color: "#198754" };
    case "PROJECT_CLOSED":   return { text: "Project Closed",   color: "#198754" };
    case "TASK_COMPLETION":  return { text: "Task Completion",  color: "#198754" };
    default:                 return { text: "Notification",     color: "#6c757d" };
  }
};

const TYPE_FILTERS = [
  { key: "ALL",              label: "All Types" },
  { key: "APPROVAL",         label: "Approval" },
  { key: "REMARK",           label: "Remark" },
  { key: "STATUS",           label: "Status Update" },
  { key: "TASK_ASSIGNED",    label: "Task Assigned" },
  { key: "TASK_ACK",         label: "Task ACK" },
  { key: "MILESTONE_ACK",    label: "Milestone ACK" },
  { key: "PROJECT_ACK",      label: "Project ACK" },
  { key: "MILESTONE_CLOSED", label: "Milestone Closed" },
  { key: "PROJECT_CLOSED",   label: "Project Closed" },
  { key: "TASK_COMPLETION",  label: "Task Completion" },
];

const NotificationsPage = () => {
  const navigate = useNavigate();
  const userId   = sessionStorage.getItem("userId");

  const [notifications, setNotifications] = useState([]);
  const [unreadCount,   setUnreadCount]   = useState(0);
  const [loading,       setLoading]       = useState(true);
  const [activeFilter,  setActiveFilter]  = useState("ALL");
  const [searchText,    setSearchText]    = useState("");

  useEffect(() => {
    if (!userId) { navigate("/", { replace: true }); return; }
    loadNotifications();
  }, [userId]);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const result = await getNotifications(userId);
      setNotifications(result.notifications || []);
      setUnreadCount(result.unreadCount || 0);
    } catch (err) {
      console.error("Failed to load notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleNotifClick = async (notif) => {
    try {
      await markNotificationRead(notif.id, userId);
      setNotifications((prev) => prev.filter((n) => n.id !== notif.id));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) { console.error(err); }
    if (notif.linkUrl) navigate(notif.linkUrl);
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead(userId);
      setNotifications([]);
      setUnreadCount(0);
    } catch (err) { console.error(err); }
  };

  const filtered = notifications.filter((n) => {
    const matchType   = activeFilter === "ALL" || n.notifType === activeFilter;
    const matchSearch = !searchText ||
      n.title?.toLowerCase().includes(searchText.toLowerCase()) ||
      n.message?.toLowerCase().includes(searchText.toLowerCase());
    return matchType && matchSearch;
  });

  const selectedLabel = TYPE_FILTERS.find(f => f.key === activeFilter)?.label || "All Types";
  const selectedColor = activeFilter === "ALL" ? "#0b2d6b" : getNotifLabel(activeFilter).color;

  return (
    <>
      <Topbar />
      <div className="d-flex">
        <UserNavbar />
        <div className="main flex-grow-1">
          <div className="container-fluid p-4">

            {/* ── PAGE HEADING */}
            <h5 className="mb-3 animate__animated animate__fadeInDown">
              <i className="bi bi-bell-fill me-2 text-primary" />
              Notifications
              {unreadCount > 0 && (
                <span className="badge bg-danger ms-2" style={{ fontSize: 12, verticalAlign: "middle" }}>
                  {unreadCount} unread
                </span>
              )}
            </h5>

            {/* ── TOOLBAR */}
            <div
              className="animate__animated animate__fadeInDown"
              style={{
                display:        "flex",
                alignItems:     "center",
                justifyContent: "space-between",
                flexWrap:       "wrap",
                gap:            10,
                marginBottom:   20,
                background:     "#fff",
                border:         "1.5px solid #e9ecef",
                borderRadius:   10,
                padding:        "10px 14px",
              }}
            >
              {/* ── DROPDOWN FILTER */}
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#495057", marginBottom: 0, whiteSpace: "nowrap" }}>
                  <i className="bi bi-funnel me-1" />
                  Filter by:
                </label>
                <select
                  value={activeFilter}
                  onChange={(e) => setActiveFilter(e.target.value)}
                  className="form-select form-select-sm"
                  style={{
                    width:        200,
                    fontWeight:   600,
                    fontSize:     13,
                    borderColor:  selectedColor,
                    color:        selectedColor,
                    cursor:       "pointer",
                    borderRadius: 8,
                    boxShadow:    "none",
                  }}
                >
                  {TYPE_FILTERS.map(({ key, label }) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>

                {/* Active filter badge */}
                {activeFilter !== "ALL" && (
                  <span
                    style={{
                      background:    selectedColor,
                      color:         "#fff",
                      borderRadius:  20,
                      padding:       "3px 10px",
                      fontSize:      11,
                      fontWeight:    700,
                      display:       "flex",
                      alignItems:    "center",
                      gap:           5,
                      whiteSpace:    "nowrap",
                    }}
                  >
                    {selectedLabel}
                    <i
                      className="bi bi-x"
                      style={{ cursor: "pointer", fontSize: 13 }}
                      onClick={() => setActiveFilter("ALL")}
                    />
                  </span>
                )}
              </div>

              {/* ── RIGHT ACTIONS */}
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                {/* Search */}
                <div style={{ position: "relative" }}>
                  <i className="bi bi-search" style={{
                    position: "absolute", left: 9, top: "50%",
                    transform: "translateY(-50%)", color: "#adb5bd", fontSize: 12, zIndex: 1,
                  }} />
                  <input
                    type="text"
                    placeholder="Search…"
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    className="form-control form-control-sm"
                    style={{ paddingLeft: 28, width: 190 }}
                  />
                </div>

                {/* Refresh */}
                <button
                  onClick={loadNotifications}
                  className="btn btn-sm btn-outline-secondary"
                  style={{ whiteSpace: "nowrap" }}
                >
                  <i className="bi bi-arrow-clockwise me-1" />
                  Refresh
                </button>

                {/* Mark all read */}
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="btn btn-sm"
                    style={{ background: "#0b2d6b", color: "#fff", border: "none", whiteSpace: "nowrap" }}
                  >
                    <i className="bi bi-check2-all me-1" />
                    Mark all read
                  </button>
                )}
              </div>
            </div>

            {/* ── NOTIFICATION CARDS */}
            {loading ? (
              <div className="d-flex justify-content-center align-items-center" style={{ minHeight: 300 }}>
                <div className="spinner-border text-primary" />
              </div>

            ) : filtered.length === 0 ? (
              <div
                className="text-center text-muted animate__animated animate__fadeIn"
                style={{ padding: "60px 16px", background: "#fff", borderRadius: 10, border: "1.5px solid #e9ecef" }}
              >
                <i className="bi bi-bell-slash" style={{ fontSize: 48, display: "block", marginBottom: 10, color: "#ced4da" }} />
                <div style={{ fontWeight: 600, fontSize: 14 }}>No notifications found</div>
                <div style={{ fontSize: 12, marginTop: 4 }}>
                  {activeFilter !== "ALL" ? "Try selecting a different filter" : "You're all caught up!"}
                </div>
              </div>

            ) : (
              <>
                <div
                  className="animate__animated animate__fadeInUp"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
                    gap: 14,
                  }}
                >
                  {filtered.map((notif) => {
                    const label = getNotifLabel(notif.notifType);
                    return (
                      <div
                        key={notif.id}
                        onClick={() => handleNotifClick(notif)}
                        style={{
                          background:   notif.isRead === 0 ? "#f0f4ff" : "#fff",
                          border:       `1.5px solid ${notif.isRead === 0 ? "#c5d3f7" : "#e9ecef"}`,
                          borderRadius: 10,
                          padding:      "14px 16px",
                          cursor:       "pointer",
                          display:      "flex",
                          gap:          12,
                          alignItems:   "flex-start",
                          transition:   "box-shadow 0.15s, transform 0.15s",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.boxShadow = "0 4px 16px rgba(11,45,107,0.12)";
                          e.currentTarget.style.transform = "translateY(-1px)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.boxShadow = "none";
                          e.currentTarget.style.transform = "translateY(0)";
                        }}
                      >
                        {/* Icon circle */}
                        <div style={{
                          width: 40, height: 40, borderRadius: "50%",
                          background: label.color + "18",
                          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                        }}>
                          <i className={getNotifIcon(notif.notifType)} style={{ fontSize: 17 }} />
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          {/* Type badge */}
                          <span style={{
                            fontSize: 9, fontWeight: 700, color: "#fff",
                            background: label.color, borderRadius: 4,
                            padding: "2px 6px", display: "inline-block",
                            textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4,
                          }}>
                            {label.text}
                          </span>

                          {/* Title */}
                          <div style={{ fontWeight: 600, fontSize: 13, color: "#1a2a4a", marginBottom: 3 }}>
                            {notif.title}
                          </div>

                          {/* Message */}
                          <div style={{ fontSize: 12, color: "#6c757d", lineHeight: 1.5, marginBottom: 6 }}>
                            {notif.message}
                          </div>

                          {/* Footer */}
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 11, color: "#adb5bd" }}>
                            <span><i className="bi bi-clock me-1" />{notif.createdOn}</span>
                            {notif.linkUrl && (
                              <span style={{ color: "#0b2d6b", fontWeight: 600 }}>
                                View <i className="bi bi-arrow-right" />
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Unread dot */}
                        {notif.isRead === 0 && (
                          <div style={{
                            width: 8, height: 8, borderRadius: "50%",
                            background: "#0b2d6b", flexShrink: 0, marginTop: 4,
                          }} />
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="text-center mt-3" style={{ fontSize: 12, color: "#adb5bd" }}>
                  Showing {filtered.length} notification{filtered.length > 1 ? "s" : ""}
                </div>
              </>
            )}

          </div>
        </div>
      </div>
    </>
  );
};

export default NotificationsPage;