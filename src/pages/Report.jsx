import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Topbar from "../components/Navbar/Topbar";
import Navbar from "../components/Navbar/Navbar";
import { getProjectReport, getTaskApprovalHistory, getTaskRevisionHistory, getStvReport, getTaskDateHistory } from "../api/reportApi";

const STATUS_COLOR = {
  "Completed":   { bg: "#d4edda", color: "#155724" },
  "In Progress": { bg: "#cce5ff", color: "#004085" },
  "On Hold":     { bg: "#fff3cd", color: "#856404" },
  "Pending":     { bg: "#f8d7da", color: "#721c24" },
  "Not Started": { bg: "#e2e3e5", color: "#383d41" },
  "Approved":    { bg: "#d4edda", color: "#155724" },
  "Rejected":    { bg: "#f8d7da", color: "#721c24" },
};

const StatusBadge = ({ value }) => {
  const style = STATUS_COLOR[value] || { bg: "#e2e3e5", color: "#383d41" };
  return (
    <span style={{
      background:   style.bg,
      color:        style.color,
      borderRadius: 12,
      padding:      "2px 10px",
      fontSize:     11,
      fontWeight:   600,
      whiteSpace:   "nowrap",
    }}>
      {value || "—"}
    </span>
  );
};

const Reports = () => {
  const navigate  = useNavigate();
  const userId    = sessionStorage.getItem("userId");
  const tableRef  = useRef(null);

  const [rawData, setRawData]         = useState([]);
  const [projects, setProjects]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState("");
  const [activeTab, setActiveTab]     = useState("summary");
  const [filterProject, setFilterProject] = useState("All");
  const [filterStatus, setFilterStatus]   = useState("All");
  const [filterDelayed, setFilterDelayed] = useState("All");
  const [searchText, setSearchText]       = useState("");
  const [expandedProjects, setExpandedProjects]   = useState({});
  const [approvalHistory, setApprovalHistory]     = useState([]);
  const [approvalLoading, setApprovalLoading]     = useState(false);
  const [approvalError, setApprovalError]         = useState("");
  const [filterApprovalProject, setFilterApprovalProject] = useState("All");
  const [filterApprovalStatus, setFilterApprovalStatus]   = useState("All");
  const [approvalPage, setApprovalPage]           = useState(1);
  const APPROVAL_PAGE_SIZE = 10;

  // Revision History state
  const [revisionHistory, setRevisionHistory]     = useState([]);
  const [revisionLoading, setRevisionLoading]     = useState(false);
  const [revisionError, setRevisionError]         = useState("");
  const [filterRevisionProject, setFilterRevisionProject] = useState("All");
  const [filterRevisionStatus, setFilterRevisionStatus]   = useState("All");
  const [filterRevised, setFilterRevised]         = useState("All");
  const [filterRevisionTask, setFilterRevisionTask] = useState("All");
  const [revisionPage, setRevisionPage]           = useState(1);
  const REVISION_PAGE_SIZE = 10;
  const [revisionModal, setRevisionModal]         = useState(null); // task row to show history

  // STV state
  const [stvData, setStvData]                   = useState([]);
  const [stvLoading, setStvLoading]             = useState(false);
  const [stvError, setStvError]                 = useState("");
  const [filterStvProject, setFilterStvProject] = useState("All");
  const [filterStvRisk, setFilterStvRisk]       = useState("All");
  const [stvPage, setStvPage]                   = useState(1);
  const STV_PAGE_SIZE = 10;
  const [currentPage, setCurrentPage]           = useState(1);

  // Date History (proper revision history) state
  const [dateHistory, setDateHistory]           = useState([]);
  const [dateHistoryLoading, setDateHistoryLoading] = useState(false);
  const [dateHistoryError, setDateHistoryError] = useState("");
  const [filterDateProject, setFilterDateProject] = useState("All");
  const [filterDateTask, setFilterDateTask]     = useState("All");
  const [datePage, setDatePage]                 = useState(1);
  const DATE_PAGE_SIZE = 10;
  const [summaryPage, setSummaryPage]           = useState(1);
  const PAGE_SIZE         = 10;
  const SUMMARY_PAGE_SIZE = 5;

  useEffect(() => {
    if (!userId) { navigate("/", { replace: true }); return; }
    loadReport();
  }, [userId]);

  const loadReport = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getProjectReport(userId);
      setRawData(data || []);

      // Group by project
      const projectMap = {};
      (data || []).forEach(row => {
        if (!projectMap[row.projectId]) {
          projectMap[row.projectId] = {
            projectId:             row.projectId,
            projectName:           row.projectName,
            projectDescrip:        row.projectDescrip,
            projectTimeline:       row.projectTimeline,
            projectPLName:         row.projectPLName,
            projectStatus:         row.projectStatus,
            projectApprovalStatus: row.projectApprovalStatus,
            milestones:            {},
          };
        }

        if (row.milestoneId) {
          const p = projectMap[row.projectId];
          if (!p.milestones[row.milestoneId]) {
            p.milestones[row.milestoneId] = {
              milestoneId:     row.milestoneId,
              milestoneName:   row.milestoneName,
              milestoneDueDate: row.milestoneDueDate,
              milestoneStatus: row.milestoneStatus,
              tasks:           [],
            };
          }
          if (row.taskDtlId) {
            p.milestones[row.milestoneId].tasks.push(row);
          }
        }
      });

      setProjects(Object.values(projectMap));
    } catch (err) {
      console.error(err);
      setError("Failed to load report data");
    } finally {
      setLoading(false);
    }
  };

  const loadApprovalHistory = async () => {
    setApprovalLoading(true);
    setApprovalError("");
    try {
      // Load for all projects user is involved in
      const projectIds = [...new Set(rawData.map(r => r.projectId))];
      const allHistory = [];
      for (const pid of projectIds) {
        const history = await getTaskApprovalHistory(pid);
        allHistory.push(...history);
      }
      setApprovalHistory(allHistory);
    } catch (err) {
      console.error(err);
      setApprovalError("Failed to load approval history");
    } finally {
      setApprovalLoading(false);
    }
  };

  const loadRevisionHistory = async () => {
    setRevisionLoading(true);
    setRevisionError("");
    try {
      const projectIds = [...new Set(rawData.map(r => r.projectId))];
      const allRevision = [];
      for (const pid of projectIds) {
        const history = await getTaskRevisionHistory(pid);
        allRevision.push(...history);
      }
      setRevisionHistory(allRevision);
    } catch (err) {
      console.error(err);
      setRevisionError("Failed to load revision history");
    } finally {
      setRevisionLoading(false);
    }
  };

  const loadDateHistory = async () => {
    setDateHistoryLoading(true);
    setDateHistoryError("");
    try {
      const projectIds = [...new Set(rawData.map(r => r.projectId))];
      const allHistory = [];
      for (const pid of projectIds) {
        const data = await getTaskDateHistory(pid);
        allHistory.push(...data);
      }
      setDateHistory(allHistory);
    } catch (err) {
      console.error(err);
      setDateHistoryError("Failed to load date history");
    } finally {
      setDateHistoryLoading(false);
    }
  };

  const loadStvData = async () => {
    setStvLoading(true);
    setStvError("");
    try {
      const projectIds = [...new Set(rawData.map(r => r.projectId))];
      const allStv = [];
      for (const pid of projectIds) {
        const data = await getStvReport(pid);
        allStv.push(...data);
      }
      setStvData(allStv);
    } catch (err) {
      console.error(err);
      setStvError("Failed to load STV report");
    } finally {
      setStvLoading(false);
    }
  };

  // Filtered flat rows for Plan vs Actual tab
  const filteredRows = rawData.filter(row => {
    if (!row.taskDtlId) return false;
    if (filterProject !== "All" && row.projectId !== Number(filterProject)) return false;
    if (filterStatus  !== "All" && row.taskStatus !== filterStatus) return false;
    if (filterDelayed !== "All" && row.isDelayed !== filterDelayed) return false;
    if (searchText && !row.taskName?.toLowerCase().includes(searchText.toLowerCase())
        && !row.projectName?.toLowerCase().includes(searchText.toLowerCase())) return false;
    return true;
  });

  // Stats
  const totalTasks    = rawData.filter(r => r.taskDtlId).length;
  const delayedTasks  = rawData.filter(r => r.taskDtlId && r.isDelayed === "Y").length;
  const completedTasks = rawData.filter(r => r.taskDtlId && r.taskStatus === "Completed").length;
  const pendingTasks  = rawData.filter(r => r.taskDtlId && r.taskStatus !== "Completed").length;

  const toggleProject = (id) => {
    setExpandedProjects(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Export to CSV
  const exportCSV = () => {
    const headers = [
      "Project", "Milestone", "Task", "Assigned To",
      "Severity", "Planned Date", "Revised Date",
      "Status", "Delayed", "Days Delayed"
    ];
    const rows = filteredRows.map(r => [
      r.projectName, r.milestoneName, r.taskName,
      r.assignedToName, r.taskSeverity,
      r.plannedDate || "—", r.revisedDate || "—",
      r.taskStatus, r.isDelayed === "Y" ? "Yes" : "No",
      r.daysDelayed
    ]);

    const csv = [headers, ...rows]
      .map(row => row.map(v => `"${v || ""}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `Project_Report_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const uniqueProjects = [...new Set(rawData.map(r => r.projectId))]
    .map(id => ({ id, name: rawData.find(r => r.projectId === id)?.projectName }));

  const uniqueStatuses = [...new Set(rawData.filter(r => r.taskDtlId).map(r => r.taskStatus))];

  // Project summary pagination
  const totalSummaryPages = Math.ceil(projects.length / SUMMARY_PAGE_SIZE);
  const pagedProjects     = projects.slice((summaryPage - 1) * SUMMARY_PAGE_SIZE, summaryPage * SUMMARY_PAGE_SIZE);

  // Approval history filtered rows
  const filteredApproval = approvalHistory.filter(row => {
    if (filterApprovalProject !== "All" && row.projectId !== Number(filterApprovalProject)) return false;
    if (filterApprovalStatus  !== "All" && row.approvalStatus !== filterApprovalStatus) return false;
    return true;
  });
  const totalApprovalPages = Math.ceil(filteredApproval.length / APPROVAL_PAGE_SIZE);
  const pagedApproval      = filteredApproval.slice(
    (approvalPage - 1) * APPROVAL_PAGE_SIZE,
    approvalPage * APPROVAL_PAGE_SIZE
  );

  // Revision history filtered rows
  const filteredRevision = revisionHistory.filter(row => {
    if (filterRevisionProject !== "All" && row.projectId !== Number(filterRevisionProject)) return false;
    if (filterRevisionStatus  !== "All" && row.taskStatus !== filterRevisionStatus) return false;
    if (filterRevised         !== "All" && row.isRevised  !== filterRevised) return false;
    if (filterRevisionTask    !== "All" && row.taskDtlId  !== Number(filterRevisionTask)) return false;
    return true;
  });
  // Unique tasks for current project filter (for task dropdown)
  const revisionTaskOptions = Object.values(
    revisionHistory
      .filter(r => filterRevisionProject === "All" || r.projectId === Number(filterRevisionProject))
      .reduce((acc, row) => {
        if (!acc[row.taskDtlId]) acc[row.taskDtlId] = { id: row.taskDtlId, name: row.taskName };
        return acc;
      }, {})
  );
  // Deduplicate by taskDtlId for summary view
  const uniqueRevisionTasks = Object.values(
    filteredRevision.reduce((acc, row) => {
      if (!acc[row.taskDtlId]) acc[row.taskDtlId] = row;
      return acc;
    }, {})
  );
  // Get all remarks for a specific task (for modal)
  const getTaskRevisions = (taskDtlId) =>
    revisionHistory.filter(r => r.taskDtlId === taskDtlId && r.remarks);
  const totalRevisionPages = Math.ceil(uniqueRevisionTasks.length / REVISION_PAGE_SIZE);
  const pagedRevision      = uniqueRevisionTasks.slice(
    (revisionPage - 1) * REVISION_PAGE_SIZE,
    revisionPage * REVISION_PAGE_SIZE
  );

  // Date history filtered rows
  const filteredDateHistory = dateHistory.filter(row => {
    if (filterDateProject !== "All" && row.projectId !== Number(filterDateProject)) return false;
    if (filterDateTask    !== "All" && row.taskDtlId  !== Number(filterDateTask)) return false;
    return true;
  });
  const dateTaskOptions = Object.values(
    dateHistory
      .filter(r => filterDateProject === "All" || r.projectId === Number(filterDateProject))
      .reduce((acc, row) => {
        if (!acc[row.taskDtlId]) acc[row.taskDtlId] = { id: row.taskDtlId, name: row.taskName };
        return acc;
      }, {})
  );
  const totalDatePages = Math.ceil(filteredDateHistory.length / DATE_PAGE_SIZE);
  const pagedDateHistory = filteredDateHistory.slice(
    (datePage - 1) * DATE_PAGE_SIZE,
    datePage * DATE_PAGE_SIZE
  );

  // STV filtered rows
  const filteredStv = stvData.filter(row => {
    if (filterStvProject !== "All" && row.projectId !== Number(filterStvProject)) return false;
    if (filterStvRisk    !== "All" && row.riskLevel  !== filterStvRisk) return false;
    return true;
  });
  const totalStvPages = Math.ceil(filteredStv.length / STV_PAGE_SIZE);
  const pagedStv      = filteredStv.slice(
    (stvPage - 1) * STV_PAGE_SIZE,
    stvPage * STV_PAGE_SIZE
  );

  // Reset to page 1 when filters change
  const handleFilterChange = (setter) => (e) => {
    setter(e.target.value);
    setCurrentPage(1);
  };

  // Paginated rows
  const totalPages  = Math.ceil(filteredRows.length / PAGE_SIZE);
  const pagedRows   = filteredRows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div className="app-container">
      <Topbar />
      <div className="main-layout d-flex">
        <Navbar />

        <div className="flex-grow-1">
          <div className="content container-fluid p-4">

            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
              <h4 style={{ margin: 0 }}>Reports</h4>
              <button
                onClick={exportCSV}
                disabled={loading}
                style={{
                  background: "#198754", color: "#fff", border: "none",
                  borderRadius: 6, padding: "6px 16px", fontSize: 13,
                  fontWeight: 600, cursor: "pointer", display: "flex",
                  alignItems: "center", gap: 6, width: "fit-content"
                }}
              >
                <i className="bi bi-download"></i> Export CSV
              </button>
            </div>

            {error && <div className="alert alert-danger">{error}</div>}

            {/* Summary Cards */}
            <div className="row g-3 mb-4">
              {[
                { label: "Total Tasks",     value: totalTasks,    color: "primary" },
                { label: "Completed",       value: completedTasks, color: "success" },
                { label: "Pending",         value: pendingTasks,  color: "warning" },
                { label: "Delayed",         value: delayedTasks,  color: "danger"  },
              ].map(card => (
                <div className="col-auto" key={card.label}>
                  <div className="card px-4 py-3 text-center" style={{ minWidth: 130 }}>
                    <div className={`fs-3 fw-bold text-${card.color}`}>{card.value}</div>
                    <div className="small">{card.label}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Tabs */}
            <ul className="nav nav-tabs mb-4 justify-content-end">
              <li className="nav-item">
                <button
                  className={`nav-link ${activeTab === "summary" ? "active" : ""}`}
                  onClick={() => setActiveTab("summary")}
                >
                  <i className="bi bi-diagram-3 me-1"></i>Project Summary
                </button>
              </li>
              <li className="nav-item">
                <button
                  className={`nav-link ${activeTab === "stv" ? "active" : ""}`}
                  onClick={() => {
                    setActiveTab("stv");
                    if (stvData.length === 0) loadStvData();
                  }}
                >
                  <i className="bi bi-speedometer2 me-1"></i>STV
                </button>
              </li>
              <li className="nav-item">
                <button
                  className={`nav-link ${activeTab === "datehistory" ? "active" : ""}`}
                  onClick={() => {
                    setActiveTab("datehistory");
                    if (dateHistory.length === 0) loadDateHistory();
                  }}
                >
                  <i className="bi bi-calendar-range me-1"></i>Revision History
                </button>
              </li>
              <li className="nav-item">
                <button
                  className={`nav-link ${activeTab === "revisionhistory" ? "active" : ""}`}
                  onClick={() => {
                    setActiveTab("revisionhistory");
                    if (revisionHistory.length === 0) loadRevisionHistory();
                  }}
                >
                  <i className="bi bi-journal-text me-1"></i>Activity Log
                </button>
              </li>
              <li className="nav-item">
                <button
                  className={`nav-link ${activeTab === "approvalhistory" ? "active" : ""}`}
                  onClick={() => {
                    setActiveTab("approvalhistory");
                    if (approvalHistory.length === 0) loadApprovalHistory();
                  }}
                >
                  <i className="bi bi-clock-history me-1"></i>Approval History
                </button>
              </li>
              <li className="nav-item">
                <button
                  className={`nav-link ${activeTab === "planvactual" ? "active" : ""}`}
                  onClick={() => setActiveTab("planvactual")}
                >
                  <i className="bi bi-bar-chart me-1"></i>Plan vs Actual
                  {delayedTasks > 0 && (
                    <span className="badge bg-danger ms-2">{delayedTasks}</span>
                  )}
                </button>
              </li>
            </ul>

            {/* ── TAB 1: PROJECT SUMMARY ── */}
            {activeTab === "summary" && (
              <div>
                {loading ? (
                  <div className="text-center py-5">
                    <div className="spinner-border text-primary"></div>
                  </div>
                ) : projects.length === 0 ? (
                  <div className="text-center text-muted py-5">No projects found</div>
                ) : (
                  pagedProjects.map(project => (
                    <div key={project.projectId} className="card shadow-sm mb-3" style={{ borderRadius: 10 }}>
                      {/* Project Header */}
                      <div
                        className="card-header d-flex align-items-center justify-content-between"
                        style={{ cursor: "pointer", background: "#f0f4ff" }}
                        onClick={() => toggleProject(project.projectId)}
                      >
                        <div className="d-flex align-items-center gap-3">
                          <i className={`bi bi-chevron-${expandedProjects[project.projectId] ? "down" : "right"}`}></i>
                          <span className="fw-bold">{project.projectName}</span>
                          <StatusBadge value={project.projectApprovalStatus} />
                        </div>
                        <div className="d-flex gap-3 align-items-center">
                          <small className="text-muted">
                            PL: {project.projectPLName}
                          </small>
                          <small className="text-muted">
                            Target: {project.projectTimeline}
                          </small>
                        </div>
                      </div>

                      {/* Milestones */}
                      {expandedProjects[project.projectId] && (
                        <div className="card-body p-0">
                          {Object.values(project.milestones).length === 0 ? (
                            <div className="text-muted p-3">No milestones</div>
                          ) : (
                            Object.values(project.milestones).map(ms => (
                              <div key={ms.milestoneId} className="border-bottom">
                                {/* Milestone Row */}
                                <div className="d-flex align-items-center gap-3 px-4 py-2"
                                  style={{ background: "#f8f9fa" }}>
                                  <i className="bi bi-flag-fill text-primary" style={{ fontSize: 12 }}></i>
                                  <span className="fw-semibold" style={{ fontSize: 13 }}>
                                    {ms.milestoneName}
                                  </span>
                                  <StatusBadge value={ms.milestoneStatus} />
                                  <small className="text-muted ms-auto">
                                    Due: {ms.milestoneDueDate || "—"}
                                  </small>
                                </div>

                                {/* Tasks */}
                                {ms.tasks.length > 0 && (
                                  <div className="table-responsive">
                                    <table className="table table-sm table-hover mb-0">
                                      <thead className="table-light">
                                        <tr>
                                          <th style={{ paddingLeft: 32 }}>Task</th>
                                          <th>Assigned To</th>
                                          <th>Severity</th>
                                          <th>Planned Date</th>
                                          <th>Revised Date</th>
                                          <th>Status</th>
                                          <th>Delayed</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {ms.tasks.map(task => (
                                          <tr key={task.taskDtlId}
                                            style={{
                                              background: task.isDelayed === "Y"
                                                ? "#fff3cd" : "inherit"
                                            }}
                                          >
                                            <td style={{ paddingLeft: 32, fontSize: 12.5 }}>
                                              {task.isDelayed === "Y" && (
                                                <i className="bi bi-exclamation-triangle-fill text-danger me-1"></i>
                                              )}
                                              {task.taskName}
                                            </td>
                                            <td style={{ fontSize: 12 }}>{task.assignedToName}</td>
                                            <td>
                                              <span className={`badge ${
                                                task.taskSeverity === "Critical" ? "bg-danger" :
                                                task.taskSeverity === "High"     ? "bg-warning text-dark" :
                                                task.taskSeverity === "Medium"   ? "bg-info text-dark" : "bg-secondary"
                                              }`} style={{ fontSize: 10 }}>
                                                {task.taskSeverity}
                                              </span>
                                            </td>
                                            <td style={{ fontSize: 12 }}>{task.plannedDate || "—"}</td>
                                            <td style={{ fontSize: 12, color: task.revisedDate ? "#dc3545" : "inherit" }}>
                                              {task.revisedDate || "—"}
                                            </td>
                                            <td><StatusBadge value={task.taskStatus} /></td>
                                            <td>
                                              {task.isDelayed === "Y" ? (
                                                <span className="badge bg-danger" style={{ fontSize: 10 }}>
                                                  +{task.daysDelayed}d
                                                </span>
                                              ) : (
                                                <span className="badge bg-success" style={{ fontSize: 10 }}>On Track</span>
                                              )}
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                )}
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  ))
                )}

              {/* Summary Pagination */}
              {totalSummaryPages > 1 && (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 16 }}>
                  <small style={{ color: "#6c757d" }}>
                    Showing {((summaryPage - 1) * SUMMARY_PAGE_SIZE) + 1}–{Math.min(summaryPage * SUMMARY_PAGE_SIZE, projects.length)} of {projects.length} projects
                  </small>
                  <nav>
                    <ul className="pagination pagination-sm mb-0">
                      <li className={`page-item ${summaryPage === 1 ? "disabled" : ""}`}>
                        <button className="page-link" onClick={() => setSummaryPage(p => p - 1)}>‹</button>
                      </li>
                      {Array.from({ length: totalSummaryPages }, (_, i) => i + 1).map(p => (
                        <li key={p} className={`page-item ${summaryPage === p ? "active" : ""}`}>
                          <button className="page-link" onClick={() => setSummaryPage(p)}>{p}</button>
                        </li>
                      ))}
                      <li className={`page-item ${summaryPage === totalSummaryPages ? "disabled" : ""}`}>
                        <button className="page-link" onClick={() => setSummaryPage(p => p + 1)}>›</button>
                      </li>
                    </ul>
                  </nav>
                </div>
              )}
            </div>
            )}

            {/* ── TAB 2: STV REPORT ── */}
            {activeTab === "stv" && (
              <>
                {stvError && <div className="alert alert-danger">{stvError}</div>}

                {/* STV Legend */}
                <div className="d-flex gap-3 align-items-center mb-3">
                  <small className="fw-semibold text-muted">Risk Levels:</small>
                  <span style={{ background: "#d4edda", color: "#155724", borderRadius: 6, padding: "2px 10px", fontSize: 11, fontWeight: 600 }}>✅ On Track ≥ 90%</span>
                  <span style={{ background: "#fff3cd", color: "#856404", borderRadius: 6, padding: "2px 10px", fontSize: 11, fontWeight: 600 }}>⚠ At Risk 75–89%</span>
                  <span style={{ background: "#f8d7da", color: "#721c24", borderRadius: 6, padding: "2px 10px", fontSize: 11, fontWeight: 600 }}>🔴 Delayed &lt; 75%</span>
                </div>

                {/* Filters */}
                <div className="row g-2 mb-3">
                  <div className="col-md-3">
                    <select
                      className="form-select form-select-sm"
                      value={filterStvProject}
                      onChange={e => { setFilterStvProject(e.target.value); setStvPage(1); }}
                    >
                      <option value="All">All Projects</option>
                      {uniqueProjects.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-2">
                    <select
                      className="form-select form-select-sm"
                      value={filterStvRisk}
                      onChange={e => { setFilterStvRisk(e.target.value); setStvPage(1); }}
                    >
                      <option value="All">All Risk Levels</option>
                      <option value="On Track">On Track</option>
                      <option value="At Risk">At Risk</option>
                      <option value="Delayed">Delayed</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>
                  <div className="col-md-1">
                    <button
                      className="btn btn-outline-secondary btn-sm w-100"
                      onClick={() => { setFilterStvProject("All"); setFilterStvRisk("All"); setStvPage(1); }}
                    >
                      Reset
                    </button>
                  </div>
                </div>

                {/* STV Table */}
                <div className="card shadow-sm">
                  <div className="table-responsive" style={{ maxHeight: "450px", overflowY: "auto" }}>
                    <table className="table table-bordered align-middle mb-0">
                      <thead style={{ background: "#0b2d6b", color: "#fff", position: "sticky", top: 0, zIndex: 1 }}>
                        <tr>
                          <th>Task</th>
                          <th>Milestone</th>
                          <th>Assigned To</th>
                          <th>Severity</th>
                          <th>Target Date</th>
                          <th>Planned Days</th>
                          <th>Actual Days</th>
                          <th>STV %</th>
                          <th>Risk Level</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stvLoading ? (
                          <tr>
                            <td colSpan="10" className="text-center py-4">
                              <div className="spinner-border spinner-border-sm text-primary me-2"></div>
                              Loading...
                            </td>
                          </tr>
                        ) : pagedStv.length === 0 ? (
                          <tr>
                            <td colSpan="10" className="text-center text-muted py-4">
                              No STV data found
                            </td>
                          </tr>
                        ) : (
                          pagedStv.map((row, idx) => {
                            const rowBg =
                              row.riskLevel === "Delayed"   ? "#f8d7da" :
                              row.riskLevel === "At Risk"   ? "#fff3cd" :
                              row.riskLevel === "Completed" ? "#d4edda" : "inherit";
                            return (
                              <tr key={idx} style={{ background: rowBg }}>
                                <td style={{ fontSize: 12.5, fontWeight: 600 }}>{row.taskName}</td>
                                <td style={{ fontSize: 12 }}>{row.milestoneName}</td>
                                <td style={{ fontSize: 12 }}>{row.assignedToName}</td>
                                <td>
                                  <span className={`badge ${
                                    row.taskSeverity === "Critical" ? "bg-danger" :
                                    row.taskSeverity === "High"     ? "bg-warning text-dark" :
                                    row.taskSeverity === "Medium"   ? "bg-info text-dark" : "bg-secondary"
                                  }`} style={{ fontSize: 10 }}>
                                    {row.taskSeverity}
                                  </span>
                                </td>
                                <td style={{ fontSize: 12 }}>{row.taskTargetDate || "—"}</td>
                                <td style={{ fontSize: 12 }}>{row.plannedDays}d</td>
                                <td style={{ fontSize: 12 }}>{row.actualDays}d</td>
                                <td>
                                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                    <div style={{
                                      width: 60, height: 8, background: "#e9ecef",
                                      borderRadius: 4, overflow: "hidden"
                                    }}>
                                      <div style={{
                                        width: `${Math.min(row.stv, 100)}%`,
                                        height: "100%",
                                        background: row.stv >= 90 ? "#28a745" :
                                                    row.stv >= 75 ? "#ffc107" : "#dc3545",
                                        borderRadius: 4,
                                      }}></div>
                                    </div>
                                    <span style={{ fontSize: 11, fontWeight: 600 }}>{row.stv}%</span>
                                  </div>
                                </td>
                                <td>
                                  <span style={{
                                    background:
                                      row.riskLevel === "Delayed"   ? "#f8d7da" :
                                      row.riskLevel === "At Risk"   ? "#fff3cd" :
                                      row.riskLevel === "Completed" ? "#d4edda" : "#cce5ff",
                                    color:
                                      row.riskLevel === "Delayed"   ? "#721c24" :
                                      row.riskLevel === "At Risk"   ? "#856404" :
                                      row.riskLevel === "Completed" ? "#155724" : "#004085",
                                    borderRadius: 12, padding: "2px 10px",
                                    fontSize: 11, fontWeight: 600
                                  }}>
                                    {row.riskLevel}
                                  </span>
                                </td>
                                <td><StatusBadge value={row.taskStatus} /></td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Pagination */}
                {totalStvPages > 1 && (
                  <div className="d-flex align-items-center justify-content-between mt-3">
                    <small className="text-muted">
                      Showing {((stvPage - 1) * STV_PAGE_SIZE) + 1}–{Math.min(stvPage * STV_PAGE_SIZE, filteredStv.length)} of {filteredStv.length} tasks
                    </small>
                    <nav>
                      <ul className="pagination pagination-sm mb-0">
                        <li className={`page-item ${stvPage === 1 ? "disabled" : ""}`}>
                          <button className="page-link" onClick={() => setStvPage(p => p - 1)}>‹</button>
                        </li>
                        {Array.from({ length: totalStvPages }, (_, i) => i + 1).map(p => (
                          <li key={p} className={`page-item ${stvPage === p ? "active" : ""}`}>
                            <button className="page-link" onClick={() => setStvPage(p)}>{p}</button>
                          </li>
                        ))}
                        <li className={`page-item ${stvPage === totalStvPages ? "disabled" : ""}`}>
                          <button className="page-link" onClick={() => setStvPage(p => p + 1)}>›</button>
                        </li>
                      </ul>
                    </nav>
                  </div>
                )}
              </>
            )}

            {/* ── TAB 3: REVISION HISTORY (Date Changes) ── */}
            {activeTab === "datehistory" && (
              <>
                {dateHistoryError && <div className="alert alert-danger">{dateHistoryError}</div>}

                <div className="alert alert-info py-2 mb-3" style={{ fontSize: 12 }}>
                  <i className="bi bi-info-circle me-1"></i>
                  This tab shows only <strong>target date changes</strong> — when a task due date was revised, the original date, new date and who changed it.
                </div>

                {/* Filters */}
                <div className="row g-2 mb-3">
                  <div className="col-md-3">
                    <select
                      className="form-select form-select-sm"
                      value={filterDateProject}
                      onChange={e => {
                        setFilterDateProject(e.target.value);
                        setFilterDateTask("All");
                        setDatePage(1);
                      }}
                    >
                      <option value="All">All Projects</option>
                      {uniqueProjects.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-3">
                    <select
                      className="form-select form-select-sm"
                      value={filterDateTask}
                      onChange={e => { setFilterDateTask(e.target.value); setDatePage(1); }}
                      disabled={filterDateProject === "All"}
                    >
                      <option value="All">
                        {filterDateProject === "All" ? "Select a project first" : "All Tasks"}
                      </option>
                      {dateTaskOptions.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-1">
                    <button
                      className="btn btn-outline-secondary btn-sm w-100"
                      onClick={() => {
                        setFilterDateProject("All");
                        setFilterDateTask("All");
                        setDatePage(1);
                      }}
                    >
                      Reset
                    </button>
                  </div>
                </div>

                {/* Date History Table */}
                <div className="card shadow-sm">
                  <div className="table-responsive" style={{ maxHeight: "450px", overflowY: "auto" }}>
                    <table className="table table-bordered align-middle mb-0">
                      <thead style={{ background: "#0b2d6b", color: "#fff", position: "sticky", top: 0, zIndex: 1 }}>
                        <tr>
                          <th>#</th>
                          <th>Task</th>
                          <th>Milestone</th>
                          <th>Original Date</th>
                          <th>New Date</th>
                          <th>Days Changed</th>
                          <th>Changed By</th>
                          <th>Changed On</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dateHistoryLoading ? (
                          <tr>
                            <td colSpan="8" className="text-center py-4">
                              <div className="spinner-border spinner-border-sm text-primary me-2"></div>
                              Loading...
                            </td>
                          </tr>
                        ) : pagedDateHistory.length === 0 ? (
                          <tr>
                            <td colSpan="8" className="text-center text-muted py-4">
                              No date revisions found — no task due dates have been changed yet.
                            </td>
                          </tr>
                        ) : (
                          pagedDateHistory.map((row, idx) => (
                            <tr key={idx} style={{
                              background: row.daysChanged > 0 ? "#fff3cd" : "#d4edda"
                            }}>
                              <td style={{ fontSize: 12 }}>{((datePage - 1) * DATE_PAGE_SIZE) + idx + 1}</td>
                              <td style={{ fontSize: 12.5, fontWeight: 600 }}>{row.taskName}</td>
                              <td style={{ fontSize: 12 }}>{row.milestoneName}</td>
                              <td style={{ fontSize: 12, color: "#dc3545", fontWeight: 600 }}>
                                {row.oldDate || "—"}
                              </td>
                              <td style={{ fontSize: 12, color: "#155724", fontWeight: 600 }}>
                                {row.newDate || "—"}
                              </td>
                              <td>
                                {row.daysChanged > 0 ? (
                                  <span className="badge bg-danger">+{row.daysChanged}d delayed</span>
                                ) : row.daysChanged < 0 ? (
                                  <span className="badge bg-success">{row.daysChanged}d earlier</span>
                                ) : (
                                  <span className="badge bg-secondary">No change</span>
                                )}
                              </td>
                              <td style={{ fontSize: 12 }}>{row.changedByName}</td>
                              <td style={{ fontSize: 12 }}>{row.changedOn}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Pagination */}
                {totalDatePages > 1 && (
                  <div className="d-flex align-items-center justify-content-between mt-3">
                    <small className="text-muted">
                      Showing {((datePage - 1) * DATE_PAGE_SIZE) + 1}–{Math.min(datePage * DATE_PAGE_SIZE, filteredDateHistory.length)} of {filteredDateHistory.length} records
                    </small>
                    <nav>
                      <ul className="pagination pagination-sm mb-0">
                        <li className={`page-item ${datePage === 1 ? "disabled" : ""}`}>
                          <button className="page-link" onClick={() => setDatePage(p => p - 1)}>‹</button>
                        </li>
                        {Array.from({ length: totalDatePages }, (_, i) => i + 1).map(p => (
                          <li key={p} className={`page-item ${datePage === p ? "active" : ""}`}>
                            <button className="page-link" onClick={() => setDatePage(p)}>{p}</button>
                          </li>
                        ))}
                        <li className={`page-item ${datePage === totalDatePages ? "disabled" : ""}`}>
                          <button className="page-link" onClick={() => setDatePage(p => p + 1)}>›</button>
                        </li>
                      </ul>
                    </nav>
                  </div>
                )}
              </>
            )}

            {/* ── TAB 4: ACTIVITY LOG ── */}
            {activeTab === "revisionhistory" && (
              <>
                {revisionError && <div className="alert alert-danger">{revisionError}</div>}

                {/* Filters */}
                <div className="row g-2 mb-3">
                  <div className="col-md-3">
                    <select
                      className="form-select form-select-sm"
                      value={filterRevisionProject}
                      onChange={e => {
                        setFilterRevisionProject(e.target.value);
                        setFilterRevisionTask("All");
                        setRevisionPage(1);
                      }}
                    >
                      <option value="All">All Projects</option>
                      {uniqueProjects.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-3">
                    <select
                      className="form-select form-select-sm"
                      value={filterRevisionTask}
                      onChange={e => { setFilterRevisionTask(e.target.value); setRevisionPage(1); }}
                      disabled={filterRevisionProject === "All"}
                    >
                      <option value="All">
                        {filterRevisionProject === "All" ? "Select a project first" : "All Tasks"}
                      </option>
                      {revisionTaskOptions.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-2">
                    <select
                      className="form-select form-select-sm"
                      value={filterRevisionStatus}
                      onChange={e => { setFilterRevisionStatus(e.target.value); setRevisionPage(1); }}
                    >
                      <option value="All">All Statuses</option>
                      <option value="Not Started">Not Started</option>
                      <option value="In Progress">In Progress</option>
                      <option value="On Hold">On Hold</option>
                      <option value="Completed">Completed</option>
                      <option value="Pending">Pending</option>
                    </select>
                  </div>
                  <div className="col-md-2">
                    <select
                      className="form-select form-select-sm"
                      value={filterRevised}
                      onChange={e => { setFilterRevised(e.target.value); setRevisionPage(1); }}
                    >
                      <option value="All">All Tasks</option>
                      <option value="Y">Revised Only</option>
                      <option value="N">Not Revised</option>
                    </select>
                  </div>
                  <div className="col-md-1">
                    <button
                      className="btn btn-outline-secondary btn-sm w-100"
                      onClick={() => {
                        setFilterRevisionProject("All");
                        setFilterRevisionTask("All");
                        setFilterRevisionStatus("All");
                        setFilterRevised("All");
                        setRevisionPage(1);
                      }}
                    >
                      Reset
                    </button>
                  </div>
                </div>

                {/* Revision History Table */}
                <div className="card shadow-sm">
                  <div className="table-responsive" style={{ maxHeight: "450px", overflowY: "auto" }}>
                    <table className="table table-bordered align-middle mb-0">
                      <thead style={{ background: "#0b2d6b", color: "#fff", position: "sticky", top: 0, zIndex: 1 }}>
                        <tr>
                          <th>Task</th>
                          <th>Milestone</th>
                          <th>Assigned To</th>
                          <th>Planned Date</th>
                          <th>Revised Date</th>
                          <th>Variance</th>
                          <th>Status</th>
                          <th>Revised</th>
                        </tr>
                      </thead>
                      <tbody>
                        {revisionLoading ? (
                          <tr>
                            <td colSpan="8" className="text-center py-4">
                              <div className="spinner-border spinner-border-sm text-primary me-2"></div>
                              Loading...
                            </td>
                          </tr>
                        ) : pagedRevision.length === 0 ? (
                          <tr>
                            <td colSpan="8" className="text-center text-muted py-4">
                              No revision history found
                            </td>
                          </tr>
                        ) : (
                          pagedRevision.map((row, idx) => {
                            const taskRevisions = getTaskRevisions(row.taskDtlId);
                            const hasMultipleRevisions = taskRevisions.length > 1;
                            return (
                            <tr key={idx} style={{
                              background: row.isRevised === "Y" ? "#fff3cd" : "inherit",
                              cursor: hasMultipleRevisions ? "pointer" : "default"
                            }}
                            onClick={() => hasMultipleRevisions && setRevisionModal(row)}
                            title={hasMultipleRevisions ? "Click to view all revisions" : ""}
                            >
                              <td style={{ fontSize: 12.5, fontWeight: 600 }}>
                                {row.isRevised === "Y" && (
                                  <i className="bi bi-exclamation-triangle-fill text-warning me-1"></i>
                                )}
                                {row.taskName}
                                {hasMultipleRevisions && (
                                  <span className="badge bg-info text-dark ms-2" style={{ fontSize: 9 }}>
                                    {taskRevisions.length} revisions
                                  </span>
                                )}
                              </td>
                              <td style={{ fontSize: 12 }}>{row.milestoneName}</td>
                              <td style={{ fontSize: 12 }}>{row.assignedToName}</td>
                              <td style={{ fontSize: 12 }}>{row.plannedDate || "—"}</td>
                              <td style={{
                                fontSize: 12,
                                color: row.revisedDate ? "#dc3545" : "inherit",
                                fontWeight: row.revisedDate ? 600 : "normal"
                              }}>
                                {row.revisedDate || "—"}
                              </td>
                              <td>
                                {row.daysVariance > 0 ? (
                                  <span className="badge bg-danger">+{row.daysVariance}d</span>
                                ) : row.daysVariance < 0 ? (
                                  <span className="badge bg-success">{row.daysVariance}d</span>
                                ) : (
                                  <span className="badge bg-secondary">0d</span>
                                )}
                              </td>
                              <td><StatusBadge value={row.taskStatus} /></td>
                              <td>
                                {row.isRevised === "Y"
                                  ? <span className="badge bg-warning text-dark">Yes</span>
                                  : <span className="badge bg-success">No</span>
                                }
                              </td>
                            </tr>
                          )})
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Revision Modal */}
                {revisionModal && (
                  <div style={{
                    position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
                    background: "rgba(0,0,0,0.5)", zIndex: 9999,
                    display: "flex", alignItems: "center", justifyContent: "center"
                  }}
                  onClick={() => setRevisionModal(null)}
                  >
                    <div style={{
                      background: "#fff", borderRadius: 12, padding: 24,
                      width: "90%", maxWidth: 700, maxHeight: "80vh",
                      overflowY: "auto", boxShadow: "0 8px 32px rgba(0,0,0,0.2)"
                    }}
                    onClick={e => e.stopPropagation()}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                        <div>
                          <h6 style={{ margin: 0, fontWeight: 700 }}>Revision History</h6>
                          <small style={{ color: "#6c757d" }}>{revisionModal.taskName}</small>
                        </div>
                        <button
                          onClick={() => setRevisionModal(null)}
                          style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#6c757d" }}
                        >×</button>
                      </div>
                      <table className="table table-bordered table-sm">
                        <thead style={{ background: "#0b2d6b", color: "#fff" }}>
                          <tr>
                            <th>#</th>
                            <th>Remark</th>
                            <th>By</th>
                            <th>Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {getTaskRevisions(revisionModal.taskDtlId).map((r, i) => (
                            <tr key={i}>
                              <td>{i + 1}</td>
                              <td style={{ fontSize: 12 }}>{r.remarks || "—"}</td>
                              <td style={{ fontSize: 12 }}>{r.remarksByName || "—"}</td>
                              <td style={{ fontSize: 12 }}>{r.remarkDate || "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Pagination */}
                {totalRevisionPages > 1 && (
                  <div className="d-flex align-items-center justify-content-between mt-3">
                    <small className="text-muted">
                      Showing {((revisionPage - 1) * REVISION_PAGE_SIZE) + 1}–{Math.min(revisionPage * REVISION_PAGE_SIZE, uniqueRevisionTasks.length)} of {uniqueRevisionTasks.length} tasks
                    </small>
                    <nav>
                      <ul className="pagination pagination-sm mb-0">
                        <li className={`page-item ${revisionPage === 1 ? "disabled" : ""}`}>
                          <button className="page-link" onClick={() => setRevisionPage(p => p - 1)}>‹</button>
                        </li>
                        {Array.from({ length: totalRevisionPages }, (_, i) => i + 1).map(p => (
                          <li key={p} className={`page-item ${revisionPage === p ? "active" : ""}`}>
                            <button className="page-link" onClick={() => setRevisionPage(p)}>{p}</button>
                          </li>
                        ))}
                        <li className={`page-item ${revisionPage === totalRevisionPages ? "disabled" : ""}`}>
                          <button className="page-link" onClick={() => setRevisionPage(p => p + 1)}>›</button>
                        </li>
                      </ul>
                    </nav>
                  </div>
                )}
              </>
            )}

            {/* ── TAB 3: APPROVAL HISTORY ── */}
            {activeTab === "approvalhistory" && (
              <>
                {approvalError && <div className="alert alert-danger">{approvalError}</div>}

                {/* Filters */}
                <div className="row g-2 mb-3">
                  <div className="col-md-3">
                    <select
                      className="form-select form-select-sm"
                      value={filterApprovalProject}
                      onChange={e => { setFilterApprovalProject(e.target.value); setApprovalPage(1); }}
                    >
                      <option value="All">All Projects</option>
                      {uniqueProjects.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-2">
                    <select
                      className="form-select form-select-sm"
                      value={filterApprovalStatus}
                      onChange={e => { setFilterApprovalStatus(e.target.value); setApprovalPage(1); }}
                    >
                      <option value="All">All Statuses</option>
                      <option value="Pending">Pending</option>
                      <option value="Approved">Approved</option>
                      <option value="Sent Back">Sent Back</option>
                    </select>
                  </div>
                  <div className="col-md-1">
                    <button
                      className="btn btn-outline-secondary btn-sm w-100"
                      onClick={() => {
                        setFilterApprovalProject("All");
                        setFilterApprovalStatus("All");
                        setApprovalPage(1);
                      }}
                    >
                      Reset
                    </button>
                  </div>
                </div>

                {/* Approval History Table */}
                <div className="card shadow-sm">
                  <div className="table-responsive" style={{ maxHeight: "450px", overflowY: "auto" }}>
                    <table className="table table-bordered align-middle mb-0">
                      <thead style={{ background: "#0b2d6b", color: "#fff", position: "sticky", top: 0, zIndex: 1 }}>
                        <tr>
                          <th>Task</th>
                          <th>Approver</th>
                          <th>Status</th>
                          <th>Approval Date</th>
                          <th>Remarks</th>
                        </tr>
                      </thead>
                      <tbody>
                        {approvalLoading ? (
                          <tr>
                            <td colSpan="5" className="text-center py-4">
                              <div className="spinner-border spinner-border-sm text-primary me-2"></div>
                              Loading...
                            </td>
                          </tr>
                        ) : pagedApproval.length === 0 ? (
                          <tr>
                            <td colSpan="5" className="text-center text-muted py-4">
                              No approval history found
                            </td>
                          </tr>
                        ) : (
                          pagedApproval.map((row, idx) => (
                            <tr key={idx}>
                              <td style={{ fontSize: 12.5, fontWeight: 600 }}>{row.taskName}</td>
                              <td style={{ fontSize: 12 }}>{row.approverName}</td>
                              <td>
                                <StatusBadge value={row.approvalStatus} />
                              </td>
                              <td style={{ fontSize: 12 }}>
                                {row.approvalDate || "—"}
                              </td>
                              <td style={{ fontSize: 12, color: "#6c757d" }}>
                                {row.remarks || "—"}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Pagination */}
                {totalApprovalPages > 1 && (
                  <div className="d-flex align-items-center justify-content-between mt-3">
                    <small className="text-muted">
                      Showing {((approvalPage - 1) * APPROVAL_PAGE_SIZE) + 1}–{Math.min(approvalPage * APPROVAL_PAGE_SIZE, filteredApproval.length)} of {filteredApproval.length} records
                    </small>
                    <nav>
                      <ul className="pagination pagination-sm mb-0">
                        <li className={`page-item ${approvalPage === 1 ? "disabled" : ""}`}>
                          <button className="page-link" onClick={() => setApprovalPage(p => p - 1)}>‹</button>
                        </li>
                        {Array.from({ length: totalApprovalPages }, (_, i) => i + 1).map(p => (
                          <li key={p} className={`page-item ${approvalPage === p ? "active" : ""}`}>
                            <button className="page-link" onClick={() => setApprovalPage(p)}>{p}</button>
                          </li>
                        ))}
                        <li className={`page-item ${approvalPage === totalApprovalPages ? "disabled" : ""}`}>
                          <button className="page-link" onClick={() => setApprovalPage(p => p + 1)}>›</button>
                        </li>
                      </ul>
                    </nav>
                  </div>
                )}
              </>
            )}

            {/* ── TAB 4: PLAN VS ACTUAL ── */}
            {activeTab === "planvactual" && (
              <>
                {/* Filters */}
                <div className="row g-2 mb-3">
                  <div className="col-md-3">
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="Search task or project..."
                      value={searchText}
                      onChange={e => { setSearchText(e.target.value); setCurrentPage(1); }}
                    />
                  </div>
                  <div className="col-md-2">
                    <select
                      className="form-select form-select-sm"
                      value={filterProject}
                      onChange={e => { setFilterProject(e.target.value); setCurrentPage(1); }}
                    >
                      <option value="All">All Projects</option>
                      {uniqueProjects.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-2">
                    <select
                      className="form-select form-select-sm"
                      value={filterStatus}
                      onChange={e => { setFilterStatus(e.target.value); setCurrentPage(1); }}
                    >
                      <option value="All">All Statuses</option>
                      {uniqueStatuses.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-2">
                    <select
                      className="form-select form-select-sm"
                      value={filterDelayed}
                      onChange={e => { setFilterDelayed(e.target.value); setCurrentPage(1); }}
                    >
                      <option value="All">All</option>
                      <option value="Y">Delayed Only</option>
                      <option value="N">On Track Only</option>
                    </select>
                  </div>
                  <div className="col-md-1">
                    <button
                      className="btn btn-outline-secondary btn-sm w-100"
                      onClick={() => {
                        setSearchText("");
                        setFilterProject("All");
                        setFilterStatus("All");
                        setFilterDelayed("All");
                      }}
                    >
                      Reset
                    </button>
                  </div>
                </div>

                {/* Plan vs Actual Table */}
                <div className="card shadow-sm">
                  <div className="table-responsive" ref={tableRef} style={{ maxHeight: "450px", overflowY: "auto" }}>
                    <table className="table table-bordered align-middle mb-0">
                      <thead style={{ background: "#0b2d6b", color: "#fff", position: "sticky", top: 0, zIndex: 1 }}>
                        <tr>
                          <th>Project</th>
                          <th>Milestone</th>
                          <th>Task</th>
                          <th>Assigned To</th>
                          <th>Severity</th>
                          <th>Planned Date</th>
                          <th>Revised Date</th>
                          <th>Status</th>
                          <th>Variance</th>
                        </tr>
                      </thead>
                      <tbody>
                        {loading ? (
                          <tr>
                            <td colSpan="9" className="text-center py-4">
                              <div className="spinner-border spinner-border-sm text-primary me-2"></div>
                              Loading...
                            </td>
                          </tr>
                        ) : filteredRows.length === 0 ? (
                          <tr>
                            <td colSpan="9" className="text-center text-muted py-4">
                              No data found
                            </td>
                          </tr>
                        ) : (
                          pagedRows.map((row, idx) => (
                            <tr
                              key={idx}
                              style={{
                                background: row.isDelayed === "Y"
                                  ? "#fff3cd" : "inherit"
                              }}
                            >
                              <td style={{ fontSize: 12.5, fontWeight: 600 }}>
                                {row.projectName}
                              </td>
                              <td style={{ fontSize: 12 }}>{row.milestoneName || "—"}</td>
                              <td style={{ fontSize: 12.5 }}>
                                {row.isDelayed === "Y" && (
                                  <i className="bi bi-exclamation-triangle-fill text-danger me-1"></i>
                                )}
                                {row.taskName}
                              </td>
                              <td style={{ fontSize: 12 }}>{row.assignedToName}</td>
                              <td>
                                <span className={`badge ${
                                  row.taskSeverity === "Critical" ? "bg-danger" :
                                  row.taskSeverity === "High"     ? "bg-warning text-dark" :
                                  row.taskSeverity === "Medium"   ? "bg-info text-dark" : "bg-secondary"
                                }`} style={{ fontSize: 10 }}>
                                  {row.taskSeverity}
                                </span>
                              </td>
                              <td style={{ fontSize: 12 }}>{row.plannedDate || "—"}</td>
                              <td style={{
                                fontSize: 12,
                                color: row.revisedDate ? "#dc3545" : "inherit",
                                fontWeight: row.revisedDate ? 600 : "normal"
                              }}>
                                {row.revisedDate || "—"}
                              </td>
                              <td><StatusBadge value={row.taskStatus} /></td>
                              <td>
                                {row.isDelayed === "Y" ? (
                                  <span className="badge bg-danger">
                                    +{row.daysDelayed} days
                                  </span>
                                ) : (
                                  <span className="badge bg-success">On Track</span>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="d-flex align-items-center justify-content-between mt-3">
                    <small className="text-muted">
                      Showing {((currentPage - 1) * PAGE_SIZE) + 1}–{Math.min(currentPage * PAGE_SIZE, filteredRows.length)} of {filteredRows.length} tasks
                    </small>
                    <nav>
                      <ul className="pagination pagination-sm mb-0">
                        <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                          <button className="page-link" onClick={() => setCurrentPage(p => p - 1)}>‹</button>
                        </li>
                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                          .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2)
                          .reduce((acc, p, i, arr) => {
                            if (i > 0 && p - arr[i - 1] > 1) acc.push("...");
                            acc.push(p);
                            return acc;
                          }, [])
                          .map((p, i) =>
                            p === "..." ? (
                              <li key={`ellipsis-${i}`} className="page-item disabled">
                                <span className="page-link">…</span>
                              </li>
                            ) : (
                              <li key={p} className={`page-item ${currentPage === p ? "active" : ""}`}>
                                <button className="page-link" onClick={() => setCurrentPage(p)}>{p}</button>
                              </li>
                            )
                          )
                        }
                        <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
                          <button className="page-link" onClick={() => setCurrentPage(p => p + 1)}>›</button>
                        </li>
                      </ul>
                    </nav>
                  </div>
                )}

                {/* Legend */}
                <div className="mt-3 d-flex gap-3 align-items-center">
                  <small className="text-muted fw-semibold">Legend:</small>
                  <div style={{ background: "#fff3cd", padding: "2px 12px", borderRadius: 6, fontSize: 12 }}>
                    🟡 Delayed Task
                  </div>
                  <div style={{ background: "#d4edda", padding: "2px 12px", borderRadius: 6, fontSize: 12 }}>
                    🟢 On Track
                  </div>
                  <div style={{ color: "#dc3545", fontSize: 12, fontWeight: 600 }}>
                    Red date = Revised date
                  </div>
                </div>
              </>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
