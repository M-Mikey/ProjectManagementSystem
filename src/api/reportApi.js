import { API_URL } from "./apiConfig";

export const getProjectReport = async (userId) => {
  const response = await fetch(`${API_URL}/v1/reports/project-report/${userId}`);
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Failed to fetch report");
  return data;
};


export const getTaskApprovalHistory = async (projectId) => {
    const response = await fetch(`${API_URL}/v1/reports/task-approval-history/${projectId}`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Failed to fetch approval history");
    return data;
};


export const getTaskRevisionHistory = async (projectId) => {
    const response = await fetch(`${API_URL}/v1/reports/task-revision-history/${projectId}`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Failed to fetch revision history");
    return data;
};


export const getStvReport = async (projectId) => {
    const response = await fetch(`${API_URL}/v1/reports/stv-report/${projectId}`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Failed to fetch STV report");
    return data;
};


export const getTaskDateHistory = async (projectId) => {
    const response = await fetch(`${API_URL}/v1/reports/task-date-history/${projectId}`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Failed to fetch date history");
    return data;
};