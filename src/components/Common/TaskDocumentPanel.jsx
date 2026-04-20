// src/components/TaskDocumentPanel.jsx
import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  getTaskDocuments,
  uploadTaskDocuments,
  deleteTaskDocument,
  downloadTaskDocument,
} from "../../api/taskDocumentService";

// Icons map for common MIME types
const getMimeIcon = (mime = "") => {
  if (mime.includes("pdf"))         return "bi-file-earmark-pdf-fill text-danger";
  if (mime.includes("word"))        return "bi-file-earmark-word-fill text-primary";
  if (mime.includes("excel") ||
      mime.includes("spreadsheet")) return "bi-file-earmark-excel-fill text-success";
  if (mime.includes("powerpoint") ||
      mime.includes("presentation")) return "bi-file-earmark-ppt-fill text-warning";
  if (mime.includes("image"))       return "bi-file-earmark-image-fill text-info";
  if (mime.includes("zip"))         return "bi-file-earmark-zip-fill text-secondary";
  return "bi-file-earmark-fill text-secondary";
};

const formatSize = (kb) => {
  if (!kb) return "—";
  if (kb < 1024) return `${kb} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
};

/**
 * TaskDocumentPanel
 *
 * Props:
 *   task         {object}  — full task object from PM_TASK_DTL
 *   projectId    {number}
 *   milestoneId  {number}
 *   userId       {string}  — current logged-in user
 *   isLocked     {boolean} — true when task completed OR approval triggered
 *   isCreator    {boolean} — true if current user is task creator
 */
const TaskDocumentPanel = ({
  task,
  projectId,
  milestoneId,
  userId,
  isLocked,
  isCreator,     
  canDeleteDoc,  
}) => {
  const [docs,        setDocs]        = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [uploading,   setUploading]   = useState(false);
  const [deletingId,  setDeletingId]  = useState(null);
  const [error,       setError]       = useState("");
  const [partialErrs, setPartialErrs] = useState([]);
  const [successMsg,  setSuccessMsg]  = useState("");
  const [dragOver,    setDragOver]    = useState(false);

  const fileInputRef = useRef(null);

  const taskDtlId = task?.taskDtlId;

  // ── Load documents on mount / task change
  const loadDocs = useCallback(async () => {
    if (!taskDtlId) return;
    setLoading(true);
    setError("");
    try {
      const data = await getTaskDocuments(taskDtlId);
      setDocs(data);
    } catch (err) {
      setError("Failed to load documents.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [taskDtlId]);

  useEffect(() => { loadDocs(); }, [loadDocs]);

  const showSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(""), 3500);
  };

  // ── Upload handler — accepts File[] from input or drop
  const handleUpload = async (files) => {
    if (!files?.length)  return;
    if (isLocked)        return;
    if (!isCreator)      return;

    setUploading(true);
    setError("");
    setPartialErrs([]);

    try {
      const result = await uploadTaskDocuments(
        { taskDtlId, projectId, milestoneId, uploadedBy: userId },
        Array.from(files)
      );

      if (result.errors?.length) setPartialErrs(result.errors);
      if (result.uploaded?.length) {
        showSuccess(result.message);
        await loadDocs();
      } else {
        setError("All files failed to upload. See errors below.");
      }
    } catch (err) {
      setError(err.message || "Upload failed.");
    } finally {
      setUploading(false);
      // Reset input so same file can be re-selected after error
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const onFileInputChange = (e) => handleUpload(e.target.files);

  // ── Drag & drop
  const onDragOver  = (e) => { e.preventDefault(); setDragOver(true);  };
  const onDragLeave = (e) => { e.preventDefault(); setDragOver(false); };
  const onDrop      = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleUpload(e.dataTransfer.files);
  };

  // ── Delete handler
  const handleDelete = async (docId) => {
    if (!window.confirm("Remove this document?")) return;
    setDeletingId(docId);
    setError("");
    try {
      await deleteTaskDocument(docId, userId);
      setDocs((prev) => prev.filter((d) => d.docId !== docId));
      showSuccess("Document removed.");
    } catch (err) {
      setError(err.message || "Delete failed.");
    } finally {
      setDeletingId(null);
    }
  };

  // ─────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────
  return (
    <div style={{ marginTop: 24 }}>

      {/* ── Section header */}
      <div style={{
        display:        "flex",
        alignItems:     "center",
        justifyContent: "space-between",
        marginBottom:   10,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <i className="bi bi-paperclip"
            style={{ fontSize: 16, color: "#1a3c5e" }} />
          <span style={{
            fontWeight: 700, fontSize: 14, color: "#1a3c5e"
          }}>
            Documents
          </span>
          {docs.length > 0 && (
            <span style={{
              background:   "#e8edf5",
              color:        "#1a3c5e",
              borderRadius: 20,
              padding:      "1px 9px",
              fontSize:     11,
              fontWeight:   700,
            }}>
              {docs.length}
            </span>
          )}
        </div>

    
        {!isLocked && (canDeleteDoc ? canDeleteDoc(docs) : isCreator) && (
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            style={{
              display:      "flex",
              alignItems:   "center",
              gap:          5,
              background:   "#1a3c5e",
              color:        "#fff",
              border:       "none",
              borderRadius: 7,
              padding:      "6px 14px",
              fontSize:     12,
              fontWeight:   600,
              cursor:       uploading ? "not-allowed" : "pointer",
              opacity:      uploading ? 0.7 : 1,
              width:"fit-content",
            }}
          >
            {uploading
              ? <><span className="spinner-border spinner-border-sm me-1"
                  style={{ width: 12, height: 12, borderWidth: 2 }} />
                  Uploading…</>
              : <><i className="bi bi-upload" /> Upload Files</>
            }
          </button>
        )}

        {/* Locked indicator */}
        {isLocked && (
          <span style={{
            fontSize:     11,
            color:        "#856404",
            background:   "#fff3cd",
            border:       "1px solid #ffc107",
            borderRadius: 6,
            padding:      "3px 10px",
            display:      "flex",
            alignItems:   "center",
            gap:          5,
          }}>
            <i className="bi bi-lock-fill" />
            Upload locked
          </span>
        )}
      </div>

      {/* Hidden file input — multiple allowed */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        style={{ display: "none" }}
        onChange={onFileInputChange}
        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.txt,.zip"
      />

      {/* ── Drag & drop zone — only shown when not locked and is creator */}
      {isCreator && !isLocked && (
        <div
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          style={{
            border:         `2px dashed ${dragOver ? "#1a3c5e" : "#c8d6e5"}`,
            borderRadius:   10,
            padding:        "14px 20px",
            textAlign:      "center",
            cursor:         "pointer",
            background:     dragOver ? "#eef3fa" : "#f8fafc",
            marginBottom:   12,
            transition:     "all 0.15s",
          }}
        >
          <i className="bi bi-cloud-upload"
            style={{
              fontSize: 22,
              color:    dragOver ? "#1a3c5e" : "#90a4b8",
              display:  "block",
              marginBottom: 4,
            }} />
          <span style={{ fontSize: 12, color: "#6c757d" }}>
            Drag & drop files here, or{" "}
            <span style={{ color: "#1a3c5e", fontWeight: 600 }}>
              click to browse
            </span>
          </span>
          <div style={{ fontSize: 11, color: "#adb5bd", marginTop: 4 }}>
            PDF, Word, Excel, PPT, Images, ZIP · Max 20 MB per file
          </div>
        </div>
      )}

      {/* ── Alerts */}
      {error && (
        <div style={{
          background:   "#fef2f2",
          border:       "1px solid #fca5a5",
          borderRadius: 7,
          padding:      "8px 12px",
          fontSize:     12,
          color:        "#b91c1c",
          marginBottom: 8,
          display:      "flex",
          alignItems:   "flex-start",
          gap:          8,
        }}>
          <i className="bi bi-exclamation-circle-fill"
            style={{ marginTop: 1, flexShrink: 0 }} />
          <span>{error}</span>
        </div>
      )}

      {partialErrs.length > 0 && (
        <div style={{
          background:   "#fffbeb",
          border:       "1px solid #fcd34d",
          borderRadius: 7,
          padding:      "8px 12px",
          fontSize:     12,
          color:        "#92400e",
          marginBottom: 8,
        }}>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>
            <i className="bi bi-exclamation-triangle-fill me-1" />
            Some files failed:
          </div>
          <ul style={{ margin: 0, paddingLeft: 16 }}>
            {partialErrs.map((e, i) => <li key={i}>{e}</li>)}
          </ul>
        </div>
      )}

      {successMsg && (
        <div style={{
          background:   "#f0fdf4",
          border:       "1px solid #86efac",
          borderRadius: 7,
          padding:      "8px 12px",
          fontSize:     12,
          color:        "#166534",
          marginBottom: 8,
          display:      "flex",
          alignItems:   "center",
          gap:          8,
        }}>
          <i className="bi bi-check-circle-fill" />
          {successMsg}
        </div>
      )}

      {/* ── Document list */}
      {loading ? (
        <div style={{
          display:      "flex",
          alignItems:   "center",
          gap:          8,
          padding:      "12px 0",
          color:        "#6c757d",
          fontSize:     13,
        }}>
          <span className="spinner-border spinner-border-sm" />
          Loading documents…
        </div>
      ) : docs.length === 0 ? (
        <div style={{
          fontSize:   12,
          color:      "#adb5bd",
          padding:    "8px 0",
          fontStyle:  "italic",
        }}>
          No documents uploaded yet.
          {isCreator && !isLocked && " Upload files using the button above."}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {docs.map((doc) => (
            <div
              key={doc.docId}
              style={{
                display:        "flex",
                alignItems:     "center",
                gap:            10,
                background:     "#f8fafc",
                border:         "1px solid #e2e8f0",
                borderRadius:   8,
                padding:        "8px 12px",
              }}
            >
              {/* File icon */}
              <i
                className={`bi ${getMimeIcon(doc.mimeType)}`}
                style={{ fontSize: 20, flexShrink: 0 }}
              />

              {/* File info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontWeight:   600,
                  fontSize:     13,
                  color:        "#1a3c5e",
                  whiteSpace:   "nowrap",
                  overflow:     "hidden",
                  textOverflow: "ellipsis",
                }}>
                  {doc.fileName}
                </div>
                <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>
                  {formatSize(doc.fileSizeKb)}
                  {" · "}
                  {doc.uploadedBy}
                  {" · "}
                  {doc.uploadedOnText}
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                {/* Download */}
                <button
                  onClick={() => downloadTaskDocument(doc.docId, taskDtlId)}
                  title="Download"
                  style={{
                    background:   "transparent",
                    border:       "1px solid #c8d6e5",
                    borderRadius: 6,
                    padding:      "4px 8px",
                    cursor:       "pointer",
                    color:        "#1a3c5e",
                    fontSize:     13,
                  }}
                >
                  <i className="bi bi-download" />
                </button>

                {/* Delete — only creator, only when not locked */}
                {isCreator && !isLocked && (
                  <button
                    onClick={() => handleDelete(doc.docId)}
                    disabled={deletingId === doc.docId}
                    title="Remove document"
                    style={{
                      background:   "transparent",
                      border:       "1px solid #fca5a5",
                      borderRadius: 6,
                      padding:      "4px 8px",
                      cursor:       deletingId === doc.docId
                                    ? "not-allowed" : "pointer",
                      color:        "#dc2626",
                      fontSize:     13,
                      opacity:      deletingId === doc.docId ? 0.6 : 1,
                    }}
                  >
                    {deletingId === doc.docId
                      ? <span className="spinner-border spinner-border-sm"
                          style={{ width: 11, height: 11, borderWidth: 2 }} />
                      : <i className="bi bi-trash3" />
                    }
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TaskDocumentPanel;