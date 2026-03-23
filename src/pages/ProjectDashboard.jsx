import React, { useEffect, useState } from "react";
import Topbar from "../components/Navbar/Topbar";
import Navbar from "../components/Navbar/Navbar";
import { Link, useNavigate } from "react-router-dom";
import "../styles/ProjectDashboad.css";
import { getProjects } from "../api/projectService";
import {
  getAllTimelineRequests,
  approveTimelineChange,
} from "../api/timelineApi";

const ITEMS_PER_PAGE = 12;

export default function ProjectDashboard() {
  const navigate = useNavigate();
  const userId   = sessionStorage.getItem("userId");

  const [projects, setProjects]               = useState([]);
  const [loading, setLoading]                 = useState(true);
  const [error, setError]                     = useState(null);
  const [currentPage, setCurrentPage]         = useState(1);

  // ── Timeline panel
  const [showPanel, setShowPanel]             = useState(false);
  const [tlRequests, setTlRequests]           = useState([]);
  const [tlLoading, setTlLoading]             = useState(false);
  const [tlMessage, setTlMessage]             = useState("");
  const [rejectRemarks, setRejectRemarks]     = useState({});
  const [showRejectInput, setShowRejectInput] = useState({});

  useEffect(() => {
    if (!userId) { navigate("/", { replace: true }); return; }
    loadProjects(userId);
    loadTimelineRequests();
  }, []);

  const loadProjects = async (uid) => {
    try {
      const data = await getProjects(uid);
      setProjects(data);
    } catch (err) {
      console.error(err);
      setError("Unable to load projects");
    } finally {
      setLoading(false);
    }
  };

  const loadTimelineRequests = async () => {
    setTlLoading(true);
    try {
      const result = await getAllTimelineRequests(userId);
      setTlRequests(result || []);
    } catch (err) {
      console.error(err);
    } finally {
      setTlLoading(false);
    }
  };

  const handleApprove = async (requestId) => {
    try {
      const result = await approveTimelineChange({
        requestId:  requestId,
        reviewedBy: userId,
        status:     1,
        remarks:    "Approved",
      });
      if (result?.success) {
        setTlMessage("Request approved successfully!");
        await loadTimelineRequests();
        setTimeout(() => setTlMessage(""), 3000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleReject = async (requestId) => {
    const remarks = rejectRemarks[requestId];
    if (!remarks?.trim()) {
      setShowRejectInput(prev => ({ ...prev, [requestId]: true }));
      return;
    }
    try {
      const result = await approveTimelineChange({
        requestId:  requestId,
        reviewedBy: userId,
        status:     2,
        remarks:    remarks,
      });
      if (result?.success) {
        setTlMessage("Request rejected.");
        setShowRejectInput(prev => ({ ...prev, [requestId]: false }));
        setRejectRemarks(prev => ({ ...prev, [requestId]: "" }));
        await loadTimelineRequests();
        setTimeout(() => setTlMessage(""), 3000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const pendingCount = tlRequests.filter(
    r => r.status === 0 && r.is_Creator === 1
  ).length;

  const handleEditProject = (e, project) => {
    e.preventDefault();
    e.stopPropagation();
    navigate("/addProject", { state: { project } });
  };

  // Pagination
  const totalPages        = Math.ceil(projects.length / ITEMS_PER_PAGE);
  const startIndex        = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedProjects = projects.slice(
    startIndex, startIndex + ITEMS_PER_PAGE
  );

  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const getPageNumbers = () => {
    const pages = [];
    let start = Math.max(1, currentPage - 2);
    let end   = Math.min(totalPages, start + 4);
    if (end - start < 4) start = Math.max(1, end - 4);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  };

  if (loading) return (
    <div className="text-center mt-5">
      <div className="spinner-border text-success"></div>
    </div>
  );

  if (error) return (
    <p className="text-danger text-center mt-5">{error}</p>
  );

  return (
    <div className="app-container">
      <Topbar />
      <div className="main-layout">
        <Navbar />

        <div className="content">
          <div className="projects-panel">

            {/* ── Header */}
            <div className="d-flex justify-content-between
              align-items-center mb-4">
              <h2 className="project-heading mb-0">Projects</h2>

              {/* ✅ Timeline Requests Button */}
              <button
                onClick={() => {
                  setShowPanel(true);
                  loadTimelineRequests();
                }}
                title="Timeline Change Requests"
                style={{
                  width:          "fit-content",
                  background:     "#0b2d6b",
                  color:          "#fff",
                  border:         "none",
                  borderRadius:   8,
                  padding:        "9px 18px",
                  fontSize:       13,
                  fontWeight:     600,
                  display:        "flex",
                  alignItems:     "center",
                  gap:            8,
                  cursor:         "pointer",
                  boxShadow:      "0 2px 8px rgba(11,45,107,0.15)",
                  transition:     "opacity 0.15s",
                }}
                onMouseEnter={e =>
                  e.currentTarget.style.opacity = "0.9"}
                onMouseLeave={e =>
                  e.currentTarget.style.opacity = "1"}
              >
                <i className="bi bi-calendar-range" />
                Timeline Requests
                {pendingCount > 0 && (
                  <span style={{
                    background:     "#dc3545",
                    color:          "#fff",
                    borderRadius:   "50%",
                    fontSize:       10,
                    fontWeight:     700,
                    width:          18,
                    height:         18,
                    display:        "flex",
                    alignItems:     "center",
                    justifyContent: "center",
                    marginLeft:     2,
                    flexShrink:     0,
                  }}>
                    {pendingCount}
                  </span>
                )}
              </button>
            </div>

            {/* ── Project Cards */}
            <div className="projects-grid">
              {paginatedProjects.map((project, index) => (
                <div
                  key={project.projectId}
                  className="project-card-wrapper"
                  style={{
                    animationDelay: `${index * 0.07}s`,
                    position:       "relative"
                  }}
                >
                  {/* Edit button */}
                  {/* Edit button — move to bottom LEFT */}
<button
  className="project-edit-btn"
  title="Edit Project"
  onClick={(e) => handleEditProject(e, project)}
  style={{
    position:     "absolute",
    bottom:       8,      // ✅ changed from top to bottom
    left:         8,      // ✅ changed from right to left
    background:   "transparent",
    border:       "none",
    cursor:       "pointer",
    color:        "#6b7fa3",
    zIndex:       2,
    padding:      "4px 6px",
    borderRadius: 6,
    fontSize:     14,
  }}
  onMouseEnter={e =>
    e.currentTarget.style.color = "#1e3a6e"}
  onMouseLeave={e =>
    e.currentTarget.style.color = "#6b7fa3"}
>
  <i className="bi bi-pencil-square"></i>
</button>

                  {/* Project card */}
                  <Link
                    to={`/project-details/${project.projectId}`}
                    state={project}
                    className="project-link"
                  >
                    <div className="project-card">
                      <h3>{project.projectName}</h3>
                      <p>{project.projectDescrip}</p>
                    </div>
                  </Link>
                </div>
              ))}
            </div>

            {projects.length === 0 && !loading && (
              <div className="empty-state">
                <i className="bi bi-folder2-open"></i>
                <p>No projects found</p>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="pagination-container">
                <button
                  className="pagination-btn"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <i className="bi bi-chevron-left"></i>
                </button>

                {getPageNumbers()[0] > 1 && (
                  <>
                    <button className="pagination-btn"
                      onClick={() => handlePageChange(1)}>1
                    </button>
                    {getPageNumbers()[0] > 2 && (
                      <span className="pagination-ellipsis">…</span>
                    )}
                  </>
                )}

                {getPageNumbers().map((page) => (
                  <button
                    key={page}
                    className={`pagination-btn ${
                      page === currentPage ? "active" : ""}`}
                    onClick={() => handlePageChange(page)}
                  >
                    {page}
                  </button>
                ))}

                {getPageNumbers().at(-1) < totalPages && (
                  <>
                    {getPageNumbers().at(-1) < totalPages - 1 && (
                      <span className="pagination-ellipsis">…</span>
                    )}
                    <button className="pagination-btn"
                      onClick={() => handlePageChange(totalPages)}>
                      {totalPages}
                    </button>
                  </>
                )}

                <button
                  className="pagination-btn"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  <i className="bi bi-chevron-right"></i>
                </button>

                <span className="pagination-info">
                  {startIndex + 1}–{Math.min(
                    startIndex + ITEMS_PER_PAGE,
                    projects.length
                  )} of {projects.length}
                </span>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* ===== BACKDROP ===== */}
      {showPanel && (
        <div
          onClick={() => setShowPanel(false)}
          style={{
            position:   "fixed",
            inset:      0,
            background: "rgba(0,0,0,0.35)",
            zIndex:     1040,
            backdropFilter: "blur(2px)",
          }}
        />
      )}

      {/* ===== SLIDE-IN PANEL ===== */}
      <div style={{
        position:      "fixed",
        top:           0,
        right:         0,
        width:         430,
        height:        "100vh",
        background:    "#fff",
        boxShadow:     "-6px 0 32px rgba(0,0,0,0.12)",
        zIndex:        1050,
        display:       "flex",
        flexDirection: "column",
        transform:     showPanel
          ? "translateX(0)" : "translateX(100%)",
        transition:    "transform 0.3s cubic-bezier(0.4,0,0.2,1)",
      }}>

        {/* ── Panel Header */}
        <div style={{
          background:     "#0b2d6b",
          color:          "#fff",
          padding:        "20px",
          display:        "flex",
          justifyContent: "space-between",
          alignItems:     "center",
          flexShrink:     0,
        }}>
          <div style={{
            display:    "flex",
            alignItems: "center",
            gap:        12,
          }}>
            <div style={{
              width:          42,
              height:         42,
              borderRadius:   10,
              background:     "rgba(255,255,255,0.15)",
              display:        "flex",
              alignItems:     "center",
              justifyContent: "center",
              fontSize:       20,
              flexShrink:     0,
            }}>
              <i className="bi bi-calendar-range" />
            </div>
            <div>
              <div style={{
                fontWeight: 700,
                fontSize:   16,
                lineHeight: 1.2,
              }}>
                Timeline Requests
              </div>
              <div style={{
                fontSize:  12,
                opacity:   0.75,
                marginTop: 3,
              }}>
                {pendingCount > 0 ? (
                  <>
                    <span style={{
                      background:   "#dc3545",
                      borderRadius: 10,
                      padding:      "1px 8px",
                      fontSize:     11,
                      fontWeight:   700,
                      marginRight:  6,
                    }}>
                      {pendingCount}
                    </span>
                    pending your approval
                  </>
                ) : "No pending requests"}
              </div>
            </div>
          </div>
          <button
            onClick={() => setShowPanel(false)}
            style={{
              background:     "rgba(255,255,255,0.15)",
              border:         "none",
              color:          "#fff",
              fontSize:       18,
              cursor:         "pointer",
              width:          34,
              height:         34,
              borderRadius:   8,
              display:        "flex",
              alignItems:     "center",
              justifyContent: "center",
              flexShrink:     0,
            }}
          >×</button>
        </div>

        {/* ── Success Message */}
        {tlMessage && (
          <div style={{
            margin:       "12px 16px 0",
            padding:      "10px 14px",
            background:   "#d1fae5",
            borderRadius: 8,
            fontSize:     13,
            color:        "#065f46",
            fontWeight:   600,
            display:      "flex",
            alignItems:   "center",
            gap:          8,
          }}>
            <i className="bi bi-check-circle-fill" />
            {tlMessage}
          </div>
        )}

        {/* ── Panel Body */}
        <div style={{
          overflowY: "auto",
          flex:      1,
          padding:   "16px",
        }}>

          {tlLoading ? (
            <div style={{
              display:        "flex",
              flexDirection:  "column",
              alignItems:     "center",
              justifyContent: "center",
              height:         "60%",
              gap:            12,
            }}>
              <div className="spinner-border spinner-border-sm
                text-primary" />
              <div style={{ fontSize: 13, color: "#6c757d" }}>
                Loading requests...
              </div>
            </div>

          ) : tlRequests.length === 0 ? (
            <div style={{
              display:        "flex",
              flexDirection:  "column",
              alignItems:     "center",
              justifyContent: "center",
              height:         "60%",
              gap:            12,
            }}>
              <div style={{
                width:          72,
                height:         72,
                borderRadius:   "50%",
                background:     "#f0f4ff",
                display:        "flex",
                alignItems:     "center",
                justifyContent: "center",
                fontSize:       30,
              }}>
                <i className="bi bi-calendar-check
                  text-primary" />
              </div>
              <div style={{
                fontWeight:   600,
                fontSize:     15,
                color:        "#495057",
              }}>
                All caught up!
              </div>
              <div style={{
                fontSize:   13,
                color:      "#adb5bd",
                textAlign:  "center",
              }}>
                No timeline change requests found
              </div>
            </div>

          ) : (
            <>
              {/* ── Pending Requests — Creator sees */}
              {tlRequests.filter(
                r => r.status === 0 && r.is_Creator === 1
              ).length > 0 && (
                <div className="mb-4">
                  <div style={{
                    display:       "flex",
                    alignItems:    "center",
                    gap:           8,
                    fontWeight:    700,
                    fontSize:      12,
                    color:         "#6c757d",
                    textTransform: "uppercase",
                    letterSpacing: 0.8,
                    marginBottom:  12,
                    paddingBottom: 8,
                    borderBottom:  "1px solid #f0f0f0",
                  }}>
                    <i className="bi bi-hourglass-split
                      text-warning" />
                    Pending Your Approval
                  </div>

                  {tlRequests
                    .filter(r => r.status === 0 && r.is_Creator === 1)
                    .map(req => (
                      <div key={req.id} style={{
                        border:       "1px solid #fde68a",
                        borderRadius: 10,
                        padding:      "14px",
                        marginBottom: 12,
                        background:   "#fffbeb",
                      }}>
                        {/* Project Name */}
                        <div style={{
                          fontWeight:   700,
                          fontSize:     13,
                          color:        "#0f2044",
                          marginBottom: 6,
                          display:      "flex",
                          alignItems:   "center",
                          gap:          6,
                        }}>
                          <i className="bi bi-folder-fill
                            text-primary" />
                          {req.projectName}
                        </div>

                        {/* Type */}
                        <div style={{
                          fontSize:     12,
                          color:        "#6c757d",
                          marginBottom: 8,
                          display:      "flex",
                          alignItems:   "center",
                          gap:          6,
                        }}>
                          {req.milestoneName ? (
                            <>
                              <i className="bi bi-flag-fill
                                text-warning" style={{ fontSize: 10 }} />
                              <span>
                                Milestone:{" "}
                                <strong>{req.milestoneName}</strong>
                              </span>
                            </>
                          ) : (
                            <>
                              <i className="bi bi-calendar-range
                                text-info" style={{ fontSize: 10 }} />
                              <span>Project Timeline</span>
                            </>
                          )}
                        </div>

                        {/* Details */}
                        <div style={{
                          background:   "#fff",
                          borderRadius: 8,
                          padding:      "10px 12px",
                          marginBottom: 10,
                          fontSize:     12,
                          border:       "1px solid #f0f0f0",
                        }}>
                          <div style={{
                            display:      "flex",
                            justifyContent: "space-between",
                            marginBottom: 4,
                          }}>
                            <span style={{ color: "#6c757d" }}>
                              Requested by
                            </span>
                            <span style={{ fontWeight: 600 }}>
                              {req.requestedByName}
                            </span>
                          </div>
                          <div style={{
                            display:      "flex",
                            justifyContent: "space-between",
                            marginBottom: 4,
                          }}>
                            <span style={{ color: "#6c757d" }}>
                              Proposed date
                            </span>
                            <span style={{
                              fontWeight: 600,
                              color:      "#0b2d6b",
                            }}>
                              {req.newProposedDateText}
                            </span>
                          </div>
                          <div style={{
                            display:      "flex",
                            justifyContent: "space-between",
                          }}>
                            <span style={{ color: "#6c757d" }}>
                              Submitted
                            </span>
                            <span>{req.createdOnText}</span>
                          </div>
                        </div>

                        {/* Reason */}
                        <div style={{
                          fontSize:     12,
                          color:        "#6c757d",
                          marginBottom: 10,
                          fontStyle:    "italic",
                        }}>
                          "{req.reason}"
                        </div>

                        {/* Reject Input */}
                        {showRejectInput[req.id] && (
                          <input
                            type="text"
                            className="form-control form-control-sm mb-2"
                            placeholder="Enter rejection reason..."
                            value={rejectRemarks[req.id] || ""}
                            onChange={e => setRejectRemarks(prev => ({
                              ...prev, [req.id]: e.target.value
                            }))}
                            style={{ borderRadius: 7, fontSize: 12 }}
                          />
                        )}

                        {/* Buttons */}
                        <div style={{
                          display: "flex",
                          gap:     8,
                        }}>
                          <button
                            onClick={() => handleApprove(req.id)}
                            style={{
                              flex:         1,
                              background:   "#16a34a",
                              color:        "#fff",
                              border:       "none",
                              borderRadius: 7,
                              padding:      "8px",
                              fontSize:     12,
                              fontWeight:   600,
                              cursor:       "pointer",
                              display:      "flex",
                              alignItems:   "center",
                              justifyContent: "center",
                              gap:          6,
                            }}
                          >
                            <i className="bi bi-check-circle" />
                            Approve
                          </button>
                          <button
                            onClick={() => handleReject(req.id)}
                            style={{
                              flex:         1,
                              background:   showRejectInput[req.id]
                                ? "#dc3545" : "transparent",
                              color:        showRejectInput[req.id]
                                ? "#fff" : "#dc3545",
                              border:       "1.5px solid #dc3545",
                              borderRadius: 7,
                              padding:      "8px",
                              fontSize:     12,
                              fontWeight:   600,
                              cursor:       "pointer",
                              display:      "flex",
                              alignItems:   "center",
                              justifyContent: "center",
                              gap:          6,
                            }}
                          >
                            <i className="bi bi-x-circle" />
                            {showRejectInput[req.id]
                              ? "Confirm Reject" : "Reject"}
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}

              {/* ── My Submitted Requests — PL sees */}
              {tlRequests.filter(r => r.is_PL === 1).length > 0 && (
                <div>
                  <div style={{
                    display:       "flex",
                    alignItems:    "center",
                    gap:           8,
                    fontWeight:    700,
                    fontSize:      12,
                    color:         "#6c757d",
                    textTransform: "uppercase",
                    letterSpacing: 0.8,
                    marginBottom:  12,
                    paddingBottom: 8,
                    borderBottom:  "1px solid #f0f0f0",
                  }}>
                    <i className="bi bi-send text-primary" />
                    My Submitted Requests
                  </div>

                  {tlRequests
                    .filter(r => r.is_PL === 1)
                    .map(req => (
                      <div key={req.id} style={{
                        border:       `1px solid ${
                          req.status === 0 ? "#e9ecef" :
                          req.status === 1 ? "#bbf7d0" : "#fecaca"
                        }`,
                        borderRadius: 10,
                        padding:      "14px",
                        marginBottom: 12,
                        background:   req.status === 0
                          ? "#f8f9fa" :
                          req.status === 1
                          ? "#f0fdf4" : "#fff5f5",
                      }}>
                        {/* Project Name */}
                        <div style={{
                          fontWeight:   700,
                          fontSize:     13,
                          color:        "#0f2044",
                          marginBottom: 6,
                          display:      "flex",
                          alignItems:   "center",
                          gap:          6,
                        }}>
                          <i className="bi bi-folder-fill
                            text-primary" />
                          {req.projectName}
                        </div>

                        {/* Type */}
                        <div style={{
                          fontSize:     12,
                          color:        "#6c757d",
                          marginBottom: 8,
                          display:      "flex",
                          alignItems:   "center",
                          gap:          6,
                        }}>
                          {req.milestoneName ? (
                            <>
                              <i className="bi bi-flag-fill
                                text-warning"
                                style={{ fontSize: 10 }} />
                              <span>
                                Milestone:{" "}
                                <strong>{req.milestoneName}</strong>
                              </span>
                            </>
                          ) : (
                            <>
                              <i className="bi bi-calendar-range
                                text-info"
                                style={{ fontSize: 10 }} />
                              <span>Project Timeline</span>
                            </>
                          )}
                        </div>

                        {/* Details */}
                        <div style={{
                          background:   "#fff",
                          borderRadius: 8,
                          padding:      "10px 12px",
                          marginBottom: 10,
                          fontSize:     12,
                          border:       "1px solid #f0f0f0",
                        }}>
                          <div style={{
                            display:        "flex",
                            justifyContent: "space-between",
                            marginBottom:   4,
                          }}>
                            <span style={{ color: "#6c757d" }}>
                              Proposed date
                            </span>
                            <span style={{
                              fontWeight: 600,
                              color:      "#0b2d6b",
                            }}>
                              {req.newProposedDateText}
                            </span>
                          </div>
                          <div style={{
                            display:        "flex",
                            justifyContent: "space-between",
                          }}>
                            <span style={{ color: "#6c757d" }}>
                              Submitted
                            </span>
                            <span>{req.createdOnText}</span>
                          </div>
                        </div>

                        {/* Status + Remarks */}
                        <div style={{
                          display:    "flex",
                          alignItems: "center",
                          gap:        8,
                          flexWrap:   "wrap",
                        }}>
                          <span style={{
                            background:   req.status === 0
                              ? "#fef9c3" :
                              req.status === 1
                              ? "#dcfce7" : "#fee2e2",
                            color:        req.status === 0
                              ? "#854d0e" :
                              req.status === 1
                              ? "#166534" : "#991b1b",
                            borderRadius: 20,
                            padding:      "3px 10px",
                            fontSize:     11,
                            fontWeight:   700,
                          }}>
                            {req.status === 0 ? "⏳ Pending" :
                             req.status === 1 ? "✓ Approved" :
                             "✗ Rejected"}
                          </span>
                          {req.status !== 0 && req.reviewRemarks && (
                            <span style={{
                              fontSize:  11,
                              color:     "#6c757d",
                              fontStyle: "italic",
                            }}>
                              "{req.reviewRemarks}"
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Panel Footer */}
        <div style={{
          padding:       "14px 16px",
          borderTop:     "1px solid #e9ecef",
          flexShrink:    0,
          background:    "#f8f9fa",
          display:       "flex",
          gap:           10,
        }}>
          <button
            onClick={loadTimelineRequests}
            style={{
              flex:           1,
              background:     "#0b2d6b",
              color:          "#fff",
              border:         "none",
              borderRadius:   7,
              padding:        "9px",
              fontSize:       13,
              fontWeight:     600,
              cursor:         "pointer",
              display:        "flex",
              alignItems:     "center",
              justifyContent: "center",
              gap:            6,
            }}
          >
            <i className="bi bi-arrow-clockwise" />
            Refresh
          </button>
          <button
            onClick={() => setShowPanel(false)}
            style={{
              flex:         1,
              background:   "transparent",
              border:       "1.5px solid #dee2e6",
              borderRadius: 7,
              padding:      "9px",
              fontSize:     13,
              fontWeight:   600,
              color:        "#6c757d",
              cursor:       "pointer",
            }}
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}