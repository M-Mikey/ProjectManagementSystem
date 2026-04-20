import { authFetch } from "../utils/authFetch";

// ─────────────────────────────────────────────────────────────────
// Shared safe fetch — checks content-type before parsing JSON
// ─────────────────────────────────────────────────────────────────
const safeFetch = async (path) => {
  const response = await authFetch(path);

  const contentType = response.headers.get("content-type") || "";

  if (!contentType.includes("application/json")) {
    const text = await response.text();
    console.error(`[API] Non-JSON response from ${path}:`, response.status, text.slice(0, 200));
    throw new Error(
      `Server returned HTTP ${response.status} for ${path}. ` +
      `Expected JSON but got: ${contentType || "unknown content-type"}.`
    );
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || `HTTP ${response.status} from ${path}`);
  }

  return data;
};

// ─────────────────────────────────────────────────────────────────
// ✅ PRIMARY — single dashboard call
// ─────────────────────────────────────────────────────────────────
export const getDashboard = async (userId) => {
  const path = `/v1/reports/dashboard?userId=${encodeURIComponent(userId)}`;
  console.debug("[API] getDashboard →", path);
  return safeFetch(path);
};

// ─────────────────────────────────────────────────────────────────
// 🔁 LEGACY — kept for reference
// ─────────────────────────────────────────────────────────────────
export const getProjectReport       = (userId)    => safeFetch(`/v1/reports/project?userId=${encodeURIComponent(userId)}`);
export const getStvReport           = (projectId) => safeFetch(`/v1/reports/stv?projectId=${projectId}`);
export const getTaskApprovalHistory = (projectId) => safeFetch(`/v1/reports/approval-history?projectId=${projectId}`);
export const getTaskRevisionHistory = (projectId) => safeFetch(`/v1/reports/revision-history?projectId=${projectId}`);
export const getTaskDateHistory     = (projectId) => safeFetch(`/v1/reports/date-history?projectId=${projectId}`);