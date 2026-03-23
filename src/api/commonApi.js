import { API_URL } from "./apiConfig";


export const getApprovalAuthorities = async () => {
    const response = await fetch(
        `${API_URL}/v1/ApprovalAuthorities/GetApprovalLevel`
    );

    if (!response.ok) {
        throw new Error("Failed to fetch approval authorities");
    }

    return await response.json();
};

