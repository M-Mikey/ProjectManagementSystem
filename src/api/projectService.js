import { API_URL } from "./apiConfig";

export const saveProject = async (payload) => {
  const response = await fetch(`${API_URL}/v1/project/saveProject`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Failed to save project");
  }

  return response.json();
};


export async function getProjects(userId) {
  try {
    const response = await fetch(
      `${API_URL}/v1/project/GetProjects/${userId}`
    );

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
    const response = await fetch(
      `${API_URL}/v1/project/GetProjectById/${projectId}`
    );

    if (!response.ok) {
      throw new Error("Failed to fetch project");
    }

    const data = await response.json();
    return data;

  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
}

export const addProject = async (data) => {
  const res = await fetch(`${API_URL}/v1/users/add`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
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
  const response = await fetch(`${API_URL}/v1/project/updateProject`, {
    method: "POST",   
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Failed to update project");
  return data;
};

export const updateMilestone = async (payload) => {
  const response = await fetch(`${API_URL}/v1/project/updateMilestone`, {
    method: "POST",  
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Failed to update milestone");
  return data;
};