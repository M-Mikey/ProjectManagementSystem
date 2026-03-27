import React, { useEffect, useState, useCallback } from "react";
import "../styles/ProjectDetails.css";
import Topbar from "../components/Navbar/Topbar";
import Navbar from "../components/Navbar/Navbar";
import UserSearch from '../components/Common/UserSearch';
import { useLocation, useParams, useNavigate } from "react-router-dom";
import { getProjectById } from "../api/projectService";
import {
  createTask,
  saveSubTask as saveSubTaskApi,
  getTasksByMilestone,
  updateTask as updateTaskApi,
  
} from "../api/taskService";
import CollabSpace from "../components/Collabspace";

import {
  requestTimelineChange,
  updateProjectTimeline,
  updateMilestoneTimeline,
  approveTimelineChange,
  getTimelineRequests,
  getTimelineHistory,
} from "../api/timelineApi";
import { updateMilestone as updateMilestoneApi } from "../api/projectService";

const MAX_LEVEL = 3;

const SEVERITY_OPTIONS = [
  { value: "1", label: "Critical" },
  { value: "2", label: "High" },
  { value: "3", label: "Medium" },
  { value: "4", label: "Low" },
];

const APPROVAL_LEVEL_OPTIONS = [
  { value: "1", label: "Level 1 - Department Head" },
  { value: "2", label: "Level 2 - Division Head" },
  { value: "3", label: "Level 3 - Operating Head" },
  { value: "4", label: "Level 4 - Director" },
  { value: "5", label: "Level 5 - Senior Director" },
];

const EMPTY_TASK_FORM = {
  taskName: "",
  taskDescription: "",
  priority: "",
  approvalLevel: "",
  taskAssignedTo: "",
  taskDueDate: "",
};

const getTaskLevel = (tasks, taskDtlId, visited = new Set()) => {
  if (visited.has(taskDtlId)) return 1;
  visited.add(taskDtlId);
  const task = tasks.find(t => t.taskDtlId === taskDtlId);
  if (!task || task.parentTaskId === 0) return 1;
  return 1 + getTaskLevel(tasks, task.parentTaskId, visited);
};

const dayBefore = (ymdStr) => {
  if (!ymdStr) return undefined;
  const d = new Date(ymdStr);
  if (isNaN(d)) return undefined;
  d.setDate(d.getDate() - 1);
  const yyyy = d.getFullYear();
  const mm   = String(d.getMonth() + 1).padStart(2, "0");
  const dd   = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const toYMD = (dateStr) => {
  if (!dateStr) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  const parsed = new Date(dateStr);
  if (!isNaN(parsed)) {
    const yyyy = parsed.getFullYear();
    const mm   = String(parsed.getMonth() + 1).padStart(2, "0");
    const dd   = String(parsed.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }
  return dateStr;
};

const getStatusClass = (status) => {
  if (!status) return "pd-badge pd-badge-default";
  const s = status.toLowerCase();
  if (s.includes("pending"))                           return "pd-badge pd-badge-pending";
  if (s.includes("active") || s.includes("progress")) return "pd-badge pd-badge-active";
  if (s.includes("complet"))                           return "pd-badge pd-badge-completed";
  if (s.includes("cancel"))                            return "pd-badge pd-badge-cancelled";
  if (s.includes("acknowledged"))                      return "pd-badge pd-badge-active";
  if (s.includes("approved"))                          return "pd-badge pd-badge-completed";
  return "pd-badge pd-badge-default";
};

const StatusBadge = ({ value }) => {
  if (!value) return <span style={{ color: "var(--pd-text-muted)" }}>—</span>;
  const cls = getStatusClass(value);
  return (
    <span className={cls}>
      <span className="pd-badge-dot"></span>
      {value}
    </span>
  );
};

const FormField = ({ label, error, children, required = true }) => (
  <div className="pd-field">
    <label className="pd-label">
      {label} {required && <span className="req">*</span>}
    </label>
    {children}
    {error && <div className="pd-field-error">⚠ {error}</div>}
  </div>
);

const ProjectDetails = () => {
  const location      = useLocation();
  const navigate      = useNavigate();
  const { projectId } = useParams();

  const [projectData, setProjectData]             = useState(null);
  const [expandedRow, setExpandedRow]             = useState(null);
  const [taskData, setTaskData]                   = useState({});
  const [loading, setLoading]                     = useState(true);
  const [rowLoading, setRowLoading]               = useState(null);
  const [error, setError]                         = useState("");
  const [showModal, setShowModal]                 = useState(false);
  const [showSubModal, setShowSubModal]           = useState(false);
  const [showEditModal, setShowEditModal]         = useState(false);
  const [selectedMilestone, setSelectedMilestone] = useState(null);
  const [selectedTask, setSelectedTask]           = useState(null);
  const [selectedUser, setSelectedUser]           = useState(null);
  const [selectedSubUser, setSelectedSubUser]     = useState(null);
  const [selectedEditUser, setSelectedEditUser]   = useState(null);
  const [successMsg, setSuccessMsg]               = useState("");
  const [taskErrors, setTaskErrors]               = useState({});
  const [subTaskErrors, setSubTaskErrors]         = useState({});
  const [editTaskErrors, setEditTaskErrors]       = useState({});
  const [saving, setSaving]                       = useState(false);
  const [subSaving, setSubSaving]                 = useState(false);
  const [editSaving, setEditSaving]               = useState(false);
  const [expandedTasks, setExpandedTasks]         = useState({});


// Add:
const [activeTab, setActiveTab] = useState("milestones");


  const [showHistoryPanel, setShowHistoryPanel] = useState(false);
const [historyData, setHistoryData]           = useState([]);
const [historyLoading, setHistoryLoading]     = useState(false);

  // ── Timeline Change State
const [showTimelineModal, setShowTimelineModal]     = useState(false);
const [timelineRequests, setTimelineRequests]       = useState([]);
const [timelineLoading, setTimelineLoading]         = useState(false);
const [timelineSaving, setTimelineSaving]           = useState(false);
const [timelineMessage, setTimelineMessage]         = useState({ text: "", type: "" });

// Form state
const [tlMode, setTlMode]                           = useState("project"); // "project" or "milestone"
const [tlProjectDate, setTlProjectDate]             = useState("");
const [tlMilestoneId, setTlMilestoneId]             = useState("");
const [tlMilestoneDate, setTlMilestoneDate]         = useState("");
const [tlReason, setTlReason]                       = useState("");
const [tlErrors, setTlErrors]                       = useState({});

// Role flags
const [isCreator, setIsCreator]                     = useState(false);
const [isPL, setIsPL]                               = useState(false);

  const [showMilestoneEditModal, setShowMilestoneEditModal] = useState(false);
  const [selectedMilestoneEdit, setSelectedMilestoneEdit]   = useState(null);
  const [milestoneEditForm, setMilestoneEditForm] = useState({
    milestoneName: "", description: "", dueDate: "", priority: "", assignedTo: ""
  });
  const [milestoneEditErrors, setMilestoneEditErrors] = useState({});
  const [milestoneEditSaving, setMilestoneEditSaving] = useState(false);
  const [milestoneEditUser, setMilestoneEditUser]     = useState(null);

  const userId   = sessionStorage.getItem("userId");
  const userRole = sessionStorage.getItem("userRole");

  const [taskForm, setTaskForm]         = useState(EMPTY_TASK_FORM);
  const [subTaskForm, setSubTaskForm]   = useState(EMPTY_TASK_FORM);
  const [editTaskForm, setEditTaskForm] = useState(EMPTY_TASK_FORM);

  /* ================= LOAD PROJECT ================= */
useEffect(() => {
  if (!userId) {
    navigate("/", { replace: true });
    return;
  }
  const loadProject = async () => {
    try {
      
      if (projectId) {
        const result  = await getProjectById(projectId);
        const project = Array.isArray(result) ? result[0] : result;
        setProjectData(project || null);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load project details");
    } finally {
      setLoading(false);
    }
  };
  loadProject();
}, [projectId, userId]);

// Auto expand milestones where current user has tasks assigned
useEffect(() => {
  if (!projectData || !userId) return;

  const autoExpand = async () => {
    for (const milestone of projectData.milestones || []) {
      try {
        const tasks = await getTasksByMilestone(
          projectData.projectId,
          milestone.milestoneId
        );

        // Check if any task in this milestone is assigned to current user
        const hasMyTask = tasks?.some(t => {
          const match      = t.taskAssignedTo?.match(/\(([^)]+)\)$/);
          const assignedId = match ? match[1] : t.taskAssignedTo;
          return String(assignedId) === String(userId);
        });

        if (hasMyTask) {
          setTaskData(prev => ({
            ...prev,
            [milestone.milestoneId]: tasks
          }));
          setExpandedRow(milestone.milestoneId);
        }
      } catch (err) {
        console.error("Auto expand error:", err);
      }
    }
  };

  autoExpand();
}, [projectData, userId]);


// Detect role when project loads
useEffect(() => {
  if (!projectData || !userId) return;

  console.log("projectData:", projectData);

  // ✅ Check PL — format: "Name (userId)"
  const plMatch  = projectData?.projectPl?.match(/\(([^)]+)\)/);
  const plId     = plMatch ? plMatch[1] : projectData?.projectPl;
  setIsPL(String(plId) === String(userId));

  // ✅ Check Creator — format: "Name (userId)"
  const creatorMatch = projectData?.createdBy?.match(/\(([^)]+)\)/);
  const creatorId    = creatorMatch
    ? creatorMatch[1]
    : projectData?.createdBy;
  setIsCreator(String(creatorId) === String(userId));

  console.log("plId:", plId, "creatorId:", creatorId, "userId:", userId);
  console.log("isPL:", String(plId) === String(userId));
  console.log("isCreator:", String(creatorId) === String(userId));

}, [projectData, userId]);



const loadTimelineHistory = async () => {
  if (!projectData) return;
  setHistoryLoading(true);
  try {
    const result = await getTimelineHistory(projectData.projectId);
    setHistoryData(result || []);
  } catch (err) {
    console.error("Failed to load timeline history:", err);
  } finally {
    setHistoryLoading(false);
  }
};
// Load timeline requests
const loadTimelineRequests = async () => {
  if (!projectData) return;
  setTimelineLoading(true);
  try {
    const result = await getTimelineRequests(
      projectData.projectId, userId
    );
    setTimelineRequests(result || []);
  } catch (err) {
    console.error("Failed to load timeline requests:", err);
  } finally {
    setTimelineLoading(false);
  }
};

  /* ================= HELPERS ================= */


  // ── Validate timeline form
const validateTimeline = () => {
  const e = {};
  const today = new Date().toISOString().split("T")[0];

  if (tlMode === "project") {
    if (!tlProjectDate)
      e.tlProjectDate = "New project date is required";
    else if (tlProjectDate <= today)
      e.tlProjectDate = "Date must be in the future";
  } else {
    if (!tlMilestoneId)
      e.tlMilestoneId = "Please select a milestone";
    if (!tlMilestoneDate)
      e.tlMilestoneDate = "New milestone date is required";
    else if (tlMilestoneDate <= today)
      e.tlMilestoneDate = "Date must be in the future";
    else if (
      projectData?.projectTimeline &&
      tlMilestoneDate > projectData.projectTimeline
    ) {
      e.tlMilestoneDate =
        "Date cannot exceed project timeline";
    }
  }

  if (!tlReason.trim())
    e.tlReason = "Reason is required";

  setTlErrors(e);
  return Object.keys(e).length === 0;
};

// ── Creator changes directly
const handleTimelineUpdate = async () => {
  if (!validateTimeline() || timelineSaving) return;
  setTimelineSaving(true);
  setTimelineMessage({ text: "", type: "" });

  try {
    let result;

    if (tlMode === "project") {
      result = await updateProjectTimeline({
        projectId:   projectData.projectId,
        newTimeline: tlProjectDate,
        changedBy:   userId,
        reason:      tlReason,
      });
    } else {
      result = await updateMilestoneTimeline({
        projectId:   projectData.projectId,
        milestoneId: Number(tlMilestoneId),
        newDueDate:  tlMilestoneDate,
        changedBy:   userId,
        reason:      tlReason,
      });
    }

    if (result?.success) {
      setTimelineMessage({
        text: "Timeline updated successfully. Full flow re-triggered.",
        type: "success"
      });
      // Reload project data
      const updated = await getProjectById(projectData.projectId);
      setProjectData(Array.isArray(updated) ? updated[0] : updated);
      await loadTimelineRequests();
      // Reset form
      setTlProjectDate("");
      setTlMilestoneId("");
      setTlMilestoneDate("");
      setTlReason("");
      setTlErrors({});
    } else {
      setTimelineMessage({
        text: result?.message || "Failed to update timeline",
        type: "error"
      });
    }
  } catch (err) {
    setTimelineMessage({
      text: err?.message || "Something went wrong",
      type: "error"
    });
  } finally {
    setTimelineSaving(false);
  }
};

// ── PL submits request
const handleTimelineRequest = async () => {
  if (!validateTimeline() || timelineSaving) return;
  setTimelineSaving(true);
  setTimelineMessage({ text: "", type: "" });

  try {
    const result = await requestTimelineChange({
      projectId:       projectData.projectId,
      milestoneId:     tlMode === "milestone"
                         ? Number(tlMilestoneId) : 0,
      requestedBy:     userId,
      newProposedDate: tlMode === "project"
                         ? tlProjectDate : tlMilestoneDate,
      reason:          tlReason,
    });

    if (result?.success) {
      setTimelineMessage({
        text: "Request submitted. Creator has been notified.",
        type: "success"
      });
      await loadTimelineRequests();
      setTlProjectDate("");
      setTlMilestoneId("");
      setTlMilestoneDate("");
      setTlReason("");
      setTlErrors({});
    } else {
      setTimelineMessage({
        text: result?.message || "Failed to submit request",
        type: "error"
      });
    }
  } catch (err) {
    setTimelineMessage({
      text: err?.message || "Something went wrong",
      type: "error"
    });
  } finally {
    setTimelineSaving(false);
  }
};

// ── Creator approves/rejects PL request
const handleApproveRequest = async (requestId, status) => {
  try {
    const remarks = status === 2
      ? prompt("Enter reason for rejection:") : "Approved";
    if (status === 2 && !remarks) return;

    const result = await approveTimelineChange({
      requestId:  requestId,
      reviewedBy: userId,
      status:     status,
      remarks:    remarks,
    });

    if (result?.success) {
      const updated = await getProjectById(projectData.projectId);
      setProjectData(Array.isArray(updated) ? updated[0] : updated);
      await loadTimelineRequests();
    }
  } catch (err) {
    console.error("Approve request failed:", err);
  }
};
  const todayStr = () => new Date().toISOString().split("T")[0];

  const isDuplicateTaskName = (name, milestoneId, editTaskDtlId = null) => {
    const existing = taskData[milestoneId] || [];
    return existing.some(
      (t) =>
        t.taskName.trim().toLowerCase() === name.trim().toLowerCase() &&
        t.taskDtlId !== editTaskDtlId
    );
  };

  const isTaskUnderApproval = (task) =>
    task?.ackStatusText === "Go back" ||
    task?.taskStatus    === "Rejected";

  const isTaskLocked = (task) => isTaskUnderApproval(task);

  const isSubTaskBlocked = (task) => {
  if (!task) return true;
  // Block if under approval/rejected
  if (isTaskUnderApproval(task)) return true;
  // ✅ Block if task not yet acknowledged by assigned user
  if (Number(task.ackStatus) === 0) return true;
  return false;
};

  // ✅ 3. NEW — only milestone assigned user can add tasks
  const canAddTask = (milestone) => {
    if (!milestone) return false;
    const match      = milestone.assignedTo?.match(/\(([^)]+)\)/);
    const assignedId = match ? match[1] : milestone.assignedTo;
     console.log("canAddTask check:", {
    assignedTo: milestone.assignedTo,
    assignedId,
    userId,
    result: String(assignedId) === String(userId)
  });
    return String(assignedId) === String(userId);
  };

  // ✅ 4. FIXED — removed PL/Admin override
  const canAddSubTask = (task) => {
    if (!task) return false;
    const match      = task.taskAssignedTo?.match(/\(([^)]+)\)$/);
    const assignedId = match ? match[1] : task.taskAssignedTo;
    return String(assignedId) === String(userId);
  };

  // ✅ 5. FIXED — removed PL/Admin override
  const canEditTask = (task) => {
    if (!task) return false;
    if (isTaskLocked(task)) return false;
    return String(task.createdBy) === String(userId);
  };

  // ✅ 6. FIXED — removed PL/Admin override
  const canEditSeverity = (task) => {
    if (!task) return false;
    return String(task.createdBy) === String(userId);
  };

  // ✅ 7. NEW — only PL or Creator can edit milestone
  const canEditMilestone = () => {
    if (!projectData) return false;
    const plMatch    = projectData?.projectPl?.match(/\(([^)]+)\)/);
    const plId       = plMatch ? plMatch[1] : projectData?.projectPl;
    const creatorMatch = projectData?.createdBy?.match(/\(([^)]+)\)/);
    const creatorId  = creatorMatch ? creatorMatch[1] : projectData?.createdBy;
    return (
      String(userId) === String(plId) ||
      String(userId) === String(creatorId)
    );
  };

  // ✅ 8. FIXED — added acknowledged status
