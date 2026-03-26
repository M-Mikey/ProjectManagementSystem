import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Topbar from "../components/Navbar/Topbar";
import { getUsers } from "../api/userApi";
import UserSearch from "../components/Common/UserSearch";
import AuthoritiesDialog from "../components/Common/AuthoritiesDialog";
import { unlockUser } from "../api/userApi";
import LoginHistoryDialog from "../components/Common/LoginHistoryDialog";

const PAGE_SIZE = 10;

export default function UserList() {
    const navigate = useNavigate();
    const userId   = sessionStorage.getItem("userId");

    const [selectedUser, setSelectedUser]     = useState(null);
    const [showAuthDialog, setShowAuthDialog] = useState(false);
    const [showHistoryDialog, setShowHistoryDialog] = useState(false);
const [historyUser,       setHistoryUser]       = useState(null);
const [unlockLoading,     setUnlockLoading]     = useState(null);

    const [filters, setFilters] = useState({
        userName: "", userType: "", status: ""
    });
    const [users, setUsers]     = useState([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage]       = useState(1);

    const load = async (f) => {
        setLoading(true);
        try {
            const data = await getUsers(f || filters);
            setUsers(data);
            setPage(1);
        } catch (err) {
            console.error("Load error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!userId) { navigate("/", { replace: true }); return; }
        load();
    }, []);

    const handleSearch = () => load(filters);
    const handleClear  = () => {
        const cleared = { userName: "", userType: "", status: "" };
        setFilters(cleared);
        load(cleared);
    };

    const handleUnlock = async (u) => {
    if (!window.confirm(
        `Unlock user ${u.userName}?`)) return;
    setUnlockLoading(u.userName);
    try {
        await unlockUser({
            userName:   u.userName,
            modifiedBy: userId
        });
        load(); // reload list
    } catch (err) {
        alert(err.message);
    } finally {
        setUnlockLoading(null);
    }
};
    // ── CSV Export ──
    const handleExport = () => {
        const headers = [
            "User ID", "Name", "Email", "Mobile",
            "User Type", "Role", "Status"
        ];
        const rows = users.map(u => [
            u.userName, u.name, u.emailId,
            u.mobileNo, u.userType, u.role, u.status
        ]);
        const csv = [
            headers.join(","),
            ...rows.map(r => r.map(v =>
                `"${(v || "").toString().replace(/"/g, '""')}"`
            ).join(","))
        ].join("\n");

        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement("a");
        a.href     = url;
        a.download = `users_${new Date().toISOString().split("T")[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const totalPages = Math.ceil(users.length / PAGE_SIZE);
    const paginated  = users.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    const cell = {
        padding: "10px 14px",
        border: "none",
        borderBottom: "1px solid #f3f4f6",
        fontSize: "13px"
    };

    const getPaginationPages = () => {
        return Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
            .reduce((acc, p, idx, arr) => {
                if (idx > 0 && p - arr[idx - 1] > 1) acc.push("...");
                acc.push(p);
                return acc;
            }, []);
    };

    return (
        <div className="app-container">
            <Topbar />
            <div className="main-layout d-flex">
                <main className="content" style={{ background: "#f0f2f5" }}>
                    <div className="container-fluid p-3">

                        {/* ── Page Header ── */}
                        <div className="d-flex align-items-center
                            justify-content-between mb-2">
                            <div>
                                <h5 className="mb-0" style={{
                                    color: "#0b2a5b", fontWeight: 700
                                }}>
                                    User Management
                                </h5>
                                <small style={{ color: "#6c757d" }}>
                                    Manage all internal and external users
                                </small>
                            </div>
                            <div className="d-flex gap-2">
                                {/* ── Export Button ── */}
                                <button onClick={handleExport} style={{
                                    background: "white",
                                    color: "#0b2a5b",
                                    border: "1.5px solid #0b2a5b",
                                    borderRadius: "8px",
                                    padding: "8px 16px",
                                    fontWeight: 600,
                                    fontSize: "13px",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center", gap: "6px"
                                }}>
                                    <i className="bi bi-download" /> Export
                                </button>

                                {/* ── Create User Button ── */}
                                <Link to="/adduser" style={{
                                    background: "#0b2a5b", color: "white",
                                    border: "none", borderRadius: "8px",
                                    padding: "8px 16px", textDecoration: "none",
                                    fontWeight: 600, fontSize: "13px",
                                    display: "flex", alignItems: "center", gap: "6px"
                                }}>
                                    <i className="bi bi-person-plus" /> Create User
                                </Link>
                            </div>
                        </div>

                        {/* ── Filters ── */}
                        <div style={{
                            background: "white", borderRadius: "10px",
                            boxShadow: "0 1px 6px rgba(0,0,0,0.06)",
                            marginBottom: "12px", overflow: "hidden"
                        }}>
                            <div style={{
                                padding: "10px 16px", background: "#f8fafc",
                                borderBottom: "1px solid #e5e7eb",
                                display: "flex", alignItems: "center", gap: "6px"
                            }}>
                                <i className="bi bi-funnel"
                                    style={{ color: "#0b2a5b", fontSize: "13px" }} />
                                <span style={{
                                    fontWeight: 600, color: "#0b2a5b", fontSize: "13px"
                                }}>
                                    Filters
                                </span>
                            </div>
                            <div style={{ padding: "12px 16px" }}>
                                <div className="row g-2 align-items-end">
                                    <div className="col-12 col-md-4">
                                        <label style={{
                                            fontSize: "11px", fontWeight: 600,
                                            color: "#374151", marginBottom: "4px",
                                            display: "block"
                                        }}>
                                            USERNAME
                                        </label>
                                        <UserSearch
                                            onUserSelect={(u) =>
                                                setFilters(p => ({
                                                    ...p, userName: u.userName
                                                }))
                                            }
                                        />
                                    </div>
                                    <div className="col-12 col-md-3">
                                        <label style={{
                                            fontSize: "11px", fontWeight: 600,
                                            color: "#374151", marginBottom: "4px",
                                            display: "block"
                                        }}>
                                            USER TYPE
                                        </label>
                                        <select
                                            className="form-select form-select-sm"
                                            style={{ borderRadius: "6px" }}
                                            value={filters.userType}
                                            onChange={e => setFilters(p => ({
                                                ...p, userType: e.target.value
                                            }))}>
                                            <option value="">All Types</option>
                                            <option value="Internal">Internal</option>
                                            <option value="External">External</option>
                                        </select>
                                    </div>
                                    <div className="col-12 col-md-2">
                                        <label style={{
                                            fontSize: "11px", fontWeight: 600,
                                            color: "#374151", marginBottom: "4px",
                                            display: "block"
                                        }}>
                                            STATUS
                                        </label>
                                        <select
                                            className="form-select form-select-sm"
                                            style={{ borderRadius: "6px" }}
                                            value={filters.status}
                                            onChange={e => setFilters(p => ({
                                                ...p, status: e.target.value
                                            }))}>
                                            <option value="">All</option>
                                            <option value="Y">Active</option>
                                            <option value="N">Inactive</option>
                                        </select>
                                    </div>
                                    <div className="col-auto ms-auto d-flex gap-2">
                                        <button onClick={handleSearch} style={{
                                            background: "#0b2a5b", color: "white",
                                            border: "none", borderRadius: "6px",
                                            padding: "6px 16px", fontWeight: 600,
                                            fontSize: "13px", cursor: "pointer",
                                            display: "flex", alignItems: "center", gap: "5px"
                                        }}>
                                            <i className="bi bi-search" /> Search
                                        </button>
                                        <button onClick={handleClear} style={{
                                            background: "white", color: "#374151",
                                            border: "1px solid #d1d5db", borderRadius: "6px",
                                            padding: "6px 16px", fontWeight: 600,
                                            fontSize: "13px", cursor: "pointer",
                                            display: "flex", alignItems: "center", gap: "5px"
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
                            boxShadow: "0 1px 6px rgba(0,0,0,0.06)",
                            overflow: "hidden"
                        }}>
                            {/* Table Header Row */}
                            <div style={{
                                padding: "10px 16px",
                                borderBottom: "1px solid #e5e7eb",
                                display: "flex", alignItems: "center", gap: "8px"
                            }}>
                                <i className="bi bi-table"
                                    style={{ color: "#0b2a5b", fontSize: "13px" }} />
                                <span style={{
                                    fontWeight: 600, color: "#0b2a5b", fontSize: "13px"
                                }}>
                                    Users List
                                </span>
                                <span style={{
                                    background: "#0b2a5b", color: "white",
                                    borderRadius: "20px", padding: "1px 8px",
                                    fontSize: "11px", fontWeight: 600
                                }}>
                                    {users.length}
                                </span>
                                {totalPages > 1 && (
                                    <span style={{
                                        marginLeft: "auto",
                                        fontSize: "12px", color: "#6b7280"
                                    }}>
                                        Page {page} of {totalPages}
                                    </span>
                                )}
                            </div>

                            {loading ? (
                                <div style={{
                                    padding: "40px", textAlign: "center",
                                    color: "#6b7280"
                                }}>
                                    <div className="spinner-border spinner-border-sm
                                        text-primary mb-2" />
                                    <div style={{ fontSize: "13px" }}>
                                        Loading users...
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="table-responsive">
                                        <table className="table mb-0"
                                            style={{ fontSize: "13px" }}>
                                            <thead>
                                                <tr style={{ background: "#0b2a5b" }}>
                                                    {[
                                                        "Edit", "User ID", "Name", "Email",
                                                        "Mobile","Company", "Type", "Role",
                                                        "Authorities", "Login History", "Status"
                                                    ].map(h => (
                                                        <th key={h} style={{
                                                            color: "white", fontWeight: 600,
                                                            fontSize: "11px",
                                                            padding: "10px 14px",
                                                            border: "none",
                                                            whiteSpace: "nowrap",
                                                            textTransform: "uppercase",
                                                            letterSpacing: "0.5px"
                                                        }}>
                                                            {h}
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {paginated.length > 0
                                                    ? paginated.map((u, i) => (
                                                        <tr key={u.userName}
                                                            style={{
                                                                background: i % 2 === 0
                                                                    ? "white" : "#f9fafb",
                                                                transition: "background 0.15s"
                                                            }}
                                                            onMouseEnter={e =>
                                                                e.currentTarget.style.background
                                                                    = "#eff6ff"}
                                                            onMouseLeave={e =>
                                                                e.currentTarget.style.background
                                                                    = i % 2 === 0
                                                                        ? "white" : "#f9fafb"}
                                                        >
                                                            {/* Edit */}
                                                            <td style={cell}>
                                                                <Link to="/editUser" state={u}
                                                                    style={{
                                                                        background: "#eff6ff",
                                                                        color: "#0b2a5b",
                                                                        border: "1px solid #bfdbfe",
                                                                        borderRadius: "5px",
                                                                        padding: "3px 8px",
                                                                        textDecoration: "none",
                                                                        fontSize: "12px"
                                                                    }}>
                                                                    <i className="bi bi-pencil-square" />
                                                                </Link>
                                                            </td>

                                                            {/* User ID */}
                                                            <td style={{
                                                                ...cell, fontWeight: 600,
                                                                color: "#0b2a5b"
                                                            }}>
                                                                {u.userName}
                                                            </td>

                                                            {/* Name */}
                                                            <td style={cell}>{u.name}</td>

                                                            {/* Email */}
                                                            <td style={{
                                                                ...cell, color: "#6b7280"
                                                            }}>
                                                                {u.emailId}
                                                            </td>

                                                            {/* Mobile */}
                                                            <td style={{
                                                                ...cell, color: "#6b7280"
                                                            }}>
                                                                {u.mobileNo}
                                                            </td>

                                                            <td style={{ ...cell, color: "#6b7280" }}>
                                                                    {u.companyDetails || "—"}
                                                                </td>

                                                            {/* Type */}
                                                            <td style={cell}>
                                                                <span style={{
                                                                    background:
                                                                        u.userType === "Internal"
                                                                            ? "#dbeafe" : "#fef3c7",
                                                                    color:
                                                                        u.userType === "Internal"
                                                                            ? "#1e40af" : "#92400e",
                                                                    padding: "2px 8px",
                                                                    borderRadius: "20px",
                                                                    fontSize: "11px",
                                                                    fontWeight: 600
                                                                }}>
                                                                    {u.userType}
                                                                </span>
                                                            </td>

                                                            {/* Role */}
                                                            <td style={cell}>
                                                                <span style={{
                                                                    background:
                                                                        u.role === "Admin"
                                                                            ? "#ede9fe" : "#f3f4f6",
                                                                    color:
                                                                        u.role === "Admin"
                                                                            ? "#5b21b6" : "#374151",
                                                                    padding: "2px 8px",
                                                                    borderRadius: "20px",
                                                                    fontSize: "11px",
                                                                    fontWeight: 600
                                                                }}>
                                                                    <i className={`bi ${
                                                                        u.role === "Admin"
                                                                            ? "bi-shield-check"
                                                                            : "bi-person"} me-1`} />
                                                                    {u.role}
                                                                </span>
                                                            </td>

                                                            {/* ── Authorities Icon ── */}
                                                            <td style={{
                                                                ...cell, textAlign: "center"
                                                            }}>
                                                                <button
                                                                    onClick={() => {
                                                                        setSelectedUser(u);
                                                                        setShowAuthDialog(true);
                                                                    }}
                                                                    title="View Reporting Authorities"
                                                                    style={{
                                                                        background: "#f0fdf4",
                                                                        color: "#065f46",
                                                                        border: "1px solid #6ee7b7",
                                                                        borderRadius: "5px",
                                                                        padding: "3px 8px",
                                                                        fontSize: "12px",
                                                                        cursor: "pointer"
                                                                    }}>
                                                                    <i className="bi bi-diagram-3" />
                                                                </button>
                                                            </td>

                                                            {/* Login History */}
                                                            <td style={{ ...cell, textAlign: "center" }}>
                                                                <button
                                                                    onClick={() => {
                                                                        setHistoryUser(u);
                                                                        setShowHistoryDialog(true);
                                                                    }}
                                                                    title="View Login History"
                                                                    style={{
                                                                        background: "#eff6ff",
                                                                        color: "#1e40af",
                                                                        border: "1px solid #bfdbfe",
                                                                        borderRadius: "5px",
                                                                        padding: "3px 8px",
                                                                        fontSize: "12px", cursor: "pointer"
                                                                    }}>
                                                                    <i className="bi bi-clock-history" />
                                                                </button>
                                                            </td>

{/* Status + Unlock */}
<td style={cell}>
    <div className="d-flex align-items-center gap-1">
        <span style={{
            background: u.status === "Active"
                ? "#d1fae5" : "#fee2e2",
            color: u.status === "Active"
                ? "#065f46" : "#991b1b",
            padding: "2px 8px", borderRadius: "20px",
            fontSize: "11px", fontWeight: 600
        }}>
            <i className={`bi ${u.status === "Active"
                ? "bi-check-circle"
                : "bi-x-circle"} me-1`} />
            {u.status}
        </span>

        {/* ── Locked badge + unlock button ── */}
        {u.userLocked === "Y" && (
            <button
                onClick={() => handleUnlock(u)}
                disabled={unlockLoading === u.userName}
                title="Account Locked — Click to Unlock"
                style={{
                    background: "#fee2e2",
                    color: "#991b1b",
                    border: "1px solid #fca5a5",
                    borderRadius: "5px",
                    padding: "2px 6px",
                    fontSize: "11px", cursor: "pointer",
                    display: "flex", alignItems: "center",
                    gap: "3px"
                }}>
                {unlockLoading === u.userName
                    ? <span className="spinner-border
                        spinner-border-sm" />
                    : <><i className="bi bi-lock-fill" />
                        Locked</>
                }
            </button>
        )}
    </div>
</td>

                                                            
                                                        </tr>
                                                    )) : (
                                                        <tr>
                                                            <td colSpan="10" style={{
                                                                padding: "40px",
                                                                textAlign: "center",
                                                                color: "#9ca3af"
                                                            }}>
                                                                <i className="bi bi-people"
                                                                    style={{
                                                                        fontSize: "28px",
                                                                        display: "block",
                                                                        marginBottom: "8px"
                                                                    }} />
                                                                No users found
                                                            </td>
                                                        </tr>
                                                    )}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* ── Pagination ── */}
                                    {totalPages > 1 && (
                                        <div style={{
                                            padding: "10px 16px",
                                            borderTop: "1px solid #f3f4f6",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "space-between"
                                        }}>
                                            <small style={{ color: "#6b7280" }}>
                                                Showing {(page - 1) * PAGE_SIZE + 1}–
                                                {Math.min(page * PAGE_SIZE, users.length)} of{" "}
                                                {users.length} users
                                            </small>
                                            <div className="d-flex gap-1 align-items-center">
                                                <button
                                                    onClick={() => setPage(p => p - 1)}
                                                    disabled={page === 1}
                                                    style={{
                                                        background: page === 1
                                                            ? "#f3f4f6" : "#0b2a5b",
                                                        color: page === 1
                                                            ? "#9ca3af" : "white",
                                                        border: "none", borderRadius: "6px",
                                                        padding: "4px 10px", fontSize: "12px",
                                                        cursor: page === 1
                                                            ? "not-allowed" : "pointer"
                                                    }}>
                                                    <i className="bi bi-chevron-left" />
                                                </button>

                                                {getPaginationPages().map((p, i) => (
                                                    p === "..." ? (
                                                        <span key={`dot-${i}`} style={{
                                                            padding: "4px 6px",
                                                            fontSize: "12px", color: "#6b7280"
                                                        }}>...</span>
                                                    ) : (
                                                        <button key={p}
                                                            onClick={() => setPage(p)}
                                                            style={{
                                                                background: page === p
                                                                    ? "#0b2a5b" : "white",
                                                                color: page === p
                                                                    ? "white" : "#374151",
                                                                border: "1px solid",
                                                                borderColor: page === p
                                                                    ? "#0b2a5b" : "#d1d5db",
                                                                borderRadius: "6px",
                                                                padding: "4px 9px",
                                                                fontSize: "12px",
                                                                fontWeight: page === p ? 700 : 400,
                                                                cursor: "pointer",
                                                                minWidth: "30px"
                                                            }}>
                                                            {p}
                                                        </button>
                                                    )
                                                ))}

                                                <button
                                                    onClick={() => setPage(p => p + 1)}
                                                    disabled={page === totalPages}
                                                    style={{
                                                        background: page === totalPages
                                                            ? "#f3f4f6" : "#0b2a5b",
                                                        color: page === totalPages
                                                            ? "#9ca3af" : "white",
                                                        border: "none", borderRadius: "6px",
                                                        padding: "4px 10px", fontSize: "12px",
                                                        cursor: page === totalPages
                                                            ? "not-allowed" : "pointer"
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

            {/* ── Authorities Dialog ── */}
            {showAuthDialog && selectedUser && (
                <AuthoritiesDialog
                    user={selectedUser}
                    onClose={() => {
                        setShowAuthDialog(false);
                        setSelectedUser(null);
                    }}
                />
            )}

            {/* Login History Dialog */}
{showHistoryDialog && historyUser && (
    <LoginHistoryDialog
        user={historyUser}
        onClose={() => {
            setShowHistoryDialog(false);
            setHistoryUser(null);
        }}
    />
)}
        </div>
    );
}