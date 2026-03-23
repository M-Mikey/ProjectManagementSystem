import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { setNewPasswordApi } from "../api/authService";

import '../styles/LoginPage.css'
import '../styles/Common.css'
import Common from "../components/Common/Common";


export default function SetNewPassword() {
  const [pwd, setPwd] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();
  //const location = useLocation();
  const { state } = useLocation();


  const submit = async () => {

    // if (!pwd || !confirm) {
    //  alert("Password is required");
    //  return;
    //}

    let validationErrors = {};

    if (!pwd) validationErrors.pwd = true;
    if (!confirm) validationErrors.confirm = true;

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setErrorMsg("Password and Confirm Password are required.");
      return;
    }
    setErrors({});
    setErrorMsg("");


    if (pwd !== confirm) {
      //alert("Passwords do not match");
      //return;

      setErrorMsg("Passwords do not match");
      setErrors({
        pwd: true, confirm: true
      });
      return;
    }



    //  const response = await setNewPasswordApi({ pwd, setPwd });
    const response = await setNewPasswordApi({
      userName: state.userName,
      newPassword: pwd,
    });

    if (response.success) {
      //alert(response.message);
      navigate("/");
    } else {
      // alert(response.message);
      setErrorMsg(response.message);
      setErrors({
        pwd: true, confirm: true
      });
    }
  };

  const title = 'Setup New Password';
  const setpassword = 'Setup Password';
  const placeholder = 'Setup Password';
  const placeholder1 = 'Enter Confirm Password';
  const confpassword = 'Confirm Password';

  return (
    <div>
      <div className="containers">
        {/* <!-- Left Section --> */}
        <Common />

        {/* <!-- Right Section --> */}
        <div className="right">
          <div className="login-box">
            <h2>{title}</h2>

            {errorMsg && <p className="error-text">{errorMsg}</p>}

            <label>{setpassword}</label>

            <input placeholder={placeholder} type="password" onChange={(e) => {
              setPwd(e.target.value);
              setErrors({ ...errors, pwd: false });
            }}
            />

            <label>{confpassword}</label>
          

            <input placeholder={placeholder1} type="confirm_password" 
            onChange={(e) => {
              setConfirm(e.target.value);
              setErrors({ ...errors, confirm: false });
            }}
            />

             <br /><br />
            <button onClick={submit} >Set Password</button>
          </div>
        </div>
      </div>
    </div>
  );
}
