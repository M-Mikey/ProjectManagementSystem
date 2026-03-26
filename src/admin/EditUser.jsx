import { useState, useEffect } from "react";
import { updateUser, manageAdminRole, getUserAuthorities,
    getAllAuthorities, saveUserAuthorities } from "../api/userApi";
import { useLocation, useNavigate } from "react-router-dom";
import Topbar from "../components/Navbar/Topbar";

export default function EditUser() {
    const navigate        = useNavigate();
    const { state: user } = useLocation();
    const userId          = sessionStorage.getItem("userId");

    const [form, setForm] = useState({
        userName:       user?.userName       || "",
        name:           user?.name           || "",
        emailId:        user?.emailId        || "",
        mobileNo:       user?.mobileNo       || "",
        companyDetails: user?.companyDetails || "",
        userType:       user?.userType       || "",
        isActive:       user?.status === "Active" ? "Y" : "N",
    });

    const [adminAction,    setAdminAction]    = useState("");
    const [adminRemarks,   setAdminRemarks]   = useState("");
    const [errors,         setErrors]         = useState({});
    const [message,        setMessage]        = useState("");
    const [messageType,    setMessageType]    = useState("");
    const [loading,        setLoading]        = useState(false);

    // ── Authority states ──
    const [allAuthorities,    setAllAuthorities]    = useState([]);
    const [selectedLevels,    setSelectedLevels]    = useState({});
    const [authLoading,       setAuthLoading]       = useState(false);

    // ✅ Clear stale messages on mount
    useEffect(() => {
        setMessage("");
        setMessageType("");
    }, []);

    // ✅ Redirect if no user state
    useEffect(() => {
        if (!user) navigate("/dashboard-admin", { replace: true });
    }, [user, navigate]);

    // ✅ Load authorities for External users
    useEffect(() => {
        if (!user || user.userType !== "External") return;
        loadAuthData();
    }, [user]);

    const loadAuthData = async () => {
        setAuthLoading(true);
        try {
            // Load all available authorities for dropdowns
            const all = await getAllAuthorities();
            setAllAuthorities(all);

            // Load existing authorities for this user
            const existing = await getUserAuthorities(user.userName);

            // Map existing to selectedLevels by levelNo
            const mapped = {};
            existing.forEach(a => {
                mapped[parseInt(a.levelNo)] = a.approverCode;
            });
            setSelectedLevels(mapped);
        } catch (err) {
            console.error("Failed to load authorities:", err);
        } finally {
            setAuthLoading(false);
        }
    };

    if (!user) return null;

    const isExternal  = form.userType === "External";
    const mobileRegex = /^[6-9]\d{9}$/;

    const validate = () => {
        const e = {};
        if (isExternal) {
            if (!form.name)
                e.name = "Name is required";
            if (!form.mobileNo)
                e.mobileNo = "Mobile is required";
            else if (!mobileRegex.test(form.mobileNo))
                e.mobileNo = "Enter valid 10-digit mobile";
            if (!form.companyDetails)
                e.companyDetails = "Company Details is required";
        }
        if (adminAction && !adminRemarks)
            e.adminRemarks = "Remarks required for role change";
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const save = async () => {
        if (!validate()) return;
        setLoading(true);
        try {
            // ✅ Only call updateUser for External users
            if (isExternal) {
                await updateUser({
                    userName:       form.userName,
                    name:           form.name,
                    companyDetails: form.companyDetails,
                    mobileNumber:   Number(form.mobileNo),
                    isActive:       form.isActive,
                    modifiedBy:     userId,
                });

                // ✅ Save authorities if External
                const hasAuthorities = Object.values(selectedLevels)
                    .some(v => v);
                if (hasAuthorities) {
                    await saveUserAuthorities({
                        userName:  form.userName,
                        level1:    selectedLevels[1]  || null,
                        level2:    selectedLevels[2]  || null,
                        level3:    selectedLevels[3]  || null,
                        level4:    selectedLevels[4]  || null,
                        level5:    selectedLevels[5]  || null,
                        level6:    selectedLevels[6]  || null,
                        level7:    selectedLevels[7]  || null,
                        level8:    selectedLevels[8]  || null,
                        level9:    selectedLevels[9]  || null,
                        level10:   selectedLevels[10] || null,
                        createdBy: userId,
                    });
                }
            }

            // ✅ Handle admin role — Internal users only
            if (adminAction) {
                await manageAdminRole({
                    userName:  form.userName,
                    action:    adminAction,
                    remarks:   adminRemarks,
                    createdBy: userId,
                });
            }

            // ✅ If Internal user with no action selected
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

    const labelStyle = {
        fontWeight: 600, fontSize: "12px",
        color: "#374151", marginBottom: "5px", display: "block"
    };

    const inputStyle = (hasError, isDisabled) => ({
        borderRadius: "7px",
        border: hasError ? "1.5px solid #dc2626" : "1.5px solid #e5e7eb",
        fontSize: "13px", padding: "7px 12px",
        width: "100%", outline: "none",
        background: isDisabled ? "#f9fafb" : "white",
        color: isDisabled ? "#6b7280" : "#111827"
    });

    const cardHeader = (icon, title, badge) => (
        <div style={{
            background: "#0b2a5b", padding: "12px 20px",
            display: "flex", alignItems: "center", gap: "8px"
        }}>
            <div style={{
                background: "rgba(255,255,255,0.15)",
                borderRadius: "6px", padding: "4px 8px"
            }}>
                <i className={`bi ${icon} text-white`}
                    style={{ fontSize: "13px" }} />
            </div>
            <span style={{ color: "white", fontWeight: 600, fontSize: "14px" }}>
                {title}
            </span>
            {badge && (
                <span style={{
                    marginLeft: "auto",
                    background: user.role === "Admin"
                        ? "#7c3aed" : "rgba(255,255,255,0.2)",
                    color: "white", padding: "1px 10px",
                    borderRadius: "20px", fontSize: "11px", fontWeight: 600
                }}>
                    {badge}
                </span>
            )}
        </div>
    );

    const levelRows = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

    return (
        <div className="app-container">
            <Topbar />
            <div className="main-layout d-flex">
                <main className="flex-grow-1" style={{
                    background: "#f0f2f5",
                    minHeight: "100vh",
                    paddingTop: "10px"
                }}>
                    <div className="container-fluid p-3">

                        {/* ── Header ── */}
                        <div className="d-flex align-items-center mb-3">
                            <button onClick={() => navigate("/dashboard-admin")}
                                style={{
                                    background: "white",
                                    border: "1px solid #dee2e6",
                                    borderRadius: "8px", padding: "6px 12px",
                                    cursor: "pointer", marginRight: "12px",
                                    color: "#0b2a5b", flexShrink: 0,
                                    width: "max-content"
                                }}>
                                <i className="bi bi-arrow-left" />
                            </button>
                            <div className="flex-grow-1">
                                <div className="d-flex align-items-center gap-2">
                                    <h5 className="mb-0" style={{
                                        color: "#0b2a5b", fontWeight: 700
                                    }}>
                                        Edit User
                                    </h5>
                                    <span style={{
                                        background: form.userType === "Internal"
                                            ? "#dbeafe" : "#fef3c7",
                                        color: form.userType === "Internal"
                                            ? "#1e40af" : "#92400e",
                                        padding: "1px 10px", borderRadius: "20px",
                                        fontSize: "11px", fontWeight: 600
                                    }}>
                                        {form.userType}
                                    </span>
                                    <span style={{
                                        background: user.role === "Admin"
                                            ? "#ede9fe" : "#f3f4f6",
                                        color: user.role === "Admin"
                                            ? "#5b21b6" : "#374151",
                                        padding: "1px 10px", borderRadius: "20px",
                                        fontSize: "11px", fontWeight: 600
                                    }}>
                                        <i className={`bi ${user.role === "Admin"
                                            ? "bi-shield-check"
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
                                background: messageType === "success"
                                    ? "#d1fae5" : "#fee2e2",
                                color: messageType === "success"
                                    ? "#065f46" : "#991b1b",
                                border: `1px solid ${messageType === "success"
                                    ? "#6ee7b7" : "#fca5a5"}`,
                                display: "flex", alignItems: "center",
                                gap: "8px", fontSize: "13px"
                            }}>
                                <i className={`bi ${messageType === "success"
                                    ? "bi-check-circle" : "bi-exclamation-circle"}`} />
                                {message}
                            </div>
                        )}

                        {/* ── Internal Banner ── */}
                        {!isExternal && (
                            <div style={{
                                marginBottom: "12px", padding: "8px 14px",
                                borderRadius: "8px", background: "#eff6ff",
                                color: "#1e40af", border: "1px solid #bfdbfe",
                                display: "flex", alignItems: "center",
                                gap: "8px", fontSize: "12px"
                            }}>
                                <i className="bi bi-info-circle" />
                                Internal user details synced from E-Portal.
                                Only Status and Admin Role can be changed.
                            </div>
                        )}

                        <div className="row g-3">

                            {/* ── Left Column ── */}
                            <div className="col-lg-5  d-flex flex-column gap-3">

                                {/* ── User Details Card ── */}
                                <div style={{
                                    background: "white", borderRadius: "10px",
                                    boxShadow: "0 1px 6px rgba(0,0,0,0.06)",
                                    overflow: "hidden", marginBottom: "12px"
                                }}>
                                    {cardHeader("bi-person-gear", "User Details")}
                                    <div style={{ padding: "16px" }}>
                                        <div className="row g-2">

                                            {/* User ID */}
                                            <div className="col-md-5">
                                                <label style={labelStyle}>
                                                    <i className="bi bi-person-badge me-1"
                                                        style={{ color: "#0b2a5b" }} />
                                                    User ID
                                                </label>
                                                <input value={form.userName} disabled
                                                    style={inputStyle(false, true)} />
                                            </div>

                                            {/* Email */}
                                            <div className="col-md-5">
                                                <label style={labelStyle}>
                                                    <i className="bi bi-envelope me-1"
                                                        style={{ color: "#0b2a5b" }} />
                                                    Email
                                                </label>
                                                <input value={form.emailId} disabled
                                                    style={inputStyle(false, true)} />
                                            </div>

                                            {/* Full Name */}
                                            <div className="col-md-5">
                                                <label style={labelStyle}>
                                                    <i className="bi bi-person me-1"
                                                        style={{ color: "#0b2a5b" }} />
                                                    Full Name
                                                    {isExternal && (
                                                        <span style={{ color: "#dc2626" }}> *</span>
                                                    )}
                                                </label>
                                                <input type="text"
                                                    placeholder="Enter full name"
                                                    value={form.name}
                                                    disabled={!isExternal}
                                                    onChange={e => setForm({
                                                        ...form, name: e.target.value
                                                    })}
                                                    style={inputStyle(errors.name, !isExternal)} />
                                                {errors.name && (
                                                    <small style={{
                                                        color: "#dc2626", fontSize: "11px"
                                                    }}>
                                                        <i className="bi bi-exclamation-circle me-1" />
                                                        {errors.name}
                                                    </small>
                                                )}
                                            </div>

                                            {/* Mobile */}
                                            <div className="col-md-5">
                                                <label style={labelStyle}>
                                                    <i className="bi bi-phone me-1"
                                                        style={{ color: "#0b2a5b" }} />
                                                    Mobile Number
                                                    {isExternal && (
                                                        <span style={{ color: "#dc2626" }}> *</span>
                                                    )}
                                                </label>
                                                <input type="number"
                                                    placeholder="Enter mobile"
                                                    value={form.mobileNo}
                                                    disabled={!isExternal}
                                                    onChange={e => setForm({
                                                        ...form, mobileNo: e.target.value
                                                    })}
                                                    style={inputStyle(
                                                        errors.mobileNo, !isExternal
                                                    )} />
                                                {errors.mobileNo && (
                                                    <small style={{
                                                        color: "#dc2626", fontSize: "11px"
                                                    }}>
                                                        <i className="bi bi-exclamation-circle me-1" />
                                                        {errors.mobileNo}
                                                    </small>
                                                )}
                                            </div>

                                            {/* Company */}
                                            <div className="col-md-5">
                                                <label style={labelStyle}>
                                                    <i className="bi bi-building me-1"
                                                        style={{ color: "#0b2a5b" }} />
                                                    Company Details
                                                    {isExternal && (
                                                        <span style={{ color: "#dc2626" }}> *</span>
                                                    )}
                                                </label>
                                                <input type="text"
                                                    placeholder="Enter company"
                                                    value={form.companyDetails}
                                                    disabled={!isExternal}
                                                    onChange={e => setForm({
                                                        ...form, companyDetails: e.target.value
                                                    })}
                                                    style={inputStyle(
                                                        errors.companyDetails, !isExternal
                                                    )} />
                                                {errors.companyDetails && (
                                                    <small style={{
                                                        color: "#dc2626", fontSize: "11px"
                                                    }}>
                                                        <i className="bi bi-exclamation-circle me-1" />
                                                        {errors.companyDetails}
                                                    </small>
                                                )}
                                            </div>

                                            {/* Status Toggle */}
                                            <div className="col-md-5">
                                                <label style={labelStyle}>
                                                    <i className="bi bi-toggle-on me-1"
                                                        style={{ color: "#0b2a5b" }} />
                                                    Status
                                                    <span style={{ color: "#dc2626" }}> *</span>
                                                </label>
                                                <div className="d-flex gap-2">
                                                    {["Y", "N"].map(v => (
                                                        <button key={v}
                                                            onClick={() => setForm({
                                                                ...form, isActive: v
                                                            })}
                                                            style={{
                                                                flex: 1, padding: "6px",
                                                                borderRadius: "7px",
                                                                border: "1.5px solid",
                                                                cursor: "pointer",
                                                                fontWeight: 600,
                                                                fontSize: "12px",
                                                                borderColor: form.isActive === v
                                                                    ? (v === "Y"
                                                                        ? "#10b981" : "#ef4444")
                                                                    : "#e5e7eb",
                                                                background: form.isActive === v
                                                                    ? (v === "Y"
                                                                        ? "#d1fae5" : "#fee2e2")
                                                                    : "white",
                                                                color: form.isActive === v
                                                                    ? (v === "Y"
                                                                        ? "#065f46" : "#991b1b")
                                                                    : "#6b7280"
                                                            }}>
                                                            <i className={`bi ${v === "Y"
                                                                ? "bi-check-circle"
                                                                : "bi-x-circle"} me-1`} />
                                                            {v === "Y" ? "Active" : "Inactive"}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* ── Authority Details — External only ── */}
                              

                                {/* ── Admin Role Card — Internal only ── */}
                                {!isExternal && (
                                    <div style={{
                                        background: "white", borderRadius: "10px",
                                        boxShadow: "0 1px 6px rgba(0,0,0,0.06)",
                                        overflow: "hidden", marginBottom: "12px"
                                    }}>
                                        {cardHeader(
                                            "bi-shield-lock",
                                            "Admin Role Management",
                                            `Current: ${user.role}`
                                        )}
                                        <div style={{ padding: "16px" }}>
                                            <div className="d-flex gap-2 mb-2">
                                                {[
                                                    { val: "",       label: "No Change",
                                                        icon: "bi-dash-circle" },
                                                    { val: "ASSIGN", label: "Assign Admin",
                                                        icon: "bi-shield-plus" },
                                                    { val: "REMOVE", label: "Remove Admin",
                                                        icon: "bi-shield-minus" },
                                                ].map(opt => (
                                                    <button key={opt.val}
                                                        onClick={() => {
                                                            setAdminAction(opt.val);
                                                            setAdminRemarks("");
                                                        }}
                                                        style={{
                                                            flex: 1, padding: "7px 6px",
                                                            borderRadius: "7px",
                                                            border: "1.5px solid",
                                                            cursor: "pointer", fontWeight: 600,
                                                            fontSize: "12px",
                                                            borderColor: adminAction === opt.val
                                                                ? "#0b2a5b" : "#e5e7eb",
                                                            background: adminAction === opt.val
                                                                ? "#eff6ff" : "white",
                                                            color: adminAction === opt.val
                                                                ? "#0b2a5b" : "#6b7280"
                                                        }}>
                                                        <i className={`bi ${opt.icon} me-1`} />
                                                        {opt.label}
                                                    </button>
                                                ))}
                                            </div>

                                            {adminAction && (
                                                <div>
                                                    <label style={labelStyle}>
                                                        <i className="bi bi-chat-left-text me-1"
                                                            style={{ color: "#0b2a5b" }} />
                                                        Remarks
                                                        <span style={{ color: "#dc2626" }}> *</span>
                                                        <small style={{
                                                            color: "#6b7280", fontWeight: 400,
                                                            marginLeft: "4px"
                                                        }}>
                                                            (required)
                                                        </small>
                                                    </label>
                                                    <textarea rows={2}
                                                        placeholder="Enter reason for role change..."
                                                        value={adminRemarks}
                                                        onChange={e =>
                                                            setAdminRemarks(e.target.value)
                                                        }
                                                        style={{
                                                            borderRadius: "7px",
                                                            fontSize: "13px",
                                                            padding: "7px 12px",
                                                            width: "100%", outline: "none",
                                                            border: errors.adminRemarks
                                                                ? "1.5px solid #dc2626"
                                                                : "1.5px solid #e5e7eb"
                                                        }} />
                                                    {errors.adminRemarks && (
                                                        <small style={{
                                                            color: "#dc2626", fontSize: "11px"
                                                        }}>
                                                            <i className="bi bi-exclamation-circle me-1" />
                                                            {errors.adminRemarks}
                                                        </small>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* ── External — no admin role banner ── */}
                                {isExternal && (
                                    <div style={{
                                        background: "#fff7ed",
                                        borderRadius: "10px",
                                        border: "1px solid #fed7aa",
                                        padding: "12px 16px",
                                        marginBottom: "12px",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "8px",
                                        fontSize: "13px",
                                        color: "#92400e"
                                    }}>
                                        <i className="bi bi-shield-x" />
                                        External users cannot be assigned Admin role
                                        per BRD policy.
                                    </div>
                                )}

                            </div>

                            {/* ── Right — Summary ── */}
                            <div className="col-lg-3 d-flex flex-column gap-3">

                                  {isExternal && (
                                    <div style={{
                                        background: "white", borderRadius: "10px",
                                        boxShadow: "0 1px 6px rgba(0,0,0,0.06)",
                                        overflow: "hidden", marginBottom: "12px"
                                    }}>
                                        {cardHeader("bi-diagram-3", "Authority Details")}
                                        <div style={{ padding: "16px" }}>
                                            <small style={{
                                                color: "#6b7280", fontSize: "12px",
                                                display: "block", marginBottom: "12px"
                                            }}>
                                                <i className="bi bi-info-circle me-1"
                                                    style={{ color: "#3b82f6" }} />
                                                Update reporting authorities for each level.
                                                Leave blank if not applicable.
                                            </small>

                                            {authLoading ? (
                                                <div style={{
                                                    textAlign: "center", padding: "20px",
                                                    color: "#6b7280"
                                                }}>
                                                    <div className="spinner-border
                                                        spinner-border-sm text-primary me-2" />
                                                    Loading authorities...
                                                </div>
                                            ) : (
                                                <div className="table-responsive">
                                                    <table className="table mb-0"
                                                        style={{ fontSize: "13px" }}>
                                                        <thead>
                                                            <tr style={{
                                                                background: "#f8fafc"
                                                            }}>
                                                                {["Level", "Role",
                                                                    "Assigned Authority"
                                                                ].map(h => (
                                                                    <th key={h} style={{
                                                                        padding: "8px 12px",
                                                                        fontSize: "11px",
                                                                        fontWeight: 600,
                                                                        color: "#374151",
                                                                        textTransform: "uppercase",
                                                                        letterSpacing: "0.5px",
                                                                        border: "none",
                                                                        borderBottom:
                                                                            "1px solid #e5e7eb"
                                                                    }}>
                                                                        {h}
                                                                    </th>
                                                                ))}
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {levelRows.map((lvl, i) => {
                                                                const lvlAuthorities =
                                                                    allAuthorities.filter(
                                                                        a => a.levelNo ===
                                                                            String(lvl)
                                                                    );
                                                                const roleName =
                                                                    lvlAuthorities[0]?.roleName
                                                                    || `Level ${lvl}`;

                                                                if (allAuthorities.length > 0
                                                                    && lvlAuthorities.length === 0
                                                                ) return null;

                                                                return (
                                                                    <tr key={lvl} style={{
                                                                        background: i % 2 === 0
                                                                            ? "white" : "#f9fafb"
                                                                    }}>
                                                                        <td style={{
                                                                            padding: "8px 12px",
                                                                            border: "none",
                                                                            borderBottom:
                                                                                "1px solid #f3f4f6"
                                                                        }}>
                                                                            <span style={{
                                                                                background: "#dbeafe",
                                                                                color: "#1e40af",
                                                                                padding: "2px 8px",
                                                                                borderRadius: "20px",
                                                                                fontSize: "11px",
                                                                                fontWeight: 600
                                                                            }}>
                                                                                Level {lvl}
                                                                            </span>
                                                                        </td>
                                                                        <td style={{
                                                                            padding: "8px 12px",
                                                                            border: "none",
                                                                            borderBottom:
                                                                                "1px solid #f3f4f6",
                                                                            fontWeight: 600,
                                                                            color: "#374151",
                                                                            fontSize: "12px"
                                                                        }}>
                                                                            {roleName}
                                                                        </td>
                                                                        <td style={{
                                                                            padding: "8px 12px",
                                                                            border: "none",
                                                                            borderBottom:
                                                                                "1px solid #f3f4f6"
                                                                        }}>
                                                                            <select
                                                                                style={{
                                                                                    borderRadius: "6px",
                                                                                    border: "1px solid #e5e7eb",
                                                                                    padding: "5px 10px",
                                                                                    fontSize: "12px",
                                                                                    width: "100%",
                                                                                    outline: "none"
                                                                                }}
                                                                                value={
                                                                                    selectedLevels[lvl]
                                                                                    || ""
                                                                                }
                                                                                onChange={e =>
                                                                                    setSelectedLevels(
                                                                                        prev => ({
                                                                                            ...prev,
                                                                                            [lvl]: e.target.value || null
                                                                                        })
                                                                                    )
                                                                                }>
                                                                                <option value="">
                                                                                    -- Select --
                                                                                </option>
                                                                                {lvlAuthorities.map(
                                                                                    (a, j) => (
                                                                                        <option
                                                                                            key={j}
                                                                                            value={
                                                                                                a.approverCode
                                                                                            }>
                                                                                            {a.approverName}
                                                                                            {" "}[{a.approverCode}]
                                                                                        </option>
                                                                                    )
                                                                                )}
                                                                            </select>
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
                               

                                {/* ── Action Buttons ── */}
                                <div className="d-flex justify-content-end gap-2">
                                    <button onClick={() => navigate("/dashboard-admin")}
                                        style={{
                                            background: "white",
                                            border: "1.5px solid #d1d5db",
                                            borderRadius: "7px", padding: "7px 20px",
                                            color: "#374151", fontWeight: 600,
                                            fontSize: "13px", cursor: "pointer"
                                        }}>
                                        <i className="bi bi-x me-1" /> Cancel
                                    </button>
                                    <button onClick={save} disabled={loading}
                                        style={{
                                            background: loading ? "#94a3b8" : "#0b2a5b",
                                            border: "none", borderRadius: "7px",
                                            padding: "7px 24px", color: "white",
                                            fontWeight: 600, fontSize: "13px",
                                            cursor: loading ? "not-allowed" : "pointer",
                                            display: "flex", alignItems: "center", gap: "6px"
                                        }}>
                                        {loading
                                            ? <><span className="spinner-border
                                                spinner-border-sm" /> Saving...</>
                                            : <><i className="bi bi-check-circle" />
                                                Save Changes</>
                                        }
                                    </button>
                                </div>
                            </div>
                            <div className="col-lg-3 d-flex flex-column gap-3">
                             <div style={{
                                    background: "white", borderRadius: "10px",
                                    boxShadow: "0 1px 6px rgba(0,0,0,0.06)",
                                    overflow: "hidden",
                                    position: "sticky", top: "16px"
                                }}>
                                    <div style={{
                                        background: "#0b2a5b", padding: "12px 20px"
                                    }}>
                                        <span style={{
                                            color: "white", fontWeight: 600, fontSize: "14px"
                                        }}>
                                            <i className="bi bi-person-circle me-2" />
                                            User Summary
                                        </span>
                                    </div>
                                    <div style={{ padding: "16px" }}>
                                        <div style={{
                                            textAlign: "center", marginBottom: "14px"
                                        }}>
                                            <div style={{
                                                width: "52px", height: "52px",
                                                background: "#0b2a5b",
                                                borderRadius: "50%",
                                                display: "flex", alignItems: "center",
                                                justifyContent: "center",
                                                margin: "0 auto 8px",
                                                color: "white", fontSize: "18px",
                                                fontWeight: 700
                                            }}>
                                                {form.name?.substring(0, 2).toUpperCase() || "??"}
                                            </div>
                                            <div style={{
                                                fontWeight: 700, color: "#111827",
                                                fontSize: "14px"
                                            }}>
                                                {form.name}
                                            </div>
                                            <div style={{
                                                color: "#6b7280", fontSize: "12px"
                                            }}>
                                                {form.userName}
                                            </div>
                                        </div>

                                        {[
                                            { label: "Email",
                                                value: form.emailId,
                                                icon: "bi-envelope" },
                                            { label: "Mobile",
                                                value: form.mobileNo || "—",
                                                icon: "bi-phone" },
                                            { label: "Company",
                                                value: form.companyDetails || "—",
                                                icon: "bi-building" },
                                            { label: "Type",
                                                value: form.userType,
                                                icon: "bi-people" },
                                            { label: "Role",
                                                value: user.role,
                                                icon: "bi-shield" },
                                            { label: "Status",
                                                value: form.isActive === "Y"
                                                    ? "Active" : "Inactive",
                                                icon: "bi-toggle-on" },
                                        ].map((item, i, arr) => (
                                            <div key={i} style={{
                                                display: "flex",
                                                justifyContent: "space-between",
                                                alignItems: "center",
                                                padding: "8px 0",
                                                borderBottom: i < arr.length - 1
                                                    ? "1px solid #f3f4f6" : "none"
                                            }}>
                                                <span style={{
                                                    fontSize: "11px", color: "#6b7280",
                                                    display: "flex",
                                                    alignItems: "center", gap: "5px"
                                                }}>
                                                    <i className={`bi ${item.icon}`} />
                                                    {item.label}
                                                </span>
                                                <span style={{
                                                    fontSize: "12px", fontWeight: 600,
                                                    color: "#111827", maxWidth: "150px",
                                                    textAlign: "right",
                                                    wordBreak: "break-word"
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