import React, { useEffect, useState } from "react";
import "../styles/ProjectApproval.css";
import { useNavigate, Link } from "react-router-dom";
import { getApproval, updateApprovalDetails } from "../api/userDashboardApi";
import {
  getTaskCompletionApprovals,
  updateTaskCompletionApproval,
  getTaskAssignmentApprovals,
  updateTaskAssignmentApproval,
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
            <button className="page-link" onClick={() => onPageChange(currentPage - 1)}>‹</button>
          </li>
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
            .reduce((acc, p, i, arr) => {
              if (i > 0 && p - arr[i - 1] > 1) acc.push("...");
              acc.push(p);
              return acc;
            }, [])
            .map((p, i) => p === "..." ? (
              <li key={`e-${i}`} className="page-item disabled">
                <span className="page-link">…</span>
              </li>
            ) : (
              <li key={p} className={`page-item ${currentPage === p ? "active" : ""}`}>
                <button className="page-link" onClick={() => onPageChange(p)}>{p}</button>
              </li>
            ))}
          <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
            <button className="page-link" onClick={() => onPageChange(currentPage + 1)}>›</button>
          </li>
        </ul>
      </nav>
    </div>
  );
};

const StatusBadge = ({ status, approvalStatus }) => {
  const label = status || (approvalStatus === 0 ? "Pending" : approvalStatus === 1 ? "Approved" : "Sent Back");
  const map = {
    "Pending":   { bg: "#fef9c3", color: "#854d0e", dot: "#eab308" },
    "Approved":  { bg: "#dcfce7", color: "#166534", dot: "#22c55e" },
    "Completed": { bg: "#dcfce7", color: "#166534", dot: "#22c55e" },
    "Sent Back": { bg: "#fee2e2", color: "#991b1b", dot: "#ef4444" },
    "SentBack":  { bg: "#fee2e2", color: "#991b1b", dot: "#ef4444" },
  };
  const s = map[label] || { bg: "#f1f5f9", color: "#475569", dot: "#94a3b8" };
  return (
    <span style={{
      background: s.bg, color: s.color, fontSize: 11, fontWeight: 700,
      padding: "3px 10px", borderRadius: 20,
      display: "inline-flex", alignItems: "center", gap: 5,
      border: `1px solid ${s.dot}33`
    }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: s.dot, flexShrink: 0 }} />
      {label}
    </span>
  );
};

const SearchBar = ({ value, onChange, placeholder }) => (
  <div className="input-group" style={{ maxWidth: 350 }}>
    <span className="input-group-text bg-white">
      <i className="bi bi-search text-muted" />
    </span>
    <input type="text" className="form-control form-control-sm"
      placeholder={placeholder || "Search..."}
      value={value} onChange={e => onChange(e.target.value)} />
    {value && (
      <button className="btn btn-outline-secondary btn-sm" onClick={() => onChange("")}>
        <i className="bi bi-x" />
      </button>
    )}
  </div>
);

