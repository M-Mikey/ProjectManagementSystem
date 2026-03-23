import { API_URL } from "./apiConfig";

// PL submits request
export const requestTimelineChange = async (payload) => {
  try {
    const response = await fetch(
      `${API_URL}/v1/timeline/request-change`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );
    const data = await response.json();
    if (!response.ok)
      throw new Error(data.message || "Failed to submit request");
    return data;
  } catch (error) {
    console.error("requestTimelineChange error:", error);
    throw error;
  }
};

// Creator updates project timeline
export const updateProjectTimeline = async (payload) => {
  try {
    const response = await fetch(
      `${API_URL}/v1/timeline/update-project`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );

    // ✅ Check if response is JSON first
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const text = await response.text();
      throw new Error(`Server error: ${text.substring(0, 100)}`);
    }

    const data = await response.json();
    if (!response.ok)
      throw new Error(data.message || "Failed to update timeline");
    return data;
  } catch (error) {
    console.error("updateProjectTimeline error:", error);
    throw error;
  }
};

// Creator updates milestone date
export const updateMilestoneTimeline = async (payload) => {
  try {
    const response = await fetch(
      `${API_URL}/v1/timeline/update-milestone`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );
    const data = await response.json();
    if (!response.ok)
      throw new Error(data.message || "Failed to update milestone date");
    return data;
  } catch (error) {
    console.error("updateMilestoneTimeline error:", error);
    throw error;
  }
};

// Creator approves/rejects PL request
export const approveTimelineChange = async (payload) => {
  try {
    const response = await fetch(
      `${API_URL}/v1/timeline/approve-change`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );
    const data = await response.json();
    if (!response.ok)
      throw new Error(data.message || "Failed to process request");
    return data;
  } catch (error) {
    console.error("approveTimelineChange error:", error);
    throw error;
  }
};

// Get timeline change requests
export const getTimelineRequests = async (projectId, userId) => {
  try {
    const response = await fetch(
      `${API_URL}/v1/timeline/get-requests/${projectId}/${userId}`
    );
    if (!response.ok)
      throw new Error("Failed to fetch timeline requests");
    return await response.json();
  } catch (error) {
    console.error("getTimelineRequests error:", error);
    throw error;
  }
};

// Get ALL timeline requests for user (across all projects)
export const getAllTimelineRequests = async (userId) => {
  try {
    const response = await fetch(
      `${API_URL}/v1/timeline/get-all-requests/${userId}`
    );
    if (!response.ok)
      throw new Error("Failed to fetch timeline requests");
    return await response.json();
  } catch (error) {
    console.error("getAllTimelineRequests error:", error);
    throw error;
  }
};

// Get timeline history for a project
export const getTimelineHistory = async (projectId) => {
  try {
    const response = await fetch(
      `${API_URL}/v1/timeline/get-history/${projectId}`
    );
    if (!response.ok)
      throw new Error("Failed to fetch timeline history");
    return await response.json();
  } catch (error) {
    console.error("getTimelineHistory error:", error);
    throw error;
  }
};