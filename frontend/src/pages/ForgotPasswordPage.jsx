import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useToast } from "../context/ToastContext";

const BASE_URL = "http://localhost:4000/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return toast.warning("Email kiriting");
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Xatolik yuz berdi");
      setSent(true);
      toast.success("Havolani emailingizga yubordik!");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #eff6ff 0%, #f0fdf4 100%)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "24px", fontFamily: "'Inter', sans-serif"
    }}>
      <div style={{
        width: "100%", maxWidth: "440px",
        background: "#fff", borderRadius: "28px",
        padding: "48px 40px",
        boxShadow: "0 24px 60px rgba(0,0,0,0.08)",
        animation: "fadeInUp 0.4s ease both"
      }}>
        {/* Icon */}
        <div style={{
          width: 64, height: 64, borderRadius: "18px",
          background: "linear-gradient(135deg, #3b82f6, #2563eb)",
          display: "flex", alignItems: "center", justifyContent: "center",
          marginBottom: "24px",
          boxShadow: "0 8px 20px rgba(59,130,246,0.35)"
        }}>
          <span style={{ fontSize: 28 }}>🔑</span>
        </div>

        {!sent ? (
          <>
            <h1 style={{ fontSize: "26px", fontWeight: 800, color: "#0f172a", marginBottom: "8px" }}>
              Parolni tiklash
            </h1>
            <p style={{ fontSize: "14px", color: "#64748b", marginBottom: "32px", lineHeight: 1.6 }}>
              Emailingizni kiriting. Parolni tiklash havolasini yuboramiz.
            </p>

            <form onSubmit={handleSubmit}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#475569", marginBottom: "8px" }}>
                Email manzil
              </label>
              <input
                id="forgot-email-input"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="sizning@email.uz"
                required
                style={{
                  width: "100%", padding: "12px 16px", fontSize: "15px",
                  border: "1.5px solid #e2e8f0", borderRadius: "12px",
                  outline: "none", background: "#f8fafc", boxSizing: "border-box",
                  marginBottom: "20px", transition: "border-color 0.2s"
                }}
                onFocus={e => e.target.style.borderColor = "#3b82f6"}
                onBlur={e => e.target.style.borderColor = "#e2e8f0"}
              />

              <button
                id="forgot-submit-btn"
                type="submit"
                disabled={loading}
                style={{
                  width: "100%", padding: "13px",
                  fontSize: "15px", fontWeight: 700,
                  background: loading ? "#93c5fd" : "linear-gradient(135deg, #3b82f6, #2563eb)",
                  color: "white", border: "none",
                  borderRadius: "12px", cursor: loading ? "not-allowed" : "pointer",
                  boxShadow: "0 4px 14px rgba(59,130,246,0.4)",
                  transition: "all 0.2s"
                }}
              >
                {loading ? "Yuborilmoqda..." : "Havola yuborish"}
              </button>
            </form>
          </>
        ) : (
          <>
            <div style={{ fontSize: 52, marginBottom: "16px" }}>📬</div>
            <h2 style={{ fontSize: "22px", fontWeight: 800, color: "#0f172a", marginBottom: "10px" }}>
              Email yuborildi!
            </h2>
            <p style={{ fontSize: "14px", color: "#64748b", lineHeight: 1.7, marginBottom: "24px" }}>
              <b>{email}</b> manziliga parolni tiklash havolasi yuborildi. 
              Spamni ham tekshirib ko'ring.
            </p>
            <button
              onClick={() => navigate("/login")}
              style={{
                width: "100%", padding: "12px",
                fontSize: "14px", fontWeight: 700,
                background: "#f1f5f9", color: "#475569",
                border: "none", borderRadius: "12px", cursor: "pointer"
              }}
            >
              Kirish sahifasiga qaytish
            </button>
          </>
        )}

        <p style={{ textAlign: "center", marginTop: "20px", fontSize: "13px", color: "#94a3b8" }}>
          Parolni eslading?{" "}
          <Link to="/login" style={{ color: "#3b82f6", fontWeight: 700, textDecoration: "none" }}>
            Kirish
          </Link>
        </p>
      </div>
    </div>
  );
}
