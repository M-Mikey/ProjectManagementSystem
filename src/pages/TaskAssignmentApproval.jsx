import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Topbar from "../components/Navbar/Topbar";
import Navbar from "../components/Navbar/Navbar";
import { getTaskAssignmentApprovals } from "../api/taskService";

const TaskAssignmentApproval = () => {
  const navigate = useNavigate();
  const userId = sessionStorage.getItem("userId");

  const [data, setData]                     = useState(null);
  const [loading, setLoading]               = useState(true);
  const [error, setError]                   = useState("");
  const [selectedStatus, setSelectedStatus] = useState("Pending");

  useEffect(() => {
    if (!userId) { navigate("/", { replace: true }); return; }
    loadApprovals();
  }, [userId]);

  const loadApprovals = async () => {
    setLoading(true);
    setError("");
    try {
      const result = await getTaskAssignmentApprovals(userId, "All");
      setData(result);
    } catch (err) {
      console.error(err);
      setError("Failed to load task assignment approvals");
    } finally {
      setLoading(false);
    }
  };

  const filteredData = (data?.data || []).filter(row => {
    if (selectedStatus === "Pending")  return row.approvalStatus === 0;
    if (selectedStatus === "Approved") return row.approvalStatus === 1;
    if (selectedStatus === "SentBack") return row.approvalStatus === 2;
    return true;
  });

  return (
    <div className="app-container">
      <Topbar />
      <div className="main-layout d-flex">
        <Navbar />
        <div className="flex-grow-1">
          <div className="container-fluid p-4">

            <h4 className="mb-4">Task Assignment Approvals</h4>

            {/* Summary Cards */}
            <div className="row g-3 mb-4">
              {[
                { label: "Pending",  value: data?.pendingCount ?? 0,  color: "danger",  status: "Pending" },
                { label: "Approved", value: data?.approvedCount ?? 0, color: "success", status: "Approved" },
                { label: "All",      value: (data?.data || []).length, color: "primary", status: "All" },
              ].map((card) => (
                <div className="col-auto" key={card.status}>
                  <div
                    className={`card px-4 py-3 text-center ${selectedStatus === card.status ? `border-${card.color}` : ""}`}
                    style={{ cursor: "pointer", minWidth: 140 }}
                    onClick={() => setSelectedStatus(card.status)}
                  >
                    <div className={`fs-3 fw-bold text-${card.color}`}>{card.value}</div>
                    <div className="text-muted small">{card.label}</div>
                  </div>
                </div>
              ))}
            </div>

            {error && <div className="alert alert-danger">{error}</div>}

            {/* Table */}
            <div className="card shadow-sm">
              <div className="card-header fw-semibold">
                Task Assignment Approvals —{" "}
                <span className="text-muted">{selectedStatus}</span>
              </div>
              <div className="card-body p-0">
                <div className="table-responsive">
                  <table className="table table-bordered table-hover align-middle mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>Action</th>
                        <th>Project</th>
                        <th>Milestone</th>
                        <th>Task Name</th>
                        <th>Severity</th>
                        <th>Assigned To</th>
                        <th>Task Creator</th>
                        <th>Due Date</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr>
                          <td colSpan="9" className="text-center py-3">
                            <div className="spinner-border spinner-border-sm text-primary me-2"></div>
                            Loading...
                          </td>
                        </tr>
                      ) : filteredData.length === 0 ? (
                        <tr>
                          <td colSpan="9" className="text-center text-muted py-3">
                            No {selectedStatus.toLowerCase()} task assignment approvals
                          </td>
                        </tr>
                      ) : (
                        filteredData.map((row, index) => (
                          <tr key={index}>
                            <td>
                              <button
                                className="btn btn-sm btn-outline-primary"
                                title="Review"
                                onClick={() =>
                                  navigate(
                                    `/task_assignment_approval_details/${row.taskDtlId}`,
                                    { state: { task: row } }
                                  )
                                }
                              >
                                <i className="bi bi-pencil-square"></i>
                              </button>
                            </td>
                            <td>{row.projectName}</td>
                            <td>{row.milestoneName}</td>
                            <td>{row.taskName}</td>
                            <td>
                              <span className={`badge ${
                                row.taskSeverity === "Critical" ? "bg-danger" :
                                row.taskSeverity === "High"     ? "bg-warning text-dark" :
                                row.taskSeverity === "Medium"   ? "bg-info text-dark" : "bg-secondary"
                              }`}>
                                {row.taskSeverity || "—"}
                              </span>
                            </td>
                            <td>{row.assignedToName || row.taskAssignedTo}</td>
                            <td>{row.taskCreatorName || "—"}</td>
                            <td>{row.taskDueDate || "—"}</td>
                            <td>
                              <span className={`badge ${
                                row.approvalStatus === 0 ? "bg-warning text-dark" :
                                row.approvalStatus === 1 ? "bg-success" : "bg-secondary"
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
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskAssignmentApproval;
