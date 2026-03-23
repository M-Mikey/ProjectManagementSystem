import { useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { setNewPasswordApi } from "../api/authService";
import { toast } from "react-toastify";

import "../styles/LoginPage.css";
import "../styles/Common.css";
import Common from "../components/Common/Common";

export default function SetNewPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const passwordRef = useRef(null);
  const confirmPasswordRef = useRef(null);

  const [errors, setErrors] = useState({
    password: false,
    confirmPassword: false,
  });

  const navigate = useNavigate();
  const { state } = useLocation();
  const userName = state?.userName || "";

  const validate = () => {
    let newErrors = { password: false, confirmPassword: false };

    if (!password) {
      toast.warning("Please Enter New Password");
      newErrors.password = true;
      setErrors(newErrors);
      passwordRef.current.focus();
      return false;
    }

    if (!confirmPassword) {
      toast.warning("Please Enter Confirm Password");
      newErrors.confirmPassword = true;
      setErrors(newErrors);
      confirmPasswordRef.current.focus();
      return false;
    }


    if (password.length < 8) {
      toast.warning("Password must be at least 8 characters");
      newErrors.password = true;
      setErrors(newErrors);
      passwordRef.current.focus();
      return false;
    }

    if (password.toLowerCase() === userName.toLowerCase()) {
      toast.warning("Password must not match User ID");
      newErrors.password = true;
      setErrors(newErrors);
      passwordRef.current.focus();
      return false;
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/;

    if (!passwordRegex.test(password)) {
      toast.warning(
        "Password must include uppercase, lowercase and numeric characters"
      );
      newErrors.password = true;
      setErrors(newErrors);
      passwordRef.current.focus();
      return false;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      newErrors.confirmPassword = true;
      setErrors(newErrors);
      confirmPasswordRef.current.focus();
      return false;
    }

    setErrors({ password: false, confirmPassword: false });
    return true;
  };

  const submit = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    if (!userName) {
      toast.error("Session expired. Please try again.");
      navigate("/");
      return;
    }

    try {
      const response = await setNewPasswordApi({
        userName: userName,
        newPassword: password,
      });

      if (response.success) {
        toast.success(response.message || "Password updated successfully");
        navigate("/");
      } else {
        toast.error(response.message || "Something went wrong");
      }
    } catch (error) {
      toast.error("Server error. Please try again.");
    }
  };

  return (
    <div className="login-container">
      <div className="row">
        <div className="col-lg-6 col-md-6 col-12">
          <Common />
        </div>

        <div className="col-lg-6 col-md-6 col-12">
          <div className="right">
            <div className="login-box">
              <h2>
                Setup New Password <i className="fa fa-lock"></i>
              </h2>

              <label>New Password</label>
              <div className="password-input-wrapper" style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"} // Toggle type
                  ref={passwordRef}
                  placeholder="Enter New Password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setErrors({ ...errors, password: false });
                  }}
                  className={`form-control ${errors.password ? "input-error" : ""
                    }`}
                />
                <i
                  className={`fa ${showPassword ? "fa-eye-slash" : "fa-eye"} password-icon`}
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: "absolute", right: "10px", top: "12px", cursor: "pointer" }}
                ></i>
              </div>

              <label>Confirm Password</label>
              <div className="password-input-wrapper" style={{ position: "relative" }}>
                <input
                   type={showConfirmPassword ? "text" : "password"}
                  ref={confirmPasswordRef}
                  placeholder="Enter Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setErrors({ ...errors, confirmPassword: false });
                  }}
                  className={`form-control ${errors.confirmPassword ? "input-error" : ""
                    }`}
                />
                <i
                  className={`fa ${showConfirmPassword ? "fa-eye-slash" : "fa-eye"} password-icon`}
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{ position: "absolute", right: "10px", top: "12px", cursor: "pointer" }}
                ></i>
              </div>
              <button onClick={submit}>Set Password</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
