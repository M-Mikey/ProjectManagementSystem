import { useEffect, useState } from "react";
import Topbar from "../components/Navbar/Topbar";
import Navbar from "../components/Navbar/Navbar";
import "../styles/AddProject.css";
import { useNavigate } from "react-router-dom";
// FIX 4 + 12: removed getAppLevel import — loadAppLevel was broken (called with no arg)
// and this page is read-only so no API call needed for approval levels
import { saveProject } from "../api/projectService";

// FIX 9 + 10: same dummy data as AddProject & MilestonePage for label resolution
// TODO: replace with real API data once client provides table/structure
const DUMMY_APPROVAL_LEVELS = [
  { level: "1", approvalLevel: "Level 1", approvalName: "Department Head" },
  { level: "2", approvalLevel: "Level 2", approvalName: "Division Head" },
  { level: "3", approvalLevel: "Level 3", approvalName: "Operating Head" },
  { level: "4", approvalLevel: "Level 4", approvalName: "Director" },
  { level: "5", approvalLevel: "Level 5", approvalName: "Senior Director" },
];

// FIX 10: priority label map — numeric value → display label
const PRIORITY_LABEL = { "1": "Critical", "2": "High", "3": "Medium", "4": "Low" };

// Helper: resolve approval level number to full label string
const getApprovalLabel = (levelValue) => {
  const found = DUMMY_APPROVAL_LEVELS.find(lv => lv.level === String(levelValue));
  return found ? `${found.approvalLevel} - ${found.approvalName}` : levelValue || "—";
};

// FIX 1: renamed component from AddProject → ProjectFinalPage (matches file name)
export default function ProjectFinalPage() {

  const navigate = useNavigate();

  // FIX 5: removed unused errors state
  const [successMsg, setSuccessMsg] = useState("");
  // FIX 11: saving state to prevent duplicate API calls on double-click
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: "",
    purpose: "",
    timeline: null,
    projectcode: "",
    projectLPL: "",
    hsdm: "",
    severityLevel: "",   // FIX 8: added severityLevel to form state
    approvalLevel: null,
    userid: "",
    noteAccepted: false, // FIX 6: added noteAccepted to form state
  });

  const [milestones, setMilestones] = useState([]);

  /* ================= LOAD SESSION DATA ================= */
  useEffect(() => {
    // FIX 3: removed broken loadAppLevel() call (was called with no argument)
    // Approval levels are resolved from DUMMY_APPROVAL_LEVELS directly

    const savedProject = sessionStorage.getItem("projectForm");
    if (savedProject) {
      setForm(JSON.parse(savedProject));
    }

    const savedMilestones = sessionStorage.getItem("milestones");
    if (savedMilestones) {
      setMilestones(JSON.parse(savedMilestones));
    }
  }, []);

  // FIX 4: removed handleChange — this is a read-only review page, no fields are editable

  /* ================= SAVE ================= */
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
        priority: m.priority ? String(m.priority) : null,   // C# expects string not int
        assignedTo: m.assignedUser?.userName || m.assignedTo || "",
        assignedToName: m.assignedUser?.name || m.assignedToName || "",
        approvalLevel: m.approvalLevel ? parseInt(m.approvalLevel) : 1,
        status: 0,
        assignedBy: form.userid,
        assignedDate: new Date().toISOString().split("T")[0],
      }))
    };

    // C# [FromBody] SaveProjectRequest deserializes body directly — no wrapper needed
    const payload = projectPayload;

    console.log("payload", payload);

    try {
      const result = await saveProject(payload);
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
      setSaving(false); // FIX 11: always release saving lock
    }
  };

  // FIX 2: removed the 42-line commented-out old handleSave block entirely

  const handlePrev = () => {
    navigate("/milestone");
  };

  return (
    <div className="app-container">
      <Topbar />
      <div className="main-layout">
        <Navbar />

        <main className="page-container">

          <h2>Project & Milestones Details</h2>

          <div className="form-card">

            {successMsg && (
              <div className="success-text">
                {successMsg}
              </div>
            )}

            {/* ================= PROJECT DETAILS (read-only) ================= */}

            <div className="row">
              <div className="form-group">
                <label>Name:</label>
                <input name="name" value={form.name || ""} disabled />
              </div>

              <div className="form-group">
                <label>Description:</label>
                <input name="purpose" value={form.purpose || ""} disabled />
              </div>
            </div>

            <div className="row">
              <div className="form-group">
                <label>Target Date:</label>
                <input name="timeline" value={form.timeline || ""} disabled />
              </div>

              <div className="form-group">
                <label>Project Leader (PL):</label>
                <input name="projectLPL" value={form.projectLPL || ""} disabled />
              </div>
            </div>

            <div className="row">
              <div className="form-group">
                <label>Project Type (Optional):</label>
                <input name="hsdm" value={form.hsdm || ""} disabled />
              </div>

              <div className="form-group">
                <label>Project Severity Level:</label>
                {/* FIX 8: show severity label resolved from numeric value */}
                <input
                  name="severityLevel"
                  value={PRIORITY_LABEL[form.severityLevel] || form.severityLevel || ""}
                  disabled
                />
              </div>
            </div>

            <div className="row">
              <div className="form-group">
                <label>Project Approval Level:</label>
                {/* FIX 9: show resolved label text instead of broken disabled select */}
                <input
                  name="approvalLevel"
                  value={getApprovalLabel(form.approvalLevel)}
                  disabled
                />
              </div>
            </div>

            <div className="note-box">
              <strong>Note:</strong>
              <ol>
                <li>Once a project is created, approval level cannot be modified.</li>
                <li>Only one PL (Project Leader) can be assigned to manage the project.</li>
              </ol>
            </div>

            {/* ================= MILESTONE TABLE ================= */}

            <div className="table-section">
              <div className="table-responsive">
                <table className="table table-bordered table-hover">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Milestone Name</th>
                      <th>Description</th>
                      <th>Due Date</th>
                      <th>Priority</th>
                      <th>Approval Level</th>
                      <th>Assigned To</th>
                    </tr>
                  </thead>
                  <tbody>
                    {milestones.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="text-center">
                          No milestones added yet
                        </td>
                      </tr>
                    ) : (
                      milestones.map((m, index) => (
                        <tr key={m.id}>
                          <td>{index + 1}</td>
                          <td>{m.milestoneName}</td>
                          <td>{m.description}</td>
                          <td>{m.dueDate}</td>
                          {/* FIX 10: resolve numeric priority to label */}
                          <td>{PRIORITY_LABEL[m.priority] || m.priority}</td>
                          {/* FIX 7: show actual approval level per milestone */}
                          <td>{getApprovalLabel(m.approvalLevel)}</td>
                          <td>
                            {m.assignedUser
                              ? `${m.assignedUser.name} - ${m.assignedUser.userName}`
                              : m.assignedTo}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="btn-wrap d-flex justify-content-end" style={{ gap: 10 }}>
              <button
                className="primary-btn btn-sm"
                onClick={handlePrev}
                disabled={saving}
              >
                Back
              </button>
              {/* FIX 11: disabled while saving, shows loading text */}
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