import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import Topbar from '../components/Navbar/Topbar';
import Navbar from '../components/Navbar/Navbar';
import UserSearch from '../components/Common/UserSearch';
import "../styles/MilestonePage.css";

/* ─── Shared style tokens ─── */
const INP = {
    width: "100%", height: 36, border: "1px solid #c8d8ec", borderRadius: 6,
    padding: "0 10px", fontSize: 13, color: "#0f2044", background: "#fff",
    boxSizing: "border-box", outline: "none", fontFamily: "inherit"
};
const INP_RO = { ...INP, background: "#f4f7fc", color: "#3a4a6b" };
const TA = {
    width: "100%", height: 105, border: "1px solid #c8d8ec", borderRadius: 6,
    padding: "8px 10px", fontSize: 13, color: "#0f2044", background: "#fff",
    boxSizing: "border-box", resize: "vertical", outline: "none", fontFamily: "inherit"
};
const TA_RO = { ...TA, background: "#f4f7fc", color: "#3a4a6b", resize: "none" };
const ERR = { color: "#c0392b", fontSize: 11, marginTop: 3 };
const LABEL = { fontWeight: 700, fontSize: 13, color: "#0f2044", minWidth: 118, flexShrink: 0 };

// FIX 4: priority color map now keyed by numeric value to match numeric priority storage
const PRIORITY_LABEL = { "1": "Critical", "2": "High", "3": "Medium", "4": "Low" };
const PRIORITY_COLOR = { "1": "#7b241c", "2": "#c0392b", "3": "#d68910", "4": "#1a7a4a" };

// FIX 2: removed userid from EMPTY — it's set inside handleAdd from session, not from form
const EMPTY = { milestoneName: "", description: "", dueDate: "", priority: "", approvalLevel: "", assignedTo: "" };

// FIX 8: same dummy approval levels as AddProject — TODO: replace once client provides table
const DUMMY_APPROVAL_LEVELS = [
    { level: "1", approvalLevel: "Level 1", approvalName: "Department Head" },
    { level: "2", approvalLevel: "Level 2", approvalName: "Division Head" },
    { level: "3", approvalLevel: "Level 3", approvalName: "Operating Head" },
    { level: "4", approvalLevel: "Level 4", approvalName: "Director" },
    { level: "5", approvalLevel: "Level 5", approvalName: "Senior Director" },
];

const Row = ({ label, top, children }) => (
    <div style={{ display: "flex", alignItems: top ? "flex-start" : "center", gap: 12, marginBottom: 13 }}>
        <span style={{ ...LABEL, paddingTop: top ? 8 : 0 }}>{label}</span>
        <div style={{ flex: 1 }}>{children}</div>
    </div>
);

const formatDate = (s) => {
    if (!s) return "";
    return new Date(s).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "2-digit" }).replace(/ /g, "-");
};

const btn = (bg, color, extra = {}) => ({
    background: bg, color, border: "none", borderRadius: 7, cursor: "pointer",
    fontFamily: "inherit", fontWeight: 600, fontSize: 13, ...extra
});

/* ─── SVG Icons ─── */
const EditIcon = () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
);

const TrashIcon = () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 6 5 6 21 6"/>
        <path d="M19 6l-1 14H6L5 6"/>
        <path d="M10 11v6M14 11v6"/>
        <path d="M9 6V4h6v2"/>
    </svg>
);

