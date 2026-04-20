import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getUserDashboard } from "../api/userDashboardApi";
import { icon } from "../components/Data.jsx";

const PAGE_SIZE = 10;

/* ─────────────────────────────────────────────────────────
   SHARED DESIGN ATOMS  (identical to Dashboard.jsx)
───────────────────────────────────────────────────────── */
const StatusBadge = ({ status }) => {
  const map = {
    Pending:      { bg: "#fee2e2", color: "#991b1b", dot: "#ef4444" },
    Acknowledged: { bg: "#dcfce7", color: "#166534", dot: "#22c55e" },
    Hold:         { bg: "#fef9c3", color: "#854d0e", dot: "#eab308" },
  };
  const s = map[status] || { bg: "#f1f5f9", color: "#475569", dot: "#94a3b8" };
  return (
    <span style={{
      background: s.bg, color: s.color, fontSize: 11, fontWeight: 600,
      padding: "3px 10px", borderRadius: 20,
      display: "inline-flex", alignItems: "center", gap: 5,
      border: `1px solid ${s.dot}33`,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: s.dot, flexShrink: 0 }} />
      {status || "—"}
    </span>
  );
};

const TypeBadge = ({ type }) => {
  const map = {
    project:   { label: "Project",   bg: "#ede9fe", color: "#5b21b6" },
    milestone: { label: "Milestone", bg: "#e0f2fe", color: "#0369a1" },
    task:      { label: "Task",      bg: "#fff7ed", color: "#c2410c" },
  };
  const s = map[type] || { label: type, bg: "#f1f5f9", color: "#475569" };
  return (
    <span style={{
      background: s.bg, color: s.color, fontSize: 10, fontWeight: 700,
      padding: "2px 8px", borderRadius: 20, letterSpacing: 0.3,
    }}>{s.label}</span>
  );
};

const SummaryCard = ({ number, label, color, icon, onClick, active }) => (
  <div onClick={onClick} style={{
    background: active ? color + "12" : "#fff",
    border: `1.5px solid ${(active || number > 0) ? color + "44" : "#e2e8f0"}`,
    borderRadius: 12, padding: "14px 18px",
    cursor: onClick ? "pointer" : "default",
    display: "flex", alignItems: "center", gap: 12,
    boxShadow: active ? `0 2px 8px ${color}22` : "0 1px 4px rgba(0,0,0,0.05)",
    transition: "all 0.15s", minWidth: 150,
  }}>
    <div style={{
      width: 40, height: 40, borderRadius: 10, background: color + "18",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 18, flexShrink: 0,
    }}>{icon}</div>
    <div>
      <div style={{ fontSize: 24, fontWeight: 800, color, lineHeight: 1 }}>{number}</div>
      <div style={{ fontSize: 11, color: "#64748b", marginTop: 2, fontWeight: 500 }}>{label}</div>
    </div>
  </div>
);

const DaysCell = ({ days }) => {
  if (days === null || days === undefined || days === "—") return <span style={{ color: "#94a3b8" }}>—</span>;
  const n = Number(days);
  if (isNaN(n)) return <span style={{ color: "#94a3b8" }}>—</span>;
  if (n < 0)  return <span style={{ color: "#dc2626", fontWeight: 700 }}>{n}d</span>;
  if (n <= 3) return <span style={{ color: "#d97706", fontWeight: 700 }}>{n}d</span>;
  return <span style={{ color: "#16a34a", fontWeight: 600 }}>{n}d</span>;
};

const TH = ({ children }) => (
  <th style={{
    padding: "11px 14px", fontWeight: 600, fontSize: 11,
    textTransform: "uppercase", letterSpacing: 0.6,
    color: "rgba(255,255,255,0.72)", whiteSpace: "nowrap", border: "none",
  }}>{children}</th>
);

