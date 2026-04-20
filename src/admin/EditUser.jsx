import { useState, useEffect } from "react";
import { updateUser, manageAdminRole, getExternalUserAuthorities, saveUserAuthorities } from "../api/userApi";
import { useLocation, useNavigate } from "react-router-dom";
import Topbar from "../components/Navbar/Topbar";

const AUTHORITY_LEVELS = [
    { lvl: 1,  role: "Department Head" },
    { lvl: 2,  role: "Division Head"   },
    { lvl: 3,  role: "Operating Head"  },
    { lvl: 4,  role: "Director"        },
    { lvl: 5,  role: "Senior Director" },
    { lvl: 6,  role: "President & CEO" },
    { lvl: 7,  role: "Level 7"         },
    { lvl: 8,  role: "Level 8"         },
    { lvl: 9,  role: "Level 9"         },
    { lvl: 10, role: "Level 10"        },
];

export default function EditUser() {
    const navigate        = useNavigate();
    const { state: user } = useLocation();
    const userId          = sessionStorage.getItem("userId");
    const userRole        = sessionStorage.getItem("userRole");
    const isSuperAdmin    = userRole === "SuperAdmin";

    // ── Nav toggle ────────────────────────────────────────────────────────
    const [isNavOpen, setIsNavOpen] = useState(false);

    // ── Form state ────────────────────────────────────────────────────────
    const [form, setForm] = useState({
        userName:       user?.userName       || "",
        name:           user?.name           || "",
        emailId:        user?.emailId        || "",
        mobileNo:       user?.mobileNo       || "",
        companyDetails: user?.companyDetails || "",
        userType:       user?.userType       || "",
        isActive:       user?.isActive === "Y" ? "Y" : "N",
    });

    const [adminAction,  setAdminAction]  = useState("");
    const [adminRemarks, setAdminRemarks] = useState("");
    const [errors,       setErrors]       = useState({});
    const [message,      setMessage]      = useState("");
    const [messageType,  setMessageType]  = useState("");
    const [loading,      setLoading]      = useState(false);

    // ── Authority state ───────────────────────────────────────────────────
    const [authorityNames,  setAuthorityNames]  = useState({});
    const [authorityEmails, setAuthorityEmails] = useState({});
    const [authLoading,     setAuthLoading]     = useState(false);

    // ── Guards ────────────────────────────────────────────────────────────
    useEffect(() => {
        if (!user) navigate("/dashboard-admin", { replace: true });
    }, [user, navigate]);

    useEffect(() => {
        if (!user || user.userType !== "External") return;
        loadExistingAuthorities();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    const loadExistingAuthorities = async () => {
        setAuthLoading(true);
        try {
            const existing = await getExternalUserAuthorities(user.userName);
            const names  = {};
            const emails = {};
            existing.forEach(a => {
                const lvl = parseInt(a.levelNo, 10);
                if (!isNaN(lvl)) {
                    names[lvl]  = a.levelValue || "";
                    emails[lvl] = a.levelEmail  || "";
                }
            });
            setAuthorityNames(names);
            setAuthorityEmails(emails);
        } catch (err) {
            console.error("Failed to load existing authorities:", err);
        } finally {
            setAuthLoading(false);
        }
    };

    if (!user) return null;

    const isExternal  = form.userType === "External";
    const emailRegex  = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const mobileRegex = /^[6-9]\d{9}$/;

    // ── Validation ────────────────────────────────────────────────────────
    const validate = () => {
        const e = {};

        if (isExternal) {
            if (!form.name.trim())
                e.name = "Name is required";
            if (!form.mobileNo)
                e.mobileNo = "Mobile is required";
            else if (!mobileRegex.test(String(form.mobileNo)))
                e.mobileNo = "Enter valid 10-digit mobile starting with 6-9";
            if (!form.companyDetails.trim())
                e.companyDetails = "Company Details is required";
            AUTHORITY_LEVELS.forEach(({ lvl, role }) => {
                const email = authorityEmails[lvl]?.trim();
                if (email && !emailRegex.test(email))
                    e[`levelEmail_${lvl}`] = `Invalid email for ${role}`;
            });
        }

        // Admin role change — only SuperAdmin allowed
        if (adminAction) {
            if (!isSuperAdmin) {
                e.adminAction = "Only SuperAdmin can assign or remove Admin role";
            } else if (!adminRemarks.trim()) {
                e.adminRemarks = "Remarks are required for role change";
            }
        }

        setErrors(e);
        return Object.keys(e).length === 0;
    };

    // ── Save ──────────────────────────────────────────────────────────────
    const save = async () => {
        if (!validate()) return;
        setLoading(true);
        setMessage("");

        try {
            if (isExternal) {
                await updateUser({
                    userName:       form.userName,
                    name:           form.name.trim(),
                    companyDetails: form.companyDetails.trim(),
                    mobileNumber:   Number(form.mobileNo),
                    isActive:       form.isActive,
                    modifiedBy:     userId,
                });

                const hasAnyAuthority = Object.values(authorityNames).some(v => v?.trim());
                if (hasAnyAuthority) {
                    await saveUserAuthorities({
                        userName:     form.userName,
                        level1:       authorityNames[1]?.trim()  || null,
                        level1Email:  authorityEmails[1]?.trim() || null,
                        level2:       authorityNames[2]?.trim()  || null,
                        level2Email:  authorityEmails[2]?.trim() || null,
                        level3:       authorityNames[3]?.trim()  || null,
                        level3Email:  authorityEmails[3]?.trim() || null,
                        level4:       authorityNames[4]?.trim()  || null,
                        level4Email:  authorityEmails[4]?.trim() || null,
                        level5:       authorityNames[5]?.trim()  || null,
                        level5Email:  authorityEmails[5]?.trim() || null,
                        level6:       authorityNames[6]?.trim()  || null,
                        level6Email:  authorityEmails[6]?.trim() || null,
                        level7:       authorityNames[7]?.trim()  || null,
                        level7Email:  authorityEmails[7]?.trim() || null,
                        level8:       authorityNames[8]?.trim()  || null,
                        level8Email:  authorityEmails[8]?.trim() || null,
                        level9:       authorityNames[9]?.trim()  || null,
                        level9Email:  authorityEmails[9]?.trim() || null,
                        level10:      authorityNames[10]?.trim() || null,
                        level10Email: authorityEmails[10]?.trim() || null,
                        createdBy:    userId,
                    });
                }
            }

            if (adminAction && isSuperAdmin) {
                await manageAdminRole({
                    userName:  form.userName,
                    action:    adminAction,
                    remarks:   adminRemarks.trim(),
                    createdBy: userId,
                });
            }

            // Internal user with no changes
            if (!isExternal && !adminAction) {
                setMessage("No changes to save");
                setMessageType("error");
                setLoading(false);
                return;
            }

            setMessage("User updated successfully");
            setMessageType("success");
            setTimeout(() => navigate("/dashboard-admin"), 2000);

        } catch (err) {
            setMessage(err.message || "Something went wrong");
            setMessageType("error");
        } finally {
            setLoading(false);
        }
    };

    // ── Styles ────────────────────────────────────────────────────────────
    const labelStyle = {
        fontWeight: 600, fontSize: "12px",
        color: "#374151", marginBottom: "5px", display: "block",
    };

    const inputStyle = (hasError, isDisabled) => ({
        borderRadius: "7px",
        border: `1.5px solid ${hasError ? "#dc2626" : "#e5e7eb"}`,
        fontSize: "13px", padding: "7px 12px",
        width: "100%", outline: "none", boxSizing: "border-box",
        background: isDisabled ? "#f9fafb" : "white",
        color:      isDisabled ? "#6b7280" : "#111827",
    });

    const cellInputStyle = (hasError) => ({
        borderRadius: "6px",
        border: `1px solid ${hasError ? "#dc2626" : "#e5e7eb"}`,
        padding: "5px 10px", fontSize: "12px",
        width: "100%", outline: "none",
        background: "white", boxSizing: "border-box",
    });

    const tdStyle = {
        padding: "8px 12px", border: "none",
        borderBottom: "1px solid #f3f4f6",
        verticalAlign: "top",
    };

    const cardHeader = (icon, title, badge) => (
        <div style={{
            background: "#0b2a5b", padding: "12px 20px",
            display: "flex", alignItems: "center", gap: "8px",
        }}>
            <div style={{
                background: "rgba(255,255,255,0.15)",
                borderRadius: "6px", padding: "4px 8px",
            }}>
                <i className={`bi ${icon} text-white`} style={{ fontSize: "13px" }} />
            </div>
            <span style={{ color: "white", fontWeight: 600, fontSize: "14px" }}>{title}</span>
            {badge && (
                <span style={{
                    marginLeft: "auto",
                    background: "rgba(255,255,255,0.2)",
                    color: "white", padding: "1px 10px",
                    borderRadius: "20px", fontSize: "11px", fontWeight: 600,
                }}>
                    {badge}
                </span>
            )}
        </div>
    );

    // ── Render ────────────────────────────────────────────────────────────
    return (
        <div className="app-container">
            <Topbar isNavOpen={isNavOpen} onToggleNav={() => setIsNavOpen(p => !p)} />

            <div className="main-layout d-flex">
                <main className="flex-grow-1" style={{ background: "#f0f2f5", minHeight: "100vh" }}>
                    <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "16px" }}>

                        {/* ── Page header ── */}
                        <div style={{ display: "flex", alignItems: "center", marginBottom: "16px" }}>
                            <button
                                onClick={() => navigate("/dashboard-admin")}
                                style={{
                                    background: "white", border: "1px solid #dee2e6",
                                    borderRadius: "8px", padding: "6px 12px",
                                    cursor: "pointer", marginRight: "12px",
                                    color: "#0b2a5b", flexShrink: 0,
                                    
                                }}
                            >
                                <i className="bi bi-arrow-left" />
                            </button>
                            <div style={{ flex: 1 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                                    <h5 style={{ color: "#0b2a5b", fontWeight: 700, margin: 0 }}>
                                        Edit User
                                    </h5>
                                    <span style={{
                                        background: form.userType === "Internal" ? "#dbeafe" : "#fef3c7",
                                        color:      form.userType === "Internal" ? "#1e40af" : "#92400e",
                                        padding: "1px 10px", borderRadius: "20px",
                                        fontSize: "11px", fontWeight: 600,
                                    }}>
                                        {form.userType}
                                    </span>
                                    <span style={{
                                        background: user.role === "Admin" ? "#ede9fe"
                                            : user.role === "SuperAdmin" ? "#fef3c7" : "#f3f4f6",
                                        color: user.role === "Admin" ? "#5b21b6"
                                            : user.role === "SuperAdmin" ? "#92400e" : "#374151",
                                        padding: "1px 10px", borderRadius: "20px",
                                        fontSize: "11px", fontWeight: 600,
                                    }}>
                                        <i className={`bi ${
                                            user.role === "Admin" ? "bi-shield-check"
                                            : user.role === "SuperAdmin" ? "bi-shield-lock-fill"
                                            : "bi-person"} me-1`} />
                                        {user.role}
                                    </span>
                                </div>
                                <small style={{ color: "#6c757d", fontSize: "12px" }}>
                                    {form.userName} — {form.emailId}
                                </small>
                            </div>
                        </div>

                        {/* ── Alert ── */}
                        {message && (
                            <div style={{
                                marginBottom: "12px", padding: "10px 14px",
                                borderRadius: "8px",
                                background: messageType === "success" ? "#d1fae5" : "#fee2e2",
                                color:      messageType === "success" ? "#065f46" : "#991b1b",
                                border: `1px solid ${messageType === "success" ? "#6ee7b7" : "#fca5a5"}`,
                                display: "flex", alignItems: "center", gap: "8px", fontSize: "13px",
                            }}>
                                <i className={`bi ${messageType === "success"
                                    ? "bi-check-circle" : "bi-exclamation-circle"}`} />
                                {message}
                            </div>
                        )}

                        {/* ── Internal banner ── */}
                        {!isExternal && (
                            <div style={{
                                marginBottom: "12px", padding: "8px 14px",
                                borderRadius: "8px", background: "#eff6ff",
                                color: "#1e40af", border: "1px solid #bfdbfe",
                                display: "flex", alignItems: "center", gap: "8px", fontSize: "12px",
                            }}>
                                <i className="bi bi-info-circle" />
                                Internal user details are synced from E-Portal and cannot be edited.
                                {isSuperAdmin
                                    ? " You can change Status and Admin Role."
                                    : " Only Status can be changed."}
                            </div>
                        )}

                        {/* ── Two-column layout ── */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: "16px" }}>

                            {/* ── LEFT COLUMN ── */}
                            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

                                {/* User Details Card */}
                                <div style={{
                                    background: "white", borderRadius: "10px",
                                    boxShadow: "0 1px 6px rgba(0,0,0,0.06)", overflow: "hidden",
                                }}>
                                    {cardHeader("bi-person-gear", "User Details")}
                                    <div style={{ padding: "16px" }}>
                                        <div style={{
                                            display: "grid",
                                            gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                                            gap: "12px",
                                        }}>
                                            {/* User ID — always disabled */}
                                            <div>
                                                <label style={labelStyle}>
                                                    <i className="bi bi-person-badge me-1" style={{ color: "#0b2a5b" }} />
                                                    User ID
                                                </label>
                                                <input value={form.userName} disabled style={inputStyle(false, true)} />
                                            </div>

                                            {/* Email — always disabled */}
                                            <div>
                                                <label style={labelStyle}>
                                                    <i className="bi bi-envelope me-1" style={{ color: "#0b2a5b" }} />
                                                    Email
                                                </label>
                                                <input value={form.emailId} disabled style={inputStyle(false, true)} />
                                            </div>

                                            {/* Full Name */}
                                            <div>
                                                <label style={labelStyle}>
                                                    <i className="bi bi-person me-1" style={{ color: "#0b2a5b" }} />
                                                    Full Name {isExternal && <span style={{ color: "#dc2626" }}>*</span>}
                                                </label>
                                                <input
                                                    type="text" placeholder="Enter full name"
                                                    value={form.name} disabled={!isExternal}
                                                    onChange={e => setForm({ ...form, name: e.target.value })}
                                                    style={inputStyle(!!errors.name, !isExternal)}
                                                />
                                                {errors.name && (
                                                    <small style={{ color: "#dc2626", fontSize: "11px" }}>
                                                        <i className="bi bi-exclamation-circle me-1" />{errors.name}
                                                    </small>
                                                )}
                                            </div>

                                            {/* Mobile */}
                                            <div>
                                                <label style={labelStyle}>
                                                    <i className="bi bi-phone me-1" style={{ color: "#0b2a5b" }} />
                                                    Mobile {isExternal && <span style={{ color: "#dc2626" }}>*</span>}
                                                </label>
                                                <input
                                                    type="text" placeholder="Enter 10-digit mobile"
                                                    value={form.mobileNo} disabled={!isExternal}
                                                    maxLength={10}
                                                    onChange={e => {
                                                        const v = e.target.value.replace(/\D/g, "");
                                                        setForm({ ...form, mobileNo: v });
                                                    }}
                                                    style={inputStyle(!!errors.mobileNo, !isExternal)}
                                                />
                                                {errors.mobileNo && (
                                                    <small style={{ color: "#dc2626", fontSize: "11px" }}>
                                                        <i className="bi bi-exclamation-circle me-1" />{errors.mobileNo}
                                                    </small>
                                                )}
                                            </div>

                                            {/* Company */}
                                            <div>
                                                <label style={labelStyle}>
                                                    <i className="bi bi-building me-1" style={{ color: "#0b2a5b" }} />
                                                    Company {isExternal && <span style={{ color: "#dc2626" }}>*</span>}
                                                </label>
                                                <input
                                                    type="text" placeholder="Enter company"
                                                    value={form.companyDetails} disabled={!isExternal}
                                                    onChange={e => setForm({ ...form, companyDetails: e.target.value })}
                                                    style={inputStyle(!!errors.companyDetails, !isExternal)}
                                                />
                                                {errors.companyDetails && (
                                                    <small style={{ color: "#dc2626", fontSize: "11px" }}>
                                                        <i className="bi bi-exclamation-circle me-1" />{errors.companyDetails}
                                                    </small>
                                                )}
                                            </div>

                                            {/* Status toggle */}
                                            <div>
                                                <label style={labelStyle}>
                                                    <i className="bi bi-toggle-on me-1" style={{ color: "#0b2a5b" }} />
                                                    Status <span style={{ color: "#dc2626" }}>*</span>
                                                </label>
                                                <div style={{ display: "flex", gap: "8px" }}>
                                                    {["Y", "N"].map(v => (
                                                        <button key={v}
                                                            type="button"
                                                            onClick={() => setForm({ ...form, isActive: v })}
                                                            style={{
                                                                flex: 1, padding: "6px",
                                                                borderRadius: "7px",
                                                                border: `1.5px solid ${form.isActive === v
                                                                    ? (v === "Y" ? "#10b981" : "#ef4444")
                                                                    : "#e5e7eb"}`,
                                                                cursor: "pointer", fontWeight: 600, fontSize: "12px",
                                                                background: form.isActive === v
                                                                    ? (v === "Y" ? "#d1fae5" : "#fee2e2")
                                                                    : "white",
                                                                color: form.isActive === v
                                                                    ? (v === "Y" ? "#065f46" : "#991b1b")
                                                                    : "#6b7280",
                                                            }}
                                                        >
                                                            <i className={`bi ${v === "Y" ? "bi-check-circle" : "bi-x-circle"} me-1`} />
                                                            {v === "Y" ? "Active" : "Inactive"}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Admin Role Card — SuperAdmin only, Internal users only */}
                                {!isExternal && isSuperAdmin && (
                                    <div style={{
                                        background: "white", borderRadius: "10px",
                                        boxShadow: "0 1px 6px rgba(0,0,0,0.06)", overflow: "hidden",
                                    }}>
                                        {cardHeader("bi-shield-lock", "Admin Role Management", `Current: ${user.role}`)}
                                        <div style={{ padding: "16px" }}>
                                            <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
                                                {[
                                                    { val: "",       label: "No Change",   icon: "bi-dash-circle"  },
                                                    { val: "ASSIGN", label: "Assign Admin", icon: "bi-shield-plus"  },
                                                    { val: "REMOVE", label: "Remove Admin", icon: "bi-shield-minus" },
                                                ].map(opt => (
                                                    <button key={opt.val} type="button"
                                                        onClick={() => { setAdminAction(opt.val); setAdminRemarks(""); setErrors({}); }}
                                                        style={{
                                                            flex: 1, padding: "7px 6px",
                                                            borderRadius: "7px",
                                                            border: `1.5px solid ${adminAction === opt.val ? "#0b2a5b" : "#e5e7eb"}`,
                                                            cursor: "pointer", fontWeight: 600, fontSize: "12px",
                                                            background: adminAction === opt.val ? "#eff6ff" : "white",
                                                            color: adminAction === opt.val ? "#0b2a5b" : "#6b7280",
                                                        }}
                                                    >
                                                        <i className={`bi ${opt.icon} me-1`} />
                                                        {opt.label}
                                                    </button>
                                                ))}
                                            </div>

                                            {adminAction && (
                                                <div>
                                                    <label style={labelStyle}>
                                                        <i className="bi bi-chat-left-text me-1" style={{ color: "#0b2a5b" }} />
                                                        Remarks <span style={{ color: "#dc2626" }}>*</span>
                                                    </label>
                                                    <textarea
                                                        rows={2}
                                                        placeholder="Enter reason for role change..."
                                                        value={adminRemarks}
                                                        onChange={e => setAdminRemarks(e.target.value)}
                                                        style={{
                                                            borderRadius: "7px", fontSize: "13px",
                                                            padding: "7px 12px", width: "100%",
                                                            outline: "none", boxSizing: "border-box",
                                                            border: `1.5px solid ${errors.adminRemarks ? "#dc2626" : "#e5e7eb"}`,
                                                            resize: "vertical",
                                                        }}
                                                    />
                                                    {errors.adminRemarks && (
                                                        <small style={{ color: "#dc2626", fontSize: "11px" }}>
                                                            <i className="bi bi-exclamation-circle me-1" />{errors.adminRemarks}
                                                        </small>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Non-SuperAdmin notice for internal users */}
                                {!isExternal && !isSuperAdmin && (
                                    <div style={{
                                        background: "#fff7ed", borderRadius: "10px",
                                        border: "1px solid #fed7aa", padding: "12px 16px",
                                        display: "flex", alignItems: "center",
                                        gap: "8px", fontSize: "13px", color: "#92400e",
                                    }}>
                                        <i className="bi bi-shield-x" />
                                        Admin role changes require SuperAdmin privileges.
                                    </div>
                                )}

                                {/* External — no admin role notice */}
                                {isExternal && (
                                    <div style={{
                                        background: "#fff7ed", borderRadius: "10px",
                                        border: "1px solid #fed7aa", padding: "12px 16px",
                                        display: "flex", alignItems: "center",
                                        gap: "8px", fontSize: "13px", color: "#92400e",
                                    }}>
                                        <i className="bi bi-shield-x" />
                                        External users cannot be assigned Admin role.
                                    </div>
                                )}

                                {/* Authority Details — External only */}
                                {isExternal && (
                                    <div style={{
                                        background: "white", borderRadius: "10px",
                                        boxShadow: "0 1px 6px rgba(0,0,0,0.06)", overflow: "hidden",
                                    }}>
                                        {cardHeader("bi-diagram-3", "Authority Details")}
                                        <div style={{ padding: "16px" }}>
                                            <small style={{
                                                color: "#6b7280", fontSize: "12px",
                                                display: "block", marginBottom: "12px",
                                            }}>
                                                <i className="bi bi-info-circle me-1" style={{ color: "#3b82f6" }} />
                                                Update reporting authority name and email per level.
                                                Email is used for escalation notifications.
                                            </small>

                                            {authLoading ? (
                                                <div style={{ textAlign: "center", padding: "20px", color: "#6b7280" }}>
                                                    <div className="spinner-border spinner-border-sm text-primary me-2" />
                                                    Loading authorities...
                                                </div>
                                            ) : (
                                                <div style={{ overflowX: "auto" }}>
                                                    <table style={{
                                                        width: "100%", borderCollapse: "collapse",
                                                        fontSize: "13px",
                                                    }}>
                                                        <thead>
                                                            <tr style={{ background: "#f8fafc" }}>
                                                                {["Level", "Role", "Authority Name", "Email"].map(h => (
                                                                    <th key={h} style={{
                                                                        padding: "8px 12px", fontSize: "11px",
                                                                        fontWeight: 600, color: "#374151",
                                                                        textTransform: "uppercase", letterSpacing: "0.5px",
                                                                        border: "none", borderBottom: "1px solid #e5e7eb",
                                                                    }}>
                                                                        {h}
                                                                    </th>
                                                                ))}
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {AUTHORITY_LEVELS.map(({ lvl, role }, i) => {
                                                                const emailErrKey = `levelEmail_${lvl}`;
                                                                return (
                                                                    <tr key={lvl} style={{
                                                                        background: i % 2 === 0 ? "white" : "#f9fafb",
                                                                    }}>
                                                                        <td style={{ ...tdStyle, verticalAlign: "middle", width: "75px" }}>
                                                                            <span style={{
                                                                                background: "#dbeafe", color: "#1e40af",
                                                                                padding: "2px 8px", borderRadius: "20px",
                                                                                fontSize: "11px", fontWeight: 600,
                                                                            }}>
                                                                                Level {lvl}
                                                                            </span>
                                                                        </td>
                                                                        <td style={{ ...tdStyle, verticalAlign: "middle", fontWeight: 600, color: "#374151", fontSize: "12px", width: "130px" }}>
                                                                            {role}
                                                                        </td>
                                                                        <td style={tdStyle}>
                                                                            <input
                                                                                type="text"
                                                                                placeholder={`Enter ${role} name`}
                                                                                value={authorityNames[lvl] || ""}
                                                                                onChange={e => setAuthorityNames(prev => ({ ...prev, [lvl]: e.target.value }))}
                                                                                style={cellInputStyle(false)}
                                                                            />
                                                                        </td>
                                                                        <td style={tdStyle}>
                                                                            <input
                                                                                type="email"
                                                                                placeholder={`Enter ${role} email`}
                                                                                value={authorityEmails[lvl] || ""}
                                                                                onChange={e => setAuthorityEmails(prev => ({ ...prev, [lvl]: e.target.value }))}
                                                                                style={cellInputStyle(!!errors[emailErrKey])}
                                                                            />
                                                                            {errors[emailErrKey] && (
                                                                                <small style={{ color: "#dc2626", fontSize: "11px", display: "block", marginTop: "3px" }}>
                                                                                    <i className="bi bi-exclamation-circle me-1" />{errors[emailErrKey]}
                                                                                </small>
                                                                            )}
                                                                        </td>
                                                                    </tr>
                                                                );
                                                            })}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Action Buttons */}
                                <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", paddingBottom: "24px" }}>
                                    <button
                                        type="button"
                                        onClick={() => navigate("/dashboard-admin")}
                                        style={{
                                            background: "white", border: "1.5px solid #d1d5db",
                                            borderRadius: "7px", padding: "7px 20px",
                                            color: "#374151", fontWeight: 600,
                                            fontSize: "13px", cursor: "pointer",
                                        }}
                                    >
                                        <i className="bi bi-x me-1" /> Cancel
                                    </button>
                                    <button
                                        type="button"
                                        onClick={save}
                                        disabled={loading}
                                        style={{
                                            background: loading ? "#94a3b8" : "#0b2a5b",
                                            border: "none", borderRadius: "7px",
                                            padding: "7px 24px", color: "white",
                                            fontWeight: 600, fontSize: "13px",
                                            cursor: loading ? "not-allowed" : "pointer",
                                            display: "flex", alignItems: "center", gap: "6px",
                                        }}
                                    >
                                        {loading
                                            ? <><span className="spinner-border spinner-border-sm" /> Saving...</>
                                            : <><i className="bi bi-check-circle" /> Save Changes</>
                                        }
                                    </button>
                                </div>
                            </div>

                            {/* ── RIGHT COLUMN — User Summary ── */}
                            <div>
                                <div style={{
                                    background: "white", borderRadius: "10px",
                                    boxShadow: "0 1px 6px rgba(0,0,0,0.06)",
                                    overflow: "hidden", position: "sticky", top: "16px",
                                }}>
                                    <div style={{ background: "#0b2a5b", padding: "12px 20px" }}>
                                        <span style={{ color: "white", fontWeight: 600, fontSize: "14px" }}>
                                            <i className="bi bi-person-circle me-2" />User Summary
                                        </span>
                                    </div>
                                    <div style={{ padding: "16px" }}>
                                        <div style={{ textAlign: "center", marginBottom: "14px" }}>
                                            <div style={{
                                                width: "52px", height: "52px",
                                                background: "#0b2a5b", borderRadius: "50%",
                                                display: "flex", alignItems: "center", justifyContent: "center",
                                                margin: "0 auto 8px",
                                                color: "white", fontSize: "18px", fontWeight: 700,
                                            }}>
                                                {form.name?.substring(0, 2).toUpperCase() || "??"}
                                            </div>
                                            <div style={{ fontWeight: 700, color: "#111827", fontSize: "14px" }}>
                                                {form.name}
                                            </div>
                                            <div style={{ color: "#6b7280", fontSize: "12px" }}>
                                                {form.userName}
                                            </div>
                                        </div>

                                        {[
                                            { label: "Email",   value: form.emailId,              icon: "bi-envelope"  },
                                            { label: "Mobile",  value: form.mobileNo    || "—",   icon: "bi-phone"     },
                                            { label: "Company", value: form.companyDetails || "—", icon: "bi-building"  },
                                            { label: "Type",    value: form.userType,              icon: "bi-people"    },
                                            { label: "Role",    value: user.role,                  icon: "bi-shield"    },
                                            { label: "Status",  value: form.isActive === "Y" ? "Active" : "Inactive", icon: "bi-toggle-on" },
                                        ].map((item, i, arr) => (
                                            <div key={i} style={{
                                                display: "flex", justifyContent: "space-between",
                                                alignItems: "center", padding: "8px 0",
                                                borderBottom: i < arr.length - 1 ? "1px solid #f3f4f6" : "none",
                                            }}>
                                                <span style={{
                                                    fontSize: "11px", color: "#6b7280",
                                                    display: "flex", alignItems: "center", gap: "5px",
                                                }}>
                                                    <i className={`bi ${item.icon}`} />{item.label}
                                                </span>
                                                <span style={{
                                                    fontSize: "12px", fontWeight: 600, color: "#111827",
                                                    maxWidth: "150px", textAlign: "right", wordBreak: "break-word",
                                                }}>
                                                    {item.value}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}




