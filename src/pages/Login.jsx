import { useState, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { loginApi } from "../api/authService";
import { toast } from "react-toastify";
import "../styles/LoginPage.css";
import Common from "../components/Common/Common";
import { CgProfile } from "react-icons/cg";


export default function Login() {
  const [userName,     setUserName]     = useState("");
  const [password,     setPassword]     = useState("");
  const [loading,      setLoading]      = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [capsLockOn,   setCapsLockOn]   = useState(false);

  const [errors, setErrors] = useState({ userName: false, password: false });
  const userNameRef  = useRef(null);
  const passwordRef  = useRef(null);
  const navigate     = useNavigate();

  useEffect(() => {
    const h = (e) => { if (e.key === "Enter" && !loading) handleLogin(e); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [userName, password, loading]); // eslint-disable-line

  useEffect(() => {
    const h = (e) => { if (e.getModifierState) setCapsLockOn(e.getModifierState("CapsLock")); };
    window.addEventListener("keydown", h); window.addEventListener("keyup", h);
    return () => { window.removeEventListener("keydown", h); window.removeEventListener("keyup", h); };
  }, []);
  const validate = () => {
    const e = { userName: false, password: false };
    if (!userName.trim()) {
      toast.error("Username is required"); e.userName = true; setErrors(e); userNameRef.current?.focus(); return false;
    }
    if (!password.trim()) {
      toast.error("Password is required"); e.password = true; setErrors(e); passwordRef.current?.focus(); return false;
    }
    if (userName.trim().toLowerCase() === password.trim().toLowerCase()) {
      toast.error("Username and Password cannot be the same"); e.password = true; setErrors(e); passwordRef.current?.focus(); return false;
    }
    if (password.trim().length < 8) {
      toast.error("Password must be at least 8 characters"); e.password = true; setErrors(e); passwordRef.current?.focus(); return false;
    }
    setErrors({ userName: false, password: false });
    return true;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      setLoading(true);
      const response = await loginApi({ userName: userName.trim(), password: password.trim() });
      if (response.success) {
        toast.success("Login successful. OTP sent.");
        navigate("/otp-verify", { state: { userName: response.username } });
      } else {
        const err = { userName: false, password: false };
        switch (response.message) {
          case "0": toast.error("Invalid user"); err.userName = true; setErrors(err); userNameRef.current?.focus(); break;
          case "2": toast.error("Invalid password"); err.password = true; setErrors(err); passwordRef.current?.focus(); break;
          case "3": toast.error("Account locked after 10 failed attempts"); break;
          case "5": toast.error("Account is already locked. Please contact administrator."); break;
          default:  toast.error(response.message);
        }
      }
    } catch { toast.error("Something went wrong. Please try again."); }
    finally { setLoading(false); }
  };

  return (
    <div className="login-container">
      <Common />

      <div className="right">
        <div className="login-box">
          <h2>Welcome <CgProfile className="profile-icon" /></h2>

          {/* Username */}
          <label>Username</label>
          <input
              ref={userNameRef}
              type="text"
              placeholder="Enter Email Id or Employee Code"
              value={userName}
              maxLength={20}
              onChange={(e) => {
                const val = e.target.value;
                if (val.startsWith(" ")) return;
                setUserName(val);
                setErrors((p) => ({ ...p, userName: false }));
              }}
              className={errors.userName ? "input-error" : ""}
            />

          {/* Password */}
          <label>Password</label>
          <div className="password-field">
            <input
              ref={passwordRef}
              type={showPassword ? "text" : "password"}
              placeholder="Enter Password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setErrors((p) => ({ ...p, password: false })); }}
              className={errors.password ? "input-error" : ""}
            />
            <span className="password-toggle" onClick={() => setShowPassword(!showPassword)} title={showPassword ? "Hide" : "Show"}>
              {showPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                  <line x1="1" y1="1" x2="23" y2="23"/>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              )}
            </span>
          </div>

          {capsLockOn && (
            <p style={{ color: "#e65100", fontSize: "0.8rem", textAlign: "left", cursor: "default", marginTop: "4px" }}>
              ⇧ Caps Lock is ON
            </p>
          )}

          <button type="button" onClick={handleLogin} disabled={loading} className="btn-continue">
            {loading ? "Please wait..." : "Continue"}
          </button>

          <div style={{ textAlign: "center", marginTop: "12px" }}>
            <Link to="/forgot-password" style={{ color: "#1e4fa3", fontSize: "14px" }}>Forgot Password</Link>
          </div>
        </div>
      </div>
    </div>
  );
}