/* ─── Confirm Modal ─── */
const ConfirmModal = ({ modal, onConfirm, onCancel }) => {
    if (!modal.open) return null;

    const isDelete = modal.type === "delete";

    const overlay = {
        position: "fixed", inset: 0,
        background: "rgba(10, 20, 50, 0.45)",
        backdropFilter: "blur(2px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 9999,
        animation: "fadeIn 0.15s ease"
    };
    const box = {
        background: "#fff",
        borderRadius: 12,
        padding: "28px 32px",
        width: 380,
        boxShadow: "0 8px 40px rgba(10,20,50,0.18)",
        display: "flex", flexDirection: "column", gap: 6,
        animation: "popIn 0.18s ease"
    };
    const iconWrap = {
        width: 44, height: 44, borderRadius: "50%",
        background: isDelete ? "#fdf0f0" : "#eef2f9",
        display: "flex", alignItems: "center", justifyContent: "center",
        marginBottom: 4
    };

    return (
        <>
            <style>{`
                @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
                @keyframes popIn  { from { opacity: 0; transform: scale(0.94) translateY(6px) } to { opacity: 1; transform: scale(1) translateY(0) } }
            `}</style>
            <div style={overlay} onClick={onCancel}>
                <div style={box} onClick={e => e.stopPropagation()}>

                    <div style={iconWrap}>
                        {isDelete ? (
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                                stroke="#c0392b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="3 6 5 6 21 6"/>
                                <path d="M19 6l-1 14H6L5 6"/>
                                <path d="M10 11v6M14 11v6"/>
                                <path d="M9 6V4h6v2"/>
                            </svg>
                        ) : (
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                                stroke="#1e3a6e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                        )}
                    </div>

                    <div style={{ fontWeight: 700, fontSize: 16, color: "#0f2044", marginBottom: 2 }}>
                        {isDelete ? "Delete Milestone" : "Edit Milestone"}
                    </div>

                    <div style={{ fontSize: 13, color: "#4a5a7a", lineHeight: 1.55, marginBottom: 18 }}>
                        {isDelete
                            ? <>Are you sure you want to delete <strong style={{ color: "#0f2044" }}>"{modal.target?.milestoneName}"</strong>? This action cannot be undone.</>
                            : <>You're about to edit <strong style={{ color: "#0f2044" }}>"{modal.target?.milestoneName}"</strong>. Any unsaved changes in the current form will be replaced.</>
                        }
                    </div>

                    <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                        <button
                            onClick={onCancel}
                            style={{
                                ...btn("transparent", "#1e3a6e"),
                                border: "1.5px solid #c8d8ec",
                                padding: "8px 20px",
                                fontSize: 13,
                                borderRadius: 7,
                                width: "auto"
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onConfirm}
                            style={{
                                ...btn(isDelete ? "#c0392b" : "#1e3a6e", "#fff"),
                                padding: "8px 22px",
                                fontSize: 13,
                                borderRadius: 7,
                                width: "auto"
                            }}
                        >
                            {isDelete ? "Delete" : "Edit"}
                        </button>
                    </div>

                </div>
            </div>
        </>
    );
};

export default function MilestonePage() {
    const navigate = useNavigate();

    const [show, setShow]                 = useState(false);
    const [form, setForm]                 = useState(EMPTY);
    const [errors, setErrors]             = useState({});
    const [editId, setEditId]             = useState(null);
    const [selectedUser, setSelectedUser] = useState(null);
    const [milestones, setMilestones]     = useState([]);
    const [gridError, setGridError]       = useState("");
    const [project, setProject]           = useState({ name: "", purpose: "", timeline: "", approvalLevel: "" });
    // FIX 1: load approvalLevels from the approvalUser stored in session, not from parsed.approvalLevels
    // FIX 8: start with dummy data so dropdown works immediately for testing
    const [approvalLevels, setApprovalLevels] = useState(DUMMY_APPROVAL_LEVELS);
    const [expandedId, setExpandedId]     = useState(null);

    /* ─── Confirm modal state ─── */
    const [confirmModal, setConfirmModal] = useState({ open: false, type: null, target: null });

    const toggleExpand = (id) => {
        setExpandedId(prev => prev === id ? null : id);
    };

    /* ─── Load project + milestones from session on mount ─── */
    useEffect(() => {
        const data = sessionStorage.getItem("projectForm");
        if (data) {
            const parsed = JSON.parse(data);
            setProject(parsed);
            // FIX 1: approvalLevels live inside parsed.approvalUser or parsed.data,
            // not directly on parsed. Use dummy as reliable fallback for now.
            // TODO: replace with real API-loaded levels once client provides structure
            if (parsed.approvalLevels?.length > 0) {
                setApprovalLevels(parsed.approvalLevels);
            }
            // else stays as DUMMY_APPROVAL_LEVELS from initial state

            // ✅ AUTO-SET approval level from project when creating new milestone
            if (parsed.approvalLevel) {
                setForm(prev => ({ ...prev, approvalLevel: parsed.approvalLevel }));
            }
        }
        const saved = sessionStorage.getItem("milestones");
        if (saved) {
            setMilestones(JSON.parse(saved).map(m => ({ ...m, assignedUser: m.assignedUser || null })));
        }
    }, []);

    /* ─── Sync show state to session ─── */
    useEffect(() => {
        sessionStorage.setItem("showMilestoneForm", show);
    }, [show]);

    const projectTimeline = project?.timeline || "";
    const today = new Date().toISOString().split("T")[0];

    const reset = () => { 
        setForm({ 
            ...EMPTY, 
            approvalLevel: project.approvalLevel || "" // ✅ Keep project approval level on reset
        }); 
        setSelectedUser(null); 
        setEditId(null); 
        setErrors({}); 
    };

    const validate = () => {
        const e = {};
        
        // ✅ 1. Milestone Name Validation
        if (!form.milestoneName.trim()) {
            e.milestoneName = "Milestone Name is required";
        } else if (form.milestoneName.trim().length < 3) {
            e.milestoneName = "Milestone name must be at least 3 characters";
        } else if (form.milestoneName.length > 100) {
            e.milestoneName = "Milestone name cannot exceed 100 characters";
        }

        // ✅ 2. Duplicate milestone name check
        const isDuplicate = milestones.some(
            m => m.milestoneName.trim().toLowerCase() === form.milestoneName.trim().toLowerCase()
                && m.id !== editId  // exclude current item when editing
        );
        if (isDuplicate) e.milestoneName = "A milestone with this name already exists";

        // ✅ 3. Description Validation
        if (!form.description.trim()) {
            e.description = "Description is required";
        } else if (form.description.trim().length < 10) {
            e.description = "Description must be at least 10 characters";
        } else if (form.description.length > 500) {
            e.description = "Description cannot exceed 500 characters";
        }

        // ✅ 4. Due Date Validation
        if (!form.dueDate) {
            e.dueDate = "Due Date is required";
        } else if (form.dueDate < today) {
            e.dueDate = "Due date cannot be in the past";
        } else if (form.dueDate === today) {
            e.dueDate = "Due date must be at least one day in the future";
        } else if (projectTimeline && form.dueDate > projectTimeline) {
            e.dueDate = `Due date cannot exceed project target date (${formatDate(projectTimeline)})`;
        } else {
            // ✅ 4.1. Sequential Milestone Date Validation
            // When creating new milestone: check against the last milestone's date
            // When editing: check against previous milestones (excluding current one)
            
            const milestonesToCheck = editId !== null
                ? milestones.filter(m => m.id !== editId) // Exclude current milestone when editing
                : milestones; // Check all milestones when creating new

            if (milestonesToCheck.length > 0) {
                // Get the last (most recent) milestone's due date
                const lastMilestone = milestonesToCheck[milestonesToCheck.length - 1];
                
                if (form.dueDate < lastMilestone.dueDate) {
                    e.dueDate = `Due date cannot be before the previous milestone's due date (${formatDate(lastMilestone.dueDate)})`;
                }
            }
        }

        // ✅ 5. Priority Validation
        if (!form.priority) {
            e.priority = "Priority is required";
        } else if (!["1", "2", "3", "4"].includes(form.priority)) {
            e.priority = "Invalid priority selected";
        }

        // ✅ 6. Approval Level Validation
        if (!form.approvalLevel) {
            e.approvalLevel = "Approval Level is required";
        } else if (form.approvalLevel !== project.approvalLevel) {
            e.approvalLevel = "Milestone approval level must match project approval level";
        }

        // ✅ 7. Assigned User Validation
        if (!form.assignedTo) {
            e.assignedTo = "Assigned To is required";
        } else if (!selectedUser || !selectedUser.userName) {
            e.assignedTo = "Invalid user selection";
        }

        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(p => ({ ...p, [name]: value }));
        setErrors(p => ({ ...p, [name]: "" }));
    };

    const handleUserSelect = (user) => {
        setSelectedUser(user);
        setForm(p => ({ ...p, assignedTo: user ? user.userName : "", assignedName: user ? user.name : "" }));
        setErrors(p => ({ ...p, assignedTo: "" }));
    };

    const handleAdd = () => {
        if (!validate()) return;
        const userId = sessionStorage.getItem("userId");
        // FIX 2: userid set here from session, not from form (removed from EMPTY)
        const entry = { ...form, assignedUser: selectedUser, userid: userId };
        const list = editId !== null
            ? milestones.map(m => m.id === editId ? { ...entry, id: m.id } : m)
            : [...milestones, { id: uuidv4(), ...entry }];
        setMilestones(list);
        sessionStorage.setItem("milestones", JSON.stringify(list));
        reset();
        setShow(false);
    };

    /* ─── Edit: show confirm modal first ─── */
    const handleEditClick = (m) => {
        setConfirmModal({ open: true, type: "edit", target: m });
    };

    const confirmEdit = () => {
        const m = confirmModal.target;
        setForm({
            milestoneName: m.milestoneName,
            description:   m.description,
            dueDate:       m.dueDate,
            priority:      m.priority,       // FIX 4: now stored as numeric string "1"–"4"
            approvalLevel: m.approvalLevel || project.approvalLevel || "", // ✅ Use project approval level as fallback
            assignedTo:    m.assignedTo,
            // FIX 2: no userid in form
        });
        setSelectedUser(m.assignedUser || null);
        setEditId(m.id);
        setShow(true);
        setExpandedId(null);
        setConfirmModal({ open: false, type: null, target: null });
    };

    /* ─── Delete: show confirm modal first ─── */
    const handleDeleteClick = (m) => {
        setConfirmModal({ open: true, type: "delete", target: m });
    };

    const confirmDelete = () => {
        const id = confirmModal.target?.id;
        const list = milestones.filter(m => m.id !== id);
        setMilestones(list);
        sessionStorage.setItem("milestones", JSON.stringify(list));
        setConfirmModal({ open: false, type: null, target: null });
    };

    const closeModal = () => setConfirmModal({ open: false, type: null, target: null });

    const handleNext = () => {
        if (milestones.length === 0) {
            setGridError("Please add at least one milestone before proceeding.");
            return;
        }
        setGridError("");
        navigate("/projectFinalPage");
    };

    const card = {
        background: "#fff", border: "1px solid #c8d8ec", borderRadius: 10,
        padding: "16px 20px", marginBottom: 12
    };
    const colL = { flex: "0 0 52%", paddingRight: 24, borderRight: "1px solid #e8eff8", display: "flex", flexDirection: "column" };
    const colR = { flex: "0 0 48%", paddingLeft: 24, display: "flex", flexDirection: "column" };

    // FIX 3: removed unused hoverBg, hoverColor params from iconBtn
    const iconBtn = () => ({
        background: "#fff",
        border: "1px solid #c8d8ec",
        borderRadius: 6,
        padding: "5px 8px",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#6b7fa3",
        position: "relative",
        transition: "all 0.15s",
    });

    // ✅ Get the approval level label for display
    const getApprovalLevelLabel = (level) => {
        const approvalLevel = approvalLevels.find(lv => lv.level === level);
        return approvalLevel 
            ? `${approvalLevel.approvalLevel} - ${approvalLevel.approvalName}` 
            : level;
    };

    return (
        <div className="app-container">
            <Topbar />
            <div className="main-layout">
                <Navbar />

                {/* ─── Confirm Modal ─── */}
                <ConfirmModal
                    modal={confirmModal}
                    onConfirm={confirmModal.type === "delete" ? confirmDelete : confirmEdit}
                    onCancel={closeModal}
                />

                {/* ── Outer flex column — full height ── */}
                <div className="page-container" style={{
                    background: "#eef2f9",
                    padding: "0",
                    overflowY: "auto",
                    display: "flex",
                    flexDirection: "column",
                    height: "100%",
                    overflow: "hidden"
                }}>

                    {/* ── Scrollable content area ── */}
                    <div style={{ flex: 1, padding: "28px 36px 0 36px", overflowY: "auto" }}>

                        {/* Header */}
                        <div style={{ marginBottom: 22 }}>
                            <h2 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: "#0f2044" }}>
                                {project.name}
                            </h2>
                            {project.purpose && (
                                <p style={{ margin: "4px 0 0", fontSize: 13, color: "#6b7fa3" }}>
                                    {project.purpose}
                                </p>
                            )}
                        </div>

                        {/* Create Milestone button */}
                        <div style={{ marginBottom: 20 }}>
                            <button
                                onClick={() => { reset(); setShow(true); }}
                                style={btn("#1e3a6e", "#fff", { padding: "10px 22px", fontSize: 14, borderRadius: 8, width: "auto" })}
                            >
                                + Create Milestone
                            </button>
                        </div>

                        {/* ── Form Card ── */}
                        {show && (
                            <div style={card}>
                                <div style={{ display: "flex" }}>

                                    {/* LEFT */}
                                    <div style={colL}>
                                        <Row label="Milestone Name:">
                                            <input
                                                name="milestoneName"
                                                value={form.milestoneName}
                                                onChange={handleChange}
                                                style={INP}
                                                maxLength={100}
                                                placeholder="Enter milestone name"
                                            />
                                            {errors.milestoneName && <div style={ERR}>{errors.milestoneName}</div>}
                                        </Row>
                                        <Row label="Description:" top>
                                            <textarea
                                                name="description"
                                                value={form.description}
                                                onChange={handleChange}
                                                style={TA}
                                                maxLength={500}
                                                placeholder="Enter description"
                                            />
                                            <div style={{ fontSize: 11, color: "#6b7fa3", marginTop: 4 }}>
                                                {form.description.length}/500 characters
                                            </div>
                                            {errors.description && <div style={ERR}>{errors.description}</div>}
                                        </Row>
                                        <div style={{ marginTop: "auto", paddingTop: 10, display: "flex", justifyContent: "flex-end" }}>
                                            <button
                                                onClick={() => { reset(); setShow(false); }}
                                                style={btn("#c0392b", "#fff", { padding: "7px 16px", display: "flex", alignItems: "center", gap: 6, width: "auto" })}
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>

                                    {/* RIGHT */}
                                    <div style={colR}>
                                        <Row label="Due Date:">
                                            <input
                                                type="date"
                                                name="dueDate"
                                                value={form.dueDate}
                                                onChange={handleChange}
                                                style={INP}
                                                min={today}
                                                max={projectTimeline || undefined}
                                            />
                                            {errors.dueDate && <div style={ERR}>{errors.dueDate}</div>}
                                        </Row>
                                        <Row label="Priority:">
                                            {/* FIX 4: priority values are now numeric (1=Critical … 4=Low) */}
                                            <select name="priority" value={form.priority} onChange={handleChange} style={INP}>
                                                <option value="">Select Priority</option>
                                                <option value="1">Critical</option>
                                                <option value="2">High</option>
                                                <option value="3">Medium</option>
                                                <option value="4">Low</option>
                                            </select>
                                            {errors.priority && <div style={ERR}>{errors.priority}</div>}
                                        </Row>
                                        <Row label="Approval Level:">
                                            {/* ✅ LOCKED: Approval level matches project and cannot be changed */}
                                            <input
                                                type="text"
                                                value={getApprovalLevelLabel(form.approvalLevel)}
                                                readOnly
                                                disabled
                                                style={{
                                                    ...INP_RO,
                                                    cursor: "not-allowed"
                                                }}
                                                title="Approval level is locked to match project approval level and cannot be changed"
                                            />
                                            {errors.approvalLevel && <div style={ERR}>{errors.approvalLevel}</div>}
                                        </Row>
                                        <Row label="Assigned to:">
                                            <UserSearch onUserSelect={handleUserSelect} selectedUser={selectedUser} />
                                            {errors.assignedTo && <div style={ERR}>{errors.assignedTo}</div>}
                                        </Row>
                                        <div style={{ marginTop: "auto", paddingTop: 10, display: "flex", justifyContent: "flex-end" }}>
                                            <button
                                                onClick={handleAdd}
                                                style={btn("#1e3a6e", "#fff", { padding: "8px 30px", fontSize: 14, width: "auto" })}
                                            >
                                                {editId ? "Update" : "Add"}
                                            </button>
                                        </div>
                                    </div>

                                </div>
                            </div>
                        )}

                        {/* ── Milestone Cards ── */}
                        {milestones.map((m, index) => (
                            <div style={card} key={m.id}>

                                {/* Collapsed summary row */}
                                <div
                                    style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", userSelect: "none" }}
                                    onClick={() => toggleExpand(m.id)}
                                >
                                    {/* Left — index, name, date pill, priority */}
                                    <div style={{ display: "flex", alignItems: "center", gap: 14, flex: 1, minWidth: 0 }}>
                                        <span style={{ fontWeight: 700, color: "#1e3a6e", fontSize: 13, flexShrink: 0 }}>
                                            #{index + 1}
                                        </span>
                                        <span style={{ fontWeight: 600, fontSize: 14, color: "#0f2044", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 260 }}>
                                            {m.milestoneName}
                                        </span>
                                        <span style={{ fontSize: 11, color: "#6b7fa3", background: "#eef2f9", padding: "2px 10px", borderRadius: 20, flexShrink: 0 }}>
                                            {formatDate(m.dueDate)}
                                        </span>
                                        {/* FIX 4: display label from numeric priority value */}
                                        <span style={{ fontSize: 11, fontWeight: 700, color: PRIORITY_COLOR[m.priority] || "#0f2044", flexShrink: 0 }}>
                                            {PRIORITY_LABEL[m.priority] || m.priority}
                                        </span>
                                    </div>

                                    {/* Right — edit/delete + arrow */}
                                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                                        <div style={{ display: "flex", gap: 6 }} onClick={e => e.stopPropagation()}>
                                            <button
                                                title="Edit milestone"
                                                onClick={() => handleEditClick(m)}
                                                style={iconBtn()}
                                                onMouseEnter={e => { e.currentTarget.style.background = "#e8f0fb"; e.currentTarget.style.color = "#1e3a6e"; e.currentTarget.style.borderColor = "#b5d4f4"; }}
                                                onMouseLeave={e => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.color = "#6b7fa3"; e.currentTarget.style.borderColor = "#c8d8ec"; }}
                                            >
                                                <EditIcon />
                                            </button>
                                            <button
                                                title="Delete milestone"
                                                onClick={() => handleDeleteClick(m)}
                                                style={iconBtn()}
                                                onMouseEnter={e => { e.currentTarget.style.background = "#fcebeb"; e.currentTarget.style.color = "#a32d2d"; e.currentTarget.style.borderColor = "#f09595"; }}
                                                onMouseLeave={e => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.color = "#6b7fa3"; e.currentTarget.style.borderColor = "#c8d8ec"; }}
                                            >
                                                <TrashIcon />
                                            </button>
                                        </div>
                                        <span style={{
                                            fontSize: 11, color: "#6b7fa3", marginLeft: 6,
                                            display: "inline-block",
                                            transform: expandedId === m.id ? "rotate(180deg)" : "rotate(0deg)",
                                            transition: "transform 0.2s",
                                            pointerEvents: "none"
                                        }}>▼</span>
                                    </div>
                                </div>

                                {/* Expanded detail */}
                                {expandedId === m.id && (
                                    <div style={{ display: "flex", marginTop: 16, paddingTop: 16, borderTop: "1px solid #e8eff8" }}>
                                        <div style={colL}>
                                            <Row label="Milestone Name:">
                                                <input type="text" value={m.milestoneName} readOnly style={INP_RO} />
                                            </Row>
                                            <Row label="Description:" top>
                                                <textarea value={m.description} readOnly style={TA_RO} />
                                            </Row>
                                        </div>
                                        <div style={colR}>
                                            <Row label="Due Date:">
                                                <input type="text" value={formatDate(m.dueDate)} readOnly style={INP_RO} />
                                            </Row>
                                            <Row label="Priority:">
                                                {/* FIX 4: show label from numeric value */}
                                                <div style={{ ...INP_RO, display: "flex", alignItems: "center", height: 36, padding: "0 10px" }}>
                                                    <span style={{ fontWeight: 700, color: PRIORITY_COLOR[m.priority] || "#0f2044", fontSize: 13 }}>
                                                        {PRIORITY_LABEL[m.priority] || m.priority}
                                                    </span>
                                                </div>
                                            </Row>
                                            <Row label="Approval Level:">
                                                {/* FIX 6: show the approval level label, not just the raw number */}
                                                <input
                                                    type="text"
                                                    value={getApprovalLevelLabel(m.approvalLevel)}
                                                    readOnly
                                                    style={INP_RO}
                                                />
                                            </Row>
                                            <Row label="Assigned to:">
                                                <input type="text" readOnly style={INP_RO}
                                                    value={m.assignedUser ? `${m.assignedUser.name} - ${m.assignedUser.userName}` : m.assignedTo} />
                                            </Row>
                                        </div>
                                    </div>
                                )}

                            </div>
                        ))}

                        {/* Grid error */}
                        {gridError && (
                            <div style={{ color: "#c0392b", fontSize: 13, textAlign: "center", marginBottom: 12 }}>
                                {gridError}
                            </div>
                        )}

                    </div>
                    {/* ── end scrollable content ── */}

                    {/* ── Sticky footer ── */}
                    <div style={{
                        borderTop: "1px solid #c8d8ec",
                        padding: "14px 36px",
                        background: "#eef2f9",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                    }}>
                        <button
                            onClick={() => navigate("/addProject")}
                            style={{ ...btn("transparent", "#1e3a6e"), border: "2px solid #1e3a6e", padding: "10px 34px", fontSize: 14, borderRadius: 8, width: "auto" }}
                        >
                            Back
                        </button>
                        <button
                            onClick={handleNext}
                            style={btn("#1e3a6e", "#fff", { padding: "10px 34px", fontSize: 14, borderRadius: 8, width: "auto" })}
                        >
                            Next
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
}