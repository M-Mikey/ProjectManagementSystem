import { API_URL } from "./apiConfig";

// ─── GET COMMENTS ─────────────────────────────────────────────────────────────

export async function getCollabComments(projectId, page = 1, pageSize = 20) {
  try {
    const response = await fetch(
      `${API_URL}/v1/collab/${projectId}/comments?page=${page}&pageSize=${pageSize}`
    );
    if (!response.ok) throw new Error("Failed to fetch comments");
    return await response.json();
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
}

// ─── GET REPLIES ──────────────────────────────────────────────────────────────

export async function getCollabReplies(commentId) {
  try {
    const response = await fetch(
      `${API_URL}/v1/collab/comments/${commentId}/replies`
    );
    if (!response.ok) throw new Error("Failed to fetch replies");
    return await response.json();
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
}

// ─── POST COMMENT ─────────────────────────────────────────────────────────────

export async function postCollabComment(payload) {
  const response = await fetch(`${API_URL}/v1/collab/comments`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(payload),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Failed to post comment");
  return data;
}

// ─── DELETE COMMENT ───────────────────────────────────────────────────────────

export async function deleteCollabComment(commentId, deletedBy) {
  const response = await fetch(
    `${API_URL}/v1/collab/comments/${commentId}`,
    {
      method:  "DELETE",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ deletedBy }),
    }
  );

  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Failed to delete comment");
  return data;
}

// ─── UPLOAD DOCUMENT ──────────────────────────────────────────────────────────

export async function uploadCollabDocument(commentId, projectId, uploadedBy, file) {
  const formData = new FormData();
  formData.append("projectId",  projectId);
  formData.append("uploadedBy", uploadedBy);
  formData.append("file",       file);

  const response = await fetch(
    `${API_URL}/v1/collab/comments/${commentId}/documents`,
    {
      method: "POST",
      body:   formData,
      // No Content-Type header — browser sets multipart boundary automatically
    }
  );

  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Failed to upload document");
  return data;
}

// ─── GET DOCUMENTS ────────────────────────────────────────────────────────────

export async function getCollabDocuments(commentId) {
  try {
    const response = await fetch(
      `${API_URL}/v1/collab/comments/${commentId}/documents`
    );
    if (!response.ok) throw new Error("Failed to fetch documents");
    return await response.json();
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
}

// ─── GET MENTIONABLE USERS ────────────────────────────────────────────────────

export async function getMentionableUsers(searchTerm = "") {
  try {
    const query    = searchTerm ? `?search=${encodeURIComponent(searchTerm)}` : "";
    const response = await fetch(
      `${API_URL}/v1/collab/mentions/users${query}`
    );
    if (!response.ok) throw new Error("Failed to fetch users");
    return await response.json();
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
}