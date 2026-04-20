import { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { getAppLevel } from "../api/approvalLevel";
import { updateProject, checkProjectNameExists } from "../api/projectService";
import UserSearch from "../components/Common/UserSearch";
import "../styles/AddProject.css";

export default function AddProject() {
  const navigate = useNavigate();
  const location = useLocation();

  const editData   = location.state?.project || null;
  const isEditMode = !!editData;

  const [errors, setErrors]                   = useState({});
  const [updateSaving, setUpdateSaving]       = useState(false);
  const [successMsg, setSuccessMsg]           = useState("");
  const [nameExists, setNameExists]           = useState(false);
  const [nameChecking, setNameChecking]       = useState(false);

  const DUMMY_APPROVAL_LEVELS = [
    { level: "1", approvalLevel: "Level 1", approvalName: "Department Head" },
    { level: "2", approvalLevel: "Level 2", approvalName: "Division Head" },
    { level: "3", approvalLevel: "Level 3", approvalName: "Operating Head" },
    { level: "4", approvalLevel: "Level 4", approvalName: "Director" },
    { level: "5", approvalLevel: "Level 5", approvalName: "Senior Director" },
  ];

  const [data, setData]                       = useState({ approvalLevels: DUMMY_APPROVAL_LEVELS });
  const [selectedUser, setSelectedUser]       = useState(null);
  const [approvalLoading, setApprovalLoading] = useState(false);
  const [approvalError, setApprovalError]     = useState("");
  const [noteAccepted, setNoteAccepted]       = useState(false);

  const userId = sessionStorage.getItem("userId");

  const [form, setForm] = useState({
    name:          "",
    purpose:       "",
    timeline:      "",
    projectcode:   "",
    projectLPL:    "",
    hsdm:          "",
    severityLevel: "",
    approvalLevel: "",
    userid:        "",
  });

  // ── Refs ─────────────────────────────────────────────────────────────────────
  const nameRef     = useRef(null);
  const purposeRef  = useRef(null);
  const timelineRef = useRef(null);
  const hsdmRef     = useRef(null);
  const severityRef = useRef(null);
  const approvalRef = useRef(null);

  // ── Enter key — fires submit from any field ──────────────────────────────────
  // Used as onKeyDown for inputs, onKeyUp for selects (selects consume keyDown natively)
  const handleEnterKey = (e) => {
    if (e.key === "Enter") {
      isEditMode ? handleUpdate() : handleSave();
    }
  };

  // ── User Select ──────────────────────────────────────────────────────────────
  const handleUserSelect = (user) => {
    setSelectedUser(user);
    setForm((prev) => ({
      ...prev,
      projectLPL:    user?.name     || "",
      projectcode:   user?.userName || "",
      // FIX: always reset approvalLevel when PL changes — new PL = new approval set,
      // keeping the old value risks a stale selection that fails validation
      approvalLevel: "",
    }));
    setData({ approvalLevels: DUMMY_APPROVAL_LEVELS });
    setApprovalError("");
    // FIX: also clear the approvalLevel error so stale error doesn't linger
    setErrors((prev) => ({ ...prev, projectLPL: "", approvalLevel: "" }));
    if (user?.userName) {
      loadAppLevel(user.userName);
    }
  };

  // ── On Mount ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!userId) {
      navigate("/", { replace: true });
      return;
    }

    if (isEditMode && editData) {
      const plRaw   = editData.projectPl || "";
      const plMatch =
        plRaw.match(/^(.*?)\s*[-]\s*(\S+)$/) ||
        plRaw.match(/^(.*?)\s*\(([^)]+)\)$/);
      const plName   = plMatch ? plMatch[1].trim() : plRaw;
      const plUserId = plMatch ? plMatch[2].trim() : plRaw;

      const parseDate = (dateStr) => {
        if (!dateStr) return "";
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
        const cleaned = dateStr.split("T")[0];
        if (/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) return cleaned;
        const parsed = new Date(dateStr);
        if (!isNaN(parsed)) {
          const yyyy = parsed.getFullYear();
          const mm   = String(parsed.getMonth() + 1).padStart(2, "0");
          const dd   = String(parsed.getDate()).padStart(2, "0");
          return `${yyyy}-${mm}-${dd}`;
        }
        return "";
      };

      setForm({
        name:          editData.projectName     || "",
        purpose:       editData.projectDescrip  || "",
        timeline:      parseDate(editData.projectTimeline),
        projectcode:   plUserId,
        projectLPL:    plName,
        hsdm:          editData.projectType || editData.hsdm || "",
        severityLevel: editData.projectSeverity || "",
        // FIX: normalize to string — projectApprovalLvl from backend may be a number,
        // keeping it as-is causes strict equality to fail against string option values
        approvalLevel: String(editData.projectApprovalLvl ?? ""),
        userid:        userId,
        projectId:     editData.projectId,
      });

      setSelectedUser({ name: plName, userName: plUserId });
      if (plUserId) loadAppLevel(plUserId);
      setNoteAccepted(true);
      return;
    }

    // Create mode — restore from session
    const savedData = sessionStorage.getItem("projectForm");
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        // FIX: normalize approvalLevel from sessionStorage as well
        if (parsed.approvalLevel !== undefined) {
          parsed.approvalLevel = String(parsed.approvalLevel ?? "");
        }
        setForm(parsed);
        if (parsed.noteAccepted) setNoteAccepted(parsed.noteAccepted);
        if (parsed.projectLPL && parsed.projectcode) {
          setSelectedUser({ name: parsed.projectLPL, userName: parsed.projectcode });
        }
        if (parsed.approvalUser) {
          setSelectedUser(parsed.approvalUser);
          loadAppLevel(parsed.approvalUser.userName);
        }
      } catch (e) {
        // Corrupt session data — clear it and start fresh
        console.error("Failed to restore session form data:", e);
        sessionStorage.removeItem("projectForm");
      }
    }
  }, [userId, navigate, isEditMode]);

  // ── Load Approval Levels ─────────────────────────────────────────────────────
  const loadAppLevel = async (userName) => {
    setApprovalLoading(true);
    setApprovalError("");
    try {
      const result = await getAppLevel(userName);
      if (result?.approvalLevels?.length > 0) {
        // FIX: normalize all level values to strings at the source so every
        // downstream comparison (find, select value match) is type-safe
        const normalized = {
          ...result,
          approvalLevels: result.approvalLevels.map((lv) => ({
            ...lv,
            level: String(lv.level),
          })),
        };
        setData(normalized);
      } else {
        setData({ approvalLevels: DUMMY_APPROVAL_LEVELS });
      }
    } catch (error) {
      console.error(error);
      setApprovalError("Failed to load approval levels. Please try again.");
      setData({ approvalLevels: DUMMY_APPROVAL_LEVELS });
    } finally {
      setApprovalLoading(false);
    }
  };

  // ── Name Blur — Duplicate Check ──────────────────────────────────────────────
  const handleNameBlur = async () => {
    if (nameChecking) return;

    const trimmed = form.name.trim();
    if (!trimmed || trimmed.length < 3) return;

    if (isEditMode && editData) {
      const originalName = (editData.projectName || "").trim().toLowerCase();
      if (trimmed.toLowerCase() === originalName) {
        setNameExists(false);
        setErrors((prev) => ({ ...prev, name: "" }));
        return;
      }
    }

    setNameChecking(true);
    setNameExists(false);
    setErrors((prev) => ({ ...prev, name: "" }));

    try {
      const exists = await checkProjectNameExists(
        trimmed,
        isEditMode ? form.projectId : null
      );
      if (exists) {
        setNameExists(true);
        setErrors((prev) => ({
          ...prev,
          name: "A project with this name already exists. Please choose a different name.",
        }));
      }
    } catch (err) {
      console.error("Name existence check failed:", err);
    } finally {
      setNameChecking(false);
    }
  };

  // ── Field Change ─────────────────────────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
    if (name === "name") setNameExists(false);
  };

  // ── Validation ───────────────────────────────────────────────────────────────
  const validate = () => {
    const tempErrors = {};

    const currentUserId = sessionStorage.getItem("userId");
    if (!currentUserId) {
      tempErrors.general = "Session expired. Please login again.";
      setTimeout(() => navigate("/", { replace: true }), 1500);
      return false;
    }

    // Name — empty → length → format → duplicate
    if (!form.name.trim()) {
      tempErrors.name = "Project name is required";
    } else if (form.name.trim().length < 3) {
      tempErrors.name = "Project name must be at least 3 characters";
    } else if (form.name.length > 200) {
      tempErrors.name = "Project name cannot exceed 200 characters";
    } else if (!/^[a-zA-Z0-9\s\-_().&]+$/.test(form.name)) {
      tempErrors.name =
        "Project name can only contain letters, numbers, spaces, and basic punctuation (- _ . () &)";
    } else if (nameExists) {
      tempErrors.name =
        "A project with this name already exists. Please choose a different name.";
    }

    if (!form.purpose.trim()) {
      tempErrors.purpose = "Purpose is required";
    } else if (form.purpose.trim().length < 10) {
      tempErrors.purpose = "Purpose must be at least 10 characters";
    } else if (form.purpose.length > 500) {
      tempErrors.purpose = "Purpose cannot exceed 500 characters";
    }

    // Timeline — date object comparison, not string
    if (!form.timeline) {
      tempErrors.timeline = "Target date is required";
    } else {
      const selectedDate = new Date(form.timeline);
      const tomorrow     = new Date();
      tomorrow.setHours(0, 0, 0, 0);
      tomorrow.setDate(tomorrow.getDate() + 1);
      if (selectedDate < tomorrow) {
        tempErrors.timeline = "Target date must be at least one day in the future";
      }
    }

    if (!selectedUser) {
      tempErrors.projectLPL = "Project Leader (PL) is required";
    } else if (Array.isArray(selectedUser)) {
      tempErrors.projectLPL = "Only ONE Project Leader can be assigned";
    } else if (!selectedUser.userName || !selectedUser.name) {
      tempErrors.projectLPL =
        "Invalid Project Leader selection. Please select again.";
    }

    if (form.hsdm && form.hsdm.length > 100) {
      tempErrors.hsdm = "Project type cannot exceed 100 characters";
    }

    if (!form.severityLevel) {
      tempErrors.severityLevel = "Project severity level is required";
    } else if (!["1", "2", "3", "4"].includes(form.severityLevel)) {
      tempErrors.severityLevel = "Invalid severity level selected";
    }

    // FIX 1: guard against validating while approval levels are still loading
    // FIX 2: normalize both sides to string before comparing — API may return
    //         lv.level as a number even if our dummy set uses strings
    if (!form.approvalLevel) {
      tempErrors.approvalLevel = "Approval level is required";
    } else if (approvalLoading) {
      tempErrors.approvalLevel =
        "Approval levels are still loading. Please wait and try again.";
    } else if (data?.approvalLevels?.length > 0) {
      const selectedLevel = data.approvalLevels.find(
        (lv) => String(lv.level) === String(form.approvalLevel)
      );
      if (!selectedLevel) {
        tempErrors.approvalLevel =
          "Selected approval level is not valid for this Project Leader";
      }
    }

    if (!isEditMode && !noteAccepted) {
      tempErrors.noteAccepted = "You must accept the note to proceed";
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  // ── Save (Create Mode) ───────────────────────────────────────────────────────
  const handleSave = () => {
    if (!validate()) return;

    if (!data?.approvalLevels || data.approvalLevels.length === 0) {
      setErrors((prev) => ({
        ...prev,
        approvalLevel:
          "Failed to load approval levels. Please refresh and try again.",
      }));
      return;
    }

    const updatedForm = {
      ...form,
      userid:       userId,
      approvalUser: selectedUser,
      noteAccepted: noteAccepted,
    };
    sessionStorage.setItem("projectForm", JSON.stringify(updatedForm));
    navigate("/milestone");
  };

  // ── Update (Edit Mode) ───────────────────────────────────────────────────────
  const handleUpdate = async () => {
    if (!validate()) return;
    if (updateSaving) return;
    setUpdateSaving(true);
    setSuccessMsg("");

    try {
      const payload = {
        projectId:       form.projectId,
        name:            form.name,
        purpose:         form.purpose,
        timeline:        form.timeline ? new Date(form.timeline) : null,
        projectPL:       form.projectcode,
        projectType:     form.hsdm || null,
        projectSeverity: form.severityLevel || null,
        hsdm:            form.hsdm || null,
        approvalLevel:   form.approvalLevel || null,
        modifiedBy:      userId,
      };

      const result = await updateProject(payload);

      if (result?.success) {
        setSuccessMsg(
          "Project updated successfully. It has been sent for re-approval."
        );
        setTimeout(() => navigate(-1), 2500);
      } else {
        setErrors((prev) => ({
          ...prev,
          general: result?.message || "Failed to update project",
        }));
      }
    } catch (err) {
      console.error(err);
      setErrors((prev) => ({ ...prev, general: "Error updating project" }));
    } finally {
      setUpdateSaving(false);
    }
  };

  // ── Reset (Create Mode) ──────────────────────────────────────────────────────
  const handleReset = () => {
    setForm({
      name:          "",
      purpose:       "",
      timeline:      "",
      projectcode:   "",
      projectLPL:    "",
      hsdm:          "",
      severityLevel: "",
      approvalLevel: "",
      userid:        "",
    });
    setSelectedUser(null);
    setErrors({});
    setNoteAccepted(false);
    setNameExists(false);
    setData({ approvalLevels: DUMMY_APPROVAL_LEVELS });
    setApprovalError("");
    sessionStorage.removeItem("projectForm");
  };

  const today = new Date().toISOString().split("T")[0];

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="app-container">
      <div className="main-layout">
        <main className="content">
          <h2>{isEditMode ? "Edit Project Details" : "Add Project Details"}</h2>

          {successMsg && <div className="success-text">{successMsg}</div>}
          {errors.general && <div className="error-text">{errors.general}</div>}

          <div className="form-card">

            {/* Row 1 — Name & Description */}
            <div className="row">
              <div className="form-group">
                <label>
                  Name:<span className="required">*</span>
                </label>
                <input
                  name="name"
                  ref={nameRef}
                  value={form.name}
                  onChange={handleChange}
                  onBlur={handleNameBlur}
                  onKeyDown={handleEnterKey}
                  maxLength={200}
                  placeholder="Enter project name"
                />
                {nameChecking && (
                  <span style={{ fontSize: 11, color: "#6b7fa3", marginTop: 4, display: "block" }}>
                    Checking name availability...
                  </span>
                )}
                {errors.name && (
                  <span className="error-text">{errors.name}</span>
                )}
              </div>

              <div className="form-group">
                <label>
                  Description:<span className="required">*</span>
                </label>
                <input
                  name="purpose"
                  ref={purposeRef}
                  value={form.purpose}
                  onChange={handleChange}
                  onKeyDown={handleEnterKey}
                  maxLength={500}
                  placeholder="Enter project description"
                />
                <div style={{ fontSize: 11, color: "#6b7fa3", marginTop: 4 }}>
                  {form.purpose.length}/500 characters
                </div>
                {errors.purpose && (
                  <span className="error-text">{errors.purpose}</span>
                )}
              </div>
            </div>

            {/* Row 2 — Timeline & Project Leader */}
            <div className="row">
              <div className="form-group">
                <label>
                  Target Date:<span className="required">*</span>
                </label>
                <input
                  type="date"
                  name="timeline"
                  ref={timelineRef}
                  value={form.timeline}
                  onChange={handleChange}
                  onKeyDown={handleEnterKey}
                  min={today}
                />
                {errors.timeline && (
                  <span className="error-text">{errors.timeline}</span>
                )}
              </div>

              <div className="form-group">
                <label>
                  Project Leader (PL):<span className="required">*</span>
                </label>
                <UserSearch
                  value={form.projectLPL}
                  selectedUser={selectedUser}
                  onUserSelect={handleUserSelect}
                />
                {errors.projectLPL && (
                  <span className="error-text">{errors.projectLPL}</span>
                )}
              </div>
            </div>

            {/* Row 3 — Project Type & Severity */}
            <div className="row">
              <div className="form-group">
                <label>Project Type (Optional):</label>
                <input
                  name="hsdm"
                  ref={hsdmRef}
                  value={form.hsdm}
                  onChange={handleChange}
                  onKeyDown={handleEnterKey}
                  maxLength={100}
                  placeholder="e.g., HSDM, CR, Package"
                />
                {errors.hsdm && (
                  <span className="error-text">{errors.hsdm}</span>
                )}
              </div>

              <div className="form-group">
                <label>
                  Project Severity Level:<span className="required">*</span>
                </label>
                <select
                  name="severityLevel"
                  ref={severityRef}
                  value={form.severityLevel}
                  onChange={handleChange}
                  onKeyUp={handleEnterKey}
                >
                  <option value="">Select Severity Level</option>
                  <option value="1">Critical</option>
                  <option value="2">High</option>
                  <option value="3">Medium</option>
                  <option value="4">Low</option>
                </select>
                {errors.severityLevel && (
                  <span className="error-text">{errors.severityLevel}</span>
                )}
              </div>
            </div>

            {/* Row 4 — Approval Level */}
            <div className="row">
              <div className="form-group">
                <label>
                  Project Approval Level:<span className="required">*</span>
                </label>
                <select
                  name="approvalLevel"
                  ref={approvalRef}
                  value={form.approvalLevel}
                  onChange={handleChange}
                  onKeyUp={handleEnterKey}
                  disabled={!selectedUser || approvalLoading}
                  title={
                    !selectedUser
                      ? "Select a Project Leader first"
                      : approvalLoading
                      ? "Loading approval levels..."
                      : ""
                  }
                >
                  <option value="">
                    {!selectedUser
                      ? "Select a Project Leader first"
                      : approvalLoading
                      ? "Loading approval levels..."
                      : "Select Approval Level"}
                  </option>
                  {data?.approvalLevels?.map((lv, index) => (
                    // FIX: value is always a string so it matches form.approvalLevel
                    // which is also normalized to string throughout
                    <option key={index} value={String(lv.level)}>
                      {lv.approvalLevel} - {lv.approvalName}
                    </option>
                  ))}
                </select>
                {approvalError && (
                  <span className="error-text">{approvalError}</span>
                )}
                {errors.approvalLevel && (
                  <span className="error-text">{errors.approvalLevel}</span>
                )}
                {isEditMode && (
                  <div style={{ fontSize: 11, color: "#6b7fa3", marginTop: 4 }}>
                    Changing PL will reset the approval level.
                  </div>
                )}
              </div>
            </div>

            {/* Note — create mode only */}
            {!isEditMode && (
              <div className="note-box">
                <strong>Note:</strong>
                <ol>
                  <li>
                    Once a project is created, the approval level cannot be modified.
                  </li>
                  <li>
                    Only one PL (Project Leader) can be assigned to manage the
                    project; multiple PLs cannot be selected.
                  </li>
                </ol>
                <div
                  className="note-accept"
                  style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 8 }}
                >
                  <input
                    type="checkbox"
                    id="noteAccepted"
                    checked={noteAccepted}
                    onChange={(e) => {
                      setNoteAccepted(e.target.checked);
                      if (e.target.checked)
                        setErrors((prev) => ({ ...prev, noteAccepted: "" }));
                    }}
                  />
                  <label
                    htmlFor="noteAccepted"
                    style={{ marginBottom: 0, fontWeight: 500, cursor: "pointer" }}
                  >
                    I have read and accept the above note.
                  </label>
                </div>
                {errors.noteAccepted && (
                  <span className="error-text">{errors.noteAccepted}</span>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div
              className="btn-wrap d-flex justify-content-end"
              style={{ gap: 10 }}
            >
              {isEditMode ? (
                <>
                  <button
                    className="secondary-btn"
                    onClick={() => navigate(-1)}
                    type="button"
                    style={{
                      background:   "transparent",
                      border:       "2px solid #1e3a6e",
                      color:        "#1e3a6e",
                      borderRadius: 7,
                      padding:      "9px 28px",
                      fontWeight:   600,
                      fontSize:     13,
                      cursor:       "pointer",
                      width:        "fit-content",
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    className="primary-btn"
                    onClick={handleUpdate}
                    disabled={updateSaving}
                  >
                    {updateSaving ? "Saving..." : "Update Project"}
                  </button>
                </>
              ) : (
                <>
                  <button
                    className="secondary-btn"
                    onClick={handleReset}
                    type="button"
                    style={{
                      background:   "transparent",
                      border:       "2px solid #1e3a6e",
                      color:        "#1e3a6e",
                      borderRadius: 7,
                      padding:      "9px 28px",
                      fontWeight:   600,
                      fontSize:     13,
                      cursor:       "pointer",
                      width:        "fit-content",
                    }}
                  >
                    Reset
                  </button>
                  <button
                    className="primary-btn"
                    onClick={handleSave}
                    disabled={approvalLoading}
                  >
                    {approvalLoading ? "Loading..." : "Next"}
                  </button>
                </>
              )}
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}