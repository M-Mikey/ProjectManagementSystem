import React, { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import Topbar from "../components/Navbar/Topbar";
import Navbar from "../components/Navbar/Navbar";
import {
  updateTaskCompletionApproval,
  getRemarksByTask, autoCloseMilestone, autoCloseProject
} from "../api/taskService";



const TaskCompletionApprovalDetails = () => {
  const { taskDtlId } = useParams();
  const location      = useLocation();
  const navigate      = useNavigate();

  const taskRow = location.state?.task || null;
  const userId  = sessionStorage.getItem("userId");

  const [status, setStatus]               = useState("");
  const [remarks, setRemarks]             = useState("");
  const [errors, setErrors]               = useState({});
  const [saving, setSaving]               = useState(false);
  const [message, setMessage]             = useState(null);
  const [remarksList, setRemarksList]     = useState([]);
  const [loadingRemarks, setLoadingRemarks] = useState(false);




// ✅ Fix — correctly checks if already acted
const isActioned = taskRow?.approvalStatus === 1 || // Approved
                   taskRow?.approvalStatus === 2;   // Sent Back

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
      setRemarksList(
        Array.isArray(result) ? result : result?.data || []
      );
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
  if (!validate() || saving) return;
  setSaving(true);
  setMessage(null);

  try {
    const payload = {
      taskDtlId:  Number(taskDtlId),
      approvedBy: userId,
      status:     Number(status),
      remarks:    remarks,
    };

    const result = await updateTaskCompletionApproval(payload);

    if (result?.success) {

      // ✅ If approved — try auto close milestone then project
      if (Number(status) === 1) {
        try {
          const milestoneClose = await autoCloseMilestone({
            milestoneId: taskRow.milestoneId,
            projectId:   taskRow.projectId,
          });

          console.log("Milestone close result:", milestoneClose);

          // If milestone closed — try auto close project
          if (milestoneClose?.success) {
            try {
              const projectClose = await autoCloseProject({
                projectId: taskRow.projectId,
              });
              console.log("Project close result:", projectClose);
            } catch (err) {
              console.error("Auto close project failed:", err);
            }
          }
        } catch (err) {
          console.error("Auto close milestone failed:", err);
        }
      }

      setMessage({
        type: "success",
        text: Number(status) === 1
          ? "Task completion approved successfully."
          : "Task sent back for revision. Associate will be notified."
      });

      setTimeout(() => navigate("/project_approval"), 2000);

    } else {
      setMessage({
        type: "danger",
        text: result?.message || "Failed to update approval"
      });
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
            <div className="alert alert-warning">
              No task data found. Please go back and try again.
            </div>
            <button
              className="btn btn-secondary"
              onClick={() => navigate(-1)}
            >
              Back
            </button>
          </div>
        </div>
      </div>
    );
  }

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
                <h5 className="fw-bold mb-0">
                  Task Artifact Verification
                </h5>
                <small className="text-muted">
                  {taskRow.projectName} → {taskRow.milestoneName}
                </small>
              </div>
              <div className="d-flex align-items-center gap-2">
                {/* Header status badge */}
<span className={`badge ${
  taskRow.approvalStatus === 0
    ? "bg-warning text-dark" :
  taskRow.approvalStatus === 1
    ? "bg-success" :
  taskRow.approvalStatus === 2
    ? "bg-danger" : "bg-secondary"
}`}>
  {taskRow.approvalStatus === 0 ? "Pending" :
   taskRow.approvalStatus === 1 ? "Approved" :
   taskRow.approvalStatus === 2 ? "Sent Back" :
   taskRow.statusText}
</span>
                {taskRow.isDelayed === "Y" && (
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

                {/* ── LEFT SIDE */}
                <div className="col-lg-7">

                  {/* Task Details */}
                  <div className="card shadow-sm mb-3">
                    <div className="card-header"
                      style={{ background: "#f0f4ff" }}>
                      <span className="fw-bold">Task Details</span>
                    </div>
                    <div className="card-body p-3">
                      <div className="row g-2">
                        {[
                          { label: "Project",      value: taskRow.projectName },
                          { label: "Milestone",    value: taskRow.milestoneName },
                          { label: "Task Name",    value: taskRow.taskName },
                          { label: "Description",  value: taskRow.taskDescrip || "—" },
                          { label: "Assigned To",  value: taskRow.assignedToName || taskRow.taskAssignedTo },
                          { label: "Task Creator", value: taskRow.taskCreatorName || "—" },
                          {
                            label: "Due Date",
                            value: (
                              <span className={
                                taskRow.isDelayed === "Y"
                                  ? "text-danger fw-bold" : ""
                              }>
                                {taskRow.taskDueDate || "—"}
                                {taskRow.isDelayed === "Y" && (
                                  <span className="ms-2 badge bg-danger">
                                    Overdue
                                  </span>
                                )}
                              </span>
                            )
                          },
                          {
                            label: "Completion Date",
                            value: taskRow.completionDate || "—"
                          },
                          {
                            label: "Status",
                            value: (
                              <span className={`badge ${
                                taskRow.approvalStatus === 0
                                  ? "bg-warning text-dark" :
                                taskRow.approvalStatus === 1
                                  ? "bg-success" : "bg-secondary"
                              }`}>
                                {taskRow.statusText}
                              </span>
                            )
                          },
                        ].map((item, i) => (
                          <div key={i} className="col-md-4">
                            <small className="text-muted">{item.label}</small>
                            <div className="fw-semibold">
                              {item.value || "—"}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Delayed warning */}
                      {taskRow.isDelayed === "Y" && (
                        <div className="alert alert-danger mt-3 mb-0 py-2">
                          <i className="bi bi-exclamation-triangle-fill me-2" />
                          This task was completed{" "}
                          <strong>after its due date</strong>.
                          Please review risk mitigation remarks below.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Remarks History */}
                  <div className="card shadow-sm mb-3">
                    <div className="card-header"
                      style={{ background: "#f0f4ff" }}>
                      <span className="fw-bold">
                        Remarks & Activity History
                      </span>
                    </div>
                    <div className="table-responsive">
                      <table className="table table-bordered
                        align-middle mb-0">
                        <thead style={{
                          background: "#0b2d6b", color: "#fff"
                        }}>
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
                          ) : remarksList.length === 0 ? (
                            <tr>
                              <td colSpan="4"
                                className="text-center text-muted">
                                No remarks yet
                              </td>
                            </tr>
                          ) : (
                            remarksList.map((r, index) => (
                              <tr
                                key={r.remarkId || index}
                                className={
                                  r.remarkText?.startsWith(
                                    "[Risk Mitigation]")
                                    ? "table-danger"  :
                                  r.remarkText?.startsWith("[Status →")
                                    ? "table-info"    :
                                  r.remarkText?.startsWith(
                                    "[Completion Approved]")
                                    ? "table-success" :
                                  r.remarkText?.startsWith("[Sent Back]")
                                    ? "table-warning" : ""
                                }
                              >
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

                </div>

                {/* ── RIGHT SIDE — ACTION CARD */}
                <div className="col-lg-4">
                  <div className="card shadow-sm mb-3">
                    <div className="card-header"
                      style={{ background: "#f0f4ff" }}>
                      <span className="fw-bold">
                        Your Verification Action
                      </span>
                    </div>
                    <div className="card-body">

                      {/* Already actioned */}
                     {isActioned ? (
  <div className={`alert mb-0 ${
    taskRow.approvalStatus === 1
      ? "alert-success"
      : "alert-warning"
  }`}>
    <i className={`bi ${
      taskRow.approvalStatus === 1
        ? "bi-check-circle-fill"
        : "bi-arrow-counterclockwise"
    } me-2`} />
    {taskRow.approvalStatus === 1
      ? <>
          <strong>Task Verified!</strong> You have already
          approved this task. No further action needed.
        </>
      : <>
          <strong>Sent Back.</strong> Task has been sent
          back for revision. Waiting for associate to resubmit.
        </>
    }
  </div>
): (
                        <>
                          {message && (
                            <div className={`alert
                              alert-${message.type} mb-3`}>
                              {message.text}
                            </div>
                          )}

                          {/* Decision */}
                          <div className="mb-3">
                            <label className="form-label fw-semibold">
                              Decision{" "}
                              <span className="text-danger">*</span>
                            </label>
                            <div className="d-flex gap-3">
                              <div className="form-check">
                                <input
                                  className="form-check-input"
                                  type="radio"
                                  name="approvalStatus"
                                  id="approve"
                                  value="1"
                                  checked={status === "1"}
                                  onChange={(e) => {
                                    setStatus(e.target.value);
                                    setErrors(p => ({
                                      ...p, status: ""
                                    }));
                                  }}
                                />
                                <label
                                  className="form-check-label
                                    text-success fw-semibold"
                                  htmlFor="approve"
                                >
                                  <i className="bi bi-check-circle-fill me-1" />
                                  Approve
                                </label>
                              </div>
                              <div className="form-check">
                                <input
                                  className="form-check-input"
                                  type="radio"
                                  name="approvalStatus"
                                  id="sendback"
                                  value="2"
                                  checked={status === "2"}
                                  onChange={(e) => {
                                    setStatus(e.target.value);
                                    setErrors(p => ({
                                      ...p, status: ""
                                    }));
                                  }}
                                />
                                <label
                                  className="form-check-label
                                    text-danger fw-semibold"
                                  htmlFor="sendback"
                                >
                                  <i className="bi bi-arrow-counterclockwise me-1" />
                                  Send Back
                                </label>
                              </div>
                            </div>
                            {errors.status && (
                              <div className="text-danger small mt-1">
                                {errors.status}
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
                                errors.remarks ? "is-invalid" : ""}`}
                              rows={3}
                              placeholder={
                                status === "2"
                                  ? "Reason for sending back..."
                                  : "Verification remarks..."
                              }
                              value={remarks}
                              onChange={(e) => {
                                setRemarks(e.target.value);
                                setErrors(p => ({
                                  ...p, remarks: ""
                                }));
                              }}
                            />
                            {errors.remarks && (
                              <div className="invalid-feedback">
                                {errors.remarks}
                              </div>
                            )}
                          </div>

                          {/* Send back warning */}
                          {status === "2" && (
                            <div className="alert alert-warning
                              py-2 mb-3">
                              <i className="bi bi-exclamation-triangle-fill me-2" />
                              Sending back will reset task to{" "}
                              <strong>In Progress</strong>.
                              Associate will need to rework and resubmit.
                            </div>
                          )}

                          {/* Buttons */}
                          <div className="d-grid gap-2">
                            <button
                              className={`btn ${
                                status === "2"
                                  ? "btn-danger" : "btn-success"
                              }`}
                              onClick={handleSubmit}
                              disabled={saving}
                            >
                              {saving ? (
                                <>
                                  <span className="spinner-border
                                    spinner-border-sm me-2" />
                                  Submitting...
                                </>
                              ) : status === "2"
                                ? "Send Back"
                                : "Approve"}
                            </button>
                            <button
                              className="btn btn-outline-secondary"
                              onClick={() => navigate(-1)}
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

export default TaskCompletionApprovalDetails;