const SummaryCards = ({ pending, approved, total, selected, onSelect }) => (
  <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
    {[
      { label: "Pending",  value: pending,  color: "#dc2626", status: "Pending"  },
      { label: "Approved", value: approved, color: "#16a34a", status: "Approved" },
      { label: "All",      value: total,    color: "#1a56db", status: "All"      },
    ].map(card => (
      <div key={card.status} onClick={() => onSelect(card.status)} style={{
        background: "#fff",
        border: `1.5px solid ${selected === card.status ? card.color : "#e2e8f0"}`,
        borderRadius: 10, padding: "12px 20px", cursor: "pointer",
        display: "flex", alignItems: "center", gap: 12,
        boxShadow: selected === card.status ? `0 0 0 3px ${card.color}22` : "0 1px 4px rgba(0,0,0,0.05)",
        transition: "all 0.15s", minWidth: 120,
      }}>
        <div style={{ width: 36, height: 36, borderRadius: 8, background: card.color + "18", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <span style={{ fontSize: 17, fontWeight: 800, color: card.color }}>{card.value}</span>
        </div>
        <div style={{ fontSize: 12, color: "#64748b", fontWeight: 500 }}>{card.label}</div>
      </div>
    ))}
  </div>
);

const ProjectApproval = () => {
  const navigate = useNavigate();
  const userId = sessionStorage.getItem("userId");

  const [activeTab, setActiveTab] = useState("project");

  // ── Project Approval state
  const [projViewMode, setProjViewMode]     = useState("individual");
  const [projData, setProjData]             = useState([]);
  const [projPending, setProjPending]       = useState(0);
  const [projApproved, setProjApproved]     = useState(0);
  const [projStatus, setProjStatus]         = useState("Pending");
  const [projLoading, setProjLoading]       = useState(false);
  const [projError, setProjError]           = useState("");
  const [projSearch, setProjSearch]         = useState("");
  const [projPage, setProjPage]             = useState(1);
  const [milestoneModal, setMilestoneModal] = useState(null);
  const [projSelections, setProjSelections] = useState({});
  const [projBulkSaving, setProjBulkSaving] = useState(false);
  const [projBulkMsg, setProjBulkMsg]       = useState("");
  const [projBulkType, setProjBulkType]     = useState("");
  const [projBulkErrors, setProjBulkErrors] = useState({});

  // ── Task Completion Approval state
  const [compViewMode, setCompViewMode]     = useState("individual");
  const [compData, setCompData]             = useState([]);
  const [compPending, setCompPending]       = useState(0);
  const [compApproved, setCompApproved]     = useState(0);
  const [compStatus, setCompStatus]         = useState("Pending");
  const [compLoading, setCompLoading]       = useState(false);
  const [compError, setCompError]           = useState("");
  const [compSearch, setCompSearch]         = useState("");
  const [compPage, setCompPage]             = useState(1);
  const [compSelections, setCompSelections] = useState({});
  const [compBulkSaving, setCompBulkSaving] = useState(false);
  const [compBulkMsg, setCompBulkMsg]       = useState("");
  const [compBulkType, setCompBulkType]     = useState("");
  const [compBulkErrors, setCompBulkErrors] = useState({});

  // ── Task Assignment Approval state
  const [asgnViewMode, setAsgnViewMode]     = useState("individual");
  const [asgnData, setAsgnData]             = useState([]);
  const [asgnPending, setAsgnPending]       = useState(0);
  const [asgnApproved, setAsgnApproved]     = useState(0);
  const [asgnStatus, setAsgnStatus]         = useState("Pending");
  const [asgnLoading, setAsgnLoading]       = useState(false);
  const [asgnError, setAsgnError]           = useState("");
  const [asgnSearch, setAsgnSearch]         = useState("");
  const [asgnPage, setAsgnPage]             = useState(1);
  const [asgnSelections, setAsgnSelections] = useState({});
  const [asgnBulkSaving, setAsgnBulkSaving] = useState(false);
  const [asgnBulkMsg, setAsgnBulkMsg]       = useState("");
  const [asgnBulkType, setAsgnBulkType]     = useState("");
  const [asgnBulkErrors, setAsgnBulkErrors] = useState({});

  useEffect(() => {
    if (!userId) { navigate("/", { replace: true }); return; }
    loadProject();
    loadCompletion();
    loadAssignment();
  }, [userId]);

  useEffect(() => {
    if (userId) { loadProject(); setProjPage(1); }
  }, [projStatus]);

  useEffect(() => {
    if (userId) { loadAssignment(); setAsgnPage(1); }
  }, [asgnStatus]);

  useEffect(() => {
    setProjSelections({});
    setProjBulkMsg("");
    setProjBulkErrors({});
  }, [projViewMode, projData]);

  useEffect(() => {
    setCompSelections({});
    setCompBulkMsg("");
    setCompBulkErrors({});
  }, [compViewMode, compData]);

  useEffect(() => {
    setAsgnSelections({});
    setAsgnBulkMsg("");
    setAsgnBulkErrors({});
  }, [asgnViewMode, asgnData]);

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
            name: row.taskDetails,
            dueDate: row.dueDate,
          });
        }
      });
      setProjData(Object.values(grouped).sort((a, b) => b.projectId - a.projectId));
      setProjPending(result.pendingCount || 0);
      setProjApproved(result.approvedCount || 0);
    } catch {
      setProjError("Failed to load project approvals.");
    } finally {
      setProjLoading(false);
    }
  };

  const loadCompletion = async () => {
    setCompLoading(true);
    setCompError("");
    try {
      const result = await getTaskCompletionApprovals(userId, "All");
      setCompData((result.data || []).slice().reverse());
      setCompPending(result.pendingCount || 0);
      setCompApproved(result.approvedCount || 0);
    } catch {
      setCompError("Failed to load task completion approvals.");
    } finally {
      setCompLoading(false);
    }
  };

  const loadAssignment = async () => {
    setAsgnLoading(true);
    setAsgnError("");
    try {
      const result = await getTaskAssignmentApprovals(userId, asgnStatus);
      setAsgnData(result.data || []);
      setAsgnPending(result.pendingCount || 0);
      setAsgnApproved(result.approvedCount || 0);
    } catch {
      setAsgnError("Failed to load task assignment approvals.");
    } finally {
      setAsgnLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    if (isNaN(d.getTime()) || d.getFullYear() < 2000) return "—";
    return d.toLocaleDateString();
  };

  // ── Filtered data
  const filteredProj = projData.filter(row =>
    !projSearch ||
    row.projectName?.toLowerCase().includes(projSearch.toLowerCase()) ||
    row.projectPLName?.toLowerCase().includes(projSearch.toLowerCase())
  );
  const pendingProj    = filteredProj.filter(p => p.status === "Pending");
  const totalProjPages = Math.ceil(filteredProj.length / PAGE_SIZE);
  const pagedProj      = filteredProj.slice((projPage - 1) * PAGE_SIZE, projPage * PAGE_SIZE);

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
  const groupedByProject = filteredComp.reduce((acc, row) => {
    if (!acc[row.projectId]) acc[row.projectId] = { projectId: row.projectId, projectName: row.projectName, tasks: [] };
    acc[row.projectId].tasks.push(row);
    return acc;
  }, {});
  const groupedProjects = Object.values(groupedByProject);
  const totalCompPages  = Math.ceil(filteredComp.length / PAGE_SIZE);
  const pagedComp       = filteredComp.slice((compPage - 1) * PAGE_SIZE, compPage * PAGE_SIZE);

  const filteredAsgn = asgnData.filter(r =>
    !asgnSearch ||
    r.taskName?.toLowerCase().includes(asgnSearch.toLowerCase()) ||
    r.projectName?.toLowerCase().includes(asgnSearch.toLowerCase()) ||
    r.assignedToName?.toLowerCase().includes(asgnSearch.toLowerCase()) ||
    r.taskCreatorName?.toLowerCase().includes(asgnSearch.toLowerCase())
  );
  const pendingAsgn    = filteredAsgn.filter(r => r.approvalStatus === 0);
  const totalAsgnPages = Math.ceil(filteredAsgn.length / PAGE_SIZE);
  const pagedAsgn      = filteredAsgn.slice((asgnPage - 1) * PAGE_SIZE, asgnPage * PAGE_SIZE);

  const totalPending = projPending + compPending + asgnPending;

  // ── Selection handlers
  const handleProjSelection = (id, field, value) => {
    setProjSelections(prev => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
    setProjBulkErrors(prev => { const u = { ...prev }; delete u[id]; return u; });
  };
  const handleCompSelection = (id, field, value) => {
    setCompSelections(prev => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
    setCompBulkErrors(prev => { const u = { ...prev }; delete u[id]; return u; });
  };
  const handleAsgnSelection = (id, field, value) => {
    setAsgnSelections(prev => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
    setAsgnBulkErrors(prev => { const u = { ...prev }; delete u[id]; return u; });
  };

  // ── Validation
  const validateBulk = (items, idKey, selections, setErrors) => {
    const errors = {};
    items.forEach(item => {
      const sel = selections[item[idKey]];
      if (!sel?.action)         errors[item[idKey]] = "Please select Approve or Send Back";
      else if (!sel?.remarks?.trim()) errors[item[idKey]] = "Remarks are required";
    });
    setErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ── Bulk submit handlers
  const handleProjBulkSubmit = async (projects) => {
    const pending = projects.filter(p => p.status === "Pending");
    if (!pending.length || !validateBulk(pending, "projectId", projSelections, setProjBulkErrors)) return;
    setProjBulkSaving(true);
    let ok = 0, fail = 0;
    for (const proj of pending) {
      const sel = projSelections[proj.projectId];
      try {
        await updateApprovalDetails({ projectId: Number(proj.projectId), approvedBy: userId, approvalStatus: Number(sel.action), remarks: sel.remarks });
        ok++;
      } catch { fail++; }
    }
    setProjBulkSaving(false);
    setProjBulkMsg(fail === 0 ? `✅ ${ok} project${ok > 1 ? "s" : ""} processed.` : `⚠️ ${ok} succeeded, ${fail} failed.`);
    setProjBulkType(fail === 0 ? "success" : "warning");
    setTimeout(() => { loadProject(); setProjSelections({}); setProjBulkMsg(""); }, 1500);
  };

  const handleCompBulkSubmit = async (tasks) => {
    const pending = tasks.filter(t => t.approvalStatus === 0);
    if (!pending.length || !validateBulk(pending, "taskDtlId", compSelections, setCompBulkErrors)) return;
    setCompBulkSaving(true);
    let ok = 0, fail = 0;
    for (const task of pending) {
      const sel = compSelections[task.taskDtlId];
      try {
        await updateTaskCompletionApproval({ taskDtlId: Number(task.taskDtlId), approvedBy: userId, status: Number(sel.action), remarks: sel.remarks });
        ok++;
      } catch { fail++; }
    }
    setCompBulkSaving(false);
    setCompBulkMsg(fail === 0 ? `✅ ${ok} task${ok > 1 ? "s" : ""} processed.` : `⚠️ ${ok} succeeded, ${fail} failed.`);
    setCompBulkType(fail === 0 ? "success" : "warning");
    setTimeout(() => { loadCompletion(); setCompSelections({}); setCompBulkMsg(""); }, 1500);
  };

  const handleAsgnBulkSubmit = async () => {
    if (!pendingAsgn.length || !validateBulk(pendingAsgn, "taskDtlId", asgnSelections, setAsgnBulkErrors)) return;
    setAsgnBulkSaving(true);
    let ok = 0, fail = 0;
    for (const task of pendingAsgn) {
      const sel = asgnSelections[task.taskDtlId];
      try {
        await updateTaskAssignmentApproval({ taskDtlId: Number(task.taskDtlId), approvedBy: userId, status: Number(sel.action), remarks: sel.remarks });
        ok++;
      } catch { fail++; }
    }
    setAsgnBulkSaving(false);
    setAsgnBulkMsg(fail === 0 ? `✅ ${ok} task${ok > 1 ? "s" : ""} processed.` : `⚠️ ${ok} succeeded, ${fail} failed.`);
    setAsgnBulkType(fail === 0 ? "success" : "warning");
    setTimeout(() => { loadAssignment(); setAsgnSelections({}); setAsgnBulkMsg(""); }, 1500);
  };

  // ── Single row assignment approval
  const handleAsgnSingleSubmit = async (task) => {
    const sel = asgnSelections[task.taskDtlId];
    if (!sel?.action) {
      setAsgnBulkErrors(prev => ({ ...prev, [task.taskDtlId]: "Please select Approve or Send Back" }));
      return;
    }
    if (!sel?.remarks?.trim()) {
      setAsgnBulkErrors(prev => ({ ...prev, [task.taskDtlId]: "Remarks are required" }));
      return;
    }
    try {
      await updateTaskAssignmentApproval({ taskDtlId: Number(task.taskDtlId), approvedBy: userId, status: Number(sel.action), remarks: sel.remarks });
      loadAssignment();
    } catch (err) {
      setAsgnError(err.message || "Failed to submit approval");
    }
  };

  // ── Inline action renderer
  const renderInlineAction = (id, selections, errors, onChange, isPending) => {
    if (!isPending) return null;
    const sel = selections[id] || {};
    const err = errors[id];
    return (
      <div>
        <div className="d-flex gap-3 mb-1">
          {[
            { val: "1", label: "Approve",   cls: "text-success", icon: "bi-check-circle-fill" },
            { val: "2", label: "Send Back",  cls: "text-danger",  icon: "bi-arrow-counterclockwise" },
          ].map(opt => (
            <div className="form-check mb-0" key={opt.val}>
              <input className="form-check-input" type="radio"
                name={`action-${id}`} id={`${opt.val}-${id}`}
                value={opt.val} checked={sel.action === opt.val}
                onChange={() => onChange(id, "action", opt.val)} />
              <label className={`form-check-label fw-semibold ${opt.cls}`}
                htmlFor={`${opt.val}-${id}`} style={{ fontSize: 12 }}>
                <i className={`bi ${opt.icon} me-1`} />{opt.label}
              </label>
            </div>
          ))}
        </div>
        <textarea className={`form-control form-control-sm ${err && !sel.remarks ? "is-invalid" : ""}`}
          rows={2} placeholder="Remarks (required)..."
          value={sel.remarks || ""}
          onChange={e => onChange(id, "remarks", e.target.value)}
          style={{ fontSize: 12 }} />
        {err && <small className="text-danger"><i className="bi bi-exclamation-circle me-1" />{err}</small>}
      </div>
    );
  };

  return (
    <div className="app-container">
      <div className="main-layout d-flex">
        <div className="flex-grow-1">
          <div className="content container-fluid p-4">

            {/* ── Page title */}
            <div className="d-flex align-items-center mb-3">
              <h5 className="mb-0">
                Approval Hub
                {totalPending > 0 && (
                  <span className="badge bg-danger ms-2">{totalPending}</span>
                )}
              </h5>
            </div>

            {/* ── Tabs */}
            <div style={{ display: "flex", gap: 4, borderBottom: "2px solid #e9ecef", marginBottom: 24 }}>
              {[
                { key: "project",    label: "Project Approvals",          count: projPending },
                { key: "assignment", label: "Task Assignment Approvals",   count: asgnPending },
                { key: "completion", label: "Task Completion Approvals",   count: compPending },
              ].map(t => (
                <button key={t.key} onClick={() => setActiveTab(t.key)} style={{
                  background: "none", border: "none",
                  borderBottom: activeTab === t.key ? "2px solid #0d1b3e" : "2px solid transparent",
                  marginBottom: -2, padding: "10px 20px",
                  fontWeight: activeTab === t.key ? 700 : 500,
                  color: activeTab === t.key ? "#0d1b3e" : "#6c757d",
                  cursor: "pointer", fontSize: 14, transition: "all 0.15s",
                  display: "flex", alignItems: "center", gap: 8, width: "auto"
                }}>
                  {t.label}
                  {t.count > 0 && (
                    <span style={{ background: "#dc2626", color: "#fff", fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 20 }}>
                      {t.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* ════════════════════════════════════
                TAB 1 — PROJECT APPROVALS
            ════════════════════════════════════ */}
            {activeTab === "project" && (
              <>
                {projError && <div className="alert alert-danger">{projError}</div>}

                <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
                  {[
                    { label: "Approval Pending",   value: projPending,  color: "#dc2626", status: "Pending"   },
                    { label: "Approval Completed", value: projApproved, color: "#16a34a", status: "Completed" },
                  ].map(card => (
                    <div key={card.status} onClick={() => setProjStatus(card.status)} style={{
                      background: "#fff",
                      border: `1.5px solid ${projStatus === card.status ? card.color : "#e2e8f0"}`,
                      borderRadius: 10, padding: "12px 20px", cursor: "pointer",
                      display: "flex", alignItems: "center", gap: 12,
                      boxShadow: projStatus === card.status ? `0 0 0 3px ${card.color}22` : "0 1px 4px rgba(0,0,0,0.05)",
                      transition: "all 0.15s", minWidth: 150,
                    }}>
                      <div style={{ width: 36, height: 36, borderRadius: 8, background: card.color + "18", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <span style={{ fontSize: 17, fontWeight: 800, color: card.color }}>{card.value}</span>
                      </div>
                      <div style={{ fontSize: 12, color: "#64748b", fontWeight: 500 }}>{card.label}</div>
                    </div>
                  ))}
                </div>

                <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                  <div className="d-flex align-items-center gap-2">
                    <small className="text-muted">{filteredProj.length} projects</small>
                    <div className="d-flex gap-2">
                      <button className={`btn btn-sm ${projViewMode === "individual" ? "btn-primary" : "btn-outline-primary"}`}
                        onClick={() => setProjViewMode("individual")}>
                        <i className="bi bi-list-ul me-1" />Individual
                      </button>
                      <button className={`btn btn-sm ${projViewMode === "bulk" ? "btn-primary" : "btn-outline-primary"}`}
                        onClick={() => setProjViewMode("bulk")}>
                        <i className="bi bi-check2-all me-1" />Bulk Approve
                      </button>
                    </div>
                  </div>
                  <SearchBar value={projSearch} onChange={v => { setProjSearch(v); setProjPage(1); }} placeholder="Search project or PL..." />
                </div>

                {projBulkMsg && <div className={`alert alert-${projBulkType} mb-3`}>{projBulkMsg}</div>}

                {projViewMode === "individual" && (
                  <>
                    <div className="table-responsive">
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
                            <tr><td colSpan="5" className="text-center"><div className="spinner-border spinner-border-sm text-primary me-2" />Loading...</td></tr>
                          ) : pagedProj.length === 0 ? (
                            <tr><td colSpan="5" className="text-center text-muted">No data found</td></tr>
                          ) : pagedProj.map((val, i) => (
                            <tr key={i}>
                              <td>
                                <Link to={`/project_approval_details/${val.projectId}/${val.milestoneId}`} state={val}
                                  className="btn btn-sm btn-outline-primary">
                                  <i className="bi bi-pencil-square" />
                                </Link>
                              </td>
                              <td>
                                <div className="fw-bold">{val.projectName}</div>
                                <small className="text-muted">ID: {val.projectId}</small>
                              </td>
                              <td>
                                {val.milestones?.length > 0 ? (
                                  <button className="btn btn-sm btn-outline-info" onClick={() => setMilestoneModal(val)} style={{ fontSize: 12 }}>
                                    <i className="bi bi-flag-fill me-1" />{val.milestones.length} Milestone{val.milestones.length > 1 ? "s" : ""}
                                  </button>
                                ) : <span className="text-muted">—</span>}
                              </td>
                              <td>{val.projectPLName ? `${val.projectPLName} - ${val.projectPL}` : val.projectPL}</td>
                              <td><StatusBadge status={val.status} /></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <Pagination currentPage={projPage} totalPages={totalProjPages} onPageChange={setProjPage} />
                  </>
                )}

                {projViewMode === "bulk" && (
                  <>
                    {pendingProj.length === 0 ? (
                      <div className="alert alert-info"><i className="bi bi-info-circle me-2" />No pending project approvals.</div>
                    ) : (
                      <>
                        <div className="d-flex justify-content-between align-items-center mb-3">
                          <small className="text-muted">{pendingProj.length} pending project{pendingProj.length > 1 ? "s" : ""}</small>
                          <button className="btn btn-success" style={{ width: "auto" }}
                            onClick={() => handleProjBulkSubmit(pendingProj)} disabled={projBulkSaving}>
                            {projBulkSaving ? <><span className="spinner-border spinner-border-sm me-2" />Processing...</> : <><i className="bi bi-check2-all me-1" />Submit All ({pendingProj.length})</>}
                          </button>
                        </div>
                        <div className="table-responsive">
                          <table className="table table-bordered align-middle">
                            <thead style={{ background: "#0b2d6b", color: "white" }}>
                              <tr><th>Project</th><th>PL</th><th>Milestones</th><th style={{ minWidth: 260 }}>Decision & Remarks</th></tr>
                            </thead>
                            <tbody>
                              {pendingProj.map((val, i) => (
                                <tr key={i}>
                                  <td><div className="fw-bold">{val.projectName}</div><small className="text-muted">ID: {val.projectId}</small></td>
                                  <td style={{ fontSize: 13 }}>{val.projectPLName ? `${val.projectPLName} - ${val.projectPL}` : val.projectPL}</td>
                                  <td>{val.milestones?.length > 0 ? <button className="btn btn-sm btn-outline-info" onClick={() => setMilestoneModal(val)} style={{ fontSize: 12 }}><i className="bi bi-flag-fill me-1" />{val.milestones.length}</button> : "—"}</td>
                                  <td>{renderInlineAction(val.projectId, projSelections, projBulkErrors, handleProjSelection, true)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </>
                    )}
                  </>
                )}
              </>
            )}

            {/* ════════════════════════════════════
                TAB 2 — TASK ASSIGNMENT APPROVALS
            ════════════════════════════════════ */}
            {activeTab === "assignment" && (
              <>
                {asgnError && <div className="alert alert-danger">{asgnError}</div>}

                <SummaryCards
                  pending={asgnPending} approved={asgnApproved}
                  total={asgnData.length} selected={asgnStatus}
                  onSelect={v => { setAsgnStatus(v); setAsgnPage(1); }}
                />

                <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                  <div className="d-flex align-items-center gap-2">
                    <small className="text-muted">{filteredAsgn.length} tasks</small>
                    <div className="d-flex gap-2">
                      <button className={`btn btn-sm ${asgnViewMode === "individual" ? "btn-primary" : "btn-outline-primary"}`}
                        onClick={() => setAsgnViewMode("individual")}>
                        <i className="bi bi-list-ul me-1" />Individual
                      </button>
                      <button className={`btn btn-sm ${asgnViewMode === "bulk" ? "btn-primary" : "btn-outline-primary"}`}
                        onClick={() => setAsgnViewMode("bulk")}>
                        <i className="bi bi-check2-all me-1" />Bulk Approve
                      </button>
                    </div>
                  </div>
                  <SearchBar value={asgnSearch} onChange={v => { setAsgnSearch(v); setAsgnPage(1); }} placeholder="Search task, project, assignee..." />
                </div>

                {asgnBulkMsg && <div className={`alert alert-${asgnBulkType} mb-3`}>{asgnBulkMsg}</div>}

                {/* Individual view */}
                {asgnViewMode === "individual" && (
                  <>
                    <div className="table-responsive">
                      <table className="table table-bordered align-middle">
                        <thead className="table-light">
                          <tr>
                            <th>Project</th>
                            <th>Milestone</th>
                            <th>Task Name</th>
                            <th>Assigned To</th>
                            <th>Created By</th>
                            <th>Due Date</th>
                            <th>Severity</th>
                            <th>Status</th>
                            <th style={{ minWidth: 260 }}>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {asgnLoading ? (
                            <tr><td colSpan="9" className="text-center"><div className="spinner-border spinner-border-sm text-primary me-2" />Loading...</td></tr>
                          ) : pagedAsgn.length === 0 ? (
                            <tr><td colSpan="9" className="text-center text-muted">No task assignment approvals found</td></tr>
                          ) : pagedAsgn.map((row, i) => (
                            <tr key={i}>
                              <td>
                                <div className="fw-bold" style={{ fontSize: 13 }}>{row.projectName}</div>
                                <small className="text-muted">ID: {row.projectId}</small>
                              </td>
                              <td style={{ fontSize: 13 }}>{row.milestoneName}</td>
                              <td>
                                <div className="fw-semibold" style={{ fontSize: 13 }}>{row.taskName}</div>
                                {row.taskDescrip && <small className="text-muted">{row.taskDescrip.slice(0, 60)}{row.taskDescrip.length > 60 ? "…" : ""}</small>}
                              </td>
                              <td style={{ fontSize: 13 }}>{row.assignedToName || row.taskAssignedTo}</td>
                              <td style={{ fontSize: 13 }}>{row.taskCreatorName}</td>
                              <td style={{ fontSize: 13 }}>{row.taskDueDate || "—"}</td>
                              <td>
                                <span style={{
                                  fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20,
                                  background: row.taskSeverity === "Critical" ? "#fee2e2" : row.taskSeverity === "High" ? "#fef9c3" : row.taskSeverity === "Medium" ? "#dbeafe" : "#dcfce7",
                                  color: row.taskSeverity === "Critical" ? "#991b1b" : row.taskSeverity === "High" ? "#854d0e" : row.taskSeverity === "Medium" ? "#1e40af" : "#166534",
                                }}>
                                  {row.taskSeverity || "—"}
                                </span>
                              </td>
                              <td><StatusBadge status={row.statusText} approvalStatus={row.approvalStatus} /></td>
                              <td>
                                {row.approvalStatus === 0
                                  ? (
                                    <div>
                                      {renderInlineAction(row.taskDtlId, asgnSelections, asgnBulkErrors, handleAsgnSelection, true)}
                                      <button className="btn btn-sm btn-success mt-2" style={{ width: "auto", fontSize: 12 }}
                                        onClick={() => handleAsgnSingleSubmit(row)}>
                                        <i className="bi bi-check2 me-1" />Submit
                                      </button>
                                    </div>
                                  ) : <StatusBadge status={row.statusText} approvalStatus={row.approvalStatus} />
                                }
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <Pagination currentPage={asgnPage} totalPages={totalAsgnPages} onPageChange={setAsgnPage} />
                  </>
                )}

                {/* Bulk view */}
                {asgnViewMode === "bulk" && (
                  <>
                    {pendingAsgn.length === 0 ? (
                      <div className="alert alert-info"><i className="bi bi-info-circle me-2" />No pending task assignment approvals.</div>
                    ) : (
                      <>
                        <div className="d-flex justify-content-between align-items-center mb-3">
                          <small className="text-muted">{pendingAsgn.length} pending task{pendingAsgn.length > 1 ? "s" : ""}</small>
                          <button className="btn btn-success" style={{ width: "auto" }}
                            onClick={handleAsgnBulkSubmit} disabled={asgnBulkSaving}>
                            {asgnBulkSaving ? <><span className="spinner-border spinner-border-sm me-2" />Processing...</> : <><i className="bi bi-check2-all me-1" />Submit All ({pendingAsgn.length})</>}
                          </button>
                        </div>
                        <div className="table-responsive">
                          <table className="table table-bordered align-middle">
                            <thead style={{ background: "#0b2d6b", color: "white" }}>
                              <tr><th>Project</th><th>Task</th><th>Assigned To</th><th>Due Date</th><th style={{ minWidth: 280 }}>Decision & Remarks</th></tr>
                            </thead>
                            <tbody>
                              {pendingAsgn.map((row, i) => (
                                <tr key={i}>
                                  <td><div className="fw-bold" style={{ fontSize: 13 }}>{row.projectName}</div><small className="text-muted">ID: {row.projectId}</small></td>
                                  <td>
                                    <div className="fw-semibold" style={{ fontSize: 13 }}>{row.taskName}</div>
                                    <small className="text-muted">{row.milestoneName}</small>
                                  </td>
                                  <td style={{ fontSize: 13 }}>{row.assignedToName || row.taskAssignedTo}</td>
                                  <td style={{ fontSize: 13 }}>{row.taskDueDate || "—"}</td>
                                  <td>{renderInlineAction(row.taskDtlId, asgnSelections, asgnBulkErrors, handleAsgnSelection, true)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </>
                    )}
                  </>
                )}
              </>
            )}

            {/* ════════════════════════════════════
                TAB 3 — TASK COMPLETION APPROVALS
            ════════════════════════════════════ */}
            {activeTab === "completion" && (
              <>
                {compError && <div className="alert alert-danger">{compError}</div>}

                <SummaryCards
                  pending={compPending} approved={compApproved}
                  total={compData.length} selected={compStatus}
                  onSelect={v => { setCompStatus(v); setCompPage(1); }}
                />

                <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                  <div className="d-flex align-items-center gap-2">
                    <small className="text-muted">{filteredComp.length} tasks</small>
                    <div className="d-flex gap-2">
                      <button className={`btn btn-sm ${compViewMode === "individual" ? "btn-primary" : "btn-outline-primary"}`} onClick={() => setCompViewMode("individual")}>
                        <i className="bi bi-list-ul me-1" />Individual
                      </button>
                      <button className={`btn btn-sm ${compViewMode === "grouped" ? "btn-primary" : "btn-outline-primary"}`} onClick={() => setCompViewMode("grouped")}>
                        <i className="bi bi-folder2-open me-1" />Grouped by Project
                      </button>
                      <button className={`btn btn-sm ${compViewMode === "bulk" ? "btn-primary" : "btn-outline-primary"}`} onClick={() => setCompViewMode("bulk")}>
                        <i className="bi bi-check2-all me-1" />Bulk Approve
                      </button>
                    </div>
                  </div>
                  <SearchBar value={compSearch} onChange={v => { setCompSearch(v); setCompPage(1); }} placeholder="Search task, project..." />
                </div>

                {compBulkMsg && <div className={`alert alert-${compBulkType} mb-3`}>{compBulkMsg}</div>}

                {compViewMode === "individual" && (
                  <>
                    <div className="table-responsive">
                      <table className="table table-bordered align-middle">
                        <thead className="table-light">
                          <tr><th>Action</th><th>Project</th><th>Milestone</th><th>Task Name</th><th>Assigned To</th><th>Due Date</th><th>Delayed</th><th>Status</th></tr>
                        </thead>
                        <tbody>
                          {compLoading ? (
                            <tr><td colSpan="8" className="text-center"><div className="spinner-border spinner-border-sm text-primary me-2" />Loading...</td></tr>
                          ) : pagedComp.length === 0 ? (
                            <tr><td colSpan="8" className="text-center text-muted">No {compStatus.toLowerCase()} task completion approvals</td></tr>
                          ) : pagedComp.map((row, i) => (
                            <tr key={i}>
                              <td>
                                <button className="btn btn-sm btn-outline-primary"
                                  onClick={() => navigate(`/task_completion_approval_details/${row.taskDtlId}`, { state: { task: row } })}>
                                  <i className="bi bi-pencil-square" />
                                </button>
                              </td>
                              <td>{row.projectName}</td>
                              <td>{row.milestoneName}</td>
                              <td>{row.taskName}</td>
                              <td>{row.assignedToName || row.taskAssignedTo}</td>
                              <td><span className={row.isDelayed === "Y" ? "text-danger fw-bold" : ""}>{row.taskDueDate || "—"}</span></td>
                              <td>{row.isDelayed === "Y" ? <span className="badge bg-danger">Yes</span> : <span className="badge bg-success">No</span>}</td>
                              <td><StatusBadge approvalStatus={row.approvalStatus} status={row.statusText} /></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <Pagination currentPage={compPage} totalPages={totalCompPages} onPageChange={setCompPage} />
                  </>
                )}

                {compViewMode === "grouped" && (
                  <>
                    {compLoading ? (
                      <div className="text-center py-4"><div className="spinner-border spinner-border-sm text-primary me-2" />Loading...</div>
                    ) : groupedProjects.length === 0 ? (
                      <div className="text-center text-muted py-4">No task completion approvals</div>
                    ) : groupedProjects.map((group, gi) => (
                      <div key={gi} className="card shadow-sm mb-4">
                        <div className="card-header d-flex align-items-center justify-content-between" style={{ background: "#0b2d6b", color: "white" }}>
                          <div className="d-flex align-items-center gap-2">
                            <i className="bi bi-folder2-open" />
                            <span className="fw-bold">{group.projectName}</span>
                            <span className="badge bg-light text-dark">{group.tasks.length} task{group.tasks.length > 1 ? "s" : ""}</span>
                          </div>
                        </div>
                        <div className="table-responsive">
                          <table className="table table-bordered align-middle mb-0">
                            <thead className="table-light">
                              <tr><th>View</th><th>Task</th><th>Assigned To</th><th>Due Date</th><th>Delayed</th><th>Status</th></tr>
                            </thead>
                            <tbody>
                              {group.tasks.map((task, ti) => (
                                <tr key={ti}>
                                  <td>
                                    <button className="btn btn-sm btn-outline-primary"
                                      onClick={() => navigate(`/task_completion_approval_details/${task.taskDtlId}`, { state: { task } })}>
                                      <i className="bi bi-eye" />
                                    </button>
                                  </td>
                                  <td><div className="fw-semibold" style={{ fontSize: 13 }}>{task.taskName}</div><small className="text-muted">{task.milestoneName}</small></td>
                                  <td style={{ fontSize: 13 }}>{task.assignedToName || task.taskAssignedTo}</td>
                                  <td><span className={task.isDelayed === "Y" ? "text-danger fw-bold" : ""} style={{ fontSize: 13 }}>{task.taskDueDate || "—"}</span></td>
                                  <td>{task.isDelayed === "Y" ? <span className="badge bg-danger">Yes</span> : <span className="badge bg-success">No</span>}</td>
                                  <td><StatusBadge approvalStatus={task.approvalStatus} status={task.statusText} /></td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))}
                  </>
                )}

                {compViewMode === "bulk" && (
                  <>
                    {filteredComp.filter(t => t.approvalStatus === 0).length === 0 ? (
                      <div className="alert alert-info"><i className="bi bi-info-circle me-2" />No pending task completion approvals.</div>
                    ) : (
                      <>
                        <div className="d-flex justify-content-between align-items-center mb-3">
                          <small className="text-muted">{filteredComp.filter(t => t.approvalStatus === 0).length} pending tasks</small>
                          <button className="btn btn-success" style={{ width: "auto" }}
                            onClick={() => handleCompBulkSubmit(filteredComp)} disabled={compBulkSaving}>
                            {compBulkSaving ? <><span className="spinner-border spinner-border-sm me-2" />Processing...</> : <><i className="bi bi-check2-all me-1" />Submit All ({filteredComp.filter(t => t.approvalStatus === 0).length})</>}
                          </button>
                        </div>
                        <div className="table-responsive">
                          <table className="table table-bordered align-middle">
                            <thead style={{ background: "#0b2d6b", color: "white" }}>
                              <tr><th>Project</th><th>Task</th><th>Assigned To</th><th>Due Date</th><th style={{ minWidth: 280 }}>Decision & Remarks</th></tr>
                            </thead>
                            <tbody>
                              {filteredComp.filter(t => t.approvalStatus === 0).map((task, i) => (
                                <tr key={i}>
                                  <td><div className="fw-bold" style={{ fontSize: 13 }}>{task.projectName}</div><small className="text-muted">ID: {task.projectId}</small></td>
                                  <td><div className="fw-semibold" style={{ fontSize: 13 }}>{task.taskName}</div><small className="text-muted">{task.milestoneName}</small></td>
                                  <td style={{ fontSize: 13 }}>{task.assignedToName || task.taskAssignedTo}</td>
                                  <td><span className={task.isDelayed === "Y" ? "text-danger fw-bold" : ""} style={{ fontSize: 13 }}>{task.taskDueDate || "—"}{task.isDelayed === "Y" && <span className="badge bg-danger ms-1" style={{ fontSize: 10 }}>Overdue</span>}</span></td>
                                  <td>{renderInlineAction(task.taskDtlId, compSelections, compBulkErrors, handleCompSelection, true)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </>
                    )}
                  </>
                )}
              </>
            )}

          </div>
        </div>
      </div>

      {/* ── Milestone modal */}
      {milestoneModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}
          onClick={() => setMilestoneModal(null)}>
          <div style={{ background: "#fff", borderRadius: 12, padding: 24, width: "90%", maxWidth: 600, maxHeight: "80vh", overflowY: "auto", boxShadow: "0 8px 32px rgba(0,0,0,0.2)" }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div>
                <h6 style={{ margin: 0, fontWeight: 700, color: "#0b2d6b" }}><i className="bi bi-flag-fill text-primary me-2" />Milestones</h6>
                <small style={{ color: "#6c757d" }}>{milestoneModal.projectName}</small>
              </div>
              <button onClick={() => setMilestoneModal(null)} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#6c757d", lineHeight: 1 }}>×</button>
            </div>
            <table className="table table-bordered table-sm mb-0">
              <thead style={{ background: "#0b2d6b", color: "#fff" }}>
                <tr><th>#</th><th>Milestone Name</th><th>Due Date</th></tr>
              </thead>
              <tbody>
                {milestoneModal.milestones.map((m, i) => (
                  <tr key={i}>
                    <td style={{ fontSize: 12 }}>{i + 1}</td>
                    <td style={{ fontSize: 12.5 }}><i className="bi bi-flag-fill text-primary me-1" style={{ fontSize: 10 }} />{m.name}</td>
                    <td style={{ fontSize: 12 }}>{m.dueDate && !String(m.dueDate).startsWith("0001") ? formatDate(m.dueDate) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-3 text-end">
              <button className="btn btn-sm btn-secondary" onClick={() => setMilestoneModal(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectApproval;