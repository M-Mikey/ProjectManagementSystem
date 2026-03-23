import React, { useEffect, useState } from "react";
import { getUserProfile } from "../api/userApi";
import Topbar from '../components/Navbar/Topbar'
import Navbar from '../components/Navbar/Navbar';
import "./../styles/Profile.css"


const flexGrow = "flex-grow-1";

const Profile = () => {

  const [profileData, setProfileData] = useState(null);
  //const userName = "8607"; // You can make this dynamic later
  const userId = sessionStorage.getItem("userId");

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const data = await getUserProfile(userId);
      setProfileData(data);
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  if (!profileData) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <Topbar />
      <div className="d-flex">
        <Navbar />
        <div className={flexGrow}>
          <div className="container-fluid p-4">

            {/* Profile Card */}
            <div className="card card-custom mb-4">
              <div className="card-body d-flex flex-column flex-md-row gap-4 align-items-start">
                <div className="avatar">
                  {profileData.name
                    ?.split(" ")
                    .map(word => word.charAt(0))
                    .join("")
                    .toUpperCase()}

                </div>

                <div>
                  <h4 className="mb-1">
                    {profileData.name}{" "}
                    <small className="text-muted">
                      [{profileData.userName}]
                    </small>
                  </h4>

                  <h4 className="text-primary mb-2">
                    {profileData.companyName}
                  </h4>

                  <p className="mb-0">{profileData.designation}</p>
                  <p className="mb-0">{profileData.department}</p>
                </div>
              </div>
            </div>

            {/* Approval Authorities */}
            <div className="card card-custom">
              <div className="card-body">
                <h5 className="mb-4">Approval Authorities :</h5>

                {/* Header Row 
                <div className="row fw-bold border-bottom pb-2 mb-2">
                  <div className="col-md-4">Level</div>
                  <div className="col-md-4">Department</div>
                  <div className="col-md-3">Approver Name</div>
                </div>*/}

                {/* Data Rows */}
                {profileData.approvalList?.map((item) => (
                  <div
                    className="row approval-row py-2"
                    key={item.levelNo}
                  >
                    <div className="col-md-4 fw-bold">
                      Level {item.levelNo}
                    </div>

                    <div className="col-md-4">
                      {item.department}
                    </div>

                    <div className="col-md-3">
                      {item.approverName}
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
};

export default Profile;