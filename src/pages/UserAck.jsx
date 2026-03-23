import React from "react";
import Topbar from "../../components/Navbar/Topbar.jsx";
import "../../assets/styles/Common.css";
import { Link } from "react-router-dom";
import LeftNavbar from "../../components/Navbar/LeftNavbar.jsx";

const data = [
  {
    Edit: "",
    MilestoneName: "J0 and J1 Evaluation",
    Description: "Preparation of ppt",
    DueDate: "5-Sep-2025",
    Priority: "Medium",
    ApprovalLevel: "Medium",
    AssignedTo: "Vineet",
  },
];

const project = [
  {
    TaskDescription: "Scrap Management System",
    Description: "Digitilization of manual Scrap Management System",
    TaskDuedate: "5 Seр 2025",
    ProjectLPL: "Priyansh",
    HSDM_CR_Package: "HSDM",
    ProjectApprovalLevel: "Level 1 - Priyansh",
    Category: "High",
    AssignedBy: "Vineet Srivastava",
    AssignedTo: "Priyansh Saxena",
    Assigneddate: "10 Aug 2025",
    RemarkDate: ["2-sep-2025", "27-nov-2025", "22-sep-2025"],
    Status: ["Pending", "In-Progress", "Completed,"],
    Remarks: [
      "Kindly approve the project.",
      "Feedback incorporation done. Attached Document",
      "Everything done.",
    ],
  },
];

const hod = [
  {
    Level: "Level 1",
    DepartmentHead: "Vineet Srivastava [8607]",
    Ok: "ok",
    Status: "Approved",
    Date: "25-Jul-26",
  },
  {
    Level: "Level 2",
    DepartmentHead: "Amit Taneja [4875]",
    Ok: "ok",
    Status: "Send Back",
    Date: "26-Jul-26",
  },
];

const UserAck = () => {
  return (
    <>
      <Topbar />

      <div className="d-flex">
        <LeftNavbar />

        <div
          className="main mt-2"
          style={{ width: "1800px", height: "auto" }}
        >
          <div className="container-fluid py-4">
            <h2 className="mx-5">Scrap Management System</h2>

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
                          Milestone: Jo and J1 Evaluation with artefacts
                        </label>
                      </div>

                      <div
                        className="table-responsive overflow-hidden">
                        <table className="table table-bordered border-dark table-hover align-middle my-1">
                          <thead className="table-dark">
                            <tr>
                              <th>Milestone Name</th>
                              <th>Description</th>
                              <th>Due Date</th>
                              <th>Priority</th>
                              <th>Approval Level</th>
                              <th>Assigned To</th>
                            </tr>
                          </thead>
                          <tbody>
                            {data.map((val, key) => {
                              return (
                                <tr key={key}>
                                  <td>{val.MilestoneName}</td>
                                  <td>{val.Description}</td>
                                  <td>{val.DueDate}</td>
                                  <td>{val.Priority}</td>
                                  <td>{val.ApprovalLevel}</td>
                                  <td>{val.AssignedTo}</td>
                                </tr>
                              );
                            })}
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
                    {project.map((val) => {
                      return (
                        <div className="col-lg-9">
                          <div className="mb-0">
                            <label className="form-label fw-semibold">
                              {" "}
                              Project: {val.TaskDescription}
                            </label>
                          </div>

                          <div className="mb-0">
                            <label className="form-label fw-semibold">
                              Purpose: {val.Description}
                            </label>
                          </div>

                          <div className="mb-0">
                            <label className="form-label fw-semibold">
                              Due Date: {val.TaskDuedate}
                            </label>
                          </div>
                          <div className="mb-0">
                            <label className="form-label fw-semibold ">
                              Project LPL: {val.ProjectLPL}
                            </label>
                          </div>
                          <div className="mb-0">
                            <label className="form-label fw-semibold">
                              HSDM/CR/Package: {val.HSDM_CR_Package}
                            </label>
                          </div>
                          <div className="mb-0">
                            <label className="form-label fw-semibold">
                              Project Approval Level: {val.ProjectApprovalLevel}
                            </label>
                          </div>
                        </div>
                      );
                    })}
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
                    <div className="col-lg-7">
                      <div className="mb-3">
                        <label className="form-label fw-semibold fs-5">
                          Acknowledge
                        </label>
                      </div>
                      <div className="row g-2">
                        <div className="col-md-2">
                          <option selected>Status :</option>
                        </div>

                        <div className="col-md-3">
                          <select id="inputState" className="form-select">
                            <option selected>-Select--</option>
                            <option>Acknowledge</option>
                            <option>Hold</option>
                          </select>
                        </div>
                      </div>
                      <div className="mt-3">
                        <input
                          type="text"
                          placeholder="Remarks:"
                          style={{ width: "1120px" }}
                        />
                      </div>

                      <div className="" style={{ width: "auto" }}>
                        <button
                          type="btn"
                          className="my-3 align-items-center justify-center mt-3"
                          style={{
                            width: "auto",
                            marginLeft: "80px",
                            borderRadius: "10px",
                          }}
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

export default UserAck;
