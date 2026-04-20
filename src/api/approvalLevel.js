import { authFetch } from "../utils/authFetch";

export const getAppLevel = async (userName) => {
  const response = await authFetch(`/v1/users/GetUserDetails/${userName}`, {
    method: "GET",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch user details");
  }

  return await response.json();
};