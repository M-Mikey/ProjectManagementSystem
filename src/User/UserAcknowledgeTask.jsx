import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Topbar from "../components/Navbar/Topbar.jsx";
import Navbar from "../components/Navbar/Navbar.jsx";
import { updateTaskAcknowledge } from "../api/userDashboardApi";
import { getUserDashboard } from "../api/userDashboardApi";

const UserAcknowledgeTask = () => {
  const { projectId, milestoneId, parentTaskId, taskDtlId } = useParams();
  const navigate  = useNavigate();
  const userId    = sessionStorage.getItem("userId");

  const [task, setTask]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [saving, setSaving]   = useState(false);

  // Form state
  const [status, setStatus]   = useState("");
  const [remarks, setRemarks] = useState("");
  const [errors, setErrors]   = useState({});
  const [message, setMessage] = useState({ text: "", type: "" });

  // ─────────────────────────────────────────
  // Load task from User Dashboard data
  // ─────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const result = await getUserDashboard(userId);

        // Find the specific task from tasks list
        const found = result?.tasks?.find(
          t => String(t.task_Dtl_Id) === String(taskDtlId)
        );

        if (found) {
          setTask(found);
        } else {
          setError("Task not found.");
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    if (userId && taskDtlId) load();
  }, [taskDtlId, userId]);

  // ─────────────────────────────────────────
  // Validation
  // ─────────────────────────────────────────
  const validate = () => {
    const e = {};
    if (!status) e.status = "Status is required";
    if (Number(status) === 2 && !remarks.trim())
      e.remarks = "Remarks are required when placing on Hold";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ─────────────────────────────────────────
  // Submit ACK
  // ─────────────────────────────────────────
  const handleSubmit = async () => {
    if (!validate() || saving) return;
    setSaving(true);
    setMessage({ text: "", type: "" });

    try {
      await updateTaskAcknowledge({
        projectId:   Number(projectId),
        milestoneId: Number(milestoneId),
        ptaskId:     Number(parentTaskId) || 0,
        taskId:      Number(taskDtlId),
        ackStatus:   Number(status),
        ackBy:       userId,
        ackRemarks:  remarks,
      });

      setMessage({
        text: Number(status) === 1
          ? "Task acknowledged successfully."
          : "Task placed on Hold.",
        type: "success"
      });

      setTimeout(() => navigate("/user_dashboard"), 1500);

    } catch (err) {
      setMessage({
        text: err?.message || "Something went wrong. Please try again.",
        type: "error"
      });
    } finally {
      setSaving(false);
    }
  };

  // ─────────────────────────────────────────
  // Status Badge
  // ─────────────────────────────────────────
  const StatusBadge = ({ status: s }) => {
    if (s === "Acknowledged")
      return <span className="badge bg-success">Acknowledged</span>;
    if (s === "Hold")
      return <span className="badge bg-warning text-dark">On Hold</span>;
    return <span className="badge bg-danger">Pending</span>;
  };

  const SeverityBadge = ({ severity }) => {
    const s = severity?.toLowerCase();
    if (s === "critical" || s === "1")
      return <span className="badge bg-danger">Critical</span>;
    if (s === "high" || s === "2")
      return <span className="badge bg-warning text-dark">High</span>;
    if (s === "medium" || s === "3")
      return <span className="badge bg-info text-dark">Medium</span>;
    return <span className="badge bg-secondary">Low</span>;
  };

  // ─────────────────────────────────────────
  // Already actioned check
  // ─────────────────────────────────────────
  const isAlreadyActioned =
    task?.ack_Status_Text === "Acknowledged" ||
    task?.ack_Status_Text === "Hold";

  // ─────────────────────────────────────────
  // Loading / Error states
  // ─────────────────────────────────────────
  if (loading) return (
    <div className="d-flex justify-content-center align-items-center"
      style={{ height: "100vh" }}>
      <div className="spinner-border text-primary" />
    </div>
  );

  if (error) return <p className="text-danger m-4">{error}</p>;
  if (!task) return null;

  return (
    <div className="app-container">
      <Topbar />
      <div className="main-layout d-flex">
        <Navbar />
        <div className="flex-grow-1"
          style={{ overflowY: "auto", height: "calc(100vh - 60px)" }}>
          <div className="content container-fluid p-4">

            {/* ── HEADER */}
            <div className="sticky-top bg-white p-3 border-bottom
              d-flex justify-content-between align-items-center"
              style={{ zIndex: 100 }}>
              <div>
                <h5 className="fw-bold mb-0">{task.project_Name}</h5>
                <small className="text-muted">Task Acknowledgement</small>
              </div>
              <div className="d-flex align-items-center gap-2">
                <StatusBadge status={task.ack_Status_Text} />
                <button
                  className="btn btn-outline-secondary btn-sm"
                  onClick={() => navigate("/user_dashboard")}
                >
                  Back
                </button>
              </div>
            </div>

            <div className="container-fluid p-3">
              <div className="row g-3">

                {/* ── LEFT SIDE */}
                <div className="col-lg-8">

                  {/* Project + Milestone Info */}
                  <div className="card shadow-sm mb-3">
                    <div className="card-header"
                      style={{ background: "#f0f4ff" }}>
                      <span className="fw-bold">Project & Milestone Details</span>
                    </div>
                    <div className="card-body p-3">
                      <div className="row g-2">
                        {[
                          { label: "Project Name",   value: task.project_Name },
                          { label: "Milestone",      value: task.milestone_Name },
                          { label: "Assigned By",    value: task.task_Assigned_By },
                        ].map((item, i) => (
                          <div key={i} className="col-md-4">
                            <small className="text-muted">{item.label}</small>
                            <div className="fw-semibold">{item.value || "—"}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Task Details */}
                  <div className="card shadow-sm mb-3">
                    <div className="card-header"
                      style={{ background: "#f0f4ff" }}>
                      <span className="fw-bold">Task Details</span>
                    </div>
                    <div className="card-body p-0">
                      <table className="table table-bordered align-middle mb-0">
                        <thead style={{ background: "#0b2d6b", color: "#fff" }}>
                          <tr>
                            <th>Task Name</th>
                            <th>Description</th>
                            <th>Severity</th>
                            <th>Due Date</th>
                            <th>Status</th>
                            <th>ACK Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="fw-semibold">{task.task_Name}</td>
                            <td>{task.task_Descrip || "—"}</td>
                            <td>
                              <SeverityBadge severity={task.task_Severity} />
                            </td>
                            <td>{task.task_Due_Date || "—"}</td>
                            <td>
                              <span className="badge bg-secondary">
                                {task.task_Status || "Pending"}
                              </span>
                            </td>
                            <td>
                              <StatusBadge status={task.ack_Status_Text} />
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Parent Task Info if exists */}
                  {task.parent_Task_Name &&
                   task.parent_Task_Name !== "N/A" && (
                    <div className="card shadow-sm mb-3">
                      <div className="card-header"
                        style={{ background: "#f0f4ff" }}>
                        <span className="fw-bold">
                          <i className="bi bi-arrow-return-right me-2" />
                          Parent Task
                        </span>
                      </div>
                      <div className="card-body py-2">
                        <p className="mb-0">
                          <strong>Parent Task:</strong>{" "}
                          {task.parent_Task_Name}
                        </p>
                      </div>
                    </div>
                  )}

                </div>

                {/* ── RIGHT SIDE — ACTION CARD */}
                <div className="col-lg-4">
                  <div className="card shadow-sm mb-3">
                    <div className="card-header"
                      style={{ background: "#f0f4ff" }}>
                      <span className="fw-bold">
                        Your Acknowledgement Action
                      </span>
                    </div>
                    <div className="card-body">

                      {/* Already actioned */}
                      {isAlreadyActioned ? (
                        <div className="alert alert-info mb-0">
                          <i className="bi bi-check-circle-fill me-2" />
                          You have already{" "}
                          {task.ack_Status_Text === "Acknowledged"
                            ? "acknowledged"
                            : "placed on hold"}{" "}
                          this task.
                        </div>
                      ) : (
                        <>
                          {/* Label */}
                          <div className="alert alert-light border mb-3 py-2">
                            <i className="bi bi-check2-square me-2 text-primary" />
                            <strong>Acknowledging Task:</strong>{" "}
                            {task.task_Name}
                          </div>

                          {/* Message */}
                          {message.text && (
                            <div className={`alert alert-${
                              message.type === "success"
                                ? "success" : "danger"
                            } mb-3`}>
                              {message.text}
                            </div>
                          )}

                          {/* Status */}
                          <div className="mb-3">
                            <label className="form-label fw-semibold">
                              Status{" "}
                              <span className="text-danger">*</span>
                            </label>
                            <select
                              className={`form-select ${
                                errors.status ? "is-invalid" : ""}`}
                              value={status}
                              onChange={e => {
                                setStatus(e.target.value);
                                setErrors(p => ({ ...p, status: "" }));
                              }}
                            >
                              <option value="">-- Select --</option>
                              <option value="1">Acknowledge</option>
                              <option value="2">Hold</option>
                            </select>
                            {errors.status && (
                              <div className="invalid-feedback">
                                {errors.status}
                              </div>
                            )}
                          </div>

                          {/* Remarks */}
                          <div className="mb-3">
                            <label className="form-label fw-semibold">
                              Remarks{" "}
                              {Number(status) === 2 && (
                                <span className="text-danger">*</span>
                              )}
                            </label>
                            <textarea
                              className={`form-control ${
                                errors.remarks ? "is-invalid" : ""}`}
                              rows={3}
                              placeholder="Enter remarks..."
                              value={remarks}
                              onChange={e => {
                                setRemarks(e.target.value);
                                setErrors(p => ({ ...p, remarks: "" }));
                              }}
                            />
                            {errors.remarks && (
                              <div className="invalid-feedback">
                                {errors.remarks}
                              </div>
                            )}
                          </div>

                          {/* Buttons */}
                          <div className="d-grid gap-2">
                            <button
                              className="btn btn-success"
                              onClick={handleSubmit}
                              disabled={saving}
                            >
                              {saving ? (
                                <>
                                  <span className="spinner-border
                                    spinner-border-sm me-2" />
                                  Submitting...
                                </>
                              ) : "Submit"}
                            </button>
                            <button
                              className="btn btn-outline-secondary"
                              onClick={() => navigate("/user_dashboard")}
                              disabled={saving}
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

export default UserAcknowledgeTask;