/* ─────────────────────────────────────────────────────────
   PL OVERVIEW SECTION
───────────────────────────────────────────────────────── */
const PlOverviewSection = ({ rows }) => {
  if (!rows || rows.length === 0) return null;

  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <h5 style={{ fontWeight: 700, color: "#0d1b3e", margin: 0, fontSize: 15 }}>
          👤 Projects You Lead
        </h5>
        <span style={{
          background: "#e0f2fe", color: "#0369a1", fontSize: 11,
          fontWeight: 700, padding: "2px 8px", borderRadius: 20,
        }}>
          {rows.length} project{rows.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
        {rows.map((proj) => {
          const pct      = proj.mileAckPct ?? 0;
          const allDone  = proj.totalMilestones > 0 && proj.milePending === 0 && proj.mileHold === 0;
          const hasHold  = proj.mileHold > 0 || proj.taskHold > 0 || proj.subtaskHold > 0;
          const barColor = allDone ? "#16a34a" : hasHold ? "#d97706" : "#1a56db";

          const stats = [
            { label: "Milestones", total: proj.totalMilestones, pending: proj.milePending, ack: proj.mileAck, hold: proj.mileHold, icon: "🚩" },
            { label: "Tasks",      total: proj.totalTasks,      pending: proj.taskPending, ack: proj.taskAck, hold: proj.taskHold, icon: "📋" },
            { label: "Subtasks",   total: proj.totalSubtasks,   pending: proj.subtaskPending, ack: proj.subtaskAck, hold: proj.subtaskHold, icon: "🔹" },
          ];

          return (
            <div key={proj.projectId} style={{
              background: "#fff",
              border: "1.5px solid #e2e8f0",
              borderRadius: 12,
              padding: "16px 18px",
              boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
              minWidth: 280,
              maxWidth: 340,
              flex: "1 1 280px",
            }}>
              {/* Project name + timeline */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: "#0d1b3e", lineHeight: 1.4, flex: 1, paddingRight: 8 }}>
                  {proj.projectName}
                </div>
                <span style={{ fontSize: 11, color: "#64748b", whiteSpace: "nowrap" }}>
                  📅 {proj.projectTimeline}
                </span>
              </div>

              {/* Progress bar */}
              <div style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 11, color: "#64748b" }}>Milestone ACK Progress</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: barColor }}>{pct}%</span>
                </div>
                <div style={{ height: 6, borderRadius: 10, background: "#e2e8f0", overflow: "hidden" }}>
                  <div style={{
                    height: "100%", width: `${pct}%`,
                    background: barColor, borderRadius: 10,
                    transition: "width 0.5s ease",
                  }} />
                </div>
              </div>

              {/* Stats rows */}
              {stats.map(({ label, total, pending, ack, hold, icon: ic }) => (
                <div key={label} style={{
                  display: "flex", alignItems: "center",
                  justifyContent: "space-between",
                  padding: "6px 0",
                  borderTop: "1px solid #f1f5f9",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 13 }}>{ic}</span>
                    <span style={{ fontSize: 12, color: "#475569", fontWeight: 500 }}>{label}</span>
                    <span style={{
                      background: "#f1f5f9", color: "#64748b",
                      fontSize: 10, fontWeight: 700,
                      padding: "1px 6px", borderRadius: 20,
                    }}>{total}</span>
                  </div>
                  {total === 0 ? (
                    <span style={{ fontSize: 11, color: "#94a3b8" }}>None</span>
                  ) : (
                    <div style={{ display: "flex", gap: 4 }}>
                      <span style={{ background: "#fee2e2", color: "#991b1b", fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 20 }} title="Pending">{pending} P</span>
                      <span style={{ background: "#dcfce7", color: "#166534", fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 20 }} title="Acknowledged">{ack} A</span>
                      <span style={{ background: "#fef9c3", color: "#854d0e", fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 20 }} title="Hold">{hold} H</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────
   ACK ACTION MODAL
───────────────────────────────────────────────────────── */
const ActionModal = ({ context, onClose, onSelect }) => {
  if (!context) return null;
  const { type, projectName, items } = context;
  const isMilestone = type === "milestone";
  const isTask      = type === "task";
  const entityLabel = isMilestone ? "milestone" : isTask ? "task" : "project";
  const getLabel    = (item) => isMilestone ? item.milestone_Name : isTask ? item.task_Name : item.project_Name;
  const getSubLabel = (item) => item.assigned_By ?? item.task_Assigned_By;
  const getDate     = (item) => isMilestone ? item.milestone_DueDate : isTask ? item.task_Due_Date : item.project_Timeline;
  const getStatus   = (item) => item.status ?? item.ack_Status_Text;

  const statusDot = { Pending: "#ef4444", Acknowledged: "#22c55e", Hold: "#eab308" };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1055,
      background: "rgba(0,0,0,0.45)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem",
    }} onClick={onClose}>
      <div style={{
        width: "100%", maxWidth: 560, maxHeight: "80vh",
        display: "flex", flexDirection: "column",
        background: "#fff", borderRadius: 14,
        boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid #f1f5f9" }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: "#0d1b3e" }}>{projectName}</div>
            <div style={{ fontSize: 12, color: "#64748b" }}>Select a {entityLabel} to acknowledge</div>
          </div>
          <button onClick={onClose} style={{ background: "#f1f5f9", border: "none", borderRadius: 8, width: 30, height: 30, cursor: "pointer", fontSize: 16, color: "#475569" }}>×</button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "10px 16px" }}>
          {items.length === 0 ? (
            <p style={{ textAlign: "center", color: "#94a3b8", padding: "24px 0" }}>No {entityLabel}s available.</p>
          ) : items.map((item, idx) => {
            const st = getStatus(item);
            return (
              <div key={idx} onClick={() => onSelect(item)} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
                padding: "10px 14px", border: "1px solid #e9ecef", borderRadius: 8,
                cursor: "pointer", marginBottom: 6, transition: "background 0.12s",
              }}
                onMouseEnter={e => e.currentTarget.style.background = "#f0f4ff"}
                onMouseLeave={e => e.currentTarget.style.background = "#fff"}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
                  <i className="bi bi-arrow-right-circle" style={{ color: "#1a56db", fontSize: 15, flexShrink: 0 }}></i>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, color: "#0d1b3e", wordBreak: "break-word" }}>{getLabel(item)}</div>
                    {getSubLabel(item) && <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>Assigned by: {getSubLabel(item)}</div>}
                  </div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  {getDate(item) && <div style={{ fontSize: 11, color: "#64748b" }}>{getDate(item)}</div>}
                  {st && (
                    <span style={{
                      display: "inline-flex", alignItems: "center", gap: 4, marginTop: 3,
                      fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 20,
                      background: (statusDot[st] || "#94a3b8") + "18",
                      color: st === "Pending" ? "#991b1b" : st === "Acknowledged" ? "#166534" : "#854d0e",
                    }}>
                      <span style={{ width: 5, height: 5, borderRadius: "50%", background: statusDot[st] || "#94a3b8" }} />
                      {st}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ padding: "10px 20px", borderTop: "1px solid #f1f5f9", display: "flex", justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ background: "#f1f5f9", border: "none", borderRadius: 8, padding: "7px 18px", cursor: "pointer", fontSize: 13, color: "#475569", fontWeight: 600 }}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────────────────── */
const UserDashboard = () => {
  const [data, setData]             = useState(null);
  const [error, setError]           = useState("");
  const [search, setSearch]         = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatus]   = useState("all");
  const [page, setPage]             = useState(1);
  const [modalContext, setModal]    = useState(null);

  const navigate = useNavigate();
  const userId   = sessionStorage.getItem("userId");

  useEffect(() => {
    if (!userId) { navigate("/", { replace: true }); return; }
    (async () => {
      try {
        const result = await getUserDashboard(userId);
        setData(result);
      } catch (err) {
        console.error(err);
        setError("Failed to load acknowledgment data.");
      }
    })();
  }, [userId, navigate]);

  /* ── Flatten all items into a unified list ── */
  const allRows = useMemo(() => {
    if (!data) return [];
    const projects = (data.projects || []).map(p => ({
      type:        "project",
      projectId:   p.project_Id,
      milestoneId: 0,
      taskDtlId:   0,
      parentTaskId: 0,
      projectName: p.project_Name,
      itemName:    null,
      assignedBy:  p.assigned_By,
      dueDate:     p.project_Timeline,
      daysLeft:    null,
      status:      p.status,
      raw:         p,
    }));

    const milestones = (data.milestones || []).map(m => ({
      type:        "milestone",
      projectId:   m.project_Id,
      milestoneId: m.milestone_Id,
      taskDtlId:   0,
      parentTaskId: 0,
      projectName: m.project_Name,
      itemName:    m.milestone_Name,
      assignedBy:  m.assigned_By,
      dueDate:     m.milestone_DueDate,
      daysLeft:    m.days_Left,
      status:      m.status,
      raw:         m,
    }));

    const tasks = (data.tasks || []).map(t => ({
      type:        "task",
      projectId:   t.project_Id,
      milestoneId: t.milestone_Id,
      taskDtlId:   t.task_Dtl_Id,
      parentTaskId: t.parent_Task_Id,
      projectName: t.project_Name,
      itemName:    t.task_Name,
      assignedBy:  t.task_Assigned_By,
      dueDate:     t.task_Due_Date,
      daysLeft:    null,
      status:      t.ack_Status_Text,
      raw:         t,
    }));

    return [...projects, ...milestones, ...tasks];
  }, [data]);

  /* ── Summary counts ── */
  const pendingCount = useMemo(() => (data?.proj_Total_Pending ?? 0) + (data?.mile_Total_Pending ?? 0) + (data?.task_Total_Pending ?? 0), [data]);
  const ackCount     = useMemo(() => (data?.proj_Total_Ack     ?? 0) + (data?.mile_Total_Ack    ?? 0) + (data?.task_Total_Ack    ?? 0), [data]);
  const holdCount    = useMemo(() => (data?.proj_Total_Hold    ?? 0) + (data?.mile_Total_Hold   ?? 0) + (data?.task_Total_Hold   ?? 0), [data]);
  const plCount      = useMemo(() => data?.plOverview?.length ?? 0, [data]);

  /* ── Filtered rows ── */
  const filtered = useMemo(() => {
    return allRows.filter(r => {
      if (typeFilter !== "all"   && r.type   !== typeFilter)   return false;
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        r.projectName?.toLowerCase().includes(q) ||
        r.itemName?.toLowerCase().includes(q)    ||
        r.assignedBy?.toLowerCase().includes(q)  ||
        r.status?.toLowerCase().includes(q)
      );
    });
  }, [allRows, typeFilter, statusFilter, search]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged      = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  /* ── Modal handlers ── */
  const openModal  = useCallback((ctx) => setModal(ctx), []);
  const closeModal = useCallback(() => setModal(null), []);

  const handleModalSelect = useCallback((item) => {
    closeModal();
    const type = modalContext?.type;
    if (type === "project") {
      navigate(`/user_acknowledge/${item.project_Id}`);
    } else if (type === "milestone") {
      navigate(`/user_acknowledge_milestone/${item.project_Id}/${item.milestone_Id}`);
    } else {
      navigate(`/user_acknowledge_task/${item.project_Id}/${item.milestone_Id}/${item.parent_Task_Id}/${item.task_Dtl_Id}`);
    }
  }, [modalContext, navigate, closeModal]);

  /* ── Row action click — groups items for modal ── */
  const handleAction = useCallback((row) => {
    if (row.type === "project") {
      openModal({ type: "project", projectName: row.projectName, items: [row.raw] });
    } else if (row.type === "milestone") {
      // group all milestones for this project
      const items = (data?.milestones || []).filter(m => m.project_Id === row.projectId);
      openModal({ type: "milestone", projectName: row.projectName, items });
    } else {
      // group all tasks for this project
      const items = (data?.tasks || []).filter(t => t.project_Id === row.projectId);
      openModal({ type: "task", projectName: row.projectName, items });
    }
  }, [data, openModal]);

  if (!userId) return null;

  return (
    <div style={{ fontFamily: "'Inter','Segoe UI',sans-serif" }}>

      {error && <div className="alert alert-danger mb-3">{error}</div>}

      {/* ── Page title ── */}
      <h5 style={{ fontWeight: 700, color: "#0d1b3e", marginBottom: 14, fontSize: 16 }}>
        Acknowledgment Overview
      </h5>

      {/* ── Summary Cards ── */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 24 }}>
        <SummaryCard
          number={pendingCount} label="Pending" color="#dc2626" icon="⏳"
          active={statusFilter === "Pending"}
          onClick={() => { setStatus(s => s === "Pending" ? "all" : "Pending"); setPage(1); }}
        />
        <SummaryCard
          number={ackCount} label="Acknowledged" color="#16a34a" icon="✅"
          active={statusFilter === "Acknowledged"}
          onClick={() => { setStatus(s => s === "Acknowledged" ? "all" : "Acknowledged"); setPage(1); }}
        />
        <SummaryCard
          number={holdCount} label="On Hold" color="#d97706" icon="⏸️"
          active={statusFilter === "Hold"}
          onClick={() => { setStatus(s => s === "Hold" ? "all" : "Hold"); setPage(1); }}
        />
        {plCount > 0 && (
          <SummaryCard
            number={plCount} label="Projects You Lead" color="#1a56db" icon="👤"
            onClick={() => document.getElementById("pl-overview-section")?.scrollIntoView({ behavior: "smooth" })}
          />
        )}
      </div>

      {/* ── PL Overview ── */}
      {data?.plOverview?.length > 0 && (
        <div id="pl-overview-section">
          <PlOverviewSection rows={data.plOverview} />
        </div>
      )}

      {/* ── Filter + Search ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <h5 style={{ fontWeight: 700, color: "#0d1b3e", margin: 0, fontSize: 15 }}>
            Pending Actions
            <span style={{ background: "#e2e8f0", color: "#475569", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20, marginLeft: 8 }}>
              {filtered.length}
            </span>
          </h5>
          <div style={{ display: "flex", gap: 5, marginLeft: 8 }}>
            {["all", "project", "milestone", "task"].map(f => (
              <button key={f} onClick={() => { setTypeFilter(f); setPage(1); }} style={{
                background:    typeFilter === f ? "#0d1b3e" : "#f1f5f9",
                color:         typeFilter === f ? "#fff"    : "#475569",
                border: "none", borderRadius: 20, padding: "4px 12px",
                fontSize: 12, fontWeight: 600, cursor: "pointer",
                textTransform: "capitalize", transition: "all 0.15s",
              }}>{f}</button>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "6px 12px", maxWidth: 320, width: "100%" }}>
          <i className="bi bi-search" style={{ color: "#94a3b8", fontSize: 13 }} />
          <input
            type="text" placeholder="Search project, milestone, task..."
            value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            style={{ border: "none", outline: "none", fontSize: 13, background: "transparent", flex: 1, color: "#0d1b3e" }}
          />
          {search && (
            <button onClick={() => { setSearch(""); setPage(1); }}
              style={{ border: "none", background: "none", cursor: "pointer", color: "#94a3b8", fontSize: 16, lineHeight: 1 }}>×</button>
          )}
        </div>
      </div>

      {/* ── Table ── */}
      <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#0d1b3e" }}>
                <TH>Action</TH>
                <TH>Type</TH>
                <TH>Project Name</TH>
                <TH>Item</TH>
                <TH>Assigned By</TH>
                <TH>Due Date</TH>
                <TH>Days Left</TH>
                <TH>Status</TH>
              </tr>
            </thead>
            <tbody>
              {!data ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: "center", padding: 32, color: "#64748b" }}>
                    <div className="spinner-border spinner-border-sm text-primary me-2" />Loading...
                  </td>
                </tr>
              ) : paged.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: "center", padding: 40, color: "#94a3b8" }}>
                    No items found
                  </td>
                </tr>
              ) : paged.map((row, i) => {
                const n       = Number(row.daysLeft);
                const overdue = !isNaN(n) && n < 0;
                const baseBg  = overdue ? "#fff5f5" : i % 2 === 0 ? "#fff" : "#fafbfc";
                return (
                  <tr key={i}
                    style={{ borderBottom: "1px solid #f1f5f9", background: baseBg, transition: "background 0.12s" }}
                    onMouseEnter={e => e.currentTarget.style.background = "#f0f4ff"}
                    onMouseLeave={e => e.currentTarget.style.background = baseBg}
                  >
                    <td style={{ padding: "10px 14px" }}>
                      <button
                        onClick={() => handleAction(row)}
                        title="Acknowledge"
                        style={{ background: "#f1f5f9", border: "1.5px solid #e2e8f0", borderRadius: 6, padding: "5px 10px", cursor: "pointer", color: "#1a56db", fontSize: 13 }}
                      >
                        <i className={icon[0]} />
                      </button>
                    </td>
                    <td style={{ padding: "10px 14px" }}><TypeBadge type={row.type} /></td>
                    <td style={{ padding: "10px 14px", fontWeight: 600, color: "#0d1b3e", maxWidth: 200 }}>
                      <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{row.projectName}</div>
                    </td>
                    <td style={{ padding: "10px 14px", color: "#475569", maxWidth: 180 }}>
                      <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {row.itemName || <span style={{ color: "#cbd5e1" }}>—</span>}
                      </div>
                    </td>
                    <td style={{ padding: "10px 14px", color: "#475569", fontSize: 12.5 }}>{row.assignedBy || "—"}</td>
                    <td style={{ padding: "10px 14px", color: "#475569", fontSize: 12.5, whiteSpace: "nowrap" }}>{row.dueDate || "—"}</td>
                    <td style={{ padding: "10px 14px" }}><DaysCell days={row.daysLeft} /></td>
                    <td style={{ padding: "10px 14px" }}><StatusBadge status={row.status} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderTop: "1px solid #f1f5f9", background: "#fafbfc" }}>
            <span style={{ fontSize: 12, color: "#64748b" }}>
              Showing {((page - 1) * PAGE_SIZE) + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
            </span>
            <div style={{ display: "flex", gap: 4 }}>
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                style={{ padding: "4px 10px", border: "1px solid #e2e8f0", borderRadius: 6, background: "#fff", cursor: "pointer", fontSize: 13, width: "auto" }}>‹</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                .reduce((acc, p, i, arr) => {
                  if (i > 0 && p - arr[i - 1] > 1) acc.push("...");
                  acc.push(p);
                  return acc;
                }, [])
                .map((p, i) => p === "..." ? (
                  <span key={`e${i}`} style={{ padding: "4px 8px", color: "#94a3b8", fontSize: 13 }}>…</span>
                ) : (
                  <button key={p} onClick={() => setPage(p)} style={{
                    padding: "4px 10px", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 13,
                    cursor: "pointer", width: "auto",
                    background: page === p ? "#0d1b3e" : "#fff",
                    color:      page === p ? "#fff"    : "#0d1b3e",
                    fontWeight: page === p ? 700       : 400,
                  }}>{p}</button>
                ))}
              <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}
                style={{ padding: "4px 10px", border: "1px solid #e2e8f0", borderRadius: 6, background: "#fff", cursor: "pointer", fontSize: 13, width: "auto" }}>›</button>
            </div>
          </div>
        )}
      </div>

      <ActionModal context={modalContext} onClose={closeModal} onSelect={handleModalSelect} />
    </div>
  );
};

export default UserDashboard;