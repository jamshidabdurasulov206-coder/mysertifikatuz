import { useState, useEffect } from "react";
import { register } from "../api/api";
import { useNavigate } from "react-router-dom";
import { useToast } from "../context/ToastContext";

export default function RegisterPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    const user = localStorage.getItem("user");
    if (user) navigate("/profile");
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    try {
      const fullName = `${lastName.trim()} ${firstName.trim()}`;
      await register(fullName, email, password);
      setSuccess("Muvaffaqiyatli ro'yxatdan o'tdingiz!");
      toast.success("Ro'yxatdan o'tdingiz! Kirishingiz mumkin.");
      setTimeout(() => navigate("/"), 1500);
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    }
  };

  return (
    <div style={{ 
      minHeight: "100vh", 
      background: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px",
      fontFamily: "'Inter', sans-serif"
    }}>
      <div className="bba-glass-card" style={{ 
        maxWidth: "480px", 
        width: "100%", 
        padding: "48px",
        display: "flex",
        flexDirection: "column",
        gap: "32px",
        animation: "fadeInUp 0.6s ease"
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ 
            width: "64px", height: "64px", background: "var(--bba-primary)", 
            borderRadius: "20px", display: "flex", alignItems: "center", 
            justifyContent: "center", margin: "0 auto 20px",
            boxShadow: "0 10px 25px var(--bba-primary-glow)",
            fontSize: "28px", fontWeight: 900, color: "#fff"
          }}>B</div>
          <h1 style={{ fontSize: "28px", fontWeight: 900, margin: "0 0 8px" }}>Ro'yxatdan o'tish</h1>
          <p style={{ color: "var(--bba-text-muted)", fontSize: "14px", fontWeight: 500 }}>
            BBA platformasi a'zosiga aylaning
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <label style={{ fontSize: "11px", fontWeight: 800, color: "var(--bba-text-muted)", textTransform: "uppercase" }}>Familiya</label>
              <input 
                required placeholder="Familiya" value={lastName}
                onChange={e => setLastName(e.target.value)}
                style={{ width: "100%", padding: "12px 16px", borderRadius: "12px", border: "1px solid var(--bba-border)", background: "rgba(0,0,0,0.02)", outline: "none", fontSize: "14px", fontWeight: 600 }}
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <label style={{ fontSize: "11px", fontWeight: 800, color: "var(--bba-text-muted)", textTransform: "uppercase" }}>Ism</label>
              <input 
                required placeholder="Ism" value={firstName}
                onChange={e => setFirstName(e.target.value)}
                style={{ width: "100%", padding: "12px 16px", borderRadius: "12px", border: "1px solid var(--bba-border)", background: "rgba(0,0,0,0.02)", outline: "none", fontSize: "14px", fontWeight: 600 }}
              />
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <label style={{ fontSize: "11px", fontWeight: 800, color: "var(--bba-text-muted)", textTransform: "uppercase" }}>Email</label>
            <input 
              required type="email" placeholder="example@mail.com" value={email}
              onChange={e => setEmail(e.target.value)}
              style={{ width: "100%", padding: "12px 16px", borderRadius: "12px", border: "1px solid var(--bba-border)", background: "rgba(0,0,0,0.02)", outline: "none", fontSize: "14px", fontWeight: 600 }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <label style={{ fontSize: "11px", fontWeight: 800, color: "var(--bba-text-muted)", textTransform: "uppercase" }}>Parol</label>
            <input 
              required type="password" placeholder="••••••••" value={password}
              onChange={e => setPassword(e.target.value)}
              style={{ width: "100%", padding: "12px 16px", borderRadius: "12px", border: "1px solid var(--bba-border)", background: "rgba(0,0,0,0.02)", outline: "none", fontSize: "14px", fontWeight: 600 }}
            />
          </div>

          {error && <p style={{ color: "var(--bba-danger)", fontSize: "13px", textAlign: "center", fontWeight: 600 }}>{error}</p>}
          {success && <p style={{ color: "var(--bba-success)", fontSize: "13px", textAlign: "center", fontWeight: 600 }}>{success}</p>}

          <button type="submit" className="bba-button bba-button-primary" style={{ padding: "16px", borderRadius: "14px", fontSize: "16px", marginTop: "8px" }}>
            Ro'yxatdan o'tish →
          </button>
        </form>

        <p style={{ textAlign: "center", fontSize: "14px", fontWeight: 500 }}>
          Akkauntingiz bormi? 
          <button 
            type="button" 
            onClick={() => navigate("/")}
            style={{ border: "none", background: "transparent", color: "var(--bba-primary)", fontWeight: 800, marginLeft: "6px", cursor: "pointer" }}
          >Kirish</button>
        </p>
      </div>
    </div>
  );
}
