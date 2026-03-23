import { API_URL } from "./apiConfig";

export const getNotifications = async (userId) => {
  const response = await fetch(`${API_URL}/v1/notifications/get/${userId}`);
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Failed to fetch notifications");
  return data;
};

export const markNotificationRead = async (notifId, userId) => {
  const response = await fetch(`${API_URL}/v1/notifications/markRead`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ notifId, userId }),
  });
  return await response.json();
};

export const markAllNotificationsRead = async (userId) => {
  const response = await fetch(`${API_URL}/v1/notifications/markAllRead`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId }),
  });
  return await response.json();
};