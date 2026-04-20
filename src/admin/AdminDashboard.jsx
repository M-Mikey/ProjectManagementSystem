import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import Topbar from "../components/Navbar/Topbar";
import AuthoritiesDialog from "../components/Common/AuthoritiesDialog";
import LoginHistoryDialog from "../components/Common/LoginHistoryDialog";
import {
    unlockUser,
    searchUsersAdvanced,
    changeUserRole,
    deactivateUser,
    reactivateUser,
} from "../api/userApi";

const PAGE_SIZE = 10;

const ROLE_OPTIONS = [
    { value: "",           label: "All Roles"   },
    { value: "User",       label: "User"        },
    { value: "Admin",      label: "Admin"       },
    { value: "SuperAdmin", label: "Super Admin" },
];

const TYPE_OPTIONS = [
    { value: "",         label: "All Types" },
    { value: "Internal", label: "Internal"  },
    { value: "External", label: "External"  },
];

const STATUS_OPTIONS = [
    { value: "",  label: "All"      },
    { value: "Y", label: "Active"   },
    { value: "N", label: "Inactive" },
];

const LOCKED_OPTIONS = [
    { value: "",  label: "All"        },
    { value: "Y", label: "Locked"     },
    { value: "N", label: "Not Locked" },
];

const ROLE_STYLE = {
    SuperAdmin: { bg: "#fef3c7", color: "#92400e", icon: "bi-shield-lock-fill" },
    Admin:      { bg: "#ede9fe", color: "#5b21b6", icon: "bi-shield-check"     },
    User:       { bg: "#f3f4f6", color: "#374151", icon: "bi-person"           },
};

// ── Toast ─────────────────────────────────────────────────────────────────
function Toast({ toast, onDismiss }) {
    useEffect(() => {
        if (!toast) return;
        const t = setTimeout(onDismiss, 4000);
        return () => clearTimeout(t);
    }, [toast, onDismiss]);

    if (!toast) return null;
    const isSuccess = toast.type === "success";
    return (
        <div style={{
            position: "fixed", bottom: "24px", right: "24px", zIndex: 9999,
            background: isSuccess ? "#d1fae5" : "#fee2e2",
            color: isSuccess ? "#065f46" : "#991b1b",
            border: `1px solid ${isSuccess ? "#6ee7b7" : "#fca5a5"}`,
            borderRadius: "10px", padding: "12px 18px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
            display: "flex", alignItems: "center", gap: "10px",
            fontSize: "13px", fontWeight: 600, minWidth: "280px",
            animation: "slideIn 0.25s ease",
        }}>
            <i className={`bi ${isSuccess ? "bi-check-circle-fill" : "bi-exclamation-circle-fill"}`}
                style={{ fontSize: "16px" }} />
            {toast.message}
            <button onClick={onDismiss} style={{
                marginLeft: "auto", background: "none", border: "none",
                cursor: "pointer", color: "inherit", fontSize: "16px",
            }}>×</button>
        </div>
    );
}

// ── Confirm Dialog ────────────────────────────────────────────────────────
function ConfirmDialog({ open, title, message, onConfirm, onCancel }) {
    if (!open) return null;
    return (
        <div style={{
            position: "fixed", inset: 0, zIndex: 9000,
            background: "rgba(0,0,0,0.45)",
            display: "flex", alignItems: "center", justifyContent: "center",
        }}>
            <div style={{
                background: "white", borderRadius: "12px",
                padding: "28px 32px", maxWidth: "420px", width: "90%",
                boxShadow: "0 8px 40px rgba(0,0,0,0.18)",
            }}>
                <h6 style={{ color: "#0b2a5b", fontWeight: 700, marginBottom: "10px" }}>
                    <i className="bi bi-exclamation-triangle-fill me-2" style={{ color: "#f59e0b" }} />
                    {title}
                </h6>
                <p style={{ color: "#6b7280", fontSize: "13px", marginBottom: "20px" }}>
                    {message}
                </p>
                <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                    <button onClick={onCancel} style={{
                        background: "white", border: "1.5px solid #d1d5db",
                        borderRadius: "7px", padding: "7px 18px",
                        color: "#374151", fontWeight: 600, fontSize: "13px", cursor: "pointer",
                    }}>Cancel</button>
                    <button onClick={onConfirm} style={{
                        background: "#dc2626", border: "none",
                        borderRadius: "7px", padding: "7px 18px",
                        color: "white", fontWeight: 600, fontSize: "13px", cursor: "pointer",
                    }}>Confirm</button>
                </div>
            </div>
        </div>
    );
}

