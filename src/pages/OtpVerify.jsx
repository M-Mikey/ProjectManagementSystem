import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { verifyOtpApi, resendOtpApi } from "../api/authService";
import { toast } from "react-toastify";

import "../styles/LoginPage.css";
import "../styles/Common.css";
import Common from "../components/Common/Common";

export default function OtpVerify() {
  const { state } = useLocation();
  const navigate = useNavigate();

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  const [timer, setTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);

  const otpRef = useRef(null);

  const [errors, setErrors] = useState({
    otp: false,
  });

  const title = "User Verification";
  const ptype = state?.ptype || "";

  // 🔐 Protect Route
  useEffect(() => {
    if (!state?.userName) {
      toast.error("Session expired. Please login again.");
      navigate("/login");
    }
  }, [state, navigate]);

  // ⏳ Countdown Timer
  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);

      return () => clearInterval(interval);
    } else {
      setCanResend(true);
    }
  }, [timer]);

  // ✅ Validation
  const validate = () => {
    let newErrors = { otp: false };

    if (!otp.trim()) {
      toast.error("OTP is required");
      newErrors.otp = true;
      setErrors(newErrors);
      otpRef.current.focus();
      return false;
    }

    if (otp.trim().length !== 6) {
      toast.error("OTP must be 6 digits");
      newErrors.otp = true;
      setErrors(newErrors);
      otpRef.current.focus();
      return false;
    }

    setErrors({ otp: false });
    return true;
  };

  // 🔐 Verify OTP
  const handleVerify = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setLoading(true);

      const response = await verifyOtpApi({
        userName: state.userName,
        otp: otp.trim(),
      });

      if (response?.success) {
    toast.success("OTP verified successfully");

  
    sessionStorage.setItem("userId",    state.userName);
    sessionStorage.setItem("usertype",  response.utype);
    sessionStorage.setItem("userRole",  response.urole);   
    sessionStorage.setItem("userName",  state.userName);   

    if (response.pstatus === "t" || ptype === "f") {
        navigate("/set-password", {
            state: { userName: state.userName },
        });
    } else {
        navigate("/dashboard");
    }
} else {
        toast.error(response?.message || "Invalid OTP");
        setErrors({ otp: true });
        otpRef.current.focus();
      }
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // 🔁 Resend OTP
  const handleResend = async () => {
    if (!canResend) return;

    try {
      setLoading(true);
      setCanResend(false);
      setTimer(30);

      const response = await resendOtpApi({
        userName: state.userName,
      });

      if (response?.success) {
        toast.success("OTP resent successfully");
      } else {
        toast.error(response?.message || "Failed to resend OTP");
      }
    } catch (error) {
      toast.error("Error while resending OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* 🔵 Full Page Loader */}
      {loading && (
        <div className="page-loader">
          <div className="spinner-border text-success"></div>
        </div>
      )}

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

                <label>Username</label>
                <div className="input-row">
                  <input
                    value={state?.userName || ""}
                    disabled
                    className="form-control"
                  />
                </div>

                <label>
                  OTP <i className="fa fa-lock"></i>
                </label>

                <div className="input-row">
                  <input
                    type="text"
                    maxLength={6}
                    ref={otpRef}
                    placeholder="Enter the OTP..."
                    value={otp}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, "");
                      setOtp(value);
                      setErrors({ otp: false });
                    }}
                    className={`form-control ${
                      errors.otp ? "input-error" : ""
                    }`}
                  />
                </div>

                {/* Resend OTP */}
                <div className="resend-section mt-2">
                  {canResend ? (
                    <span
                      onClick={handleResend}
                      style={{
                        cursor: "pointer",
                        color: "#007bff",
                        fontWeight: "500",
                      }}
                    >
                      Resend Code
                    </span>
                  ) : (
                    <span style={{ color: "gray" }}>
                      Resend available in {timer}s
                    </span>
                  )}
                </div>

                <button className="mt-4" onClick={handleVerify}>
                  Continue
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}