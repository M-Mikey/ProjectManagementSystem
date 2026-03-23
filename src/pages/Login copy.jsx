import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { loginApi } from "../api/authService";

import "../styles/LoginPage.css";
import "../styles/Common.css";
import Common from "../components/Common/Common";

export default function Login() {
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleLogin = async () => {
    let validationErrors = {};

    if (!userName.trim()) validationErrors.userName = true;
    if (!password.trim()) validationErrors.password = true;

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setErrorMsg("Please enter Username and Password to continue.");
      return;
    }

    setErrors({});
    setErrorMsg("");
    setLoading(true);

    const response = await loginApi({
      userName: userName.trim(),
      password: password.trim()
    });

    setLoading(false);

    if (response.success) {
      navigate("/otp-verify", {
        state: {
          userName: response.username
        }
      });
    } else {
      console.log("Username",response.message)
      setErrorMsg(response.message || "Invalid Username or Password");
      setErrors({
        userName: true,
        password: true
      });
    }
  };

  const title = 'Welcome';
  const pasword = 'Password';
  const placeholder1 = 'Enter Password';
  const placeholder2 = 'Enter Email Id or Employee Code';
  const forgotpassword = 'Forgot Password';

  return (
    <div className="containers">
      {/* Left Section */}
      <Common />

      {/* Right Section */}
      <div className="right">
        <div className="login-box">
          <h2>
            Welcome <i className="fa fa-user-circle"></i>
          </h2>

          {errorMsg && <p className="error-text">{errorMsg}</p>}

          <label>Username</label>
          <input
            type="text"
            className={errors.userName ? "input-error" : "form-control"}
            placeholder="Email ID or Employee Code"
            value={userName}
            onChange={(e) => {
              setUserName(e.target.value);
              setErrors({ ...errors, userName: false });
            }}
          />

          <label>Password</label>
          <input
            type="password"
            className={errors.password ? "input-error" : "form-control"}
            placeholder="Enter Password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setErrors({ ...errors, password: false });
            }}
          />

          <br />

          <button
            onClick={handleLogin}
            className="btn-primary"
            disabled={loading}
          >
            {loading ? "Please wait..." : "Continue"}
          </button>

          <br />
          <br />

          <Link to="/forgot-password">Forgot Password</Link>
        </div>
      </div>
    </div>
  );
}