// ═════════════════════════════════════════════════════════════════════════
//  AdminDashboard
// ═════════════════════════════════════════════════════════════════════════
export default function AdminDashboard() {
    const navigate     = useNavigate();
    const userId       = sessionStorage.getItem("userId");
    const userRole     = sessionStorage.getItem("userRole");
    const isSuperAdmin = userRole === "SuperAdmin";

    // ── Nav toggle (Topbar requires these) ───────────────────────────────
    const [isNavOpen, setIsNavOpen] = useState(false);

    // ── Dialog state ─────────────────────────────────────────────────────
    const [selectedUser,      setSelectedUser]      = useState(null);
    const [showAuthDialog,    setShowAuthDialog]    = useState(false);
    const [showHistoryDialog, setShowHistoryDialog] = useState(false);
    const [historyUser,       setHistoryUser]       = useState(null);

    // ── Toast & confirm ───────────────────────────────────────────────────
    const [toast,   setToast]   = useState(null);
    const [confirm, setConfirm] = useState(null);

    const showToast     = (message, type = "success") => setToast({ message, type });
    const confirmAction = (title, message, onConfirm) => setConfirm({ title, message, onConfirm });

    // ── Busy key for per-row action spinners ─────────────────────────────
    const [busyKey, setBusyKey] = useState(null);

    // ── Filters ───────────────────────────────────────────────────────────
    const EMPTY_FILTERS = {
        userName: "", name: "", email: "", mobile: "",
        userType: "", role: "", status: "", userLocked: "",
        companyDetails: "",
    };
    const [filters,     setFilters]     = useState(EMPTY_FILTERS);
    const [submitted,   setSubmitted]   = useState(EMPTY_FILTERS);
    const [hasSearched, setHasSearched] = useState(false);

    // ── Table data ────────────────────────────────────────────────────────
    const [users,   setUsers]   = useState([]);
    const [loading, setLoading] = useState(false);
    const [page,    setPage]    = useState(1);

    // ── Auth guard ────────────────────────────────────────────────────────
    useEffect(() => {
        if (!userId) navigate("/", { replace: true });
    }, [userId, navigate]);

    // ── Load ──────────────────────────────────────────────────────────────
    const loadUsers = useCallback(async (f) => {
        setLoading(true);
        try {
            const data = await searchUsersAdvanced({
                userName:       f.userName       || null,
                name:           f.name           || null,
                email:          f.email          || null,
                mobile:         f.mobile         || null,
                userType:       f.userType       || null,
                role:           f.role           || null,
                status:         f.status         || null,
                userLocked:     f.userLocked     || null,
                companyDetails: f.companyDetails || null,
            });
            setUsers(data);
            setPage(1);
        } catch (err) {
            showToast(err.message || "Failed to load users", "error");
        } finally {
            setLoading(false);
        }
    }, []);

    const handleSearch = () => {
        setSubmitted({ ...filters });
        setHasSearched(true);
        loadUsers(filters);
    };

    const handleClear = () => {
        setFilters(EMPTY_FILTERS);
        setSubmitted(EMPTY_FILTERS);
        setHasSearched(false);
        setUsers([]);
    };

    const setField = (key) => (e) =>
        setFilters(prev => ({ ...prev, [key]: e.target.value }));

    // ── Unlock — SuperAdmin only ──────────────────────────────────────────
    const handleUnlock = (u) => {
        if (!isSuperAdmin) return;
        confirmAction(
            "Unlock Account",
            `Unlock account for "${u.userName}"? The user will be able to log in immediately.`,
            async () => {
                setConfirm(null);
                const key = `${u.userName}::unlock`;
                setBusyKey(key);
                try {
                    await unlockUser({ userName: u.userName, modifiedBy: userId });
                    showToast(`${u.userName} unlocked successfully.`);
                    loadUsers(submitted);
                } catch (err) {
                    showToast(err.message || "Unlock failed", "error");
                } finally {
                    setBusyKey(null);
                }
            }
        );
    };

    // ── Deactivate / Reactivate ───────────────────────────────────────────
    const handleToggleActive = (u) => {
        const isActive = u.isActive === "Y";
        const verb     = isActive ? "Deactivate" : "Reactivate";
        confirmAction(
            `${verb} User`,
            `Are you sure you want to ${verb.toLowerCase()} "${u.userName}"?${
                isActive ? " The user will lose all access immediately." : ""}`,
            async () => {
                setConfirm(null);
                const key = `${u.userName}::toggle`;
                setBusyKey(key);
                try {
                    if (isActive) {
                        await deactivateUser(u.userName);
                    } else {
                        await reactivateUser(u.userName);
                    }
                    showToast(`${u.userName} ${verb.toLowerCase()}d successfully.`);
                    loadUsers(submitted);
                } catch (err) {
                    showToast(err.message || `${verb} failed`, "error");
                } finally {
                    setBusyKey(null);
                }
            }
        );
    };

    // ── Change Role — SuperAdmin only ─────────────────────────────────────
    const handleChangeRole = (u, newRole) => {
        if (!isSuperAdmin) return;
        if (newRole === u.role) return; // no-op if same role selected
        const label = newRole === "SuperAdmin" ? "Super Admin" : newRole;
        confirmAction(
            "Change Role",
            `Change "${u.userName}"'s role to "${label}"? This will immediately affect their permissions.`,
            async () => {
                setConfirm(null);
                const key = `${u.userName}::role`;
                setBusyKey(key);
                try {
                    await changeUserRole(u.userName, newRole);
                    showToast(`${u.userName} is now "${label}".`);
                    loadUsers(submitted);
                } catch (err) {
                    showToast(err.message || "Role change failed", "error");
                } finally {
                    setBusyKey(null);
                }
            }
        );
    };

    // ── Export CSV ────────────────────────────────────────────────────────
    const handleExport = () => {
        if (users.length === 0) {
            showToast("No data to export. Run a search first.", "error");
            return;
        }
        const headers = ["User ID", "Name", "Email", "Mobile", "Company", "User Type", "Role", "Status", "Locked"];
        const rows = users.map(u => [
            u.userName, u.name, u.emailId, u.mobileNo,
            u.companyDetails, u.userType, u.role, u.status,
            u.userLocked === "Y" ? "Locked" : "—",
        ]);
        const csv = [
            headers.join(","),
            ...rows.map(r =>
                r.map(v => `"${(v || "").toString().replace(/"/g, '""')}"`).join(",")
            ),
        ].join("\n");

        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement("a");
        a.href     = url;
        a.download = `users_${new Date().toISOString().split("T")[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    // ── Pagination ────────────────────────────────────────────────────────
    const totalPages = Math.ceil(users.length / PAGE_SIZE);
    const paginated  = users.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    const getPaginationPages = () =>
        Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
            .reduce((acc, p, idx, arr) => {
                if (idx > 0 && p - arr[idx - 1] > 1) acc.push("...");
                acc.push(p);
                return acc;
            }, []);

    // ── Styles ────────────────────────────────────────────────────────────
    const cell = {
        padding: "10px 14px", border: "none",
        borderBottom: "1px solid #f3f4f6", fontSize: "13px",
        verticalAlign: "middle",
    };

    const labelStyle = {
        fontSize: "11px", fontWeight: 600, color: "#374151",
        marginBottom: "4px", display: "block",
    };

    const inputStyle = {
        borderRadius: "6px", border: "1.5px solid #e5e7eb",
        fontSize: "12px", padding: "6px 10px", width: "100%",
        outline: "none", background: "white", boxSizing: "border-box",
    };

    const selectStyle = { ...inputStyle };

    const thStyle = {
        color: "white", fontWeight: 600, fontSize: "11px",
        padding: "10px 14px", border: "none", whiteSpace: "nowrap",
        textTransform: "uppercase", letterSpacing: "0.5px",
    };

    // ── Column count for empty state colspan ─────────────────────────────
    // Edit + UserID + Name + Email + Mobile + Company + Type + Role + (ManageRole?) + Authorities + LoginHistory + Status
    const colCount = isSuperAdmin ? 12 : 11;

    return (
        <div className="app-container">
            <Topbar isNavOpen={isNavOpen} onToggleNav={() => setIsNavOpen(p => !p)} />

            <style>{`
                @keyframes slideIn {
                    from { opacity: 0; transform: translateY(12px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                .sa-row:hover td { background: #eff6ff !important; }
                .sa-btn { transition: opacity 0.15s; border: none; }
                .sa-btn:hover { opacity: 0.82; }
                .sa-btn:disabled { opacity: 0.55; cursor: not-allowed !important; }
                .ad-input:focus { border-color: #0b2a5b !important; box-shadow: 0 0 0 2px rgba(11,42,91,0.1); }
            `}</style>

            <div className="main-layout d-flex">
                <main className="flex-grow-1" style={{ background: "#f0f2f5", minHeight: "100vh" }}>
                    <div className="container-fluid p-3">

                        {/* ── Page header ── */}
                        <div style={{
                            display: "flex", alignItems: "center",
                            justifyContent: "space-between", marginBottom: "12px",
                        }}>
                            <div>
                                <h5 style={{ color: "#0b2a5b", fontWeight: 700, margin: 0 }}>
                                    User Management
                                </h5>
                                <small style={{ color: "#6c757d" }}>
                                    Manage all internal and external users
                                    {isSuperAdmin && (
                                        <span style={{
                                            marginLeft: "8px", background: "#fef3c7",
                                            color: "#92400e", padding: "1px 8px",
                                            borderRadius: "20px", fontSize: "10px", fontWeight: 700,
                                        }}>
                                            <i className="bi bi-shield-lock-fill me-1" />
                                            SUPER ADMIN
                                        </span>
                                    )}
                                </small>
                            </div>
                            <div style={{ display: "flex", gap: "8px" }}>
                                <button onClick={handleExport} className="sa-btn" style={{
                                    background: "white", color: "#0b2a5b",
                                    border: "1.5px solid #0b2a5b", borderRadius: "8px",
                                    padding: "8px 16px", fontWeight: 600, fontSize: "13px",
                                    cursor: "pointer", display: "flex", alignItems: "center", gap: "6px",
                                }}>
                                    <i className="bi bi-download" /> Export CSV
                                </button>
                                <Link to="/adduser" style={{
                                    background: "#0b2a5b", color: "white",
                                    borderRadius: "8px", padding: "8px 16px",
                                    textDecoration: "none", fontWeight: 600, fontSize: "13px",
                                    display: "flex", alignItems: "center", gap: "6px",
                                }}>
                                    <i className="bi bi-person-plus" /> Create User
                                </Link>
                            </div>
                        </div>

                        {/* ── Search Panel ── */}
                        <div style={{
                            background: "white", borderRadius: "10px",
                            boxShadow: "0 1px 6px rgba(0,0,0,0.06)",
                            marginBottom: "12px", overflow: "hidden",
                        }}>
                            <div style={{
                                padding: "9px 16px", background: "#0b2a5b",
                                display: "flex", alignItems: "center", gap: "8px",
                            }}>
                                <i className="bi bi-search" style={{ color: "white", fontSize: "13px" }} />
                                <span style={{ fontWeight: 600, color: "white", fontSize: "13px" }}>
                                    Search Criteria
                                </span>
                            </div>

                            <div style={{
                                padding: "7px 16px", background: "#f8fafc",
                                borderBottom: "1px solid #e5e7eb", fontSize: "12px", color: "#6b7280",
                            }}>
                                <i className="bi bi-info-circle me-1" style={{ color: "#0b2a5b" }} />
                                Enter any combination of criteria below and click <strong>Search</strong>.
                            </div>

                            <div style={{ padding: "14px 16px" }}>
                                {/* Row 1 — text inputs */}
                                <div style={{
                                    display: "grid",
                                    gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                                    gap: "10px", marginBottom: "10px",
                                }}>
                                    {[
                                        { key: "userName",  label: "User ID",    placeholder: "Enter User ID"      },
                                        { key: "name",      label: "Full Name",  placeholder: "Enter name"         },
                                        { key: "email",     label: "Email ID",   placeholder: "Enter email"        },
                                    ].map(({ key, label, placeholder }) => (
                                        <div key={key}>
                                            <label style={labelStyle}>{label}</label>
                                            <input
                                                className="ad-input"
                                                style={inputStyle}
                                                placeholder={placeholder}
                                                value={filters[key]}
                                                onChange={setField(key)}
                                                onKeyDown={e => e.key === "Enter" && handleSearch()}
                                            />
                                        </div>
                                    ))}
                                    <div>
                                        <label style={labelStyle}>Mobile No.</label>
                                        <input
                                            className="ad-input"
                                            style={inputStyle}
                                            placeholder="10-digit mobile"
                                            maxLength={10}
                                            value={filters.mobile}
                                            onChange={e => {
                                                const v = e.target.value.replace(/\D/g, "");
                                                setFilters(p => ({ ...p, mobile: v }));
                                            }}
                                            onKeyDown={e => e.key === "Enter" && handleSearch()}
                                        />
                                    </div>
                                </div>

                                {/* Row 2 — dropdowns */}
                                <div style={{
                                    display: "grid",
                                    gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
                                    gap: "10px", marginBottom: "10px",
                                }}>
                                    {[
                                        { key: "userType",   label: "User Type",     options: TYPE_OPTIONS   },
                                        { key: "role",       label: "Role",          options: ROLE_OPTIONS   },
                                        { key: "status",     label: "Status",        options: STATUS_OPTIONS },
                                        { key: "userLocked", label: "Account Lock",  options: LOCKED_OPTIONS },
                                    ].map(({ key, label, options }) => (
                                        <div key={key}>
                                            <label style={labelStyle}>{label}</label>
                                            <select
                                                className="ad-input"
                                                style={selectStyle}
                                                value={filters[key]}
                                                onChange={setField(key)}
                                            >
                                                {options.map(o => (
                                                    <option key={o.value} value={o.value}>{o.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                    ))}
                                </div>

                                {/* Row 3 — company + buttons */}
                                <div style={{
                                    display: "flex", gap: "10px",
                                    alignItems: "flex-end", flexWrap: "wrap",
                                }}>
                                    <div style={{ flex: "1 1 260px" }}>
                                        <label style={labelStyle}>Company / Organisation</label>
                                        <input
                                            className="ad-input"
                                            style={inputStyle}
                                            placeholder="Enter company name (external users)"
                                            value={filters.companyDetails}
                                            onChange={setField("companyDetails")}
                                            onKeyDown={e => e.key === "Enter" && handleSearch()}
                                        />
                                    </div>
                                    <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
                                        <button
                                            onClick={handleSearch}
                                            disabled={loading}
                                            className="sa-btn"
                                            style={{
                                                background: loading ? "#94a3b8" : "#0b2a5b",
                                                color: "white", border: "none",
                                                borderRadius: "7px", padding: "7px 22px",
                                                fontWeight: 600, fontSize: "13px",
                                                cursor: loading ? "not-allowed" : "pointer",
                                                display: "flex", alignItems: "center", gap: "6px",
                                            }}
                                        >
                                            {loading
                                                ? <><span className="spinner-border spinner-border-sm" /> Searching…</>
                                                : <><i className="bi bi-search" /> Search</>
                                            }
                                        </button>
                                        <button onClick={handleClear} className="sa-btn" style={{
                                            background: "white", color: "#374151",
                                            border: "1.5px solid #d1d5db", borderRadius: "7px",
                                            padding: "7px 18px", fontWeight: 600,
                                            fontSize: "13px", cursor: "pointer",
                                            display: "flex", alignItems: "center", gap: "6px",
                                        }}>
                                            <i className="bi bi-x-circle" /> Clear
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ── Table Card ── */}
                        <div style={{
                            background: "white", borderRadius: "10px",
                            boxShadow: "0 1px 6px rgba(0,0,0,0.06)", overflow: "hidden",
                        }}>
                            {/* Card header */}
                            <div style={{
                                padding: "10px 16px", borderBottom: "1px solid #e5e7eb",
                                display: "flex", alignItems: "center", gap: "8px",
                            }}>
                                <i className="bi bi-table" style={{ color: "#0b2a5b", fontSize: "13px" }} />
                                <span style={{ fontWeight: 600, color: "#0b2a5b", fontSize: "13px" }}>
                                    Users List
                                </span>
                                <span style={{
                                    background: "#0b2a5b", color: "white",
                                    borderRadius: "20px", padding: "1px 8px",
                                    fontSize: "11px", fontWeight: 600,
                                }}>
                                    {users.length}
                                </span>
                                {totalPages > 1 && (
                                    <span style={{ marginLeft: "auto", fontSize: "12px", color: "#6b7280" }}>
                                        Page {page} of {totalPages}
                                    </span>
                                )}
                            </div>

                            {loading ? (
                                <div style={{ padding: "48px", textAlign: "center", color: "#6b7280" }}>
                                    <div className="spinner-border spinner-border-sm text-primary mb-2" />
                                    <div style={{ fontSize: "13px" }}>Searching users…</div>
                                </div>
                            ) : (
                                <>
                                    <div style={{ overflowX: "auto" }}>
                                        <table style={{
                                            width: "100%", borderCollapse: "collapse",
                                            fontSize: "13px", minWidth: "900px",
                                        }}>
                                            <thead>
                                                <tr style={{ background: "#0b2a5b" }}>
                                                    {[
                                                        "Edit", "User ID", "Name", "Email",
                                                        "Mobile", "Company", "Type", "Role",
                                                        ...(isSuperAdmin ? ["Manage Role"] : []),
                                                        "Authorities", "Login History", "Status",
                                                    ].map(h => (
                                                        <th key={h} style={thStyle}>{h}</th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {paginated.length > 0 ? paginated.map((u, i) => {
                                                    const rs    = ROLE_STYLE[u.role] || ROLE_STYLE.User;
                                                    const isMe  = u.userName === userId;
                                                    const rowBg = i % 2 === 0 ? "white" : "#f9fafb";

                                                    return (
                                                        <tr key={u.userName} className="sa-row"
                                                            style={{ background: rowBg }}>

                                                            {/* Edit */}
                                                            <td style={cell}>
                                                                <Link to="/editUser" state={u} style={{
                                                                    background: "#eff6ff", color: "#0b2a5b",
                                                                    border: "1px solid #bfdbfe",
                                                                    borderRadius: "5px", padding: "3px 8px",
                                                                    textDecoration: "none", fontSize: "12px",
                                                                }}>
                                                                    <i className="bi bi-pencil-square" />
                                                                </Link>
                                                            </td>

                                                            {/* User ID */}
                                                            <td style={{ ...cell, fontWeight: 600, color: "#0b2a5b" }}>
                                                                {u.userName}
                                                            </td>

                                                            {/* Name */}
                                                            <td style={cell}>{u.name}</td>

                                                            {/* Email */}
                                                            <td style={{ ...cell, color: "#6b7280", maxWidth: "180px", wordBreak: "break-all" }}>
                                                                {u.emailId}
                                                            </td>

                                                            {/* Mobile */}
                                                            <td style={{ ...cell, color: "#6b7280" }}>{u.mobileNo}</td>

                                                            {/* Company */}
                                                            <td style={{ ...cell, color: "#6b7280", maxWidth: "160px" }}>
                                                                {u.companyDetails || "—"}
                                                            </td>

                                                            {/* Type */}
                                                            <td style={cell}>
                                                                <span style={{
                                                                    background: u.userType === "Internal" ? "#dbeafe" : "#fef3c7",
                                                                    color:      u.userType === "Internal" ? "#1e40af" : "#92400e",
                                                                    padding: "2px 8px", borderRadius: "20px",
                                                                    fontSize: "11px", fontWeight: 600, whiteSpace: "nowrap",
                                                                }}>
                                                                    {u.userType}
                                                                </span>
                                                            </td>

                                                            {/* Role */}
                                                            <td style={cell}>
                                                                <span style={{
                                                                    background: rs.bg, color: rs.color,
                                                                    padding: "2px 8px", borderRadius: "20px",
                                                                    fontSize: "11px", fontWeight: 600, whiteSpace: "nowrap",
                                                                }}>
                                                                    <i className={`bi ${rs.icon} me-1`} />
                                                                    {u.role}
                                                                </span>
                                                            </td>

                                                            {/* Manage Role — SuperAdmin only */}
                                                            {isSuperAdmin && (
                                                                <td style={{ ...cell, minWidth: "130px" }}>
                                                                    {isMe ? (
                                                                        <span style={{ fontSize: "11px", color: "#9ca3af" }}>
                                                                            — (you)
                                                                        </span>
                                                                    ) : busyKey === `${u.userName}::role` ? (
                                                                        <span className="spinner-border spinner-border-sm text-primary" />
                                                                    ) : (
                                                                        <select
                                                                            value={u.role}
                                                                            onChange={e => handleChangeRole(u, e.target.value)}
                                                                            title="Change role"
                                                                            style={{
                                                                                borderRadius: "6px",
                                                                                border: "1.5px solid #e5e7eb",
                                                                                fontSize: "11px", padding: "3px 6px",
                                                                                cursor: "pointer", background: "white",
                                                                                color: "#374151",
                                                                            }}
                                                                        >
                                                                            <option value="User">User</option>
                                                                            <option value="Admin">Admin</option>
                                                                            <option value="SuperAdmin">Super Admin</option>
                                                                        </select>
                                                                    )}
                                                                </td>
                                                            )}

                                                            {/* Authorities */}
                                                            <td style={{ ...cell, textAlign: "center" }}>
                                                                <button className="sa-btn"
                                                                    onClick={() => { setSelectedUser(u); setShowAuthDialog(true); }}
                                                                    title="View Reporting Authorities"
                                                                    style={{
                                                                        background: "#f0fdf4", color: "#065f46",
                                                                        border: "1px solid #6ee7b7",
                                                                        borderRadius: "5px", padding: "3px 8px",
                                                                        fontSize: "12px", cursor: "pointer",
                                                                    }}>
                                                                    <i className="bi bi-diagram-3" />
                                                                </button>
                                                            </td>

                                                            {/* Login History */}
                                                            <td style={{ ...cell, textAlign: "center" }}>
                                                                <button className="sa-btn"
                                                                    onClick={() => { setHistoryUser(u); setShowHistoryDialog(true); }}
                                                                    title="View Login History"
                                                                    style={{
                                                                        background: "#eff6ff", color: "#1e40af",
                                                                        border: "1px solid #bfdbfe",
                                                                        borderRadius: "5px", padding: "3px 8px",
                                                                        fontSize: "12px", cursor: "pointer",
                                                                    }}>
                                                                    <i className="bi bi-clock-history" />
                                                                </button>
                                                            </td>

                                                            {/* Status column */}
                                                            <td style={{ ...cell, minWidth: "180px" }}>
                                                                <div style={{
                                                                    display: "flex", flexDirection: "column",
                                                                    gap: "4px", alignItems: "flex-start",
                                                                }}>
                                                                    {/* Active/Inactive pill — read only */}
                                                                    <span style={{
                                                                        background: u.isActive === "Y" ? "#d1fae5" : "#fee2e2",
                                                                        color:      u.isActive === "Y" ? "#065f46" : "#991b1b",
                                                                        padding: "2px 8px", borderRadius: "20px",
                                                                        fontSize: "11px", fontWeight: 600, whiteSpace: "nowrap",
                                                                    }}>
                                                                        <i className={`bi ${u.isActive === "Y" ? "bi-check-circle" : "bi-x-circle"} me-1`} />
                                                                        {u.isActive === "Y" ? "Active" : "Inactive"}
                                                                    </span>

                                                                    {/* Lock status */}
                                                                    {u.userLocked === "Y" && (
                                                                        isSuperAdmin ? (
                                                                            // SuperAdmin — clickable unlock button
                                                                            <button className="sa-btn"
                                                                                onClick={() => handleUnlock(u)}
                                                                                disabled={busyKey === `${u.userName}::unlock`}
                                                                                title="Click to Unlock"
                                                                                style={{
                                                                                    background: "#fee2e2", color: "#991b1b",
                                                                                    border: "1px solid #fca5a5",
                                                                                    borderRadius: "5px", padding: "2px 7px",
                                                                                    fontSize: "11px", cursor: "pointer",
                                                                                    display: "inline-flex", alignItems: "center", gap: "3px",
                                                                                }}>
                                                                                {busyKey === `${u.userName}::unlock`
                                                                                    ? <span className="spinner-border spinner-border-sm" />
                                                                                    : <><i className="bi bi-lock-fill" /> Locked</>
                                                                                }
                                                                            </button>
                                                                        ) : (
                                                                            // Admin — read-only locked badge
                                                                            <span style={{
                                                                                background: "#fee2e2", color: "#991b1b",
                                                                                border: "1px solid #fca5a5",
                                                                                borderRadius: "5px", padding: "2px 7px",
                                                                                fontSize: "11px", whiteSpace: "nowrap",
                                                                                display: "inline-flex", alignItems: "center", gap: "3px",
                                                                            }}>
                                                                                <i className="bi bi-lock-fill" /> Locked
                                                                            </span>
                                                                        )
                                                                    )}

                                                                    {/* Deactivate/Reactivate — hidden on self */}
                                                                    {!isMe && (
                                                                        <button className="sa-btn"
                                                                            onClick={() => handleToggleActive(u)}
                                                                            disabled={busyKey === `${u.userName}::toggle`}
                                                                            title={u.isActive === "Y" ? "Deactivate user" : "Reactivate user"}
                                                                            style={{
                                                                                background: u.isActive === "Y" ? "#fef3c7" : "#d1fae5",
                                                                                color:      u.isActive === "Y" ? "#92400e" : "#065f46",
                                                                                border: `1px solid ${u.isActive === "Y" ? "#fcd34d" : "#6ee7b7"}`,
                                                                                borderRadius: "5px", padding: "2px 7px",
                                                                                fontSize: "11px", cursor: "pointer",
                                                                                display: "inline-flex", alignItems: "center", gap: "3px",
                                                                            }}>
                                                                            {busyKey === `${u.userName}::toggle`
                                                                                ? <span className="spinner-border spinner-border-sm" />
                                                                                : u.isActive === "Y"
                                                                                    ? <><i className="bi bi-person-dash" /> Deactivate</>
                                                                                    : <><i className="bi bi-person-check" /> Reactivate</>
                                                                            }
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                }) : (
                                                    <tr>
                                                        <td colSpan={colCount} style={{
                                                            padding: "48px", textAlign: "center", color: "#9ca3af",
                                                        }}>
                                                            <i className={`bi ${hasSearched ? "bi-people" : "bi-search"}`}
                                                                style={{ fontSize: "28px", display: "block", marginBottom: "8px" }} />
                                                            {hasSearched
                                                                ? "No users found matching the search criteria"
                                                                : "Enter search criteria above and click Search to find users"
                                                            }
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Pagination */}
                                    {totalPages > 1 && (
                                        <div style={{
                                            padding: "10px 16px", borderTop: "1px solid #f3f4f6",
                                            display: "flex", alignItems: "center", justifyContent: "space-between",
                                            flexWrap: "wrap", gap: "8px",
                                        }}>
                                            <small style={{ color: "#6b7280" }}>
                                                Showing {(page - 1) * PAGE_SIZE + 1}–
                                                {Math.min(page * PAGE_SIZE, users.length)} of {users.length} users
                                            </small>
                                            <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
                                                <button onClick={() => setPage(p => p - 1)} disabled={page === 1}
                                                    style={{
                                                        background: page === 1 ? "#f3f4f6" : "#0b2a5b",
                                                        color: page === 1 ? "#9ca3af" : "white",
                                                        border: "none", borderRadius: "6px",
                                                        padding: "4px 10px", fontSize: "12px",
                                                        cursor: page === 1 ? "not-allowed" : "pointer",
                                                    }}>
                                                    <i className="bi bi-chevron-left" />
                                                </button>
                                                {getPaginationPages().map((p, i) =>
                                                    p === "..." ? (
                                                        <span key={`dot-${i}`} style={{
                                                            padding: "4px 6px", fontSize: "12px", color: "#6b7280",
                                                        }}>…</span>
                                                    ) : (
                                                        <button key={p} onClick={() => setPage(p)} style={{
                                                            background: page === p ? "#0b2a5b" : "white",
                                                            color: page === p ? "white" : "#374151",
                                                            border: "1px solid",
                                                            borderColor: page === p ? "#0b2a5b" : "#d1d5db",
                                                            borderRadius: "6px", padding: "4px 9px",
                                                            fontSize: "12px", fontWeight: page === p ? 700 : 400,
                                                            cursor: "pointer", minWidth: "30px",
                                                        }}>
                                                            {p}
                                                        </button>
                                                    )
                                                )}
                                                <button onClick={() => setPage(p => p + 1)} disabled={page === totalPages}
                                                    style={{
                                                        background: page === totalPages ? "#f3f4f6" : "#0b2a5b",
                                                        color: page === totalPages ? "#9ca3af" : "white",
                                                        border: "none", borderRadius: "6px",
                                                        padding: "4px 10px", fontSize: "12px",
                                                        cursor: page === totalPages ? "not-allowed" : "pointer",
                                                    }}>
                                                    <i className="bi bi-chevron-right" />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                    </div>
                </main>
            </div>

            {/* Dialogs */}
            {showAuthDialog && selectedUser && (
                <AuthoritiesDialog
                    user={selectedUser}
                    onClose={() => { setShowAuthDialog(false); setSelectedUser(null); }}
                />
            )}
            {showHistoryDialog && historyUser && (
                <LoginHistoryDialog
                    user={historyUser}
                    onClose={() => { setShowHistoryDialog(false); setHistoryUser(null); }}
                />
            )}

            <ConfirmDialog
                open={!!confirm}
                title={confirm?.title}
                message={confirm?.message}
                onConfirm={confirm?.onConfirm}
                onCancel={() => setConfirm(null)}
            />

            <Toast toast={toast} onDismiss={() => setToast(null)} />
        </div>
    );
}