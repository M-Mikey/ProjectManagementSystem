import { useState } from "react";
import { addUser, saveUserAuthorities } from "../api/userApi";
import { useNavigate } from "react-router-dom";

/**
 * Authority level metadata — labels only, no DB lookup required.
 * External users have their reporting chain entered manually by the admin.
 */
const AUTHORITY_LEVELS = [
    { lvl: 1,  role: "Department Head"  },
    { lvl: 2,  role: "Division Head"    },
    { lvl: 3,  role: "Operating Head"   },
    { lvl: 4,  role: "Director"         },
    { lvl: 5,  role: "Senior Director"  },
    { lvl: 6,  role: "President & CEO"  },
    { lvl: 7,  role: "Level 7"          },
    { lvl: 8,  role: "Level 8"          },
    { lvl: 9,  role: "Level 9"          },
    { lvl: 10, role: "Level 10"         },
];

export default function AddUser() {
    const navigate = useNavigate();
    const userId   = sessionStorage.getItem("userId");

    const [form, setForm] = useState({
        userName: "", name: "", emailId: "",
        mobileNo: "", companyDetails: "",
    });

    // Keyed by level number (1–10)
    const [authorityNames,  setAuthorityNames]  = useState({});
    const [authorityEmails, setAuthorityEmails] = useState({});

    const [errors,      setErrors]      = useState({});
    const [message,     setMessage]     = useState("");
    const [messageType, setMessageType] = useState("");
    const [loading,     setLoading]     = useState(false);

    // ── Validation ────────────────────────────────────────────────────────────

    const emailRegex  = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const mobileRegex = /^[6-9]\d{9}$/;

    const validate = () => {
        const e = {};
        if (!form.userName.trim())
            e.userName = "User Name is required";
        if (!form.name.trim())
            e.name = "Name is required";
        if (!form.emailId.trim())
            e.emailId = "Email is required";
        else if (!emailRegex.test(form.emailId))
            e.emailId = "Invalid email format";
        if (!form.mobileNo)
            e.mobileNo = "Mobile Number is required";
        else if (!mobileRegex.test(form.mobileNo))
            e.mobileNo = "Enter valid 10-digit mobile";
        if (!form.companyDetails.trim())
            e.companyDetails = "Company Details is required";

        // Validate: if a name is filled, email must also be valid (and vice-versa)
        AUTHORITY_LEVELS.forEach(({ lvl, role }) => {
            const name  = authorityNames[lvl]?.trim();
            const email = authorityEmails[lvl]?.trim();
            if (name && email && !emailRegex.test(email))
                e[`levelEmail_${lvl}`] = `Invalid email for ${role}`;
        });

        setErrors(e);
        return Object.keys(e).length === 0;
    };

    // ── Save ──────────────────────────────────────────────────────────────────

    const save = async () => {
        if (!validate()) return;
        setLoading(true);
        try {
            // Step 1 — Create the external user record
            await addUser({
                userName:       form.userName.trim(),
                name:           form.name.trim(),
                emailId:        form.emailId.trim(),
                mobileNumber:   Number(form.mobileNo),
                companyDetails: form.companyDetails.trim(),
                createdBy:      userId,
            });

            // Step 2 — Persist authority chain if at least one name was filled
            const hasAnyAuthority = Object.values(authorityNames)
                .some(v => v?.trim());
            if (hasAnyAuthority) {
                await saveUserAuthorities({
                    userName:      form.userName.trim(),
                    level1:        authorityNames[1]?.trim()   || null,
                    level1Email:   authorityEmails[1]?.trim()  || null,
                    level2:        authorityNames[2]?.trim()   || null,
                    level2Email:   authorityEmails[2]?.trim()  || null,
                    level3:        authorityNames[3]?.trim()   || null,
                    level3Email:   authorityEmails[3]?.trim()  || null,
                    level4:        authorityNames[4]?.trim()   || null,
                    level4Email:   authorityEmails[4]?.trim()  || null,
                    level5:        authorityNames[5]?.trim()   || null,
                    level5Email:   authorityEmails[5]?.trim()  || null,
                    level6:        authorityNames[6]?.trim()   || null,
                    level6Email:   authorityEmails[6]?.trim()  || null,
                    level7:        authorityNames[7]?.trim()   || null,
                    level7Email:   authorityEmails[7]?.trim()  || null,
                    level8:        authorityNames[8]?.trim()   || null,
                    level8Email:   authorityEmails[8]?.trim()  || null,
                    level9:        authorityNames[9]?.trim()   || null,
                    level9Email:   authorityEmails[9]?.trim()  || null,
                    level10:       authorityNames[10]?.trim()  || null,
                    level10Email:  authorityEmails[10]?.trim() || null,
                    createdBy:     userId,
                });
            }

            setMessage("User created successfully");
            setMessageType("success");
            setTimeout(() => navigate("/dashboard-admin"), 2000);
        } catch (err) {
            setMessage(err.message || "Something went wrong");
            setMessageType("error");
        } finally {
            setLoading(false);
        }
    };

    // ── Style helpers ─────────────────────────────────────────────────────────

    const fieldInputStyle = (hasError) => ({
        borderRadius: "7px",
        border: `1.5px solid ${hasError ? "#dc2626" : "#e5e7eb"}`,
        fontSize: "13px",
        padding: "7px 12px",
        width: "100%",
        outline: "none",
        background: "white",
    });

    const cellInputStyle = (hasError) => ({
        borderRadius: "6px",
        border: `1px solid ${hasError ? "#dc2626" : "#e5e7eb"}`,
        padding: "5px 10px",
        fontSize: "12px",
        width: "100%",
        outline: "none",
        background: "white",
    });

    const labelStyle = {
        fontWeight: 600, fontSize: "12px",
        color: "#374151", marginBottom: "5px", display: "block",
    };

    const tdStyle = {
        padding: "8px 12px", border: "none",
        borderBottom: "1px solid #f3f4f6",
        verticalAlign: "top",          // top so error messages don't misalign rows
    };

    const cardHeader = (icon, title) => (
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
            <span style={{ color: "white", fontWeight: 600, fontSize: "14px" }}>
                {title}
            </span>
        </div>
    );

    const guidelines = [
        { icon: "bi-person-badge", color: "#3b82f6", text: "Username must be unique across the system" },
        { icon: "bi-shield-lock",  color: "#8b5cf6", text: "A temporary password will be auto-generated and emailed" },
        { icon: "bi-building",     color: "#f59e0b", text: "Only External/Vendor users can be created manually" },
        { icon: "bi-envelope",     color: "#10b981", text: "User will receive login credentials via email" },
        { icon: "bi-telephone",    color: "#ef4444", text: "Mobile number is used for OTP verification" },
    ];

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <div className="app-container">
            <main className="content" style={{ background: "#f0f2f5" }}>
                <div className="container-fluid p-3">

                    {/* ── Page header ── */}
                    <div className="d-flex align-items-center mb-3">
                        <button
                            onClick={() => navigate("/dashboard-admin")}
                            style={{
                                background: "white", border: "1px solid #dee2e6",
                                borderRadius: "8px", padding: "6px 12px",
                                cursor: "pointer", marginRight: "12px",
                                color: "#0b2a5b", flexShrink: 0, width: "max-content",
                            }}
                        >
                            <i className="bi bi-arrow-left" />
                        </button>
                        <div>
                            <h5 className="mb-0" style={{ color: "#0b2a5b", fontWeight: 700 }}>
                                Create External User
                            </h5>
                            <small style={{ color: "#6c757d" }}>
                                Add a new vendor or external user
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

                    {/* ── User information card ── */}
                    <div style={{
                        background: "white", borderRadius: "10px",
                        boxShadow: "0 1px 6px rgba(0,0,0,0.06)",
                        overflow: "hidden", marginBottom: "12px",
                    }}>
                        {cardHeader("bi-person-plus", "User Information")}
                        <div style={{ padding: "20px" }}>
                            <div className="row g-3">

                                {/* User Name */}
                                <div className="col-md-3">
                                    <label style={labelStyle}>
                                        <i className="bi bi-person-badge me-1" style={{ color: "#0b2a5b" }} />
                                        User Name <span style={{ color: "#dc2626" }}>*</span>
                                    </label>
                                    <input
                                        type="text" placeholder="Enter username"
                                        value={form.userName}
                                        onChange={e => setForm({ ...form, userName: e.target.value })}
                                        style={fieldInputStyle(errors.userName)}
                                    />
                                    {errors.userName && (
                                        <small style={{ color: "#dc2626", fontSize: "11px" }}>
                                            <i className="bi bi-exclamation-circle me-1" />
                                            {errors.userName}
                                        </small>
                                    )}
                                </div>

                                {/* Full Name */}
                                <div className="col-md-3">
                                    <label style={labelStyle}>
                                        <i className="bi bi-person me-1" style={{ color: "#0b2a5b" }} />
                                        Full Name <span style={{ color: "#dc2626" }}>*</span>
                                    </label>
                                    <input
                                        type="text" placeholder="Enter full name"
                                        value={form.name}
                                        onChange={e => setForm({ ...form, name: e.target.value })}
                                        style={fieldInputStyle(errors.name)}
                                    />
                                    {errors.name && (
                                        <small style={{ color: "#dc2626", fontSize: "11px" }}>
                                            <i className="bi bi-exclamation-circle me-1" />
                                            {errors.name}
                                        </small>
                                    )}
                                </div>

                                {/* Email */}
                                <div className="col-md-3">
                                    <label style={labelStyle}>
                                        <i className="bi bi-envelope me-1" style={{ color: "#0b2a5b" }} />
                                        Email Address <span style={{ color: "#dc2626" }}>*</span>
                                    </label>
                                    <input
                                        type="email" placeholder="Enter email address"
                                        value={form.emailId}
                                        onChange={e => setForm({ ...form, emailId: e.target.value })}
                                        style={fieldInputStyle(errors.emailId)}
                                    />
                                    {errors.emailId && (
                                        <small style={{ color: "#dc2626", fontSize: "11px" }}>
                                            <i className="bi bi-exclamation-circle me-1" />
                                            {errors.emailId}
                                        </small>
                                    )}
                                </div>

                                {/* Mobile */}
                                <div className="col-md-3">
                                    <label style={labelStyle}>
                                        <i className="bi bi-phone me-1" style={{ color: "#0b2a5b" }} />
                                        Mobile Number <span style={{ color: "#dc2626" }}>*</span>
                                    </label>
                                    <input
                                        type="number" placeholder="Enter 10-digit mobile"
                                        value={form.mobileNo}
                                        onChange={e => setForm({ ...form, mobileNo: e.target.value })}
                                        style={fieldInputStyle(errors.mobileNo)}
                                    />
                                    {errors.mobileNo && (
                                        <small style={{ color: "#dc2626", fontSize: "11px" }}>
                                            <i className="bi bi-exclamation-circle me-1" />
                                            {errors.mobileNo}
                                        </small>
                                    )}
                                </div>

                                {/* Company */}
                                <div className="col-md-3">
                                    <label style={labelStyle}>
                                        <i className="bi bi-building me-1" style={{ color: "#0b2a5b" }} />
                                        Company Details <span style={{ color: "#dc2626" }}>*</span>
                                    </label>
                                    <input
                                        type="text" placeholder="Enter company name"
                                        value={form.companyDetails}
                                        onChange={e => setForm({ ...form, companyDetails: e.target.value })}
                                        style={fieldInputStyle(errors.companyDetails)}
                                    />
                                    {errors.companyDetails && (
                                        <small style={{ color: "#dc2626", fontSize: "11px" }}>
                                            <i className="bi bi-exclamation-circle me-1" />
                                            {errors.companyDetails}
                                        </small>
                                    )}
                                </div>

                                {/* User Type — read-only indicator */}
                                <div className="col-md-3">
                                    <label style={labelStyle}>
                                        <i className="bi bi-shield me-1" style={{ color: "#0b2a5b" }} />
                                        User Type
                                    </label>
                                    <div style={{
                                        background: "#f9fafb",
                                        border: "1.5px solid #e5e7eb",
                                        borderRadius: "7px", padding: "7px 12px",
                                        display: "flex", alignItems: "center", gap: "8px",
                                    }}>
                                        <span style={{
                                            background: "#fef3c7", color: "#92400e",
                                            padding: "1px 8px", borderRadius: "20px",
                                            fontSize: "11px", fontWeight: 600,
                                        }}>
                                            External
                                        </span>
                                        <small style={{ color: "#6b7280", fontSize: "11px" }}>
                                            Only external users created manually
                                        </small>
                                    </div>
                                </div>

                            </div>
                        </div>
                    </div>

                    {/* ── Authority Details card ── */}
                    <div style={{
                        background: "white", borderRadius: "10px",
                        boxShadow: "0 1px 6px rgba(0,0,0,0.06)",
                        overflow: "hidden", marginBottom: "12px",
                    }}>
                        {cardHeader("bi-diagram-3", "Authority Details")}
                        <div style={{ padding: "16px" }}>
                            <small style={{
                                color: "#6b7280", fontSize: "12px",
                                display: "block", marginBottom: "12px",
                            }}>
                                <i className="bi bi-info-circle me-1" style={{ color: "#3b82f6" }} />
                                Enter the name and email of the reporting authority for each
                                applicable level. Email is required for escalation notifications.
                                Leave blank if not applicable.
                            </small>

                            <div className="table-responsive">
                                <table className="table mb-0" style={{ fontSize: "13px" }}>
                                    <thead>
                                        <tr style={{ background: "#f8fafc" }}>
                                            {[
                                                { label: "Level",          width: "90px"  },
                                                { label: "Role",           width: "160px" },
                                                { label: "Authority Name", width: null    },
                                                { label: "Email",          width: null    },
                                            ].map(({ label, width }) => (
                                                <th key={label} style={{
                                                    padding: "8px 12px",
                                                    fontSize: "11px", fontWeight: 600,
                                                    color: "#374151",
                                                    textTransform: "uppercase",
                                                    letterSpacing: "0.5px",
                                                    border: "none",
                                                    borderBottom: "1px solid #e5e7eb",
                                                    width: width || undefined,
                                                }}>
                                                    {label}
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
                                                    {/* Level badge */}
                                                    <td style={{ ...tdStyle, verticalAlign: "middle" }}>
                                                        <span style={{
                                                            background: "#dbeafe", color: "#1e40af",
                                                            padding: "2px 8px", borderRadius: "20px",
                                                            fontSize: "11px", fontWeight: 600,
                                                        }}>
                                                            Level {lvl}
                                                        </span>
                                                    </td>

                                                    {/* Role label */}
                                                    <td style={{
                                                        ...tdStyle, verticalAlign: "middle",
                                                        fontWeight: 600, color: "#374151",
                                                        fontSize: "12px",
                                                    }}>
                                                        {role}
                                                    </td>

                                                    {/* Authority name */}
                                                    <td style={tdStyle}>
                                                        <input
                                                            type="text"
                                                            placeholder={`Enter ${role} name`}
                                                            value={authorityNames[lvl] || ""}
                                                            onChange={e =>
                                                                setAuthorityNames(prev => ({
                                                                    ...prev, [lvl]: e.target.value,
                                                                }))
                                                            }
                                                            style={cellInputStyle(false)}
                                                        />
                                                    </td>

                                                    {/* Authority email */}
                                                    <td style={tdStyle}>
                                                        <input
                                                            type="email"
                                                            placeholder={`Enter ${role} email`}
                                                            value={authorityEmails[lvl] || ""}
                                                            onChange={e =>
                                                                setAuthorityEmails(prev => ({
                                                                    ...prev, [lvl]: e.target.value,
                                                                }))
                                                            }
                                                            style={cellInputStyle(errors[emailErrKey])}
                                                        />
                                                        {errors[emailErrKey] && (
                                                            <small style={{
                                                                color: "#dc2626", fontSize: "11px",
                                                                display: "block", marginTop: "3px",
                                                            }}>
                                                                <i className="bi bi-exclamation-circle me-1" />
                                                                {errors[emailErrKey]}
                                                            </small>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* ── Guidelines card ── */}
                    <div style={{
                        background: "white", borderRadius: "10px",
                        boxShadow: "0 1px 6px rgba(0,0,0,0.06)",
                        overflow: "hidden", marginBottom: "16px",
                    }}>
                        <div style={{ background: "#0b2a5b", padding: "12px 20px" }}>
                            <span style={{ color: "white", fontWeight: 600, fontSize: "14px" }}>
                                <i className="bi bi-info-circle me-2" />Guidelines
                            </span>
                        </div>
                        <div style={{ padding: "16px" }}>
                            {guidelines.map((item, i) => (
                                <div key={i} style={{
                                    display: "flex", gap: "10px",
                                    marginBottom: i < guidelines.length - 1 ? "14px" : "0",
                                    alignItems: "flex-start",
                                }}>
                                    <div style={{
                                        background: `${item.color}15`,
                                        borderRadius: "6px", padding: "5px 7px", flexShrink: 0,
                                    }}>
                                        <i className={`bi ${item.icon}`}
                                            style={{ color: item.color, fontSize: "13px" }} />
                                    </div>
                                    <small style={{
                                        color: "#4b5563", lineHeight: "1.5", fontSize: "12px",
                                    }}>
                                        {item.text}
                                    </small>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* ── Action buttons ── */}
                    <div className="d-flex justify-content-end gap-2 mt-2">
                        <button
                            onClick={() => navigate("/dashboard-admin")}
                            style={{
                                background: "white", border: "1.5px solid #d1d5db",
                                borderRadius: "7px", padding: "7px 20px",
                                color: "#374151", fontWeight: 600,
                                fontSize: "13px", cursor: "pointer", width: "fit-content",
                            }}
                        >
                            <i className="bi bi-x me-1" /> Cancel
                        </button>
                        <button
                            onClick={save}
                            disabled={loading}
                            style={{
                                background: loading ? "#94a3b8" : "#0b2a5b",
                                border: "none", borderRadius: "7px",
                                padding: "7px 24px", color: "white",
                                fontWeight: 600, fontSize: "13px",
                                cursor: loading ? "not-allowed" : "pointer",
                                display: "flex", alignItems: "center", gap: "6px",
                                width: "fit-content",
                            }}
                        >
                            {loading
                                ? <><span className="spinner-border spinner-border-sm" /> Saving...</>
                                : <><i className="bi bi-check-circle" /> Save User</>
                            }
                        </button>
                    </div>

                </div>
            </main>
        </div>
    );
}