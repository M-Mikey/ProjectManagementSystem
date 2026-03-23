import { useNavigate } from "react-router-dom";
import { useState, useRef } from "react";
import { forgotPasswordApi } from "../api/authService";
import { toast } from "react-toastify";

import "../styles/LoginPage.css";
import "../styles/Common.css";
import Common from "../components/Common/Common";

export default function ForgotPassword() {
  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const userNameRef = useRef(null);
  const [errors, setErrors] = useState({ userName: false, });

  const title = "Forgot Password";
  const user = "Username";
  const placeholder = "Email ID or Employee Code";

  // ✅ Validation using Toast
  const validate = () => {

    let newErrors = { userName: false };
    if (!userName.trim()) {
      toast.error("Username is required");
      newErrors.userName = true;
      setErrors(newErrors);
      userNameRef.current.focus();
      return false;
    }
    setErrors({ userName: false });
    return true;
  };

  const handleOtp = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      setLoading(true);

      const response = await forgotPasswordApi({
        userName: userName.trim(),
      });

      if (response.success) {
        toast.success("OTP sent successfully");

        navigate("/otp-verify", {
          state: {
            userName: userName.trim(),
            ptype: "f"
          }
        });
      } else {
        let newErrors = { userName: false };
        toast.error(response.message || "Invalid Username");
        newErrors.userName = true;
        setErrors(newErrors);
        userNameRef.current.focus();
        return false;

      }
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
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
                {title} <i className="fa fa-user-circle"></i>
              </h2>

              <label>{user}</label>
              <input
                type="text"
                ref={userNameRef}
                placeholder={placeholder}
                value={userName}
                onChange={(e) => {
                  setUserName(e.target.value);
                  setErrors({ ...errors, userName: false }); // remove red when typing
                }}
                className={`form-control ${errors.userName ? "input-error" : ""}`}
              />

              <button
                className="mt-3 mb-2"
                onClick={handleOtp}
                disabled={loading}
              >
                {loading ? "Please wait..." : "Verify OTP"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
