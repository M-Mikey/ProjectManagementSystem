import { authFetch } from "../utils/authFetch";

export const getApprovalAuthorities = async () => {
  const response = await authFetch(`/v1/ApprovalAuthorities/GetApprovalLevel`);

  if (!response.ok) {
    throw new Error("Failed to fetch approval authorities");
  }

  return await response.json();
};