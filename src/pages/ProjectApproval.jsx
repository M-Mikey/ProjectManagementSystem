import React, { useEffect, useState } from "react";
import "../styles/ProjectApproval.css";
import Topbar from '../components/Navbar/Topbar';
import Navbar from '../components/Navbar/Navbar';
import { useNavigate, Link } from "react-router-dom";
import { getApproval, updateApprovalDetails } from "../api/userDashboardApi";
import {
  getTaskCompletionApprovals,
  updateTaskCompletionApproval,
} from "../api/taskService";

const PAGE_SIZE = 10;

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;
  return (
    <div className="d-flex align-items-center
            justify-content-between mt-3">
      <small className="text-muted">
        Page {currentPage} of {totalPages}
      </small>
      <nav>
        <ul className="pagination pagination-sm mb-0">
          <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
            <button className="page-link"
              onClick={() => onPageChange(currentPage - 1)}>
              ‹
            </button>
          </li>
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter(p => p === 1 || p === totalPages ||
              Math.abs(p - currentPage) <= 1)
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
                <button className="page-link"
                  onClick={() => onPageChange(p)}>
                  {p}
                </button>
              </li>
            ))}
          <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
            <button className="page-link"
              onClick={() => onPageChange(currentPage + 1)}>
              ›
            </button>
          </li>
        </ul>
      </nav>
    </div>
  );
};

