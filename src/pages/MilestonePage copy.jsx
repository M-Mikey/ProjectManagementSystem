import { useEffect, useState } from "react";
import Topbar from '../components/Navbar/Topbar';
import Navbar from '../components/Navbar/Navbar';
import "../styles/MilestonePage.css";
import { useNavigate, Link } from "react-router-dom";
import UserSearch from '../components/Common/UserSearch';
import { getAppLevel } from "../api/approvalLevel";
import { v4 as uuidv4 } from "uuid";


export default function MilestonePage() {
    const navigate = useNavigate();
    const [errors, setErrors] = useState({});
    const [editId, setEditId] = useState(null);
    const [selectedUser, setSelectedUser] = useState(null);
    const [data, setData] = useState(null);

    const [show, setShow] = useState(() => {
        const storedShow = sessionStorage.getItem("showMilestoneForm");
        return storedShow === "true";
    });


    const [project, setProject] = useState({
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
        setSelectedUser(user.userName);
        // setError("");           
        form.assignedTo = user.userName;
        console.log("Selected User:", user.userName);
    };

    /* ================= FORM STATE ================= */
    const [form, setForm] = useState({
        milestoneName: "",
        description: "",
        dueDate: "",
        priority: "",
        approvalLevel: "",
        assignedTo: "",
        userid: "",
    });

    /* ================= LIST STATE ================= */
    const [milestones, setMilestones] = useState([]);

    /* ================= LOAD SESSION DATA ================= */
    useEffect(() => {
        loadAppLevel();
        sessionStorage.setItem("showMilestoneForm", show);
        const data = sessionStorage.getItem("projectForm");
        if (data) {
            console.log(data);
            setProject(JSON.parse(data));
        }

        const savedMilestones = sessionStorage.getItem("milestones");
        if (savedMilestones) {
            setMilestones(JSON.parse(savedMilestones));
        }

    }, [show]);

    /* ================= INPUT HANDLER ================= */
    const loadAppLevel = async () => {
        try {
            const result = await getAppLevel("12059");
            setData(result);
        } catch (error) {
            console.error(error);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({
            ...prev,
            [name]: value
        }));

        setErrors({ ...errors, [name]: "" });
    };


    const handleAddMilestone = () => {
        if (!validate()) return;

        let updatedList = [];

        if (editId !== null) {
            updatedList = milestones.map((m) =>
                m.id === editId ? { ...form, id: m.id } : m
            );
        } else {
            updatedList = [
                ...milestones,
                { id: uuidv4(), ...form }
            ];
        }

        setMilestones(updatedList);
        sessionStorage.setItem("milestones", JSON.stringify(updatedList));

        setForm({
            milestoneName: "",
            description: "",
            dueDate: "",
            priority: "",
            approvalLevel: "",
            assignedTo: ""
        });

        setEditId(null);
    };

    const handleEdit = (milestone) => {
        setForm({
            id: milestone.id,
            milestoneName: milestone.milestoneName,
            description: milestone.description,
            dueDate: milestone.dueDate,
            priority: milestone.priority,
            approvalLevel: milestone.approvalLevel,
            assignedTo: milestone.assignedTo
        });
        console.log(milestone.id);
        setEditId(milestone.id);
    };

    const validate = () => {
        let newErrors = {};


        if (!form.milestoneName.trim()) {
            newErrors.milestoneName = "Milestone Name is required";
        }

        if (!form.dueDate) {
            newErrors.dueDate = "Due Date is required";
        }

        if (!form.description.trim()) {
            newErrors.description = "Description is required";
        }

        if (!form.priority.trim()) {
            newErrors.priority = "Priority is required";
        }

        if (!form.approvalLevel.trim()) {
            newErrors.approvalLevel = "Approval Level is required";
        }

        if (!selectedUser) {
            // setError("Assigned To is required");
            newErrors.assignedTo = "AssignedTo is required";
        }

        //if (!form.assignedTo.trim()) {
        // newErrors.assignedTo = "Assigned To is required";
        //}

        setErrors(newErrors);

        return Object.keys(newErrors).length === 0;
    };

    const handleDelete = (id) => {
        if (!window.confirm("Are you sure you want to delete this milestone?")) {
            return;
        }

        const updatedList = milestones.filter(m => m.id !== id);
        setMilestones(updatedList);
        sessionStorage.setItem("milestones", JSON.stringify(updatedList));
    };




    const handleNext = () => {

        navigate("/projectFinalPage")
    };

    const handlePrev = () => {
        navigate("/addProject")
    };


    return (

        <div className="app-container">
            <Topbar />
            <div className="main-layout ">
                <Navbar />

                <div className="page-container">
                    <div className="page-header">
                        <h3 className="project-title">
                            <strong>{project.name}</strong>
                        </h3>

                        <h6 className="project-purpose">
                            <strong> {project.purpose}</strong>
                        </h6>
                    </div>

                    <div className="btn-wrap d-flex justify-content-start">
                        <button className="primary-btn btn-sm " style={{ padding: "12px 14px", fontSize: "16px", minWidth: "200px" }} onClick={() => setShow(true)}>
                            Create Milestone
                        </button>
                    </div>
                    {show && (
                        <div className="milestone-container">
                            <div className="milestone-card">

                                <div className="left-section">
                                    <label>Milestone Name:</label>
                                    <input
                                        type="text"
                                        name="milestoneName"
                                        value={form.milestoneName}
                                        onChange={handleChange}
                                    />
                                    {errors.milestoneName && (
                                        <span className="error-text">{errors.milestoneName}</span>
                                    )}

                                    <label>Description:</label>
                                    <textarea
                                        name="description"
                                        value={form.description}
                                        onChange={handleChange}
                                    />
                                    {errors.description && (
                                        <span className="error-text">{errors.description}</span>
                                    )}
                                    <div className="btn-wrap d-flex justify-content-end">
                                        <button className="primary-btn btn-sm" onClick={handleAddMilestone}>
                                            {editId ? "Update" : "Add"}
                                        </button>
                                    </div>
                                </div>

                                <div className="right-section">
                                    <label>Due Date:</label>
                                    <input
                                        type="date"
                                        name="dueDate"
                                        value={form.dueDate}
                                        onChange={handleChange}
                                    />
                                    {errors.dueDate && (
                                        <span className="error-text">{errors.dueDate}</span>
                                    )}

                                    <label>Priority:</label>
                                    <select
                                        name="priority"
                                        value={form.priority}
                                        onChange={handleChange}
                                    >
                                        <option value=""> Select Priority</option>
                                        <option value="High">High</option>
                                        <option value="Medium">Medium</option>
                                        <option value="Low">Low</option>

                                    </select>

                                    {errors.priority && (
                                        <span className="error-text">{errors.priority}</span>
                                    )}

                                    <label>Assigned to:</label>                                 

                                    <UserSearch onUserSelect={handleUserSelect} />

                                    {errors.assignedTo && (
                                        <span className="error-text">{errors.assignedTo}</span>
                                    )}

                                    <label>Approval Level:</label>
                                    <select
                                        name="approvalLevel"
                                        value={form.approvalLevel}
                                        onChange={handleChange}
                                    >
                                        <option value="">Select Approval Level</option>

                                        {data?.approvalLevels?.map((level, index) => (
                                            <option
                                                key={index}
                                                value={level.level}
                                            >
                                                {level.approvalLevel} - {level.approvalName}
                                            </option>
                                        ))}
                                    </select>

                                    {errors.approvalLevel && (
                                        <span className="error-text">{errors.approvalLevel}</span>
                                    )}
                                    
                                </div>
                            </div>
                        </div>
                    )}
                    {/* ===== MILESTONE LIST HEADER (NEW) ===== */}

                    <div className="page-header">
                        <h3 className="project-title">
                            <strong>{"Milestone List"}</strong>
                        </h3>


                    </div>




                    {/* ===== TABLE ===== */}

                    <div className="table-responsive animate__animated animate__fadeInUp">
                        <table className="table table-bordered table-hover align-middle user-table mb-0">
                            <thead className="table-light">
                                <tr>
                                    <th className="text-center col-edit">Edit</th>
                                    <th className="col-username">Milestone Name</th>
                                    <th class="col-name">Description</th>
                                    <th class="col-email">DueD ate</th>
                                    <th class="col-mobile">Priority</th>
                                    <th class="col-type">Approval Level</th>
                                    <th class="col-status">Assigned To</th>
                                    {/*  <th className="text-center col-delete col-delete">Delete</th>  */}
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
                                    milestones.map((m) => (
                                        <tr key={m.id}>
                                            <td className="text-center">
                                                <button className="btn btn-sm btn-outline-primary" onClick={() => handleEdit(m)}>
                                                    <i className="bi bi-pencil-square"></i>
                                                </button>
                                            </td>
                                            <td>{m.milestoneName}</td>
                                            <td>{m.description}</td>
                                            <td>{m.dueDate}</td>
                                            <td>{m.priority}</td>
                                            <td>{m.approvalLevel}</td>
                                            <td>{m.assignedTo}</td>
                                            {/* 
                                              <td className="text-center">
                                                <button
                                                    className="btn btn-sm btn-outline-danger"
                                                    onClick={() => handleDelete(m.id)}
                                                >
                                                    <i className="bi bi-trash"></i>
                                                    </button>                                                
                                              </td>
                                            */}
                                        </tr>
                                    ))
                                )}
                            </tbody>

                        </table>
                    </div>

                    {/* ===== FOOTER BUTTONS ===== */}

                    <div className="btn-wrap d-flex justify-content-end mt-4">
                        <button className="primary-btn me-2" onClick={handlePrev}>
                            Back
                        </button>
                        <button className="primary-btn" onClick={handleNext}>
                            Next
                        </button>
                    </div>


                </div>
            </div>
        </div>
    );
}
