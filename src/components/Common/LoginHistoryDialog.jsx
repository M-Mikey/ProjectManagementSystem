import { useState, useEffect } from "react";
import { getLoginHistory } from "../../api/userApi";

export default function LoginHistoryDialog({ user, onClose }) {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error,   setError]   = useState("");

    useEffect(() => {
        if (!user?.userName) return;
        setLoading(true);
        getLoginHistory(user.userName)
            .then(data => {
                setHistory(data);
                setLoading(false);
            })
            .catch(err => {
                setError(err.message);
                setLoading(false);
            });
    }, [user]);

    if (!user) return null;

    return (
        <>
            {/* Backdrop */}
            <div onClick={onClose} style={{
                position: "fixed", inset: 0,
                background: "rgba(0,0,0,0.5)",
                zIndex: 1000, backdropFilter: "blur(2px)"
            }} />

            {/* Dialog */}
            <div style={{
                position: "fixed",
                top: "50%", left: "50%",
                transform: "translate(-50%, -50%)",
                background: "white", borderRadius: "12px",
                boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
                zIndex: 1001, width: "90%", maxWidth: "600px",
                maxHeight: "80vh", overflow: "hidden",
                display: "flex", flexDirection: "column"
            }}>
                {/* Header */}
                <div style={{
                    background: "#0b2a5b", padding: "16px 20px",
                    display: "flex", alignItems: "center",
                    justifyContent: "space-between"
                }}>
                    <div style={{
                        display: "flex", alignItems: "center", gap: "10px"
                    }}>
                        <div style={{
                            background: "rgba(255,255,255,0.15)",
                            borderRadius: "6px", padding: "4px 8px"
                        }}>
                            <i className="bi bi-clock-history text-white"
                                style={{ fontSize: "14px" }} />
                        </div>
                        <div>
                            <div style={{
                                color: "white", fontWeight: 600, fontSize: "14px"
                            }}>
                                Login History
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
                        padding: "4px 8px", fontSize: "16px",width:"max-content"
                    }}>
                        <i className="bi bi-x" />
                    </button>
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
                                Loading history...
                            </div>
                        </div>
                    ) : error ? (
                        <div style={{
                            padding: "12px", borderRadius: "8px",
                            background: "#fee2e2", color: "#991b1b",
                            fontSize: "13px"
                        }}>
                            <i className="bi bi-exclamation-circle me-2" />
                            {error}
                        </div>
                    ) : history.length > 0 ? (
                        <div className="table-responsive">
                            <table className="table mb-0"
                                style={{ fontSize: "13px" }}>
                                <thead>
                                    <tr style={{ background: "#f8fafc" }}>
                                        {["#", "User", "Login Time"].map(h => (
                                            <th key={h} style={{
                                                padding: "8px 12px",
                                                fontSize: "11px", fontWeight: 600,
                                                color: "#f1f4f7",
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
                                    {history.map((h, i) => (
                                        <tr key={h.loginHstId} style={{
                                            background: i % 2 === 0
                                                ? "white" : "#f9fafb"
                                        }}>
                                            <td style={{
                                                padding: "8px 12px",
                                                border: "none",
                                                borderBottom: "1px solid #f3f4f6",
                                                color: "#6b7280", fontSize: "12px"
                                            }}>
                                                {i + 1}
                                            </td>
                                            <td style={{
                                                padding: "8px 12px",
                                                border: "none",
                                                borderBottom: "1px solid #f3f4f6"
                                            }}>
                                                <div style={{
                                                    fontWeight: 600,
                                                    color: "#0b2a5b", fontSize: "13px"
                                                }}>
                                                    {h.name || h.userName}
                                                </div>
                                                <div style={{
                                                    color: "#6b7280", fontSize: "11px"
                                                }}>
                                                    {h.userName}
                                                </div>
                                            </td>
                                            <td style={{
                                                padding: "8px 12px",
                                                border: "none",
                                                borderBottom: "1px solid #f3f4f6"
                                            }}>
                                                <div style={{
                                                    display: "flex",
                                                    alignItems: "center", gap: "6px"
                                                }}>
                                                    <i className="bi bi-clock"
                                                        style={{ color: "#0b2a5b",
                                                            fontSize: "11px" }} />
                                                    <span style={{ fontSize: "13px" }}>
                                                        {h.createdOn}
                                                    </span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div style={{
                            textAlign: "center", padding: "30px",
                            color: "#9ca3af"
                        }}>
                            <i className="bi bi-clock-history" style={{
                                fontSize: "28px", display: "block",
                                marginBottom: "8px"
                            }} />
                            <div style={{ fontSize: "13px" }}>
                                No login history found
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