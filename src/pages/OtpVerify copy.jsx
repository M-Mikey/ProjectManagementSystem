import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { verifyOtpApi } from "../api/authService";
import { toast } from "react-toastify";

import "../styles/LoginPage.css";
import "../styles/Common.css";
import Common from "../components/Common/Common";

export default function OtpVerify() {
  const { state } = useLocation();
  const navigate = useNavigate();

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  const userNameRef = useRef(null);
  const passwordRef = useRef(null);
  const [errors, setErrors] = useState({ userName: false, password: false, });

  const title = "User Verification";
  const user = "Username";
  const otps = "OTP";
  const placeholder1 = "Enter the OTP...";

  // 🔐 Protect route
  useEffect(() => {
    if (!state?.userName) {
      toast.error("Session expired. Please login again.");
      navigate("/login");
    }
  }, [state, navigate]);

  // ✅ Validation
  const validate = () => {
    let newErrors = { userName: false, password: false };

    if (!otp.trim()) {
      toast.error("OTP is required");
      newErrors.password = true;
      setErrors(newErrors);
      passwordRef.current.focus();
      return false;
    }

    if (otp.trim().length < 5) {
      toast.error("Invalid OTP");
      newErrors.password = true;
      setErrors(newErrors);
      passwordRef.current.focus();
      return false;
    }
    setErrors({ userName: false, password: false });
    return true;
  };

  const handleVerify = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      setLoading(true);

      const response = await verifyOtpApi({
        userName: state.userName,
        otp: otp.trim(), // keep as string
      });

       let newErrors = { userName: false, password: false };

      if (response?.success) {
        toast.success("OTP verified successfully");

        sessionStorage.setItem("userId", state.userName);
        sessionStorage.setItem("usertype", response.utype);

       

        if (response.pstatus === "t") {
          navigate("/set-password", {
            state: { userName: state.userName },
          });
        } else {
          navigate("/dashboard");
        }
      } else {


        toast.error(response?.message || "Invalid OTP");
        newErrors.password = true;
        setErrors(newErrors);
        passwordRef.current.focus();
        return false;
        setErrors({ userName: false, password: false });
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
              <div className="input-row">
                <input
                  value={state?.userName || ""}
                  disabled
                  className="form-control"
                />
              </div>

              <label>
                {otps} <i className="fa fa-lock"></i>
              </label>
              <div className="input-row">
                <input
                  type="number"   // 🔥 use text, not number (important!)
                  ref={passwordRef}
                  placeholder={placeholder1}
                  value={otp}
                  onChange={(e) => {
                    setOtp(e.target.value);
                    setErrors({ ...errors, password: false }); // remove red when typing
                  }}
                  className={`form-control ${errors.password ? "input-error" : ""}`}
                />
              </div>
              <Link to="/resendAPI" >Resend Code</Link>
              <button
                className="mt-4"
                onClick={handleVerify}
                disabled={loading}
              >
                {loading ? "Verifying..." : "Continue"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
