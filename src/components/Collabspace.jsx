import React, { useState, useEffect, useRef, useCallback } from "react";
import * as signalR from "@microsoft/signalr";
import { API_URL } from "../api/apiConfig";
import {
  getCollabComments,
  getCollabReplies,
  postCollabComment,
  deleteCollabComment,
  uploadCollabDocument,
  getCollabDocuments,
  getMentionableUsers,
} from "../api/Collabservice";

const HUB_URL  = `${API_URL}/hubs/collab`;
const PAGE_SIZE = 20;

// ─── Utilities ────────────────────────────────────────────────────────────────

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60)    return `${diff}s ago`;
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric"
  });
}

function formatBytes(bytes) {
  if (bytes < 1024)    return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

function getInitials(name = "") {
  return name
    .replace(/\s*\([^)]+\)$/, "")
    .trim()
    .split(" ")
    .slice(0, 2)
    .map(w => w[0])
    .join("")
    .toUpperCase();
}

function getAvatarColor(userId) {
  const colors = [
    "#1a3c5e","#2d6a4f","#6a2d5e","#5e4d1a",
    "#1a5e5e","#5e1a2d","#2d4f6a","#4f6a2d"
  ];
  const key = typeof userId === "string"
    ? userId.charCodeAt(0) || 0
    : Math.abs(userId || 0);
  return colors[key % colors.length];
}

function RichText({ text }) {
  if (!text) return null;
  const parts = [];
  let key = 0;
  text.split(/(\s+)/).forEach(token => {
    if (/^@\w/.test(token)) {
      parts.push(
        <span key={key++} style={{
          background: "#e8f0fe", color: "#1a3c5e",
          borderRadius: "4px", padding: "0 4px", fontWeight: 600
        }}>
          {token}
        </span>
      );
    } else if (/^#\d+$/.test(token)) {
      parts.push(
        <span key={key++} style={{
          background: "#e6f4ea", color: "#2d6a4f",
          borderRadius: "4px", padding: "0 4px", fontWeight: 600
        }}>
          {token}
        </span>
      );
    } else {
      parts.push(<span key={key++}>{token}</span>);
    }
  });
  return <>{parts}</>;
}

// ─── MentionInput ─────────────────────────────────────────────────────────────

