import { API_URL } from "./apiConfig";
const BASE_URL = "https://localhost:7255";

export const getUsers2 = (params) =>
  fetch(`${API_URL}/v1/users?${new URLSearchParams(params)}`).then(r => r.json());


export const getUsers = async (params) => { 
  const res = await fetch(`${API_URL}/v1/users?${new URLSearchParams(params)}`);
  const data = await res.json();

  // ✅ force array
  return Array.isArray(data) ? data : data.data ?? [];
};


export async function createUser(data) {
  try {
    const res = await fetch(`${API_URL}/v1/user/CreateUser`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const result = await res.json();

    if (!res.ok) {
      return { success: false, message: result.message };
    }

    return { success: true, message: result.message };
  } catch (error) {
    return {
      success: false,
      message: "Server not reachable",
    };
  }
}

export const addUser = async (data) => {
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


export const addUser1 = async (data) => {
  const res = await fetch(`${API_URL}/users/add`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const error = await res.text();
    console.error(res);
    throw new Error("Failed to add user",error);
  }

  return true;
};
;

export const updateUser = async (data) => {
  const res = await fetch(`${API_URL}/users/update`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    throw new Error("Failed to update user");
  }

  return true;
};


export const getUserProfile = async (userName) => {
  const response = await fetch(`${API_URL}/v1/users/GetUserProfile/${userName}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json"
    }
  });

  if (!response.ok) {
    throw new Error("Failed to fetch user profile");
  }

  return await response.json();
};