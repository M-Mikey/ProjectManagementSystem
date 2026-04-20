import { authFetch, authFetchMultipart } from "../utils/authFetch";

export async function getCollabComments(projectId, page = 1, pageSize = 20) {
  try {
    const response = await authFetch(
      `/v1/collab/${projectId}/comments?page=${page}&pageSize=${pageSize}`
    );
    if (!response.ok) throw new Error("Failed to fetch comments");
    return await response.json();
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
}

export async function getCollabReplies(commentId) {
  try {
    const response = await authFetch(
      `/v1/collab/comments/${commentId}/replies`
    );
    if (!response.ok) throw new Error("Failed to fetch replies");
    return await response.json();
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
}

export async function postCollabComment(payload) {
  const response = await authFetch(`/v1/collab/comments`, {
    method: "POST",
    body:   JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Failed to post comment");
  return data;
}

export async function deleteCollabComment(commentId, deletedBy) {
  const response = await authFetch(`/v1/collab/comments/${commentId}`, {
    method: "DELETE",
    body:   JSON.stringify({ deletedBy }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Failed to delete comment");
  return data;
}

export async function uploadCollabDocument(commentId, projectId, uploadedBy, file) {
  const formData = new FormData();
  formData.append("projectId",  projectId);
  formData.append("uploadedBy", uploadedBy);
  formData.append("file",       file);

  // authFetchMultipart — skips Content-Type so browser sets multipart boundary
  const response = await authFetchMultipart(
    `/v1/collab/comments/${commentId}/documents`,
    { method: "POST", body: formData }
  );
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Failed to upload document");
  return data;
}

export async function getCollabDocuments(commentId) {
  try {
    const response = await authFetch(
      `/v1/collab/comments/${commentId}/documents`
    );
    if (!response.ok) throw new Error("Failed to fetch documents");
    return await response.json();
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
}

export async function getMentionableUsers(searchTerm = "") {
  try {
    const query    = searchTerm ? `?search=${encodeURIComponent(searchTerm)}` : "";
    const response = await authFetch(`/v1/collab/mentions/users${query}`);
    if (!response.ok) throw new Error("Failed to fetch users");
    return await response.json();
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
}

export async function getMentionableTasks(projectId, searchTerm = "") {
  try {
    const query    = searchTerm ? `?search=${encodeURIComponent(searchTerm)}` : "";
    const response = await authFetch(
      `/v1/collab/${projectId}/mentions/tasks${query}`
    );
    if (!response.ok) throw new Error("Failed to fetch tasks");
    return await response.json();
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
}