const isMilestoneApproved = (milestone) => {
  if (!milestone) return false;
  const approvalStatus = (milestone.status || "").toLowerCase();
  const isApproved = approvalStatus === "approved" ||
                     approvalStatus === "active";
  // ✅ Also check ACK status
  const isAcked = Number(milestone.ackStatus) === 1;
  return isApproved && isAcked;
};

  /* ================= USER SELECT ================= */
  const handleUserSelect = (user) => {
    setSelectedUser(user);
    setTaskForm((prev) => ({ ...prev, taskAssignedTo: user.userName }));
    setTaskErrors((prev) => ({ ...prev, taskAssignedTo: "" }));
  };

  const handleSubUserSelect = (user) => {
    setSelectedSubUser(user);
    setSubTaskForm((prev) => ({ ...prev, taskAssignedTo: user.userName }));
    setSubTaskErrors((prev) => ({ ...prev, taskAssignedTo: "" }));
  };

  const handleEditUserSelect = (user) => {
    setSelectedEditUser(user);
    setEditTaskForm((prev) => ({ ...prev, taskAssignedTo: user.userName }));
    setEditTaskErrors((prev) => ({ ...prev, taskAssignedTo: "" }));
  };

  /* ================= MODAL OPEN/CLOSE ================= */
  const openTaskModal = (milestone) => {
    setSelectedMilestone(milestone);
    setTaskForm(EMPTY_TASK_FORM);
    setSelectedUser(null);
    setTaskErrors({});
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedUser(null);
    setSuccessMsg("");
    setTaskErrors({});
    setTaskForm(EMPTY_TASK_FORM);
  };

  const closeSubModal = () => {
    setShowSubModal(false);
    setSelectedSubUser(null);
    setSubTaskErrors({});
    setSubTaskForm(EMPTY_TASK_FORM);
  };

  const openEditModal = (task, milestone) => {
    setSelectedTask(task);
    setSelectedMilestone(milestone);

    const match      = task.taskAssignedTo?.match(/\(([^)]+)\)$/);
    const assignedId = match ? match[1] : task.taskAssignedTo;
    const assignedName = task.taskAssignedTo?.replace(/\s*\([^)]+\)$/, "").trim();

    setEditTaskForm({
      taskName:        task.taskName        || "",
      taskDescription: task.taskDescription || "",
      priority:        task.taskSeverity    || "",
      approvalLevel:   task.taskApprovalLevel
                         ? String(task.taskApprovalLevel) : "",
      taskAssignedTo:  assignedId           || "",
      taskDueDate:     task.taskDueDate     || "",
    });

    setSelectedEditUser({
      name:     assignedName || task.taskAssignedTo,
      userName: assignedId   || task.taskAssignedTo,
    });

    setEditTaskErrors({});
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setSelectedEditUser(null);
    setEditTaskErrors({});
    setEditTaskForm(EMPTY_TASK_FORM);
    setSelectedTask(null);
  };

  const openMilestoneEditModal = (milestone) => {
    setSelectedMilestoneEdit(milestone);

    const priorityMap = { "Critical": "1", "High": "2", "Medium": "3", "Low": "4" };
    const normalizedPriority =
      priorityMap[milestone.priority] || milestone.priority || "";

    const assignedRaw    = milestone.assignedTo || "";
    const matchAssigned  = assignedRaw.match(/^(.*?)\s*\(([^)]+)\)$/);
    const assignedName   = matchAssigned ? matchAssigned[1].trim() : assignedRaw;
    const assignedId     = matchAssigned ? matchAssigned[2].trim() : assignedRaw;

    setMilestoneEditForm({
      milestoneName: milestone.milestoneName || "",
      description:   milestone.description   || "",
      dueDate:       toYMD(milestone.dueDate) || "",
      priority:      normalizedPriority,
      assignedTo:    assignedId,
    });
    setMilestoneEditUser(
      assignedRaw
        ? { name: assignedName, userName: assignedId }
        : null
    );
    setMilestoneEditErrors({});
    setShowMilestoneEditModal(true);
  };

  const closeMilestoneEditModal = () => {
    setShowMilestoneEditModal(false);
    setSelectedMilestoneEdit(null);
    setMilestoneEditErrors({});
    setMilestoneEditUser(null);
  };

  const handleMilestoneEditChange = (e) => {
    const { name, value } = e.target;
    setMilestoneEditForm(prev => ({ ...prev, [name]: value }));
    setMilestoneEditErrors(prev => ({ ...prev, [name]: "" }));
  };

  const handleMilestoneEditUserSelect = (user) => {
    setMilestoneEditUser(user);
    setMilestoneEditForm(prev => ({ ...prev, assignedTo: user.userName }));
    setMilestoneEditErrors(prev => ({ ...prev, assignedTo: "" }));
  };

  const validateMilestoneEdit = () => {
    const e = {};
    if (!milestoneEditForm.milestoneName.trim())
      e.milestoneName = "Milestone name is required";
    if (!milestoneEditForm.description.trim())
      e.description = "Description is required";
    if (!milestoneEditForm.dueDate)
      e.dueDate = "Due date is required";
    else if (milestoneEditForm.dueDate < todayStr())
      e.dueDate = "Due date cannot be in the past";
    else {
      const projectTimeline = projectData?.projectTimeline;
      if (projectTimeline &&
          milestoneEditForm.dueDate > toYMD(projectTimeline)) {
        e.dueDate = "Due date must be on or before project target date";
      }
    }
    if (!milestoneEditForm.priority)   e.priority   = "Priority is required";
    if (!milestoneEditForm.assignedTo) e.assignedTo = "Assigned To is required";
    setMilestoneEditErrors(e);
    return Object.keys(e).length === 0;
  };

  const saveMilestoneEdit = async () => {
    if (!validateMilestoneEdit()) return;
    if (milestoneEditSaving) return;
    setMilestoneEditSaving(true);
    setError("");

    try {
      const payload = {
        milestoneId:   selectedMilestoneEdit.milestoneId,
        milestoneName: milestoneEditForm.milestoneName.trim(),
        description:   milestoneEditForm.description.trim(),
        dueDate:       milestoneEditForm.dueDate,
        priority:      milestoneEditForm.priority,
        assignedTo:    milestoneEditForm.assignedTo,
        modifiedBy:    userId,
      };

      const result = await updateMilestoneApi(payload);

      if (result?.success) {
        const updated = await import("../api/projectService")
          .then(m => m.getProjectById(projectData.projectId));
        if (updated)
          setProjectData(Array.isArray(updated) ? updated[0] : updated);

        setSuccessMsg(
          result?.reApproval
            ? "Milestone updated. Due date changed — sent for re-approval."
            : "Milestone updated successfully."
        );
        closeMilestoneEditModal();
        setTimeout(() => setSuccessMsg(""), 3000);
      } else {
        setError(result?.message || "Failed to update milestone");
      }
    } catch (err) {
      console.error(err);
      setError("Error updating milestone");
    } finally {
      setMilestoneEditSaving(false);
    }
  };

  /* ================= CHANGE HANDLERS ================= */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setTaskForm((prev) => ({ ...prev, [name]: value }));
    setTaskErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSubTaskChange = (e) => {
    const { name, value } = e.target;
    setSubTaskForm((prev) => ({ ...prev, [name]: value }));
    setSubTaskErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditTaskForm((prev) => ({ ...prev, [name]: value }));
    setEditTaskErrors((prev) => ({ ...prev, [name]: "" }));
  };

  /* ================= VALIDATION ================= */
  const validate = () => {
    const newErrors = {};

    if (!taskForm.taskName.trim()) {
      newErrors.taskName = "Task Name is required";
    } else if (
      isDuplicateTaskName(taskForm.taskName, selectedMilestone?.milestoneId)
    ) {
      newErrors.taskName =
        "A task with this name already exists in this milestone";
    }

    if (!taskForm.taskDescription?.trim())
      newErrors.taskDescription = "Description is required";
    if (!taskForm.priority)
      newErrors.priority = "Severity level is required";
    if (!taskForm.approvalLevel)
      newErrors.approvalLevel = "Approval Level is required";
    if (!taskForm.taskAssignedTo)
      newErrors.taskAssignedTo = "Assigned User is required";

    if (!taskForm.taskDueDate) {
      newErrors.taskDueDate = "Target Date is required";
    } else {
      if (taskForm.taskDueDate < todayStr())
        newErrors.taskDueDate = "Target date cannot be in the past";
      if (
        selectedMilestone?.dueDate &&
        taskForm.taskDueDate > toYMD(selectedMilestone.dueDate)
      ) {
        newErrors.taskDueDate = `Target date must be on or before milestone due date (${selectedMilestone.dueDate})`;
      }
    }

    setTaskErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateSubTask = () => {
    const newErrors = {};

    if (!subTaskForm.taskName.trim()) {
      newErrors.taskName = "Task Name is required";
    } else if (
      isDuplicateTaskName(subTaskForm.taskName, selectedMilestone?.milestoneId)
    ) {
      newErrors.taskName =
        "A task with this name already exists in this milestone";
    }

    if (!subTaskForm.taskDescription?.trim())
      newErrors.taskDescription = "Description is required";
    if (!subTaskForm.priority)
      newErrors.priority = "Severity level is required";
    if (!subTaskForm.approvalLevel)
      newErrors.approvalLevel = "Approval Level is required";
    if (!subTaskForm.taskAssignedTo)
      newErrors.taskAssignedTo = "Assigned User is required";

    if (!subTaskForm.taskDueDate) {
      newErrors.taskDueDate = "Target Date is required";
    } else {
      if (subTaskForm.taskDueDate < todayStr())
        newErrors.taskDueDate = "Target date cannot be in the past";
      if (
        selectedTask?.taskDueDate &&
        subTaskForm.taskDueDate > toYMD(selectedTask.taskDueDate)
      ) {
        newErrors.taskDueDate = `Subtask date must be on or before parent task due date (${selectedTask.taskDueDate})`;
      }
    }

    setSubTaskErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateEdit = () => {
    const newErrors = {};

    if (!editTaskForm.taskName.trim()) {
      newErrors.taskName = "Task Name is required";
    } else if (
      isDuplicateTaskName(
        editTaskForm.taskName,
        selectedMilestone?.milestoneId,
        selectedTask?.taskDtlId
      )
    ) {
      newErrors.taskName =
        "A task with this name already exists in this milestone";
    }

    if (!editTaskForm.taskDescription?.trim())
      newErrors.taskDescription = "Description is required";
    if (!editTaskForm.priority)
      newErrors.priority = "Severity level is required";
    if (!editTaskForm.approvalLevel)
      newErrors.approvalLevel = "Approval Level is required";
    if (!editTaskForm.taskAssignedTo)
      newErrors.taskAssignedTo = "Assigned User is required";

    if (!editTaskForm.taskDueDate) {
      newErrors.taskDueDate = "Target Date is required";
    } else {
      if (editTaskForm.taskDueDate < todayStr())
        newErrors.taskDueDate = "Target date cannot be in the past";
      if (
        selectedMilestone?.dueDate &&
        editTaskForm.taskDueDate > toYMD(selectedMilestone.dueDate)
      ) {
        newErrors.taskDueDate = `Target date must be on or before milestone due date (${selectedMilestone.dueDate})`;
      }
    }

    setEditTaskErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /* ================= SAVE MAIN TASK ================= */
  const saveTask = async () => {
    if (!validate()) return;
    setSaving(true);
    setError("");

    try {
      if (!selectedMilestone) {
        setError("Milestone not selected");
        return;
      }

      const payload = {
        projectId:       projectData.projectId,
        milestoneId:     selectedMilestone.milestoneId,
        parentTaskId:    0,
        taskName:        taskForm.taskName.trim(),
        taskDescription: taskForm.taskDescription?.trim(),
        taskSeverity:    parseInt(taskForm.priority),
        approvalLevel:   parseInt(taskForm.approvalLevel),
        taskAssignedTo:  taskForm.taskAssignedTo,
        taskDueDate:     taskForm.taskDueDate,
        createdBy:       userId,
      };

      const result = await createTask(payload);

      // ✅ 1. REMOVED submitTaskAssignment call
      // Task now goes directly to assigned user's dashboard for ACK

      if (result?.success) {
        await refreshTasks(selectedMilestone.milestoneId);
        setSuccessMsg("Task Created Successfully.");
        setTimeout(() => closeModal(), 1200);
      } else {
        setError(result?.message || "Failed to create task");
      }
    } catch (err) {
      console.error(err);
      setError("Error saving task");
    } finally {
      setSaving(false);
    }
  };

  /* ================= SAVE SUB TASK ================= */
  const saveSubTaskHandler = async () => {
    if (!validateSubTask()) return;
    setSubSaving(true);
    setError("");

    try {
      if (!selectedTask || !selectedMilestone) {
        setError("Parent task not selected");
        return;
      }

      if (isSubTaskBlocked(selectedTask)) {
        setError(
          "Cannot add subtasks: the parent task is under approval or already completed."
        );
        return;
      }

      const allTasks   = taskData[selectedMilestone.milestoneId] || [];
      const parentLevel = getTaskLevel(allTasks, selectedTask.taskDtlId);
      if (parentLevel >= MAX_LEVEL) {
        setError(`Maximum ${MAX_LEVEL} levels of subtasks allowed`);
        return;
      }

      const payload = {
        projectId:       projectData.projectId,
        milestoneId:     selectedMilestone.milestoneId,
        parentTaskId:    selectedTask.taskDtlId,
        taskName:        subTaskForm.taskName.trim(),
        taskDescription: subTaskForm.taskDescription?.trim(),
        taskSeverity:    parseInt(subTaskForm.priority),
        approvalLevel:   parseInt(subTaskForm.approvalLevel),
        taskAssignedTo:  subTaskForm.taskAssignedTo,
        taskDueDate:     subTaskForm.taskDueDate,
        createdBy:       userId,
      };

      const result = await saveSubTaskApi(payload);

      if (result?.success) {
        await refreshTasks(selectedMilestone.milestoneId);
        closeSubModal();
      } else {
        setError(result?.message || "Failed to create sub task");
      }
    } catch (err) {
      console.error(err);
      setError("Something went wrong");
    } finally {
      setSubSaving(false);
    }
  };

  /* ================= SAVE EDIT TASK ================= */
  const saveEditTask = async () => {
    if (!validateEdit()) return;
    setEditSaving(true);
    setError("");

    try {
      const payload = {
        taskDtlId:       selectedTask.taskDtlId,
        taskName:        editTaskForm.taskName.trim(),
        taskDescription: editTaskForm.taskDescription?.trim(),
        taskSeverity:    parseInt(editTaskForm.priority),
        approvalLevel:   parseInt(editTaskForm.approvalLevel),
        taskAssignedTo:  editTaskForm.taskAssignedTo,
        taskDueDate:     editTaskForm.taskDueDate,
        taskRevisedDate:
          editTaskForm.taskDueDate !== selectedTask.taskDueDate
            ? editTaskForm.taskDueDate
            : null,
        modifiedBy: userId,
      };

      const result = await updateTaskApi(payload);

      if (result?.success) {
        await refreshTasks(selectedMilestone.milestoneId);
        setSuccessMsg(
          result?.reApproval
            ? "Task updated. Due date changed — task has been sent for re-approval."
            : "Task updated successfully."
        );
        setTimeout(() => {
          setSuccessMsg("");
          closeEditModal();
        }, 2000);
      } else {
        setError(result?.message || "Failed to update task");
      }
    } catch (err) {
      console.error(err);
      setError("Error updating task");
    } finally {
      setEditSaving(false);
    }
  };

  /* ================= REFRESH TASKS ================= */
  const refreshTasks = async (milestoneId) => {
    try {
      const tasks = await getTasksByMilestone(
        projectData.projectId, milestoneId
      );
      setTaskData((prev) => ({ ...prev, [milestoneId]: tasks || [] }));
    } catch (err) {
      console.error(err);
      setTaskData((prev) => ({ ...prev, [milestoneId]: [] }));
    }
  };

  /* ================= ROW CLICK ================= */
  const handleRowClick = async (milestone) => {
    if (expandedRow === milestone.milestoneId) {
      setExpandedRow(null);
      return;
    }
    setRowLoading(milestone.milestoneId);
    await refreshTasks(milestone.milestoneId);
    setExpandedRow(milestone.milestoneId);
    setRowLoading(null);
  };

  const toggleTask = (taskId) => {
    setExpandedTasks((prev) => ({ ...prev, [taskId]: !prev[taskId] }));
  };

  /* ================= RENDER TASKS ================= */
  const renderTasks = useCallback(
    (tasks, parentId = 0, level = 1) => {
      return tasks
        ?.filter((t) => t.parentTaskId === parentId)
        ?.map((task) => {
          const hasChildren   = tasks.some((t) => t.parentTaskId === task.taskDtlId);
          const isExpanded    = expandedTasks[task.taskDtlId];
          const locked        = isTaskLocked(task);
          const underApproval = isTaskUnderApproval(task);
          const subBlocked    = isSubTaskBlocked(task);
          const allowSubTask  = canAddSubTask(task);  // ✅ Fixed
          const allowEdit     = canEditTask(task);    // ✅ Fixed

          return (
            <React.Fragment key={task.taskDtlId}>
              <tr
                style={{ cursor: hasChildren ? "pointer" : "default" }}
                onClick={() => hasChildren && toggleTask(task.taskDtlId)}
              >
                <td>
                  <div
                    className="pd-task-name-cell"
                    style={{ paddingLeft: `${(level - 1) * 18}px` }}
                  >
                    {level > 1 && (
                      <span className="pd-tree-indent">{"└─ "}</span>
                    )}
                    {hasChildren && (
                      <span className="pd-expand-toggle">
                        {isExpanded ? "▼" : "▶"}
                      </span>
                    )}
                    <span className="pd-task-name-text">{task.taskName}</span>
                  </div>
                </td>

                <td style={{ color: "var(--pd-text-secondary)", fontSize: 12.5 }}>
                  {task.taskDescription || "—"}
                </td>

                <td>
                  <span className={getSeverityClass(task.taskSeverity)}>
                    {task.taskSeverity || "—"}
                  </span>
                </td>

                <td>
                  {task.taskAssignedTo ? (
                    <div className="pd-assignee">
                      <div
                        className={`pd-avatar ${getAvatarColor(task.taskAssignedTo)}`}
                        style={{ width: 22, height: 22, fontSize: 9 }}
                      >
                        {getInitials(task.taskAssignedTo)}
                      </div>
                      <span style={{ fontSize: 13 }}>{task.taskAssignedTo}</span>
                    </div>
                  ) : "—"}
                </td>

                <td>
                  <span className="pd-date">{task.taskDueDate || "—"}</span>
                </td>

                <td><StatusBadge value={task.taskStatus} /></td>
                <td><StatusBadge value={task.ackStatusText} /></td>

                {/* ✅ Sub Task — only assigned user */}
                <td>
                 {/* Sub Task Button */}
{level < MAX_LEVEL && (
  <button
    className="pd-btn pd-btn-outline"
    disabled={!allowSubTask}
    title={
      !allowSubTask
        ? "Only the assigned associate can add subtasks"
        : Number(task.ackStatus) === 0
        ? "Acknowledge this task first before adding subtasks"
        : isSubTaskBlocked(task)
        ? "Parent task is under revision"
        : "Add Sub Task"
    }
    onClick={(e) => {
      e.stopPropagation();

      // ✅ Not assigned
      if (!allowSubTask) return;

      // ✅ Not yet ACK'd — show error
      if (Number(task.ackStatus) === 0) {
        setError(
          "You must acknowledge this task first before adding subtasks."
        );
        setTimeout(() => setError(""), 3000);
        return;
      }

      // ✅ Under revision
      if (isSubTaskBlocked(task)) {
        setError("Cannot add subtasks — parent task is under revision.");
        setTimeout(() => setError(""), 3000);
        return;
      }

      setSelectedTask({ ...task });
      setSelectedMilestone(
        projectData.milestones.find(
          (m) => m.milestoneId === task.milestoneId
        )
      );
      setSubTaskForm(EMPTY_TASK_FORM);
      setSelectedSubUser(null);
      setSubTaskErrors({});
      setShowSubModal(true);
    }}
  >
    <i className="bi bi-diagram-3"></i> Sub Task
  </button>
)}
                </td>

                <td>
                  <button
                    className="pd-btn pd-btn-ghost"
                    title="Add Remarks"
                    onClick={(e) => {
                      e.stopPropagation();
                      const milestoneObj = projectData.milestones.find(
                        (m) => m.milestoneId === task.milestoneId
                      );
                      navigate(
                        `/task_details/${projectData.projectId}/${task.milestoneId}`,
                        {
                          state: {
                            project:      projectData,
                            milestone:    milestoneObj,
                            selectedTask: task,
                          },
                        }
                      );
                    }}
                  >
                    <i className="bi bi-chat-left-text"></i> Remarks
                  </button>
                </td>

                {/* ✅ Edit — only task creator */}
                <td>
                  <button
                    className={`pd-btn pd-btn-icon ${!allowEdit ? "locked" : ""}`}
                    disabled={!allowEdit}
                    title={
                      underApproval
                        ? "Task is under approval — no edits allowed"
                        : locked
                        ? "Cannot edit a completed task"
                        : !allowEdit
                        ? "Only the task creator can edit"
                        : "Edit Task"
                    }
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!allowEdit) return;
                      const milestoneObj = projectData.milestones.find(
                        (m) => m.milestoneId === task.milestoneId
                      );
                      openEditModal(task, milestoneObj);
                    }}
                  >
                    <i className="bi bi-pencil"></i>
                  </button>
                </td>
              </tr>

              {isExpanded && renderTasks(tasks, task.taskDtlId, level + 1)}
            </React.Fragment>
          );
        });
    },
    [projectData, expandedTasks]
  );

  /* ================= PURE HELPERS ================= */
  const getSeverityClass = (val) => {
    if (!val) return "pd-severity pd-severity-low";
    const v = val.toLowerCase();
    if (v === "critical" || v === "1") return "pd-severity pd-severity-critical";
    if (v === "high"     || v === "2") return "pd-severity pd-severity-high";
    if (v === "medium"   || v === "3") return "pd-severity pd-severity-medium";
    return "pd-severity pd-severity-low";
  };

  const getInitials = (name) => {
    if (!name) return "?";
    const cleanName = name.replace(/\s*\([^)]+\)$/, "").trim();
    return cleanName.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase();
  };

  const avatarColors = ["", "green", "orange", "purple"];
  const getAvatarColor = (name) => {
    const i = (name || "").charCodeAt(0) % avatarColors.length;
    return avatarColors[i];
  };

  if (loading) return (
    <div className="pd-page-loading">
      <div className="pd-spinner"></div>
      Loading project...
    </div>
  );

  /* ================= RENDER ================= */
  return (
    <div className="pd-wrapper">
      <Topbar />
      <div className="main-layout d-flex">
        <Navbar />
        <div className="pd-content">

          <div className="pd-page-header">
            <h1 className="pd-page-title">
              {projectData?.projectName || "Project Details"}
            </h1>
          </div>

          {error && (
            <div className="pd-alert-error">
              <i className="bi bi-exclamation-circle-fill"></i>
              {error}
            </div>
          )}

          {successMsg && !showEditModal && (
            <div className="pd-success-msg" style={{ margin: "0 0 16px" }}>
              <i className="bi bi-check-circle-fill"></i>
              {successMsg}
            </div>
          )}

          {/* Milestone Table */}
         {/* ── Tab Bar ── */}
          <div style={{
            display: "flex", gap: "4px",
            borderBottom: "2px solid #e9ecef",
            marginBottom: "20px"
          }}>
            <button
              onClick={() => setActiveTab("milestones")}
              style={{
                background:    "none",
                border:        "none",
                borderBottom:  activeTab === "milestones"
                  ? "2px solid #1a3c5e" : "2px solid transparent",
                marginBottom:  "-2px",
                padding:       "10px 20px",
                fontWeight:    activeTab === "milestones" ? 700 : 500,
                color:         activeTab === "milestones" ? "#1a3c5e" : "#6c757d",
                cursor:        "pointer",
                fontSize:      "14px",
                transition:    "all 0.15s"
              }}
            >
              <i className="bi bi-flag me-2" />
              Milestones & Tasks
            </button>
            <button
              onClick={() => setActiveTab("collab")}
              style={{
                background:    "none",
                border:        "none",
                borderBottom:  activeTab === "collab"
                  ? "2px solid #1a3c5e" : "2px solid transparent",
                marginBottom:  "-2px",
                padding:       "10px 20px",
                fontWeight:    activeTab === "collab" ? 700 : 500,
                color:         activeTab === "collab" ? "#1a3c5e" : "#6c757d",
                cursor:        "pointer",
                fontSize:      "14px",
                transition:    "all 0.15s"
              }}
            >
              <i className="bi bi-chat-dots me-2" />
              Collaboration
            </button>
          </div>

          {/* ── Collab Tab ── */}
          {activeTab === "collab" && (
            <CollabSpace projectId={parseInt(projectId)} />
          )}

          {/* Milestone Table */}
          {activeTab === "milestones" && (
          <div className="pd-card">
            <div style={{ overflowX: "auto" }}>
              <table className="pd-table">
                <thead>
                  <tr>
                    <th style={{ width: 56 }}>#</th>
                    <th>Milestone</th>
                    <th>Assigned To</th>
                    <th>Assigned Date</th>
                    <th>Due Date</th>
                    <th>Status</th>
                    <th style={{ width: 110 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {!projectData?.milestones?.length ? (
                    <tr>
                      <td colSpan="7">
                        <div className="pd-empty">
                          <div className="pd-empty-icon">📋</div>
                          No milestones found
                        </div>
                      </td>
                    </tr>
                  ) : (
                    projectData.milestones.map((val, index) => (
                      <React.Fragment key={val.milestoneId}>

                        {/* Milestone Row */}
                        <tr
                          className="pd-milestone-row"
                          onClick={() => handleRowClick(val)}
                        >
                          <td>
                            <span className="pd-serial">{index + 1}</span>
                          </td>
                          <td>
                            <div className="pd-milestone-name">
                              <span className={`pd-chevron ${
                                expandedRow === val.milestoneId ? "open" : ""
                              }`}>▶</span>
                              {val.milestoneName}
                            </div>
                          </td>
                          <td>
                            {val.assignedTo ? (
                              <div className="pd-assignee">
                                <div className={`pd-avatar ${
                                  getAvatarColor(val.assignedTo)}`}>
                                  {getInitials(val.assignedTo)}
                                </div>
                                {val.assignedTo}
                              </div>
                            ) : (
                              <span style={{ color: "var(--pd-text-muted)" }}>
                                —
                              </span>
                            )}
                          </td>
                          <td>
                            <span className="pd-date">
                              {val.assignedDate || "—"}
                            </span>
                          </td>
                          <td>
                            <span className="pd-date">{val.dueDate || "—"}</span>
                          </td>
                          <td><StatusBadge value={val.status} /></td>
                          <td onClick={(e) => e.stopPropagation()}>
                            {/* Actions div */}
<div className="pd-btn-actions">

  {/* Add Task — only milestone assigned user */}
  <button
    className="pd-btn pd-btn-primary"
    disabled={!isMilestoneApproved(val) || !canAddTask(val)}
    title={
      !isMilestoneApproved(val)
        ? "Milestone must be approved/acknowledged first"
        : !canAddTask(val)
        ? "Only the milestone assigned user can add tasks"
        : "Add Task"
    }
    onClick={() => openTaskModal(val)}
  >
    <i className="bi bi-plus-lg"></i> Add Task
  </button>

  {/* ✅ Edit Milestone — only PL or Creator */}
  {canEditMilestone() && (
    <button
      className="pd-btn pd-btn-icon"
      title="Edit Milestone"
      onClick={(e) => {
        e.stopPropagation();
        openMilestoneEditModal(val);
      }}
    >
      <i className="bi bi-pencil"></i>
    </button>
  )}

  {/* ✅ Timeline Change — only PL or Creator — OUTSIDE canEditMilestone */}
  {(isCreator || isPL) && (
    <button
      className="pd-btn pd-btn-outline"
      title="Request Timeline Change"
      onClick={(e) => {
        e.stopPropagation();
        setShowTimelineModal(true);
        loadTimelineRequests();
      }}
    >
      <i className="bi bi-calendar-range"></i>
      Timeline
    </button>
  )}
  {/* ✅ Timeline History Button */}
{(isCreator || isPL) && (
  <button
    className="pd-btn pd-btn-ghost"
    title="View Timeline History"
    onClick={(e) => {
      e.stopPropagation();
      setShowHistoryPanel(true);
      loadTimelineHistory();
    }}
  >
    <i className="bi bi-clock-history"></i>
    History
  </button>
)}

</div>
                          </td>
                        </tr>

                        {/* Tasks Expanded Row */}
                        {expandedRow === val.milestoneId && (
                          <tr className="pd-tasks-panel">
                            <td colSpan="7">
                              <div className="pd-tasks-inner">
                                {rowLoading === val.milestoneId ? (
                                  <div className="pd-loading">
                                    <div className="pd-spinner"></div>
                                    Loading tasks…
                                  </div>
                                ) : taskData[val.milestoneId]?.length ? (
                                  <>
                                    <div className="pd-tasks-header">
                                      Tasks
                                      <span className="pd-tasks-header-count">
                                        {taskData[val.milestoneId].filter(
                                          t => t.parentTaskId === 0
                                        ).length}
                                      </span>
                                    </div>
                                    <table className="pd-task-table">
                                      <thead>
                                        <tr>
                                          <th>Task Name</th>
                                          <th>Description</th>
                                          <th>Severity</th>
                                          <th>Assigned To</th>
                                          <th>Due Date</th>
                                          <th>Status</th>
                                          <th>Ack Status</th>
                                          <th>Sub Task</th>
                                          <th>Remarks</th>
                                          <th>Edit</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {renderTasks(
                                          taskData[val.milestoneId] || []
                                        )}
                                      </tbody>
                                    </table>
                                  </>
                                ) : (
                                  <div className="pd-empty">
                                    <div className="pd-empty-icon">📝</div>
                                    No tasks yet for this milestone
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}

                      </React.Fragment>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
          )}

          {/* ===== CREATE TASK MODAL ===== */}
          {showModal && (
            <div className="pd-modal-backdrop" onClick={closeModal}>
              <div className="pd-modal" onClick={(e) => e.stopPropagation()}>
                <div className="pd-modal-header">
                  <div className="pd-modal-title">
                    <div className="pd-modal-icon">
                      <i className="bi bi-plus-circle-fill"></i>
                    </div>
                    Create Task
                  </div>
                  <button className="pd-modal-close" onClick={closeModal}>
                    ×
                  </button>
                </div>

                {successMsg && (
                  <div style={{ padding: "12px 24px 0" }}>
                    <div className="pd-success-msg">
                      <i className="bi bi-check-circle-fill"></i>
                      {successMsg}
                    </div>
                  </div>
                )}

                {selectedMilestone && (
                  <div style={{ padding: "12px 24px 0" }}>
                    <div className="pd-modal-context">
                      <i className="bi bi-flag-fill"></i>
                      Milestone: <strong>{selectedMilestone.milestoneName}</strong>
                      {selectedMilestone.dueDate && (
                        <> · Due {selectedMilestone.dueDate}</>
                      )}
                    </div>
                  </div>
                )}

                <div className="pd-modal-body">
                  <FormField label="Task Name" error={taskErrors.taskName}>
                    <input
                      type="text"
                      name="taskName"
                      placeholder="Enter task name"
                      className={`pd-input ${taskErrors.taskName ? "error" : ""}`}
                      value={taskForm.taskName}
                      onChange={handleChange}
                    />
                  </FormField>

                  <FormField label="Description" error={taskErrors.taskDescription}>
                    <textarea
                      name="taskDescription"
                      placeholder="Describe the task"
                      className={`pd-textarea ${taskErrors.taskDescription ? "error" : ""}`}
                      value={taskForm.taskDescription}
                      onChange={handleChange}
                    />
                  </FormField>

                  <div className="pd-field-row">
                    <FormField label="Target Date" error={taskErrors.taskDueDate}>
                      <input
                        type="date"
                        name="taskDueDate"
                        className={`pd-input ${taskErrors.taskDueDate ? "error" : ""}`}
                        value={taskForm.taskDueDate}
                        min={todayStr()}
                        max={
                          selectedMilestone?.dueDate
                            ? toYMD(selectedMilestone.dueDate)
                            : undefined
                        }
                        onChange={handleChange}
                      />
                    </FormField>

                    <FormField label="Severity Level" error={taskErrors.priority}>
                      <select
                        name="priority"
                        value={taskForm.priority}
                        onChange={handleChange}
                        className={`pd-select ${taskErrors.priority ? "error" : ""}`}
                      >
                        <option value="">Select severity</option>
                        {SEVERITY_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                    </FormField>
                  </div>

                  <FormField label="Approval Level" error={taskErrors.approvalLevel}>
                    <select
                      name="approvalLevel"
                      value={taskForm.approvalLevel}
                      onChange={handleChange}
                      className={`pd-select ${taskErrors.approvalLevel ? "error" : ""}`}
                    >
                      <option value="">Select approval level</option>
                      {APPROVAL_LEVEL_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </FormField>

                  <div className="pd-field">
                    <label className="pd-label">
                      Assigned To <span className="req">*</span>
                    </label>
                    <UserSearch
                      onUserSelect={handleUserSelect}
                      selectedUser={selectedUser}
                    />
                    {taskErrors.taskAssignedTo && (
                      <div className="pd-field-error">
                        ⚠ {taskErrors.taskAssignedTo}
                      </div>
                    )}
                  </div>
                </div>

                <div className="pd-modal-footer">
                  <button
                    className="pd-btn pd-btn-secondary"
                    onClick={closeModal}
                  >
                    Cancel
                  </button>
                  <button
                    className="pd-btn pd-btn-success"
                    onClick={saveTask}
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <div className="pd-spinner"
                          style={{ width: 14, height: 14, borderWidth: 2 }}>
                        </div>
                        Saving…
                      </>
                    ) : "Save Task"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ===== CREATE SUB TASK MODAL ===== */}
          {showSubModal && (
            <div className="pd-modal-backdrop" onClick={closeSubModal}>
              <div className="pd-modal" onClick={(e) => e.stopPropagation()}>
                <div className="pd-modal-header">
                  <div className="pd-modal-title">
                    <div className="pd-modal-icon">
                      <i className="bi bi-diagram-3-fill"></i>
                    </div>
                    Add Sub Task
                  </div>
                  <button className="pd-modal-close" onClick={closeSubModal}>
                    ×
                  </button>
                </div>

                {selectedTask && (
                  <div style={{ padding: "12px 24px 0" }}>
                    <div className="pd-modal-context">
                      <i className="bi bi-arrow-return-right"></i>
                      Under: <strong>{selectedTask.taskName}</strong>
                      {selectedTask.taskDueDate && (
                        <> · Due {selectedTask.taskDueDate}</>
                      )}
                    </div>
                  </div>
                )}

                <div className="pd-modal-body">
                  <FormField label="Task Name" error={subTaskErrors.taskName}>
                    <input
                      type="text"
                      name="taskName"
                      placeholder="Enter subtask name"
                      className={`pd-input ${subTaskErrors.taskName ? "error" : ""}`}
                      value={subTaskForm.taskName}
                      onChange={handleSubTaskChange}
                    />
                  </FormField>

                  <FormField label="Description" error={subTaskErrors.taskDescription}>
                    <textarea
                      name="taskDescription"
                      placeholder="Describe the subtask"
                      className={`pd-textarea ${subTaskErrors.taskDescription ? "error" : ""}`}
                      value={subTaskForm.taskDescription}
                      onChange={handleSubTaskChange}
                    />
                  </FormField>

                  <div className="pd-field-row">
                    <FormField label="Target Date" error={subTaskErrors.taskDueDate}>
                      <input
                        type="date"
                        name="taskDueDate"
                        className={`pd-input ${subTaskErrors.taskDueDate ? "error" : ""}`}
                        value={subTaskForm.taskDueDate}
                        min={todayStr()}
                        max={
                          selectedTask?.taskDueDate
                            ? toYMD(selectedTask.taskDueDate)
                            : undefined
                        }
                        onChange={handleSubTaskChange}
                      />
                    </FormField>

                    <FormField label="Severity Level" error={subTaskErrors.priority}>
                      <select
                        name="priority"
                        className={`pd-select ${subTaskErrors.priority ? "error" : ""}`}
                        onChange={handleSubTaskChange}
                        value={subTaskForm.priority}
                      >
                        <option value="">Select severity</option>
                        {SEVERITY_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                    </FormField>
                  </div>

                  <FormField label="Approval Level" error={subTaskErrors.approvalLevel}>
                    <select
                      name="approvalLevel"
                      className={`pd-select ${subTaskErrors.approvalLevel ? "error" : ""}`}
                      onChange={handleSubTaskChange}
                      value={subTaskForm.approvalLevel}
                    >
                      <option value="">Select approval level</option>
                      {APPROVAL_LEVEL_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </FormField>

                  <div className="pd-field">
                    <label className="pd-label">
                      Assigned To <span className="req">*</span>
                    </label>
                    <UserSearch
                      onUserSelect={handleSubUserSelect}
                      selectedUser={selectedSubUser}
                    />
                    {subTaskErrors.taskAssignedTo && (
                      <div className="pd-field-error">
                        ⚠ {subTaskErrors.taskAssignedTo}
                      </div>
                    )}
                  </div>
                </div>

                <div className="pd-modal-footer">
                  <button
                    className="pd-btn pd-btn-secondary"
                    onClick={closeSubModal}
                  >
                    Cancel
                  </button>
                  <button
                    className="pd-btn pd-btn-success"
                    onClick={saveSubTaskHandler}
                    disabled={subSaving}
                  >
                    {subSaving ? (
                      <>
                        <div className="pd-spinner"
                          style={{ width: 14, height: 14, borderWidth: 2 }}>
                        </div>
                        Saving…
                      </>
                    ) : "Save Sub Task"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ===== EDIT TASK MODAL ===== */}
          {showEditModal && (
            <div className="pd-modal-backdrop" onClick={closeEditModal}>
              <div className="pd-modal" onClick={(e) => e.stopPropagation()}>
                <div className="pd-modal-header">
                  <div className="pd-modal-title">
                    <div className="pd-modal-icon">
                      <i className="bi bi-pencil-fill"></i>
                    </div>
                    Edit Task
                  </div>
                  <button className="pd-modal-close" onClick={closeEditModal}>
                    ×
                  </button>
                </div>

                {selectedTask?.taskDueDate && (
                  <div style={{ padding: "12px 24px 0" }}>
                    <div
                      className="pd-modal-context"
                      style={{ background: "#fff8e1", borderColor: "#f9a825" }}
                    >
                      <i className="bi bi-exclamation-triangle-fill"
                        style={{ color: "#f9a825" }}></i>
                      <span style={{ fontSize: 12, color: "#7a5c00" }}>
                        Changing the due date will trigger re-approval.
                      </span>
                    </div>
                  </div>
                )}

                {successMsg && showEditModal && (
                  <div style={{ padding: "12px 24px 0" }}>
                    <div className="pd-success-msg">
                      <i className="bi bi-check-circle-fill"></i>
                      {successMsg}
                    </div>
                  </div>
                )}

                <div className="pd-modal-body">
                  <FormField label="Task Name" error={editTaskErrors.taskName}>
                    <input
                      type="text"
                      name="taskName"
                      placeholder="Enter task name"
                      className={`pd-input ${editTaskErrors.taskName ? "error" : ""}`}
                      value={editTaskForm.taskName}
                      onChange={handleEditChange}
                    />
                  </FormField>

                  <FormField label="Description" error={editTaskErrors.taskDescription}>
                    <textarea
                      name="taskDescription"
                      placeholder="Describe the task"
                      className={`pd-textarea ${editTaskErrors.taskDescription ? "error" : ""}`}
                      value={editTaskForm.taskDescription}
                      onChange={handleEditChange}
                    />
                  </FormField>

                  <div className="pd-field-row">
                    <FormField label="Target Date" error={editTaskErrors.taskDueDate}>
                      <input
                        type="date"
                        name="taskDueDate"
                        className={`pd-input ${editTaskErrors.taskDueDate ? "error" : ""}`}
                        value={editTaskForm.taskDueDate}
                        min={todayStr()}
                        max={
                          selectedMilestone?.dueDate
                            ? toYMD(selectedMilestone.dueDate)
                            : undefined
                        }
                        onChange={handleEditChange}
                      />
                    </FormField>

                    <FormField label="Severity Level" error={editTaskErrors.priority}>
                      <select
                        name="priority"
                        value={editTaskForm.priority}
                        onChange={handleEditChange}
                        className={`pd-select ${editTaskErrors.priority ? "error" : ""}`}
                      >
                        <option value="">Select severity</option>
                        {SEVERITY_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                    </FormField>
                  </div>

                  <FormField label="Approval Level" error={editTaskErrors.approvalLevel}>
                    <select
                      name="approvalLevel"
                      value={editTaskForm.approvalLevel}
                      onChange={handleEditChange}
                      className={`pd-select ${editTaskErrors.approvalLevel ? "error" : ""}`}
                    >
                      <option value="">Select approval level</option>
                      {APPROVAL_LEVEL_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </FormField>

                  <div className="pd-field">
                    <label className="pd-label">
                      Assigned To <span className="req">*</span>
                    </label>
                    <UserSearch
                      onUserSelect={handleEditUserSelect}
                      selectedUser={selectedEditUser}
                    />
                    {editTaskErrors.taskAssignedTo && (
                      <div className="pd-field-error">
                        ⚠ {editTaskErrors.taskAssignedTo}
                      </div>
                    )}
                  </div>
                </div>

                <div className="pd-modal-footer">
                  <button
                    className="pd-btn pd-btn-secondary"
                    onClick={closeEditModal}
                    disabled={editSaving}
                  >
                    Cancel
                  </button>
                  <button
                    className="pd-btn pd-btn-success"
                    onClick={saveEditTask}
                    disabled={editSaving}
                  >
                    {editSaving ? (
                      <>
                        <div className="pd-spinner"
                          style={{ width: 14, height: 14, borderWidth: 2 }}>
                        </div>
                        Saving…
                      </>
                    ) : "Update Task"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ===== EDIT MILESTONE MODAL ===== */}
          {showMilestoneEditModal && (
            <div className="pd-modal-backdrop" onClick={closeMilestoneEditModal}>
              <div className="pd-modal" onClick={(e) => e.stopPropagation()}>
                <div className="pd-modal-header">
                  <div className="pd-modal-title">
                    <div className="pd-modal-icon">
                      <i className="bi bi-flag-fill"></i>
                    </div>
                    Edit Milestone
                  </div>
                  <button
                    className="pd-modal-close"
                    onClick={closeMilestoneEditModal}
                  >
                    ×
                  </button>
                </div>

                <div style={{ padding: "12px 24px 0" }}>
                  <div
                    className="pd-modal-context"
                    style={{ background: "#fff8e1", borderColor: "#f9a825" }}
                  >
                    <i className="bi bi-exclamation-triangle-fill"
                      style={{ color: "#f9a825" }}></i>
                    <span style={{ fontSize: 12, color: "#7a5c00" }}>
                      Changing the due date will trigger re-approval.
                      Approval level cannot be changed.
                    </span>
                  </div>
                </div>

                <div className="pd-modal-body">
                  <FormField
                    label="Milestone Name"
                    error={milestoneEditErrors.milestoneName}
                  >
                    <input
                      type="text"
                      name="milestoneName"
                      className={`pd-input ${milestoneEditErrors.milestoneName ? "error" : ""}`}
                      value={milestoneEditForm.milestoneName}
                      onChange={handleMilestoneEditChange}
                    />
                  </FormField>

                  <FormField
                    label="Description"
                    error={milestoneEditErrors.description}
                  >
                    <textarea
                      name="description"
                      className={`pd-textarea ${milestoneEditErrors.description ? "error" : ""}`}
                      value={milestoneEditForm.description}
                      onChange={handleMilestoneEditChange}
                    />
                  </FormField>

                  <div className="pd-field-row">
                    <FormField label="Due Date" error={milestoneEditErrors.dueDate}>
                      <input
                        type="date"
                        name="dueDate"
                        className={`pd-input ${milestoneEditErrors.dueDate ? "error" : ""}`}
                        value={milestoneEditForm.dueDate}
                        min={todayStr()}
                        onChange={handleMilestoneEditChange}
                      />
                    </FormField>

                    <FormField label="Priority" error={milestoneEditErrors.priority}>
                      <select
                        name="priority"
                        className={`pd-select ${milestoneEditErrors.priority ? "error" : ""}`}
                        value={milestoneEditForm.priority}
                        onChange={handleMilestoneEditChange}
                      >
                        <option value="">Select Priority</option>
                        <option value="1">Critical</option>
                        <option value="2">High</option>
                        <option value="3">Medium</option>
                        <option value="4">Low</option>
                      </select>
                    </FormField>
                  </div>

                  <div className="pd-field">
                    <label className="pd-label">
                      Assigned To <span className="req">*</span>
                    </label>
                    <UserSearch
                      onUserSelect={handleMilestoneEditUserSelect}
                      selectedUser={milestoneEditUser}
                    />
                    {milestoneEditErrors.assignedTo && (
                      <div className="pd-field-error">
                        ⚠ {milestoneEditErrors.assignedTo}
                      </div>
                    )}
                  </div>
                </div>

                <div className="pd-modal-footer">
                  <button
                    className="pd-btn pd-btn-secondary"
                    onClick={closeMilestoneEditModal}
                    disabled={milestoneEditSaving}
                  >
                    Cancel
                  </button>
                  <button
                    className="pd-btn pd-btn-success"
                    onClick={saveMilestoneEdit}
                    disabled={milestoneEditSaving}
                  >
                    {milestoneEditSaving ? (
                      <>
                        <div className="pd-spinner"
                          style={{ width: 14, height: 14, borderWidth: 2 }}>
                        </div>
                        Saving…
                      </>
                    ) : "Update Milestone"}
                  </button>
                </div>
              </div>
            </div>
          )}


          {/* ===== TIMELINE CHANGE MODAL ===== */}
{showTimelineModal && (
  <div
    className="pd-modal-backdrop"
    onClick={() => setShowTimelineModal(false)}
  >
    <div
      className="pd-modal"
      style={{ maxWidth: 700 }}
      onClick={e => e.stopPropagation()}
    >
      {/* Header */}
      <div className="pd-modal-header">
        <div className="pd-modal-title">
          <div className="pd-modal-icon">
            <i className="bi bi-calendar-range-fill" />
          </div>
          Timeline Change
        </div>
        <button
          className="pd-modal-close"
          onClick={() => setShowTimelineModal(false)}
        >×</button>
      </div>

      <div className="pd-modal-body">

        {/* Info banner */}
        <div className={`alert ${isCreator
          ? "alert-info" : "alert-warning"} py-2 mb-3`}>
          <i className={`bi ${isCreator
            ? "bi-info-circle-fill"
            : "bi-exclamation-triangle-fill"} me-2`} />
          {isCreator
            ? "As Project Creator, you can change dates directly. Full flow will be re-triggered."
            : "As Project Leader, you can submit a change request. Creator will be notified to approve."
          }
        </div>

        {timelineMessage.text && (
          <div className={`alert alert-${
            timelineMessage.type === "success"
              ? "success" : "danger"} mb-3`}>
            {timelineMessage.text}
          </div>
        )}

        {/* Mode selector */}
        <div className="mb-3">
          <label className="form-label fw-semibold">
            Change Type
          </label>
          <div className="d-flex gap-3">
            <div className="form-check">
              <input
                className="form-check-input"
                type="radio"
                id="modeProject"
                checked={tlMode === "project"}
                onChange={() => {
                  setTlMode("project");
                  setTlErrors({});
                }}
              />
              <label className="form-check-label"
                htmlFor="modeProject">
                Project Timeline
              </label>
            </div>
            <div className="form-check">
              <input
                className="form-check-input"
                type="radio"
                id="modeMilestone"
                checked={tlMode === "milestone"}
                onChange={() => {
                  setTlMode("milestone");
                  setTlErrors({});
                }}
              />
              <label className="form-check-label"
                htmlFor="modeMilestone">
                Milestone Due Date
              </label>
            </div>
          </div>
        </div>

        {/* Project date change */}
        {tlMode === "project" && (
          <div className="mb-3">
            <label className="form-label fw-semibold">
              New Project Timeline{" "}
              <span className="text-danger">*</span>
            </label>
            <input
              type="date"
              className={`form-control ${
                tlErrors.tlProjectDate ? "is-invalid" : ""}`}
              value={tlProjectDate}
              min={new Date().toISOString().split("T")[0]}
              onChange={e => {
                setTlProjectDate(e.target.value);
                setTlErrors(p => ({ ...p, tlProjectDate: "" }));
              }}
            />
            {tlErrors.tlProjectDate && (
              <div className="invalid-feedback">
                {tlErrors.tlProjectDate}
              </div>
            )}
            <small className="text-muted">
              Current:{" "}
              {projectData?.projectTimeline || "—"}
            </small>
          </div>
        )}

        {/* Milestone date change */}
        {tlMode === "milestone" && (
          <>
            <div className="mb-3">
              <label className="form-label fw-semibold">
                Select Milestone{" "}
                <span className="text-danger">*</span>
              </label>
              <select
                className={`form-select ${
                  tlErrors.tlMilestoneId ? "is-invalid" : ""}`}
                value={tlMilestoneId}
                onChange={e => {
                  setTlMilestoneId(e.target.value);
                  setTlErrors(p => ({
                    ...p, tlMilestoneId: ""
                  }));
                }}
              >
                <option value="">-- Select Milestone --</option>
                {projectData?.milestones?.map(m => (
                  <option
                    key={m.milestoneId}
                    value={m.milestoneId}
                  >
                    {m.milestoneName} (Current: {m.dueDate || "—"})
                  </option>
                ))}
              </select>
              {tlErrors.tlMilestoneId && (
                <div className="invalid-feedback">
                  {tlErrors.tlMilestoneId}
                </div>
              )}
            </div>

            <div className="mb-3">
              <label className="form-label fw-semibold">
                New Due Date{" "}
                <span className="text-danger">*</span>
              </label>
              <input
                type="date"
                className={`form-control ${
                  tlErrors.tlMilestoneDate ? "is-invalid" : ""}`}
                value={tlMilestoneDate}
                min={new Date().toISOString().split("T")[0]}
                onChange={e => {
                  setTlMilestoneDate(e.target.value);
                  setTlErrors(p => ({
                    ...p, tlMilestoneDate: ""
                  }));
                }}
              />
              {tlErrors.tlMilestoneDate && (
                <div className="invalid-feedback">
                  {tlErrors.tlMilestoneDate}
                </div>
              )}
            </div>
          </>
        )}

        {/* Reason */}
        <div className="mb-3">
          <label className="form-label fw-semibold">
            Reason <span className="text-danger">*</span>
          </label>
          <textarea
            className={`form-control ${
              tlErrors.tlReason ? "is-invalid" : ""}`}
            rows={3}
            placeholder="Reason for timeline change..."
            value={tlReason}
            onChange={e => {
              setTlReason(e.target.value);
              setTlErrors(p => ({ ...p, tlReason: "" }));
            }}
          />
          {tlErrors.tlReason && (
            <div className="invalid-feedback">
              {tlErrors.tlReason}
            </div>
          )}
        </div>

        {/* Warning */}
        <div className="alert alert-warning py-2 mb-0">
          <i className="bi bi-exclamation-triangle-fill me-2" />
          {isCreator
            ? "Changing dates will reset all acknowledgements and approvals. Full flow will restart."
            : "Your request will be sent to the Project Creator for approval."
          }
        </div>

      </div>

      {/* Footer */}
      <div className="pd-modal-footer">
        <button
          className="pd-btn pd-btn-secondary"
          onClick={() => setShowTimelineModal(false)}
          disabled={timelineSaving}
        >
          Cancel
        </button>
        <button
          className="pd-btn pd-btn-success"
          onClick={isCreator
            ? handleTimelineUpdate
            : handleTimelineRequest}
          disabled={timelineSaving}
        >
          {timelineSaving ? (
            <>
              <div className="pd-spinner"
                style={{ width: 14, height: 14, borderWidth: 2 }} />
              Saving…
            </>
          ) : isCreator
            ? "Update Timeline"
            : "Submit Request"}
        </button>
      </div>

    </div>
  </div>
)}

{/* ===== TIMELINE REQUESTS MODAL ===== */}
{showTimelineModal && timelineRequests.length > 0 && (
  <div style={{
    position: "fixed", bottom: 20, right: 20,
    width: 400, maxHeight: 300,
    background: "#fff", borderRadius: 12,
    boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
    zIndex: 9998, overflow: "hidden",
    display: "flex", flexDirection: "column"
  }}>
    <div style={{
      background: "#0b2d6b", color: "#fff",
      padding: "10px 16px", fontWeight: 700,
      fontSize: 13
    }}>
      <i className="bi bi-clock-history me-2" />
      Pending Requests ({timelineRequests.filter(
        r => r.status === 0).length})
    </div>
    <div style={{ overflowY: "auto", flex: 1 }}>
      {timelineRequests
        .filter(r => r.status === 0)
        .map(req => (
          <div key={req.id} style={{
            padding: "10px 16px",
            borderBottom: "1px solid #f0f0f0"
          }}>
            <div style={{
              fontSize: 12, fontWeight: 600,
              color: "#0f2044"
            }}>
              {req.milestoneName
                ? `Milestone: ${req.milestoneName}`
                : "Project Timeline"}
            </div>
            <div style={{
              fontSize: 11, color: "#6c757d",
              marginBottom: 4
            }}>
              Requested by: {req.requestedByName} ·{" "}
              New Date: {req.newProposedDateText}
            </div>
            <div style={{
              fontSize: 11, color: "#6c757d",
              marginBottom: 6
            }}>
              Reason: {req.reason}
            </div>
            {isCreator && (
              <div className="d-flex gap-2">
                <button
                  className="btn btn-success btn-sm"
                  style={{ fontSize: 11 }}
                  onClick={() =>
                    handleApproveRequest(req.id, 1)}
                >
                  ✓ Approve
                </button>
                <button
                  className="btn btn-danger btn-sm"
                  style={{ fontSize: 11 }}
                  onClick={() =>
                    handleApproveRequest(req.id, 2)}
                >
                  ✗ Reject
                </button>
              </div>
            )}
          </div>
        ))}
    </div>
  </div>
)}


{/* ===== TIMELINE HISTORY BACKDROP ===== */}
{showHistoryPanel && (
  <div
    onClick={() => setShowHistoryPanel(false)}
    style={{
      position:       "fixed",
      inset:          0,
      background:     "rgba(0,0,0,0.35)",
      zIndex:         1040,
      backdropFilter: "blur(2px)",
    }}
  />
)}

{/* ===== TIMELINE HISTORY PANEL ===== */}
<div style={{
  position:      "fixed",
  top:           0,
  right:         0,
  width:         460,
  height:        "100vh",
  background:    "#fff",
  boxShadow:     "-6px 0 32px rgba(0,0,0,0.12)",
  zIndex:        1050,
  display:       "flex",
  flexDirection: "column",
  transform:     showHistoryPanel
    ? "translateX(0)" : "translateX(100%)",
  transition:    "transform 0.3s cubic-bezier(0.4,0,0.2,1)",
}}>

  {/* Header */}
  <div style={{
    background:     "#0b2d6b",
    color:          "#fff",
    padding:        "20px",
    display:        "flex",
    justifyContent: "space-between",
    alignItems:     "center",
    flexShrink:     0,
  }}>
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <div style={{
        width:          42,
        height:         42,
        borderRadius:   10,
        background:     "rgba(255,255,255,0.15)",
        display:        "flex",
        alignItems:     "center",
        justifyContent: "center",
        fontSize:       20,
        flexShrink:     0,
      }}>
        <i className="bi bi-clock-history" />
      </div>
      <div>
        <div style={{ fontWeight: 700, fontSize: 16, lineHeight: 1.2 }}>
          Timeline History
        </div>
        <div style={{ fontSize: 12, opacity: 0.75, marginTop: 3 }}>
          {projectData?.projectName}
        </div>
      </div>
    </div>
    <button
      onClick={() => setShowHistoryPanel(false)}
      style={{
        background:     "rgba(255,255,255,0.15)",
        border:         "none",
        color:          "#fff",
        fontSize:       18,
        cursor:         "pointer",
        width:          34,
        height:         34,
        borderRadius:   8,
        display:        "flex",
        alignItems:     "center",
        justifyContent: "center",
        flexShrink:     0,
      }}
    >×</button>
  </div>

  {/* Body */}
  <div style={{ overflowY: "auto", flex: 1, padding: 16 }}>

    {historyLoading ? (
      <div style={{
        display:        "flex",
        flexDirection:  "column",
        alignItems:     "center",
        justifyContent: "center",
        height:         "60%",
        gap:            12,
      }}>
        <div className="spinner-border spinner-border-sm text-primary" />
        <div style={{ fontSize: 13, color: "#6c757d" }}>
          Loading history...
        </div>
      </div>

    ) : historyData.length === 0 ? (
      <div style={{
        display:        "flex",
        flexDirection:  "column",
        alignItems:     "center",
        justifyContent: "center",
        height:         "60%",
        gap:            12,
      }}>
        <div style={{
          width:          72,
          height:         72,
          borderRadius:   "50%",
          background:     "#f0f4ff",
          display:        "flex",
          alignItems:     "center",
          justifyContent: "center",
          fontSize:       30,
        }}>
          <i className="bi bi-clock-history text-primary" />
        </div>
        <div style={{ fontWeight: 600, fontSize: 15, color: "#495057" }}>
          No history yet
        </div>
        <div style={{
          fontSize: 13, color: "#adb5bd", textAlign: "center"
        }}>
          Timeline changes will appear here
        </div>
      </div>

    ) : (
      <div style={{ position: "relative" }}>

        {/* Timeline vertical line */}
        <div style={{
          position:   "absolute",
          left:       19,
          top:        0,
          bottom:     0,
          width:      2,
          background: "#e9ecef",
          zIndex:     0,
        }} />

        {historyData.map((item, index) => (
          <div key={index} style={{
            display:      "flex",
            gap:          16,
            marginBottom: 20,
            position:     "relative",
            zIndex:       1,
          }}>

            {/* Icon dot */}
            <div style={{
              width:          40,
              height:         40,
              borderRadius:   "50%",
              background:     item.changeType === "PROJECT"
                ? "#dbeafe" : "#fef9c3",
              border:         `2px solid ${
                item.changeType === "PROJECT"
                  ? "#3b82f6" : "#f59e0b"
              }`,
              display:        "flex",
              alignItems:     "center",
              justifyContent: "center",
              flexShrink:     0,
              fontSize:       16,
            }}>
              <i className={
                item.changeType === "PROJECT"
                  ? "bi bi-calendar-range text-primary"
                  : "bi bi-flag-fill text-warning"
              } style={{ fontSize: 14 }} />
            </div>

            {/* Content */}
            <div style={{
              flex:         1,
              background:   "#f8f9fa",
              borderRadius: 10,
              padding:      "12px 14px",
              border:       "1px solid #e9ecef",
            }}>
              {/* Type badge + name */}
              <div style={{
                display:      "flex",
                alignItems:   "center",
                gap:          8,
                marginBottom: 8,
              }}>
                <span style={{
                  background:   item.changeType === "PROJECT"
                    ? "#dbeafe" : "#fef9c3",
                  color:        item.changeType === "PROJECT"
                    ? "#1d4ed8" : "#92400e",
                  borderRadius: 20,
                  padding:      "2px 10px",
                  fontSize:     10,
                  fontWeight:   700,
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                }}>
                  {item.changeType === "PROJECT"
                    ? "Project" : "Milestone"}
                </span>
                <span style={{
                  fontWeight: 600,
                  fontSize:   13,
                  color:      "#0f2044",
                }}>
                  {item.milestoneName}
                </span>
              </div>

              {/* Old → New date */}
              <div style={{
                display:      "flex",
                alignItems:   "center",
                gap:          8,
                marginBottom: 8,
                fontSize:     13,
              }}>
                <span style={{
                  background:   "#fee2e2",
                  color:        "#991b1b",
                  borderRadius: 6,
                  padding:      "3px 10px",
                  fontWeight:   600,
                  textDecoration: "line-through",
                }}>
                  {item.oldDate || "—"}
                </span>
                <i className="bi bi-arrow-right text-muted" />
                <span style={{
                  background:   "#dcfce7",
                  color:        "#166534",
                  borderRadius: 6,
                  padding:      "3px 10px",
                  fontWeight:   600,
                }}>
                  {item.newDate || "—"}
                </span>
              </div>

              {/* Details */}
              <div style={{
                fontSize: 12,
                color:    "#6c757d",
                marginBottom: 4,
              }}>
                <i className="bi bi-person-fill me-1" />
                {item.changedByName}
              </div>

              {item.reason && (
                <div style={{
                  fontSize:   12,
                  color:      "#6c757d",
                  fontStyle:  "italic",
                  marginBottom: 4,
                }}>
                  <i className="bi bi-chat-left-quote me-1" />
                  "{item.reason}"
                </div>
              )}

              <div style={{ fontSize: 11, color: "#adb5bd" }}>
                <i className="bi bi-clock me-1" />
                {item.changedOn}
              </div>
            </div>

          </div>
        ))}
      </div>
    )}
  </div>

  {/* Footer */}
  <div style={{
    padding:    "14px 16px",
    borderTop:  "1px solid #e9ecef",
    flexShrink: 0,
    background: "#f8f9fa",
    display:    "flex",
    gap:        10,
  }}>
    <button
      onClick={loadTimelineHistory}
      style={{
        flex:           1,
        background:     "#0b2d6b",
        color:          "#fff",
        border:         "none",
        borderRadius:   7,
        padding:        "9px",
        fontSize:       13,
        fontWeight:     600,
        cursor:         "pointer",
        display:        "flex",
        alignItems:     "center",
        justifyContent: "center",
        gap:            6,
      }}
    >
      <i className="bi bi-arrow-clockwise" />
      Refresh
    </button>
    <button
      onClick={() => setShowHistoryPanel(false)}
      style={{
        flex:         1,
        background:   "transparent",
        border:       "1.5px solid #dee2e6",
        borderRadius: 7,
        padding:      "9px",
        fontSize:     13,
        fontWeight:   600,
        color:        "#6c757d",
        cursor:       "pointer",
      }}
    >
      Close
    </button>
  </div>

</div>

        </div>
      </div>
    </div>
  );
};

export default ProjectDetails;