const ProjectApproval = () => {
  const navigate = useNavigate();
  const userId = sessionStorage.getItem("userId");

  const [activeTab, setActiveTab] = useState("project");

  // ── View mode
  const [projViewMode, setProjViewMode] = useState("individual");
  const [compViewMode, setCompViewMode] = useState("individual");

  // ── Project Approval
  const [projData, setProjData] = useState([]);
  const [projPending, setProjPending] = useState(0);
  const [projApproved, setProjApproved] = useState(0);
  const [projStatus, setProjStatus] = useState("Pending");
  const [projLoading, setProjLoading] = useState(false);
  const [projError, setProjError] = useState("");
  const [projSearch, setProjSearch] = useState("");
  const [projPage, setProjPage] = useState(1);
  const [milestoneModal, setMilestoneModal] = useState(null);

  // ── Project bulk state
  const [projSelections, setProjSelections] = useState({});
  const [projBulkSaving, setProjBulkSaving] = useState(false);
  const [projBulkMsg, setProjBulkMsg] = useState("");
  const [projBulkType, setProjBulkType] = useState("");
  const [projBulkErrors, setProjBulkErrors] = useState({});

  // ── Task Completion Approval
  const [compData, setCompData] = useState([]);
  const [compPending, setCompPending] = useState(0);
  const [compApproved, setCompApproved] = useState(0);
  const [compStatus, setCompStatus] = useState("Pending");
  const [compLoading, setCompLoading] = useState(false);
  const [compError, setCompError] = useState("");
  const [compSearch, setCompSearch] = useState("");
  const [compPage, setCompPage] = useState(1);

  // ── Completion bulk state
  const [compSelections, setCompSelections] = useState({});
  const [compBulkSaving, setCompBulkSaving] = useState(false);
  const [compBulkMsg, setCompBulkMsg] = useState("");
  const [compBulkType, setCompBulkType] = useState("");
  const [compBulkErrors, setCompBulkErrors] = useState({});

  useEffect(() => {
    if (!userId) { navigate("/", { replace: true }); return; }
    loadProject();
    loadCompletion();
  }, [userId]);

  useEffect(() => {
    if (userId) { loadProject(); setProjPage(1); }
  }, [projStatus]);

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

  // ── Filtered project data
  const filteredProj = projData.filter(row =>
    !projSearch ||
    row.projectName?.toLowerCase().includes(projSearch.toLowerCase()) ||
    row.projectPLName?.toLowerCase().includes(projSearch.toLowerCase())
  );
  const pendingProj = filteredProj.filter(p => p.status === "Pending");
  const totalProjPages = Math.ceil(filteredProj.length / PAGE_SIZE);
  const pagedProj = filteredProj.slice(
    (projPage - 1) * PAGE_SIZE, projPage * PAGE_SIZE
  );

  // ── Filtered completion data
  const filteredComp = compData.filter(r => {
    const statusMatch =
      compStatus === "All" ? true :
        compStatus === "Pending" ? r.approvalStatus === 0 :
          compStatus === "Approved" ? r.approvalStatus === 1 :
            compStatus === "SentBack" ? r.approvalStatus === 2 : true;
    const searchMatch = !compSearch ||
      r.taskName?.toLowerCase().includes(compSearch.toLowerCase()) ||
      r.projectName?.toLowerCase().includes(compSearch.toLowerCase()) ||
      r.assignedToName?.toLowerCase().includes(compSearch.toLowerCase());
    return statusMatch && searchMatch;
  });

  const groupedByProject = filteredComp.reduce((acc, row) => {
    const key = row.projectId;
    if (!acc[key]) {
      acc[key] = {
        projectId: row.projectId,
        projectName: row.projectName,
        tasks: []
      };
    }
    acc[key].tasks.push(row);
    return acc;
  }, {});
  const groupedProjects = Object.values(groupedByProject);

  const totalCompPages = Math.ceil(filteredComp.length / PAGE_SIZE);
  const pagedComp = filteredComp.slice(
    (compPage - 1) * PAGE_SIZE, compPage * PAGE_SIZE
  );

  const totalPending = projPending + compPending;

  // ── Project selection handlers
  const handleProjSelection = (projectId, field, value) => {
    setProjSelections(prev => ({
      ...prev,
      [projectId]: { ...prev[projectId], [field]: value }
    }));
    setProjBulkErrors(prev => {
      const u = { ...prev }; delete u[projectId]; return u;
    });
  };

  // ── Completion selection handlers
  const handleCompSelection = (taskDtlId, field, value) => {
    setCompSelections(prev => ({
      ...prev,
      [taskDtlId]: { ...prev[taskDtlId], [field]: value }
    }));
    setCompBulkErrors(prev => {
      const u = { ...prev }; delete u[taskDtlId]; return u;
    });
  };

  // ── Validate project bulk
  const validateProjBulk = (projects) => {
    const errors = {};
    projects.forEach(p => {
      const sel = projSelections[p.projectId];
      if (!sel?.action)
        errors[p.projectId] = "Please select Approve or Send Back";
      else if (!sel?.remarks?.trim())
        errors[p.projectId] = "Remarks are required";
    });
    setProjBulkErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ── Validate completion bulk
  const validateCompBulk = (tasks) => {
    const errors = {};
    tasks.forEach(t => {
      const sel = compSelections[t.taskDtlId];
      if (!sel?.action)
        errors[t.taskDtlId] = "Please select Approve or Send Back";
      else if (!sel?.remarks?.trim())
        errors[t.taskDtlId] = "Remarks are required";
    });
    setCompBulkErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ── Submit ALL project approvals at once
  const handleProjBulkSubmit = async (projects) => {
    const pending = projects.filter(p => p.status === "Pending");
    if (pending.length === 0) return;
    if (!validateProjBulk(pending)) return;

    setProjBulkSaving(true);
    setProjBulkMsg("");
    let ok = 0, fail = 0;

    for (const proj of pending) {
      const sel = projSelections[proj.projectId];
      try {
        await updateApprovalDetails({
          projectId: Number(proj.projectId),
          approvedBy: userId,
          approvalStatus: Number(sel.action),
          remarks: sel.remarks,
        });
        ok++;
      } catch (err) {
        fail++;
        console.error(`Project ${proj.projectId} failed:`, err);
      }
    }

    setProjBulkSaving(false);
    if (fail === 0) {
      setProjBulkMsg(`✅ ${ok} project${ok > 1 ? "s" : ""} processed.`);
      setProjBulkType("success");
    } else {
      setProjBulkMsg(`⚠️ ${ok} succeeded, ${fail} failed.`);
      setProjBulkType("warning");
    }
    setTimeout(() => {
      loadProject();
      setProjSelections({});
      setProjBulkMsg("");
    }, 1500);
  };

  // ── Submit ALL completion approvals at once
  const handleCompBulkSubmit = async (tasks) => {
    const pending = tasks.filter(t => t.approvalStatus === 0);
    if (pending.length === 0) return;
    if (!validateCompBulk(pending)) return;

    setCompBulkSaving(true);
    setCompBulkMsg("");
    let ok = 0, fail = 0;

    for (const task of pending) {
      const sel = compSelections[task.taskDtlId];
      try {
        await updateTaskCompletionApproval({
          taskDtlId: Number(task.taskDtlId),
          approvedBy: userId,
          status: Number(sel.action),
          remarks: sel.remarks,
        });
        ok++;
      } catch (err) {
        fail++;
      }
    }

    setCompBulkSaving(false);
    if (fail === 0) {
      setCompBulkMsg(`✅ ${ok} task${ok > 1 ? "s" : ""} processed.`);
      setCompBulkType("success");
    } else {
      setCompBulkMsg(`⚠️ ${ok} succeeded, ${fail} failed.`);
      setCompBulkType("warning");
    }
    setTimeout(() => {
      loadCompletion();
      setCompSelections({});
      setCompBulkMsg("");
    }, 1500);
  };

  const SearchBar = ({ value, onChange, placeholder }) => (
    <div className="input-group" style={{ maxWidth: 350 }}>
      <span className="input-group-text bg-white">
        <i className="bi bi-search text-muted" />
      </span>
      <input type="text"
        className="form-control form-control-sm"
        placeholder={placeholder || "Search..."}
        value={value}
        onChange={e => onChange(e.target.value)} />
      {value && (
        <button className="btn btn-outline-secondary btn-sm"
          onClick={() => onChange("")}>
          <i className="bi bi-x" />
        </button>
      )}
    </div>
  );

  const SummaryCards = ({ pending, approved, total,
    selected, onSelect }) => (
    <div className="row g-3 mb-4">
      {[
        {
          label: "Pending", value: pending,
          color: "danger", status: "Pending"
        },
        {
          label: "Approved", value: approved,
          color: "success", status: "Approved"
        },
        {
          label: "All", value: total,
          color: "primary", status: "All"
        },
      ].map(card => (
        <div className="col-auto" key={card.status}>
          <div
            className={`card px-4 py-3 text-center ${selected === card.status
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

  // ── Render inline action for a row
  const renderInlineAction = (id, selections, errors,
    onChange, isPending) => {
    if (!isPending) return null;
    const sel = selections[id] || {};
    const err = errors[id];
    return (
      <div>
        <div className="d-flex gap-3 mb-1">
          {[
            {
              val: "1", label: "Approve",
              cls: "text-success", icon: "bi-check-circle-fill"
            },
            {
              val: "3", label: "Send Back",
              cls: "text-danger",
              icon: "bi-arrow-counterclockwise"
            },
          ].map(opt => (
            <div className="form-check mb-0" key={opt.val}>
              <input
                className="form-check-input"
                type="radio"
                name={`action-${id}`}
                id={`${opt.val}-${id}`}
                value={opt.val}
                checked={sel.action === opt.val}
                onChange={() =>
                  onChange(id, "action", opt.val)
                }
              />
              <label
                className={`form-check-label fw-semibold
                                    ${opt.cls}`}
                htmlFor={`${opt.val}-${id}`}
                style={{ fontSize: 12 }}>
                <i className={`bi ${opt.icon} me-1`} />
                {opt.label}
              </label>
            </div>
          ))}
        </div>
        <textarea
          className={`form-control form-control-sm ${err && !sel.remarks ? "is-invalid" : ""
            }`}
          rows={2}
          placeholder="Remarks (required)..."
          value={sel.remarks || ""}
          onChange={e => onChange(id, "remarks", e.target.value)}
          style={{ fontSize: 12 }}
        />
        {err && (
          <small className="text-danger">
            <i className="bi bi-exclamation-circle me-1" />
            {err}
          </small>
        )}
      </div>
    );
  };

  return (
    <div className="app-container">
      <Topbar />
      <div className="main-layout d-flex">
        <Navbar />
        <div className="flex-grow-1">
          <div className="content container-fluid p-4">

            {/* ── PAGE TITLE */}
            <div className="d-flex align-items-center mb-3">
              <h5 className="mb-0">
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

            {/* ── TABS */}
            <ul className="nav nav-tabs mb-4 justify-content-end">
              <li className="nav-item">
                <button
                  className={`nav-link ${activeTab === "project"
                      ? "active" : ""}`}
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
              <li className="nav-item">
                <button
                  className={`nav-link ${activeTab === "completion"
                      ? "active" : ""}`}
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

            {/* ════════════════════════════════════
                            TAB 1: PROJECT APPROVALS
                        ════════════════════════════════════ */}
            {activeTab === "project" && (
              <>
                {projError && (
                  <div className="alert alert-danger">
                    {projError}
                  </div>
                )}

                {/* Summary cards */}
                <div className="row g-3 mb-4">
                  <div className="col-md-3 col-6">
                    <div
                      className={`card summary-card ${projStatus === "Pending"
                          ? "border border-3 border-dark"
                          : ""}
                                                bg-danger bg-opacity-50`}
                      style={{ cursor: "pointer" }}
                      onClick={() =>
                        setProjStatus("Pending")}
                    >
                      <div className="card-body text-center">
                        <h2 className="text-danger">
                          {projPending}
                        </h2>
                        <p className="mb-0 text-danger">
                          Approval Pending
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-3 col-6">
                    <div
                      className={`card summary-card ${projStatus === "Completed"
                          ? "border border-3 border-dark"
                          : ""}
                                                bg-success bg-opacity-50`}
                      style={{ cursor: "pointer" }}
                      onClick={() =>
                        setProjStatus("Completed")}
                    >
                      <div className="card-body text-center">
                        <h2 className="text-success">
                          {projApproved}
                        </h2>
                        <p className="mb-0 text-success">
                          Approval Completed
                        </p>
                      </div>
                    </div>
                  </div>
                </div>


                <div className="d-flex justify-content-between
                                    align-items-center mb-3 flex-wrap gap-2">
                  <div className="d-flex
                                        align-items-center gap-2">
                    <small className="text-muted">
                      {filteredProj.length} projects
                    </small>
                    <div className=" d-flex item-align-right " style={{ marginRight: "10px" }}>
                      <button
                        className={`btn ${projViewMode === "individual"
                            ? "btn-primary"
                            : "btn-outline-primary"
                          }`} style={{ marginRight: "10px" }}
                        onClick={() =>
                          setProjViewMode("individual")
                        }>
                        <i className="bi bi-list-ul me-1" />

                        Individual
                      </button>
                      <button
                        className={`btn ${projViewMode === "bulk"
                            ? "btn-primary"
                            : "btn-outline-primary"
                          }`}
                        onClick={() =>
                          setProjViewMode("bulk")
                        }>
                        <i className="bi bi-check2-all me-1" />
                        Bulk Approve
                      </button>
                    </div>
                  </div>
                  <SearchBar
                    value={projSearch}
                    onChange={v => {
                      setProjSearch(v);
                      setProjPage(1);
                    }}
                    placeholder="Search project or PL..."
                  />
                </div>

                {/* Bulk message */}
                {projBulkMsg && (
                  <div className={`alert
                                        alert-${projBulkType} mb-3`}>
                    {projBulkMsg}
                  </div>
                )}

                {/* ── INDIVIDUAL VIEW ── */}
                {projViewMode === "individual" && (
                  <>
                    <div className="table-responsive">
                      <table className="table
                                                table-bordered align-middle">
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
                              <td colSpan="5"
                                className="text-center">
                                <div className="spinner-border
                                                                    spinner-border-sm
                                                                    text-primary me-2" />
                                Loading...
                              </td>
                            </tr>
                          ) : pagedProj.length === 0 ? (
                            <tr>
                              <td colSpan="5"
                                className="text-center
                                                                text-muted">
                                No data found
                              </td>
                            </tr>
                          ) : (
                            pagedProj.map((val, i) => (
                              <tr key={i}>
                                <td>
                                  <Link
                                    to={`/project_approval_details/${val.projectId}/${val.milestoneId}`}
                                    state={val}
                                    className="btn btn-sm
                                                                            btn-outline-primary"
                                  >
                                    <i className="bi bi-pencil-square" />
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
                                      className="btn btn-sm
                                                                                btn-outline-info"
                                      onClick={() =>
                                        setMilestoneModal(val)}
                                      style={{ fontSize: 12 }}>
                                      <i className="bi bi-flag-fill me-1" />
                                      {val.milestones.length} Milestone
                                      {val.milestones.length > 1
                                        ? "s" : ""}
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
                                  <span className={`badge ${val.status === "Pending"
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


                {projViewMode === "bulk" && (
                  <>
                    {pendingProj.length === 0 ? (
                      <div className="alert alert-info">
                        <i className="bi bi-info-circle me-2" />
                        No pending project approvals.
                      </div>
                    ) : (
                      <>
                        {/* Submit All */}
                        <div className="d-flex
                                                    justify-content-between
                                                    align-items-center mb-3">
                          <small className="text-muted">
                            {pendingProj.length} pending
                            project{pendingProj.length > 1
                              ? "s" : ""}
                          </small>
                          <button
                            className="btn btn-success"
                            style={{ width: "auto" }}
                            onClick={() =>
                              handleProjBulkSubmit(
                                pendingProj
                              )
                            }
                            disabled={projBulkSaving}
                          >
                            {projBulkSaving ? (
                              <>
                                <span className="spinner-border
                                                                    spinner-border-sm me-2" />
                                Processing...
                              </>
                            ) : (
                              <>
                                <i className="bi bi-check2-all me-1" />
                                Submit All
                                ({pendingProj.length})
                              </>
                            )}
                          </button>
                        </div>

                        {/* Bulk table */}
                        <div className="table-responsive">
                          <table className="table
                                                        table-bordered align-middle">
                            <thead style={{
                              background: "#0b2d6b",
                              color: "white"
                            }}>
                              <tr>
                                <th>Project</th>
                                <th>PL</th>
                                <th>Milestones</th>
                                <th style={{ minWidth: 260 }}>
                                  Decision & Remarks
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {pendingProj.map((val, i) => (
                                <tr key={i}>
                                  <td>
                                    <div className="fw-bold">
                                      {val.projectName}
                                    </div>
                                    <small className="text-muted">
                                      ID: {val.projectId}
                                    </small>
                                  </td>
                                  <td style={{ fontSize: 13 }}>
                                    {val.projectPLName
                                      ? `${val.projectPLName} - ${val.projectPL}`
                                      : val.projectPL}
                                  </td>
                                  <td>
                                    {val.milestones?.length > 0 ? (
                                      <button
                                        className="btn btn-sm
                                                                                    btn-outline-info"
                                        onClick={() =>
                                          setMilestoneModal(val)}
                                        style={{ fontSize: 12 }}>
                                        <i className="bi bi-flag-fill me-1" />
                                        {val.milestones.length}
                                      </button>
                                    ) : "—"}
                                  </td>
                                  <td>
                                    {renderInlineAction(
                                      val.projectId,
                                      projSelections,
                                      projBulkErrors,
                                      handleProjSelection,
                                      true
                                    )}
                                  </td>
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
                            TAB 2: TASK COMPLETION APPROVALS
                        ════════════════════════════════════ */}
            {activeTab === "completion" && (
              <>
                {compError && (
                  <div className="alert alert-danger">
                    {compError}
                  </div>
                )}

                <SummaryCards
                  pending={compPending}
                  approved={compApproved}
                  total={compData.length}
                  selected={compStatus}
                  onSelect={v => {
                    setCompStatus(v);
                    setCompPage(1);
                  }}
                />

                {/* View toggle + Search */}
                <div className="d-flex justify-content-between
                                    align-items-center mb-3 flex-wrap gap-2">
                  <div className="d-flex
                                        align-items-center gap-2">
                    <small className="text-muted">
                      {filteredComp.length} tasks
                    </small>
                    {/* For Task Completion view toggle */}
                    <div className="d-flex gap-2">
                      <button
                        className={`btn btn-sm ${compViewMode === "individual"
                            ? "btn-primary"
                            : "btn-outline-primary"
                          }`}
                        onClick={() => setCompViewMode("individual")}>
                        <i className="bi bi-list-ul me-1" />
                        Individual
                      </button>
                      <button
                        className={`btn btn-sm ${compViewMode === "grouped"
                            ? "btn-primary"
                            : "btn-outline-primary"
                          }`}
                        onClick={() => setCompViewMode("grouped")}>
                        <i className="bi bi-folder2-open me-1" />
                        Grouped by Project
                      </button>
                      <button
                        className={`btn btn-sm ${compViewMode === "bulk"
                            ? "btn-primary"
                            : "btn-outline-primary"
                          }`}
                        onClick={() => setCompViewMode("bulk")}>
                        <i className="bi bi-check2-all me-1" />
                        Bulk Approve
                      </button>
                    </div>

                    {/* For Project Approvals view toggle */}
                    {/* <div className="d-flex gap-2">
                      <button
                        className={`btn btn-sm ${projViewMode === "individual"
                            ? "btn-primary"
                            : "btn-outline-primary"
                          }`}
                        onClick={() => setProjViewMode("individual")}>
                        <i className="bi bi-list-ul me-1" />
                        Individual
                      </button>
                      <button
                        className={`btn btn-sm ${projViewMode === "bulk"
                            ? "btn-primary"
                            : "btn-outline-primary"
                          }`}
                        onClick={() => setProjViewMode("bulk")}>
                        <i className="bi bi-check2-all me-1" />
                        Bulk Approve
                      </button>
                    </div> */}
                  </div>
                  <SearchBar
                    value={compSearch}
                    onChange={v => {
                      setCompSearch(v);
                      setCompPage(1);
                    }}
                    placeholder="Search task, project..."
                  />
                </div>

                {/* Bulk message */}
                {compBulkMsg && (
                  <div className={`alert
                                        alert-${compBulkType} mb-3`}>
                    {compBulkMsg}
                  </div>
                )}

                {/* ── INDIVIDUAL VIEW ── */}
                {compViewMode === "individual" && (
                  <>
                    <div className="table-responsive">
                      <table className="table
                                                table-bordered align-middle">
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
                              <td colSpan="8"
                                className="text-center">
                                <div className="spinner-border
                                                                    spinner-border-sm
                                                                    text-primary me-2" />
                                Loading...
                              </td>
                            </tr>
                          ) : pagedComp.length === 0 ? (
                            <tr>
                              <td colSpan="8"
                                className="text-center
                                                                text-muted">
                                No {compStatus.toLowerCase()}
                                {" "}task completion approvals
                              </td>
                            </tr>
                          ) : (
                            pagedComp.map((row, i) => (
                              <tr key={i}>
                                <td>
                                  <button
                                    className="btn btn-sm
                                                                            btn-outline-primary"
                                    onClick={() => navigate(
                                      `/task_completion_approval_details/${row.taskDtlId}`,
                                      { state: { task: row } }
                                    )}>
                                    <i className="bi bi-pencil-square" />
                                  </button>
                                </td>
                                <td>{row.projectName}</td>
                                <td>{row.milestoneName}</td>
                                <td>{row.taskName}</td>
                                <td>{row.assignedToName
                                  || row.taskAssignedTo}</td>
                                <td>
                                  <span className={
                                    row.isDelayed === "Y"
                                      ? "text-danger fw-bold"
                                      : ""
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
                                  <span className={`badge ${row.approvalStatus === 0
                                      ? "bg-warning text-dark" :
                                      row.approvalStatus === 1
                                        ? "bg-success"
                                        : "bg-secondary"
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


                {compViewMode === "grouped" && (
                  <>
                    {compLoading ? (
                      <div className="text-center py-4">
                        <div className="spinner-border
                                                    spinner-border-sm
                                                    text-primary me-2" />
                        Loading...
                      </div>
                    ) : groupedProjects.length === 0 ? (
                      <div className="text-center
                                                text-muted py-4">
                        No task completion approvals
                      </div>
                    ) : (
                      groupedProjects.map((group, gi) => (
                        <div key={gi}
                          className="card shadow-sm mb-4">
                          <div className="card-header
                                                        d-flex align-items-center
                                                        justify-content-between"
                            style={{
                              background: "#0b2d6b",
                              color: "white"
                            }}>
                            <div className="d-flex
                                                            align-items-center gap-2">
                              <i className="bi bi-folder2-open" />
                              <span className="fw-bold">
                                {group.projectName}
                              </span>
                              <span className="badge
                                                                bg-light text-dark">
                                {group.tasks.length} task
                                {group.tasks.length > 1
                                  ? "s" : ""}
                              </span>
                            </div>
                          </div>
                          <div className="table-responsive">
                            <table className="table
                                                            table-bordered
                                                            align-middle mb-0">
                              <thead className="table-light">
                                <tr>
                                  <th>View</th>
                                  <th>Task</th>
                                  <th>Assigned To</th>
                                  <th>Due Date</th>
                                  <th>Delayed</th>
                                  <th>Status</th>
                                </tr>
                              </thead>
                              <tbody>
                                {group.tasks.map((task, ti) => (
                                  <tr key={ti}>
                                    <td>
                                      <button
                                        className="btn btn-sm
                                                                                    btn-outline-primary"
                                        onClick={() => navigate(
                                          `/task_completion_approval_details/${task.taskDtlId}`,
                                          { state: { task } }
                                        )}>
                                        <i className="bi bi-eye" />
                                      </button>
                                    </td>
                                    <td>
                                      <div className="fw-semibold"
                                        style={{ fontSize: 13 }}>
                                        {task.taskName}
                                      </div>
                                      <small className="text-muted">
                                        {task.milestoneName}
                                      </small>
                                    </td>
                                    <td style={{ fontSize: 13 }}>
                                      {task.assignedToName
                                        || task.taskAssignedTo}
                                    </td>
                                    <td>
                                      <span className={
                                        task.isDelayed === "Y"
                                          ? "text-danger fw-bold"
                                          : ""
                                      } style={{ fontSize: 13 }}>
                                        {task.taskDueDate || "—"}
                                      </span>
                                    </td>
                                    <td>
                                      {task.isDelayed === "Y"
                                        ? <span className="badge bg-danger">Yes</span>
                                        : <span className="badge bg-success">No</span>
                                      }
                                    </td>
                                    <td>
                                      <span className={`badge ${task.approvalStatus === 0
                                          ? "bg-warning text-dark" :
                                          task.approvalStatus === 1
                                            ? "bg-success"
                                            : "bg-secondary"
                                        }`}>
                                        {task.statusText}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ))
                    )}
                  </>
                )}


                {compViewMode === "bulk" && (
                  <>
                    {filteredComp.filter(
                      t => t.approvalStatus === 0
                    ).length === 0 ? (
                      <div className="alert alert-info">
                        <i className="bi bi-info-circle me-2" />
                        No pending task completion approvals.
                      </div>
                    ) : (
                      <>

                        <div className="d-flex
                                                    justify-content-between
                                                    align-items-center mb-3">
                          <small className="text-muted">
                            {filteredComp.filter(
                              t => t.approvalStatus === 0
                            ).length} pending tasks
                          </small>
                          <button
                            className="btn btn-success"
                            style={{ width: "auto" }}
                            onClick={() =>
                              handleCompBulkSubmit(
                                filteredComp
                              )
                            }
                            disabled={compBulkSaving}
                          >
                            {compBulkSaving ? (
                              <>
                                <span className="spinner-border
                                                                    spinner-border-sm me-2" />
                                Processing...
                              </>
                            ) : (
                              <>
                                <i className="bi bi-check2-all me-1" />
                                Submit All (
                                {filteredComp.filter(
                                  t => t.approvalStatus === 0
                                ).length})
                              </>
                            )}
                          </button>
                        </div>

                        {/* Bulk table — ALL pending
                                                    across ALL projects */}
                        <div className="table-responsive">
                          <table className="table
                                                        table-bordered align-middle">
                            <thead style={{
                              background: "#0b2d6b",
                              color: "white"
                            }}>
                              <tr>
                                <th>Project</th>
                                <th>Task</th>
                                <th>Assigned To</th>
                                <th>Due Date</th>
                                <th style={{ minWidth: 280 }}>
                                  Decision & Remarks
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {filteredComp
                                .filter(t =>
                                  t.approvalStatus === 0
                                )
                                .map((task, i) => (
                                  <tr key={i}>
                                    <td>
                                      <div className="fw-bold"
                                        style={{ fontSize: 13 }}>
                                        {task.projectName}
                                      </div>
                                      <small className="text-muted">
                                        ID: {task.projectId}
                                      </small>
                                    </td>
                                    <td>
                                      <div className="fw-semibold"
                                        style={{ fontSize: 13 }}>
                                        {task.taskName}
                                      </div>
                                      <small className="text-muted">
                                        {task.milestoneName}
                                      </small>
                                    </td>
                                    <td style={{ fontSize: 13 }}>
                                      {task.assignedToName
                                        || task.taskAssignedTo}
                                    </td>
                                    <td>
                                      <span className={
                                        task.isDelayed === "Y"
                                          ? "text-danger fw-bold"
                                          : ""
                                      } style={{ fontSize: 13 }}>
                                        {task.taskDueDate || "—"}
                                      </span>
                                      {task.isDelayed === "Y" && (
                                        <span className="badge
                                                                                    bg-danger ms-1"
                                          style={{ fontSize: 10 }}>
                                          Overdue
                                        </span>
                                      )}
                                    </td>
                                    <td>
                                      {renderInlineAction(
                                        task.taskDtlId,
                                        compSelections,
                                        compBulkErrors,
                                        handleCompSelection,
                                        true
                                      )}
                                    </td>
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

      {/* ── MILESTONE MODAL */}
      {milestoneModal && (
        <div style={{
          position: "fixed", top: 0, left: 0,
          right: 0, bottom: 0,
          background: "rgba(0,0,0,0.5)", zIndex: 9999,
          display: "flex", alignItems: "center",
          justifyContent: "center"
        }}
          onClick={() => setMilestoneModal(null)}
        >
          <div style={{
            background: "#fff", borderRadius: 12,
            padding: 24, width: "90%", maxWidth: 600,
            maxHeight: "80vh", overflowY: "auto",
            boxShadow: "0 8px 32px rgba(0,0,0,0.2)"
          }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center", marginBottom: 16
            }}>
              <div>
                <h6 style={{
                  margin: 0, fontWeight: 700,
                  color: "#0b2d6b"
                }}>
                  <i className="bi bi-flag-fill
                                        text-primary me-2" />
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
              <thead style={{
                background: "#0b2d6b", color: "#fff"
              }}>
                <tr>
                  <th>#</th>
                  <th>Milestone Name</th>
                  <th>Due Date</th>
                </tr>
              </thead>
              <tbody>
                {milestoneModal.milestones.map((m, i) => (
                  <tr key={i}>
                    <td style={{ fontSize: 12 }}>
                      {i + 1}
                    </td>
                    <td style={{ fontSize: 12.5 }}>
                      <i className="bi bi-flag-fill
                                                text-primary me-1"
                        style={{ fontSize: 10 }} />
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
              <button className="btn btn-sm btn-secondary"
                onClick={() => setMilestoneModal(null)}>
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