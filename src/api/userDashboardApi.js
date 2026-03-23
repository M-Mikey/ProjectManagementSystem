import { API_URL } from "./apiConfig";

// ─────────────────────────────────────────
// USER DASHBOARD
// ─────────────────────────────────────────
export async function getUserDashboard(userId) {
  try {
    const response = await fetch(
      `${API_URL}/v1/dashboard/get-user-ack/${userId}`
    );
    if (!response.ok) throw new Error("Failed to fetch user dashboard");
    return await response.json();
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
}

// ─────────────────────────────────────────
// ACKNOWLEDGE DETAILS (Project + All Milestones)
// ─────────────────────────────────────────
export async function getUserAcknowledgeDetails(projectId, userId) {
  try {
    const response = await fetch(
      `${API_URL}/v1/dashboard/get-acknowledge/${projectId}/${userId}`
    );
    if (!response.ok) throw new Error("Failed to load acknowledge details");
    return await response.json();
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
}

// ─────────────────────────────────────────
// ACK - PROJECT (PL only)
// ─────────────────────────────────────────
export const updateProjectAcknowledge = async (payload) => {
  try {
    const response = await fetch(
      `${API_URL}/v1/dashboard/ack-project`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Failed to acknowledge project");
    return data;
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
};

// ─────────────────────────────────────────
// ACK - MILESTONE (Assigned User only)
// ─────────────────────────────────────────
export const updateMilestoneAcknowledge = async (payload) => {
  try {
    const response = await fetch(
      `${API_URL}/v1/dashboard/ack-milestone`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Failed to acknowledge milestone");
    return data;
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
};

// ─────────────────────────────────────────
// ACK - TASK (Assigned User)
// ─────────────────────────────────────────
export const updateTaskAcknowledge = async (payload) => {
  try {
    const response = await fetch(
      `${API_URL}/v1/dashboard/ack-task`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Failed to acknowledge task");
    return data;
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
};

// ─────────────────────────────────────────
// APPROVAL - GET LIST
// ─────────────────────────────────────────
export async function getApproval(userId, status) {
  try {
    const response = await fetch(
      `${API_URL}/v1/dashboard/get_approval/${userId}/${status}`
    );
    if (!response.ok) throw new Error("Failed to fetch approval data");
    return await response.json();
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
}

// ─────────────────────────────────────────
// APPROVAL - GET DETAILS
// ─────────────────────────────────────────
export async function getApprovalDetails(projectId, userId) {
  try {
    const response = await fetch(
      `${API_URL}/v1/dashboard/get_approval_details/${projectId}/${userId}`
    );
    if (!response.ok) throw new Error("Failed to load approval details");
    return await response.json();
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
}

// ─────────────────────────────────────────
// APPROVAL - SUBMIT
// ─────────────────────────────────────────
export const updateApprovalDetails = async (payload) => {
  try {
    const response = await fetch(
      `${API_URL}/v1/dashboard/insert_approval_history`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );
    const data = await response.json();
    if (!response.ok || !data.success)
      throw new Error(data.message || "Approval process failed");
    return data;
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
};

// ─────────────────────────────────────────
// APPROVAL - HISTORY
// ─────────────────────────────────────────
export const getApprovalHistory = async (projectId) => {
  try {
    const response = await fetch(
      `${API_URL}/v1/dashboard/get_approval_history/${projectId}`
    );
    if (!response.ok) throw new Error("Failed to fetch approval history");
    return await response.json();
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
};