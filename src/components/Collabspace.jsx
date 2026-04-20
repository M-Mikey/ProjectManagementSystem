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
  getMentionableTasks,
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

function getAvatarColor(seed) {
  const colors = [
    "#1a3c5e","#2d6a4f","#6a2d5e","#5e4d1a",
    "#1a5e5e","#5e1a2d","#2d4f6a","#4f6a2d",
    "#7c3aed","#b45309"
  ];
  const key = typeof seed === "string"
    ? seed.split("").reduce((a, c) => a + c.charCodeAt(0), 0)
    : Math.abs(seed || 0);
  return colors[key % colors.length];
}

// Renders text with @mention and #task highlights
function RichText({ text }) {
  if (!text) return null;
  return (
    <div style={{
      fontSize: "14px", color: "#1e293b", lineHeight: "1.65",
      wordBreak: "break-word", display: "block"
    }}>
      {text.split(" ").map((word, i, arr) => (
        <React.Fragment key={i}>
          {word.startsWith("@") && word.length > 1 ? (
            <span style={{
              background: "#eff6ff", color: "#1d4ed8",
              borderRadius: "4px", padding: "1px 6px",
              fontWeight: 600, display: "inline"
            }}>
              {word}
            </span>
          ) : word.startsWith("#") && word.length > 1 ? (
            <span style={{
              background: "#f0fdf4", color: "#15803d",
              borderRadius: "4px", padding: "1px 6px",
              fontWeight: 600, display: "inline"
            }}>
              {word}
            </span>
          ) : (
            <span style={{ display: "inline", color: "#1e293b" }}>{word}</span>
          )}
          {i < arr.length - 1 ? " " : ""}
        </React.Fragment>
      ))}
    </div>
  );
}

// ─── MentionInput — handles both @ (users) and # (tasks/milestones) ───────────

