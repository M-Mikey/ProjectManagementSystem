import React from "react";
import "../styles/ProjectApproval.css";
import Topbar from '../components/Navbar/Topbar';
import Navbar from '../components/Navbar/Navbar';
import { Link, useNavigate } from "react-router-dom";
import { getApprovalDetails, updateApprovalDetails, getApprovalHistory } from "../api/userDashboardApi";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

const ProjectApprovalPending = () => {

  const { projectId, milestoneId } = useParams(); // from route
  const [data, setData] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState("");
  const [remarks, setRemarks] = useState("");
  const userId = sessionStorage.getItem("userId");
  console.log("user id", userId)

  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  const navigate = useNavigate();

  const handleNav = () => {
    navigate('/userdashboard');
  }


  useEffect(() => {
    const fetchApprovalDetails = async () => {
      try {
        setLoading(true);
        const result = await getApprovalDetails(projectId, milestoneId);
        setData(result);
        console.log("app", JSON.stringify(result, null, 2));

        const hresult = await getApprovalHistory(projectId);
        setHistory(hresult);
        console.log("his", JSON.stringify(hresult, null, 2));

      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (projectId && milestoneId) {

      fetchApprovalDetails();
    }
  }, [projectId, milestoneId]);

  const getStatusText = (status) => {
    if (status === 1) return "Approved";
    if (status === 2) return "Rejected";
    return "Pending";
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    try {
      const payload = {
        projectId: Number(projectId),
        milestoneId: Number(milestoneId),
        approvedBy: userId,
        approvalStatus: Number(status),
        remarks: remarks,
      };

      await updateApprovalDetails(payload);
      setMessage("Approved successfully");
      setMessageType("success");

      setTimeout(() => {
        navigate("/project_approval");
      }, 2000);

    } catch (err) {
      //alert(err.message);
      console.error(err.message);
      setMessage("Something went wrong");
      setMessageType("error");
    }
  };


  if (loading) return <p>Loading...</p>;
  if (error) return <p className="text-danger">{error}</p>;

  const validate = () => {
    const newErrors = {};

    if (!status) newErrors.status = "Status is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  return (
    <>
      <Topbar />

      <div className="d-flex">
        <Navbar />

        <div
          className="main mt-2"
          style={{ width: "1800px", height: "auto" }}
        >
          <div className="container-fluid py-4">
            <h2 className="mx-5">{data.projectName}</h2>

            <div
              className="card shadow-sm mx-5"
              style={{ height: "auto", display: "" }}
            >
              <div
                className="card-body"
                style={{ border: "1px solid", borderRadius: "10px" }}
              >
                <form>
                  <div className="row g-3">
                    {/* <!-- Left Column --> */}
                    <div className="col-lg-12">
                      <div className="mb-0">
                        <label className="form-label fw-semibold">
                          {data.projectDescription}
                        </label>
                      </div>

                      <div
                        className="table-responsive animate__animated animate__fadeInUp overflow-hidden"
                        style={{ border: "1px solid", borderRadius: "10px" }}
                      >
                        <table className="table table-bordered table-hover align-middle my-1">
                          <thead>
                            <tr>
                              <th>Milestone Name</th>
                              <th>Description</th>
                              <th>Due Date</th>
                              <th>Priority</th>
                              <th>Assigned To</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td>{data.milestoneName}</td>
                              <td>{data.milestoneDescription}</td>
                              <td>{new Date(data.milestoneDueDate).toLocaleDateString()}</td>
                              <td>{data.milestonePriority}</td>
                              <td>{data.milestoneAssigned}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </form>
              </div>
            </div>

            <div
              className="card shadow-sm mx-5 my-3"
              style={{ height: "auto", display: "" }}
            >
              <div
                className="card-body"
                style={{ border: "1px solid", borderRadius: "10px" }}
              >
                <form>
                  <div className="row g-3">
                    {/* <!-- Left Column --> */}

                    <div className="col-lg-9">
                      <div className="mb-0">
                        <label className="form-label fw-semibold">
                          {" "}
                          Project: {data.projectName}
                        </label>
                      </div>

                      <div className="mb-0">
                        <label className="form-label fw-semibold">
                          Purpose: {data.projectDescription}
                        </label>
                      </div>

                      <div className="mb-0">
                        <label className="form-label fw-semibold">
                          Time Line: {new Date(data.projectTimeline).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </label>
                      </div>
                      <div className="mb-0">
                        <label className="form-label fw-semibold ">
                          Project LPL:{data.projectPL}
                        </label>
                      </div>
                      <div className="mb-0">
                        <label className="form-label fw-semibold">
                          HSDM/CR/Package: {data.hsdm}
                        </label>
                      </div>
                      <div className="mb-0">
                        <label className="form-label fw-semibold">
                          Project Approval Level: {data.projectApprovalLevel}
                        </label>
                      </div>
                    </div>

                  </div>
                </form>
              </div>
            </div>

            <div
              className="card shadow-sm mx-5 "
              style={{ height: "auto", display: "" }}
            >
              <div
                className="card-body"
                style={{ border: "1px solid", borderRadius: "10px" }}
              >
                <form>
                  <div className="row g-3">
                    {/* <!-- Left Column --> */}
                    <div className="col-lg-7">
                      <div className="mb-0">
                        <label className="form-label fw-semibold fs-5">
                          Remarks
                        </label>
                      </div>
                    </div>
                    <div
                      className="table-responsive animate__animated animate__fadeInUp"
                      style={{ border: "1px solid", borderRadius: "10px" }}
                    >
                      <table className="table table-bordered table-hover align-middle my-1">
                        <thead>
                          <tr>
                            <th>Remark Date</th>
                            <th>Status</th>
                            <th>Remarks</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr >
                            <td></td>
                            <td></td>
                            <td></td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </form>
              </div>
            </div>

            <div
              className="card shadow-sm mx-5 my-3"
              style={{ height: "auto", display: "" }}
            >
              <div
                className="card-body"
                style={{ border: "1px solid", borderRadius: "10px" }}
              >
                <form>
                  <div className="row g-3">
                    {/* <!-- Left Column --> */}
                    <div className="col-lg-12">
                      <div className="mb-0">
                        <label className="form-label fw-semibold fs-5">
                          Approval History
                        </label>
                      </div>

                      <div
                        className="table-responsive animate__animated animate__fadeInUp fw-small fs-6"
                        style={{ border: "1px solid", borderRadius: "10px" }}
                      >
                        <table className="table table-bordered table-hover align-middle my-1 overflow-hidden ">
                          <thead>
                            <tr>
                              <th>Level</th>
                              <th>Department</th>
                              <th>ApproverName</th>
                              <th>Remarks</th>
                              <th>Status</th>
                              <th>Date</th>
                            </tr>
                          </thead>
                          <tbody>
                            {history.map((item, index) => (
                              <tr>
                                <td>{item.level_No} </td>
                                <td>{item.role_Name} </td>
                                <td>{item.approver_Name} </td>
                                <td>{item.remarks} </td>
                                <td>{item.status_Name} </td>
                                <td>{item.approval_Date
                                  ? new Date(item.approval_Date).toLocaleDateString()
                                  : "-"}
                                </td>
                              </tr>
                            ))};
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </form>
              </div>
            </div>

            <div ID="dvApproval"
              className="card shadow-sm mx-5 my-3"
              style={{ height: "auto", display: "" }}
            >
              <div
                className="card-body"
                style={{ border: "1px solid", borderRadius: "10px" }}
              >
                <form>
                  <div className="row g-3">
                    {/* <!-- Left Column --> */}
                    <div className="col-lg-7">
                      <div className="mb-3">
                        <label className="form-label fw-semibold fs-5">
                          Approval
                        </label>
                      </div>
                      <div className="row g-2">
                        <div className="col-md-2">
                          <option selected>Status :</option>
                        </div>
                        <div className="col-md-3">
                          <select id="inputState" className="form-select"
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}>
                            <option value="">--Select--</option>
                            <option value="1">Approved</option>
                            <option value="2">Send Back</option>
                          </select>
                          {errors.status && <small className="text-danger">{errors.status}</small>}
                        </div>
                      </div>
                      <div className="mt-3">
                        <input
                          type="text"
                          value={remarks}
                          onChange={(e) => setRemarks(e.target.value)}
                          placeholder="Remarks:"
                          style={{ width: "1120px" }}
                        />
                      </div>

                      <div className="" style={{ width: "auto" }}>
                        <button
                          type="button"
                          className="my-3 align-items-center justify-center mt-3"
                          style={{
                            width: "auto",
                            marginLeft: "80px",
                            borderRadius: "10px",
                          }}
                          onClick={handleSubmit}
                        >
                          Submit
                        </button>
                      </div>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProjectApprovalPending;
