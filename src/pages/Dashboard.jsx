import { useEffect, useState } from "react";
import { useNavigate } from 'react-router-dom';
import '../styles/Dashboard.css';
import { getUserDashboard, getHoldAlerts } from '../api/userDashboardApi';

const PAGE_SIZE = 10;

const RoleBadge = ({ isPL, isCreator, isAssigned }) => {
  const badges = [];
  if (isCreator) badges.push({ label: "Creator", bg: "#1a3c5e", color: "#fff" });
  if (isPL) badges.push({ label: "PL", bg: "#1a56db", color: "#fff" });
  if (isAssigned) badges.push({ label: "Assigned", bg: "#059669", color: "#fff" });
  if (!badges.length) return null;
  return (
    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
      {badges.map(b => (
        <span key={b.label} style={{
          background: b.bg, color: b.color, fontSize: 10, fontWeight: 700,
          padding: "2px 7px", borderRadius: 20, letterSpacing: 0.3
        }}>{b.label}</span>
      ))}
    </div>
  );
};

const StatusBadge = ({ status }) => {
  const map = {
    "Pending": { bg: "#fee2e2", color: "#991b1b", dot: "#ef4444" },
    "Acknowledged": { bg: "#dcfce7", color: "#166534", dot: "#22c55e" },
    "Hold": { bg: "#fef9c3", color: "#854d0e", dot: "#eab308" },
    "Completed": { bg: "#dbeafe", color: "#1e40af", dot: "#3b82f6" },
  };
  const s = map[status] || { bg: "#f1f5f9", color: "#475569", dot: "#94a3b8" };
  return (
    <span style={{
      background: s.bg, color: s.color, fontSize: 11, fontWeight: 600,
      padding: "3px 10px", borderRadius: 20,
      display: "inline-flex", alignItems: "center", gap: 5,
      border: `1px solid ${s.dot}33`
    }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: s.dot, flexShrink: 0 }} />
      {status || "—"}
    </span>
  );
};

const TypeBadge = ({ type }) => {
  const map = {
    project: { label: "Project", bg: "#ede9fe", color: "#5b21b6" },
    milestone: { label: "Milestone", bg: "#e0f2fe", color: "#0369a1" },
    task: { label: "Task", bg: "#fff7ed", color: "#c2410c" },
  };
  const s = map[type] || { label: type, bg: "#f1f5f9", color: "#475569" };
  return (
    <span style={{
      background: s.bg, color: s.color, fontSize: 10, fontWeight: 700,
      padding: "2px 8px", borderRadius: 20, letterSpacing: 0.3
    }}>{s.label}</span>
  );
};

