import { useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import Header from "../components/Header";

export default function ResultPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [subject, setSubject] = useState("");

  useEffect(() => {
    let data = location.state?.result || JSON.parse(localStorage.getItem("lastResult"));
    if (data) {
      const subjects = JSON.parse(localStorage.getItem("subjectsCache") || "[]");
      setSubject(subjects.find(s => String(s.id) === String(data.subject_id))?.name || "");
    }
  }, [location.state]);

  return (
    <div style={{ minHeight: "100vh", background: "var(--bba-bg)" }}>
      <Header />
      
      <main className="bba-container" style={{ padding: "60px 24px", maxWidth: "700px" }}>
        <div className="bba-glass-card" style={{ padding: "48px", textAlign: "center" }}>
           <div style={{ width: "80px", height: "80px", borderRadius: "50%", background: "rgba(16,185,129,0.1)", color: "var(--bba-success)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "40px", margin: "0 auto 24px" }}>
              ✅
           </div>
           
           <h1 style={{ fontSize: "28px", fontWeight: 900, marginBottom: "12px" }}>Imtihon Yakunlandi!</h1>
           <p style={{ color: "var(--bba-text-muted)", fontSize: "16px", marginBottom: "40px" }}>
              Tabriklaymiz! Siz muvaffaqiyatli imtihon topshirdingiz. Natijalar 24 soat ichida e'lon qilinadi.
           </p>

           <div style={{ 
             background: "rgba(0,0,0,0.02)", 
             borderRadius: "24px", 
             padding: "32px", 
             border: "1px solid var(--bba-border)",
             marginBottom: "40px",
             display: "grid",
             gridTemplateColumns: "1fr 1fr",
             gap: "20px"
           }}>
              <div style={{ textAlign: "center" }}>
                 <p style={{ fontSize: "11px", fontWeight: 800, color: "var(--bba-text-muted)", textTransform: "uppercase", marginBottom: "4px" }}>Fan</p>
                 <p style={{ fontSize: "18px", fontWeight: 900 }}>{subject}</p>
              </div>
              <div style={{ textAlign: "center" }}>
                 <p style={{ fontSize: "11px", fontWeight: 800, color: "var(--bba-text-muted)", textTransform: "uppercase", marginBottom: "4px" }}>Holati</p>
                 <p style={{ fontSize: "18px", fontWeight: 900, color: "var(--bba-warning)" }}>Tekshirilmoqda</p>
              </div>
           </div>

           <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <button 
                onClick={() => navigate("/profile")}
                className="bba-button bba-button-primary" 
                style={{ padding: "18px", width: "100%", fontSize: "16px" }}
              >
                Profilingizga o'tish
              </button>
              <button 
                onClick={() => navigate("/tests")}
                className="bba-button" 
                style={{ padding: "14px", width: "100%", fontSize: "14px", background: "transparent", color: "var(--bba-text-muted)" }}
              >
                Boshqa testlar
              </button>
           </div>
        </div>
      </main>
    </div>
  );
}