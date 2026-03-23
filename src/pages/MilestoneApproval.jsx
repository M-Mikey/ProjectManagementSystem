import React from "react";
import "../styles/ProjectApproval.css";
import Topbar from '../components/Navbar/Topbar';
import Navbar from '../components/Navbar/Navbar';
import { useNavigate, Link } from "react-router-dom";
import { getApproval } from "../api/userDashboardApi";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

const icon = "bi bi-pencil-square";
const icon_status = "bi bi-check-circle-fill";

const flexGrow = "flex-grow-1";

const ProjectApproval = () => {

  const navigate = useNavigate();
  const handleNavigation = () => {
    navigate('/projectapprovalDetails');
  }

  const [data, setData] = useState([]);
  const [error, setError] = useState("");
  const userId = sessionStorage.getItem("userId");
  console.log("user id", userId)

  useEffect(() => {
    if (!userId) return;

    const loadDashboard = async () => {
      try {
        const result = await getApproval(userId);
        setData(result);
        console.log("ack", JSON.stringify(result, null, 2));
      } catch (err) {
        console.error(err);
        setError("Failed to load dashboard data");
      }
    };
    loadDashboard();
  }, [userId]);



  return (
    <>
      <Topbar />
      <div class="d-flex">
        {/* <!-- Sidebar --> */}
        <Navbar />

        {/* <!-- Main Content --> */}
        <div className="main" id={flexGrow}>
          {/* <!-- Header --> */}

          <div class="container-fluid p-4">
            {/* <!-- Overview --> */}
            <h5 class="mb-3 animate__animated animate__fadeInDown">Milestone Approval</h5>

            {/* <!-- Summary -->
            <div class="row g-3 mb-4">
              <div class="col-md-3 col-6">
                <div class="card summary-card animate__animated animate__zoomIn bg-danger bg-opacity-50">
                  <div class="card-body text-center">
                    <h2 class="text-danger">6</h2>
                    <p class="mb-0 text-danger">Approval Pending</p>
                  </div>
                </div>
              </div>

              <div class="col-md-3 col-6">
                <div class="card summary-card animate__animated animate__zoomIn animate__delay-1s bg-success bg-opacity-50">
                  <div class="card-body text-center">
                    <h2 class="text-success">24</h2>
                    <p class="mb-0 text-success">Approval Completed</p>
                  </div>
                </div>
              </div>
            </div>
             */}

            {/* <!-- Approval Table --> 
            <div className="my-3">
              <h4>Milestone Approval</h4>
            </div>
            */}

            <div class="table-responsive animate__animated animate__fadeInUp">
              <table class="table table-bordered align-middle">
                <thead className="table thead">
                  <tr>
                    <th>Edit</th>
                    <th>Project Name</th>
                    <th>Milestone Name</th>
                    <th>Assigned To</th>
                    <th>Due Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center">
                        No data found
                      </td>
                    </tr>
                  ) : (
                    data.map((val, index) => {
                      const daysClass =
                        val.daysLeft < 0 ? "text-danger" : "";
                      const statusClass =
                        val.daysLeft < 0 ? "fw-bold" : "fw-normal";

                      return (
                        <tr key={index}>

                          <td className="text-right">
                            {val.status === "Approved" ? (
                              <button
                                className="btn btn-sm btn-outline-secondary"
                                disabled
                                title="Already Approved"
                              >
                                <i className="bi bi-pencil-square"></i>
                              </button>
                            ) : (
                              <Link
                                to={`/milestone_approval_details/${val.projectId}/${val.milestoneId}`}
                                state={val}
                                className="btn btn-sm btn-outline-primary"
                              >
                                <i className="bi bi-pencil-square"></i>
                              </Link>
                            )}
                          </td>
                          <td>{val.projectName}</td>
                          <td>{val.taskDetails}</td>
                          <td>{val.assignedBy}</td>
                          <td>
                            {new Date(val.dueDate).toLocaleDateString()}
                          </td>
                          {/*<td className={daysClass}>{val.daysLeft}</td>*/}
                          <td className={statusClass}>{val.status}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProjectApproval;
