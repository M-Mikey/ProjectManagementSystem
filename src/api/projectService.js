import { authFetch } from "../utils/authFetch";

export const saveProject = async (payload) => {
  const response = await authFetch(`/v1/project/saveProject`, {
    method: "POST",
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Failed to save project");
  }

  return response.json();
};

export async function getProjects(userId) {
  try {
    const response = await authFetch(`/v1/project/GetProjects/${userId}`);

    if (!response.ok) {
      throw new Error("Failed to fetch projects");
    }

    return await response.json();
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
}

export async function getProjectById(projectId) {
  try {
    const response = await authFetch(`/v1/project/GetProjectById/${projectId}`);

    if (!response.ok) {
      throw new Error("Failed to fetch project");
    }

    return await response.json();
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
}

export const addProject = async (data) => {
  const res = await authFetch(`/v1/users/add`, {
    method: "POST",
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error("Backend error:", errorText);
    throw new Error(errorText);
  }

  return await res.json();
};

export const updateProject = async (payload) => {
  const response = await authFetch(`/v1/project/updateProject`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Failed to update project");
  return data;
};

export const updateMilestone = async (payload) => {
  const response = await authFetch(`/v1/project/updateMilestone`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Failed to update milestone");
  return data;
};

export async function checkProjectNameExists(projectName, excludeProjectId = null) {
  const params = new URLSearchParams({ name: projectName.trim() });
  if (excludeProjectId != null) params.append("excludeId", excludeProjectId);

  const res = await authFetch(`/v1/project/CheckNameExists?${params.toString()}`);

  if (!res.ok) {
    throw new Error(`Name check failed with status ${res.status}`);
  }

  const data = await res.json();
  return data.exists;
}


export const getProjectApprovalChain = async (projectId) => {
    const response = await authFetch(`/v1/project/GetProjectApprovalChain/${projectId}`);
    if (!response.ok) throw new Error("Failed to fetch approval chain");
    return await response.json();
};

export const saveMilestone = async (payload) => {
    const response = await authFetch(`/v1/project/SaveMilestone`, {
        method: "POST",
        body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Failed to save milestone");
    return data;
};