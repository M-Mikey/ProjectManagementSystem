import React, { useEffect, useState } from "react";
import "../styles/ProjectApproval.css";
import Topbar from '../components/Navbar/Topbar';
import Navbar from '../components/Navbar/Navbar';
import { useNavigate, useParams } from "react-router-dom";
import { updateApprovalDetails, getApprovalHistory } from "../api/userDashboardApi";
import { getProjectById } from "../api/projectService";

const ProjectApprovalPending = () => {
  const { projectId, milestoneId } = useParams();
  const navigate = useNavigate();
  const userId   = sessionStorage.getItem("userId");

  const [project, setProject]     = useState(null);
  const [history, setHistory]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [status, setStatus]       = useState("");
  const [remarks, setRemarks]     = useState("");
  const [errors, setErrors]       = useState({});
  const [message, setMessage]     = useState("");
  const [messageType, setMessageType] = useState("");
  const [saving, setSaving]       = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);

        // Get full project with ALL milestones
        const result = await getProjectById(Number(projectId));
        console.log("Fetched project data:", result);
        const proj   = Array.isArray(result) ? result[0] : result;
        setProject(proj);

        // Get approval history
        const hresult = await getApprovalHistory(projectId);
        setHistory(hresult || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (projectId) load();
  }, [projectId]);

  const validate = () => {
    const newErrors = {};
    if (!status)         newErrors.status  = "Status is required";
    if (!remarks.trim()) newErrors.remarks = "Remarks are required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    if (saving) return;
    setSaving(true);

    try {
      const payload = {
        projectId:      Number(projectId),
        approvedBy:     userId,
        approvalStatus: Number(status),
        remarks:        remarks,
      };

      await updateApprovalDetails(payload);

      if (Number(status) === 1) {
  setMessage("Project approved successfully.");
} else if (Number(status) === 3) {
  setMessage("Project sent back for revision.");
}
      
      setMessageType("success");

      setTimeout(() => navigate("/project_approval"), 2500);
    } catch (err) {
      setMessage("Something went wrong. Please try again.");
      setMessageType("error");
    } finally {
      setSaving(false);
    }
  };

  const isActionTaken = history.some(item => {
    const approverId = item.approver_Name
      ?.substring(item.approver_Name.indexOf("[") + 1, item.approver_Name.indexOf("]"));
    return approverId === userId && ["Approved", "Rejected"].includes(item.status_Name);
  });

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    if (isNaN(d.getTime()) || d.getFullYear() < 2000) return "—";
    return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  };

  if (loading) return (
    <div className="d-flex justify-content-center align-items-center" style={{ height: "100vh" }}>
      <div className="spinner-border text-primary"></div>
    </div>
  );

  if (error) return <p className="text-danger m-4">{error}</p>;

  return (
    <div className="app-container">
      <Topbar />
      <div className="main-layout d-flex">
        <Navbar />
        <div className="flex-grow-1" style={{ overflowY: "auto", height: "calc(100vh - 60px)" }}>
          <div className="content container-fluid p-4">

            {/* Header */}
           <div className="sticky-top bg-white p-3 border-bottom d-flex justify-content-between align-items-center">
  <div>
    <h5 className="fw-bold mb-0">{project?.projectName}</h5>
    <small className="text-muted">Project Approval</small>
  </div>

  <div className="d-flex align-items-center gap-2">
    <span className="badge bg-warning">Pending Approval</span>
    <button className="btn btn-outline-secondary btn-sm" onClick={() => navigate("/project_approval")}>
      Back
    </button>
  </div>
</div>
<div className="container-fluid p-3">
<div className="row g-2">

    <div className="col-lg-7">
            {/* Project Details */}
           <div className="card shadow-sm mb-3 sticky-top" style={{ top: "80px" }}>
              <div className="card-header" style={{ background: "#f0f4ff" }}>
                <span className="fw-bold">Project Details</span>
              </div>
              <div className="card-body p-3">
               <div className="row g-2">
  {[
    { label: "Project Name", value: project?.projectName },
    { label: "PL", value: project?.projectPl },
    { label: "Target Date", value: formatDate(project?.projectTimeline) },
    { label: "Severity", value:
      project?.projectSeverity === "1" ? "Critical" :
      project?.projectSeverity === "2" ? "High" :
      project?.projectSeverity === "3" ? "Medium" :
      project?.projectSeverity === "4" ? "Low" : "—"
    },
    { label: "Approval Level", value: project?.projectApprovalLvl },
    { label: "Status", value: project?.projectApprovalStatus },
  ].map((item, i) => (
    <div key={i} className="col-md-4">
      <small className="text-muted">{item.label}</small>
      <div className="fw-semibold">{item.value || "—"}</div>
    </div>
  ))}
</div>
              </div>
            </div>

            {/* All Milestones */}
            <div className="card shadow-sm mb-3 sticky-top" style={{ top: "80px" }}>
              <div className="card-header" style={{ background: "#f0f4ff" }}>
                <span className="fw-bold">
                  Milestones
                  <span className="badge bg-primary ms-2">{project?.milestones?.length || 0}</span>
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
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {!project?.milestones?.length ? (
                      <tr>
                        <td colSpan="6" className="text-center text-muted">No milestones found</td>
                      </tr>
                    ) : (
                      project.milestones.map((m, i) => (
                        <tr key={i}>
                          <td>{i + 1}</td>
                          <td className="fw-semibold">{m.milestoneName}</td>
                          <td>{m.dueDate || "—"}</td>
                          <td>
                            <span className={`badge ${
                              m.priority === "Critical" || m.priority === "1" ? "bg-danger" :
                              m.priority === "High"     || m.priority === "2" ? "bg-warning text-dark" :
                              m.priority === "Medium"   || m.priority === "3" ? "bg-info text-dark" : "bg-secondary"
                            }`}>
                              {m.priority === "1" ? "Critical" :
                               m.priority === "2" ? "High" :
                               m.priority === "3" ? "Medium" :
                               m.priority === "4" ? "Low" : m.priority || "—"}
                            </span>
                          </td>
                          <td>{m.assignedTo || "—"}</td>
                          <td>
                            <span className={`badge ${
                              m.status === "Approved" ? "bg-success" :
                              m.status === "Rejected" ? "bg-danger"  : "bg-warning text-dark"
                            }`}>
                              {m.status || "Pending"}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Approval History */}
            <div className="card shadow-sm mb-3 sticky-top" style={{ top: "80px" }}>
              <div className="card-header" style={{ background: "#f0f4ff" }}>
                <span className="fw-bold">Approval History</span>
              </div>
              <div className="table-responsive">
                <table className="table table-bordered align-middle mb-0">
                  <thead style={{ background: "#0b2d6b", color: "#fff" }}>
                    <tr>
                      <th>Level</th>
                      <th>Department</th>
                      <th>Approver</th>
                      <th>Remarks</th>
                      <th>Status</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="text-center text-muted">No approval history yet</td>
                      </tr>
                    ) : (
                      history.map((item, index) => (
                        <tr key={index}>
                          <td>{item.level_No}</td>
                          <td>{item.role_Name}</td>
                          <td>{item.approver_Name}</td>
                          <td>{item.remarks || "—"}</td>
                          <td>
                            <span className={`badge ${
                              item.status_Name === "Approved" ? "bg-success" :
                              item.status_Name === "Rejected" ? "bg-danger"  :
                              item.status_Name === "Send Back"? "bg-warning text-dark" : "bg-secondary"
                            }`}>
                              {item.status_Name}
                            </span>
                          </td>
                          <td>{item.approval_Date ? new Date(item.approval_Date).toLocaleDateString() : "—"}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

   </div>

     <div className="col-lg-4">

            {/* Approval Action */}
            {!isActionTaken ? (
              <div className="card shadow-sm mb-3">
                <div className="card-header" style={{ background: "#f0f4ff" }}>
                  <span className="fw-bold">Your Approval Action</span>
                </div>
                <div className="card-body">

                  {message && (
                    <div className={`alert ${messageType === "success" ? "alert-success" : "alert-danger"} mb-3`}>
                      {message}
                    </div>
                  )}

                <div className="mb-3">
  <label className="form-label fw-semibold">
    Status <span className="text-danger">*</span>
  </label>
  <select
    className={`form-select ${errors.status ? "is-invalid" : ""}`}
    value={status}
    onChange={e => {
      setStatus(e.target.value);
      setErrors(prev => ({ ...prev, status: "" }));
    }}
  >
    <option value="">-- Select --</option>
    <option value="1">Approve</option>
    <option value="3">Send Back</option>
  </select>
  {errors.status && <div className="invalid-feedback">{errors.status}</div>}
</div>

<div className="mb-3">
  <label className="form-label fw-semibold">
    Remarks <span className="text-danger">*</span>
  </label>
  <textarea
    className={`form-control ${errors.remarks ? "is-invalid" : ""}`}
    rows={3}
    placeholder="Enter remarks..."
    value={remarks}
    onChange={e => {
      setRemarks(e.target.value);
      setErrors(prev => ({ ...prev, remarks: "" }));
    }}
  />
  {errors.remarks && <div className="invalid-feedback">{errors.remarks}</div>}
</div>

                  <div className="d-grid gap-2">
  <button
    type="button"
    className="btn btn-success"
    onClick={handleSubmit}
    disabled={saving}
  >
    {saving
      ? <><span className="spinner-border spinner-border-sm me-2"></span>Submitting...</>
      : "Approve / Submit"
    }
  </button>

  <button
    type="button"
    className="btn btn-outline-secondary"
    onClick={() => navigate("/project_approval")}
    disabled={saving}
  >
    Cancel
  </button>
</div>

                </div>
              </div>
            ) : (
              <div className="alert alert-info mb-3">
                <i className="bi bi-info-circle-fill me-2"></i>
                You have already taken action on this approval.
              </div>
            )}

            </div>
            </div>

          </div>
        </div>
      </div>
    </div>
    </div>
  );
};

export default ProjectApprovalPending;