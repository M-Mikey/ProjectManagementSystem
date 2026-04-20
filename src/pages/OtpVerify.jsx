import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef, useCallback } from "react";
import { verifyOtpApi, resendOtpApi } from "../api/authService";
import { toast } from "react-toastify";
import "../styles/LoginPage.css";
import Common from "../components/Common/Common";

// ─── CAPTCHA (same engine as Login) ──────────────────────────────────────────
const CAPTCHA_LENGTH = 6;
const CAPTCHA_CHARS  = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";

function generateCaptchaText() {
  let t = "";
  for (let i = 0; i < CAPTCHA_LENGTH; i++)
    t += CAPTCHA_CHARS[Math.floor(Math.random() * CAPTCHA_CHARS.length)];
  return t;
}

function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

function drawCaptcha(canvas, text) {
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = "#eef0f7"; ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 6; i++) {
    ctx.strokeStyle = `rgba(${rand(80,160)},${rand(80,160)},${rand(80,160)},0.4)`;
    ctx.lineWidth = rand(1,2);
    ctx.beginPath(); ctx.moveTo(rand(0,W),rand(0,H)); ctx.lineTo(rand(0,W),rand(0,H)); ctx.stroke();
  }
  for (let i = 0; i < 40; i++) {
    ctx.fillStyle = `rgba(${rand(0,200)},${rand(0,200)},${rand(0,200)},0.35)`;
    ctx.beginPath(); ctx.arc(rand(0,W),rand(0,H),rand(1,3),0,Math.PI*2); ctx.fill();
  }
  const fonts = ["bold 22px Arial","bold 22px Georgia","bold 21px Verdana"];
  const span  = (W - 20) / CAPTCHA_LENGTH;
  for (let i = 0; i < text.length; i++) {
    ctx.save();
    ctx.font = fonts[i % fonts.length];
    ctx.fillStyle = `rgb(${rand(20,90)},${rand(20,90)},${rand(100,180)})`;
    ctx.translate(10 + i * span + span / 2, H / 2 + rand(-4,6));
    ctx.rotate((rand(-18,18) * Math.PI) / 180);
    ctx.fillText(text[i], -6, 8);
    ctx.restore();
  }
}
// ─────────────────────────────────────────────────────────────────────────────