function MentionInput({ value, onChange, onMentionsChange, placeholder, disabled }) {
  const [showDropdown, setShowDropdown]   = useState(false);
  const [dropdownItems, setDropdownItems] = useState([]);
  const [mentionStart, setMentionStart]   = useState(null);
  const [mentions, setMentions]           = useState([]);
  const [loadingDD, setLoadingDD]         = useState(false);
  const textareaRef = useRef(null);
  const dropdownRef = useRef(null);
  const searchTimer = useRef(null);

  const fetchUsers = useCallback(async (term) => {
    setLoadingDD(true);
    try {
      const data = await getMentionableUsers(term);
      setDropdownItems(data);
    } catch {
      setDropdownItems([]);
    } finally {
      setLoadingDD(false);
    }
  }, []);

  const handleKeyUp = () => {
    const ta    = textareaRef.current;
    const text  = ta.value;
    const caret = ta.selectionStart;
    let triggerIdx  = -1;
    let triggerChar = null;

    for (let i = caret - 1; i >= 0; i--) {
      if (text[i] === "@") { triggerIdx = i; triggerChar = "USER"; break; }
      if (text[i] === " " || text[i] === "\n") break;
    }

    if (triggerIdx !== -1 && triggerChar === "USER") {
      const term = text.slice(triggerIdx + 1, caret);
      setMentionStart(triggerIdx);
      setShowDropdown(true);
      clearTimeout(searchTimer.current);
      searchTimer.current = setTimeout(() => fetchUsers(term), 250);
    } else {
      setShowDropdown(false);
      setMentionStart(null);
    }
  };

  const selectMention = (item) => {
    const ta      = textareaRef.current;
    const text    = ta.value;
    const caret   = ta.selectionStart;
    const before  = text.slice(0, mentionStart);
    const after   = text.slice(caret);
    const display = `@${item.name}`;
    const newText = `${before}${display} ${after}`;

    onChange(newText);

    const newMentions = [...mentions, { type: "USER", id: item.userName, display }];
    setMentions(newMentions);
    onMentionsChange(newMentions);
    setShowDropdown(false);

    setTimeout(() => {
      ta.focus();
      const pos = before.length + display.length + 1;
      ta.setSelectionRange(pos, pos);
    }, 0);
  };

  useEffect(() => {
    const handler = (e) => {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target) &&
        textareaRef.current && !textareaRef.current.contains(e.target)
      ) setShowDropdown(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div style={{ position: "relative" }}>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyUp={handleKeyUp}
        placeholder={placeholder}
        disabled={disabled}
        rows={3}
        style={{
          width: "100%", resize: "vertical",
          border: "1px solid #ced4da", borderRadius: "6px",
          padding: "10px 12px", fontSize: "14px",
          fontFamily: "inherit", outline: "none",
          boxSizing: "border-box", transition: "border-color 0.15s"
        }}
        onFocus={e => e.target.style.borderColor = "#1a3c5e"}
        onBlur={e  => e.target.style.borderColor = "#ced4da"}
      />
      {showDropdown && (
        <div ref={dropdownRef} style={{
          position: "absolute", bottom: "calc(100% + 4px)", left: 0,
          background: "#fff", border: "1px solid #dee2e6",
          borderRadius: "6px", boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
          zIndex: 1000, minWidth: "240px", maxHeight: "200px", overflowY: "auto"
        }}>
          {loadingDD ? (
            <div style={{ padding: "10px 14px", color: "#6c757d", fontSize: "13px" }}>
              Searching...
            </div>
          ) : dropdownItems.length === 0 ? (
            <div style={{ padding: "10px 14px", color: "#6c757d", fontSize: "13px" }}>
              No users found
            </div>
          ) : dropdownItems.map((item, idx) => (
            <div
              key={idx}
              onMouseDown={() => selectMention(item)}
              style={{
                padding: "8px 14px", cursor: "pointer", fontSize: "13px",
                display: "flex", alignItems: "center", gap: "8px",
                borderBottom: "1px solid #f0f0f0"
              }}
              onMouseEnter={e => e.currentTarget.style.background = "#f8f9fa"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              <div style={{
                width: "28px", height: "28px", borderRadius: "50%",
                background: getAvatarColor(item.userName || 0),
                color: "#fff", display: "flex", alignItems: "center",
                justifyContent: "center", fontSize: "11px", fontWeight: 700, flexShrink: 0
              }}>
                {getInitials(item.name)}
              </div>
              <div>
                <div style={{ fontWeight: 600, color: "#212529" }}>{item.name}</div>
                <div style={{ fontSize: "11px", color: "#6c757d" }}>
                  {item.userType === "1" ? "Internal" : "External"} · {item.emailId}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── CommentCard ──────────────────────────────────────────────────────────────

function CommentCard({ comment, currentUserId, projectId, onDeleted, onReplyPosted }) {
  const [showReplies, setShowReplies]         = useState(false);
  const [replies, setReplies]                 = useState([]);
  const [loadingReplies, setLoadingReplies]   = useState(false);
  const [showReplyBox, setShowReplyBox]       = useState(false);
  const [replyText, setReplyText]             = useState("");
  const [replyMentions, setReplyMentions]     = useState([]);
  const [submittingReply, setSubmittingReply] = useState(false);
  const [replyError, setReplyError]           = useState("");
  const [documents, setDocuments]             = useState([]);
  const [loadingDocs, setLoadingDocs]         = useState(false);
  const [showDocs, setShowDocs]               = useState(false);
  const [deleting, setDeleting]               = useState(false);

  const fetchReplies = async () => {
    setLoadingReplies(true);
    try {
      const data = await getCollabReplies(comment.commentId);
      setReplies(data);
    } catch { /* silently fail */ }
    finally { setLoadingReplies(false); }
  };

  const fetchDocuments = async () => {
    setLoadingDocs(true);
    try {
      const data = await getCollabDocuments(comment.commentId);
      setDocuments(data);
    } catch { setDocuments([]); }
    finally { setLoadingDocs(false); }
  };

  const handleToggleReplies = () => {
    if (!showReplies && replies.length === 0) fetchReplies();
    setShowReplies(prev => !prev);
  };

  const handleToggleDocs = () => {
    if (!showDocs && documents.length === 0) fetchDocuments();
    setShowDocs(prev => !prev);
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this comment? All replies will also be deleted.")) return;
    setDeleting(true);
    try {
      await deleteCollabComment(comment.commentId, currentUserId);
      onDeleted(comment.commentId);
    } catch (err) {
      alert(err.message || "Failed to delete comment.");
    } finally {
      setDeleting(false);
    }
  };

  const handleSubmitReply = async () => {
    if (!replyText.trim()) { setReplyError("Reply cannot be empty."); return; }
    setReplyError("");
    setSubmittingReply(true);
    try {
      await postCollabComment({
        projectId:       projectId,
        parentCommentId: comment.commentId,
        commentText:     replyText.trim(),
        createdBy:       currentUserId,
        mentionTypes:    replyMentions.map(m => m.type),
        mentionIds:      replyMentions.map(m => m.id),
      });
      setReplyText("");
      setReplyMentions([]);
      setShowReplyBox(false);
      await fetchReplies();
      if (!showReplies) setShowReplies(true);
      onReplyPosted();
    } catch (err) {
      setReplyError(err.message || "Failed to post reply.");
    } finally {
      setSubmittingReply(false);
    }
  };

  const isOwner = comment.createdBy === currentUserId;

  return (
    <div style={{
      background: "#fff", borderRadius: "8px",
      border: "1px solid #e9ecef", marginBottom: "12px", overflow: "hidden"
    }}>
      <div style={{ padding: "14px 16px 0 16px", display: "flex", gap: "12px" }}>
        <div style={{
          width: "38px", height: "38px", borderRadius: "50%", flexShrink: 0,
          background: getAvatarColor(comment.createdBy), color: "#fff",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "13px", fontWeight: 700
        }}>
          {getInitials(comment.createdByName)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            <span style={{ fontWeight: 700, fontSize: "14px", color: "#1a3c5e" }}>
              {comment.createdByName}
            </span>
            <span style={{ fontSize: "12px", color: "#6c757d" }}>
              {timeAgo(comment.createdOn)}
            </span>
            {comment.modifiedOn && (
              <span style={{ fontSize: "11px", color: "#adb5bd", fontStyle: "italic" }}>
                (edited)
              </span>
            )}
          </div>
          <div style={{
            marginTop: "6px", fontSize: "14px",
            color: "#212529", lineHeight: "1.6", wordBreak: "break-word"
          }}>
            <RichText text={comment.commentText} />
          </div>
        </div>
        {isOwner && (
          <button
            onClick={handleDelete}
            disabled={deleting}
            title="Delete comment"
            style={{
              background: "none", border: "none", cursor: "pointer",
              color: "#adb5bd", padding: "2px 6px", borderRadius: "4px",
              fontSize: "16px", flexShrink: 0, alignSelf: "flex-start"
            }}
            onMouseEnter={e => e.currentTarget.style.color = "#dc3545"}
            onMouseLeave={e => e.currentTarget.style.color = "#adb5bd"}
          >
            {deleting
              ? <span className="spinner-border spinner-border-sm" />
              : <i className="bi bi-trash3" />}
          </button>
        )}
      </div>

      {/* Action Bar */}
      <div style={{
        padding: "8px 16px 10px 66px",
        display: "flex", gap: "16px", alignItems: "center"
      }}>
        <button
          onClick={handleToggleReplies}
          style={{
            background: "none", border: "none", cursor: "pointer",
            color: "#1a3c5e", fontSize: "12px", fontWeight: 600,
            padding: "2px 0", display: "flex", alignItems: "center", gap: "4px"
          }}
        >
          <i className={`bi bi-chat${showReplies ? "-fill" : ""}`} />
          {comment.replyCount > 0
            ? `${comment.replyCount} ${comment.replyCount === 1 ? "Reply" : "Replies"}`
            : "Reply"}
        </button>

        {comment.documentCount > 0 && (
          <button
            onClick={handleToggleDocs}
            style={{
              background: "none", border: "none", cursor: "pointer",
              color: "#2d6a4f", fontSize: "12px", fontWeight: 600,
              padding: "2px 0", display: "flex", alignItems: "center", gap: "4px"
            }}
          >
            <i className="bi bi-paperclip" />
            {comment.documentCount} {comment.documentCount === 1 ? "File" : "Files"}
          </button>
        )}

        <button
          onClick={() => setShowReplyBox(prev => !prev)}
          style={{
            background: "none", border: "none", cursor: "pointer",
            color: "#6c757d", fontSize: "12px", padding: "2px 0", marginLeft: "auto"
          }}
        >
          <i className="bi bi-reply" /> Reply
        </button>
      </div>

      {/* Documents */}
      {showDocs && (
        <div style={{
          margin: "0 16px 12px 66px", background: "#f8f9fa",
          borderRadius: "6px", padding: "10px 12px"
        }}>
          {loadingDocs ? (
            <div style={{ fontSize: "12px", color: "#6c757d" }}>Loading files...</div>
          ) : documents.map(doc => (
            <div key={doc.documentId} style={{
              display: "flex", alignItems: "center", gap: "8px",
              padding: "4px 0", fontSize: "13px"
            }}>
              <i className="bi bi-file-earmark" style={{ color: "#1a3c5e" }} />
              <a
                href={`${API_URL}/${doc.filePath}`}
                target="_blank"
                rel="noreferrer"
                style={{ color: "#1a3c5e", textDecoration: "none", flex: 1 }}
              >
                {doc.fileName}
              </a>
              <span style={{ color: "#6c757d", fontSize: "11px" }}>
                {formatBytes(doc.fileSize)}
              </span>
              <span style={{ color: "#adb5bd", fontSize: "11px" }}>
                {timeAgo(doc.uploadedOn)}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Replies */}
      {showReplies && (
        <div style={{
          borderTop: "1px solid #f0f0f0", background: "#fafbfc",
          padding: "12px 16px 12px 66px"
        }}>
          {loadingReplies ? (
            <div style={{ fontSize: "13px", color: "#6c757d" }}>Loading replies...</div>
          ) : replies.length === 0 ? (
            <div style={{ fontSize: "13px", color: "#adb5bd" }}>No replies yet.</div>
          ) : replies.map(reply => (
            <div key={reply.commentId} style={{
              display: "flex", gap: "10px", marginBottom: "12px"
            }}>
              <div style={{
                width: "30px", height: "30px", borderRadius: "50%", flexShrink: 0,
                background: getAvatarColor(reply.createdBy), color: "#fff",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "11px", fontWeight: 700
              }}>
                {getInitials(reply.createdByName)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontWeight: 700, fontSize: "13px", color: "#1a3c5e" }}>
                    {reply.createdByName}
                  </span>
                  <span style={{ fontSize: "11px", color: "#6c757d" }}>
                    {timeAgo(reply.createdOn)}
                  </span>
                </div>
                <div style={{ fontSize: "13px", color: "#212529", marginTop: "3px", lineHeight: "1.5" }}>
                  <RichText text={reply.commentText} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reply Input */}
      {showReplyBox && (
        <div style={{
          borderTop: "1px solid #f0f0f0", background: "#fafbfc",
          padding: "12px 16px 12px 66px"
        }}>
          <MentionInput
            value={replyText}
            onChange={setReplyText}
            onMentionsChange={setReplyMentions}
            placeholder="Write a reply... Use @ to mention someone"
            disabled={submittingReply}
          />
          {replyError && (
            <div style={{ color: "#dc3545", fontSize: "12px", marginTop: "4px" }}>
              {replyError}
            </div>
          )}
          <div style={{
            display: "flex", gap: "8px", marginTop: "8px", justifyContent: "flex-end"
          }}>
            <button
              onClick={() => { setShowReplyBox(false); setReplyText(""); setReplyError(""); }}
              style={{
                background: "none", border: "1px solid #ced4da", borderRadius: "6px",
                padding: "5px 14px", fontSize: "13px", cursor: "pointer", color: "#6c757d"
              }}
            >Cancel</button>
            <button
              onClick={handleSubmitReply}
              disabled={submittingReply}
              style={{
                background: "#1a3c5e", color: "#fff", border: "none",
                borderRadius: "6px", padding: "5px 16px", fontSize: "13px",
                cursor: "pointer", fontWeight: 600, opacity: submittingReply ? 0.7 : 1
              }}
            >
              {submittingReply ? "Posting..." : "Post Reply"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main CollabSpace ─────────────────────────────────────────────────────────

export default function CollabSpace({ projectId }) {
  const currentUserId   = parseInt(sessionStorage.getItem("userId") || "0");
  const currentUserName = sessionStorage.getItem("userName") || "";

  const [comments, setComments]           = useState([]);
  const [loading, setLoading]             = useState(true);
  const [loadingMore, setLoadingMore]     = useState(false);
  const [page, setPage]                   = useState(1);
  const [hasMore, setHasMore]             = useState(true);
  const [commentText, setCommentText]     = useState("");
  const [mentions, setMentions]           = useState([]);
  const [files, setFiles]                 = useState([]);
  const [submitting, setSubmitting]       = useState(false);
  const [submitError, setSubmitError]     = useState("");
  const [connected, setConnected]         = useState(false);
  const [connectionError, setConnectionError] = useState(false);

  const hubRef       = useRef(null);
  const fileInputRef = useRef(null);

  const fetchComments = useCallback(async (pageNum = 1, append = false) => {
    if (append) setLoadingMore(true);
    else        setLoading(true);
    try {
      const data = await getCollabComments(projectId, pageNum, PAGE_SIZE);
      if (append) setComments(prev => [...prev, ...data]);
      else        setComments(data);
      setHasMore(data.length === PAGE_SIZE);
    } catch (err) {
      console.error("Failed to load comments:", err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [projectId]);

  useEffect(() => {
    const hub = new signalR.HubConnectionBuilder()
      .withUrl(HUB_URL, {
        skipNegotiation: false,
        transport:
          signalR.HttpTransportType.WebSockets |
          signalR.HttpTransportType.LongPolling,
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000])
      .configureLogging(signalR.LogLevel.Warning)
      .build();

    hub.on("ReceiveComment", (newComment) => {
      if (!newComment.parentCommentId) {
        setComments(prev => {
          if (prev.some(c => c.commentId === newComment.commentId)) return prev;
          return [newComment, ...prev];
        });
      }
    });

    hub.onreconnecting(() => setConnected(false));
    hub.onreconnected(() => {
      setConnected(true);
      setConnectionError(false);
      hub.invoke("JoinProjectGroup", String(projectId)).catch(() => {});
    });
    hub.onclose(() => setConnected(false));

    hub.start()
      .then(() => {
        setConnected(true);
        setConnectionError(false);
        return hub.invoke("JoinProjectGroup", String(projectId));
      })
      .catch(() => { setConnectionError(true); setConnected(false); });

    hubRef.current = hub;

    return () => {
      hub.invoke("LeaveProjectGroup", String(projectId)).catch(() => {});
      hub.stop();
    };
  }, [projectId]);

  useEffect(() => {
    setPage(1);
    fetchComments(1, false);
  }, [projectId, fetchComments]);

  const handleLoadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchComments(next, true);
  };

  const handleSubmit = async () => {
    if (!commentText.trim()) { setSubmitError("Comment cannot be empty."); return; }
    setSubmitError("");
    setSubmitting(true);
    try {
      const result = await postCollabComment({
        projectId:       projectId,
        parentCommentId: null,
        commentText:     commentText.trim(),
        createdBy:       currentUserId,
        mentionTypes:    mentions.map(m => m.type),
        mentionIds:      mentions.map(m => m.id),
      });

      const newCommentId = result.commentId;

      for (const file of files) {
        try {
          await uploadCollabDocument(newCommentId, projectId, currentUserId, file);
        } catch (err) {
          console.error("File upload failed:", err);
        }
      }

      setCommentText("");
      setMentions([]);
      setFiles([]);

      if (!connected) await fetchComments(1, false);
    } catch (err) {
      setSubmitError(err.message || "Failed to post comment.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCommentDeleted = (commentId) => {
    setComments(prev => prev.filter(c => c.commentId !== commentId));
  };

  const handleFileSelect = (e) => {
    const allowed = [".pdf",".doc",".docx",".xls",".xlsx",".png",".jpg",".jpeg",".txt"];
    const valid   = Array.from(e.target.files).filter(f => {
      const ext = "." + f.name.split(".").pop().toLowerCase();
      return allowed.includes(ext) && f.size <= 10 * 1024 * 1024;
    });
    if (valid.length !== e.target.files.length) {
      alert("Some files were skipped. Only PDF, Word, Excel, images and TXT under 10MB are allowed.");
    }
    setFiles(prev => [...prev, ...valid]);
    e.target.value = "";
  };

  const removeFile = (idx) => setFiles(prev => prev.filter((_, i) => i !== idx));

  return (
    <div style={{ padding: "20px 0" }}>

      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center",
        justifyContent: "space-between", marginBottom: "20px"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <h5 style={{ margin: 0, fontWeight: 700, color: "#1a3c5e" }}>
            <i className="bi bi-chat-dots me-2" />
            Collaboration Space
          </h5>
          <span style={{
            fontSize: "12px", padding: "2px 8px", borderRadius: "12px",
            background: connected ? "#e6f4ea" : "#fff3cd",
            color:      connected ? "#2d6a4f" : "#856404",
            fontWeight: 600,
            border: `1px solid ${connected ? "#c3e6cb" : "#ffc107"}`
          }}>
            <i className="bi bi-circle-fill me-1" style={{ fontSize: "8px" }} />
            {connected ? "Live" : "Connecting..."}
          </span>
        </div>
        <span style={{ fontSize: "13px", color: "#6c757d" }}>
          {comments.length} comment{comments.length !== 1 ? "s" : ""}
        </span>
      </div>

      {connectionError && (
        <div style={{
          background: "#fff3cd", border: "1px solid #ffc107",
          borderRadius: "6px", padding: "10px 14px", fontSize: "13px",
          color: "#856404", marginBottom: "16px",
          display: "flex", alignItems: "center", gap: "8px"
        }}>
          <i className="bi bi-exclamation-triangle" />
          Real-time updates unavailable. Comments will still be saved.
        </div>
      )}

      {/* Compose Box */}
      <div style={{
        background: "#fff", borderRadius: "8px",
        border: "1px solid #e9ecef", padding: "16px", marginBottom: "24px"
      }}>
        <div style={{ display: "flex", gap: "12px" }}>
          <div style={{
            width: "38px", height: "38px", borderRadius: "50%", flexShrink: 0,
            background: getAvatarColor(currentUserId), color: "#fff",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "13px", fontWeight: 700
          }}>
            {getInitials(currentUserName)}
          </div>

          <div style={{ flex: 1 }}>
            <MentionInput
              value={commentText}
              onChange={setCommentText}
              onMentionsChange={setMentions}
              placeholder="Add a comment... Use @ to mention someone"
              disabled={submitting}
            />

            {files.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "8px" }}>
                {files.map((f, idx) => (
                  <div key={idx} style={{
                    display: "flex", alignItems: "center", gap: "6px",
                    background: "#f0f4ff", borderRadius: "6px",
                    padding: "4px 10px", fontSize: "12px",
                    color: "#1a3c5e", border: "1px solid #d0deff"
                  }}>
                    <i className="bi bi-file-earmark" />
                    <span style={{
                      maxWidth: "120px", overflow: "hidden",
                      textOverflow: "ellipsis", whiteSpace: "nowrap"
                    }}>{f.name}</span>
                    <span style={{ color: "#6c757d" }}>({formatBytes(f.size)})</span>
                    <button
                      onClick={() => removeFile(idx)}
                      style={{
                        background: "none", border: "none", cursor: "pointer",
                        color: "#dc3545", padding: "0 2px", fontSize: "14px", lineHeight: 1
                      }}
                    >×</button>
                  </div>
                ))}
              </div>
            )}

            {submitError && (
              <div style={{ color: "#dc3545", fontSize: "12px", marginTop: "6px" }}>
                {submitError}
              </div>
            )}

            <div style={{
              display: "flex", justifyContent: "space-between",
              alignItems: "center", marginTop: "10px"
            }}>
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    background: "none", border: "1px solid #ced4da",
                    borderRadius: "6px", padding: "5px 12px", fontSize: "13px",
                    cursor: "pointer", color: "#6c757d",
                    display: "flex", alignItems: "center", gap: "6px"
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "#1a3c5e"; e.currentTarget.style.color = "#1a3c5e"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "#ced4da"; e.currentTarget.style.color = "#6c757d"; }}
                >
                  <i className="bi bi-paperclip" /> Attach
                </button>
                <input
                  ref={fileInputRef} type="file" multiple
                  style={{ display: "none" }}
                  onChange={handleFileSelect}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.txt"
                />
                <span style={{ fontSize: "11px", color: "#adb5bd" }}>
                  PDF, Word, Excel, images · Max 10MB
                </span>
              </div>

              <button
                onClick={handleSubmit}
                disabled={submitting || !commentText.trim()}
                style={{
                  background: submitting || !commentText.trim() ? "#adb5bd" : "#1a3c5e",
                  color: "#fff", border: "none", borderRadius: "6px",
                  padding: "7px 20px", fontSize: "13px", fontWeight: 600,
                  cursor: submitting || !commentText.trim() ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", gap: "6px",
                  transition: "background 0.15s"
                }}
              >
                {submitting
                  ? <><i className="bi bi-hourglass-split" /> Posting...</>
                  : <><i className="bi bi-send" /> Post</>}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Comments */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "40px 0", color: "#6c757d" }}>
          <div className="spinner-border spinner-border-sm me-2" />
          Loading comments...
        </div>
      ) : comments.length === 0 ? (
        <div style={{ textAlign: "center", padding: "48px 0", color: "#adb5bd" }}>
          <i className="bi bi-chat-dots"
            style={{ fontSize: "40px", display: "block", marginBottom: "12px" }} />
          <div style={{ fontSize: "15px", fontWeight: 600 }}>No comments yet</div>
          <div style={{ fontSize: "13px", marginTop: "4px" }}>
            Be the first to add an update or remark to this project.
          </div>
        </div>
      ) : (
        <>
          {comments.map(comment => (
            <CommentCard
              key={comment.commentId}
              comment={comment}
              currentUserId={currentUserId}
              projectId={projectId}
              onDeleted={handleCommentDeleted}
              onReplyPosted={() => fetchComments(1, false)}
            />
          ))}
          {hasMore && (
            <div style={{ textAlign: "center", marginTop: "16px" }}>
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                style={{
                  background: "none", border: "1px solid #ced4da",
                  borderRadius: "6px", padding: "8px 24px",
                  fontSize: "13px", cursor: "pointer",
                  color: "#1a3c5e", fontWeight: 600
                }}
              >
                {loadingMore ? "Loading..." : "Load older comments"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}