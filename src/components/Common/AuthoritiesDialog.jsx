import { useState, useEffect } from "react";
import { getUserAuthorities } from "../../api/userApi";

export default function AuthoritiesDialog({ user, onClose }) {
    const [authorities, setAuthorities] = useState([]);
    const [loading, setLoading]         = useState(false);
    const [error, setError]             = useState("");

    useEffect(() => {
        if (!user?.userName) return;
        setLoading(true);
        getUserAuthorities(user.userName)
            .then(data => {
                setAuthorities(data);
                setLoading(false);
            })
            .catch(err => {
                setError(err.message);
                setLoading(false);
            });
    }, [user]);

    if (!user) return null;

    const levelColors = {
        "1": { bg: "#dbeafe", color: "#1e40af" },
        "2": { bg: "#ede9fe", color: "#5b21b6" },
        "3": { bg: "#d1fae5", color: "#065f46" },
        "4": { bg: "#fef3c7", color: "#92400e" },
        "5": { bg: "#fee2e2", color: "#991b1b" },
        "6": { bg: "#f3f4f6", color: "#374151" },
    };

    return (
        <>
            {/* Backdrop */}
            <div
                onClick={onClose}
                style={{
                    position: "fixed", inset: 0,
                    background: "rgba(0,0,0,0.5)",
                    zIndex: 1000,
                    backdropFilter: "blur(2px)"
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
                display: "flex", flexDirection: "column"
            }}>
                {/* Header */}
                <div style={{
                    background: "#0b2a5b",
                    padding: "16px 20px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between"
                }}>
                    <div style={{
                        display: "flex", alignItems: "center", gap: "10px"
                    }}>
                        <div style={{
                            background: "rgba(255,255,255,0.15)",
                            borderRadius: "6px", padding: "4px 8px"
                        }}>
                            <i className="bi bi-diagram-3 text-white"
                                style={{ fontSize: "14px" }} />
                        </div>
                        <div>
                            <div style={{
                                color: "white", fontWeight: 600, fontSize: "14px"
                            }}>
                                Reporting Authorities
                            </div>
                            <div style={{
                                color: "rgba(255,255,255,0.7)", fontSize: "11px"
                            }}>
                                {user.name} ({user.userName})
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} style={{
                        background: "rgba(255,255,255,0.15)",
                        border: "none", borderRadius: "6px",
                        color: "white", cursor: "pointer",
                        padding: "4px 8px", fontSize: "16px"
                    }}>
                        <i className="bi bi-x" />
                    </button>
                </div>

                {/* User Info Strip */}
                <div style={{
                    padding: "12px 20px",
                    background: "#f8fafc",
                    borderBottom: "1px solid #e5e7eb",
                    display: "flex", alignItems: "center", gap: "12px"
                }}>
                    <div style={{
                        width: "36px", height: "36px",
                        background: "#0b2a5b", borderRadius: "50%",
                        display: "flex", alignItems: "center",
                        justifyContent: "center",
                        color: "white", fontSize: "13px", fontWeight: 700,
                        flexShrink: 0
                    }}>
                        {user.name?.substring(0, 2).toUpperCase() || "??"}
                    </div>
                    <div>
                        <div style={{
                            fontWeight: 600, fontSize: "13px", color: "#111827"
                        }}>
                            {user.name}
                        </div>
                        <div style={{ fontSize: "11px", color: "#6b7280" }}>
                            <span style={{
                                background: user.userType === "Internal"
                                    ? "#dbeafe" : "#fef3c7",
                                color: user.userType === "Internal"
                                    ? "#1e40af" : "#92400e",
                                padding: "1px 8px", borderRadius: "20px",
                                fontSize: "10px", fontWeight: 600,
                                marginRight: "6px"
                            }}>
                                {user.userType}
                            </span>
                            {user.emailId}
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div style={{
                    padding: "16px 20px",
                    overflowY: "auto", flex: 1
                }}>
                    {loading ? (
                        <div style={{
                            textAlign: "center", padding: "30px",
                            color: "#6b7280"
                        }}>
                            <div className="spinner-border spinner-border-sm
                                text-primary mb-2" />
                            <div style={{ fontSize: "13px" }}>
                                Loading authorities...
                            </div>
                        </div>
                    ) : error ? (
                        <div style={{
                            padding: "12px", borderRadius: "8px",
                            background: "#fee2e2", color: "#991b1b",
                            fontSize: "13px", textAlign: "center"
                        }}>
                            <i className="bi bi-exclamation-circle me-2" />
                            {error}
                        </div>
                    ) : authorities.length > 0 ? (
                        <div>
                            <div style={{
                                fontSize: "11px", fontWeight: 600,
                                color: "#6b7280", marginBottom: "12px",
                                textTransform: "uppercase", letterSpacing: "0.5px"
                            }}>
                                {authorities.length} Approval Level{authorities.length > 1 ? "s" : ""}
                            </div>
                            {authorities.map((a, i) => {
                                const colors = levelColors[a.levelNo] ||
                                    { bg: "#f3f4f6", color: "#374151" };
                                return (
                                    <div key={i} style={{
                                        display: "flex", alignItems: "center",
                                        gap: "12px", padding: "10px 14px",
                                        borderRadius: "8px", marginBottom: "8px",
                                        background: i % 2 === 0 ? "#f9fafb" : "white",
                                        border: "1px solid #f3f4f6"
                                    }}>
                                        {/* Level Badge */}
                                        <div style={{
                                            background: colors.bg,
                                            color: colors.color,
                                            borderRadius: "6px",
                                            padding: "4px 10px",
                                            fontSize: "11px", fontWeight: 700,
                                            flexShrink: 0, minWidth: "60px",
                                            textAlign: "center"
                                        }}>
                                            Level {a.levelNo}
                                        </div>

                                        {/* Role */}
                                        <div style={{
                                            flex: 1, minWidth: 0
                                        }}>
                                            <div style={{
                                                fontSize: "12px", fontWeight: 600,
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
                                            display: "flex", alignItems: "center",
                                            gap: "8px"
                                        }}>
                                            <div style={{
                                                width: "28px", height: "28px",
                                                background: "#0b2a5b",
                                                borderRadius: "50%",
                                                display: "flex", alignItems: "center",
                                                justifyContent: "center",
                                                color: "white", fontSize: "10px",
                                                fontWeight: 700, flexShrink: 0
                                            }}>
                                                {a.approverName?.substring(0, 2).toUpperCase()}
                                            </div>
                                            <div style={{
                                                fontSize: "12px", fontWeight: 600,
                                                color: "#111827"
                                            }}>
                                                {a.approverName}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div style={{
                            textAlign: "center", padding: "30px",
                            color: "#9ca3af"
                        }}>
                            <i className="bi bi-diagram-3" style={{
                                fontSize: "28px", display: "block",
                                marginBottom: "8px"
                            }} />
                            <div style={{ fontSize: "13px" }}>
                                No reporting authorities found
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div style={{
                    padding: "12px 20px",
                    borderTop: "1px solid #f3f4f6",
                    display: "flex", justifyContent: "flex-end"
                }}>
                    <button onClick={onClose} style={{
                        background: "#0b2a5b", color: "white",
                        border: "none", borderRadius: "7px",
                        padding: "7px 20px", fontWeight: 600,
                        fontSize: "13px", cursor: "pointer"
                    }}>
                        Close
                    </button>
                </div>
            </div>
        </>
    );
}