export default function OtpVerify() {
  const { state } = useLocation();
  const navigate  = useNavigate();
  const ptype     = state?.ptype || "";

  const [otp,      setOtp]      = useState("");
  const [loading,  setLoading]  = useState(false);
  const [timer,    setTimer]    = useState(30);
  const [canResend,setCanResend]= useState(false);
  const [remember, setRemember] = useState(false);
  const [errors,   setErrors]   = useState({ otp: false, captcha: false });

  const [captchaText,  setCaptchaText]  = useState("");
  const [captchaInput, setCaptchaInput] = useState("");
  const [captchaValid, setCaptchaValid] = useState(false);
  const canvasRef = useRef(null);
  const otpRef    = useRef(null);
  const captchaRef= useRef(null);

  // Route guard
  useEffect(() => {
    if (!state?.userName) {
      toast.error("Session expired. Please login again.");
      navigate("/");
    }
  }, [state, navigate]);

  // Countdown
  useEffect(() => {
    if (timer > 0) {
      const id = setInterval(() => setTimer((p) => p - 1), 1000);
      return () => clearInterval(id);
    } else {
      setCanResend(true);
    }
  }, [timer]);

  // CAPTCHA init
  const refreshCaptcha = useCallback(() => {
    const text = generateCaptchaText();
    setCaptchaText(text);
    setCaptchaInput("");
    setCaptchaValid(false);
    requestAnimationFrame(() => drawCaptcha(canvasRef.current, text));
  }, []);

  useEffect(() => { refreshCaptcha(); }, [refreshCaptcha]);
  useEffect(() => { if (captchaText) drawCaptcha(canvasRef.current, captchaText); }, [captchaText]);

  const handleCaptchaInput = (e) => {
    const val = e.target.value;
    setCaptchaInput(val);
    const valid = val === captchaText;
    setCaptchaValid(valid);
    if (valid) setErrors((p) => ({ ...p, captcha: false }));
  };

  const validate = () => {
    if (!otp.trim()) {
      toast.error("OTP is required"); setErrors({ otp: true, captcha: false }); otpRef.current?.focus(); return false;
    }
    if (otp.trim().length !== 6) {
      toast.error("OTP must be 6 digits"); setErrors({ otp: true, captcha: false }); otpRef.current?.focus(); return false;
    }
    if (!captchaValid) {
      if (!captchaInput.trim()) toast.error("Please complete the CAPTCHA");
      else { toast.error("Incorrect CAPTCHA. Please try again."); refreshCaptcha(); }
      setErrors({ otp: false, captcha: true }); captchaRef.current?.focus(); return false;
    }
    setErrors({ otp: false, captcha: false });
    return true;
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      setLoading(true);
      const response = await verifyOtpApi({ userName: state.userName, otp: otp.trim() });
      if (response?.success) {
        toast.success("OTP verified successfully");
        if (response.token) localStorage.setItem("pmToken", response.token);
        sessionStorage.setItem("userId",   state.userName);
        sessionStorage.setItem("userName", state.userName);
        sessionStorage.setItem("usertype", response.utype);
        sessionStorage.setItem("userRole", response.urole);
        if (response.pstatus === "t" || ptype === "f") {
          navigate("/set-password", { state: { userName: state.userName } });
        } else {
          navigate(response.urole === "Admin" ? "/dashboard-admin" : "/dashboard");
        }
      } else {
        toast.error(response?.message || "Invalid OTP");
        setErrors({ otp: true, captcha: false });
        otpRef.current?.focus();
        refreshCaptcha();
      }
    } catch { toast.error("Something went wrong. Please try again."); }
    finally   { setLoading(false); }
  };

  const handleResend = async () => {
    if (!canResend) return;
    try {
      setLoading(true); setCanResend(false); setTimer(30);
      const response = await resendOtpApi({ userName: state.userName });
      if (response?.success) toast.success("OTP resent successfully");
      else toast.error(response?.message || "Failed to resend OTP");
    } catch { toast.error("Error while resending OTP"); }
    finally   { setLoading(false); }
  };

  return (
    <>
      {loading && (
        <div className="page-loader">
          <div className="spinner-border text-success"></div>
        </div>
      )}

      <div className="login-container">
        <Common />

        <div className="right">
          <div className="login-box">
            <h2>Welcome <span style={{ fontSize: "22px" }}>⊙</span></h2>

            {/* Username — readonly with arrow badge */}
            <label>Username</label>
            <div className="input-with-action">
              <input
                value={state?.userName || ""}
                disabled
                style={{ cursor: "not-allowed", color: "#444" }}
              />
              {/* <span className="field-action-btn field-action-static">→</span> */}
            </div>

            {/* OTP — with countdown badge inside field */}
            <label>OTP</label>
            <div className="input-with-badge">
              <input
                ref={otpRef}
                type="text"
                maxLength={6}
                placeholder="Enter the OTP.."
                value={otp}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "");
                  setOtp(val);
                  setErrors((p) => ({ ...p, otp: false }));
                }}
                onKeyDown={(e) => e.key === "Enter" && handleVerify(e)}
                className={errors.otp ? "input-error" : ""}
              />
              <span className="timer-badge">{timer > 0 ? `${timer} s` : "0 s"}</span>
            </div>

            {/* CAPTCHA row */}
            <div className="captcha-row-inline" style={{ marginTop: "16px" }}>
              <canvas
                ref={canvasRef}
                width={140}
                height={44}
                style={{ borderRadius: "6px", border: "1px solid #ccc", flexShrink: 0 }}
                title="CAPTCHA image"
              />
              <button
                type="button"
                onClick={refreshCaptcha}
                title="Refresh CAPTCHA"
                className="captcha-icon-btn"
              >
                ↺
              </button>
              {/* Audio icon — UI only per BRD */}
              <button
                type="button"
                className="captcha-icon-btn"
                title="Listen to CAPTCHA"
                onClick={() => toast.info("Audio CAPTCHA not available")}
              >
                🔊
              </button>
              <input
                ref={captchaRef}
                type="text"
                placeholder="Enter Captcha!"
                value={captchaInput}
                maxLength={CAPTCHA_LENGTH}
                onChange={handleCaptchaInput}
                autoComplete="off"
                style={{ flex: 1, minWidth: 0, marginBottom: 0 }}
                className={errors.captcha ? "input-error" : captchaValid ? "input-valid" : ""}
              />
            </div>

            {/* Remember Me + Resend OTP */}
            <div className="otp-footer-row">
              <label className="remember-label">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  style={{ width: "auto", marginBottom: 0, marginRight: "6px" }}
                />
                Remember Me
              </label>
              <span
                onClick={canResend ? handleResend : undefined}
                className={canResend ? "resend-link" : "resend-link resend-link--disabled"}
                title={canResend ? "Resend OTP" : `Resend available in ${timer}s`}
              >
                Resend OTP
              </span>
            </div>

            <button
              type="button"
              onClick={handleVerify}
              disabled={loading}
              className="btn-continue"
              style={{ marginTop: "20px" }}
            >
              {loading ? "Please wait..." : "Continue"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}