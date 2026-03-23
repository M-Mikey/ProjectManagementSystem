import React, { useEffect, useState } from "react";
import "../styles/ProjectApproval.css";
import Topbar from '../components/Navbar/Topbar';
import Navbar from '../components/Navbar/Navbar';
import { useNavigate, Link } from "react-router-dom";
import { getApproval } from "../api/userDashboardApi";
import {
  // getTaskAssignmentApprovals, // ❌ COMMENTED — not in flow
  getTaskCompletionApprovals,
} from "../api/taskService";

const PAGE_SIZE = 10;

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;
  return (
    <div className="d-flex align-items-center justify-content-between mt-3">
      <small className="text-muted">Page {currentPage} of {totalPages}</small>
      <nav>
        <ul className="pagination pagination-sm mb-0">
          <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
            <button className="page-link"
              onClick={() => onPageChange(currentPage - 1)}>‹</button>
          </li>
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter(p => p === 1 || p === totalPages ||
              Math.abs(p - currentPage) <= 1)
            .reduce((acc, p, i, arr) => {
              if (i > 0 && p - arr[i-1] > 1) acc.push("...");
              acc.push(p);
              return acc;
            }, [])
            .map((p, i) => p === "..." ? (
              <li key={`e-${i}`} className="page-item disabled">
                <span className="page-link">…</span>
              </li>
            ) : (
              <li key={p}
                className={`page-item ${currentPage === p ? "active" : ""}`}>
                <button className="page-link"
                  onClick={() => onPageChange(p)}>{p}</button>
              </li>
            ))}
          <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
            <button className="page-link"
              onClick={() => onPageChange(currentPage + 1)}>›</button>
          </li>
        </ul>
      </nav>
    </div>
  );
};

