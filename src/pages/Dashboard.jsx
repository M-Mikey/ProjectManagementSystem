import { useEffect, useState } from "react";
import { useNavigate } from 'react-router-dom';
import '../styles/Dashboard.css';

import Topbar from '../components/Navbar/Topbar.jsx';
import Navbar from '../components/Navbar/Navbar.jsx';
import Card2 from '../components/Card2.jsx';
import { getUserDashboard } from '../api/userDashboardApi';
import { getProjects } from '../api/projectService';

const PAGE_SIZE = 8;

const Dashboard = () => {
  const navigate = useNavigate();
  const userId   = sessionStorage.getItem("userId");

  const [activities, setActivities]           = useState([]);
  const [projects, setProjects]               = useState([]);
  const [pendingAck, setPendingAck]           = useState(0);
  const [pendingApproval, setPendingApproval] = useState(0);
  const [loading, setLoading]                 = useState(true);
  const [error, setError]                     = useState("");
  const [searchText, setSearchText]           = useState("");
  const [currentPage, setCurrentPage]         = useState(1);

  useEffect(() => {
    if (!userId) { navigate("/", { replace: true }); return; }
    loadDashboard();
  }, [userId, navigate]);

  const loadDashboard = async () => {
    setLoading(true);
    setError("");
    try {
      const ackData = await getUserDashboard(userId);

      setPendingAck(ackData?.total_Pending ?? 0);

      const projectRows = (ackData?.projects || []).map(p => ({
        projectId:   p.project_Id,
        milestoneId: p.milestone_Id,
        projectName: p.project_Name,
        taskDetails: p.milestone_Name,
        assignedBy:  p.assigned_By,
        dueDate:     p.milestone_Due_Date && !String(p.milestone_Due_Date).startsWith("0001")
                       ? p.milestone_Due_Date
                       : p.project_Timeline,
        daysLeft:    p.days_Left !== null && p.days_Left !== undefined
                     && p.milestone_Due_Date && !String(p.milestone_Due_Date).startsWith("0001")
                       ? p.days_Left
                       : "—",
        status:      p.status,
        type:        "project",
      }));

      const taskRows = (ackData?.tasks || []).map(t => ({
        projectId:   t.project_Id,
        milestoneId: t.milestone_Id,
        taskDtlId:   t.task_Dtl_Id,
        projectName: t.project_Name,
        taskDetails: t.task_Name,
        assignedBy:  t.task_Assigned_By,
        dueDate:     t.task_Due_Date,
        daysLeft:    "—",
        status:      t.ack_Status_Text,
        type:        "task",
      }));

      // DESC order — sort by projectId descending (latest project first)
      const combined = [...projectRows, ...taskRows];
      combined.sort((a, b) => b.projectId - a.projectId);
      setActivities(combined);

      const projectList = await getProjects(userId);
      setProjects(projectList || []);

    } catch (err) {
      console.error(err);
      setError("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const handleEditRow = (row) => {

  navigate(`/project-details/${row.projectId}`);
};

  // Filter by search
  const filteredActivities = activities.filter(row =>
    !searchText ||
    row.projectName?.toLowerCase().includes(searchText.toLowerCase()) ||
    row.taskDetails?.toLowerCase().includes(searchText.toLowerCase()) ||
    row.assignedBy?.toLowerCase().includes(searchText.toLowerCase()) ||
    row.status?.toLowerCase().includes(searchText.toLowerCase())
  );

  // Pagination
  const totalPages = Math.ceil(filteredActivities.length / PAGE_SIZE);
  const pagedActivities = filteredActivities.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  if (!userId) return null;

  return (
    <div className="app-container">
      <Topbar />
      <div className="main-layout d-flex">
        <Navbar />

        <div className="flex-grow-1">
          <div className="content container-fluid p-4">

            <h5 className="mb-3 animate__animated animate__fadeInDown">Overview</h5>

            {/* Summary Cards */}
            <div className="row g-3 mb-4">
              <Card2
                text="text-warning"
                des="mb-0 text-warning"
                number={pendingAck}
                desc="To be Acknowledged"
                onClick={() => navigate("/user_dashboard")}
              />
              <Card2
                text="text-danger"
                des="mb-0 text-danger"
                number={pendingApproval}
                desc="Approval Pending"
                onClick={() => navigate("/project_approval")}
              />
            </div>

            {/* Activities Header + Search */}
            <div className="d-flex align-items-center justify-content-between mb-3">
              <h5 className="mb-0 animate__animated animate__fadeInLeft">
                Activities
                <span className="badge bg-secondary ms-2" style={{ fontSize: 12 }}>
                  {filteredActivities.length}
                </span>
              </h5>
              <div className="input-group" style={{ maxWidth: 350 }}>
                <span className="input-group-text bg-white">
                  <i className="bi bi-search text-muted"></i>
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search project, task, assigned by..."
                  value={searchText}
                  onChange={e => { setSearchText(e.target.value); setCurrentPage(1); }}
                />
                {searchText && (
                  <button
                    className="btn btn-outline-secondary"
                    onClick={() => { setSearchText(""); setCurrentPage(1); }}
                  >
                    <i className="bi bi-x"></i>
                  </button>
                )}
              </div>
            </div>

            {error && <div className="alert alert-danger">{error}</div>}

            {/* Activities Table */}
            <div className="table-responsive animate__animated animate__fadeInUp" style={{ maxHeight: "calc(100vh - 320px)", overflowY: "auto" }}>
              <table className="table table-bordered table-hover align-middle">
                <thead>
                  <tr>
                    <th>View</th>
                    <th>Project Name</th>
                    <th>Milestone / Task</th>
                    <th>Assigned By</th>
                    <th>Due Date</th>
                    <th>Days Left</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="7" className="text-center">
                        <div className="spinner-border spinner-border-sm text-primary me-2"></div>
                        Loading...
                      </td>
                    </tr>
                  ) : pagedActivities.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center text-muted">
                        No activities found
                      </td>
                    </tr>
                  ) : (
                    pagedActivities.map((row, key) => {
                      const daysLeftNum = Number(row.daysLeft);
                      const isOverdue   = !isNaN(daysLeftNum) && daysLeftNum < 0;
                      const daysClass   = isOverdue ? "text-danger fw-bold" : "";

                      return (
                        <tr key={key} style={{
                          background: isOverdue ? "#fff5f5" : "inherit"
                        }}>
                          <td>
                            <button
                              className="btn btn-sm btn-outline-primary"
                              onClick={() => handleEditRow(row)}
                            >
                              <i className="bi bi-pencil-square"></i>
                            </button>
                          </td>
                          <td>{row.projectName}</td>
                          <td>{row.taskDetails || "—"}</td>
                          <td>{row.assignedBy}</td>
                          <td>{row.dueDate || "—"}</td>
                          <td className={daysClass}>
                            {row.daysLeft === "—" ? "—" : row.daysLeft}
                          </td>
                          <td>
                            <span className={`badge ${
                              row.status === "Pending"      ? "bg-danger" :
                              row.status === "Acknowledged" ? "bg-success" :
                              row.status === "Hold"         ? "bg-warning text-dark" :
                              isOverdue                     ? "bg-danger" : "bg-secondary"
                            }`}>
                              {row.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="d-flex align-items-center justify-content-between mt-3">
                <small className="text-muted">
                  Showing {((currentPage - 1) * PAGE_SIZE) + 1}–{Math.min(currentPage * PAGE_SIZE, filteredActivities.length)} of {filteredActivities.length}
                </small>
                <nav>
                  <ul className="pagination pagination-sm mb-0">
                    <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                      <button className="page-link" onClick={() => setCurrentPage(p => p - 1)}>‹</button>
                    </li>
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                      .reduce((acc, p, i, arr) => {
                        if (i > 0 && p - arr[i - 1] > 1) acc.push("...");
                        acc.push(p);
                        return acc;
                      }, [])
                      .map((p, i) =>
                        p === "..." ? (
                          <li key={`e-${i}`} className="page-item disabled">
                            <span className="page-link">…</span>
                          </li>
                        ) : (
                          <li key={p} className={`page-item ${currentPage === p ? "active" : ""}`}>
                            <button className="page-link" onClick={() => setCurrentPage(p)}>{p}</button>
                          </li>
                        )
                      )
                    }
                    <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
                      <button className="page-link" onClick={() => setCurrentPage(p => p + 1)}>›</button>
                    </li>
                  </ul>
                </nav>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;