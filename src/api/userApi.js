import { authFetch } from "../utils/authFetch";

// GET users with filters
export const getUsers = async (params) => {
  const query = new URLSearchParams();
  if (params?.userName) query.append("userName", params.userName);
  if (params?.userType) query.append("userType", params.userType);
  if (params?.status)   query.append("status",   params.status);

  const res = await authFetch(`/v1/users/GetUsers?${query}`);

  if (!res.ok) {
    console.error(`GetUsers failed: ${res.status} ${res.statusText}`);
    return [];
  }

  const text = await res.text();
  if (!text) return [];

  const data = JSON.parse(text);
  return Array.isArray(data) ? data : [];
};

// Search users by username (for dropdown)
export const searchUsers = async (userName) => {
  const res = await authFetch(
    `/v1/users/GetUsersByUserName?userName=${userName}`
  );
  if (!res.ok) throw new Error("Failed to search users");
  return await res.json();
};

// Add external user
export const addUser = async (data) => {
  const res = await authFetch(`/v1/users/CreateUser`, {
    method: "POST",
    body:   JSON.stringify(data),
  });
  const result = await res.json();
  if (!res.ok) throw new Error(result.message || "Failed to add user");
  return result;
};

// Update external user
export const updateUser = async (data) => {
  const res = await authFetch(`/v1/users/UpdateUser`, {
    method: "PUT",
    body:   JSON.stringify(data),
  });
  const result = await res.json();
  if (!res.ok) throw new Error(result.message || "Failed to update user");
  return result;
};

// Assign or remove admin role
export const manageAdminRole = async (data) => {
  const res = await authFetch(`/v1/users/ManageAdminRole`, {
    method: "POST",
    body:   JSON.stringify(data),
  });

  const text   = await res.text();
  const result = text ? JSON.parse(text) : {};

  if (!res.ok || result.success === false) {
    throw new Error(result.message || "Failed to update admin role");
  }
  return result;
};

// Get user authorities
export const getUserAuthorities = async (userName) => {
  const res  = await authFetch(
    `/v1/users/GetUserAuthorities?userName=${userName}`
  );
  const text = await res.text();
  const data = text ? JSON.parse(text) : [];
  if (!res.ok) throw new Error(data.message || "Failed to fetch authorities");
  return Array.isArray(data) ? data : [];
};

export const getUserProfile = async (userName) => {
  const res  = await authFetch(`/v1/users/GetUserProfiles/${userName}`);
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) throw new Error(data?.message || "Failed to fetch profile");
  return data;
};

// Get all authorities for dropdown
export const getAllAuthorities = async () => {
  const res  = await authFetch(`/v1/users/GetAllAuthorities`);
  const text = await res.text();
  const data = text ? JSON.parse(text) : [];
  if (!res.ok) throw new Error(data.message || "Failed to fetch authorities");
  return Array.isArray(data) ? data : [];
};

// Save user authorities
export const saveUserAuthorities = async (payload) => {
  const res = await authFetch(`/v1/users/SaveUserAuthorities`, {
    method: "POST",
    body:   JSON.stringify(payload),
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : {};
  if (!res.ok) throw new Error(data.message || "Failed to save authorities");
  return data;
};

// Unlock user
export const unlockUser = async (data) => {
  const res = await authFetch(`/v1/users/UnlockUser`, {
    method: "POST",
    body:   JSON.stringify(data),
  });
  const text   = await res.text();
  const result = text ? JSON.parse(text) : {};
  if (!res.ok) throw new Error(result.message || "Failed to unlock user");
  return result;
};

// Get login history
export const getLoginHistory = async (userName) => {
  const path = userName
    ? `/v1/users/GetLoginHistory?userName=${userName}`
    : `/v1/users/GetLoginHistory`;
  const res  = await authFetch(path);
  const text = await res.text();
  const data = text ? JSON.parse(text) : [];
  if (!res.ok) throw new Error(data.message || "Failed to fetch login history");
  return Array.isArray(data) ? data : [];
};

export const getExternalUserAuthorities = async (userName) => {
  const res = await authFetch(
    `/v1/users/GetExternalUserAuthorities?userName=${encodeURIComponent(userName)}`
  );
  const text = await res.text();
  const data = text ? JSON.parse(text) : [];
  if (!res.ok) throw new Error(data.message || "Failed to fetch external authorities");
  return Array.isArray(data) ? data : [];
};

// ── SuperAdmin: Advanced user search ─────────────────────────────────────
export const searchUsersAdvanced = async (filters = {}) => {
  const res  = await authFetch(`/v1/superadmin/users/search`, {  // ← added users/
    method: "POST",
    body:   JSON.stringify(filters),
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : [];
  if (!res.ok) throw new Error(data.message || "Failed to search users");
  return Array.isArray(data) ? data : [];
};

// ── SuperAdmin: Change user role ──────────────────────────────────────────
export const changeUserRole = async (targetUser, newRole) => {
  const res  = await authFetch(`/v1/superadmin/users/change-role`, {  // ← added users/
    method: "POST",
    body:   JSON.stringify({ targetUser, newRole }),
  });
  const text   = await res.text();
  const result = text ? JSON.parse(text) : {};
  if (!res.ok) throw new Error(result.message || "Failed to change role");
  return result;
};

// ── SuperAdmin: Deactivate user ───────────────────────────────────────────
export const deactivateUser = async (targetUser, remarks = null) => {
  const res  = await authFetch(`/v1/superadmin/users/deactivate`, {  // ← added users/
    method: "POST",
    body:   JSON.stringify({ targetUser, remarks }),
  });
  const text   = await res.text();
  const result = text ? JSON.parse(text) : {};
  if (!res.ok) throw new Error(result.message || "Failed to deactivate user");
  return result;
};

// ── SuperAdmin: Reactivate user ───────────────────────────────────────────
export const reactivateUser = async (targetUser) => {
  const res  = await authFetch(`/v1/superadmin/users/reactivate`, {  // ← added users/
    method: "POST",
    body:   JSON.stringify({ targetUser }),
  });
  const text   = await res.text();
  const result = text ? JSON.parse(text) : {};
  if (!res.ok) throw new Error(result.message || "Failed to reactivate user");
  return result;
};