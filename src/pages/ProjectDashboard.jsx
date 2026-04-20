import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/ProjectDashboad.css";
import { getProjects } from "../api/projectService";
import {
  getAllTimelineRequests,
  approveTimelineChange,
} from "../api/timelineApi";

const ITEMS_PER_PAGE = 12;

const SEVERITY_LABEL = { "1": "Critical", "2": "High", "3": "Medium", "4": "Low" };
const SEVERITY_COLOR = { "1": "#dc2626", "2": "#d97706", "3": "#2563eb", "4": "#16a34a" };

const STATUS_STYLE = {
  "Approved": { bg: "#dcfce7", color: "#166534", dot: "#22c55e" },
  "Pending": { bg: "#fef9c3", color: "#854d0e", dot: "#eab308" },
  "Rejected": { bg: "#fee2e2", color: "#991b1b", dot: "#ef4444" },
  "Closed": { bg: "#e0e7ff", color: "#3730a3", dot: "#6366f1" },
};

const StatusChip = ({ status }) => {
  const s = STATUS_STYLE[status] || { bg: "#f1f5f9", color: "#475569", dot: "#94a3b8" };
  return (
    <span style={{
      background: s.bg, color: s.color, fontSize: 10, fontWeight: 700,
      padding: "2px 8px", borderRadius: 20,
      display: "inline-flex", alignItems: "center", gap: 4,
      border: `1px solid ${s.dot}44`
    }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: s.dot }} />
      {status}
    </span>
  );
};

const RoleChip = ({ label, bg }) => (
  <span style={{
    background: bg, color: "#fff", fontSize: 9, fontWeight: 700,
    padding: "2px 6px", borderRadius: 20, letterSpacing: 0.3
  }}>{label}</span>
);

const borderColor = (approvalStatus) => {
  if (approvalStatus === "Approved") return "#22c55e";
  if (approvalStatus === "Pending") return "#eab308";
  if (approvalStatus === "Rejected") return "#ef4444";
  if (approvalStatus === "Closed") return "#6366f1";
  return "#e2e8f0";
};

