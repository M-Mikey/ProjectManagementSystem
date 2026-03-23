import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { HiClipboardCheck } from "react-icons/hi";
import "./Topbar.css";

const Topbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isAdminPage = location.pathname.startsWith("/dashboard-admin");
  const [showPopup, setShowPopup] = useState(false);

  const handleAdmin = () => navigate(isAdminPage ? "/dashboard" : "/dashboard-admin");
  const handleProfile = () => { navigate("/profile"); setShowPopup(false); };
  const handleLogout = () => { sessionStorage.clear(); localStorage.clear(); navigate("/", { replace: true }); };

  return (
    <>
      <header className="topbar">
        <div className="topbar-left">
          <HiClipboardCheck className="topbar-icon" />
          <span className="project-title">Project Hub</span>
        </div>

        <div className="topbar-right">
          <div className="admin-btn" onClick={handleAdmin}>
            {isAdminPage ? "Home" : "Admin"}
          </div>
          <div className="profile-section" onClick={() => setShowPopup(true)}>
            <div className="profile-circle">PS</div>
            <span className="dropdown-arrow">▾</span>
          </div>
        </div>
      </header>

      {/* POPUP MODAL */}
      {showPopup && (
        <>
          {/* backdrop */}
          <div className="popup-backdrop" onClick={() => setShowPopup(false)} />

          <div className="popup-box">
            <div className="popup-header">
              <div className="popup-avatar">PS</div>
              <div>
                <div className="popup-name">Project Hub</div>
                <div className="popup-role">User</div>
              </div>
            </div>

            <div className="popup-divider" />

            <button className="popup-btn" onClick={handleProfile}>
              <i className="bi bi-person"></i> View Profile
            </button>

            <button className="popup-btn logout-btn" onClick={handleLogout}>
              <i className="bi bi-box-arrow-right"></i> Logout
            </button>
          </div>
        </>
      )}
    </>
  );
};

export default Topbar;