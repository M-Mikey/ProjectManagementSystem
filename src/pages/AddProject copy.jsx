import { useEffect, useState } from "react";
import Topbar from '../components/Navbar/Topbar';
import Navbar from '../components/Navbar/Navbar';
import "../styles/AddProject.css";
import { useNavigate, Navigate } from "react-router-dom";
//import getAppAuthorities from "../api/commonApi";
import { getAppLevel } from "../api/approvalLevel";
import UserSearch from '../components/Common/UserSearch';


export default function AddProject() {

  const navigate = useNavigate();
  const [errors, setErrors] = useState({});
  const [successMsg, setSuccessMsg] = useState("");
  const [authorities, setAuthorities] = useState([]);
  const [data, setData] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const userId = sessionStorage.getItem("userId");
  const userType = JSON.parse(sessionStorage.getItem("usertype"));

  const [form, setForm] = useState({
    name: "",
    purpose: "",
    timeline: null,
    projectcode: "",
    projectLPL: "",
    hsdm: "",
    approvalLevel: null,
    userid: "",
  });

  const handleUserSelect = (user) => {
    setSelectedUser(user);

    setForm(prev => ({
      ...prev,
      projectLPL: user?.name || "",
      projectcode: user?.userName || ""
    }));
  };



  // 🔹 Load from session storage on page load
  useEffect(() => {
    if (!userId) {
      navigate("/", { replace: true });
      return;
    }

    loadAppLevel();

    console.log("LIST:", loadAppLevel());
    const savedData = sessionStorage.getItem("projectForm");
    if (savedData) {
      const parsed = JSON.parse(savedData);
      //setForm(JSON.parse(savedData));
      setForm(parsed);

      // 🔑 restore selected user for UserSearch
      if (parsed.projectLPL && parsed.projectcode) {
        setSelectedUser({
          name: parsed.projectLPL,
          userName: parsed.projectcode
        });
      }
    }

  }, [userId, navigate]);


  const loadAppLevel = async () => {
    try {
      const result = await getAppLevel("12059");
      console.log("LIST:", result);
      setData(result);

    } catch (error) {
      console.error(error);
    }
  };

  // 🔹 Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));

    setErrors({ ...errors, [name]: "" });
  };

  // 🔹 Save to session storage
  const handleSave = () => {
    if (!validate()) return;

    const userId = sessionStorage.getItem("userId");
    console.log("userId:", userId);

    const projectData = { name: form.name, purpose: form.purpose, };
    //sessionStorage.setItem("projectForm", JSON.stringify(form));

    const updatedForm = {
      ...form,
      userid: userId
    };
    sessionStorage.setItem("projectForm", JSON.stringify(updatedForm));
    navigate("/milestone");
  };

  const handleNext = () => {
    navigate("/milestone")
  };


  const validate = () => {
    let tempErrors = {};

    if (!form.name.trim()) tempErrors.name = "Project name is required";
    if (!form.purpose.trim()) tempErrors.purpose = "Purpose is required";
    if (!form.timeline) tempErrors.timeline = "Timeline is required";
    //if (!form.projectLPL) tempErrors.projectLPL = "Project LPL is required";
    if (!selectedUser) {
      tempErrors.projectLPL = "Project LPL is required";
    }

    //if (!form.hsdm.trim()) tempErrors.hsdm = "HSDM/CR/Package is required";
    if (!form.approvalLevel) tempErrors.approvalLevel = "Approval level is required";

    setErrors(tempErrors);

    return Object.keys(tempErrors).length === 0;
  };



  //useEffect(() => {
  // loadUserDetails();
  //}, []);

  return (

    <div className="app-container">
      <Topbar />
      <div className="main-layout">
        <Navbar />

        <main className="content">
          <h2>Add Project Details</h2>


          <div className="form-card">

            <div className="form-group">
              {successMsg && (
                <div className="success-text">
                  {successMsg}
                </div>
              )}
              <label>Name:</label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
              />
              {errors.name && <span className="error-text">{errors.name}</span>}
            </div>

            <div className="form-group">
              <label>Purpose:</label>
              <input
                name="purpose"
                value={form.purpose}
                onChange={handleChange}
              />
              {errors.purpose && <span className="error-text">{errors.purpose}</span>}
            </div>

            <div className="row">
              <div className="form-group">
                <label>Timeline</label>
                <input
                  type="date"
                  name="timeline"
                  value={form.timeline}
                  onChange={handleChange}
                />
                {errors.timeline && <span className="error-text">{errors.timeline}</span>}
              </div>

              <div className="form-group">
                <label>Project Leader (PL)</label>
                {/* 
                <input
                  name="projectLPL"
                  value={form.projectLPL}
                  onChange={handleChange}
                />
                  */}


                <UserSearch
                  value={form.projectLPL}
                  selectedUser={selectedUser}
                  onUserSelect={handleUserSelect}
                />

                {/* <UserSearch onUserSelect={handleUserSelect} /> */}


                {errors.projectLPL && <span className="error-text">{errors.projectLPL}</span>}
              </div>
            </div>

            <div className="row">
              <div className="form-group">
                <label>HSDM/CR/Package (Optional)</label>
                <input
                  name="hsdm"
                  value={form.hsdm}
                  onChange={handleChange}
                />
                {errors.hsdm && <span className="error-text">{errors.hsdm}</span>}
              </div>

              <div className="form-group">
                <label>Project Approval Level</label>
                <select
                  name="approvalLevel"
                  value={form.approvalLevel}
                  onChange={handleChange}
                >
                  <option value="">Select Approval Level</option>

                  {data?.approvalLevels?.map((lv, index) => (
                    <option
                      key={index}
                      // value={level.approvalCode}
                      value={lv.level}
                    >
                      {lv.approvalLevel} - {lv.approvalName}
                    </option>
                  ))}
                </select>
                {errors.approvalLevel && (
                  <span className="error-text">{errors.approvalLevel}</span>
                )}
              </div>
            </div>

            <div className="note-box">
              <strong>Note:</strong>
              <ol>
                <li>Once a project is created, the approval level cannot be modified.</li>
                <li>Only one LPL (Lead Project Leader) can be assigned.</li>
              </ol>
            </div>

            <div className="btn-wrap d-flex justify-content-end">
              <button className="primary-btn" onClick={handleSave}>
                Next
              </button>


            </div>
          </div>
        </main>
      </div>
    </div>

  );
}
