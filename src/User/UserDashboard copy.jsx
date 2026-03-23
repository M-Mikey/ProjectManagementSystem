
import React, { useEffect, useState } from "react";

import { useNavigate } from 'react-router-dom';
import Topbar from '../components/Navbar/Topbar.jsx';
import UserNavbar from '../components/Navbar/Navbar.jsx';
//import UserNavbar from './UserNavbar.jsx';
import Card2 from '../components/Card2.jsx';
import { getUserDashboard } from "../api/userDashboardApi";
import { getTasksByUser } from "../api/taskService";


const UserDashboard = () => {
  const [tasks, setTasks] = useState([]);
  const [counts, setCounts] = useState({
    totalPending: 0,
    totalAcknowledge: 0,
    totalHold: 0,
  });



  const navigate = useNavigate();
  const handleNav = () => {
    navigate('/useracknow');
  }

  const [data, setData] = useState([]);
  const [error, setError] = useState("");
  const userId = sessionStorage.getItem("userId");
  console.log("user id", userId)

  useEffect(() => {
    if (!userId) return;

     fetchTasks();

    const loadDashboard = async () => {
      try {
        const result = await getUserDashboard(userId);
        setData(result);
        console.log("ack", JSON.stringify(result, null, 2));
      } catch (err) {
        console.error(err);
        setError("Failed to load dashboard data");
      }
    };
    loadDashboard();
  }, [userId]);

  const fetchTasks = async () => {
    try {
      const data = await getTasksByUser(userId);
      setTasks(data.tasks);
      setCounts({
        totalPending: data.totalPending,
        totalAcknowledge: data.totalAcknowledge,
        totalHold: data.totalHold,
      });
    } catch (error) {
      console.error("Error fetching tasks:", error);
    }
  };

  
  
  return (
    <>
      <Topbar />
      <div className="d-flex">
       <UserNavbar />

        {/* <!-- Main Content --> */}
        <div className="main flex-grow-1">

          <div className="container-fluid p-4">
            {/* <!-- Summary --> */}
            <h5 className="mb-3 "> User Acknowledgment (Project) </h5>

            <div className="row g-3 mb-4">
              <Card2 bg="bg-danger-subtle" text="text-danger" des="mb-0 text-danger" number="6" desc="Pending" />
              <Card2 bg="bg-warning-subtle" text="text-warning" des="mb-0 text-warning" number="8" desc="To be Acknowledged" />
              <Card2 bg="bg-success-subtle" text="text-success" des="mb-0 text-success" number="2" desc="On Hold" />
              {/* <Card2 bg="bg-primary-subtle" text="text-primary" des="mb-0 text-primary" number="17" desc="In Progress" />*/}

            </div>           

            <div className="table-responsive animate__animated">
              <table className="table table-bordered border-dark align-middle">
                <thead className="table thead table-dark">
                  <tr>
                    <th>Edit</th>
                    <th>Project Name</th>
                    <th>Milestone</th>
                    <th>Assigned By</th>
                    <th>Due Date</th>
                    {/*<th>Days Left</th>*/}
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
                          <td>
                            <button
                              className="btn btn-sm btn-outline-primary"
                              onClick={() =>
                                navigate(
                                  `/user_acknowledge/${val.projectId}/${val.milestoneId}`
                                )
                              }
                            >
                              Edit
                            </button>
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

              <div className="container mt-4">
              <h2>User Tasks</h2>

              <div className="row mb-3">
                <div className="col">Pending: {counts.totalPending}</div>
                <div className="col">Acknowledged: {counts.totalAcknowledge}</div>
                <div className="col">Hold: {counts.totalHold}</div>
              </div>

              <table className="table table-bordered">
                <thead>
                  <tr>
                    <th>Project</th>
                    <th>Milestone</th>
                    <th>Task</th>
                    <th>Severity</th>
                    <th>Status</th>
                    <th>ACK</th>
                    <th>Due Date</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks?.map((task) => (
                    <tr key={task.taskDtlId}>
                      <td>{task.projectName}</td>
                      <td>{task.milestoneName}</td>
                      <td>{task.taskName}</td>
                      <td>{task.taskSeverity}</td>
                      <td>{task.taskStatus}</td>
                      <td>{task.ackStatusText}</td>
                      <td>{task.taskDueDate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>


          </div>
        </div>  
      </div>
    </>
  )
}

export default UserDashboard
