import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Topbar from "../components/Navbar/Topbar";
import Navbar from "../components/Navbar/Navbar";
import { getTaskCompletionApprovals } from "../api/taskService";

const TaskCompletionApproval = () => {
  const navigate = useNavigate();
  const userId = sessionStorage.getItem("userId");

  const [data, setData]               = useState(null);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState("");
  const [selectedStatus, setSelectedStatus] = useState("Pending");

  useEffect(() => {
    if (!userId) {
      navigate("/", { replace: true });
      return;
    }
    loadApprovals();
  }, [userId]);

  const loadApprovals = async () => {
    setLoading(true);
    setError("");
    try {
      const result = await getTaskCompletionApprovals(userId, "All");
      setData(result);
    } catch (err) {
      console.error(err);
      setError("Failed to load task completion approvals");
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

            <h4 className="mb-4">Task Completion Approvals</h4>

            {/* Summary Cards */}
            <div className="row g-3 mb-4">
              <div className="col-auto">
                <div
                  className={`card px-4 py-3 text-center cursor-pointer ${selectedStatus === "Pending" ? "border-danger" : ""}`}
                  style={{ cursor: "pointer", minWidth: 140 }}
                  onClick={() => setSelectedStatus("Pending")}
                >
                  <div className="fs-3 fw-bold text-danger">{data?.pendingCount ?? 0}</div>
                  <div className="text-muted small">Pending</div>
                </div>
              </div>
              <div className="col-auto">
                <div
                  className={`card px-4 py-3 text-center ${selectedStatus === "Approved" ? "border-success" : ""}`}
                  style={{ cursor: "pointer", minWidth: 140 }}
                  onClick={() => setSelectedStatus("Approved")}
                >
                  <div className="fs-3 fw-bold text-success">{data?.approvedCount ?? 0}</div>
                  <div className="text-muted small">Approved</div>
                </div>
              </div>
              <div className="col-auto">
                <div
                  className={`card px-4 py-3 text-center ${selectedStatus === "All" ? "border-primary" : ""}`}
                  style={{ cursor: "pointer", minWidth: 140 }}
                  onClick={() => setSelectedStatus("All")}
                >
                  <div className="fs-3 fw-bold text-primary">{(data?.data || []).length}</div>
                  <div className="text-muted small">All</div>
                </div>
              </div>
            </div>

            {error && <div className="alert alert-danger">{error}</div>}

            {/* Approvals Table */}
            <div className="card shadow-sm">
              <div className="card-header fw-semibold">
                Task Completion Approvals —{" "}
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
                        <th>Assigned To</th>
                        <th>Due Date</th>
                        <th>Delayed</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr>
                          <td colSpan="8" className="text-center py-3">
                            <div className="spinner-border spinner-border-sm text-primary me-2"></div>
                            Loading...
                          </td>
                        </tr>
                      ) : filteredData.length === 0 ? (
                        <tr>
                          <td colSpan="8" className="text-center text-muted py-3">
                            No {selectedStatus.toLowerCase()} task completion approvals
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
                                    `/task_completion_approval_details/${row.taskDtlId}`,
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
                            <td>{row.assignedToName || row.taskAssignedTo}</td>
                            <td>
                              <span className={row.isDelayed === "Y" ? "text-danger fw-bold" : ""}>
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

export default TaskCompletionApproval;
