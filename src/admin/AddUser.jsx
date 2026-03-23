import { useState } from "react";
//import { addUser, updateUser } from "../api/userApi";
import { addUser, updateUser } from "../api/userApi";
import { useLocation, useNavigate } from "react-router-dom";
import Topbar from '../components/Navbar/Topbar';
import Navbar from '../components/Navbar/Navbar';



export default function UserForm() {

  const navigate = useNavigate();
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");


  //const [userstatus, setUserstatus] = useState("");
  //const [userstype, setUserstype] = useState("");

  const { state } = useLocation();

  const [form, setForm] = useState(() => {
    if (!state) return { status: "Y" };

    return {
      ...state,
      status: "Y", // 🔒 fixed to Active
    };
  });


  //const [form, setForm] = useState(state || {});
  //const [form, setForm] = useState(() => {
  //if (!state) return {};

  // return {
  //  ...state,
  //  status:
  // state.status === "Y" || state.status === true || state.status === "Active"
  //  ? "Y"
  //   : state.status === "N" || state.status === false || state.status === "Inactive"
  //   ? "N"
  //   : "",
  // };
  // });

  const validate = () => {
    const newErrors = {};

    // Email regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const mobileRegex = /^[6-9]\d{9}$/;

    if (!form.userName) newErrors.userName = "User Name is required";
    if (!form.name) newErrors.name = "Name is required";


    if (!form.emailId) { newErrors.emailId = "Email is required"; }
    else if (!emailRegex.test(form.emailId)) {
      newErrors.emailId = "Invalid email format";
    }

    if (!form.mobileNo) { newErrors.mobileNo = "Mobile Number is required"; }
    else if (!mobileRegex.test(form.mobileNo)) {
      newErrors.mobileNo = "Enter valid 10-digit mobile number";
    }



    if (!form.userType) newErrors.userType = "User Type is required";
    //if (!form.status) newErrors.status = "Status is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };


  const save = async () => {
    if (!validate()) return;
    try {
      if (state) {
        //await updateUser(form);
        await addUser(form);
        setMessage("User updated successfully");
      } else {
        await addUser(form);
        setMessage("User added successfully");
      }
      //navigate("/dashboard-admin");
      setMessageType("success");

      // Optional: redirect after 2 seconds
      setTimeout(() => {
        navigate("/dashboard-admin");
      }, 2000);


    } catch (err) {
      console.error(err);
      setMessage("Something went wrong");
      setMessageType("error");
    }
  };

  return (
    <div className="app-container">
      <Topbar />
      <div className="main-layout ">

        {/* Content */}
        <main className="content rounded">
          <h2>Add User</h2>

          <div className="form-card">

            {message && (
              <div
                className={`alert ${messageType === "success" ? "alert-success" : "alert-danger"
                  }`}
              >
                {message}
              </div>
            )}

            <div className="row">
              <div className="form-group">
                <label>User Name</label>
                <input value={form.userName || ""} disabled={!!state}
                  onChange={e => setForm({ ...form, userName: e.target.value })} />
                {errors.userName && <small className="text-danger">{errors.userName}</small>}
              </div>

              <div className="form-group">
                <label>Name</label>
                <input
                  value={form.name || ""}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                />
                {errors.name && <small className="text-danger">{errors.name}</small>}
              </div>
            </div>

            <div className="row">
              <div className="form-group">
                <label>Email</label>
                <input value={form.emailId || ""} disabled={!!state}
                  onChange={e => setForm({ ...form, emailId: e.target.value })} />
                {errors.emailId && <small className="text-danger">{errors.emailId}</small>}
              </div>

              <div className="form-group">
                <label>Mobile Number</label>
                <input
                type="number"
                  value={form.mobileNo || ""} disabled={!!state}
                  onChange={e => setForm({ ...form, mobileNo: e.target.value })}
                />
                {errors.mobileNo && <small className="text-danger">{errors.mobileNo}</small>}
              </div>
            </div>
            <div className="row">
              <div className="form-group">
                <label>Type</label>
                <select
                  className="form-control"
                  value={form.userType || ""} disabled={!!state}
                  onChange={(e) =>
                    setForm({ ...form, userType: e.target.value })
                  }
                >
                  <option value="">Select User Type</option>
                  <option value="admin">Admin</option>
                  <option value="Internal">Internal</option>
                  <option value="External">External</option>
                </select>
                {errors.userType && <small className="text-danger">{errors.userType}</small>}

              </div>

              <div className="form-group">


              </div>
            </div>

            <div className="btn-wrap d-flex justify-content-end">
              <button type="button" className="primary-btn" onClick={save}>
                Save
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>

  );
}
