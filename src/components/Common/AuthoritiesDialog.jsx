import { useState, useEffect } from "react";
import { getUserAuthorities, getExternalUserAuthorities } from "../../api/userApi";

/**
 * AUTHORITY_LEVELS mirrors the same constant in AddUser / EditUser so role
 * labels are consistent when displaying external user authority names.
 */
const AUTHORITY_LEVELS = {
    1:  "Department Head",
    2:  "Division Head",
    3:  "Operating Head",
    4:  "Director",
    5:  "Senior Director",
    6:  "President & CEO",
    7:  "Level 7",
    8:  "Level 8",
    9:  "Level 9",
    10: "Level 10",
};

const LEVEL_COLORS = [
    { bg: "#dbeafe", color: "#1e40af" },
    { bg: "#ede9fe", color: "#5b21b6" },
    { bg: "#d1fae5", color: "#065f46" },
    { bg: "#fef3c7", color: "#92400e" },
    { bg: "#fee2e2", color: "#991b1b" },
    { bg: "#f3f4f6", color: "#374151" },
    { bg: "#fce7f3", color: "#9d174d" },
    { bg: "#ecfdf5", color: "#065f46" },
    { bg: "#fff7ed", color: "#9a3412" },
    { bg: "#f0fdf4", color: "#14532d" },
];

