import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  getUserAcknowledgeDetails,
  updateProjectAcknowledge,
  updateMilestoneAcknowledge,
} from "../api/userDashboardApi";

const SEVERITY_MAP = {
  "1": "Critical",
  "2": "High",
  "3": "Medium",
  "4": "Low",
};

const APPROVAL_LEVEL_MAP = {
  "1": "Department Head",
  "2": "Division Head",
  "3": "Operating Head",
  "4": "Director",
  "5": "Senior Director",
};

/* ─────────────────────────────────────────────
   Small pure helpers
───────────────────────────────────────────── */
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

const getSeverity      = (val) => SEVERITY_MAP[val?.toString()]      || "—";
const getApprovalLevel = (val) => APPROVAL_LEVEL_MAP[val?.toString()] || "—";

/* ─────────────────────────────────────────────
   Main component
───────────────────────────────────────────── */
const UserAcknowledge = () => {
  const { projectId, milestoneId: milestoneIdParam } = useParams();
  const navigate = useNavigate();
  const userId   = sessionStorage.getItem("userId");

  const [data,             setData]             = useState(null);
  const [loading,          setLoading]          = useState(true);
  const [error,            setError]            = useState(null);
  const [saving,           setSaving]           = useState(false);
  const [status,           setStatus]           = useState("");
  const [remarks,          setRemarks]          = useState("");
  const [errors,           setErrors]           = useState({});
  const [message,          setMessage]          = useState({ text: "", type: "" });
  const [activeMilestoneId, setActiveMilestoneId] = useState(null);

  /* ── Load data ── */
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const result = await getUserAcknowledgeDetails(projectId, userId);
        setData(result);

        if (result?.milestones) {
          // Try deep-link target first
          if (milestoneIdParam) {
            const targeted = result.milestones.find(
              (m) =>
                m.milestoneId === Number(milestoneIdParam) &&
                m.is_Assigned === 1 &&
                ![1, 2].includes(Number(m.userStatus))
            );
            if (targeted) {
              setActiveMilestoneId(targeted.milestoneId);
              return;
            }
          }
          // Default: auto-select first pending assigned milestone
          const first = result.milestones.find(
            (m) => m.is_Assigned === 1 && ![1, 2].includes(Number(m.userStatus))
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
  }, [projectId, milestoneIdParam]);

  /* ── Loading / error guards ── */
  if (loading)
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ height: "100vh" }}
      >
        <div className="spinner-border text-primary" />
      </div>
    );
  if (error) return <p className="text-danger m-4">{error}</p>;
  if (!data)  return null;

  /* ── Derived state ── */
  const proj    = data.project;
  const projAck = Number(proj.projectAckStatus);
  const isPL      = proj.is_PL      === 1;
  const isCreator = proj.is_Creator === 1;

  const myPendingMilestones = data.milestones.filter(
    (m) => m.is_Assigned === 1 && ![1, 2].includes(Number(m.userStatus))
  );
  const myAckedMilestones = data.milestones.filter(
    (m) => m.is_Assigned === 1 && [1, 2].includes(Number(m.userStatus))
  );

  /*
   * FIX: Distinguish "on hold" from "fully done".
   *
   * plCanAct  → PL has never acted yet  (projAck === 0)
   * plOnHold  → PL placed it on hold    (projAck === 2) — they CAN still change this
   * plActed   → PL acknowledged it      (projAck === 1) — truly done
   *
   * Both plCanAct and plOnHold route to panelMode "pl" so the form stays visible.
   */
  const plCanAct           = isPL && projAck === 0;
  const plOnHold           = isPL && projAck === 2;
  const plActed            = isPL && projAck === 1;
  // Creator (not PL) can resubmit only when project is On Hold
  const creatorCanResubmit = isCreator && !isPL && projAck === 2;

  let panelMode = "readonly";
  if      (plCanAct || plOnHold)                              panelMode = "pl";
  else if (creatorCanResubmit)                                panelMode = "creator_resubmit";
  else if (myPendingMilestones.length > 0 && projAck === 1)  panelMode = "milestone";
  else if (plActed || myAckedMilestones.length > 0)          panelMode = "done";

  /* ── Validation ── */
  const validate = () => {
    const e = {};
    if (!status) e.status = "Status is required";
    if (Number(status) === 2 && !remarks.trim())
      e.remarks = "Remarks are required when placing on Hold";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  /* ── Submit ── */
  const handleSubmit = async () => {
    if (!validate() || saving) return;
    setSaving(true);
    setMessage({ text: "", type: "" });

    try {
      if (panelMode === "pl") {
        await updateProjectAcknowledge({
          projectId:   Number(projectId),
          milestoneId: 0,
          ackStatus:   Number(status),
          ackBy:       userId,
          ackRemarks:  remarks,
        });

        // FIX: Accurate message when updating an existing On Hold decision
        setMessage({
          text:
            Number(status) === 1
              ? "Project acknowledged successfully."
              : plOnHold
              ? "Project acknowledgement updated — remains On Hold."   // ← NEW
              : "Project placed on Hold.",
          type: "success",
        });
      } else if (panelMode === "milestone" && activeMilestoneId) {
        await updateMilestoneAcknowledge({
          projectId:   Number(projectId),
          milestoneId: activeMilestoneId,
          ackStatus:   Number(status),
          ackBy:       userId,
          ackRemarks:  remarks,
        });
        setMessage({
          text:
            Number(status) === 1
              ? "Milestone acknowledged successfully. Actions will be available only after approval."
              : "Milestone placed on Hold.",
          type: "success",
        });
      }

      setTimeout(() => navigate("/user_dashboard"), 1500);
    } catch (err) {
      setMessage({
        text: err?.message || "Something went wrong. Please try again.",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  /* ── Resubmit (creator only, when project is On Hold) ── */
  const handleResubmit = async () => {
    if (saving) return;
    setSaving(true);
    setMessage({ text: "", type: "" });
    try {
      await updateProjectAcknowledge({
        projectId:   Number(projectId),
        milestoneId: 0,
        ackStatus:   0,       // SP validates caller is creator + current status is 2
        ackBy:       userId,
        ackRemarks:  "",
      });
      setMessage({ text: "Project resubmitted to Project Leader successfully.", type: "success" });
      setTimeout(() => navigate("/user_dashboard"), 1500);
    } catch (err) {
      setMessage({ text: err?.message || "Resubmit failed. Please try again.", type: "error" });
    } finally {
      setSaving(false);
    }
  };


  const handleMilestoneSelect = (milestoneId) => {
    setActiveMilestoneId(milestoneId);
    setStatus("");
    setRemarks("");
    setErrors({});
    setMessage({ text: "", type: "" });
  };

  /* ─────────────────────────────────────────────
     Render
  ───────────────────────────────────────────── */
  return (
    <div className="app-container">
      <div className="main-layout d-flex">
        <div
          className="flex-grow-1"
          style={{ overflowY: "auto", height: "calc(100vh - 60px)" }}
        >
          <div className="content container-fluid p-4">

            {/* ── HEADER ─────────────────────────────────── */}
            <div
              className="sticky-top bg-white p-3 border-bottom d-flex justify-content-between align-items-center"
              style={{ zIndex: 100 }}
            >
              <div>
                <h5 className="fw-bold mb-0">{proj.projectName}</h5>
                <small className="text-muted">
                  User Acknowledgement
                  {milestoneIdParam && activeMilestoneId && (
                    <span className="ms-2 badge bg-primary-subtle text-primary">
                      {data.milestones.find(
                        (m) => m.milestoneId === activeMilestoneId
                      )?.milestoneName ?? ""}
                    </span>
                  )}
                </small>
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

            {/* ── BODY ───────────────────────────────────── */}
            <div className="container-fluid p-3">
              <div className="row g-3">

                {/* LEFT ── Project details + milestones table */}
                <div className="col-lg-8">

                  {/* Project Details card */}
                  <div className="card shadow-sm mb-3">
                    <div className="card-header" style={{ background: "#f0f4ff" }}>
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
                          { label: "Severity",       value: getSeverity(proj.projectSeverity) },
                          { label: "Approval Level", value: getApprovalLevel(proj.projectApprovalLevel) },
                          {
                            label: "Your Role",
                            value:
                              isPL && isCreator ? (
                                <span className="badge bg-info text-dark">PL + Creator</span>
                              ) : isPL ? (
                                <span className="badge bg-primary">Project Leader</span>
                              ) : isCreator ? (
                                <span className="badge bg-secondary">Creator</span>
                              ) : (
                                <span className="badge bg-success">Assigned User</span>
                              ),
                          },
                          {
                            label: "Project ACK Status",
                            value: <StatusBadge status={projAck} />,
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

                  {/* Milestones card */}
                  <div className="card shadow-sm mb-3">
                    <div className="card-header" style={{ background: "#f0f4ff" }}>
                      <span className="fw-bold">
                        Milestones
                        <span className="badge bg-primary ms-2">
                          {data.milestones.length}
                        </span>
                      </span>
                    </div>
                    <div className="table-responsive">
                      <table className="table table-bordered align-middle mb-0">
                        <thead style={{ background: "#0b2d6b", color: "#fff" }}>
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
                              <td colSpan="7" className="text-center text-muted py-3">
                                No milestones found
                              </td>
                            </tr>
                          ) : (
                            data.milestones.map((m, i) => (
                              <tr
                                key={m.milestoneId}
                                className={
                                  activeMilestoneId === m.milestoneId
                                    ? "table-primary"
                                    : ""
                                }
                              >
                                <td>{i + 1}</td>
                                <td className="fw-semibold">{m.milestoneName}</td>
                                <td>{m.milestoneDueDate || "—"}</td>
                                <td>{priorityBadge(m.milestonePriority)}</td>
                                <td>{m.milestoneAssigned || "—"}</td>
                                <td>
                                  <StatusBadge status={m.userStatus} />
                                </td>
                                <td>
                                  {/*
                                   * Action column rules:
                                   *
                                   * projAck === 1 (Acknowledged) + milestone pending + assigned
                                   *   → show Select button
                                   *
                                   * projAck === 0 (PL hasn't acted yet) + assigned
                                   *   → "Waiting for PL"
                                   *
                                   * projAck === 2 (PL put project On Hold) + assigned   ← FIX
                                   *   → "Project On Hold" — milestone actions are blocked
                                   *
                                   * Anything else (already acked/held, not assigned)
                                   *   → "—"
                                   */}
                                  {m.is_Assigned === 1 &&
                                  projAck === 1 &&
                                  ![1, 2].includes(Number(m.userStatus)) ? (
                                    <button
                                      className={`btn btn-sm ${
                                        activeMilestoneId === m.milestoneId
                                          ? "btn-primary"
                                          : "btn-outline-primary"
                                      }`}
                                      onClick={() => handleMilestoneSelect(m.milestoneId)}
                                    >
                                      {activeMilestoneId === m.milestoneId
                                        ? "✓ Selected"
                                        : "Select"}
                                    </button>
                                  ) : m.is_Assigned === 1 && projAck === 0 ? (
                                    <span className="badge bg-warning text-dark">
                                      Waiting for PL
                                    </span>
                                  ) : m.is_Assigned === 1 && projAck === 2 ? (
                                    /* FIX: explicit "Project On Hold" — block milestone actions */
                                    <span className="badge bg-secondary">
                                      Project On Hold
                                    </span>
                                  ) : (
                                    <span className="text-muted">—</span>
                                  )}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                </div>{/* /col-lg-8 */}

                {/* RIGHT ── Action card */}
                <div className="col-lg-4">
                  <div className="card shadow-sm mb-3">
                    <div className="card-header" style={{ background: "#f0f4ff" }}>
                      <span className="fw-bold">Your Acknowledgement Action</span>
                    </div>
                    <div className="card-body">

                      {/* ── readonly: pure creator, not PL, no milestones assigned ── */}
                      {panelMode === "readonly" && (
                        <div className="alert alert-secondary mb-0">
                          <i className="bi bi-eye me-2" />
                          You are the <strong>Project Creator</strong>.
                          This page is read-only for you.
                        </div>
                      )}

                      {panelMode === "done" && (
                        <div className="alert alert-info mb-0">
                          <i className="bi bi-check-circle-fill me-2" />
                          {plActed
                            ? "You have acknowledged this project."
                            : "You have already completed your acknowledgement action."}
                        </div>
                      )}

                      {/* PL acknowledged, waiting for associates on milestones */}
                      {plActed && myPendingMilestones.length === 0 &&
                       panelMode !== "done" && (
                        <div className="alert alert-success mb-0">
                          <i className="bi bi-check-circle-fill me-2" />
                          Project acknowledged. Waiting for assigned users
                          to acknowledge their milestones.
                        </div>
                      )}

                      {/*
                       * ── creator_resubmit ─────────────────────────────────────────
                       * Shown only when:
                       *   - caller is Creator (not PL)
                       *   - projAck === 2  (PL placed it On Hold)
                       * SP does all auth validation — no PL param needed here.
                       */}
                     {panelMode === "creator_resubmit" && (
  <>
    <div className="alert alert-warning mb-3">
      <i className="bi bi-exclamation-triangle-fill me-2" />
      <strong>Project placed On Hold by Project Leader.</strong>
      <div className="mt-1" style={{ fontSize: "0.85rem" }}>
        Review and edit the project details if needed,
        then resubmit to the Project Leader.
      </div>
    </div>

    {message.text && (
      <div
        className={`alert alert-${
          message.type === "success" ? "success" : "danger"
        } mb-3`}
      >
        {message.text}
      </div>
    )}

    <div className="d-grid gap-2">

      {/* Edit Project — review/fix details before resubmitting */}
      <button
        className="btn btn-outline-primary"
        disabled={saving}
        onClick={() => {
          // Parse PL — proj.projectPL may be "Name (userId)" or "Name - userId"
          const plRaw   = proj.projectPL || "";
                  const plMatch =
          plRaw.match(/^(.*?)\s*\(([^)]+)\)$/) ||   // "Name (userId)"
          plRaw.match(/^(.*?)\s*\[([^\]]+)\]$/) ||   // "Name [userId]"
          plRaw.match(/^(.*?)\s*[-]\s*(\S+)$/);      // "Name - userId"
          const plName   = plMatch ? plMatch[1].trim() : plRaw;
          const plUserId = plMatch ? plMatch[2].trim() : plRaw;

          navigate("/addProject", {
            state: {
              project: {
                projectId:          Number(projectId),
                projectName:        proj.projectName        || "",
                projectDescrip:     proj.projectDescrip     ||
                                    proj.purpose            ||
                                    proj.description        || "",
                projectTimeline:    proj.projectTimeline    || "",
                // AddProject.jsx parses projectPl to extract name + userId
                projectPl:          plUserId
                                      ? `${plName} (${plUserId})`
                                      : plRaw,
                projectType:        proj.hsdm               ||
                                    proj.projectType        || "",
                hsdm:               proj.hsdm               ||
                                    proj.projectType        || "",
                projectSeverity:    String(proj.projectSeverity    ?? ""),
                // AddProject.jsx reads projectApprovalLvl (not projectApprovalLevel)
                projectApprovalLvl: String(proj.projectApprovalLevel ??
                                           proj.projectApprovalLvl  ?? ""),
              },
            },
          });
        }}
      >
        <i className="bi bi-pencil-square me-2" />
        Edit Project Details
      </button>

      <button
        className="btn btn-primary"
        onClick={handleResubmit}
        disabled={saving}
      >
        {saving ? (
          <>
            <span className="spinner-border spinner-border-sm me-2" />
            Resubmitting...
          </>
        ) : (
          <>
            <i className="bi bi-arrow-clockwise me-2" />
            Resubmit to Project Leader
          </>
        )}
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

                      {/* ── Active action form: pl or milestone ── */}
                      {(panelMode === "pl" || panelMode === "milestone") && (
                        <>
                          {/* Context banner */}
                          <div className="alert alert-light border mb-3 py-2">
                            {panelMode === "pl" ? (
                              <>
                                <i className="bi bi-person-badge me-2 text-primary" />
                                {/*
                                 * FIX: When plOnHold, tell the PL they are
                                 *       updating an existing On Hold decision.
                                 */}
                                <strong>
                                  {plOnHold
                                    ? "Update Acknowledgement:"
                                    : "Acknowledging:"}
                                </strong>{" "}
                                Project
                                {plOnHold && (
                                  <span className="ms-2 badge bg-warning text-dark">
                                    Currently On Hold
                                  </span>
                                )}
                              </>
                            ) : (
                              <>
                                <i className="bi bi-flag me-2 text-success" />
                                <strong>Acknowledging Milestone:</strong>{" "}
                                {data.milestones.find(
                                  (m) => m.milestoneId === activeMilestoneId
                                )?.milestoneName || "—"}
                              </>
                            )}
                          </div>

                          {/* Submit feedback */}
                          {message.text && (
                            <div
                              className={`alert alert-${
                                message.type === "success" ? "success" : "danger"
                              } mb-3`}
                            >
                              {message.text}
                            </div>
                          )}

                          {/* Status dropdown */}
                          <div className="mb-3">
                            <label className="form-label fw-semibold">
                              Status <span className="text-danger">*</span>
                            </label>
                            <select
                              className={`form-select ${errors.status ? "is-invalid" : ""}`}
                              value={status}
                              onChange={(e) => {
                                setStatus(e.target.value);
                                setErrors((p) => ({ ...p, status: "" }));
                              }}
                            >
                              <option value="">-- Select --</option>
                              <option value="1">Acknowledge</option>
                              <option value="2">Hold</option>
                            </select>
                            {errors.status && (
                              <div className="invalid-feedback">{errors.status}</div>
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
                              className={`form-control ${errors.remarks ? "is-invalid" : ""}`}
                              rows={3}
                              placeholder="Enter remarks..."
                              value={remarks}
                              onChange={(e) => {
                                setRemarks(e.target.value);
                                setErrors((p) => ({ ...p, remarks: "" }));
                              }}
                            />
                            {errors.remarks && (
                              <div className="invalid-feedback">{errors.remarks}</div>
                            )}
                          </div>

                          {/* Submit / Cancel */}
                          <div className="d-grid gap-2">
                            <button
                              className="btn btn-success"
                              onClick={handleSubmit}
                              disabled={saving}
                            >
                              {saving ? (
                                <>
                                  <span className="spinner-border spinner-border-sm me-2" />
                                  Submitting...
                                </>
                              ) : (
                                "Submit"
                              )}
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
                </div>{/* /col-lg-4 */}

              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default UserAcknowledge;