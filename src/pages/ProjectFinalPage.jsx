import { useEffect, useState } from "react";
import Topbar from "../components/Navbar/Topbar";
import Navbar from "../components/Navbar/Navbar";
import "../styles/AddProject.css";
import { useNavigate } from "react-router-dom";
import { saveProject } from "../api/projectService";

const DUMMY_APPROVAL_LEVELS = [
  { level: "1", approvalLevel: "Level 1", approvalName: "Department Head" },
  { level: "2", approvalLevel: "Level 2", approvalName: "Division Head" },
  { level: "3", approvalLevel: "Level 3", approvalName: "Operating Head" },
  { level: "4", approvalLevel: "Level 4", approvalName: "Director" },
  { level: "5", approvalLevel: "Level 5", approvalName: "Senior Director" },
];

const PRIORITY_LABEL = { "1": "Critical", "2": "High", "3": "Medium", "4": "Low" };

const getApprovalLabel = (levelValue) => {
  const found = DUMMY_APPROVAL_LEVELS.find(lv => lv.level === String(levelValue));
  return found ? `${found.approvalLevel} - ${found.approvalName}` : levelValue || "—";
};

export default function ProjectFinalPage() {
  const navigate = useNavigate();
  const [successMsg, setSuccessMsg] = useState("");
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: "",
    purpose: "",
    timeline: null,
    projectcode: "",
    projectLPL: "",
    hsdm: "",
    severityLevel: "",
    approvalLevel: null,
    userid: "",
    noteAccepted: false,
  });

  const [milestones, setMilestones] = useState([]);

  useEffect(() => {
    const savedProject = sessionStorage.getItem("projectForm");
    if (savedProject) setForm(JSON.parse(savedProject));

    const savedMilestones = sessionStorage.getItem("milestones");
    if (savedMilestones) setMilestones(JSON.parse(savedMilestones));
  }, []);

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);

    const projectPayload = {
      project: {
        projectId: 0,
        name: form.name,
        purpose: form.purpose,
        timeline: form.timeline,
        projectcode: form.projectcode,
        projectLPL: form.projectLPL,
        hsdm: form.hsdm,
        severityLevel: form.severityLevel ? parseInt(form.severityLevel) : null,
        approvalLevel: form.approvalLevel ? parseInt(form.approvalLevel) : null,
        userid: form.userid,
        projectApprovalLvl: form.approvalLevel ? parseInt(form.approvalLevel) : null,
        createdBy: form.userid,
        projectStatus: 0,
        projectApprovalStatus: 0,
        noteAccepted: form.noteAccepted ? 1 : 0,
      },
      milestones: milestones.map(m => ({
        milestoneId: 0,
        milestoneName: m.milestoneName,
        description: m.description,
        dueDate: m.dueDate,
        priority: m.priority ? String(m.priority) : null,
        assignedTo: m.assignedUser?.userName || m.assignedTo || "",
        assignedToName: m.assignedUser?.name || m.assignedToName || "",
        approvalLevel: m.approvalLevel ? parseInt(m.approvalLevel) : 1,
        status: 0,
        assignedBy: form.userid,
        assignedDate: new Date().toISOString().split("T")[0],
      }))
    };

    console.log("payload", projectPayload);

    try {
      const result = await saveProject(projectPayload);
      console.log("Saved:", result);
      setSuccessMsg("Project & milestones saved successfully!");
      sessionStorage.removeItem("projectForm");
      sessionStorage.removeItem("milestones");
      sessionStorage.removeItem("showMilestoneForm");
      setTimeout(() => {
        setSuccessMsg("");
        navigate("/Dashboard");
      }, 3000);
    } catch (error) {
      console.error(error);
      alert(error.message || "Error saving data");
    } finally {
      setSaving(false);
    }
  };

  const handlePrev = () => navigate("/milestone");

  return (
    <div className="app-container">
      <Topbar />
      {/* FIX: d-flex is mandatory — without it Navbar and main stack vertically,
          creating the blank space visible above the sidebar icons */}
      <div className="main-layout d-flex">
        <Navbar />

        <main className="flex-grow-1 page-container">

          <h2>Project &amp; Milestones Details</h2>

          <div className="form-card">

            {successMsg && (
              <div className="success-text">{successMsg}</div>
            )}

            {/* ===== PROJECT FIELDS (read-only) ===== */}
            <div className="row">
              <div className="form-group">
                <label>Name:</label>
                <input value={form.name || ""} disabled />
              </div>
              <div className="form-group">
                <label>Description:</label>
                <input value={form.purpose || ""} disabled />
              </div>
            </div>

            <div className="row">
              <div className="form-group">
                <label>Target Date:</label>
                <input value={form.timeline || ""} disabled />
              </div>
              <div className="form-group">
                <label>Project Leader (PL):</label>
                <input value={form.projectLPL || ""} disabled />
              </div>
            </div>

            <div className="row">
              <div className="form-group">
                <label>Project Type (Optional):</label>
                <input value={form.hsdm || ""} disabled />
              </div>
              <div className="form-group">
                <label>Project Severity Level:</label>
                <input
                  value={PRIORITY_LABEL[form.severityLevel] || form.severityLevel || ""}
                  disabled
                />
              </div>
            </div>

            <div className="row">
              <div className="form-group">
                <label>Project Approval Level:</label>
                <input value={getApprovalLabel(form.approvalLevel)} disabled />
              </div>
            </div>

            <div className="note-box">
              <strong>Note:</strong>
              <ol>
                <li>Once a project is created, approval level cannot be modified.</li>
                <li>Only one PL (Project Leader) can be assigned to manage the project.</li>
              </ol>
            </div>

            {/* ===== MILESTONE TABLE — scrollable for 10+ rows ===== */}
            <div className="table-section">
              {/* milestone count badge — useful UX signal when rows > visible area */}
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span className="fw-semibold">
                  Milestones
                  <span
                    className="badge bg-secondary ms-2"
                    style={{ fontSize: "0.75rem" }}
                  >
                    {milestones.length}
                  </span>
                </span>
              </div>

              {/*
                KEY FIX for 10+ milestones:
                - maxHeight caps the visible area at ~5 rows (~320px).
                - overflowY: auto adds vertical scrollbar only when needed.
                - The wrapper div is what scrolls; the table itself is full-width inside.
                - thead position: sticky + top: 0 + zIndex: 1 keeps headers pinned
                  while body rows scroll underneath — critical for usability with many rows.
                - background on thead cells prevents content bleed-through on scroll.
              */}
              <div
                className="table-responsive"
                style={{
                  maxHeight: "320px",
                  overflowY: "auto",
                  border: "1px solid #dee2e6",
                  borderRadius: "4px",
                }}
              >
                <table className="table table-bordered table-hover mb-0">
                  <thead
                    style={{
                      position: "sticky",
                      top: 0,
                      zIndex: 1,
                      backgroundColor: "#1a2f5a", // matches your dark header color
                    }}
                  >
                    <tr>
                      <th style={{ width: "44px", color: "#fff" }}>#</th>
                      <th style={{ color: "#fff" }}>Milestone Name</th>
                      <th style={{ color: "#fff" }}>Description</th>
                      <th style={{ width: "110px", color: "#fff" }}>Due Date</th>
                      <th style={{ width: "90px", color: "#fff" }}>Priority</th>
                      <th style={{ width: "180px", color: "#fff" }}>Approval Level</th>
                      <th style={{ color: "#fff" }}>Assigned To</th>
                    </tr>
                  </thead>
                  <tbody>
                    {milestones.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="text-center text-muted py-3">
                          No milestones added yet
                        </td>
                      </tr>
                    ) : (
                      milestones.map((m, index) => (
                        <tr key={m.id ?? index}>
                          <td>{index + 1}</td>
                          <td>{m.milestoneName}</td>
                          <td>{m.description}</td>
                          <td>{m.dueDate}</td>
                          <td>{PRIORITY_LABEL[m.priority] || m.priority || "—"}</td>
                          <td>{getApprovalLabel(m.approvalLevel)}</td>
                          <td>
                            {m.assignedUser
                              ? `${m.assignedUser.name} - ${m.assignedUser.userName}`
                              : m.assignedTo || "—"}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Overflow hint — only rendered when rows exceed visible area threshold */}
              {milestones.length > 5 && (
                <p className="text-muted mt-1" style={{ fontSize: "0.78rem" }}>
                  Scroll to view all {milestones.length} milestones.
                </p>
              )}
            </div>

            <div className="btn-wrap d-flex justify-content-end mt-3" style={{ gap: 10 }}>
              <button
                className="primary-btn btn-sm"
                onClick={handlePrev}
                disabled={saving}
              >
                Back
              </button>
              <button
                className="primary-btn btn-sm"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}