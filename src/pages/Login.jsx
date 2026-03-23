import { useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { loginApi } from "../api/authService";
import { toast } from "react-toastify";


import "../styles/LoginPage.css";
import Common from "../components/Common/Common";

export default function Login() {
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const title = "Welcome";
  const passwordLabel = "Password";
  const placeholder1 = "Enter Password";
  const placeholder2 = "Enter Email Id or Employee Code";
  const forgotpassword = "Forgot Password";

  const userNameRef = useRef(null);
  const passwordRef = useRef(null);
  const [errors, setErrors] = useState({ userName: false, password: false, });

  const navigate = useNavigate();

  // ✅ Validation with Toast
  const validate = () => {
    let newErrors = { userName: false, password: false };

    if (!userName.trim()) {
      toast.error("Username is required");
      newErrors.userName = true;
      setErrors(newErrors);
      userNameRef.current.focus();
      return false;
    }

    if (!password.trim()) {
      toast.error("Password is required");
      newErrors.password = true;
      setErrors(newErrors);
      passwordRef.current.focus();
      return false;
    }
    // ✅ Username and Password should not be same
    if (userName.trim().toLowerCase() === password.trim().toLowerCase()) {
      toast.error("Username and Password cannot be the same");
      newErrors.password = true;
      setErrors(newErrors);
      passwordRef.current.focus();
      return false;
    }

    if (password.trim().length < 8) {
      toast.error("Password must be at least 8 characters");
      newErrors.password = true;
      setErrors(newErrors);
      passwordRef.current.focus();
      return false;
    }
    setErrors({ userName: false, password: false });
    return true;
  };

  // ✅ Login Handler
  const handleLogin = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      setLoading(true);

      const response = await loginApi({
        userName: userName.trim(),
        password: password.trim(),
      });

      if (response.success) {
        toast.success("Login successful. OTP sent.");

        navigate("/otp-verify", {
          state: { userName: response.username },
        });
      } else {
        //toast.error(response.message || "Invalid Username or Password");

        let newErrors = { userName: false, password: false };
        if (response.message === "0") {
          toast.error("Invalid user");
          newErrors.userName = true;
          setErrors(newErrors);
          userNameRef.current.focus();
          return false;

        } else if (response.message === "2") {
          toast.error("Invalid password");
          newErrors.password = true;
          setErrors(newErrors);
          passwordRef.current.focus();
          return false;

        }
        else if (response.message === "3") {
          toast.error("Account locked after 10 failed attempts");
          return false;
        }
        else if (response.message === "5") {
          toast.error("Account is already locked. Please contact administrator.");
          return false;
        }
        else {
          toast.error(response.message);
          return false;
        }
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
              <h2>{title} <i className="fa fa-user-circle"></i> </h2>

              <label>Username</label>
              <input
                ref={userNameRef}
                type="text"
                placeholder={placeholder2}
                value={userName}
                onChange={(e) => {
                  setUserName(e.target.value);
                  setErrors({ ...errors, userName: false }); // remove red when typing
                }}
                className={`form-control ${errors.userName ? "input-error" : ""}`}
              />

              <label>
                {passwordLabel} <i className="fa fa-lock"></i>
              </label>
              <div className="password-field">

                <input
                  type={showPassword ? "text" : "password"}
                  ref={passwordRef}
                  placeholder={placeholder1}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setErrors({ ...errors, password: false });
                  }}
                  className={`form-control ${errors.password ? "input-error" : ""}`}
                />

                <span
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <i className={`fa ${showPassword ? "fa-eye-slash" : "fa-eye"}`}></i>
                </span>

              </div>
              <button
                type="button"
                onClick={handleLogin}
                disabled={loading}
                className="mb-2"
              >
                {loading ? "Please wait..." : "Continue"}
              </button>

              <Link to="/forgot-password">{forgotpassword}</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
