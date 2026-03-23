import React, { useEffect, useState, useCallback } from "react";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import Topbar from "../components/Navbar/Topbar";
import Navbar from "../components/Navbar/Navbar";
import {
  getTasksByMilestone,
  getRemarksByTask,
  createRemark,
  updateTaskStatus,
  submitTaskCompletion,
} from "../api/taskService";

const STATUS_OPTIONS = [
  { value: "1", label: "Not Started" },
  { value: "2", label: "In Progress" },
  { value: "3", label: "On Hold" },
  { value: "4", label: "Completed" },
];

const STATUS_LABELS = {
  "0": "Pending",
  "1": "Not Started",
  "2": "In Progress",
  "3": "On Hold",
  "4": "Completed",
  "Pending":     "Pending",
  "Not Started": "Not Started",
  "In Progress": "In Progress",
  "On Hold":     "On Hold",
  "Completed":   "Completed",
};

const STATUS_BADGE = {
  "Pending":     "bg-secondary",
  "Not Started": "bg-secondary",
  "In Progress": "bg-primary",
  "On Hold":     "bg-warning text-dark",
  "Completed":   "bg-success",
};

const TaskDetails = () => {
  const location = useLocation();
  const { projectId, milestoneId } = useParams();
  const { project, milestone, selectedTask } = location.state || {};
  const navigate = useNavigate();
  const userId   = sessionStorage.getItem("userId");

  const [remarks, setRemarks]               = useState("");
  const [remarksList, setRemarksList]       = useState([]);
  const [loadingRemarks, setLoadingRemarks] = useState(false);
  const [saving, setSaving]                 = useState(false);
  const [message, setMessage]               = useState(null);
  const [newStatus, setNewStatus]           = useState("");
  const [statusRemarks, setStatusRemarks]   = useState("");
  const [riskMitigation, setRiskMitigation] = useState("");
  const [statusErrors, setStatusErrors]     = useState({});
  const [statusSaving, setStatusSaving]     = useState(false);
  const [statusMessage, setStatusMessage]   = useState(null);
  const [liveTask, setLiveTask]             = useState(selectedTask);

  // ─────────────────────────────────────────
  // Computed flags
  // ─────────────────────────────────────────
  const isDelayed = liveTask?.taskDueDate
    ? new Date() > new Date(liveTask.taskDueDate)
    : false;

  const isTaskCompleted =
    liveTask?.taskStatus === "Completed" ||
    liveTask?.taskStatus === "4";

  const isAcked = Number(liveTask?.ackStatus) === 1;

  const isAssignedUser = () => {
    if (!liveTask) return false;
    const match      = liveTask.taskAssignedTo?.match(/\(([^)]+)\)$/);
    const assignedId = match ? match[1] : liveTask.taskAssignedTo;
    return String(assignedId) === String(userId);
  };

  const isTaskCreator = () => {
    if (!liveTask) return false;
    return String(liveTask.createdBy) === String(userId);
  };

  const canUpdateStatus = () => {
    if (!liveTask) return false;
    return isAssignedUser() && isAcked;
  };

  const canAddRemark = () => isAssignedUser() || isTaskCreator();

  /* ================= LOAD REMARKS ================= */
  const loadRemarks = useCallback(async () => {
    if (!selectedTask) return;
    try {
      setLoadingRemarks(true);
      const payload = {
        projectId:    selectedTask.projectId,
        milestoneId:  selectedTask.milestoneId,
        parentTaskId: selectedTask.parentTaskId,
        taskDtlId:    selectedTask.taskDtlId,
      };
      const response = await getRemarksByTask(payload);
      if (Array.isArray(response))
        setRemarksList(response);
      else if (Array.isArray(response?.data))
        setRemarksList(response.data);
      else
        setRemarksList([]);
    } catch (err) {
      console.error(err);
      setRemarksList([]);
    } finally {
      setLoadingRemarks(false);
    }
  }, [selectedTask]);

  useEffect(() => {
    loadRemarks();
  }, [loadRemarks]);

  /* ================= SUBMIT REMARK ================= */
  const handleSubmit = async () => {
    if (!remarks.trim()) {
      setMessage({ type: "danger", text: "Please enter remarks" });
      return;
    }
    try {
      setSaving(true);
      const payload = {
        projectId:    selectedTask.projectId,
        milestoneId:  selectedTask.milestoneId,
        parentTaskId: selectedTask.parentTaskId,
        taskDtlId:    selectedTask.taskDtlId,
        taskName:     selectedTask.taskName,
        remarksBy:    userId,
        remarks:      remarks,
      };
      const result = await createRemark(payload);
      if (result?.success) {
        setRemarks("");
        setMessage({ type: "success", text: "Remark added successfully" });
        await loadRemarks();
        setTimeout(() => setMessage(null), 2000);
      } else {
        setMessage({
          type: "danger",
          text: result?.message || "Failed to submit remark"
        });
      }
    } catch (err) {
      setMessage({ type: "danger", text: "Error submitting remark" });
    } finally {
      setSaving(false);
    }
  };

  /* ================= VALIDATE STATUS ================= */
  const validateStatus = () => {
    const e = {};
    if (!newStatus) e.newStatus = "Status is required";
    if (!statusRemarks.trim())
      e.statusRemarks = "Remarks are required for status change";
    if (isDelayed && !riskMitigation.trim())
      e.riskMitigation = "Risk mitigation plan is required for delayed tasks";
    setStatusErrors(e);
    return Object.keys(e).length === 0;
  };

  /* ================= SUBMIT STATUS UPDATE ================= */
  const handleStatusUpdate = async () => {
    if (!validateStatus() || statusSaving) return;
    setStatusSaving(true);
    setStatusMessage(null);

    try {
      const payload = {
        taskDtlId:      liveTask.taskDtlId,
        taskStatus:     parseInt(newStatus),
        remarks:        statusRemarks,
        riskMitigation: riskMitigation || null,
        modifiedBy:     userId,
      };

      const result = await updateTaskStatus(payload);

      if (result?.success) {
        if (result.isCompleted) {
          try {
            await submitTaskCompletion({
              taskDtlId:   liveTask.taskDtlId,
              submittedBy: userId,
            });
          } catch (err) {
            console.error("Artifact verification submit failed:", err);
          }
          setStatusMessage({
            type: "success",
            text: isDelayed
              ? "Task completed. Sent to creator and PL for artifact verification (delayed)."
              : "Task completed. Sent to task creator for artifact verification."
          });
        } else if (result.isDelayed) {
          setStatusMessage({
            type: "warning",
            text: "Status updated. Task is overdue — escalation notifications sent."
          });
        } else {
          setStatusMessage({
            type: "success",
            text: result.message || "Status updated successfully."
          });
        }

        setNewStatus("");
        setStatusRemarks("");
        setRiskMitigation("");
        setStatusErrors({});

        try {
          const updatedTasks = await getTasksByMilestone(projectId, milestoneId);
          const updated = updatedTasks?.find(
            t => t.taskDtlId === selectedTask.taskDtlId
          );
          if (updated) setLiveTask(updated);
        } catch (err) {
          console.error("Failed to refresh task:", err);
        }

        await loadRemarks();

        setTimeout(() => {
          setStatusMessage(null);
          if (result.isCompleted) navigate(-1);
        }, 2500);

      } else {
        setStatusMessage({
          type: "danger",
          text: result?.message || "Failed to update status"
        });
      }
    } catch (err) {
      setStatusMessage({ type: "danger", text: "Error updating status" });
    } finally {
      setStatusSaving(false);
    }
  };

  if (!selectedTask) {
    return <div className="text-center mt-5">No Task Selected</div>;
  }

  const currentStatusLabel =
    STATUS_LABELS[liveTask?.taskStatus] || liveTask?.taskStatus || "—";
  const currentStatusBadge =
    STATUS_BADGE[currentStatusLabel] || "bg-secondary";

  return (
    <div className="app-container">
      <Topbar />
      <div className="main-layout d-flex">
        <Navbar />
        <div className="flex-grow-1"
          style={{ overflowY: "auto", height: "calc(100vh - 60px)" }}>
          <div className="content container-fluid p-4">

            {/* ── HEADER ── */}
            <div className="sticky-top bg-white p-3 border-bottom
              d-flex justify-content-between align-items-center"
              style={{ zIndex: 100 }}>
              <div>
                <h5 className="fw-bold mb-0">{liveTask.taskName}</h5>
                <small className="text-muted">
                  {project?.projectName} → {milestone?.milestoneName}
                </small>
              </div>
              <div className="d-flex align-items-center gap-2">
                <span className={`badge ${currentStatusBadge}`}>
                  {currentStatusLabel}
                </span>
                {isDelayed && (
                  <span className="badge bg-danger">Overdue</span>
                )}
                <button
                  className="btn btn-outline-secondary btn-sm"
                  onClick={() => navigate(-1)}
                >
                  Back
                </button>
              </div>
            </div>

            <div className="container-fluid p-3">
              <div className="row g-3">

                {/* ── LEFT SIDE ── */}
                <div className="col-lg-8">

                  {/* Task Details */}
                  <div className="card shadow-sm mb-3">
                    <div className="card-header"
                      style={{ background: "#f0f4ff" }}>
                      <span className="fw-bold">Task Details</span>
                    </div>
                    <div className="card-body p-3">
                      <div className="row g-2">
                        {[
                          { label: "Task Name",   value: liveTask.taskName },
                          { label: "Project",     value: project?.projectName },
                          { label: "Milestone",   value: milestone?.milestoneName },
                          { label: "Assigned To", value: liveTask.taskAssignedTo },
                          { label: "Due Date",    value: liveTask.taskDueDate },
                          {
                            label: "Severity",
                            value: (
                              <span className={`badge ${
                                liveTask.taskSeverity === "Critical"
                                  ? "bg-danger" :
                                liveTask.taskSeverity === "High"
                                  ? "bg-warning text-dark" :
                                liveTask.taskSeverity === "Medium"
                                  ? "bg-info text-dark" : "bg-secondary"
                              }`}>
                                {liveTask.taskSeverity || "—"}
                              </span>
                            )
                          },
                          {
                            label: "Status",
                            value: (
                              <span className={`badge ${currentStatusBadge}`}>
                                {currentStatusLabel}
                              </span>
                            )
                          },
                          {
                            label: "ACK Status",
                            value: (
                              <span className={`badge ${
                                liveTask.ackStatusText === "Acknowledged"
                                  ? "bg-success" :
                                liveTask.ackStatusText === "Hold"
                                  ? "bg-warning text-dark" : "bg-secondary"
                              }`}>
                                {liveTask.ackStatusText || "Pending"}
                              </span>
                            )
                          },
                          {
                            label: "Description",
                            value: liveTask.taskDescription || "—"
                          },
                        ].map((item, i) => (
                          <div key={i} className="col-md-4">
                            <small className="text-muted">{item.label}</small>
                            <div className="fw-semibold">{item.value || "—"}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Remarks History */}
                  <div className="card shadow-sm mb-3">
                    <div className="card-header"
                      style={{ background: "#f0f4ff" }}>
                      <span className="fw-bold">Remarks History</span>
                    </div>
                    <div className="table-responsive">
                      <table className="table table-bordered align-middle mb-0">
                        <thead style={{ background: "#0b2d6b", color: "#fff" }}>
                          <tr>
                            <th>#</th>
                            <th>Remark</th>
                            <th>By</th>
                            <th>Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {loadingRemarks ? (
                            <tr>
                              <td colSpan="4" className="text-center">
                                <div className="spinner-border
                                  spinner-border-sm text-primary" />
                              </td>
                            </tr>
                          ) : !Array.isArray(remarksList) ||
                              remarksList.length === 0 ? (
                            <tr>
                              <td colSpan="4"
                                className="text-center text-muted">
                                No remarks yet
                              </td>
                            </tr>
                          ) : (
                            remarksList.map((r, index) => (
                              <tr key={r.remarkId || index}>
                                <td>{index + 1}</td>
                                <td>{r.remarkText}</td>
                                <td>{r.createdBy}</td>
                                <td>{r.createdDate}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Add Remark */}
                  {canAddRemark() && !isTaskCompleted && (
                    <div className="card shadow-sm mb-3">
                      <div className="card-header"
                        style={{ background: "#f0f4ff" }}>
                        <span className="fw-bold">Add Remark</span>
                      </div>
                      <div className="card-body">
                        {message && (
                          <div className={`alert alert-${message.type} mb-3`}>
                            {message.text}
                          </div>
                        )}
                        <textarea
                          className="form-control mb-3"
                          rows="3"
                          value={remarks}
                          onChange={(e) => setRemarks(e.target.value)}
                          placeholder="Enter your remark..."
                        />
                        <button
                          className="btn btn-outline-primary"
                          onClick={handleSubmit}
                          disabled={saving}
                        >
                          {saving ? (
                            <>
                              <span className="spinner-border
                                spinner-border-sm me-2" />
                              Saving...
                            </>
                          ) : "Submit Remark"}
                        </button>
                      </div>
                    </div>
                  )}

                </div>

                {/* ── RIGHT SIDE — ACTION CARD ── */}
                <div className="col-lg-4">
                  <div className="card shadow-sm mb-3">
                    <div className="card-header"
                      style={{ background: "#f0f4ff" }}>
                      <span className="fw-bold">Update Task Status</span>
                    </div>
                    <div className="card-body">

                      {/* Not yet ACK'd */}
                      {isAssignedUser() && !isAcked && !isTaskCompleted && (
                        <div className="alert alert-warning mb-0">
                          <i className="bi bi-exclamation-triangle-fill me-2" />
                          Please{" "}
                          <a href="/user_dashboard" className="alert-link">
                            acknowledge this task
                          </a>{" "}
                          first before updating status.
                        </div>
                      )}

                      {/* Completed */}
                      {isTaskCompleted && (
                        <div className="alert alert-secondary mb-0">
                          <i className="bi bi-lock-fill me-2" />
                          Task is <strong>Completed</strong>.
                          No further updates allowed.
                        </div>
                      )}

                      {/* Not assigned */}
                      {!isTaskCompleted && !isAssignedUser() && (
                        <div className="alert alert-info mb-0">
                          <i className="bi bi-info-circle-fill me-2" />
                          Only the assigned associate can update status.
                        </div>
                      )}

                      {/* Status Update Form */}
                      {!isTaskCompleted && canUpdateStatus() && (
                        <>
                          {isDelayed && (
                            <div className="alert alert-danger py-2 mb-3">
                              <i className="bi bi-exclamation-triangle-fill me-2" />
                              Task is <strong>overdue</strong>.
                              Risk mitigation required.
                            </div>
                          )}

                          {statusMessage && (
                            <div className={`alert
                              alert-${statusMessage.type} mb-3`}>
                              {statusMessage.text}
                            </div>
                          )}

                          {/* Status */}
                          <div className="mb-3">
                            <label className="form-label fw-semibold">
                              New Status{" "}
                              <span className="text-danger">*</span>
                            </label>
                            <select
                              className={`form-select ${
                                statusErrors.newStatus ? "is-invalid" : ""}`}
                              value={newStatus}
                              onChange={(e) => {
                                setNewStatus(e.target.value);
                                setStatusErrors(p => ({
                                  ...p, newStatus: ""
                                }));
                              }}
                            >
                              <option value="">-- Select Status --</option>
                              {STATUS_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                            {statusErrors.newStatus && (
                              <div className="invalid-feedback">
                                {statusErrors.newStatus}
                              </div>
                            )}
                          </div>

                          {/* Remarks */}
                          <div className="mb-3">
                            <label className="form-label fw-semibold">
                              Remarks{" "}
                              <span className="text-danger">*</span>
                            </label>
                            <textarea
                              className={`form-control ${
                                statusErrors.statusRemarks
                                  ? "is-invalid" : ""}`}
                              rows={3}
                              placeholder="Reason for status change..."
                              value={statusRemarks}
                              onChange={(e) => {
                                setStatusRemarks(e.target.value);
                                setStatusErrors(p => ({
                                  ...p, statusRemarks: ""
                                }));
                              }}
                            />
                            {statusErrors.statusRemarks && (
                              <div className="invalid-feedback">
                                {statusErrors.statusRemarks}
                              </div>
                            )}
                          </div>

                          {/* Risk Mitigation */}
                          {isDelayed && (
                            <div className="mb-3">
                              <label className="form-label fw-semibold
                                text-danger">
                                Risk Mitigation Plan{" "}
                                <span className="text-danger">*</span>
                              </label>
                              <textarea
                                className={`form-control ${
                                  statusErrors.riskMitigation
                                    ? "is-invalid" : ""}`}
                                rows={2}
                                placeholder="Describe corrective actions..."
                                value={riskMitigation}
                                onChange={(e) => {
                                  setRiskMitigation(e.target.value);
                                  setStatusErrors(p => ({
                                    ...p, riskMitigation: ""
                                  }));
                                }}
                              />
                              {statusErrors.riskMitigation && (
                                <div className="invalid-feedback">
                                  {statusErrors.riskMitigation}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Completion Info */}
                          {newStatus === "4" && (
                            <div className="alert alert-info py-2 mb-3">
                              <i className="bi bi-info-circle-fill me-2" />
                              Marking as <strong>Completed</strong> will
                              send for <strong>artifact verification</strong>.
                              {isDelayed && (
                                <> PL will also be notified.</>
                              )}
                            </div>
                          )}

                          {/* Buttons */}
                          <div className="d-grid gap-2">
                            <button
                              className="btn btn-success"
                              onClick={handleStatusUpdate}
                              disabled={statusSaving}
                            >
                              {statusSaving ? (
                                <>
                                  <span className="spinner-border
                                    spinner-border-sm me-2" />
                                  Updating...
                                </>
                              ) : "Update Status"}
                            </button>
                            <button
                              className="btn btn-outline-secondary"
                              onClick={() => navigate(-1)}
                              disabled={statusSaving}
                            >
                              Cancel
                            </button>
                          </div>
                        </>
                      )}

                    </div>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskDetails;