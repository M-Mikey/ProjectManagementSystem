import { useState, useEffect } from "react";
import { addUser, getAllAuthorities, saveUserAuthorities } from "../api/userApi";
import { useNavigate } from "react-router-dom";
import Topbar from "../components/Navbar/Topbar";

export default function AddUser() {
    const navigate = useNavigate();
    const userId = sessionStorage.getItem("userId");

    const [form, setForm] = useState({
        userName: "", name: "", emailId: "",
        mobileNo: "", companyDetails: "",
    });

    // Authority levels — up to 10
    const [authorities, setAuthorities] = useState([]);
    const [selectedLevels, setSelectedLevels] = useState({});
    const [authLoading, setAuthLoading] = useState(false);

    const [errors, setErrors] = useState({});
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadAuthorities();
    }, []);

    const loadAuthorities = async () => {
        setAuthLoading(true);
        try {
            const data = await getAllAuthorities();
            setAuthorities(data);
        } catch (err) {
            console.error("Failed to load authorities:", err);
        } finally {
            setAuthLoading(false);
        }
    };

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const mobileRegex = /^[6-9]\d{9}$/;

    const validate = () => {
        const e = {};
        if (!form.userName)
            e.userName = "User Name is required";
        if (!form.name)
            e.name = "Name is required";
        if (!form.emailId)
            e.emailId = "Email is required";
        else if (!emailRegex.test(form.emailId))
            e.emailId = "Invalid email format";
        if (!form.mobileNo)
            e.mobileNo = "Mobile Number is required";
        else if (!mobileRegex.test(form.mobileNo))
            e.mobileNo = "Enter valid 10-digit mobile";
        if (!form.companyDetails)
            e.companyDetails = "Company Details is required";
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const save = async () => {
        if (!validate()) return;
        setLoading(true);
        try {
            // Step 1 — Create user
            await addUser({
                userName: form.userName,
                name: form.name,
                emailId: form.emailId,
                mobileNumber: Number(form.mobileNo),
                companyDetails: form.companyDetails,
                createdBy: userId,
            });

            // Step 2 — Save authorities if any selected
            const hasAuthorities = Object.values(selectedLevels)
                .some(v => v);
            if (hasAuthorities) {
                await saveUserAuthorities({
                    userName: form.userName,
                    level1: selectedLevels[1] || null,
                    level2: selectedLevels[2] || null,
                    level3: selectedLevels[3] || null,
                    level4: selectedLevels[4] || null,
                    level5: selectedLevels[5] || null,
                    level6: selectedLevels[6] || null,
                    level7: selectedLevels[7] || null,
                    level8: selectedLevels[8] || null,
                    level9: selectedLevels[9] || null,
                    level10: selectedLevels[10] || null,
                    createdBy: userId,
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

    const guidelines = [
        {
            icon: "bi-person-badge", color: "#3b82f6",
            text: "Username must be unique across the system"
        },
        {
            icon: "bi-shield-lock", color: "#8b5cf6",
            text: "A temporary password will be auto-generated and emailed"
        },
        {
            icon: "bi-building", color: "#f59e0b",
            text: "Only External/Vendor users can be created manually"
        },
        {
            icon: "bi-envelope", color: "#10b981",
            text: "User will receive login credentials via email"
        },
        {
            icon: "bi-telephone", color: "#ef4444",
            text: "Mobile number is used for OTP verification"
        },
    ];

    const inputStyle = (hasError) => ({
        borderRadius: "7px",
        border: hasError ? "1.5px solid #dc2626" : "1.5px solid #e5e7eb",
        fontSize: "13px", padding: "7px 12px",
        width: "100%", outline: "none", background: "white"
    });

    const labelStyle = {
        fontWeight: 600, fontSize: "12px",
        color: "#374151", marginBottom: "5px", display: "block"
    };

    const cardHeader = (icon, title) => (
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
        </div>
    );

    // Level rows to show
    const levelRows = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

    return (
        <div className="app-container">
            <Topbar />

            <main className="content" style={{ background: "#f0f2f5" }}>
                <div className="container-fluid p-3">

                    {/* ── Header ── */}
                    <div className="d-flex align-items-center mb-3">
                        <button onClick={() => navigate("/dashboard-admin")}
                            style={{
                                background: "white",
                                border: "1px solid #dee2e6",
                                borderRadius: "8px", padding: "6px 12px",
                                cursor: "pointer", marginRight: "12px",
                                color: "#0b2a5b", flexShrink: 0, width: "max-content"
                            }}>
                            <i className="bi bi-arrow-left" />
                        </button>
                        <div>
                            <h5 className="mb-0" style={{
                                color: "#0b2a5b", fontWeight: 700
                            }}>
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
                                ? "bi-check-circle"
                                : "bi-exclamation-circle"}`} />
                            {message}
                        </div>
                    )}

                    <div className="row g-3">

                        {/* ── Left — Form ── */}
                        <div className="col-lg-5">

                            {/* User Info Card */}
                            <div style={{
                                background: "white", borderRadius: "10px",
                                boxShadow: "0 1px 6px rgba(0,0,0,0.06)",
                                overflow: "hidden", marginBottom: "12px"
                            }}>
                                {cardHeader("bi-person-plus", "User Information")}
                                <div style={{ padding: "20px" }}>
                                    <div className="row g-3">

                                        {/* User Name */}
                                        <div className="col-md-5">
                                            <label style={labelStyle}>
                                                <i className="bi bi-person-badge me-1"
                                                    style={{ color: "#0b2a5b" }} />
                                                User Name
                                                <span style={{ color: "#dc2626" }}> *</span>
                                            </label>
                                            <input type="text"
                                                placeholder="Enter username"
                                                value={form.userName}
                                                onChange={e => setForm({
                                                    ...form, userName: e.target.value
                                                })}
                                                style={inputStyle(errors.userName)} />
                                            {errors.userName && (
                                                <small style={{
                                                    color: "#dc2626", fontSize: "11px"
                                                }}>
                                                    <i className="bi bi-exclamation-circle me-1" />
                                                    {errors.userName}
                                                </small>
                                            )}
                                        </div>

                                        {/* Full Name */}
                                        <div className="col-md-5">
                                            <label style={labelStyle}>
                                                <i className="bi bi-person me-1"
                                                    style={{ color: "#0b2a5b" }} />
                                                Full Name
                                                <span style={{ color: "#dc2626" }}> *</span>
                                            </label>
                                            <input type="text"
                                                placeholder="Enter full name"
                                                value={form.name}
                                                onChange={e => setForm({
                                                    ...form, name: e.target.value
                                                })}
                                                style={inputStyle(errors.name)} />
                                            {errors.name && (
                                                <small style={{
                                                    color: "#dc2626", fontSize: "11px"
                                                }}>
                                                    <i className="bi bi-exclamation-circle me-1" />
                                                    {errors.name}
                                                </small>
                                            )}
                                        </div>

                                        {/* Email */}
                                        <div className="col-md-5">
                                            <label style={labelStyle}>
                                                <i className="bi bi-envelope me-1"
                                                    style={{ color: "#0b2a5b" }} />
                                                Email Address
                                                <span style={{ color: "#dc2626" }}> *</span>
                                            </label>
                                            <input type="email"
                                                placeholder="Enter email address"
                                                value={form.emailId}
                                                onChange={e => setForm({
                                                    ...form, emailId: e.target.value
                                                })}
                                                style={inputStyle(errors.emailId)} />
                                            {errors.emailId && (
                                                <small style={{
                                                    color: "#dc2626", fontSize: "11px"
                                                }}>
                                                    <i className="bi bi-exclamation-circle me-1" />
                                                    {errors.emailId}
                                                </small>
                                            )}
                                        </div>

                                        {/* Mobile */}
                                        <div className="col-md-5">
                                            <label style={labelStyle}>
                                                <i className="bi bi-phone me-1"
                                                    style={{ color: "#0b2a5b" }} />
                                                Mobile Number
                                                <span style={{ color: "#dc2626" }}> *</span>
                                            </label>
                                            <input type="number"
                                                placeholder="Enter 10-digit mobile"
                                                value={form.mobileNo}
                                                onChange={e => setForm({
                                                    ...form, mobileNo: e.target.value
                                                })}
                                                style={inputStyle(errors.mobileNo)} />
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
                                                <span style={{ color: "#dc2626" }}> *</span>
                                            </label>
                                            <input type="text"
                                                placeholder="Enter company name"
                                                value={form.companyDetails}
                                                onChange={e => setForm({
                                                    ...form, companyDetails: e.target.value
                                                })}
                                                style={inputStyle(errors.companyDetails)} />
                                            {errors.companyDetails && (
                                                <small style={{
                                                    color: "#dc2626", fontSize: "11px"
                                                }}>
                                                    <i className="bi bi-exclamation-circle me-1" />
                                                    {errors.companyDetails}
                                                </small>
                                            )}
                                        </div>

                                        {/* User Type */}
                                        <div className="col-md-5">
                                            <label style={labelStyle}>
                                                <i className="bi bi-shield me-1"
                                                    style={{ color: "#0b2a5b" }} />
                                                User Type
                                            </label>
                                            <div style={{
                                                background: "#f9fafb",
                                                border: "1.5px solid #e5e7eb",
                                                borderRadius: "7px",
                                                padding: "7px 12px",
                                                display: "flex",
                                                alignItems: "center", gap: "8px"
                                            }}>
                                                <span style={{
                                                    background: "#fef3c7",
                                                    color: "#92400e",
                                                    padding: "1px 8px",
                                                    borderRadius: "20px",
                                                    fontSize: "11px", fontWeight: 600
                                                }}>
                                                    External
                                                </span>
                                                <small style={{
                                                    color: "#6b7280", fontSize: "11px"
                                                }}>
                                                    Only external users created manually
                                                </small>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* ── Authority Details Table ── */}


                            {/* Buttons */}
                            <div className="d-flex justify-content-end gap-2">
                                <button
                                    onClick={() => navigate("/dashboard-admin")}
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
                                        display: "flex",
                                        alignItems: "center", gap: "6px"
                                    }}>
                                    {loading
                                        ? <><span className="spinner-border
                                                spinner-border-sm" /> Saving...</>
                                        : <><i className="bi bi-check-circle" />
                                            Save User</>
                                    }
                                </button>
                            </div>

                        </div>

                        {/* ── Right — Guidelines ── */}
                        <div className="col-lg-4">
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
                                        Select reporting authorities for each level.
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
                                                                borderBottom: "1px solid #e5e7eb"
                                                            }}>
                                                                {h}
                                                            </th>
                                                        ))}
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {levelRows.map((lvl, i) => {
                                                        // Filter authorities
                                                        // for this level
                                                        const lvlAuthorities =
                                                            authorities.filter(
                                                                a => a.levelNo ===
                                                                    String(lvl)
                                                            );
                                                        const roleName =
                                                            lvlAuthorities[0]?.roleName
                                                            || `Level ${lvl}`;

                                                        // Skip if no
                                                        // authorities for level
                                                        if (authorities.length > 0
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
                                                                                    value={a.approverCode}>
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


                        </div>
                        <div className="col-lg-2">
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
                                        color: "white", fontWeight: 600,
                                        fontSize: "14px"
                                    }}>
                                        <i className="bi bi-info-circle me-2" />
                                        Guidelines
                                    </span>
                                </div>
                                <div style={{ padding: "16px" }}>
                                    {guidelines.map((item, i) => (
                                        <div key={i} style={{
                                            display: "flex", gap: "10px",
                                            marginBottom: i < guidelines.length - 1
                                                ? "14px" : "0",
                                            alignItems: "flex-start"
                                        }}>
                                            <div style={{
                                                background: `${item.color}15`,
                                                borderRadius: "6px",
                                                padding: "5px 7px", flexShrink: 0
                                            }}>
                                                <i className={`bi ${item.icon}`}
                                                    style={{
                                                        color: item.color,
                                                        fontSize: "13px"
                                                    }} />
                                            </div>
                                            <small style={{
                                                color: "#4b5563", lineHeight: "1.5",
                                                fontSize: "12px"
                                            }}>
                                                {item.text}
                                            </small>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </main>

        </div>
    );
}