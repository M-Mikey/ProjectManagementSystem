import { useEffect, useState } from "react";
import { getUserProfile } from "../api/userApi";
import Topbar from "../components/Navbar/Topbar";
import Navbar from "../components/Navbar/Navbar";

export default function Profile() {
    const userId = sessionStorage.getItem("userId");
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError]     = useState("");

    useEffect(() => {
        if (!userId) return;
        getUserProfile(userId)
            .then(data => {
                setProfile(data);
                setLoading(false);
            })
            .catch(err => {
                setError(err.message);
                setLoading(false);
            });
    }, [userId]);

    const levelColors = [
        { bg: "#dbeafe", color: "#1e40af" },
        { bg: "#ede9fe", color: "#5b21b6" },
        { bg: "#d1fae5", color: "#065f46" },
        { bg: "#fef3c7", color: "#92400e" },
        { bg: "#fee2e2", color: "#991b1b" },
        { bg: "#f0fdf4", color: "#166534" },
    ];

    if (loading) return (
        <div className="app-container">
            <Topbar />
            <div className="main-layout d-flex">
                <Navbar />
                <main className="flex-grow-1 d-flex align-items-center
                    justify-content-center">
                    <div className="text-center">
                        <div className="spinner-border text-primary mb-3" />
                        <div style={{ color: "#6b7280", fontSize: "14px" }}>
                            Loading profile...
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );

    if (error) return (
        <div className="app-container">
            <Topbar />
            <div className="main-layout d-flex">
                <Navbar />
                <main className="flex-grow-1 p-4">
                    <div style={{
                        padding: "16px", borderRadius: "8px",
                        background: "#fee2e2", color: "#991b1b",
                        border: "1px solid #fca5a5"
                    }}>
                        <i className="bi bi-exclamation-circle me-2" />
                        {error}
                    </div>
                </main>
            </div>
        </div>
    );

    const isInternal = profile?.userType === "Internal";
    const initials   = profile?.name
        ?.split(" ").map(w => w[0]).join("").toUpperCase() || "??";

    const orgFields = [
        { label: "Designation",    value: profile?.designation,
            icon: "bi-briefcase" },
        { label: "Company",        value: profile?.companyName,
            icon: "bi-building" },
        { label: "Section",        value: profile?.section,
            icon: "bi-diagram-2" },
        { label: "Department",     value: profile?.department,
            icon: "bi-grid" },
        { label: "Division",       value: profile?.division,
            icon: "bi-layers" },
        { label: "Operation Name", value: profile?.operationName,
            icon: "bi-gear" },
    ].filter(f => f.value);

    return (
        <div className="app-container">
            <Topbar />
            <div className="main-layout d-flex">
                <Navbar />
                <main className="flex-grow-1" style={{
                    background: "#f0f2f5", minHeight: "90vh"
                }}>
                    <div className="container-fluid p-4">

                        {/* ── Profile Header Card ── */}
                        <div style={{
                            background: "white", borderRadius: "12px",
                            boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
                            overflow: "hidden", marginBottom: "16px"
                        }}>
                            {/* Top Banner */}
                            <div style={{
                                background: "linear-gradient(135deg, #0b2a5b, #1e4d9b)",
                                padding: "24px 28px",
                                display: "flex", alignItems: "center", gap: "20px"
                            }}>
                                {/* Avatar */}
                                <div style={{
                                    width: "72px", height: "72px",
                                    background: "rgba(255,255,255,0.2)",
                                    borderRadius: "50%", border: "3px solid rgba(255,255,255,0.4)",
                                    display: "flex", alignItems: "center",
                                    justifyContent: "center",
                                    color: "white", fontSize: "26px", fontWeight: 700,
                                    flexShrink: 0
                                }}>
                                    {initials}
                                </div>

                                {/* Name + Info */}
                                <div className="flex-grow-1">
                                    <div className="d-flex align-items-center gap-2 mb-1">
                                        <h4 style={{
                                            color: "white", fontWeight: 700,
                                            marginBottom: 0, fontSize: "20px"
                                        }}>
                                            {profile?.name}
                                        </h4>
                                        <span style={{
                                            background: "rgba(255,255,255,0.2)",
                                            color: "white", padding: "1px 10px",
                                            borderRadius: "20px", fontSize: "12px",
                                            fontWeight: 600
                                        }}>
                                            {profile?.userName}
                                        </span>
                                    </div>
                                    <div className="d-flex align-items-center gap-2">
                                        <span style={{
                                            background: isInternal ? "#3b82f6" : "#f59e0b",
                                            color: "white", padding: "2px 10px",
                                            borderRadius: "20px", fontSize: "11px",
                                            fontWeight: 600
                                        }}>
                                            {profile?.userType}
                                        </span>
                                        <span style={{
                                            background: profile?.userRole === "Admin"
                                                ? "#7c3aed" : "rgba(255,255,255,0.2)",
                                            color: "white", padding: "2px 10px",
                                            borderRadius: "20px", fontSize: "11px",
                                            fontWeight: 600
                                        }}>
                                            <i className={`bi ${profile?.userRole === "Admin"
                                                ? "bi-shield-check" : "bi-person"} me-1`} />
                                            {profile?.userRole}
                                        </span>
                                        <span style={{
                                            background: profile?.isActive === "Y"
                                                ? "#10b981" : "#ef4444",
                                            color: "white", padding: "2px 10px",
                                            borderRadius: "20px", fontSize: "11px",
                                            fontWeight: 600
                                        }}>
                                            {profile?.isActive === "Y" ? "Active" : "Inactive"}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Contact Info Strip */}
                            <div style={{
                                padding: "14px 28px",
                                background: "#f8fafc",
                                borderBottom: "1px solid #e5e7eb",
                                display: "flex", gap: "24px", flexWrap: "wrap"
                            }}>
                                <span style={{ fontSize: "13px", color: "#374151" }}>
                                    <i className="bi bi-envelope me-2"
                                        style={{ color: "#0b2a5b" }} />
                                    {profile?.emailId || "—"}
                                </span>
                                <span style={{ fontSize: "13px", color: "#374151" }}>
                                    <i className="bi bi-phone me-2"
                                        style={{ color: "#0b2a5b" }} />
                                    {profile?.mobileNumber || "—"}
                                </span>
                                {!isInternal && (
                                    <span style={{ fontSize: "13px", color: "#374151" }}>
                                        <i className="bi bi-building me-2"
                                            style={{ color: "#0b2a5b" }} />
                                        {profile?.companyDetails || "—"}
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="row g-3">

                            {/* ── Left — Org Details (Internal only) ── */}
                            {isInternal && (
                                <div className="col-lg-5">
                                    <div style={{
                                        background: "white", borderRadius: "12px",
                                        boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
                                        overflow: "hidden", height: "100%"
                                    }}>
                                        <div style={{
                                            background: "#0b2a5b", padding: "14px 20px",
                                            display: "flex", alignItems: "center", gap: "8px"
                                        }}>
                                            <div style={{
                                                background: "rgba(255,255,255,0.15)",
                                                borderRadius: "6px", padding: "4px 8px"
                                            }}>
                                                <i className="bi bi-building text-white"
                                                    style={{ fontSize: "13px" }} />
                                            </div>
                                            <span style={{
                                                color: "white", fontWeight: 600,
                                                fontSize: "14px"
                                            }}>
                                                Organisation Details
                                            </span>
                                        </div>
                                        <div style={{ padding: "20px" }}>
                                            {orgFields.length > 0 ? (
                                                orgFields.map((f, i) => (
                                                    <div key={i} style={{
                                                        display: "flex",
                                                        justifyContent: "space-between",
                                                        alignItems: "center",
                                                        padding: "10px 0",
                                                        borderBottom: i < orgFields.length - 1
                                                            ? "1px solid #f3f4f6" : "none"
                                                    }}>
                                                        <span style={{
                                                            fontSize: "12px", color: "#6b7280",
                                                            display: "flex",
                                                            alignItems: "center", gap: "6px"
                                                        }}>
                                                            <i className={`bi ${f.icon}`}
                                                                style={{ color: "#0b2a5b" }} />
                                                            {f.label}
                                                        </span>
                                                        <span style={{
                                                            fontSize: "13px", fontWeight: 600,
                                                            color: "#111827"
                                                        }}>
                                                            {f.value}
                                                        </span>
                                                    </div>
                                                ))
                                            ) : (
                                                <div style={{
                                                    textAlign: "center", padding: "20px",
                                                    color: "#9ca3af", fontSize: "13px"
                                                }}>
                                                    <i className="bi bi-building"
                                                        style={{ fontSize: "24px",
                                                            display: "block",
                                                            marginBottom: "8px" }} />
                                                    No organisation details available
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ── Right — Reporting Authorities ── */}
                            <div className={isInternal ? "col-lg-7" : "col-12"}>
                                <div style={{
                                    background: "white", borderRadius: "12px",
                                    boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
                                    overflow: "hidden"
                                }}>
                                    <div style={{
                                        background: "#0b2a5b", padding: "14px 20px",
                                        display: "flex", alignItems: "center", gap: "8px"
                                    }}>
                                        <div style={{
                                            background: "rgba(255,255,255,0.15)",
                                            borderRadius: "6px", padding: "4px 8px"
                                        }}>
                                            <i className="bi bi-diagram-3 text-white"
                                                style={{ fontSize: "13px" }} />
                                        </div>
                                        <span style={{
                                            color: "white", fontWeight: 600, fontSize: "14px"
                                        }}>
                                            Approval Authorities
                                        </span>
                                        {profile?.authorities?.length > 0 && (
                                            <span style={{
                                                marginLeft: "auto",
                                                background: "rgba(255,255,255,0.2)",
                                                color: "white", padding: "1px 10px",
                                                borderRadius: "20px", fontSize: "11px",
                                                fontWeight: 600
                                            }}>
                                                {profile.authorities.length} Level
                                                {profile.authorities.length > 1 ? "s" : ""}
                                            </span>
                                        )}
                                    </div>
                                    <div style={{ padding: "20px" }}>
                                        {profile?.authorities?.length > 0 ? (
                                            profile.authorities.map((a, i) => {
                                                const c = levelColors[i % levelColors.length];
                                                return (
                                                    <div key={i} style={{
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: "14px",
                                                        padding: "12px 16px",
                                                        borderRadius: "8px",
                                                        marginBottom: "8px",
                                                        background: i % 2 === 0
                                                            ? "#f9fafb" : "white",
                                                        border: "1px solid #f3f4f6"
                                                    }}>
                                                        {/* Level Badge */}
                                                        <div style={{
                                                            background: c.bg, color: c.color,
                                                            borderRadius: "6px",
                                                            padding: "4px 10px",
                                                            fontSize: "11px", fontWeight: 700,
                                                            flexShrink: 0, minWidth: "65px",
                                                            textAlign: "center"
                                                        }}>
                                                            Level {a.levelNo}
                                                        </div>

                                                        {/* Role */}
                                                        <div style={{ flex: 1 }}>
                                                            <div style={{
                                                                fontSize: "13px", fontWeight: 600,
                                                                color: "#374151"
                                                            }}>
                                                                {a.roleName}
                                                            </div>
                                                            <div style={{
                                                                fontSize: "11px", color: "#6b7280"
                                                            }}>
                                                                Code: {a.approverCode}
                                                            </div>
                                                        </div>

                                                        {/* Approver */}
                                                        <div style={{
                                                            display: "flex",
                                                            alignItems: "center", gap: "10px"
                                                        }}>
                                                            <div style={{
                                                                width: "32px", height: "32px",
                                                                background: "#0b2a5b",
                                                                borderRadius: "50%",
                                                                display: "flex",
                                                                alignItems: "center",
                                                                justifyContent: "center",
                                                                color: "white", fontSize: "11px",
                                                                fontWeight: 700, flexShrink: 0
                                                            }}>
                                                                {a.approverName
                                                                    ?.substring(0, 2)
                                                                    .toUpperCase()}
                                                            </div>
                                                            <div style={{
                                                                fontSize: "13px", fontWeight: 600,
                                                                color: "#111827"
                                                            }}>
                                                                {a.approverName}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <div style={{
                                                textAlign: "center", padding: "30px",
                                                color: "#9ca3af"
                                            }}>
                                                <i className="bi bi-diagram-3"
                                                    style={{ fontSize: "28px",
                                                        display: "block",
                                                        marginBottom: "8px" }} />
                                                <div style={{ fontSize: "13px" }}>
                                                    No approval authorities found
                                                </div>
                                            </div>
                                        )}
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