import { API_URL } from "./apiConfig";

// GET users with filters
export const getUsers = async (params) => {
    const query = new URLSearchParams();
    if (params?.userName) query.append("userName", params.userName);
    if (params?.userType) query.append("userType", params.userType);
    if (params?.status)   query.append("status",   params.status);

    const res = await fetch(`${API_URL}/v1/users/GetUsers?${query}`);
    
    // Handle non-200 responses safely
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
    const res = await fetch(
        `${API_URL}/v1/users/GetUsersByUserName?userName=${userName}`
    );
    if (!res.ok) throw new Error("Failed to search users");
    return await res.json();
};

// Add external user
export const addUser = async (data) => {
    const res = await fetch(`${API_URL}/v1/users/CreateUser`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.message || "Failed to add user");
    return result;
};

// Update external user
export const updateUser = async (data) => {
    const res = await fetch(`${API_URL}/v1/users/UpdateUser`, {
        method:  "PUT",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.message || "Failed to update user");
    return result;
};

// Assign or remove admin role
export const manageAdminRole = async (data) => {
    const res = await fetch(`${API_URL}/v1/users/ManageAdminRole`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(data),
    });

    const text = await res.text();
    const result = text ? JSON.parse(text) : {};

    
    if (!res.ok || result.success === false) {
        throw new Error(result.message || "Failed to update admin role");
    }
    return result;
};

// // Get user profile
// export const getUserProfile = async (userName) => {
//     const res = await fetch(
//         `${API_URL}/v1/users/GetUserProfile/${userName}`
//     );
//     if (!res.ok) throw new Error("Failed to fetch user profile");
//     return await res.json();
// };


// Get user authorities
export const getUserAuthorities = async (userName) => {
    const res = await fetch(
        `${API_URL}/v1/users/GetUserAuthorities?userName=${userName}`
    );
    const text = await res.text();
    const data = text ? JSON.parse(text) : [];
    if (!res.ok) throw new Error(data.message || "Failed to fetch authorities");
    return Array.isArray(data) ? data : [];
};


export const getUserProfile = async (userName) => {
    const res = await fetch(
        `${API_URL}/v1/users/GetUserProfiles/${userName}`
    );
    const text = await res.text();
    const data = text ? JSON.parse(text) : null;
    if (!res.ok) throw new Error(data?.message || "Failed to fetch profile");
    return data;
};


// Get all authorities for dropdown
export const getAllAuthorities = async () => {
    const res  = await fetch(`${API_URL}/v1/users/GetAllAuthorities`);
    const text = await res.text();
    const data = text ? JSON.parse(text) : [];
    if (!res.ok) throw new Error(data.message || "Failed to fetch authorities");
    return Array.isArray(data) ? data : [];
};

// Save user authorities
export const saveUserAuthorities = async (data) => {
    const res = await fetch(`${API_URL}/v1/users/SaveUserAuthorities`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(data),
    });
    const text   = await res.text();
    const result = text ? JSON.parse(text) : {};
    if (!res.ok) throw new Error(result.message || "Failed to save authorities");
    return result;
};

// Unlock user
export const unlockUser = async (data) => {
    const res = await fetch(`${API_URL}/v1/users/UnlockUser`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(data),
    });
    const text   = await res.text();
    const result = text ? JSON.parse(text) : {};
    if (!res.ok) throw new Error(result.message || "Failed to unlock user");
    return result;
};

// Get login history
export const getLoginHistory = async (userName) => {
    const url = userName
        ? `${API_URL}/v1/users/GetLoginHistory?userName=${userName}`
        : `${API_URL}/v1/users/GetLoginHistory`;
    const res  = await fetch(url);
    const text = await res.text();
    const data = text ? JSON.parse(text) : [];
    if (!res.ok) throw new Error(data.message || "Failed to fetch login history");
    return Array.isArray(data) ? data : [];
};