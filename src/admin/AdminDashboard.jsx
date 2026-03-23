import { useEffect, useCallback, useState } from "react";
import { Link, useNavigate, Navigate } from 'react-router-dom';
import Topbar from '../components/Navbar/Topbar';
import Navbar from '../components/Navbar/Navbar';
import { getUsers } from "../api/userApi";
import UserSearch from '../components/Common/UserSearch';
import "../styles/AdminDashboard.css";
const icon = "bi bi-pencil-square";
//const icons = "bi bi-trash";

export default function UserList() {
  const navigate = useNavigate();
  const userId = sessionStorage.getItem("userId");
   const userType = sessionStorage.getItem("usertype");

  const [filters, setFilters] = useState({
    userName: "",
    userType: "",
    status: ""
  });

  const [users, setUsers] = useState([]);
  const nav = useNavigate();

  //const load = () => getUsers(filters).then(setUsers); 

  const handleUserSelect = (user) => {
    console.log("Selected User:", user.userName);
    setFilters(prev => ({
      ...prev,
      userName: user.userName
    }));
  };

  const load = useCallback(() => {
    getUsers(filters).then(setUsers);
  }, [filters]);


  useEffect(() => {
    if (!userId) {
      navigate("/", { replace: true });
      return;
    }

    load();
  }, [load]);


  const handleSearch = async () => {
    const data = await getUsers(filters);
    setUsers(data);
  };


  const handleClear = () => {
    const clearedFilters = {
      userName: "",
      userType: "",
      status: ""
    };

    setFilters(clearedFilters);
    getUsers(clearedFilters).then(setUsers);
  };
  const userTypes = [
    { id: "Internal", label: "Internal" },
    { id: "External", label: "External" },
    { id: "admin", label: "admin" }
  ];

  const userStatus = [
    { id: "Y", label: "Active" },
    { id: "N", label: "InActive" }
  ];

  return (
    <>
      <Topbar />

      <div className="d-flex login-wrapper">
        <div className="container-fluid mt-4">


          <div className="card shadow-sm mb-3" style={{ border: "2px solid #0b2a5b", height: "100%" }} >
            {/* ===== Filters ===== */}
            <div className="p-3 border-bottom border-bottom rounded">
              <div className="row g-3 align-items-end">

                <div className="col-12 col-md-4 col-lg-3">
                  <label className="form-label">
                    <i className="bi bi-person-fill me-1"></i> <b> Username</b>
                  </label>

                  <UserSearch onUserSelect={handleUserSelect} />
                </div>

                <div className="col-12 col-md-4 col-lg-3">
                  <label className="form-label">
                    <i className="bi bi-people-fill me-1"></i>  <b>User Type</b>
                  </label>
                  <select
                    className="form-select"
                    value={filters.userType}
                    onChange={e =>
                      setFilters({ ...filters, userType: e.target.value })
                    }
                  >
                    <option value="">Select Types</option>
                    {userTypes.map(t => (
                      <option key={t.id} value={t.id}>{t.label}</option>
                    ))}
                  </select>
                </div>

                <div className="col-12 col-md-4 col-lg-3">
                  <label className="form-label">
                    <i className="bi bi-toggle-on me-1"></i><b> Status</b>
                  </label>
                  <select
                    className="form-select"
                    value={filters.status}
                    onChange={e =>
                      setFilters({ ...filters, status: e.target.value })
                    }
                  >
                    <option value="">Select Status</option>
                    {userStatus.map(t => (
                      <option key={t.id} value={t.id}>{t.label}</option>
                    ))}
                  </select>
                </div>

                <div className="col-auto ms-auto d-flex gap-2">
                  <button
                    className="primary-btn"
                    onClick={handleSearch}
                  >
                    <b>Search</b>
                  </button>

                  <button
                    className="primary-btn"
                    onClick={handleClear}
                  >
                    <b>Clear</b>
                  </button>

                </div>

              </div>
            </div>


            {/* ================= USER LIST PANEL ================= */}


            {/* ===== Header ===== */}
            <div className="d-flex align-items-center px-3 py-2 border-bottom user-list-header mx-3 rounded">
              <b>User&apos;s List</b>

              <Link
                to="/adduser"
                className="btn btn-success btn-sm text-black ms-auto action-btn" style={{ minWidth: "150px" }}
              >
                <b>Create User</b>
              </Link>
            </div>

            {/* ================= TABLE ================= */}
            <div className="p-3">
              <div className="table-responsive animate__animated animate__fadeInUp">
                <table className="table table-bordered table-hover align-middle user-table mb-0">
                  <thead className="table-light">
                    <tr>
                      <th className="text-center col-edit">Edit</th>
                      <th className="col-username">UserName</th>
                      <th class="col-name">Name</th>
                      <th class="col-email">Email</th>
                      <th class="col-mobile">Mobile</th>
                      <th class="col-type">User Type</th>
                      <th class="col-status"> Status</th>
                    </tr>
                  </thead>

                  <tbody>
                    {users?.length > 0 ? (
                      users.map(u => (
                        <tr key={u.userName}>
                          <td className="text-center">
                            <Link
                              to="/editUser"
                              state={u}
                              className="btn btn-sm btn-outline-primary"
                            >
                              <i className="bi bi-pencil-square"></i>
                            </Link>
                          </td>
                          <td>{u.userName}</td>
                          <td>{u.name}</td>
                          <td>{u.emailId}</td>
                          <td>{u.mobileNo}</td>
                          <td>{u.userType}</td>
                          <td>
                            <span
                              className={`badge ${u.status === "Active" ? "bg-success" : "bg-danger"
                                }`}
                            >
                              {u.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7" className="text-center text-muted">
                          No users found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );

}







