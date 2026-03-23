import React, { useState } from 'react'
import "../components/Navbar/Navbar.css";
//import { icon } from '../../components/Common/Data';
import { Link } from 'react-router-dom';
import Topbar from '../components/Navbar/Topbar';




const UserNavbar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const icon = [
    "bi bi-house",
    "bi bi-list-task"
  ];

  return (
    <>
      <div className={`sidebar p-3 ${collapsed ? "collapsed" : ""}`}>

        {/* Toggle Button */}
        <div className="mb-4 mx-3">
          <i
            className={`bi ${collapsed ? "bi-list" : "bi-x-lg"} sidebar-toggle`}
            onClick={() => setCollapsed(!collapsed)}
          ></i>
        </div>

        <Link to="/user_dashboard">
          <i className={icon[2]}></i>
          <span>Home</span>
        </Link>  
       
      </div>

    </>
  )
}

export function Task() {
  return (
    <>
      <Topbar />
      <div className="d-flex">
        <UserNavbar />
        <div className="main">
          <h1 className="mt-3">Task Page</h1>
        </div></div>
    </>
  )
}

export default UserNavbar