const ProjectApproval = () => {
  const navigate = useNavigate();
  const userId   = sessionStorage.getItem("userId");

  const [activeTab, setActiveTab] = useState("project");

  // ── Project Approval
  const [projData, setProjData]         = useState([]);
  const [projPending, setProjPending]   = useState(0);
  const [projApproved, setProjApproved] = useState(0);
  const [projStatus, setProjStatus]     = useState("Pending");
  const [projLoading, setProjLoading]   = useState(false);
  const [projError, setProjError]       = useState("");
  const [projSearch, setProjSearch]     = useState("");
  const [projPage, setProjPage]         = useState(1);
  const [milestoneModal, setMilestoneModal] = useState(null);

  // ── Task Assignment Approval — COMMENTED OUT
  // const [assignData, setAssignData]         = useState([]);
  // const [assignPending, setAssignPending]   = useState(0);
  // const [assignApproved, setAssignApproved] = useState(0);
  // const [assignStatus, setAssignStatus]     = useState("Pending");
  // const [assignLoading, setAssignLoading]   = useState(false);
  // const [assignError, setAssignError]       = useState("");
  // const [assignSearch, setAssignSearch]     = useState("");
  // const [assignPage, setAssignPage]         = useState(1);

  // ── Task Completion Approval
  const [compData, setCompData]         = useState([]);
  const [compPending, setCompPending]   = useState(0);
  const [compApproved, setCompApproved] = useState(0);
  const [compStatus, setCompStatus]     = useState("Pending");
  const [compLoading, setCompLoading]   = useState(false);
  const [compError, setCompError]       = useState("");
  const [compSearch, setCompSearch]     = useState("");
  const [compPage, setCompPage]         = useState(1);

  useEffect(() => {
    if (!userId) { navigate("/", { replace: true }); return; }
    loadProject();
    // loadAssignment(); // ❌ COMMENTED
    loadCompletion();
  }, [userId]);

  useEffect(() => {
    if (userId) { loadProject(); setProjPage(1); }
  }, [projStatus]);

  const loadProject = async () => {
    setProjLoading(true);
    setProjError("");
    try {
      const result = await getApproval(userId, projStatus);
      const grouped = {};
      (result.data || []).forEach(row => {
        if (!grouped[row.projectId]) {
          grouped[row.projectId] = { ...row, milestones: [] };
        }
        if (row.taskDetails) {
          grouped[row.projectId].milestones.push({
            name:    row.taskDetails,
            dueDate: row.dueDate,
          });
        }
      });
      const groupedArr = Object.values(grouped)
        .sort((a, b) => b.projectId - a.projectId);
      setProjData(groupedArr);
      setProjPending(result.pendingCount || 0);
      setProjApproved(result.approvedCount || 0);
    } catch (err) {
      setProjError("Failed to load project approvals.");
    } finally {
      setProjLoading(false);
    }
  };

  // ── COMMENTED OUT — not in flow
  // const loadAssignment = async () => {
  //   setAssignLoading(true); setAssignError("");
  //   try {
  //     const result = await getTaskAssignmentApprovals(userId, "All");
  //     setAssignData((result.data || []).slice().reverse());
  //     setAssignPending(result.pendingCount || 0);
  //     setAssignApproved(result.approvedCount || 0);
  //   } catch (err) {
  //     setAssignError("Failed to load task assignment approvals.");
  //   } finally { setAssignLoading(false); }
  // };

  const loadCompletion = async () => {
    setCompLoading(true);
    setCompError("");
    try {
      const result = await getTaskCompletionApprovals(userId, "All");
      setCompData((result.data || []).slice().reverse());
      setCompPending(result.pendingCount || 0);
      setCompApproved(result.approvedCount || 0);
    } catch (err) {
      setCompError("Failed to load task completion approvals.");
    } finally {
      setCompLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    if (isNaN(d.getTime()) || d.getFullYear() < 2000) return "—";
    return d.toLocaleDateString();
  };

  // ── Project filtered + paginated
  const filteredProj = projData.filter(row =>
    !projSearch ||
    row.projectName?.toLowerCase().includes(projSearch.toLowerCase()) ||
    row.projectPLName?.toLowerCase().includes(projSearch.toLowerCase())
  );
  const totalProjPages = Math.ceil(filteredProj.length / PAGE_SIZE);
  const pagedProj      = filteredProj.slice(
    (projPage-1)*PAGE_SIZE, projPage*PAGE_SIZE
  );

  // ── Completion filtered + paginated
  const filteredComp = compData.filter(r => {
    const statusMatch =
      compStatus === "All"      ? true :
      compStatus === "Pending"  ? r.approvalStatus === 0 :
      compStatus === "Approved" ? r.approvalStatus === 1 :
      compStatus === "SentBack" ? r.approvalStatus === 2 : true;
    const searchMatch = !compSearch ||
      r.taskName?.toLowerCase().includes(compSearch.toLowerCase()) ||
      r.projectName?.toLowerCase().includes(compSearch.toLowerCase()) ||
      r.assignedToName?.toLowerCase().includes(compSearch.toLowerCase());
    return statusMatch && searchMatch;
  });
  const totalCompPages = Math.ceil(filteredComp.length / PAGE_SIZE);
  const pagedComp      = filteredComp.slice(
    (compPage-1)*PAGE_SIZE, compPage*PAGE_SIZE
  );

  const totalPending = projPending + compPending;
  // + assignPending; // ❌ COMMENTED

  const SearchBar = ({ value, onChange, placeholder }) => (
    <div className="input-group" style={{ maxWidth: 350 }}>
      <span className="input-group-text bg-white">
        <i className="bi bi-search text-muted"></i>
      </span>
      <input
        type="text"
        className="form-control form-control-sm"
        placeholder={placeholder || "Search..."}
        value={value}
        onChange={e => onChange(e.target.value)}
      />
      {value && (
        <button
          className="btn btn-outline-secondary btn-sm"
          onClick={() => onChange("")}
        >
          <i className="bi bi-x"></i>
        </button>
      )}
    </div>
  );

  const SummaryCards = ({ pending, approved, total, selected, onSelect }) => (
    <div className="row g-3 mb-4">
      {[
        { label: "Pending",  value: pending,  color: "danger",  status: "Pending"  },
        { label: "Approved", value: approved, color: "success", status: "Approved" },
        { label: "All",      value: total,    color: "primary", status: "All"      },
      ].map(card => (
        <div className="col-auto" key={card.status}>
          <div
            className={`card px-4 py-3 text-center ${
              selected === card.status
                ? `border-${card.color} border-3` : ""
            }`}
            style={{ cursor: "pointer", minWidth: 130 }}
            onClick={() => onSelect(card.status)}
          >
            <div className={`fs-3 fw-bold text-${card.color}`}>
              {card.value}
            </div>
            <div className="text-muted small">{card.label}</div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="app-container">
      <Topbar />
      <div className="main-layout d-flex">
        <Navbar />
        <div className="flex-grow-1">
          <div className="content container-fluid p-4">

            {/* ── PAGE TITLE */}
            <div className="d-flex align-items-center mb-3">
              <h5 className="mb-0 animate__animated animate__fadeInDown">
                {activeTab === "project"
                  ? "Project Approvals"
                  : "Task Completion Approvals"}
                {totalPending > 0 && (
                  <span className="badge bg-danger ms-2">
                    {totalPending}
                  </span>
                )}
              </h5>
            </div>

            {/* ── TABS — only 2 tabs now */}
            <ul className="nav nav-tabs mb-4 justify-content-end">
              <li className="nav-item">
                <button
                  className={`nav-link ${
                    activeTab === "project" ? "active" : ""}`}
                  onClick={() => setActiveTab("project")}
                >
                  Project Approvals
                  {projPending > 0 && (
                    <span className="badge bg-danger ms-2">
                      {projPending}
                    </span>
                  )}
                </button>
              </li>

              {/* ❌ COMMENTED — Task Assignment tab
              <li className="nav-item">
                <button
                  className={`nav-link ${activeTab === "assignment" ? "active" : ""}`}
                  onClick={() => setActiveTab("assignment")}>
                  Task Assignment
                  {assignPending > 0 &&
                    <span className="badge bg-danger ms-2">{assignPending}</span>}
                </button>
              </li> */}

              <li className="nav-item">
                <button
                  className={`nav-link ${
                    activeTab === "completion" ? "active" : ""}`}
                  onClick={() => setActiveTab("completion")}
                >
                  Task Completion
                  {compPending > 0 && (
                    <span className="badge bg-danger ms-2">
                      {compPending}
                    </span>
                  )}
                </button>
              </li>
            </ul>

            {/* ── TAB 1: PROJECT APPROVALS ── */}
            {activeTab === "project" && (
              <>
                {projError && (
                  <div className="alert alert-danger">{projError}</div>
                )}

                <div className="row g-3 mb-4">
                  <div className="col-md-3 col-6">
                    <div
                      className={`card summary-card animate__animated
                        animate__zoomIn
                        ${projStatus === "Pending"
                          ? "border border-3 border-dark" : ""}
                        bg-danger bg-opacity-50`}
                      style={{ cursor: "pointer" }}
                      onClick={() => setProjStatus("Pending")}
                    >
                      <div className="card-body text-center">
                        <h2 className="text-danger">{projPending}</h2>
                        <p className="mb-0 text-danger">Approval Pending</p>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-3 col-6">
                    <div
                      className={`card summary-card animate__animated
                        animate__zoomIn
                        ${projStatus === "Completed"
                          ? "border border-3 border-dark" : ""}
                        bg-success bg-opacity-50`}
                      style={{ cursor: "pointer" }}
                      onClick={() => setProjStatus("Completed")}
                    >
                      <div className="card-body text-center">
                        <h2 className="text-success">{projApproved}</h2>
                        <p className="mb-0 text-success">
                          Approval Completed
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="d-flex justify-content-between
                  align-items-center mb-3">
                  <small className="text-muted">
                    {filteredProj.length} projects
                  </small>
                  <SearchBar
                    value={projSearch}
                    onChange={v => { setProjSearch(v); setProjPage(1); }}
                    placeholder="Search project or PL..."
                  />
                </div>

                <div className="table-responsive
                  animate__animated animate__fadeInUp">
                  <table className="table table-bordered align-middle">
                    <thead>
                      <tr>
                        <th>Action</th>
                        <th>Project Name</th>
                        <th>Milestones</th>
                        <th>Project PL</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {projLoading ? (
                        <tr>
                          <td colSpan="5" className="text-center">
                            <div className="spinner-border
                              spinner-border-sm text-primary me-2" />
                            Loading...
                          </td>
                        </tr>
                      ) : pagedProj.length === 0 ? (
                        <tr>
                          <td colSpan="5"
                            className="text-center text-muted">
                            No data found
                          </td>
                        </tr>
                      ) : (
                        pagedProj.map((val, index) => (
                          <tr key={index}>
                            <td>
                              <Link
                                to={`/project_approval_details/${val.projectId}/${val.milestoneId}`}
                                state={val}
                                className="btn btn-sm btn-outline-primary"
                              >
                                <i className="bi bi-pencil-square"></i>
                              </Link>
                            </td>
                            <td>
                              <div className="fw-bold">
                                {val.projectName}
                              </div>
                              <small className="text-muted">
                                ID: {val.projectId}
                              </small>
                            </td>
                            <td>
                              {val.milestones?.length > 0 ? (
                                <button
                                  className="btn btn-sm btn-outline-info"
                                  onClick={() => setMilestoneModal(val)}
                                  style={{ fontSize: 12 }}
                                >
                                  <i className="bi bi-flag-fill me-1"></i>
                                  {val.milestones.length} Milestone
                                  {val.milestones.length > 1 ? "s" : ""}
                                </button>
                              ) : (
                                <span className="text-muted">—</span>
                              )}
                            </td>
                            <td>
                              {val.projectPLName
                                ? `${val.projectPLName} - ${val.projectPL}`
                                : val.projectPL}
                            </td>
                            <td>
                              <span className={`badge ${
                                val.status === "Pending"
                                  ? "bg-warning text-dark"
                                  : "bg-success"
                              }`}>
                                {val.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                <Pagination
                  currentPage={projPage}
                  totalPages={totalProjPages}
                  onPageChange={setProjPage}
                />
              </>
            )}

            {/* ── TAB 2: TASK COMPLETION APPROVALS ── */}
            {activeTab === "completion" && (
              <>
                {compError && (
                  <div className="alert alert-danger">{compError}</div>
                )}
                <SummaryCards
                  pending={compPending}
                  approved={compApproved}
                  total={compData.length}
                  selected={compStatus}
                  onSelect={v => { setCompStatus(v); setCompPage(1); }}
                />
                <div className="d-flex justify-content-between
                  align-items-center mb-3">
                  <small className="text-muted">
                    {filteredComp.length} tasks
                  </small>
                  <SearchBar
                    value={compSearch}
                    onChange={v => { setCompSearch(v); setCompPage(1); }}
                    placeholder="Search task, project, assigned to..."
                  />
                </div>
                <div className="table-responsive">
                  <table className="table table-bordered align-middle">
                    <thead className="table-light">
                      <tr>
                        <th>Action</th>
                        <th>Project</th>
                        <th>Milestone</th>
                        <th>Task Name</th>
                        <th>Assigned To</th>
                        <th>Due Date</th>
                        <th>Delayed</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {compLoading ? (
                        <tr>
                          <td colSpan="8" className="text-center">
                            <div className="spinner-border
                              spinner-border-sm text-primary me-2" />
                            Loading...
                          </td>
                        </tr>
                      ) : pagedComp.length === 0 ? (
                        <tr>
                          <td colSpan="8"
                            className="text-center text-muted">
                            No {compStatus.toLowerCase()} task
                            completion approvals
                          </td>
                        </tr>
                      ) : (
                        pagedComp.map((row, index) => (
                          <tr key={index}>
                            <td>
                              <button
                                className="btn btn-sm btn-outline-primary"
                                onClick={() => navigate(
                                  `/task_completion_approval_details/${row.taskDtlId}`,
                                  { state: { task: row } }
                                )}
                              >
                                <i className="bi bi-pencil-square"></i>
                              </button>
                            </td>
                            <td>{row.projectName}</td>
                            <td>{row.milestoneName}</td>
                            <td>{row.taskName}</td>
                            <td>
                              {row.assignedToName || row.taskAssignedTo}
                            </td>
                            <td>
                              <span className={
                                row.isDelayed === "Y"
                                  ? "text-danger fw-bold" : ""
                              }>
                                {row.taskDueDate || "—"}
                              </span>
                            </td>
                            <td>
                              {row.isDelayed === "Y"
                                ? <span className="badge bg-danger">Yes</span>
                                : <span className="badge bg-success">No</span>
                              }
                            </td>
                            <td>
                              <span className={`badge ${
                                row.approvalStatus === 0
                                  ? "bg-warning text-dark" :
                                row.approvalStatus === 1
                                  ? "bg-success" : "bg-secondary"
                              }`}>
                                {row.statusText}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                <Pagination
                  currentPage={compPage}
                  totalPages={totalCompPages}
                  onPageChange={setCompPage}
                />
              </>
            )}

          </div>
        </div>
      </div>

      {/* ── MILESTONE MODAL */}
      {milestoneModal && (
        <div
          style={{
            position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
            background: "rgba(0,0,0,0.5)", zIndex: 9999,
            display: "flex", alignItems: "center", justifyContent: "center"
          }}
          onClick={() => setMilestoneModal(null)}
        >
          <div
            style={{
              background: "#fff", borderRadius: 12, padding: 24,
              width: "90%", maxWidth: 600, maxHeight: "80vh",
              overflowY: "auto",
              boxShadow: "0 8px 32px rgba(0,0,0,0.2)"
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{
              display: "flex", justifyContent: "space-between",
              alignItems: "center", marginBottom: 16
            }}>
              <div>
                <h6 style={{
                  margin: 0, fontWeight: 700, color: "#0b2d6b"
                }}>
                  <i className="bi bi-flag-fill text-primary me-2"></i>
                  Milestones
                </h6>
                <small style={{ color: "#6c757d" }}>
                  {milestoneModal.projectName}
                </small>
              </div>
              <button
                onClick={() => setMilestoneModal(null)}
                style={{
                  background: "none", border: "none",
                  fontSize: 22, cursor: "pointer",
                  color: "#6c757d", lineHeight: 1
                }}
              >×</button>
            </div>

            <table className="table table-bordered table-sm mb-0">
              <thead style={{ background: "#0b2d6b", color: "#fff" }}>
                <tr>
                  <th>#</th>
                  <th>Milestone Name</th>
                  <th>Due Date</th>
                </tr>
              </thead>
              <tbody>
                {milestoneModal.milestones.map((m, i) => (
                  <tr key={i}>
                    <td style={{ fontSize: 12 }}>{i + 1}</td>
                    <td style={{ fontSize: 12.5 }}>
                      <i className="bi bi-flag-fill text-primary me-1"
                        style={{ fontSize: 10 }}></i>
                      {m.name}
                    </td>
                    <td style={{ fontSize: 12 }}>
                      {m.dueDate &&
                       !String(m.dueDate).startsWith("0001")
                        ? formatDate(m.dueDate)
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="mt-3 text-end">
              <button
                className="btn btn-sm btn-secondary"
                onClick={() => setMilestoneModal(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ProjectApproval;