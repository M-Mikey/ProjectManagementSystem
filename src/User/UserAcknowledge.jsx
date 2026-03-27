import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Topbar from "../components/Navbar/Topbar.jsx";
import Navbar from "../components/Navbar/Navbar.jsx";
import {
  getUserAcknowledgeDetails,
  updateProjectAcknowledge,
  updateMilestoneAcknowledge,
} from "../api/userDashboardApi";

const UserAcknowledge = () => {
  const { projectId } = useParams();
  const navigate      = useNavigate();
  const userId        = sessionStorage.getItem("userId");

  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [saving, setSaving]   = useState(false);

  // Action form state
  const [status, setStatus]   = useState("");
  const [remarks, setRemarks] = useState("");
  const [errors, setErrors]   = useState({});
  const [message, setMessage] = useState({ text: "", type: "" });

  // Which milestone is being acted on
  const [activeMilestoneId, setActiveMilestoneId] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const result = await getUserAcknowledgeDetails(projectId, userId);
        setData(result);

        // Auto-select first assigned pending milestone
        if (result?.milestones) {
          const first = result.milestones.find(
            m => m.is_Assigned === 1 && ![1, 2].includes(Number(m.userStatus))
          );
          if (first) setActiveMilestoneId(first.milestoneId);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    if (projectId) load();
  }, [projectId]);

  if (loading) return (
    <div className="d-flex justify-content-center align-items-center"
      style={{ height: "100vh" }}>
      <div className="spinner-border text-primary" />
    </div>
  );
  if (error)  return <p className="text-danger m-4">{error}</p>;
  if (!data)  return null;

  const proj    = data.project;
  const projAck = Number(proj.projectAckStatus);
  const isPL      = proj.is_PL      === 1;
  const isCreator = proj.is_Creator === 1;

  // Any milestone assigned to this user that is pending
  const myPendingMilestones = data.milestones.filter(
    m => m.is_Assigned === 1 && ![1, 2].includes(Number(m.userStatus))
  );
  const myAckedMilestones = data.milestones.filter(
    m => m.is_Assigned === 1 && [1, 2].includes(Number(m.userStatus))
  );

  // Can PL still act?
  const plCanAct = isPL && projAck === 0;
  // PL already acted
  const plActed  = isPL && [1, 2].includes(projAck);

  // Determine right panel mode
  // "pl"         → show project ACK form
  // "milestone"  → show milestone ACK form
  // "done"       → all actions taken
  // "readonly"   → creator only, no action
  let panelMode = "readonly";
  if (plCanAct)                          panelMode = "pl";
  else if (myPendingMilestones.length > 0 && projAck === 1) panelMode = "milestone";
  else if (plActed || myAckedMilestones.length > 0)         panelMode = "done";

  const validate = () => {
    const e = {};
    if (!status) e.status = "Status is required";
    if (Number(status) === 2 && !remarks.trim())
      e.remarks = "Remarks are required when placing on Hold";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate() || saving) return;
    setSaving(true);
    setMessage({ text: "", type: "" });

    try {
      if (panelMode === "pl") {
        // PL acknowledges project
        await updateProjectAcknowledge({
          projectId:   Number(projectId),
          milestoneId: 0,
          ackStatus:   Number(status),
          ackBy:       userId,
          ackRemarks:  remarks,
        });
        setMessage({
          text: Number(status) === 1
            ? "Project acknowledged successfully."
            : "Project placed on Hold.",
          type: "success"
        });
      } else if (panelMode === "milestone" && activeMilestoneId) {
        // Assigned user acknowledges milestone
        await updateMilestoneAcknowledge({
          projectId:   Number(projectId),
          milestoneId: activeMilestoneId,
          ackStatus:   Number(status),
          ackBy:       userId,
          ackRemarks:  remarks,
        });
        setMessage({
          text: Number(status) === 1
            ? "Milestone acknowledged successfully."
            : "Milestone placed on Hold.",
          type: "success"
        });
      }

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

  const StatusBadge = ({ status: s }) => {
    const n = Number(s);
    if (n === 1) return <span className="badge bg-success">Acknowledged</span>;
    if (n === 2) return <span className="badge bg-warning text-dark">On Hold</span>;
    return <span className="badge bg-danger">Pending</span>;
  };

  const priorityBadge = (p) => {
    const val = String(p);
    if (val === "1" || val === "Critical")
      return <span className="badge bg-danger">Critical</span>;
    if (val === "2" || val === "High")
      return <span className="badge bg-warning text-dark">High</span>;
    if (val === "3" || val === "Medium")
      return <span className="badge bg-info text-dark">Medium</span>;
    return <span className="badge bg-secondary">Low</span>;
  };

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
                <h5 className="fw-bold mb-0">{proj.projectName}</h5>
                <small className="text-muted">User Acknowledgement</small>
              </div>
              <div className="d-flex align-items-center gap-2">
                <StatusBadge status={projAck} />
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
                <div className="col-lg-7">

                  {/* Project Details */}
                  <div className="card shadow-sm mb-3">
                    <div className="card-header"
                      style={{ background: "#f0f4ff" }}>
                      <span className="fw-bold">Project Details</span>
                    </div>
                    <div className="card-body p-3">
                      <div className="row g-2">
                        {[
                          { label: "Project Name",   value: proj.projectName },
                          { label: "Project Leader", value: proj.projectPL },
                          { label: "Created By",     value: proj.assignedBy },
                          { label: "Timeline",       value: proj.projectTimeline },
                          { label: "HSDM",           value: proj.hsdm },
                          { label: "Severity",       value: proj.projectSeverity },
                          { label: "Approval Level", value: proj.projectApprovalLevel },
                          {
                            label: "Your Role",
                            value: isPL && isCreator
                              ? <span className="badge bg-info text-dark">PL + Creator</span>
                              : isPL
                              ? <span className="badge bg-primary">Project Leader</span>
                              : isCreator
                              ? <span className="badge bg-secondary">Creator</span>
                              : <span className="badge bg-success">Assigned User</span>
                          },
                          {
                            label: "Project ACK Status",
                            value: <StatusBadge status={projAck} />
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

                  {/* Milestones */}
                  <div className="card shadow-sm mb-3">
                    <div className="card-header"
                      style={{ background: "#f0f4ff" }}>
                      <span className="fw-bold">
                        Milestones
                        <span className="badge bg-primary ms-2">
                          {data.milestones.length}
                        </span>
                      </span>
                    </div>
                    <div className="table-responsive">
                      <table className="table table-bordered
                        align-middle mb-0">
                        <thead
                          style={{ background: "#0b2d6b", color: "#fff" }}>
                          <tr>
                            <th>#</th>
                            <th>Milestone Name</th>
                            <th>Due Date</th>
                            <th>Priority</th>
                            <th>Assigned To</th>
                            <th>ACK Status</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.milestones.length === 0 ? (
                            <tr>
                              <td colSpan="7"
                                className="text-center text-muted py-3">
                                No milestones found
                              </td>
                            </tr>
                          ) : (
                            data.milestones.map((m, i) => (
                              <tr key={m.milestoneId}
                                className={
                                  activeMilestoneId === m.milestoneId
                                    ? "table-primary" : ""
                                }>
                                <td>{i + 1}</td>
                                <td className="fw-semibold">
                                  {m.milestoneName}
                                </td>
                                <td>{m.milestoneDueDate || "—"}</td>
                                <td>{priorityBadge(m.milestonePriority)}</td>
                                <td>{m.milestoneAssigned || "—"}</td>
                                <td>
                                  <StatusBadge status={m.userStatus} />
                                </td>
                                <td>
                                  {/* Show Select button only for
                                      assigned + pending + projAck=1 */}
                                  {m.is_Assigned === 1 &&
                                   projAck === 1 &&
                                   ![1,2].includes(Number(m.userStatus))
                                    ? (
                                      <button
                                        className={`btn btn-sm ${
                                          activeMilestoneId === m.milestoneId
                                            ? "btn-primary"
                                            : "btn-outline-primary"
                                        }`}
                                        onClick={() => {
                                          setActiveMilestoneId(m.milestoneId);
                                          setStatus("");
                                          setRemarks("");
                                          setErrors({});
                                          setMessage({ text: "", type: "" });
                                        }}
                                      >
                                        {activeMilestoneId === m.milestoneId
                                          ? "✓ Selected"
                                          : "Select"}
                                      </button>
                                    )
                                    : m.is_Assigned === 1 &&
                                      projAck === 0
                                    ? (
                                      <span className="badge bg-warning
                                        text-dark">
                                        Waiting for PL
                                      </span>
                                    )
                                    : <span className="text-muted">—</span>
                                  }
                                </td>
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
                      <span className="fw-bold">Your Acknowledgement Action</span>
                    </div>
                    <div className="card-body">

                      {/* READONLY — Creator only */}
                      {panelMode === "readonly" && (
                        <div className="alert alert-secondary mb-0">
                          <i className="bi bi-eye me-2" />
                          You are the <strong>Project Creator</strong>.
                          This page is read-only for you.
                        </div>
                      )}

                      {/* DONE — already actioned */}
                      {panelMode === "done" && (
                        <div className="alert alert-info mb-0">
                          <i className="bi bi-check-circle-fill me-2" />
                          You have already completed your acknowledgement action.
                        </div>
                      )}

                      {/* PL waiting for assigned user after projAck=1 */}
                      {plActed && myPendingMilestones.length === 0 &&
                       panelMode !== "done" && (
                        <div className="alert alert-success mb-0">
                          <i className="bi bi-check-circle-fill me-2" />
                          Project acknowledged. Waiting for assigned users
                          to acknowledge their milestones.
                        </div>
                      )}

                      {/* ACK FORM — PL or Milestone */}
                      {(panelMode === "pl" ||
                        panelMode === "milestone") && (
                        <>
                          {/* Label showing what is being acked */}
                          <div className="alert alert-light border mb-3 py-2">
                            {panelMode === "pl" ? (
                              <>
                                <i className="bi bi-person-badge me-2
                                  text-primary" />
                                <strong>Acknowledging:</strong> Project
                              </>
                            ) : (
                              <>
                                <i className="bi bi-flag me-2
                                  text-success" />
                                <strong>Acknowledging Milestone:</strong>{" "}
                                {data.milestones.find(
                                  m => m.milestoneId === activeMilestoneId
                                )?.milestoneName || "—"}
                              </>
                            )}
                          </div>

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
                                setErrors(p => ({
                                  ...p, status: "" }));
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
                                setErrors(p => ({
                                  ...p, remarks: "" }));
                              }}
                            />
                            {errors.remarks && (
                              <div className="invalid-feedback">
                                {errors.remarks}
                              </div>
                            )}
                          </div>

                          <div className="d-grid gap-2">
                            <button
                              className="btn btn-success"
                              onClick={handleSubmit}
                              disabled={saving}
                            >
                              {saving
                                ? <>
                                    <span className="spinner-border
                                      spinner-border-sm me-2" />
                                    Submitting...
                                  </>
                                : "Submit"
                              }
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

export default UserAcknowledge;