function MentionInput({ value, onChange, onMentionsChange, placeholder, disabled, projectId }) {
  const [showDropdown, setShowDropdown]     = useState(false);
  const [dropdownMode, setDropdownMode]     = useState(null); // 'USER' | 'TASK'
  const [dropdownItems, setDropdownItems]   = useState([]);
  const [mentionStart, setMentionStart]     = useState(null);
  const [mentions, setMentions]             = useState([]);
  const [loadingDD, setLoadingDD]           = useState(false);
  const [searchTerm, setSearchTerm]         = useState("");
  const textareaRef = useRef(null);
  const dropdownRef = useRef(null);
  const searchTimer = useRef(null);

  const fetchUsers = useCallback(async (term) => {
    setLoadingDD(true);
    try {
      const data = await getMentionableUsers(term);
      setDropdownItems(data);
    } catch { setDropdownItems([]); }
    finally { setLoadingDD(false); }
  }, []);

  const fetchTasks = useCallback(async (term) => {
    setLoadingDD(true);
    try {
      const data = await getMentionableTasks(projectId, term);
      setDropdownItems(data);
    } catch { setDropdownItems([]); }
    finally { setLoadingDD(false); }
  }, [projectId]);

  const handleKeyUp = () => {
    const ta    = textareaRef.current;
    const text  = ta.value;
    const caret = ta.selectionStart;
    let triggerIdx  = -1;
    let triggerChar = null;

    for (let i = caret - 1; i >= 0; i--) {
      if (text[i] === "@") { triggerIdx = i; triggerChar = "USER"; break; }
      if (text[i] === "#") { triggerIdx = i; triggerChar = "TASK"; break; }
      if (text[i] === " " || text[i] === "\n") break;
    }

    if (triggerIdx !== -1 && triggerChar) {
      const term = text.slice(triggerIdx + 1, caret);
      setMentionStart(triggerIdx);
      setDropdownMode(triggerChar);
      setSearchTerm(term);
      setShowDropdown(true);
      clearTimeout(searchTimer.current);
      searchTimer.current = setTimeout(() => {
        if (triggerChar === "USER") fetchUsers(term);
        else fetchTasks(term);
      }, 250);
    } else {
      setShowDropdown(false);
      setMentionStart(null);
    }
  };

 const selectMention = (item) => {
  const ta     = textareaRef.current;
  const text   = ta.value;
  const caret  = ta.selectionStart;
  const before = text.slice(0, mentionStart);
  const after  = text.slice(caret);

  let display, mentionObj;
  if (dropdownMode === "USER") {
    display    = `@${item.name}`;
    mentionObj = { type: "USER", id: String(item.userName), display };
  } else {
    display    = `#${item.itemName}`;
    mentionObj = { type: item.itemType, id: String(item.itemId), display }; // ← String() here
  }

  const newText = `${before}${display} ${after}`;
  onChange(newText);

  const newMentions = [...mentions, mentionObj];
  setMentions(newMentions);
  onMentionsChange(newMentions);
  setShowDropdown(false);
  setSearchTerm("");

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
      ) { setShowDropdown(false); setSearchTerm(""); }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const isUserMode = dropdownMode === "USER";

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
          border: "1.5px solid #e2e8f0", borderRadius: "8px",
          padding: "10px 12px", fontSize: "14px",
          fontFamily: "inherit", outline: "none",
          boxSizing: "border-box", transition: "border-color 0.15s",
          color: "#1e293b", background: "#fff"
        }}
        onFocus={e => e.target.style.borderColor = "#1a3c5e"}
        onBlur={e  => e.target.style.borderColor = "#e2e8f0"}
      />

      {/* Hint */}
      <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "4px" }}>
        Use <strong>@</strong> to mention a user · <strong>#</strong> to reference a task or milestone
      </div>

      {showDropdown && (
        <div ref={dropdownRef} style={{
          position: "absolute", top: "calc(100% + 4px)", left: 0,
          background: "#fff", border: "1px solid #e2e8f0",
          borderRadius: "10px", boxShadow: "0 8px 24px rgba(0,0,0,0.10)",
          zIndex: 1050, width: "300px", maxHeight: "280px",
          display: "flex", flexDirection: "column", overflow: "hidden"
        }}>
          {/* Dropdown header */}
          <div style={{
            padding: "10px 12px 8px", borderBottom: "1px solid #f1f5f9",
            display: "flex", alignItems: "center", gap: "8px", flexShrink: 0
          }}>
            <span style={{
              fontSize: "10px", fontWeight: 700, textTransform: "uppercase",
              letterSpacing: "0.5px", color: "#64748b"
            }}>
              {isUserMode ? "👤 Mention User" : "📋 Reference Task / Milestone"}
            </span>
          </div>

          {/* Search input */}
          <div style={{ padding: "8px 12px", borderBottom: "1px solid #f1f5f9", flexShrink: 0 }}>
            <input
              type="text"
              placeholder={isUserMode ? "Search users..." : "Search tasks or milestones..."}
              value={searchTerm}
              autoFocus
              onChange={e => {
                setSearchTerm(e.target.value);
                clearTimeout(searchTimer.current);
                searchTimer.current = setTimeout(() => {
                  if (isUserMode) fetchUsers(e.target.value);
                  else            fetchTasks(e.target.value);
                }, 250);
              }}
              onMouseDown={e => e.stopPropagation()}
              style={{
                width: "100%", border: "1px solid #e2e8f0",
                borderRadius: "6px", padding: "6px 10px",
                fontSize: "13px", outline: "none",
                boxSizing: "border-box", color: "#1e293b"
              }}
              onFocus={e => e.target.style.borderColor = "#1a3c5e"}
              onBlur={e  => e.target.style.borderColor = "#e2e8f0"}
            />
          </div>

          {/* Results */}
          <div style={{ overflowY: "auto", flex: 1 }}>
            {loadingDD ? (
              <div style={{
                padding: "16px", color: "#94a3b8",
                fontSize: "13px", textAlign: "center"
              }}>
                <span className="spinner-border spinner-border-sm me-2" />
                Searching...
              </div>
            ) : dropdownItems.length === 0 ? (
              <div style={{
                padding: "16px", color: "#94a3b8",
                fontSize: "13px", textAlign: "center"
              }}>
                No results found
              </div>
            ) : isUserMode ? (
              dropdownItems.map((item, idx) => (
                <div
                  key={idx}
                  onMouseDown={() => selectMention(item)}
                  style={{
                    padding: "10px 12px", cursor: "pointer",
                    display: "flex", alignItems: "center", gap: "10px",
                    borderBottom: "1px solid #f8fafc",
                    transition: "background 0.1s"
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  <div style={{
                    width: "32px", height: "32px", borderRadius: "50%",
                    background: getAvatarColor(item.userName || ""),
                    color: "#fff", display: "flex", alignItems: "center",
                    justifyContent: "center", fontSize: "12px",
                    fontWeight: 700, flexShrink: 0
                  }}>
                    {getInitials(item.name)}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 600, color: "#0f172a", fontSize: "13px" }}>
                      {item.name}
                    </div>
                    <div style={{ fontSize: "11px", color: "#64748b", marginTop: "1px" }}>
                      {item.userType === "1" ? "Internal" : "External"} · {item.emailId}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              // Task/Milestone mode — grouped by type
              (() => {
                const milestones = dropdownItems.filter(i => i.itemType === "MILESTONE");
                const tasks      = dropdownItems.filter(i => i.itemType === "TASK");
                return (
                  <>
                    {milestones.length > 0 && (
                      <>
                        <div style={{
                          padding: "6px 12px", fontSize: "10px", fontWeight: 700,
                          textTransform: "uppercase", letterSpacing: "0.5px",
                          color: "#94a3b8", background: "#f8fafc"
                        }}>
                          Milestones
                        </div>
                        {milestones.map((item, idx) => (
                          <div
                            key={`m-${idx}`}
                            onMouseDown={() => selectMention(item)}
                            style={{
                              padding: "9px 12px", cursor: "pointer",
                              display: "flex", alignItems: "center", gap: "10px",
                              borderBottom: "1px solid #f8fafc"
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}
                            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                          >
                            <div style={{
                              width: "28px", height: "28px", borderRadius: "6px",
                              background: "#fef3c7", color: "#d97706",
                              display: "flex", alignItems: "center",
                              justifyContent: "center", fontSize: "13px", flexShrink: 0
                            }}>
                              <i className="bi bi-flag-fill" />
                            </div>
                            <div style={{ fontWeight: 600, color: "#0f172a", fontSize: "13px" }}>
                              {item.itemName}
                            </div>
                          </div>
                        ))}
                      </>
                    )}
                    {tasks.length > 0 && (
                      <>
                        <div style={{
                          padding: "6px 12px", fontSize: "10px", fontWeight: 700,
                          textTransform: "uppercase", letterSpacing: "0.5px",
                          color: "#94a3b8", background: "#f8fafc"
                        }}>
                          Tasks
                        </div>
                        {tasks.map((item, idx) => (
                          <div
                            key={`t-${idx}`}
                            onMouseDown={() => selectMention(item)}
                            style={{
                              padding: "9px 12px", cursor: "pointer",
                              display: "flex", alignItems: "center", gap: "10px",
                              borderBottom: "1px solid #f8fafc"
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}
                            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                          >
                            <div style={{
                              width: "28px", height: "28px", borderRadius: "6px",
                              background: "#eff6ff", color: "#1d4ed8",
                              display: "flex", alignItems: "center",
                              justifyContent: "center", fontSize: "13px", flexShrink: 0
                            }}>
                              <i className="bi bi-check2-square" />
                            </div>
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontWeight: 600, color: "#0f172a", fontSize: "13px" }}>
                                {item.itemName}
                              </div>
                              {item.parentName && (
                                <div style={{ fontSize: "11px", color: "#64748b", marginTop: "1px" }}>
                                  {item.parentName}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </>
                    )}
                  </>
                );
              })()
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── ReplyItem ────────────────────────────────────────────────────────────────

function ReplyItem({ reply }) {
  return (
    <div style={{
      display: "flex", gap: "10px", padding: "10px 0",
      borderBottom: "1px solid #f1f5f9"
    }}>
      <div style={{
        width: "30px", height: "30px", borderRadius: "50%", flexShrink: 0,
        background: getAvatarColor(reply.createdBy), color: "#fff",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "11px", fontWeight: 700
      }}>
        {getInitials(reply.createdByName)}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
          <span style={{ fontWeight: 700, fontSize: "13px", color: "#0f172a" }}>
            {reply.createdByName}
          </span>
          <span style={{ fontSize: "11px", color: "#94a3b8" }}>
            {timeAgo(reply.createdOn)}
          </span>
        </div>
        <RichText text={reply.commentText} />
      </div>
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
    } finally { setDeleting(false); }
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
    } finally { setSubmittingReply(false); }
  };

  const isOwner = comment.createdBy === currentUserId;

  return (
    <div style={{
      background: "#fff", borderRadius: "12px",
      border: "1px solid #e2e8f0",
      marginBottom: "16px",
      boxShadow: "0 1px 3px rgba(0,0,0,0.04)"
    }}>
      {/* ── Comment body ── */}
      <div style={{ padding: "16px 16px 12px 16px" }}>
        <div style={{ gap: "12px", alignItems: "flex-start" }}>
          {/* Avatar */}
          <div style={{
            width: "36px", height: "36px", borderRadius: "50%", flexShrink: 0,
            background: getAvatarColor(comment.createdBy), color: "#fff",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "13px", fontWeight: 700
          }}>
            {getInitials(comment.createdByName)}
          </div>

          {/* Content */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Author + time */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
              <span style={{ fontWeight: 700, fontSize: "14px", color: "#0f172a" }}>
                {comment.createdByName}
              </span>
              <span style={{ fontSize: "12px", color: "#94a3b8" }}>
                {timeAgo(comment.createdOn)}
              </span>
              {comment.modifiedOn && (
                <span style={{ fontSize: "11px", color: "#cbd5e1", fontStyle: "italic" }}>
                  · edited
                </span>
              )}
            </div>
            {/* Text */}
            <RichText text={comment.commentText} />
          </div>

          {/* Delete */}
          {isOwner && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              title="Delete comment"
              style={{
                background: "none", border: "none", cursor: "pointer",
                color: "#cbd5e1", padding: "4px", borderRadius: "6px",
                fontSize: "15px", flexShrink: 0, lineHeight: 1,
                transition: "color 0.15s"
              }}
              onMouseEnter={e => e.currentTarget.style.color = "#ef4444"}
              onMouseLeave={e => e.currentTarget.style.color = "#cbd5e1"}
            >
              {deleting
                ? <span className="spinner-border spinner-border-sm" />
                : <i className="bi bi-trash3" />}
            </button>
          )}
        </div>
      </div>

      {/* ── Action bar ── */}
      <div style={{
        padding: "0 16px 12px 64px",
        display: "flex", gap: "20px", alignItems: "center"
      }}>
        {/* Replies toggle */}
        <button
          onClick={handleToggleReplies}
          style={{
            background: "none", border: "none", cursor: "pointer",
            color: showReplies ? "#1a3c5e" : "#64748b",
            fontSize: "12px", fontWeight: 600,
            padding: "4px 8px", borderRadius: "6px",
            display: "flex", alignItems: "center", gap: "5px",
            transition: "all 0.15s",
            background: showReplies ? "#eff6ff" : "none"
          }}
        >
          <i className={`bi bi-chat${showReplies ? "-fill" : ""}`} style={{ fontSize: "13px" }} />
          {comment.replyCount > 0
            ? `${comment.replyCount} ${comment.replyCount === 1 ? "Reply" : "Replies"}`
            : "Reply"}
        </button>

        {/* Files toggle */}
        {comment.documentCount > 0 && (
          <button
            onClick={handleToggleDocs}
            style={{
              background: showDocs ? "#f0fdf4" : "none",
              border: "none", cursor: "pointer",
              color: showDocs ? "#15803d" : "#64748b",
              fontSize: "12px", fontWeight: 600,
              padding: "4px 8px", borderRadius: "6px",
              display: "flex", alignItems: "center", gap: "5px",
              transition: "all 0.15s"
            }}
          >
            <i className="bi bi-paperclip" style={{ fontSize: "13px" }} />
            {comment.documentCount} {comment.documentCount === 1 ? "File" : "Files"}
          </button>
        )}

        {/* Reply shortcut */}
        <button
          onClick={() => setShowReplyBox(prev => !prev)}
          style={{
            background: "none", border: "none", cursor: "pointer",
            color: "#94a3b8", fontSize: "12px",
            padding: "4px 8px", borderRadius: "6px",
            display: "flex", alignItems: "center", gap: "5px",
            marginLeft: "auto", transition: "color 0.15s"
          }}
          onMouseEnter={e => e.currentTarget.style.color = "#1a3c5e"}
          onMouseLeave={e => e.currentTarget.style.color = "#94a3b8"}
        >
          <i className="bi bi-reply" /> Reply
        </button>
      </div>

      {/* ── Documents ── */}
      {showDocs && (
        <div style={{
          margin: "0 16px 12px 64px",
          background: "#f8fafc", borderRadius: "8px",
          padding: "10px 12px", border: "1px solid #e2e8f0"
        }}>
          {loadingDocs ? (
            <div style={{ fontSize: "12px", color: "#64748b" }}>Loading files...</div>
          ) : documents.map(doc => (
            <div key={doc.documentId} style={{
              display: "flex", alignItems: "center", gap: "8px",
              padding: "5px 0", fontSize: "13px"
            }}>
              <i className="bi bi-file-earmark-text" style={{ color: "#1a3c5e", fontSize: "15px" }} />
              <a
                href={`${API_URL}/${doc.filePath}`}
                target="_blank"
                rel="noreferrer"
                style={{ color: "#1d4ed8", textDecoration: "none", flex: 1, fontWeight: 500 }}
              >
                {doc.fileName}
              </a>
              <span style={{ color: "#94a3b8", fontSize: "11px" }}>
                {formatBytes(doc.fileSize)} · {timeAgo(doc.uploadedOn)}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* ── Replies ── */}
      {showReplies && (
        <div style={{
          borderTop: "1px solid #f1f5f9",
          padding: "4px 16px 4px 64px",
          background: "#fafafa"
        }}>
          {loadingReplies ? (
            <div style={{ padding: "12px 0", fontSize: "13px", color: "#94a3b8" }}>
              <span className="spinner-border spinner-border-sm me-2" />
              Loading replies...
            </div>
          ) : replies.length === 0 ? (
            <div style={{ padding: "12px 0", fontSize: "13px", color: "#94a3b8" }}>
              No replies yet.
            </div>
          ) : replies.map(reply => (
            <ReplyItem key={reply.commentId} reply={reply} />
          ))}
        </div>
      )}

      {/* ── Reply input ── */}
      {showReplyBox && (
        <div style={{
          borderTop: "1px solid #f1f5f9",
          padding: "12px 16px 14px 64px",
          background: "#fafafa"
        }}>
          <MentionInput
            value={replyText}
            onChange={setReplyText}
            onMentionsChange={setReplyMentions}
            placeholder="Write a reply... Use @ to mention, # for tasks"
            disabled={submittingReply}
            projectId={projectId}
          />
          {replyError && (
            <div style={{ color: "#ef4444", fontSize: "12px", marginTop: "4px" }}>
              {replyError}
            </div>
          )}
          <div style={{
            display: "flex", gap: "8px",
            marginTop: "10px", justifyContent: "flex-end"
          }}>
            <button
              onClick={() => { setShowReplyBox(false); setReplyText(""); setReplyError(""); }}
              style={{
                background: "none", border: "1px solid #e2e8f0",
                borderRadius: "6px", padding: "6px 16px",
                fontSize: "13px", cursor: "pointer", color: "#64748b",
                fontWeight: 500
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmitReply}
              disabled={submittingReply || !replyText.trim()}
              style={{
                background: submittingReply || !replyText.trim() ? "#94a3b8" : "#1a3c5e",
                color: "#fff", border: "none",
                borderRadius: "6px", padding: "6px 18px",
                fontSize: "13px", cursor: "pointer", fontWeight: 600,
                display: "flex", alignItems: "center", gap: "6px"
              }}
            >
              {submittingReply
                ? <><span className="spinner-border spinner-border-sm" /> Posting...</>
                : <><i className="bi bi-send" /> Post Reply</>}
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
const [inputKey, setInputKey] = useState(0);
  const [comments, setComments]               = useState([]);
  const [loading, setLoading]                 = useState(true);
  const [loadingMore, setLoadingMore]         = useState(false);
  const [page, setPage]                       = useState(1);
  const [hasMore, setHasMore]                 = useState(true);
  const [commentText, setCommentText]         = useState("");
  const [mentions, setMentions]               = useState([]);
  const [files, setFiles]                     = useState([]);
  const [submitting, setSubmitting]           = useState(false);
  const [submitError, setSubmitError]         = useState("");
  const [connected, setConnected]             = useState(false);
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
    const token = localStorage.getItem("pmToken");

const hub = new signalR.HubConnectionBuilder()
  .withUrl(HUB_URL, {
    skipNegotiation: false,
    transport:
      signalR.HttpTransportType.WebSockets |
      signalR.HttpTransportType.LongPolling,
    accessTokenFactory: () => token ?? "",  
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
     console.log("Payload:", JSON.stringify({
    projectId:       projectId,
    parentCommentId: null,
    commentText:     commentText.trim(),
    createdBy:       currentUserId,
    mentionTypes:    mentions.map(m => m.type),
    mentionIds:      mentions.map(m => m.id),
  }));
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
        } catch (err) { console.error("File upload failed:", err); }
      }

      setCommentText("");
      setMentions([]);
      setFiles([]);
      setInputKey(prev => prev + 1);
      if (!connected) await fetchComments(1, false);
    } catch (err) {
      setSubmitError(err.message || "Failed to post comment.");
    } finally { setSubmitting(false); }
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
    if (valid.length !== e.target.files.length)
      alert("Some files were skipped. Only PDF, Word, Excel, images and TXT under 10MB are allowed.");
    setFiles(prev => [...prev, ...valid]);
    e.target.value = "";
  };

  const removeFile = (idx) => setFiles(prev => prev.filter((_, i) => i !== idx));

  return (
   <div style={{
  padding: "24px 0",
  height: "calc(100vh - 250px)",
  overflowY: "auto",
  paddingRight: "8px"
}}>

      {/* ── Header ── */}
      <div style={{
        display: "flex", alignItems: "center",
        justifyContent: "space-between", marginBottom: "24px"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{
            width: "36px", height: "36px", borderRadius: "10px",
            background: "#1a3c5e", display: "flex", alignItems: "center",
            justifyContent: "center", color: "#fff", fontSize: "16px"
          }}>
            <i className="bi bi-chat-dots-fill" />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: "16px", color: "#0f172a" }}>
              Collaboration Space
            </div>
            <div style={{ fontSize: "12px", color: "#94a3b8", marginTop: "1px" }}>
              {comments.length} comment{comments.length !== 1 ? "s" : ""}
            </div>
          </div>
          <span style={{
            fontSize: "11px", padding: "3px 10px", borderRadius: "20px",
            background: connected ? "#f0fdf4" : "#fefce8",
            color:      connected ? "#15803d" : "#854d0e",
            fontWeight: 600,
            border: `1px solid ${connected ? "#bbf7d0" : "#fde68a"}`
          }}>
            <i className="bi bi-circle-fill me-1" style={{ fontSize: "7px" }} />
            {connected ? "Live" : "Connecting..."}
          </span>
        </div>
      </div>

      {/* Connection error */}
      {connectionError && (
        <div style={{
          background: "#fefce8", border: "1px solid #fde68a",
          borderRadius: "8px", padding: "10px 14px", fontSize: "13px",
          color: "#854d0e", marginBottom: "20px",
          display: "flex", alignItems: "center", gap: "8px"
        }}>
          <i className="bi bi-exclamation-triangle-fill" />
          Real-time updates unavailable. Comments will still be saved.
        </div>
      )}

      {/* ── Compose box ── */}
      <div style={{
        background: "#fff", borderRadius: "12px",
        border: "1px solid #e2e8f0", padding: "16px",
        marginBottom: "28px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)"
      }}>
        <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
          {/* User avatar */}
          <div style={{
            width: "36px", height: "36px", borderRadius: "50%", flexShrink: 0,
            background: getAvatarColor(currentUserId), color: "#fff",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "13px", fontWeight: 700
          }}>
            {getInitials(currentUserName)}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
          <MentionInput
  key={inputKey}           // ← add this
  value={commentText}
  onChange={setCommentText}
  onMentionsChange={setMentions}
  placeholder="Write a comment... Use @ to mention someone, # for tasks"
  disabled={submitting}
  projectId={projectId}
/>

            {/* File chips */}
            {files.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "8px" }}>
                {files.map((f, idx) => (
                  <div key={idx} style={{
                    display: "flex", alignItems: "center", gap: "5px",
                    background: "#eff6ff", borderRadius: "6px",
                    padding: "3px 10px", fontSize: "12px",
                    color: "#1d4ed8", border: "1px solid #bfdbfe"
                  }}>
                    <i className="bi bi-file-earmark" />
                    <span style={{
                      maxWidth: "100px", overflow: "hidden",
                      textOverflow: "ellipsis", whiteSpace: "nowrap"
                    }}>{f.name}</span>
                    <span style={{ color: "#93c5fd" }}>({formatBytes(f.size)})</span>
                    <button
                      onClick={() => removeFile(idx)}
                      style={{
                        background: "none", border: "none", cursor: "pointer",
                        color: "#ef4444", padding: "0 2px",
                        fontSize: "14px", lineHeight: 1
                      }}
                    >×</button>
                  </div>
                ))}
              </div>
            )}

            {submitError && (
              <div style={{ color: "#ef4444", fontSize: "12px", marginTop: "6px" }}>
                {submitError}
              </div>
            )}

            {/* Toolbar */}
            <div style={{
              display: "flex", justifyContent: "space-between",
              alignItems: "center", marginTop: "12px"
            }}>
              <button
                onClick={() => fileInputRef.current?.click()}
                style={{
                  background: "none", border: "1px solid #e2e8f0",
                  borderRadius: "6px", padding: "5px 12px", fontSize: "13px",
                  cursor: "pointer", color: "#64748b",
                  display: "flex", alignItems: "center", gap: "6px",
                  transition: "all 0.15s",width:"fit-content"
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "#1a3c5e"; e.currentTarget.style.color = "#1a3c5e"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.color = "#64748b"; }}
              >
                <i className="bi bi-paperclip" /> Attach
              </button>
              <input
                ref={fileInputRef} type="file" multiple
                style={{ display: "none" }}
                onChange={handleFileSelect}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.txt"
              />

              <button
                onClick={handleSubmit}
                disabled={submitting || !commentText.trim()}
                style={{
                  background: submitting || !commentText.trim() ? "#94a3b8" : "#1a3c5e",
                  color: "#fff", border: "none", borderRadius: "8px",
                  padding: "8px 22px", fontSize: "13px", fontWeight: 600,
                  cursor: submitting || !commentText.trim() ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", gap: "6px",
                  transition: "background 0.15s",width:"fit-content"
                }}
              >
                {submitting
                  ? <><span className="spinner-border spinner-border-sm" /> Posting...</>
                  : <><i className="bi bi-send-fill" /> Post</>}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Divider ── */}
      {!loading && comments.length > 0 && (
        <div style={{
          display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px"
        }}>
          <div style={{ flex: 1, height: "1px", background: "#e2e8f0" }} />
          <span style={{ fontSize: "12px", color: "#94a3b8", fontWeight: 500 }}>
            {comments.length} comment{comments.length !== 1 ? "s" : ""}
          </span>
          <div style={{ flex: 1, height: "1px", background: "#e2e8f0" }} />
        </div>
      )}

      {/* ── Comments ── */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "48px 0", color: "#94a3b8" }}>
          <div className="spinner-border spinner-border-sm me-2" />
          Loading comments...
        </div>
      ) : comments.length === 0 ? (
        <div style={{ textAlign: "center", padding: "56px 0", color: "#cbd5e1" }}>
          <div style={{
            width: "64px", height: "64px", borderRadius: "16px",
            background: "#f1f5f9", margin: "0 auto 16px",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "28px"
          }}>
            <i className="bi bi-chat-dots" style={{ color: "#94a3b8" }} />
          </div>
          <div style={{ fontSize: "15px", fontWeight: 600, color: "#64748b" }}>
            No comments yet
          </div>
          <div style={{ fontSize: "13px", marginTop: "6px", color: "#94a3b8" }}>
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
            <div style={{ textAlign: "center", marginTop: "20px" }}>
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                style={{
                  background: "none", border: "1px solid #e2e8f0",
                  borderRadius: "8px", padding: "9px 28px",
                  fontSize: "13px", cursor: "pointer",
                  color: "#1a3c5e", fontWeight: 600,
                  transition: "all 0.15s"
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = "#1a3c5e"}
                onMouseLeave={e => e.currentTarget.style.borderColor = "#e2e8f0"}
              >
                {loadingMore
                  ? <><span className="spinner-border spinner-border-sm me-2" />Loading...</>
                  : "Load older comments"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}