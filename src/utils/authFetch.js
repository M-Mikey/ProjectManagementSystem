import { API_URL } from "../api/apiConfig";

/**
 * Central authenticated fetch utility.
 * - Attaches Bearer token from localStorage on every request
 * - Intercepts 401 globally → clears session → redirects to login
 * - Never throws on 401 — caller gets the response object back
 */
export async function authFetch(path, options = {}) {
  const token = localStorage.getItem("pmToken");

  const headers = {
    "Content-Type": "application/json",
    ...( options.headers || {} ),
    ...( token ? { Authorization: `Bearer ${token}` } : {} ),
  };

  let response;
  try {
    response = await fetch(`${API_URL}${path}`, { ...options, headers });
  } catch (networkError) {
    // Server unreachable — propagate so callers can show "Server not reachable"
    throw networkError;
  }

  if (response.status === 401) {
    clearSessionAndRedirect();
    // Return the response so any caller awaiting it doesn't hang,
    // but the redirect above will fire before any further code runs
    return response;
  }

  return response;
}

/**
 * For file upload endpoints — omits Content-Type so the browser
 * sets the correct multipart/form-data boundary automatically.
 */
export async function authFetchMultipart(path, options = {}) {
  const token = localStorage.getItem("pmToken");

  // Intentionally no Content-Type here
  const headers = {
    ...( options.headers || {} ),
    ...( token ? { Authorization: `Bearer ${token}` } : {} ),
  };

  let response;
  try {
    response = await fetch(`${API_URL}${path}`, { ...options, headers });
  } catch (networkError) {
    throw networkError;
  }

  if (response.status === 401) {
    clearSessionAndRedirect();
    return response;
  }

  return response;
}

/**
 * Clears all client-side session state and forces re-login.
 * Called on any 401 response — covers token expiry and tampering.
 */
function clearSessionAndRedirect() {
  localStorage.removeItem("pmToken");
  sessionStorage.clear();
  // Use replace so the protected page is not in browser history
  window.location.replace("/");
}