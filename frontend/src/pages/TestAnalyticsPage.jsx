import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getTestAnalytics } from "../api/api";
import Header from "../components/Header";

const LEVEL_COLORS = {
  "A+": { bg: "rgba(16,185,129,0.1)", text: "#10b981", bar: "#10b981" },
  "A":  { bg: "rgba(16,185,129,0.1)", text: "#10b981", bar: "#059669" },
  "B+": { bg: "rgba(37,99,235,0.1)", text: "#2563eb", bar: "#2563eb" },
  "B":  { bg: "rgba(37,99,235,0.1)", text: "#2563eb", bar: "#1d4ed8" },
  "C+": { bg: "rgba(245,158,11,0.1)", text: "#f59e0b", bar: "#f59e0b" },
  "C":  { bg: "rgba(245,158,11,0.1)", text: "#f59e0b", bar: "#d97706" },
  "D":  { bg: "rgba(244,63,94,0.1)", text: "#f43f5e", bar: "#f43f5e" },
};

export default function TestAnalyticsPage() {
  const { testId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getTestAnalytics(testId)
      .then(d => setData(d))
      .catch(err => setError(err.message || "Xatolik"))
      .finally(() => setLoading(false));
  }, [testId]);

  if (loading) return <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bba-bg)" }}><div style={{ width: "40px", height: "40px", borderRadius: "50%", border: "4px solid var(--bba-primary)", borderTopColor: "transparent", animation: "spin 1s linear infinite" }} /></div>;

  if (error || !data) return <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bba-bg)", flexDirection: "column", gap: "20px" }}><span style={{ fontSize: "48px" }}>⚠️</span><p>{error}</p><button className="bba-button bba-button-primary" onClick={() => navigate(-1)}>Orqaga</button></div>;

  const { test, summary, levelDistribution, questionStats } = data;
  const maxLevelCount = Math.max(...levelDistribution.map(l => l.count), 1);

  return (
    <div style={{ minHeight: "100vh", background: "var(--bba-bg)" }}>
      <Header />
      
      <main className="bba-container" style={{ padding: "40px 24px" }}>
        <div style={{ marginBottom: "40px" }}>
           <h1 style={{ fontSize: "32px", fontWeight: 900, marginBottom: "8px" }}>📊 Test Tahlili</h1>
           <p style={{ color: "var(--bba-text-muted)", fontSize: "16px" }}>{test.title} • {test.subjectName}</p>
        </div>

        {/* Stats Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "20px", marginBottom: "40px" }}>
          {[
            { label: "Jami urinishlar", val: summary.totalAttempts, icon: "👥", color: "#3b82f6" },
            { label: "O'rtacha ball", val: summary.avgScore, icon: "📈", color: "#10b981" },
            { label: "Eng yuqori", val: summary.maxScore, icon: "🏆", color: "#f59e0b" },
            { label: "Eng past", val: summary.minScore, icon: "📉", color: "#f43f5e" },
          ].map((s, i) => (
            <div key={i} className="bba-glass-card" style={{ padding: "24px", textAlign: "center" }}>
               <div style={{ fontSize: "32px", marginBottom: "8px" }}>{s.icon}</div>
               <div style={{ fontSize: "32px", fontWeight: 900, color: s.color }}>{s.val}</div>
               <div style={{ fontSize: "11px", fontWeight: 800, color: "var(--bba-text-muted)", textTransform: "uppercase", letterSpacing: "1px" }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "32px", marginBottom: "40px" }}>
          {/* Level Distribution */}
          <section className="bba-glass-card" style={{ padding: "32px" }}>
            <h2 style={{ fontSize: "20px", fontWeight: 900, marginBottom: "24px" }}>🎯 Daraja Taqsimoti</h2>
            {levelDistribution.map((item, i) => {
              const lc = LEVEL_COLORS[item.level] || LEVEL_COLORS["D"];
              const pct = (item.count / maxLevelCount) * 100;
              return (
                <div key={i} style={{ marginBottom: "16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                    <span style={{ background: lc.bg, color: lc.text, padding: "2px 8px", borderRadius: "6px", fontSize: "12px", fontWeight: 800 }}>{item.level}</span>
                    <span style={{ fontWeight: 700 }}>{item.count} ta</span>
                  </div>
                  <div style={{ height: "10px", background: "rgba(0,0,0,0.05)", borderRadius: "99px", overflow: "hidden" }}>
                    <div style={{ width: `${pct}%`, height: "100%", background: lc.bar, borderRadius: "99px" }} />
                  </div>
                </div>
              );
            })}
          </section>

          {/* Question Stats */}
          <section className="bba-glass-card" style={{ padding: "32px" }}>
             <h2 style={{ fontSize: "20px", fontWeight: 900, marginBottom: "24px" }}>🔬 Savollar tahlili</h2>
             <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
               {questionStats.map((q, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                     <span style={{ fontSize: "11px", fontWeight: 800, color: "var(--bba-text-muted)", width: "30px" }}>#{i+1}</span>
                     <div style={{ flex: 1, height: "12px", background: "rgba(0,0,0,0.05)", borderRadius: "6px", overflow: "hidden" }}>
                        <div style={{ width: `${q.accuracy}%`, height: "100%", background: q.accuracy > 70 ? "#10b981" : (q.accuracy > 40 ? "#f59e0b" : "#f43f5e"), borderRadius: "6px" }} />
                     </div>
                     <span style={{ fontSize: "12px", fontWeight: 800, color: "var(--bba-text-muted)", width: "40px" }}>{q.accuracy}%</span>
                  </div>
               ))}
             </div>
          </section>
        </div>
      </main>
    </div>
  );
}