export default function ProjectDashboard() {
  const navigate = useNavigate();
  const userId = sessionStorage.getItem("userId");

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [showPanel, setShowPanel] = useState(false);
  const [tlRequests, setTlRequests] = useState([]);
  const [tlLoading, setTlLoading] = useState(false);
  const [tlMessage, setTlMessage] = useState("");
  const [rejectRemarks, setRejectRemarks] = useState({});
  const [showRejectInput, setShowRejectInput] = useState({});

  useEffect(() => {
    if (!userId) { navigate("/", { replace: true }); return; }
    loadProjects(userId);
    loadTimelineRequests();
  }, []);

  const loadProjects = async (uid) => {
    try {
      const data = await getProjects(uid);
      setProjects(data || []);
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
        requestId, reviewedBy: userId, status: 1, remarks: "Approved"
      });
      if (result?.success) {
        setTlMessage("Request approved successfully!");
        await loadTimelineRequests();
        setTimeout(() => setTlMessage(""), 3000);
      }
    } catch (err) { console.error(err); }
  };

  const handleReject = async (requestId) => {
    const remarks = rejectRemarks[requestId];
    if (!remarks?.trim()) {
      setShowRejectInput(prev => ({ ...prev, [requestId]: true }));
      return;
    }
    try {
      const result = await approveTimelineChange({
        requestId, reviewedBy: userId, status: 2, remarks
      });
      if (result?.success) {
        setTlMessage("Request rejected.");
        setShowRejectInput(prev => ({ ...prev, [requestId]: false }));
        setRejectRemarks(prev => ({ ...prev, [requestId]: "" }));
        await loadTimelineRequests();
        setTimeout(() => setTlMessage(""), 3000);
      }
    } catch (err) { console.error(err); }
  };

  const pendingCount = tlRequests.filter(r => r.status === 0 && r.is_Creator === 1).length;

  const filtered = projects
    .filter(p => {
      const matchSearch =
        p.projectName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.projectDescrip?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = statusFilter === "all" || p.projectApprovalStatus === statusFilter;
      return matchSearch && matchStatus;
    })
    .sort((a, b) => b.projectId - a.projectId);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginated = filtered.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handlePageChange = (p) => {
    if (p < 1 || p > totalPages) return;
    setCurrentPage(p);
  };

  const getPageNumbers = () => {
    const pages = [];
    let start = Math.max(1, currentPage - 2);
    let end = Math.min(totalPages, start + 4);
    if (end - start < 4) start = Math.max(1, end - 4);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  };

  const getRole = (p) => {
    //const plMatch = p.projectPl?.match(/\(([^)]+)\)$/);
    const plMatch =
  p.projectPl?.match(/^(.*?)\s*\(([^)]+)\)$/) ||   // "Name (userId)"
  p.projectPl?.match(/^(.*?)\s*\[([^\]]+)\]$/) ||   // "Name [userId]"
  p.projectPl?.match(/^(.*?)\s*[-]\s*(\S+)$/);      // "Name - userId"
    const plId = plMatch ? plMatch[1] : p.projectPl;
    const isCreator = String(p.createdBy) === String(userId);
    const isPL = String(plId) === String(userId);
    return { isCreator, isPL };
  };

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh", flexDirection: "column", gap: 12 }}>
      <div className="spinner-border text-primary" />
      <span style={{ fontSize: 14, color: "#64748b" }}>Loading projects...</span>
    </div>
  );

  if (error) return <p className="text-danger text-center mt-5">{error}</p>;

  const counts = projects.reduce((acc, p) => {
    acc[p.projectApprovalStatus] = (acc[p.projectApprovalStatus] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="app-container">
      <div className="main-layout">
        <div className="content">
          <div className="projects-panel">

            {/* ── Header ── */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
              <h2 className="project-heading mb-0">
                Projects
                <span style={{ background: "#e2e8f0", color: "#475569", fontSize: 13, fontWeight: 700, padding: "2px 10px", borderRadius: 20, marginLeft: 10 }}>
                  {filtered.length}
                </span>
              </h2>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "7px 12px", width: 240 }}>
                  <i className="bi bi-search" style={{ color: "#94a3b8", fontSize: 13 }} />
                  <input
                    type="text"
                    placeholder="Search project..."
                    value={searchTerm}
                    onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                    style={{ border: "none", outline: "none", fontSize: 13, background: "transparent", flex: 1, color: "#0d1b3e" }}
                  />
                  {searchTerm && (
                    <button onClick={() => setSearchTerm("")} style={{ border: "none", background: "none", cursor: "pointer", color: "#94a3b8", fontSize: 16, lineHeight: 1 }}>×</button>
                  )}
                </div>
                <button
                  onClick={() => { setShowPanel(true); loadTimelineRequests(); }}
                  style={{ background: "#0b2d6b", color: "#fff", border: "none", borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, width: "auto" }}
                >
                  <i className="bi bi-calendar-range" />
                  Timeline Requests
                  {pendingCount > 0 && (
                    <span style={{ background: "#dc3545", color: "#fff", borderRadius: "50%", fontSize: 10, fontWeight: 700, width: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {pendingCount}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* ── Status filter pills ── */}
            <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
              {["all", "Approved", "Pending", "Rejected", "Closed"].map(f => {
                const count = f === "all" ? projects.length : (counts[f] || 0);
                const active = statusFilter === f;
                return (
                  <button key={f} onClick={() => { setStatusFilter(f); setCurrentPage(1); }} style={{
                    background: active ? "#0d1b3e" : "#fff",
                    color: active ? "#fff" : "#475569",
                    border: `1.5px solid ${active ? "#0d1b3e" : "#e2e8f0"}`,
                    borderRadius: 20, padding: "5px 14px", fontSize: 12,
                    fontWeight: 600, cursor: "pointer", transition: "all 0.15s",
                    display: "flex", alignItems: "center", gap: 6, width: "auto"
                  }}>
                    {f === "all" ? "All" : f}
                    <span style={{
                      background: active ? "rgba(255,255,255,0.2)" : "#f1f5f9",
                      color: active ? "#fff" : "#64748b",
                      borderRadius: 20, padding: "0px 6px", fontSize: 10, fontWeight: 700
                    }}>{count}</span>
                  </button>
                );
              })}
            </div>

            {/* ── Project Cards ── */}
            {paginated.length === 0 ? (
              <div className="empty-state">
                <i className="bi bi-folder2-open" style={{ fontSize: 48, color: "#94a3b8" }} />
                <p>No projects found</p>
              </div>
            ) : (
              <div className="projects-grid">
                {paginated.map((project, index) => {
                  const { isCreator, isPL } = getRole(project);
                  const approved = project.projectApprovalStatus === "Approved";
                  const sev = SEVERITY_COLOR[project.projectSeverity] || "#64748b";
                  const bc = borderColor(project.projectApprovalStatus);
                  const mCount = project.milestones?.length || 0;
                  const approvedM = project.milestones?.filter(m => m.status === "Approved").length || 0;

                  return (
                    <div key={project.projectId} style={{ animationDelay: `${index * 0.05}s` }}>
                      <Link
                        to={`/project-details/${project.projectId}`}
                        state={project}
                        style={{ textDecoration: "none", color: "inherit", display: "block" }}
                      >
                        <div
                          style={{
                            background: approved ? "#fff" : "#f8f9fa",
                            border: "1px solid #e2e8f0",
                            borderLeft: `4px solid ${bc}`,
                            borderRadius: 12,
                            padding: "18px 18px 14px",
                            cursor: "pointer",
                            position: "relative",
                            transition: "all 0.18s",
                            boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                            minHeight: 140,
                            display: "flex",
                            flexDirection: "column",
                            gap: 10,
                            opacity: approved ? 1 : 0.75,
                            filter: approved ? "none" : "grayscale(20%)",
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.boxShadow = "0 6px 20px rgba(0,0,0,0.12)";
                            e.currentTarget.style.transform = "translateY(-2px)";
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.06)";
                            e.currentTarget.style.transform = "translateY(0)";
                          }}
                        >
                          {/* Pending banner */}
                          {!approved && (
                            <div style={{
                              background: "#fef9c3", color: "#854d0e",
                              fontSize: 10, fontWeight: 700,
                              padding: "3px 8px", borderRadius: 20,
                              border: "1px solid #fde68a",
                              display: "flex", alignItems: "center", gap: 4, width: "fit-content",
                            }}>
                              <i className="bi bi-lock" style={{ fontSize: 9 }} />
                              Awaiting Approval
                            </div>
                          )}

                          {/* Edit button — creator only, any status except Closed/Rejected */}
                          {/* {isCreator && project.projectApprovalStatus !== "Closed" && project.projectApprovalStatus !== "Rejected" && (
                            <button
                              title="Edit Project"
                              onClick={e => {
                                e.preventDefault();
                                e.stopPropagation();
                                navigate("/addProject", { state: { project } });
                              }}
                              style={{
                                background: "#f1f5f9", border: "1.5px solid #e2e8f0",
                                borderRadius: 6, padding: "4px 8px",
                                cursor: "pointer", color: "#64748b",
                                fontSize: 13, width: "auto",
                              }}
                            >
                              <i className="bi bi-pencil-square" />
                            </button>
                          )} */}

                          {isCreator &&
 project.projectApprovalStatus !== "Closed" &&
 project.projectApprovalStatus !== "Rejected" && (
  <button
    title="Edit Project"
    onClick={e => {
      e.preventDefault();
      e.stopPropagation();
      navigate("/addProject", { state: { project } });
    }}
    style={{
      position:     "absolute",
      top:          10,
      right:        10,
      background:   "rgba(255,255,255,0.9)",
      border:       "1.5px solid #e2e8f0",
      borderRadius: 6,
      padding:      "4px 7px",
      cursor:       "pointer",
      color:        "#64748b",
      fontSize:     13,
      width:        "fit-content",
      lineHeight:   1,
      zIndex:       2,
    }}
  >
    <i className="bi bi-pencil-square" />
  </button>
)}
                        

                        {/* Role chips + severity */}
                        <div style={{ display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap" }}>
                          {isCreator && <RoleChip label="Creator" bg="#1a3c5e" />}
                          {isPL && <RoleChip label="PL" bg="#1a56db" />}
                          {!isCreator && !isPL && <RoleChip label="Member" bg="#059669" />}
                          <span style={{ marginLeft: "auto", fontSize: 10, fontWeight: 700, color: sev }}>
                            ● {SEVERITY_LABEL[project.projectSeverity] || "—"}
                          </span>
                        </div>

                        {/* Project name */}
                        <div style={{ fontWeight: 700, fontSize: 15, color: "#0d1b3e", lineHeight: 1.3, paddingRight: 28 }}>
                          {project.projectName}
                        </div>

                        {/* Description */}
                        {project.projectDescrip && (
                          <div style={{ fontSize: 12.5, color: "#64748b", lineHeight: 1.5, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                            {project.projectDescrip}
                          </div>
                        )}

                        {/* Bottom row */}
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "auto", flexWrap: "wrap", gap: 6 }}>
                          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                            <StatusChip status={project.projectApprovalStatus} />
                            {mCount > 0 && (
                              <span style={{ fontSize: 10, color: "#64748b", background: "#f1f5f9", padding: "2px 7px", borderRadius: 20, fontWeight: 600 }}>
                                {approvedM}/{mCount} milestones
                              </span>
                            )}
                          </div>
                          <span style={{ fontSize: 11, color: "#94a3b8", display: "flex", alignItems: "center", gap: 4 }}>
                            <i className="bi bi-calendar3" style={{ fontSize: 10 }} />
                            {project.projectTimeline || "—"}
                          </span>
                        </div>

                    </div>
                      </Link>
                    </div>
          );
                })}
        </div>
            )}

        {/* ── Pagination ── */}
        {totalPages > 1 && (
          <div className="pagination-container">
            <button className="pagination-btn" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>
              <i className="bi bi-chevron-left" />
            </button>
            {getPageNumbers()[0] > 1 && (
              <>
                <button className="pagination-btn" onClick={() => handlePageChange(1)}>1</button>
                {getPageNumbers()[0] > 2 && <span className="pagination-ellipsis">…</span>}
              </>
            )}
            {getPageNumbers().map(p => (
              <button key={p} className={`pagination-btn ${p === currentPage ? "active" : ""}`} onClick={() => handlePageChange(p)}>{p}</button>
            ))}
            {getPageNumbers().at(-1) < totalPages && (
              <>
                {getPageNumbers().at(-1) < totalPages - 1 && <span className="pagination-ellipsis">…</span>}
                <button className="pagination-btn" onClick={() => handlePageChange(totalPages)}>{totalPages}</button>
              </>
            )}
            <button className="pagination-btn" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}>
              <i className="bi bi-chevron-right" />
            </button>
            <span className="pagination-info">{startIndex + 1}–{Math.min(startIndex + ITEMS_PER_PAGE, filtered.length)} of {filtered.length}</span>
          </div>
        )}

      </div>
    </div>
      </div >

    {/* ── Backdrop ── */ }
  {
    showPanel && (
      <div onClick={() => setShowPanel(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", zIndex: 1040, backdropFilter: "blur(2px)" }} />
    )
  }

  {/* ── Timeline Panel ── */ }
  <div style={{
    position: "fixed", top: 0, right: 0, width: 430, height: "100vh",
    background: "#fff", boxShadow: "-6px 0 32px rgba(0,0,0,0.12)",
    zIndex: 1050, display: "flex", flexDirection: "column",
    transform: showPanel ? "translateX(0)" : "translateX(100%)",
    transition: "transform 0.3s cubic-bezier(0.4,0,0.2,1)",
  }}>
    <div style={{ background: "#0b2d6b", color: "#fff", padding: "20px", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 42, height: 42, borderRadius: 10, background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
          <i className="bi bi-calendar-range" />
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 16 }}>Timeline Requests</div>
          <div style={{ fontSize: 12, opacity: 0.75, marginTop: 3 }}>
            {pendingCount > 0
              ? <><span style={{ background: "#dc3545", borderRadius: 10, padding: "1px 8px", fontSize: 11, fontWeight: 700, marginRight: 6 }}>{pendingCount}</span>pending your approval</>
              : "No pending requests"}
          </div>
        </div>
      </div>
      <button onClick={() => setShowPanel(false)} style={{ background: "rgba(255,255,255,0.15)", border: "none", color: "#fff", fontSize: 18, cursor: "pointer", width: 34, height: 34, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
    </div>

    {tlMessage && (
      <div style={{ margin: "12px 16px 0", padding: "10px 14px", background: "#d1fae5", borderRadius: 8, fontSize: 13, color: "#065f46", fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
        <i className="bi bi-check-circle-fill" />{tlMessage}
      </div>
    )}

    <div style={{ overflowY: "auto", flex: 1, padding: 16 }}>
      {tlLoading ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "60%", gap: 12 }}>
          <div className="spinner-border spinner-border-sm text-primary" />
          <div style={{ fontSize: 13, color: "#6c757d" }}>Loading requests...</div>
        </div>
      ) : tlRequests.length === 0 ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "60%", gap: 12 }}>
          <div style={{ width: 72, height: 72, borderRadius: "50%", background: "#f0f4ff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30 }}>
            <i className="bi bi-calendar-check text-primary" />
          </div>
          <div style={{ fontWeight: 600, fontSize: 15, color: "#495057" }}>All caught up!</div>
          <div style={{ fontSize: 13, color: "#adb5bd", textAlign: "center" }}>No timeline change requests found</div>
        </div>
      ) : (
        <>
          {tlRequests.filter(r => r.status === 0 && r.is_Creator === 1).length > 0 && (
            <div className="mb-4">
              <div style={{ fontWeight: 700, fontSize: 12, color: "#6c757d", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 12, paddingBottom: 8, borderBottom: "1px solid #f0f0f0", display: "flex", alignItems: "center", gap: 8 }}>
                <i className="bi bi-hourglass-split text-warning" />Pending Your Approval
              </div>
              {tlRequests.filter(r => r.status === 0 && r.is_Creator === 1).map(req => (
                <div key={req.id} style={{ border: "1px solid #fde68a", borderRadius: 10, padding: 14, marginBottom: 12, background: "#fffbeb" }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: "#0f2044", marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
                    <i className="bi bi-folder-fill text-primary" />{req.projectName}
                  </div>
                  <div style={{ fontSize: 12, color: "#6c757d", marginBottom: 8 }}>
                    {req.milestoneName
                      ? <><i className="bi bi-flag-fill text-warning" style={{ fontSize: 10 }} /> Milestone: <strong>{req.milestoneName}</strong></>
                      : <><i className="bi bi-calendar-range text-info" style={{ fontSize: 10 }} /> Project Timeline</>}
                  </div>
                  <div style={{ background: "#fff", borderRadius: 8, padding: "10px 12px", marginBottom: 10, fontSize: 12, border: "1px solid #f0f0f0" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}><span style={{ color: "#6c757d" }}>Requested by</span><span style={{ fontWeight: 600 }}>{req.requestedByName}</span></div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}><span style={{ color: "#6c757d" }}>Proposed date</span><span style={{ fontWeight: 600, color: "#0b2d6b" }}>{req.newProposedDateText}</span></div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#6c757d" }}>Submitted</span><span>{req.createdOnText}</span></div>
                  </div>
                  <div style={{ fontSize: 12, color: "#6c757d", marginBottom: 10, fontStyle: "italic" }}>"{req.reason}"</div>
                  {showRejectInput[req.id] && (
                    <input type="text" className="form-control form-control-sm mb-2" placeholder="Enter rejection reason..."
                      value={rejectRemarks[req.id] || ""} onChange={e => setRejectRemarks(prev => ({ ...prev, [req.id]: e.target.value }))}
                      style={{ borderRadius: 7, fontSize: 12 }} />
                  )}
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => handleApprove(req.id)} style={{ flex: 1, background: "#16a34a", color: "#fff", border: "none", borderRadius: 7, padding: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, width: "auto" }}>
                      <i className="bi bi-check-circle" />Approve
                    </button>
                    <button onClick={() => handleReject(req.id)} style={{ flex: 1, background: showRejectInput[req.id] ? "#dc3545" : "transparent", color: showRejectInput[req.id] ? "#fff" : "#dc3545", border: "1.5px solid #dc3545", borderRadius: 7, padding: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, width: "auto" }}>
                      <i className="bi bi-x-circle" />{showRejectInput[req.id] ? "Confirm Reject" : "Reject"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {tlRequests.filter(r => r.is_PL === 1).length > 0 && (
            <div>
              <div style={{ fontWeight: 700, fontSize: 12, color: "#6c757d", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 12, paddingBottom: 8, borderBottom: "1px solid #f0f0f0", display: "flex", alignItems: "center", gap: 8 }}>
                <i className="bi bi-send text-primary" />My Submitted Requests
              </div>
              {tlRequests.filter(r => r.is_PL === 1).map(req => (
                <div key={req.id} style={{ border: `1px solid ${req.status === 0 ? "#e9ecef" : req.status === 1 ? "#bbf7d0" : "#fecaca"}`, borderRadius: 10, padding: 14, marginBottom: 12, background: req.status === 0 ? "#f8f9fa" : req.status === 1 ? "#f0fdf4" : "#fff5f5" }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: "#0f2044", marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
                    <i className="bi bi-folder-fill text-primary" />{req.projectName}
                  </div>
                  <div style={{ fontSize: 12, color: "#6c757d", marginBottom: 8 }}>
                    {req.milestoneName
                      ? <><i className="bi bi-flag-fill text-warning" style={{ fontSize: 10 }} /> Milestone: <strong>{req.milestoneName}</strong></>
                      : <><i className="bi bi-calendar-range text-info" style={{ fontSize: 10 }} /> Project Timeline</>}
                  </div>
                  <div style={{ background: "#fff", borderRadius: 8, padding: "10px 12px", marginBottom: 10, fontSize: 12, border: "1px solid #f0f0f0" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}><span style={{ color: "#6c757d" }}>Proposed date</span><span style={{ fontWeight: 600, color: "#0b2d6b" }}>{req.newProposedDateText}</span></div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#6c757d" }}>Submitted</span><span>{req.createdOnText}</span></div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ background: req.status === 0 ? "#fef9c3" : req.status === 1 ? "#dcfce7" : "#fee2e2", color: req.status === 0 ? "#854d0e" : req.status === 1 ? "#166534" : "#991b1b", borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 700 }}>
                      {req.status === 0 ? "⏳ Pending" : req.status === 1 ? "✓ Approved" : "✗ Rejected"}
                    </span>
                    {req.status !== 0 && req.reviewRemarks && <span style={{ fontSize: 11, color: "#6c757d", fontStyle: "italic" }}>"{req.reviewRemarks}"</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>

    <div style={{ padding: "14px 16px", borderTop: "1px solid #e9ecef", flexShrink: 0, background: "#f8f9fa", display: "flex", gap: 10 }}>
      <button onClick={loadTimelineRequests} style={{ flex: 1, background: "#0b2d6b", color: "#fff", border: "none", borderRadius: 7, padding: 9, fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, width: "auto" }}>
        <i className="bi bi-arrow-clockwise" />Refresh
      </button>
      <button onClick={() => setShowPanel(false)} style={{ flex: 1, background: "transparent", border: "1.5px solid #dee2e6", borderRadius: 7, padding: 9, fontSize: 13, fontWeight: 600, color: "#6c757d", cursor: "pointer", width: "auto" }}>
        Close
      </button>
    </div>
  </div>

    </div >
  );
}