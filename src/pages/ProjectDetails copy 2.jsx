import React, { useEffect, useState } from "react";
import "../styles/ProjectApproval.css";
import Topbar from "../components/Navbar/Topbar";
import Navbar from "../components/Navbar/Navbar";
import UserSearch from '../components/Common/UserSearch';
import { Link, useLocation, useParams } from "react-router-dom";
import { getProjectById } from "../api/projectService";
import { createTask, saveSubTask as saveSubTaskApi, getTasksByMilestone } from "../api/taskService";

const ProjectDetails = () => {
  const location = useLocation();
  const { projectId } = useParams();

  const [projectData, setProjectData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [selectedMilestone, setSelectedMilestone] = useState(null);

  const [showSubModal, setShowSubModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedSubUser, setSelectedSubUser] = useState(null);

  const [errors, setErrors] = useState({});
  const [successMsg, setSuccessMsg] = useState("");

  const [expandedRow, setExpandedRow] = useState(null);
  const [taskData, setTaskData] = useState({});
  const [rowLoading, setRowLoading] = useState(null);

  const [taskForm, setTaskForm] = useState({
    taskName: "",
    taskDescription: "",
    priority: "",
    taskAssignedTo: "",
    //taskRevisedDate: "",
  });

  const [subTaskForm, setSubTaskForm] = useState({
    taskName: "",
    taskDescription: "",
    priority: "",
    taskAssignedTo: ""
  });

  useEffect(() => {
    const loadProject = async () => {
      try {
        if (location.state) {
          setProjectData(location.state);
        } else if (projectId) {
          const result = await getProjectById(projectId);
          setProjectData(result);
        }
      } catch (err) {
        console.error(err);
        setError("Failed to load project details");
      } finally {
        setLoading(false);
      }
    };

    loadProject();
  }, [location.state, projectId]);


  /* ================= USER SELECT ================= */
  const handleUserSelect = (user) => {
    setSelectedUser(user);

    setTaskForm(prev => ({
      ...prev,
      taskAssignedTo: user.userName
    }));

    setErrors(prev => ({ ...prev, taskAssignedTo: "" }));
  };

  const handleSubUserSelect = (user) => {
    setSelectedSubUser(user);

    setSubTaskForm(prev => ({
      ...prev,
      taskAssignedTo: user.userName
    }));
  };

  const openTaskModal = (milestone) => {
    setSelectedMilestone(milestone);
    setShowModal(true);
  };

  const openSubTaskModal = (task, milestone) => {
    setSelectedTask(task);
    setSelectedMilestone(milestone);
    setShowSubModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedUser(null);
    setTaskForm({
      taskName: "",
      taskDescription: "",
      priority: "",
      taskAssignedTo: "",
      // taskRevisedDate: "",
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setTaskForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: "",
    }));
  };

  const saveTask = async () => {
    try {

      if (!validate()) return;

      if (!selectedMilestone) {
        alert("Milestone not selected");
        return;
      }

      const payload = {
        projectId: projectData.projectId,
        milestoneId: selectedMilestone.milestoneId, // ✅ FIXED
        parentTaskId: 0,
        taskName: taskForm.taskName,
        taskDescription: taskForm.taskDescription,
        taskSeverity: parseInt(taskForm.priority), // ✅ FIXED
        taskAssignedTo: taskForm.taskAssignedTo,
        //taskRevisedDate: taskForm.taskRevisedDate || null,
      };

      const result = await createTask(payload);

      if (result.success) {
        // alert("Task Created Successfully");
        setSuccessMsg("Task Created Successfully.");
        closeModal();
      } else {
        // alert("Failed to create task");
        setError("Failed to create task");
      }

    } catch (error) {
      console.error(error);
      //alert("Error saving task");
      setError("Error saving task");
    }
  };

  const saveSubTaskHandler = async () => {
    try {

      if (!selectedTask || !selectedMilestone) {
        alert("Parent task not selected");
        return;
      }

      if (!validate_sub()) return;

      const payload = {
        projectId: projectData.projectId,
        milestoneId: selectedMilestone.milestoneId,
        parentTaskId: selectedTask.taskDtlId,
        taskName: subTaskForm.taskName,
        taskDescription: subTaskForm.taskDescription,
        taskSeverity: parseInt(subTaskForm.priority),
        taskAssignedTo: subTaskForm.taskAssignedTo,
        createdBy: "ADMIN"
      };

      console.log("Payload:", payload);

      const result = await saveSubTaskApi(payload);

      if (result.success) {
        alert("Sub Task Created Successfully");

        setShowSubModal(false);
        await refreshTasks(selectedMilestone.milestoneId);

        setSubTaskForm({
          taskName: "",
          taskDescription: "",
          priority: "",
          taskAssignedTo: ""
        });

      } else {
        alert(result.message || "Failed to create sub task");
      }

    } catch (error) {
      console.error("Save Error:", error);
      alert(error.message || "Something went wrong");
    }
  };

  const refreshTasks = async (milestoneId) => {
    const tasks = await getTasksByMilestone(
      projectData.projectId,
      milestoneId
    );

    setTaskData(prev => ({
      ...prev,
      [milestoneId]: tasks
    }));
  };

  const handleSubTaskChange = (e) => {
    const { name, value } = e.target;
    setSubTaskForm(prev => ({
      ...prev,
      [name]: value
    }));
  };
  /* ================= ROW CLICK ================= */
  const handleRowClick = async (milestone) => {
    try {
      // Collapse if same row clicked
      if (expandedRow === milestone.milestoneId) {
        setExpandedRow(null);
        return;
      }

      setRowLoading(milestone.milestoneId);

      const tasks = await getTasksByMilestone(
        projectData.projectId,
        milestone.milestoneId
      );

      setTaskData((prev) => ({
        ...prev,
        [milestone.milestoneId]: tasks,
      }));

      setExpandedRow(milestone.milestoneId);
    } catch (error) {
      console.error(error);
      setError("Error loading tasks");
    } finally {
      setRowLoading(null);
    }
  };


  const validate = () => {
    let newErrors = {};

    if (!taskForm.taskName.trim()) {
      newErrors.taskName = "Task Name is required";
    }

    if (!taskForm.priority) {
      newErrors.priority = "Priority is required";
    }

    if (!taskForm.taskAssignedTo) {
      newErrors.taskAssignedTo = "Assigned User is required";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const validate_sub = () => {
    let newErrors = {};

    if (!subTaskForm.taskName.trim()) {
      newErrors.taskName = "Task Name is required";
    }

    if (!subTaskForm.priority) {
      newErrors.priority = "Priority is required";
    }

    if (!subTaskForm.taskAssignedTo) {
      newErrors.taskAssignedTo = "Assigned User is required";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  if (loading) {
    return (
      <div className="text-center mt-5">
        <div className="spinner-border text-success"></div>
      </div>
    );
  }

  return (
    <>
      <div className="app-container">
        <Topbar />
        <div className="main-layout d-flex">
          <Navbar />

          <div className="content flex-grow-1 p-4">
            <h5 className="mb-3">
              {projectData?.projectName || "Project Details"}
            </h5>

            <div className="table-responsive">
              <table className="table table-bordered align-middle">
                <thead className="table-light">
                  <tr>
                    <th>SNo.</th>
                    <th>Milestone Name</th>
                    <th>Assigned To</th>
                    <th>Assigned Date</th>
                    <th>Due Date</th>
                    <th>Status</th>
                    <th>Create Task</th>
                  </tr>
                </thead>

                <tbody>
                  {!projectData?.milestones?.length ? (
                    <tr>
                      <td colSpan="7" className="text-center">
                        No milestones found
                      </td>
                    </tr>
                  ) : (
                    projectData.milestones.map((val, index) => (
                      <React.Fragment key={val.milestoneId}>
                        {/* ===== MAIN ROW ===== */}
                        <tr
                          onClick={() => handleRowClick(val)}
                          style={{ cursor: "pointer" }}
                        >
                          <td>{index + 1}</td>
                          <td>{val.milestoneName}</td>
                          <td>{val.assignedTo || "-"}</td>
                          <td>
                            {val.assignedDate || "-"}
                          </td>
                          <td>
                            {val.dueDate || "-"}
                          </td>
                          <td>{val.status}</td>
                          <td>
                            <button
                              className="btn btn-sm btn-primary"
                              onClick={(e) => {
                                e.stopPropagation();   // 🔥 IMPORTANT
                                openTaskModal(val);
                              }}
                            >
                              Create Task
                            </button>
                          </td>
                        </tr>

                        {/* ===== CHILD ROW ===== */}
                        {expandedRow === val.milestoneId && (
                          <tr>
                            <td colSpan="7" className="bg-light">
                              {rowLoading === val.milestoneId ? (
                                <div className="text-center p-2">
                                  <div className="spinner-border spinner-border-sm text-primary"></div>
                                </div>
                              ) : taskData[val.milestoneId]?.length ? (
                                <table className="table table-sm table-bordered mt-2">
                                  <thead className="table-secondary">
                                    <tr>
                                      <th>Task Name</th>
                                      <th>Description</th>
                                      <th>Priority</th>
                                      <th>Assigned To</th>
                                      <th>Status</th>
                                      {/** <th>Created On</th> */}
                                      <th>Create Sub Task</th>

                                    </tr>
                                  </thead>
                                  <tbody>
                                    {taskData[val.milestoneId].map((task) => (
                                      <tr key={task.taskDtlId}>
                                        <td>{task.taskName}</td>
                                        <td>{task.taskDescription}</td>
                                        <td>{task.taskSeverity}</td>
                                        <td>{task.taskAssignedTo}</td>
                                        <td>{task.taskStatus}</td>
                                        {/** 
                                        <td>
                                          {new Date(
                                            task.createdOn
                                           ).toLocaleDateString()}
                                        </td>
                                        */}
                                        <td>
                                          <button
                                            className="btn btn-sm btn-primary"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              openSubTaskModal(task, val);
                                            }}
                                          >
                                            Add Sub Task
                                          </button>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              ) : (
                                <div className="text-muted p-2">
                                  No tasks found for this milestone
                                </div>
                              )}
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {showModal && (
              <div className="modal fade show d-block">
                <div className="modal-dialog">
                  <div className="modal-content">

                    <div className="modal-header">
                      <h5>Create Task</h5>
                      <button className="btn-close" onClick={closeModal}></button>
                    </div>

                    {successMsg && (
                      <div className="success-text">
                        {successMsg}
                      </div>
                    )}

                    <div className="modal-body">

                      <input
                        type="text"
                        name="taskName"
                        placeholder="Task Name"
                        className="form-control mb-2"
                        onChange={handleChange}
                      />
                      {errors.taskName && (
                        <div className="text-danger small">{errors.taskName}</div>
                      )}

                      <textarea
                        name="taskDescription"
                        placeholder="Description"
                        className="form-control mb-2"
                        onChange={handleChange}
                      />

                      <select
                        name="priority"
                        value={taskForm.priority}
                        onChange={handleChange}
                        className="form-control mb-2"
                      >
                        <option value="">Select Priority</option>
                        <option value="1">High</option>
                        <option value="2">Medium</option>
                        <option value="3">Low</option>
                      </select>

                      {errors.priority && (
                        <div className="text-danger small">{errors.priority}</div>
                      )}

                      <UserSearch
                        onUserSelect={handleUserSelect}
                        selectedUser={selectedUser}
                      />

                      {errors.taskAssignedTo && (
                        <div className="text-danger small mt-1">
                          {errors.taskAssignedTo}
                        </div>
                      )}

                    </div>

                    <div className="modal-footer">
                      <button className="btn btn-secondary" onClick={closeModal}>
                        Cancel
                      </button>
                      <button className="btn btn-success" onClick={saveTask}>
                        Save
                      </button>
                    </div>

                  </div>
                </div>
              </div>
            )}


            {showSubModal && (
              <div className="modal fade show d-block">
                <div className="modal-dialog">
                  <div className="modal-content">

                    <div className="modal-header">
                      <h5 className="modal-title">Add Sub Task</h5>
                      <button
                        type="button"
                        className="btn-close"
                        onClick={() => setShowSubModal(false)}
                      ></button>
                    </div>

                    <div className="modal-body">

                      <input
                        type="text"
                        name="taskName"
                        placeholder="Task Name"
                        className="form-control mb-2"
                        onChange={handleSubTaskChange}
                      />

                      <textarea
                        name="taskDescription"
                        placeholder="Description"
                        className="form-control mb-2"
                        onChange={handleSubTaskChange}
                      />

                      <select
                        name="priority"
                        className="form-control mb-2"
                        onChange={handleSubTaskChange}
                      >
                        <option value="">Select Priority</option>
                        <option value="1">High</option>
                        <option value="2">Medium</option>
                        <option value="3">Low</option>
                      </select>


                      <UserSearch
                        onUserSelect={handleSubUserSelect}
                        selectedUser={selectedSubUser}
                      />



                    </div>

                    <div className="modal-footer">
                      <button
                        className="btn btn-secondary"
                        onClick={() => setShowSubModal(false)}
                      >
                        Cancel
                      </button>
                      <button
                        className="btn btn-success"
                        onClick={saveSubTaskHandler}
                      >
                        Save
                      </button>
                    </div>

                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="text-danger mt-2">{error}</div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ProjectDetails;