export default function AuthoritiesDialog({ user, onClose }) {
    const [authorities, setAuthorities] = useState([]);
    const [loading,     setLoading]     = useState(false);
    const [error,       setError]       = useState("");

    useEffect(() => {
        if (!user?.userName) return;

        setLoading(true);
        setError("");
        setAuthorities([]);

        const isExternal = user.userType === "External";

        const fetchFn = isExternal
            ? getExternalUserAuthorities(user.userName)
            : getUserAuthorities(user.userName);

        fetchFn
            .then(data => {
                if (isExternal) {
                    // getExternalUserAuthorities returns
                    // [{ levelNo: "1", levelValue: "Vineet Srivastava" }, ...]
                    // Normalise to a consistent shape for rendering.
                    setAuthorities(
                        data.map(a => ({
                            levelNo:      a.levelNo,
                            roleName:     AUTHORITY_LEVELS[parseInt(a.levelNo, 10)]
                                          || `Level ${a.levelNo}`,
                            approverName: a.levelValue,
                            approverCode: null, // not applicable for external
                        }))
                    );
                } else {
                    // getUserAuthorities returns
                    // [{ levelNo, roleName, approverName, approverCode }, ...]
                    setAuthorities(data);
                }
            })
            .catch(err => setError(err.message))
            .finally(() => setLoading(false));
    }, [user]);

    if (!user) return null;

    const isExternal = user.userType === "External";

    return (
        <>
            {/* Backdrop */}
            <div
                onClick={onClose}
                style={{
                    position: "fixed", inset: 0,
                    background: "rgba(0,0,0,0.5)",
                    zIndex: 1000,
                    backdropFilter: "blur(2px)",
                }}
            />

            {/* Dialog */}
            <div style={{
                position: "fixed",
                top: "50%", left: "50%",
                transform: "translate(-50%, -50%)",
                background: "white",
                borderRadius: "12px",
                boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
                zIndex: 1001,
                width: "90%", maxWidth: "580px",
                maxHeight: "80vh",
                overflow: "hidden",
                display: "flex", flexDirection: "column",
            }}>

                {/* Header */}
                <div style={{
                    background: "#0b2a5b", padding: "16px 20px",
                    display: "flex", alignItems: "center",
                    justifyContent: "space-between",
                }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div style={{
                            background: "rgba(255,255,255,0.15)",
                            borderRadius: "6px", padding: "4px 8px",
                        }}>
                            <i className="bi bi-diagram-3 text-white"
                                style={{ fontSize: "14px" }} />
                        </div>
                        <div>
                            <div style={{ color: "white", fontWeight: 600, fontSize: "14px" }}>
                                Reporting Authorities
                            </div>
                            <div style={{ color: "rgba(255,255,255,0.7)", fontSize: "11px" }}>
                                {user.name} ({user.userName})
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} style={{
                        background: "rgba(255,255,255,0.15)",
                        border: "none", borderRadius: "6px",
                        color: "white", cursor: "pointer",
                        padding: "4px 8px", fontSize: "16px",
                    }}>
                        <i className="bi bi-x" />
                    </button>
                </div>

                {/* User info strip */}
                <div style={{
                    padding: "12px 20px", background: "#f8fafc",
                    borderBottom: "1px solid #e5e7eb",
                    display: "flex", alignItems: "center", gap: "12px",
                }}>
                    <div style={{
                        width: "36px", height: "36px",
                        background: "#0b2a5b", borderRadius: "50%",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: "white", fontSize: "13px", fontWeight: 700, flexShrink: 0,
                    }}>
                        {user.name?.substring(0, 2).toUpperCase() || "??"}
                    </div>
                    <div>
                        <div style={{ fontWeight: 600, fontSize: "13px", color: "#111827" }}>
                            {user.name}
                        </div>
                        <div style={{ fontSize: "11px", color: "#6b7280" }}>
                            <span style={{
                                background: isExternal ? "#fef3c7" : "#dbeafe",
                                color:      isExternal ? "#92400e" : "#1e40af",
                                padding: "1px 8px", borderRadius: "20px",
                                fontSize: "10px", fontWeight: 600, marginRight: "6px",
                            }}>
                                {user.userType}
                            </span>
                            {user.emailId}
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div style={{ padding: "16px 20px", overflowY: "auto", flex: 1 }}>
                    {loading ? (
                        <div style={{
                            textAlign: "center", padding: "30px", color: "#6b7280",
                        }}>
                            <div className="spinner-border spinner-border-sm text-primary mb-2" />
                            <div style={{ fontSize: "13px" }}>Loading authorities...</div>
                        </div>

                    ) : error ? (
                        <div style={{
                            padding: "12px", borderRadius: "8px",
                            background: "#fee2e2", color: "#991b1b",
                            fontSize: "13px", textAlign: "center",
                        }}>
                            <i className="bi bi-exclamation-circle me-2" />
                            {error}
                        </div>

                    ) : authorities.length > 0 ? (
                        <div>
                            <div style={{
                                fontSize: "11px", fontWeight: 600,
                                color: "#6b7280", marginBottom: "12px",
                                textTransform: "uppercase", letterSpacing: "0.5px",
                            }}>
                                {authorities.length} Approval Level
                                {authorities.length > 1 ? "s" : ""}
                            </div>

                            {authorities.map((a, i) => {
                                const colors = LEVEL_COLORS[i % LEVEL_COLORS.length];
                                const initials = a.approverName
                                    ?.substring(0, 2).toUpperCase() || "—";

                                return (
                                    <div key={i} style={{
                                        display: "flex", alignItems: "center",
                                        gap: "12px", padding: "10px 14px",
                                        borderRadius: "8px", marginBottom: "8px",
                                        background: i % 2 === 0 ? "#f9fafb" : "white",
                                        border: "1px solid #f3f4f6",
                                    }}>
                                        {/* Level badge */}
                                        <div style={{
                                            background: colors.bg, color: colors.color,
                                            borderRadius: "6px", padding: "4px 10px",
                                            fontSize: "11px", fontWeight: 700,
                                            flexShrink: 0, minWidth: "60px",
                                            textAlign: "center",
                                        }}>
                                            Level {a.levelNo}
                                        </div>

                                        {/* Role */}
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{
                                                fontSize: "12px", fontWeight: 600,
                                                color: "#374151",
                                            }}>
                                                {a.roleName}
                                            </div>
                                            {/* Show approver code for internal; hide for external */}
                                            {!isExternal && a.approverCode && (
                                                <div style={{ fontSize: "11px", color: "#6b7280" }}>
                                                    Code: {a.approverCode}
                                                </div>
                                            )}
                                        </div>

                                        {/* Approver name + avatar */}
                                        <div style={{
                                            display: "flex", alignItems: "center", gap: "8px",
                                        }}>
                                            <div style={{
                                                width: "28px", height: "28px",
                                                background: "#0b2a5b", borderRadius: "50%",
                                                display: "flex", alignItems: "center",
                                                justifyContent: "center",
                                                color: "white", fontSize: "10px",
                                                fontWeight: 700, flexShrink: 0,
                                            }}>
                                                {initials}
                                            </div>
                                            <div style={{
                                                fontSize: "12px", fontWeight: 600,
                                                color: "#111827",
                                            }}>
                                                {a.approverName || "—"}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                    ) : (
                        <div style={{
                            textAlign: "center", padding: "30px", color: "#9ca3af",
                        }}>
                            <i className="bi bi-diagram-3" style={{
                                fontSize: "28px", display: "block", marginBottom: "8px",
                            }} />
                            <div style={{ fontSize: "13px" }}>
                                No reporting authorities configured
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div style={{
                    padding: "12px 20px", borderTop: "1px solid #f3f4f6",
                    display: "flex", justifyContent: "flex-end",
                }}>
                    <button onClick={onClose} style={{
                        background: "#0b2a5b", color: "white",
                        border: "none", borderRadius: "7px",
                        padding: "7px 20px", fontWeight: 600,
                        fontSize: "13px", cursor: "pointer",
                    }}>
                        Close
                    </button>
                </div>
            </div>
        </>
    );
}