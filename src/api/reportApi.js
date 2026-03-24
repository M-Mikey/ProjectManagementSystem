import { API_URL } from "./apiConfig";

// ─────────────────────────────────────────────────────────────────
// Shared safe fetch — checks content-type before parsing JSON
// ─────────────────────────────────────────────────────────────────
const safeFetch = async (url) => {
  const response = await fetch(url);

  const contentType = response.headers.get("content-type") || "";

  if (!contentType.includes("application/json")) {
    // Server returned HTML (404 page, 500 error page, redirect, etc.)
    const text = await response.text();
    console.error(`[API] Non-JSON response from ${url}:`, response.status, text.slice(0, 200));
    throw new Error(
      `Server returned HTTP ${response.status} for ${url}. ` +
      `Expected JSON but got: ${contentType || "unknown content-type"}. ` +
      `Check that VITE_API_URL is set correctly (currently: "${API_URL}") ` +
      `and that the endpoint exists.`
    );
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || `HTTP ${response.status} from ${url}`);
  }

  return data;
};

// ─────────────────────────────────────────────────────────────────
// ✅ PRIMARY — single dashboard call (replaces all individual calls)
// ─────────────────────────────────────────────────────────────────

/**
 * Fetches all report data in one request.
 * Returns: { projectSummary, stv, planVsActual, utilization,
 *             activity, audit, approvalHistory, revisionHistory, dateHistory }
 */
export const getDashboard = async (userId) => {
  const url = `${API_URL}/v1/reports/dashboard?userId=${encodeURIComponent(userId)}`;
  console.debug("[API] getDashboard →", url); // remove after confirming URL is correct
  return safeFetch(url);
};

// ─────────────────────────────────────────────────────────────────
// 🔁 LEGACY — kept for reference; no longer called by Reports.jsx
// ─────────────────────────────────────────────────────────────────

export const getProjectReport       = (userId)    => safeFetch(`${API_URL}/v1/reports/project?userId=${encodeURIComponent(userId)}`);
export const getStvReport           = (projectId) => safeFetch(`${API_URL}/v1/reports/stv?projectId=${projectId}`);
export const getTaskApprovalHistory = (projectId) => safeFetch(`${API_URL}/v1/reports/approval-history?projectId=${projectId}`);
export const getTaskRevisionHistory = (projectId) => safeFetch(`${API_URL}/v1/reports/revision-history?projectId=${projectId}`);
export const getTaskDateHistory     = (projectId) => safeFetch(`${API_URL}/v1/reports/date-history?projectId=${projectId}`);