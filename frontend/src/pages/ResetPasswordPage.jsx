import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useToast } from "../context/ToastContext";

const BASE_URL = "http://localhost:4000/api";

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      toast.error("Havola yaroqsiz yoki muddati o'tgan");
    }
  }, [token, toast]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 6) return toast.warning("Parol kamida 6 belgi bo'lishi kerak");
    if (password !== confirm) return toast.error("Parollar mos kelmadi");
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Xatolik yuz berdi");
      setDone(true);
      toast.success("Parol muvaffaqiyatli yangilandi!");
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const strength = password.length === 0 ? 0
    : password.length < 6 ? 1
    : password.length < 10 ? 2
    : 3;

  const strengthColors = ["#e2e8f0", "#ef4444", "#f59e0b", "#22c55e"];
  const strengthLabels = ["", "Zaif", "O'rtacha", "Kuchli"];

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
        <div style={{
          width: 64, height: 64, borderRadius: "18px",
          background: done ? "linear-gradient(135deg, #22c55e, #16a34a)"
                           : "linear-gradient(135deg, #3b82f6, #2563eb)",
          display: "flex", alignItems: "center", justifyContent: "center",
          marginBottom: "24px", boxShadow: "0 8px 20px rgba(59,130,246,0.3)"
        }}>
          <span style={{ fontSize: 28 }}>{done ? "✅" : "🔐"}</span>
        </div>

        {!done ? (
          <>
            <h1 style={{ fontSize: "26px", fontWeight: 800, color: "#0f172a", marginBottom: "8px" }}>
              Yangi parol o'rnating
            </h1>
            <p style={{ fontSize: "14px", color: "#64748b", marginBottom: "32px" }}>
              Yangi parolni ikki marta kiriting.
            </p>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#475569", marginBottom: "6px" }}>
                  Yangi parol
                </label>
                <input
                  id="new-password-input"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Kamida 6 ta belgi"
                  required
                  style={{
                    width: "100%", padding: "12px 16px", fontSize: "15px",
                    border: "1.5px solid #e2e8f0", borderRadius: "12px",
                    outline: "none", background: "#f8fafc", boxSizing: "border-box"
                  }}
                  onFocus={e => e.target.style.borderColor = "#3b82f6"}
                  onBlur={e => e.target.style.borderColor = "#e2e8f0"}
                />
                {/* Password strength bar */}
                {password.length > 0 && (
                  <div style={{ marginTop: "8px" }}>
                    <div style={{ height: "4px", borderRadius: "2px", background: "#e2e8f0", overflow: "hidden" }}>
                      <div style={{
                        height: "100%", borderRadius: "2px",
                        width: `${(strength / 3) * 100}%`,
                        background: strengthColors[strength],
                        transition: "width 0.3s, background 0.3s"
                      }} />
                    </div>
                    <p style={{ fontSize: "11px", color: strengthColors[strength], fontWeight: 700, marginTop: "4px" }}>
                      {strengthLabels[strength]}
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#475569", marginBottom: "6px" }}>
                  Parolni tasdiqlang
                </label>
                <input
                  id="confirm-password-input"
                  type="password"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  placeholder="Parolni qayta kiriting"
                  required
                  style={{
                    width: "100%", padding: "12px 16px", fontSize: "15px",
                    border: `1.5px solid ${confirm && confirm !== password ? "#ef4444" : "#e2e8f0"}`,
                    borderRadius: "12px", outline: "none",
                    background: "#f8fafc", boxSizing: "border-box"
                  }}
                  onFocus={e => e.target.style.borderColor = "#3b82f6"}
                  onBlur={e => e.target.style.borderColor = confirm && confirm !== password ? "#ef4444" : "#e2e8f0"}
                />
                {confirm && confirm !== password && (
                  <p style={{ fontSize: "12px", color: "#ef4444", marginTop: "4px", fontWeight: 600 }}>
                    Parollar mos kelmadi
                  </p>
                )}
              </div>

              <button
                id="reset-password-btn"
                type="submit"
                disabled={loading || !token}
                style={{
                  padding: "13px", fontSize: "15px", fontWeight: 700,
                  background: loading ? "#93c5fd" : "linear-gradient(135deg, #3b82f6, #2563eb)",
                  color: "white", border: "none", borderRadius: "12px",
                  cursor: loading ? "not-allowed" : "pointer",
                  boxShadow: "0 4px 14px rgba(59,130,246,0.4)", marginTop: "4px"
                }}
              >
                {loading ? "Saqlanmoqda..." : "Parolni yangilash"}
              </button>
            </form>
          </>
        ) : (
          <>
            <h2 style={{ fontSize: "22px", fontWeight: 800, color: "#0f172a", marginBottom: "10px" }}>
              Parol yangilandi!
            </h2>
            <p style={{ fontSize: "14px", color: "#64748b", lineHeight: 1.7 }}>
              Yangi parolingiz saqlandi. Kirish sahifasiga yo'naltirilmoqdasiz...
            </p>
          </>
        )}

        <p style={{ textAlign: "center", marginTop: "20px", fontSize: "13px", color: "#94a3b8" }}>
          <Link to="/login" style={{ color: "#3b82f6", fontWeight: 700, textDecoration: "none" }}>
            ← Kirish sahifasiga qaytish
          </Link>
        </p>
      </div>
    </div>
  );
}
