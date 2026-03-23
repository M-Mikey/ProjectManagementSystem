import React, { useEffect, useState } from "react";
import { useNavigate } from 'react-router-dom';
import Topbar from '../components/Navbar/Topbar.jsx';
import UserNavbar from '../components/Navbar/Navbar.jsx';
import Card2 from '../components/Card2.jsx';
import { getUserDashboard } from "../api/userDashboardApi";
import { icon } from '../components/Data.jsx';

const UserDashboard = () => {
  const [selectedStatus, setSelectedStatus] = useState("Pending");
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const userId = sessionStorage.getItem("userId");

  useEffect(() => {
    if (!userId) {
      navigate("/", { replace: true });
      return;
    }
    const loadDashboard = async () => {
      try {
        const result = await getUserDashboard(userId);
        console.log("Dashboard data:", result);
        setData(result);
      } catch (err) {
        console.error(err);
        setError("Failed to load dashboard data");
      }
    };
    loadDashboard();
  }, [userId]);

  // ✅ ROLE DETECTION per project row
  const getRole = (project) => {
    const isPL = project.is_PL === 1;
    const isCreator = project.is_Creator === 1;
    const isAssigned = project.is_Assigned === 1;
    return { isPL, isCreator, isAssigned };
  };

  // ✅ SECTION VISIBILITY RULES
  // PL section: show if user is PL (regardless of creator)
  // Assigned section: show if user is assigned
  // Creator section: show always if creator (read-only view)

  const filteredProjects = data?.projects?.filter(
    p => p.status === selectedStatus
  ) || [];

  // PL rows — user is PL
  const plProjects = filteredProjects.filter(p => p.is_PL === 1);

  // Assigned rows — user is assigned (show even if also PL)
  const assignedProjects = filteredProjects.filter(p => p.is_Assigned === 1);

  // Creator only rows — user is creator but NOT PL and NOT assigned
  const creatorOnlyProjects = filteredProjects.filter(
    p => p.is_Creator === 1 && p.is_PL !== 1 && p.is_Assigned !== 1
  );

  const filteredTasks = data?.tasks?.filter(
    t => t.ack_Status_Text === selectedStatus
  ) || [];

  const renderProjectTable = (rows, sectionLabel) => (
    <>
      <h6 className="mb-2 text-muted">{sectionLabel}</h6>
      <div className="table-responsive animate__animated animate__fadeInUp mb-4">
        <table className="table table-bordered table-hover align-middle">
          <thead>
            <tr>
              <th>Edit</th>
              <th>Project Name</th>
              <th>Milestone</th>
              <th>Assigned By</th>
              <th>Target Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center">No data found</td>
              </tr>
            ) : (
              rows.map((val, index) => (
                <tr key={index}>
                  <td>
                    <button
                      className="btn btn-sm p-0 border-0 bg-transparent"
                      onClick={() =>
                        navigate(`/user_acknowledge/${val.project_Id}`)
                      }
                    >
                      <i className={icon[0]}></i>
                    </button>
                  </td>
                  <td>{val.project_Name}</td>
                  <td>{val.milestone_Name}</td>
                  <td>{val.assigned_By}</td>
                  <td>{val.project_Timeline}</td>
                  <td>{val.status}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );

  return (
    <>
      <Topbar />
      <div className="d-flex">
        <UserNavbar />
        <div className="main flex-grow-1">
          <div className="container-fluid p-4">

            <h5 className="mb-3 animate__animated animate__fadeInDown">
              Acknowledgment Overview
            </h5>

            {/* Summary Cards */}
            <div className="row g-3 mb-4">
              <Card2
                bg="bg-danger-subtle" text="text-danger"
                des="mb-0 text-danger"
                number={data?.total_Pending || 0}
                desc="Pending"
                onClick={() => setSelectedStatus("Pending")}
              />
              <Card2
                bg="bg-warning-subtle" text="text-warning"
                des="mb-0 text-warning"
                number={data?.total_Ack || 0}
                desc="To be Acknowledged"
                onClick={() => setSelectedStatus("Acknowledged")}
              />
              <Card2
                bg="bg-success-subtle" text="text-success"
                des="mb-0 text-success"
                number={data?.total_Hold || 0}
                desc="On Hold"
                onClick={() => setSelectedStatus("Hold")}
              />
            </div>

            {/* ✅ PROJECT SECTION */}
            <h5 className="mb-3 animate__animated animate__fadeInLeft">Project</h5>

            {/* PL Section */}
            {plProjects.length > 0 &&
              renderProjectTable(plProjects, "🔵 As Project Leader")}

            {/* Assigned Section */}
            {assignedProjects.length > 0 &&
              renderProjectTable(assignedProjects, "🟢 As Assigned User")}

            {/* Creator Only Section */}
            {creatorOnlyProjects.length > 0 &&
              renderProjectTable(creatorOnlyProjects, "🟡 As Project Creator")}

            {/* If nothing at all */}
            {plProjects.length === 0 &&
              assignedProjects.length === 0 &&
              creatorOnlyProjects.length === 0 && (
                <p className="text-center text-muted">No projects found</p>
              )}

            {/* ✅ TASK SECTION */}
            <h5 className="mb-3 animate__animated animate__fadeInLeft">Task</h5>
            <div className="table-responsive animate__animated animate__fadeInUp">
              <table className="table table-bordered table-hover align-middle">
                <thead>
                  <tr>
                    <th>Edit</th>
                    <th>Task Name</th>
                    <th>Severity</th>
                    <th>Assigned By</th>
                    <th>Target Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTasks.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center">No data found</td>
                    </tr>
                  ) : (
                    filteredTasks.map((task) => (
                      <tr key={task.task_Dtl_Id}>
                        <td>
                          <button
                            className="btn btn-sm p-0 border-0 bg-transparent"
                          
                              onClick={() =>
                                navigate(
                                  `/user_acknowledge_task/${task.project_Id}/${task.milestone_Id}/${task.parent_Task_Id}/${task.task_Dtl_Id}`
                                )
                              }
                          >
                            <i className={icon[0]}></i>
                          </button>
                        </td>
                        <td>{task.task_Name}</td>
                        <td>{task.task_Severity}</td>
                        <td>{task.task_Assigned_By}</td>
                        <td>{task.task_Due_Date}</td>
                        <td>{task.task_Status}</td>
                      </tr>
                    ))
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

export default UserDashboard;