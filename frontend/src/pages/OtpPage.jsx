import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";

const BASE_URL = "http://localhost:4000/api";

export default function OtpPage() {
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(300); // 5 min
  const inputRefs = useRef([]);
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const { login: loginContext } = useAuth();
  const email = location.state?.email;

  useEffect(() => {
    if (!email) {
      toast.error("Email topilmadi. Qayta kiring.");
      navigate("/login");
    }
  }, [email, navigate, toast]);

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setInterval(() => setCountdown(c => c - 1), 1000);
    return () => clearInterval(t);
  }, [countdown]);

  const handleChange = (idx, val) => {
    if (val.length > 1) val = val.slice(-1);
    if (val && !/^\d$/.test(val)) return;
    const next = [...code];
    next[idx] = val;
    setCode(next);
    // Auto-focus next input
    if (val && idx < 5) {
      inputRefs.current[idx + 1]?.focus();
    }
  };

  const handleKeyDown = (idx, e) => {
    if (e.key === "Backspace" && !code[idx] && idx > 0) {
      inputRefs.current[idx - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setCode(pasted.split(""));
      inputRefs.current[5]?.focus();
    }
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    const fullCode = code.join("");
    if (fullCode.length !== 6) return toast.warning("6 raqamli kodni to'liq kiriting");
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: fullCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Xatolik");

      // Success — store token and redirect
      localStorage.setItem("token", data.token);
      if (data.id) localStorage.setItem("userId", String(data.id));
      const userObj = { id: data.id, name: data.name || email, email: data.email, role: data.role };
      loginContext(userObj);
      toast.success("Muvaffaqiyatli tasdiqlandi!");

      if (data.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/payment");
      }
    } catch (err) {
      toast.error(err.message);
      setCode(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  // Auto-submit when all 6 digits entered
  useEffect(() => {
    if (code.every(d => d !== "")) {
      handleSubmit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  const handleResend = async () => {
    setResending(true);
    try {
      const res = await fetch(`${BASE_URL}/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast.success("Yangi kod yuborildi!");
      setCountdown(300);
      setCode(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setResending(false);
    }
  };

  const minutes = Math.floor(countdown / 60);
  const seconds = countdown % 60;

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #eff6ff 0%, #e0f2fe 50%, #f0fdf4 100%)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "24px", fontFamily: "'Inter', sans-serif"
    }}>
      <div style={{
        width: "100%", maxWidth: "440px",
        background: "#fff", borderRadius: "28px",
        padding: "48px 40px",
        boxShadow: "0 24px 60px rgba(0,0,0,0.08)",
        animation: "fadeInUp 0.4s ease both",
        textAlign: "center"
      }}>
        {/* Icon */}
        <div style={{
          width: 72, height: 72, borderRadius: "20px",
          background: "linear-gradient(135deg, #8b5cf6, #6d28d9)",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 24px",
          boxShadow: "0 8px 24px rgba(139,92,246,0.35)"
        }}>
          <span style={{ fontSize: 34 }}>🔐</span>
        </div>

        <h1 style={{ fontSize: "24px", fontWeight: 800, color: "#0f172a", marginBottom: "8px" }}>
          Kodni kiriting
        </h1>
        <p style={{ fontSize: "14px", color: "#64748b", marginBottom: "8px", lineHeight: 1.6 }}>
          <b>{email}</b> manziliga 6 raqamli kod yuborildi.
        </p>
        <p style={{
          fontSize: "13px", fontWeight: 700,
          color: countdown <= 60 ? "#ef4444" : "#3b82f6",
          marginBottom: "28px"
        }}>
          ⏱ {minutes}:{seconds.toString().padStart(2, "0")}
        </p>

        {/* OTP Inputs */}
        <form onSubmit={handleSubmit}>
          <div style={{ display: "flex", gap: "10px", justifyContent: "center", marginBottom: "28px" }}>
            {code.map((digit, idx) => (
              <input
                key={idx}
                ref={el => inputRefs.current[idx] = el}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={e => handleChange(idx, e.target.value)}
                onKeyDown={e => handleKeyDown(idx, e)}
                onPaste={idx === 0 ? handlePaste : undefined}
                autoFocus={idx === 0}
                style={{
                  width: "48px", height: "56px",
                  textAlign: "center", fontSize: "24px", fontWeight: 800,
                  border: `2px solid ${digit ? "#3b82f6" : "#e2e8f0"}`,
                  borderRadius: "14px",
                  outline: "none",
                  background: digit ? "#eff6ff" : "#f8fafc",
                  color: "#0f172a",
                  transition: "all 0.2s",
                  caretColor: "#3b82f6"
                }}
                onFocus={e => e.target.style.borderColor = "#3b82f6"}
                onBlur={e => e.target.style.borderColor = digit ? "#3b82f6" : "#e2e8f0"}
              />
            ))}
          </div>

          <button
            type="submit"
            disabled={loading || code.some(d => d === "")}
            style={{
              width: "100%", padding: "13px",
              fontSize: "15px", fontWeight: 700,
              background: loading ? "#c4b5fd" : "linear-gradient(135deg, #8b5cf6, #6d28d9)",
              color: "white", border: "none",
              borderRadius: "12px",
              cursor: loading ? "not-allowed" : "pointer",
              boxShadow: "0 4px 14px rgba(139,92,246,0.4)",
              transition: "all 0.2s"
            }}
          >
            {loading ? "Tekshirilmoqda..." : "Tasdiqlash"}
          </button>
        </form>

        {/* Resend */}
        <div style={{ marginTop: "20px" }}>
          {countdown <= 0 ? (
            <button
              onClick={handleResend}
              disabled={resending}
              style={{
                background: "none", border: "none", cursor: "pointer",
                color: "#3b82f6", fontWeight: 700, fontSize: "14px"
              }}
            >
              {resending ? "Yuborilmoqda..." : "Qayta yuborish"}
            </button>
          ) : (
            <p style={{ color: "#94a3b8", fontSize: "13px" }}>
              Kod kelmadimi? {minutes}:{seconds.toString().padStart(2, "0")} dan keyin qayta so'rash
            </p>
          )}
        </div>

        <p style={{ marginTop: "16px", fontSize: "13px", color: "#94a3b8" }}>
          <button
            onClick={() => navigate("/login")}
            style={{ background: "none", border: "none", color: "#3b82f6", cursor: "pointer", fontWeight: 700 }}
          >
            ← Boshqa email bilan kirish
          </button>
        </p>
      </div>
    </div>
  );
}
