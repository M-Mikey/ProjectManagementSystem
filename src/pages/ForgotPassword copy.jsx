import { useNavigate,Link } from "react-router-dom";
import { useState } from "react";
import { forgotPasswordApi } from "../api/authService";

import '../styles/LoginPage.css'
import '../styles/Common.css'
import Common from "../components/Common/Common";


export default function ForgotPassword() {
  const [userName, setUserName] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  const handleOtp = async () => {
   
    let validationErrors = {};

    if (!userName) validationErrors.userName = true;

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setErrorMsg("Please enter Username.");
      return;
    }
    setErrors({});
    setErrorMsg("");
    const response = await forgotPasswordApi({ userName });

    if (response.success) {
      navigate("/otp-verify", {
        state: {
          userName: userName
        }
      });
    } else {    
      setErrorMsg(response.message || "Invalid Username");
      setErrors({
        userName: true
      });
    }
  };

  const title = 'Forgot Password';
  const user = 'Username';
  const placeholder = 'Email ID or Employee Code';
  const placeholder1 = 'Enter OTP Password';

  return (
    <div>
      <div className="containers">
        {/* <!-- Left Section --> */}
        <Common />

        {/* <!-- Right Section --> */}
        <div className="right">
          <div className="login-box">
            <h2> {title} <i className="fa fa-user-circle"></i></h2>

            {errorMsg && <p className="error-text">{errorMsg}</p>}

            <label>{user}</label>

            <input
              type="text"
              placeholder={placeholder}
              value={userName}
              onChange={(e) => {
                setUserName(e.target.value)
                setErrors({ ...errors, userName: false });
              }}
            />
          <br /><br />
            <button onClick={handleOtp} >Verify OTP</button> <br /><br />

            <button  > <Link to="/Login" >Cancel</Link></button>
          </div>
        </div>
      </div>
    </div>
  );
}
