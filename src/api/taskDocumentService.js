import { authFetch, authFetchMultipart } from "../utils/authFetch";

/**
 * Fetch all documents for a task.
 * @param {number} taskDtlId
 */
export const getTaskDocuments = async (taskDtlId) => {
  const res = await authFetch(`/v1/task-documents/${taskDtlId}`);
  if (!res.ok) throw new Error(`Failed to fetch documents: ${res.status}`);
  const json = await res.json();
  return json.data ?? [];
};

/**
 * Upload one or more files for a task.
 * @param {{ taskDtlId, projectId, milestoneId, uploadedBy }} meta
 * @param {File[]} files
 * @returns {{ uploaded: object[], errors: string[], message: string }}
 */
export const uploadTaskDocuments = async (meta, files) => {
  const form = new FormData();
  form.append("taskDtlId",   meta.taskDtlId);
  form.append("projectId",   meta.projectId);
  form.append("milestoneId", meta.milestoneId);
  form.append("uploadedBy",  meta.uploadedBy);
  files.forEach((f) => form.append("files", f));

  // authFetchMultipart — skips Content-Type so browser sets multipart boundary
  const res = await authFetchMultipart(`/v1/task-documents/upload`, {
    method: "POST",
    body:   form,
  });

  const json = await res.json();
  if (!res.ok && json.uploaded?.length === 0)
    throw new Error(json.message || "Upload failed");
  return json;
};

/**
 * Delete a document record + physical file.
 * @param {number} docId
 * @param {string} deletedBy  userId
 */
export const deleteTaskDocument = async (docId, deletedBy) => {
  const res = await authFetch(
    `/v1/task-documents/${docId}?deletedBy=${encodeURIComponent(deletedBy)}`,
    { method: "DELETE" }
  );
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || "Delete failed");
  return json;
};

/**
 * Trigger browser download for a document.
 * Opens in new tab — browser handles inline vs download by MIME type.
 * Token is passed as query param since window.open cannot set headers.
 */
export const downloadTaskDocument = (docId, taskDtlId) => {
  const token = localStorage.getItem("pmToken") ?? "";
  window.open(
    `/v1/task-documents/download/${docId}?taskDtlId=${taskDtlId}&access_token=${encodeURIComponent(token)}`,
    "_blank",
    "noopener,noreferrer"
  );
};