const SummaryCard = ({ number, label, color, icon, onClick }) => (
  <div onClick={onClick} style={{
    background: "#fff", border: `1.5px solid ${number > 0 ? color + "44" : "#e2e8f0"}`,
    borderRadius: 12, padding: "14px 18px", cursor: onClick ? "pointer" : "default",
    display: "flex", alignItems: "center", gap: 12,
    boxShadow: "0 1px 4px rgba(0,0,0,0.05)", transition: "all 0.15s", minWidth: 150,
  }}>
    <div style={{
      width: 40, height: 40, borderRadius: 10, background: color + "18",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 18, flexShrink: 0
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
  if (n < 0) return <span style={{ color: "#dc2626", fontWeight: 700 }}>{n}d</span>;
  if (n <= 3) return <span style={{ color: "#d97706", fontWeight: 700 }}>{n}d</span>;
  return <span style={{ color: "#16a34a", fontWeight: 600 }}>{n}d</span>;
};

export default function Dashboard() {
  const navigate = useNavigate();
  const userId = sessionStorage.getItem("userId");

  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [typeFilter, setType] = useState("all");
  const [statusFilter, setStatus] = useState("all");

  useEffect(() => {
    if (!userId) { navigate("/", { replace: true }); return; }
    load();

  }, [userId]);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const d = await getUserDashboard(userId);
      setSummary(d);

      const projectRows = (d.projects || []).map(p => ({
        type: "project",
        projectId: p.project_Id,
        milestoneId: p.milestone_Id || 0,
        projectName: p.project_Name,
        itemName: p.milestone_Name || null,
        assignedBy: p.assigned_By,
        dueDate: p.milestone_Due_Date && !String(p.milestone_Due_Date).startsWith("0001")
          ? p.milestone_Due_Date : p.project_Timeline,
        daysLeft: p.milestone_Due_Date && !String(p.milestone_Due_Date).startsWith("0001")
          ? p.days_Left : null,
        status: p.status,
        isPL: p.is_PL === 1,
        isCreator: p.is_Creator === 1,
        isAssigned: p.is_Assigned === 1,
      }));

      const milestoneRows = (d.milestones || []).map(m => ({
        type: "milestone",
        projectId: m.project_Id,
        milestoneId: m.milestone_Id,
        projectName: m.project_Name,
        itemName: m.milestone_Name,
        assignedBy: m.assigned_By,
        dueDate: m.milestone_DueDate,
        daysLeft: m.days_Left,
        status: m.status,
        isPL: false,
        isCreator: false,
        isAssigned: true,
      }));

      const taskRows = (d.tasks || []).map(t => ({
        type: "task",
        projectId: t.project_Id,
        milestoneId: t.milestone_Id,
        taskDtlId: t.task_Dtl_Id,
        projectName: t.project_Name,
        itemName: t.task_Name,
        assignedBy: t.task_Assigned_By,
        dueDate: t.task_Due_Date,
        daysLeft: null,
        status: t.ack_Status_Text,
        isPL: false,
        isCreator: false,
        isAssigned: true,
      }));

      const combined = [...projectRows, ...milestoneRows, ...taskRows];
      combined.sort((a, b) => b.projectId - a.projectId);
      setRows(combined);
      const alerts = await getHoldAlerts(userId);
      setHoldAlerts(alerts || []);
      setHoldAlertCount(alerts?.length || 0);
    } catch (err) {
      console.error(err);
      setError("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const handleView = (row) => navigate(`/project-details/${row.projectId}`);

  const filtered = rows.filter(r => {
    if (typeFilter !== "all" && r.type !== typeFilter) return false;
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      r.projectName?.toLowerCase().includes(q) ||
      r.itemName?.toLowerCase().includes(q) ||
      r.assignedBy?.toLowerCase().includes(q)
    );
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const [holdAlerts, setHoldAlerts] = useState([]);
  const [holdAlertCount, setHoldAlertCount] = useState(0)
  const pendingCount = rows.filter(r => r.status === "Pending").length;
  const holdCount = rows.filter(r => r.status === "Hold").length;
  const plCount = rows.filter(r => r.type === "project" && r.isPL).length;
  const creatorCount = rows.filter(r => r.type === "project" && r.isCreator).length;
  const milestoneCount = rows.filter(r => r.type === "milestone").length;
  const taskCount = rows.filter(r => r.type === "task").length;

  if (!userId) return null;

  const TH = ({ children }) => (
    <th style={{ padding: "11px 14px", fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: 0.6, color: "rgba(255,255,255,0.72)", whiteSpace: "nowrap", border: "none" }}>
      {children}
    </th>
  );

  return (
    <div style={{ fontFamily: "'Inter','Segoe UI',sans-serif" }}>

      {/* ── Summary ── */}
      <h5 style={{ fontWeight: 700, color: "#0d1b3e", marginBottom: 14, fontSize: 16 }}>Overview</h5>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 24 }}>
        <SummaryCard number={pendingCount} label="Pending" color="#dc2626" icon="⏳" onClick={() => { setType("all"); setStatus("Pending"); setSearch(""); setPage(1); }} />
        <SummaryCard number={holdCount} label="On Hold" color="#d97706" icon="⏸️" onClick={() => { setType("all"); setStatus("Hold"); setSearch(""); setPage(1); }} />
        <SummaryCard number={summary.total_Pending ?? 0} label="To Acknowledge" color="#0369a1" icon="🔔" onClick={() => navigate("/user_dashboard")} />
        <SummaryCard number={plCount} label="As Project Lead" color="#1a56db" icon="👤" onClick={() => { setType("project"); setSearch(""); setPage(1); }} />
        <SummaryCard number={creatorCount} label="As Creator" color="#7c3aed" icon="🔨" onClick={() => { setType("project"); setSearch(""); setPage(1); }} />
        <SummaryCard number={milestoneCount} label="My Milestones" color="#0891b2" icon="🚩" onClick={() => { setType("milestone"); setSearch(""); setPage(1); }} />
        <SummaryCard number={taskCount} label="My Tasks" color="#c2410c" icon="📋" onClick={() => { setType("task"); setSearch(""); setPage(1); }} />
        <SummaryCard
          number={holdAlertCount}
          label="Hold Alerts"
          color="#b45309"
          icon="⚠️"
          onClick={() =>
            document.getElementById("hold-alerts-section")
              ?.scrollIntoView({ behavior: "smooth" })
          }
        />
      </div>

      {/* ── Filter + Search bar ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <h5 style={{ fontWeight: 700, color: "#0d1b3e", margin: 0, fontSize: 15 }}>
            Activities
            <span style={{ background: "#e2e8f0", color: "#475569", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20, marginLeft: 8 }}>
              {filtered.length}
            </span>
          </h5>
          <div style={{ display: "flex", gap: 5, marginLeft: 8 }}>
            {["all", "project", "milestone", "task"].map(f => (
              <button key={f} onClick={() => { setType(f); setPage(1); }} style={{
                background: typeFilter === f ? "#0d1b3e" : "#f1f5f9",
                color: typeFilter === f ? "#fff" : "#475569",
                border: "none", borderRadius: 20, padding: "4px 12px",
                fontSize: 12, fontWeight: 600, cursor: "pointer",
                textTransform: "capitalize", transition: "all 0.15s"
              }}>{f}</button>
            ))}
          </div>
        </div>
        <select
          value={statusFilter}
          onChange={e => { setStatus(e.target.value); setPage(1); }}
          style={{
            border: `1.5px solid ${statusFilter !== "all" ? "#0d1b3e" : "#e2e8f0"}`,
            borderRadius: 8, padding: "6px 12px", fontSize: 13, fontWeight: 600,
            color: statusFilter !== "all" ? "#0d1b3e" : "#64748b",
            background: statusFilter !== "all" ? "#f0f4ff" : "#fff",
            cursor: "pointer", outline: "none",
          }}
        >
          <option value="all">All Status</option>
          <option value="Pending">Pending ({rows.filter(r => r.status === "Pending").length})</option>
          <option value="Hold">On Hold ({rows.filter(r => r.status === "Hold").length})</option>
          <option value="Acknowledged">Acknowledged ({rows.filter(r => r.status === "Acknowledged").length})</option>
          <option value="Completed">Completed ({rows.filter(r => r.status === "Completed").length})</option>
        </select>

        <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "6px 12px", maxWidth: 320, width: "100%" }}>
          <i className="bi bi-search" style={{ color: "#94a3b8", fontSize: 13 }} />
          <input type="text" placeholder="Search project, task, assigned by..."
            value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            style={{ border: "none", outline: "none", fontSize: 13, background: "transparent", flex: 1, color: "#0d1b3e" }}
          />
          {search && <button onClick={() => { setSearch(""); setPage(1); }}
            style={{ border: "none", background: "none", cursor: "pointer", color: "#94a3b8", fontSize: 16, lineHeight: 1 }}>×</button>}
        </div>
      </div>

      {error && <div className="alert alert-danger mb-3">{error}</div>}

      {/* ── Table ── */}
      <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#0d1b3e" }}>
                <TH>View</TH>
                <TH>Type</TH>
                <TH>Project Name</TH>
                <TH>Milestone / Task</TH>
                <TH>My Role</TH>
                <TH>Assigned By</TH>
                <TH>Due Date</TH>
                <TH>Days Left</TH>
                <TH>Status</TH>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="9" style={{ textAlign: "center", padding: 32, color: "#64748b" }}>
                  <div className="spinner-border spinner-border-sm text-primary me-2" />Loading...
                </td></tr>
              ) : paged.length === 0 ? (
                <tr><td colSpan="9" style={{ textAlign: "center", padding: 40, color: "#94a3b8" }}>No activities found</td></tr>
              ) : paged.map((row, i) => {
                const n = Number(row.daysLeft);
                const overdue = !isNaN(n) && n < 0;
                const baseBg = overdue ? "#fff5f5" : i % 2 === 0 ? "#fff" : "#fafbfc";
                return (
                  <tr key={i}
                    style={{ borderBottom: "1px solid #f1f5f9", background: baseBg, transition: "background 0.12s" }}
                    onMouseEnter={e => e.currentTarget.style.background = "#f0f4ff"}
                    onMouseLeave={e => e.currentTarget.style.background = baseBg}
                  >
                    <td style={{ padding: "10px 14px" }}>
                      <button onClick={() => handleView(row)} title="View"
                        style={{ background: "#f1f5f9", border: "1.5px solid #e2e8f0", borderRadius: 6, padding: "5px 10px", cursor: "pointer", color: "#1a56db", fontSize: 13 }}>
                        <i className="bi bi-box-arrow-up-right" />
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
                    <td style={{ padding: "10px 14px" }}>
                      <RoleBadge isPL={row.isPL} isCreator={row.isCreator} isAssigned={row.isAssigned} />
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
                .reduce((acc, p, i, arr) => { if (i > 0 && p - arr[i - 1] > 1) acc.push("..."); acc.push(p); return acc; }, [])
                .map((p, i) => p === "..." ? (
                  <span key={`e${i}`} style={{ padding: "4px 8px", color: "#94a3b8", fontSize: 13 }}>…</span>
                ) : (
                  <button key={p} onClick={() => setPage(p)} style={{
                    padding: "4px 10px", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 13,
                    cursor: "pointer", width: "auto",
                    background: page === p ? "#0d1b3e" : "#fff",
                    color: page === p ? "#fff" : "#0d1b3e",
                    fontWeight: page === p ? 700 : 400,
                  }}>{p}</button>
                ))}
              <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}
                style={{ padding: "4px 10px", border: "1px solid #e2e8f0", borderRadius: 6, background: "#fff", cursor: "pointer", fontSize: 13, width: "auto" }}>›</button>
            </div>
          </div>
        )}
      </div>

      {holdAlerts.length > 0 && (
        <div id="hold-alerts-section" style={{ marginTop: 32 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <h5 style={{ fontWeight: 700, color: "#92400e", margin: 0, fontSize: 15 }}>
              <i className="bi bi-exclamation-triangle-fill me-2" />
              Hold Alerts
            </h5>
            <span style={{
              background: "#fef3c7", color: "#92400e", fontSize: 11,
              fontWeight: 700, padding: "2px 8px", borderRadius: 20,
              border: "1px solid #fde68a"
            }}>
              {holdAlerts.length}
            </span>
            <span style={{ fontSize: 12, color: "#94a3b8" }}>
              Items placed on hold under your projects
            </span>
          </div>

          <div style={{
            background: "#fff", borderRadius: 12,
            border: "1.5px solid #fde68a", overflow: "hidden",
            boxShadow: "0 1px 4px rgba(180,83,9,0.08)"
          }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#78350f" }}>
                  {["View", "Type", "Project", "Item Name", "Assigned To", "Due Date", "Days Left"].map(h => (
                    <th key={h} style={{
                      padding: "10px 14px", fontWeight: 600, fontSize: 11,
                      textTransform: "uppercase", letterSpacing: 0.6,
                      color: "rgba(255,255,255,0.8)", whiteSpace: "nowrap",
                      border: "none"
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {holdAlerts.map((item, i) => (
                  <tr key={i}
                    style={{
                      borderBottom: "1px solid #fef3c7",
                      background: i % 2 === 0 ? "#fffbeb" : "#fff",
                      transition: "background 0.12s"
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = "#fef3c7"}
                    onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? "#fffbeb" : "#fff"}
                  >
                    <td style={{ padding: "10px 14px" }}>
                      <button
                        onClick={() => navigate(`/project-details/${item.projectId}`)}
                        style={{
                          background: "#fef3c7", border: "1.5px solid #fde68a",
                          borderRadius: 6, padding: "5px 10px",
                          cursor: "pointer", color: "#92400e", fontSize: 13
                        }}
                      >
                        <i className="bi bi-box-arrow-up-right" />
                      </button>
                    </td>
                    <td style={{ padding: "10px 14px" }}>
                      <span style={{
                        background: item.itemType === "MILESTONE" ? "#e0f2fe"
                          : item.itemType === "PROJECT" ? "#ede9fe"
                            : "#fff7ed",
                        color: item.itemType === "MILESTONE" ? "#0369a1"
                          : item.itemType === "PROJECT" ? "#5b21b6"
                            : "#c2410c",
                        fontSize: 10, fontWeight: 700,
                        padding: "2px 8px", borderRadius: 20
                      }}>
                        {item.itemType === "MILESTONE" ? "Milestone"
                          : item.itemType === "PROJECT" ? "Project"
                            : "Task"}
                      </span>
                    </td>
                    <td style={{ padding: "10px 14px", fontWeight: 600, color: "#0d1b3e", maxWidth: 180 }}>
                      <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {item.projectName}
                      </div>
                    </td>
                    <td style={{ padding: "10px 14px", color: "#475569", maxWidth: 180 }}>
                      <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {item.itemName}
                      </div>
                    </td>
                    <td style={{ padding: "10px 14px", color: "#475569", fontSize: 12.5 }}>
                      {item.assignedTo}
                    </td>
                    <td style={{ padding: "10px 14px", color: "#475569", fontSize: 12.5, whiteSpace: "nowrap" }}>
                      {item.dueDate || "—"}
                    </td>
                    <td style={{ padding: "10px 14px" }}>
                      <DaysCell days={item.daysLeft} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}