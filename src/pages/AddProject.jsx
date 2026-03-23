import { useEffect, useState } from "react";
import Topbar from '../components/Navbar/Topbar';
import Navbar from '../components/Navbar/Navbar';
import "../styles/AddProject.css";
import { useNavigate, useLocation } from "react-router-dom";
import { getAppLevel } from "../api/approvalLevel";
import { updateProject } from "../api/projectService";
import UserSearch from '../components/Common/UserSearch';


export default function AddProject() {

  const navigate  = useNavigate();
  const location  = useLocation();

  const editData   = location.state?.project || null;
  const isEditMode = !!editData;

  const [errors, setErrors]           = useState({});
  const [updateSaving, setUpdateSaving] = useState(false);
  const [successMsg, setSuccessMsg]   = useState("");

  const DUMMY_APPROVAL_LEVELS = [
    { level: "1", approvalLevel: "Level 1", approvalName: "Department Head" },
    { level: "2", approvalLevel: "Level 2", approvalName: "Division Head" },
    { level: "3", approvalLevel: "Level 3", approvalName: "Operating Head" },
    { level: "4", approvalLevel: "Level 4", approvalName: "Director" },
    { level: "5", approvalLevel: "Level 5", approvalName: "Senior Director" },
  ];

  const [data, setData]               = useState({ approvalLevels: DUMMY_APPROVAL_LEVELS });
  const [selectedUser, setSelectedUser] = useState(null);
  const userId                        = sessionStorage.getItem("userId");
  const [approvalLoading, setApprovalLoading] = useState(false);
  const [approvalError, setApprovalError]     = useState("");
  const [noteAccepted, setNoteAccepted]       = useState(false);

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

  const handleUserSelect = (user) => {
    setSelectedUser(user);
    setForm(prev => ({
      ...prev,
      projectLPL:   user?.name     || "",
      projectcode:  user?.userName || "",
      // ✅ Only clear approvalLevel if PL actually changed in create mode
      approvalLevel: isEditMode ? prev.approvalLevel : ""
    }));
    setData({ approvalLevels: DUMMY_APPROVAL_LEVELS });
    setApprovalError("");
    setErrors(prev => ({ ...prev, projectLPL: "" }));
    if (user?.userName) {
      loadAppLevel(user.userName);
    }
  };

  useEffect(() => {
    if (!userId) {
      navigate("/", { replace: true });
      return;
    }

   if (isEditMode && editData) {
  // ✅ Parse PL
  const plRaw   = editData.projectPl || "";
  const plMatch = plRaw.match(/^(.*?)\s*[-]\s*(\S+)$/) ||
                  plRaw.match(/^(.*?)\s*\(([^)]+)\)$/);
  const plName   = plMatch ? plMatch[1].trim() : plRaw;
  const plUserId = plMatch ? plMatch[2].trim() : plRaw;

  // ✅ Fix date — convert "31 Mar 2026" to "2026-03-31"
  const parseDate = (dateStr) => {
    if (!dateStr) return "";
    // Already YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
    // Remove time part if exists
    const cleaned = dateStr.split("T")[0];
    if (/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) return cleaned;
    // Parse "31 Mar 2026" or "31-Mar-26" format
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
    timeline:      parseDate(editData.projectTimeline), // ✅ Fixed
    projectcode:   plUserId,
    projectLPL:    plName,
    hsdm:          editData.projectType     ||
                   editData.hsdm            || "", // ✅ Fixed — check both fields
    severityLevel: editData.projectSeverity || "",
    approvalLevel: String(editData.projectApprovalLvl || ""),
    userid:        userId,
    projectId:     editData.projectId,
  });

  setSelectedUser({ name: plName, userName: plUserId });
  if (plUserId) loadAppLevel(plUserId);
  setNoteAccepted(true);
  return;
}

    // Create mode — load from session storage
    const savedData = sessionStorage.getItem("projectForm");
    if (savedData) {
      const parsed = JSON.parse(savedData);
      setForm(parsed);

      if (parsed.noteAccepted) {
        setNoteAccepted(parsed.noteAccepted);
      }

      if (parsed.projectLPL && parsed.projectcode) {
        setSelectedUser({
          name:     parsed.projectLPL,
          userName: parsed.projectcode
        });
      }

      if (parsed.approvalUser) {
        setSelectedUser(parsed.approvalUser);
        loadAppLevel(parsed.approvalUser.userName);
      }
    }

  }, [userId, navigate, isEditMode]);

  const loadAppLevel = async (userName) => {
    setApprovalLoading(true);
    setApprovalError("");
    try {
      const result = await getAppLevel(userName);
      if (result?.approvalLevels?.length > 0) {
        setData(result);
      } else {
        setData({ approvalLevels: DUMMY_APPROVAL_LEVELS });
      }
    } catch (error) {
      console.error(error);
      setApprovalError("Failed to load approval levels. Please try again.");
    } finally {
      setApprovalLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: "" }));
  };

  const handleSave = () => {
    if (!validate()) return;

    if (!data?.approvalLevels || data.approvalLevels.length === 0) {
      setErrors(prev => ({
        ...prev,
        approvalLevel: "Failed to load approval levels. Please refresh and try again."
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
        modifiedBy:      userId,
      };

      const result = await updateProject(payload);

      if (result?.success) {
        setSuccessMsg(
          "Project updated successfully. It has been sent for re-approval."
        );
        setTimeout(() => navigate(-1), 2500);
      } else {
        setErrors(prev => ({
          ...prev,
          general: result?.message || "Failed to update project"
        }));
      }
    } catch (err) {
      console.error(err);
      setErrors(prev => ({ ...prev, general: "Error updating project" }));
    } finally {
      setUpdateSaving(false);
    }
  };

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
      userid:        ""
    });
    setSelectedUser(null);
    setErrors({});
    setNoteAccepted(false);
    setData({ approvalLevels: DUMMY_APPROVAL_LEVELS });
    setApprovalError("");
    sessionStorage.removeItem("projectForm");
  };

  const today = new Date().toISOString().split("T")[0];

  const validate = () => {
    let tempErrors = {};

    const currentUserId = sessionStorage.getItem("userId");
    if (!currentUserId) {
      tempErrors.general = "Session expired. Please login again.";
      setTimeout(() => navigate("/", { replace: true }), 1500);
      return false;
    }

    if (!form.name.trim()) {
      tempErrors.name = "Project name is required";
    } else if (form.name.trim().length < 3) {
      tempErrors.name = "Project name must be at least 3 characters";
    } else if (form.name.length > 200) {
      tempErrors.name = "Project name cannot exceed 200 characters";
    } else if (!/^[a-zA-Z0-9\s\-_().&]+$/.test(form.name)) {
      tempErrors.name = "Project name can only contain letters, numbers, spaces, and basic punctuation (- _ . () &)";
    }

    if (!form.purpose.trim()) {
      tempErrors.purpose = "Purpose is required";
    } else if (form.purpose.trim().length < 10) {
      tempErrors.purpose = "Purpose must be at least 10 characters";
    } else if (form.purpose.length > 500) {
      tempErrors.purpose = "Purpose cannot exceed 500 characters";
    }

    if (!form.timeline) {
      tempErrors.timeline = "Target date is required";
    } else if (form.timeline < today) {
      tempErrors.timeline = "Target date cannot be in the past";
    } else if (form.timeline === today) {
      tempErrors.timeline = "Project target date must be at least one day in the future";
    }

    if (!selectedUser) {
      tempErrors.projectLPL = "Project Leader (PL) is required";
    } else if (Array.isArray(selectedUser)) {
      tempErrors.projectLPL = "Only ONE Project Leader can be assigned";
    } else if (!selectedUser.userName || !selectedUser.name) {
      tempErrors.projectLPL = "Invalid Project Leader selection. Please select again.";
    }

    if (form.hsdm && form.hsdm.length > 100) {
      tempErrors.hsdm = "Project type cannot exceed 100 characters";
    }

    if (!form.severityLevel) {
      tempErrors.severityLevel = "Project severity level is required";
    } else if (!["1", "2", "3", "4"].includes(form.severityLevel)) {
      tempErrors.severityLevel = "Invalid severity level selected";
    }

    if (!form.approvalLevel) {
      tempErrors.approvalLevel = "Approval level is required";
    } else if (!selectedUser) {
      tempErrors.approvalLevel = "Please select a Project Leader first";
    } else if (data?.approvalLevels?.length > 0) {
      const selectedLevel = data.approvalLevels.find(
        lv => lv.level === form.approvalLevel
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

  return (
    <div className="app-container">
      <Topbar />
      <div className="main-layout">
        <Navbar />

        <main className="content">
          <h2>{isEditMode ? "Edit Project Details" : "Add Project Details"}</h2>

          {successMsg && (
            <div className="success-text">{successMsg}</div>
          )}
          {errors.general && (
            <div className="error-text">{errors.general}</div>
          )}

          <div className="form-card">

            <div className="row">
              <div className="form-group">
                <label>
                  Name:<span className="required">*</span>
                </label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  maxLength={200}
                  placeholder="Enter project name"
                />
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
                  value={form.purpose}
                  onChange={handleChange}
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

            <div className="row">
              <div className="form-group">
                <label>
                  Target Date:<span className="required">*</span>
                </label>
                <input
                  type="date"
                  name="timeline"
                  value={form.timeline}
                  onChange={handleChange}
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

            <div className="row">
              <div className="form-group">
                <label>Project Type (Optional):</label>
                <input
                  name="hsdm"
                  value={form.hsdm}
                  onChange={handleChange}
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
                  value={form.severityLevel}
                  onChange={handleChange}
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

            <div className="row">
              <div className="form-group">
                <label>
                  Project Approval Level:<span className="required">*</span>
                </label>
                {/* ✅ Removed isEditMode from disabled */}
                <select
                  name="approvalLevel"
                  value={form.approvalLevel}
                  onChange={handleChange}
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
                    <option key={index} value={lv.level}>
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
                {/* ✅ Info note in edit mode */}
                {isEditMode && (
                  <div style={{
                    fontSize:   11,
                    color:      "#6b7fa3",
                    marginTop:  4
                  }}>
                    You can change the approval level when editing.
                    Changing PL will reset approval level.
                  </div>
                )}
              </div>
            </div>

            {/* Note box — hidden in edit mode */}
            {!isEditMode && (
              <div className="note-box">
                <strong>Note:</strong>
                <ol>
                  <li>
                    Once a project is created, the approval level
                    cannot be modified.
                  </li>
                  <li>
                    Only one PL (Project Leader) can be assigned to
                    manage the project; multiple PLs cannot be selected.
                  </li>
                </ol>
                <div className="note-accept" style={{
                  marginTop:  10,
                  display:    "flex",
                  alignItems: "center",
                  gap:        8
                }}>
                  <input
                    type="checkbox"
                    id="noteAccepted"
                    checked={noteAccepted}
                    onChange={(e) => {
                      setNoteAccepted(e.target.checked);
                      if (e.target.checked)
                        setErrors(prev => ({
                          ...prev, noteAccepted: ""
                        }));
                    }}
                  />
                  <label
                    htmlFor="noteAccepted"
                    style={{
                      marginBottom: 0,
                      fontWeight:   500,
                      cursor:       "pointer"
                    }}
                  >
                    I have read and accept the above note.
                  </label>
                </div>
                {errors.noteAccepted && (
                  <span className="error-text">
                    {errors.noteAccepted}
                  </span>
                )}
              </div>
            )}

            <div className="btn-wrap d-flex justify-content-end"
              style={{ gap: 10 }}>
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
                      width:        "fit-content"
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
                      width:        "fit-content"
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