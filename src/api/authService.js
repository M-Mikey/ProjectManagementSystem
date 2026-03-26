import { API_URL } from "./apiConfig";


export async function loginApi(data) {
  try {
    const res = await fetch(`${API_URL}/v1/Authentication/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });

    const result = await res.json();

    if (!res.ok) {
      return {
        success: false,
        message: result?.message || "Login failed"
      };
    }

    return {
      success: true,
      message: result.message,
      username: result.username
    };

  } catch (error) {
    return {
      success: false,
      message: "Server not reachable"
    };
  }
}


export async function setNewPasswordApi(data) {
  try {
    const res = await fetch(`${API_URL}/v1/Authentication/set-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const result = await res.json();

    if (!res.ok) {
      return { success: false, message: result.message };
    }

    return { success: true, message: result.message };
  } catch (error) {
    return {
      success: false,
      message: "Server not reachable",
    };
  }
}


export async function verifyOtpApi(data) {
    try {
        const response = await fetch(
            `${API_URL}/v1/Authentication/verify-otp`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });

        const result = await response.json();

        if (!response.ok) {
            return {
                success: false,
                message: result.message || "OTP verification failed",
            };
        }

        return {
            success:  result.success,
            message:  result.message,
            pstatus:  result.p_status,
            utype:    result.u_type,
            urole:    result.u_role,      // NEW
        };
    } catch (error) {
        return {
            success: false,
            message: "Server not reachable",
        };
    }
}


export async function forgotPasswordApi(data) {
  try {
    const res = await fetch(`${API_URL}/v1/Authentication/ForgotPassword`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const result = await res.json();

    return {
      success: res.ok && result.success,
      message: result.message || "Something went wrong",
      status: res.status,
    };
  }
  catch (error) {
    return {
      success: false,
      message: "Server not reachable",
    };
  }
}

export const resendOtpApi = async (data) => {
  // const response = await fetch("https://localhost:5001/api/resend-otp", {
  const response = await fetch(`${API_URL}/v1/Authentication/resend-otp`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  return await response.json();
};



