import { authFetch } from "../utils/authFetch";

export const createTask = async (payload) => {
  try {
    const response = await authFetch(`/v1/Task/saveTask`, {
      method: "POST",
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to create task");
    }

    return data;
  } catch (error) {
    console.error("createTask API error:", error);
    throw error;
  }
};

export const saveSubTask = async (payload) => {
  const response = await authFetch(`/v1/Task/save-sub-task`, {
    method: "POST",
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error("Server Error:", data);
    throw new Error(data.message || "Server error");
  }

  return data;
};

export const getTasksByMilestone = async (projectId, milestoneId) => {
  try {
    const response = await authFetch(
      `/v1/Task/by-milestone?projectId=${projectId}&milestoneId=${milestoneId}`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch tasks: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching tasks by milestone:", error);
    throw error;
  }
};

export const createRemark = async (payload) => {
  const response = await authFetch(`/v1/Task/AddRemark`, {
    method: "POST",
    body: JSON.stringify(payload),
  });

  return await response.json();
};

export const getRemarksByTask = async (payload) => {
  const response = await authFetch(`/v1/Task/GetRemarksByTask`, {
    method: "POST",
    body: JSON.stringify(payload),
  });

  return await response.json();
};

// Replaced axios with authFetch for consistency and JWT support
export const getTasksByUser = async (userId) => {
  const response = await authFetch(`/v1/Task/GetTasksByUser/${userId}`);
  if (!response.ok) throw new Error("Failed to fetch tasks by user");
  return await response.json();
};

export const updateTask = async (payload) => {
  const response = await authFetch(`/v1/Task/updateTask`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Failed to update task");
  return data;
};

export const updateTaskStatus = async (payload) => {
  const response = await authFetch(`/v1/Task/updateTaskStatus`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Failed to update task status");
  return data;
};

export const submitTaskCompletion = async (payload) => {
  const response = await authFetch(`/v1/Task/submitTaskCompletion`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok)
    throw new Error(data.message || "Failed to submit task completion");
  return data;
};

export const getTaskCompletionApprovals = async (userId, status) => {
  const response = await authFetch(
    `/v1/Task/getTaskCompletionApprovals/${userId}/${status}`
  );
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Failed to fetch approvals");
  return data;
};

export const updateTaskCompletionApproval = async (payload) => {
  const response = await authFetch(`/v1/Task/updateTaskCompletionApproval`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Failed to update approval");
  return data;
};

export const submitTaskAssignment = async (payload) => {
  const response = await authFetch(`/v1/Task/submitTaskAssignment`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok)
    throw new Error(data.message || "Failed to submit task assignment");
  return data;
};

export const getTaskAssignmentApprovals = async (userId, status) => {
  const response = await authFetch(
    `/v1/Task/getTaskAssignmentApprovals/${userId}/${status}`
  );
  const data = await response.json();
  if (!response.ok)
    throw new Error(data.message || "Failed to fetch assignment approvals");
  return data;
};

export const updateTaskAssignmentApproval = async (payload) => {
  const response = await authFetch(`/v1/Task/updateTaskAssignmentApproval`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok)
    throw new Error(data.message || "Failed to update assignment approval");
  return data;
};

export const autoCloseMilestone = async (payload) => {
  try {
    const response = await authFetch(`/v1/Task/auto-close-milestone`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok)
      throw new Error(data.message || "Failed to close milestone");
    return data;
  } catch (error) {
    console.error("autoCloseMilestone error:", error);
    throw error;
  }
};

export const autoCloseProject = async (payload) => {
  try {
    const response = await authFetch(`/v1/Task/auto-close-project`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok)
      throw new Error(data.message || "Failed to close project");
    return data;
  } catch (error) {
    console.error("autoCloseProject error:", error);
    throw error;
  }
};

