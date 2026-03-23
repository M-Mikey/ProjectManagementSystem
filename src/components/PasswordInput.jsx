import { useState } from "react";

export default function PasswordInput({
    value,
    onChange,
    placeholder,
    inputRef,
    error
}) {

    const [showPassword, setShowPassword] = useState(false);
    const [capsLock, setCapsLock] = useState(false);

    const checkCapsLock = (e) => {
        setCapsLock(e.getModifierState("CapsLock"));
    };

    // Password Strength
    const getStrength = (password) => {
        if (!password) return "";

        let strength = 0;

        if (password.length >= 8) strength++;
        if (/[A-Z]/.test(password)) strength++;
        if (/[0-9]/.test(password)) strength++;
        if (/[^A-Za-z0-9]/.test(password)) strength++;

        if (strength <= 1) return "Weak";
        if (strength === 2) return "Medium";
        if (strength >= 3) return "Strong";
    };

    const strength = getStrength(value);

    return (
        <div className="password-wrapper">

            <input
                type={showPassword ? "text" : "password"}
                ref={inputRef}
                value={value}
                placeholder={placeholder}
                onChange={onChange}
                onKeyUp={checkCapsLock}
                className={`form-control ${error ? "input-error" : ""}`}
            />

            <span
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
            >
                <i className={`fa ${showPassword ? "fa-eye-slash" : "fa-eye"}`}></i>
            </span>

            {capsLock && (
                <div className="caps-warning">
                    ⚠ Caps Lock is ON
                </div>
            )}

            {value && (
                <div className={`strength strength-${strength}`}>
                    Password Strength: {strength}
                </div>
            )}

        </div>
    );
}




{/** call in create password page
 <PasswordInput
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrors({ ...errors, password: false });
                }}
                placeholder={placeholder1}
                inputRef={passwordRef}
                error={errors.password}
              />
              */}