import { API_URL } from "./apiConfig";

export const getAppLevel = async (userName) => {
  const response = await fetch(
    `${API_URL}/v1/users/GetUserDetails/${userName}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json"
      }
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch user details");
  }

  return await response.json();
};
