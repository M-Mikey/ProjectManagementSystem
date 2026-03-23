import React, { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import Topbar from "../components/Navbar/Topbar";
import Navbar from "../components/Navbar/Navbar";
import { updateTaskAssignmentApproval, getRemarksByTask } from "../api/taskService";

const TaskAssignmentApprovalDetails = () => {
  const { taskDtlId } = useParams();
  const location      = useLocation();
  const navigate      = useNavigate();

  const taskRow = location.state?.task || null;
  const userId  = sessionStorage.getItem("userId");

  const [status, setStatus]       = useState("");
  const [remarks, setRemarks]     = useState("");
  const [errors, setErrors]       = useState({});
  const [saving, setSaving]       = useState(false);
  const [message, setMessage]     = useState(null);
  const [remarksList, setRemarksList]     = useState([]);
  const [loadingRemarks, setLoadingRemarks] = useState(false);

  const isActioned = taskRow?.approvalStatus !== 0;

  useEffect(() => {
    if (taskRow) loadRemarks();
  }, [taskRow]);

  const loadRemarks = async () => {
    if (!taskRow) return;
    setLoadingRemarks(true);
    try {
      const payload = {
        projectId:    taskRow.projectId,
        milestoneId:  taskRow.milestoneId,
        parentTaskId: 0,
        taskDtlId:    taskRow.taskDtlId,
      };
      const result = await getRemarksByTask(payload);
      setRemarksList(Array.isArray(result) ? result : result?.data || []);
    } catch (err) {
      console.error(err);
      setRemarksList([]);
    } finally {
      setLoadingRemarks(false);
    }
  };

  const validate = () => {
    const e = {};
    if (!status)         e.status  = "Decision is required";
    if (!remarks.trim()) e.remarks = "Remarks are required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    if (saving) return;
    setSaving(true);
    setMessage(null);

    try {
      const payload = {
        taskDtlId:  Number(taskDtlId),
        approvedBy: userId,
        status:     Number(status),
        remarks:    remarks,
      };

      const result = await updateTaskAssignmentApproval(payload);

      if (result?.success) {
        setMessage({
          type: "success",
          text: Number(status) === 1
            ? "Task assignment approved. The associate can now start working on the task."
            : "Task assignment sent back for revision."
        });
        setTimeout(() => navigate("/task_assignment_approval"), 2000);
      } else {
        setMessage({ type: "danger", text: result?.message || "Failed to update approval" });
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: "danger", text: "Error updating approval" });
    } finally {
      setSaving(false);
    }
  };

  if (!taskRow) {
    return (
      <div className="app-container">
        <Topbar />
        <div className="main-layout d-flex">
          <Navbar />
          <div className="flex-grow-1 p-4">
            <div className="alert alert-warning">No task data found.</div>
            <button className="btn btn-secondary" onClick={() => navigate(-1)}>Back</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <Topbar />
      <div className="main-layout d-flex" style={{ minHeight: "100vh" }}>
        <Navbar />

        <div className="flex-grow-1" style={{ overflowY: "auto", height: "100vh" }}>
          <div className="container-fluid p-4">

            {/* Header */}
            <div className="d-flex align-items-center justify-content-between mb-4">
              <h4 className="mb-0">Task Assignment Review</h4>
              <button className="btn btn-outline-secondary btn-sm" onClick={() => navigate(-1)}>
                <i className="bi bi-arrow-left me-1"></i> Back
              </button>
            </div>

            {/* Task Details */}
            <div className="card shadow-sm mb-4">
              <div className="card-header fw-semibold">
                <i className="bi bi-list-task me-2"></i>Task Details
              </div>
              <div className="card-body">
                <div className="row g-3">
                  <div className="col-md-6">
                    <p className="mb-1"><strong>Project:</strong> {taskRow.projectName}</p>
                    <p className="mb-1"><strong>Milestone:</strong> {taskRow.milestoneName}</p>
                    <p className="mb-1"><strong>Task:</strong> {taskRow.taskName}</p>
                    <p className="mb-1"><strong>Description:</strong> {taskRow.taskDescrip || "—"}</p>
                  </div>
                  <div className="col-md-6">
                    <p className="mb-1">
                      <strong>Assigned To:</strong> {taskRow.assignedToName || taskRow.taskAssignedTo}
                    </p>
                    <p className="mb-1">
                      <strong>Severity:</strong>{" "}
                      <span className={`badge ${
                        taskRow.taskSeverity === "Critical" ? "bg-danger" :
                        taskRow.taskSeverity === "High"     ? "bg-warning text-dark" :
                        taskRow.taskSeverity === "Medium"   ? "bg-info text-dark" : "bg-secondary"
                      }`}>
                        {taskRow.taskSeverity || "—"}
                      </span>
                    </p>
                    <p className="mb-1"><strong>Due Date:</strong> {taskRow.taskDueDate || "—"}</p>
                    <p className="mb-1"><strong>Task Creator:</strong> {taskRow.taskCreatorName || "—"}</p>
                    <p className="mb-1">
                      <strong>Status:</strong>{" "}
                      <span className={`badge ${
                        taskRow.approvalStatus === 0 ? "bg-warning text-dark" :
                        taskRow.approvalStatus === 1 ? "bg-success" : "bg-secondary"
                      }`}>
                        {taskRow.statusText}
                      </span>
                    </p>
                  </div>
                </div>

                {/* BRD info */}
                <div className="alert alert-info mt-3 mb-0 py-2">
                  <i className="bi bi-info-circle-fill me-2"></i>
                  This task requires your approval as the assigned associate belongs to a
                  different team. Once approved, the associate will be notified to start work.
                </div>
              </div>
            </div>

            {/* Remarks History */}
            <div className="card shadow-sm mb-4">
              <div className="card-header fw-semibold">
                <i className="bi bi-chat-left-text me-2"></i>Remarks History
              </div>
              <div className="card-body">
                {loadingRemarks ? (
                  <div className="text-center">
                    <div className="spinner-border spinner-border-sm text-primary"></div>
                  </div>
                ) : remarksList.length === 0 ? (
                  <div className="text-muted">No remarks yet</div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-bordered table-sm mb-0">
                      <thead className="table-secondary">
                        <tr>
                          <th>#</th>
                          <th>Remark</th>
                          <th>By</th>
                          <th>Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {remarksList.map((r, index) => (
                          <tr key={r.remarkId || index}
                            className={
                              r.remarkText?.startsWith("[Assignment Approved]") ? "table-success" :
                              r.remarkText?.startsWith("[Assignment Sent Back]") ? "table-warning" : ""
                            }
                          >
                            <td>{index + 1}</td>
                            <td>{r.remarkText}</td>
                            <td>{r.createdBy}</td>
                            <td>{r.createdDate}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Approval Action */}
            {!isActioned ? (
              <div className="card shadow-sm mb-4">
                <div className="card-header fw-semibold">
                  <i className="bi bi-check2-circle me-2"></i>Approval Decision
                </div>
                <div className="card-body">

                  {message && (
                    <div className={`alert alert-${message.type} mb-3`}>{message.text}</div>
                  )}

                  {/* Decision */}
                  <div className="mb-3">
                    <label className="form-label fw-semibold">
                      Decision <span className="text-danger">*</span>
                    </label>
                    <div className="d-flex gap-3">
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="radio"
                          name="assignmentStatus"
                          id="approve"
                          value="1"
                          checked={status === "1"}
                          onChange={(e) => {
                            setStatus(e.target.value);
                            setErrors(prev => ({ ...prev, status: "" }));
                          }}
                        />
                        <label className="form-check-label text-success fw-semibold" htmlFor="approve">
                          <i className="bi bi-check-circle-fill me-1"></i> Approve
                        </label>
                      </div>
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="radio"
                          name="assignmentStatus"
                          id="sendback"
                          value="2"
                          checked={status === "2"}
                          onChange={(e) => {
                            setStatus(e.target.value);
                            setErrors(prev => ({ ...prev, status: "" }));
                          }}
                        />
                        <label className="form-check-label text-danger fw-semibold" htmlFor="sendback">
                          <i className="bi bi-arrow-counterclockwise me-1"></i> Send Back
                        </label>
                      </div>
                    </div>
                    {errors.status && (
                      <div className="text-danger small mt-1">{errors.status}</div>
                    )}
                  </div>

                  {/* Remarks */}
                  <div className="mb-3">
                    <label className="form-label fw-semibold">
                      Remarks <span className="text-danger">*</span>
                    </label>
                    <textarea
                      className={`form-control ${errors.remarks ? "is-invalid" : ""}`}
                      rows={3}
                      placeholder={
                        status === "2"
                          ? "Reason for sending back..."
                          : "Approval remarks..."
                      }
                      value={remarks}
                      onChange={(e) => {
                        setRemarks(e.target.value);
                        setErrors(prev => ({ ...prev, remarks: "" }));
                      }}
                    />
                    {errors.remarks && (
                      <div className="invalid-feedback">{errors.remarks}</div>
                    )}
                  </div>

                  {status === "2" && (
                    <div className="alert alert-warning py-2 mb-3">
                      <i className="bi bi-exclamation-triangle-fill me-2"></i>
                      Sending back will reset the task assignment status.
                      The task creator will need to reassign or modify the task.
                    </div>
                  )}

                  <button
                    className={`btn ${status === "2" ? "btn-danger" : "btn-success"}`}
                    onClick={handleSubmit}
                    disabled={saving}
                  >
                    {saving
                      ? <><span className="spinner-border spinner-border-sm me-2"></span>Submitting...</>
                      : status === "2" ? "Send Back" : "Approve"
                    }
                  </button>

                </div>
              </div>
            ) : (
              <div className="alert alert-info">
                <i className="bi bi-info-circle-fill me-2"></i>
                You have already taken action — <strong>{taskRow.statusText}</strong>.
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskAssignmentApprovalDetails;
