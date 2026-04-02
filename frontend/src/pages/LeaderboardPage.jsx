import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const BASE_URL = "http://localhost:4000/api";

const LEVEL_COLORS = {
  "A+": { bg: "#fef3c7", text: "#92400e", border: "#fcd34d" },
  "A":  { bg: "#dcfce7", text: "#14532d", border: "#86efac" },
  "B+": { bg: "#dbeafe", text: "#1e3a5f", border: "#93c5fd" },
  "B":  { bg: "#ede9fe", text: "#4c1d95", border: "#c4b5fd" },
  "C+": { bg: "#ffedd5", text: "#7c2d12", border: "#fdba74" },
  "C":  { bg: "#f1f5f9", text: "#475569", border: "#cbd5e1" },
  "D":  { bg: "#f1f5f9", text: "#64748b", border: "#e2e8f0" },
};

export default function LeaderboardPage() {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`${BASE_URL}/admin/leaderboard?limit=30`)
      .then(r => r.json())
      .then(data => { setLeaders(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = leaders.filter(l =>
    (l.full_name || "").toLowerCase().includes(search.toLowerCase()) ||
    (l.subject_name || "").toLowerCase().includes(search.toLowerCase())
  );

  const top3Colors = ["#f59e0b", "#94a3b8", "#cd7c2c"];
  const top3Emojis = ["🥇", "🥈", "🥉"];
  const formatRasch = (val) => (Number.isFinite(Number(val)) ? Number(val).toFixed(1) : "-");

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(160deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)",
      fontFamily: "'Inter', sans-serif",
      paddingBottom: "60px"
    }}>
      {/* Header */}
      <header style={{
        background: "rgba(255,255,255,0.03)",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        padding: "20px 24px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        position: "sticky", top: 0, zIndex: 50
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              background: "rgba(255,255,255,0.08)", border: "none", borderRadius: "12px",
              padding: "8px 14px", color: "#94a3b8", cursor: "pointer",
              fontSize: "13px", fontWeight: 700
            }}
          >← Orqaga</button>
          <div>
            <h1 style={{ color: "#f1f5f9", fontSize: "22px", fontWeight: 800, margin: 0 }}>
              🏆 Reyting Jadvali
            </h1>
            <p style={{ color: "#64748b", fontSize: "12px", margin: 0 }}>Top natijalar</p>
          </div>
        </div>
        {/* Search */}
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Qidirish..."
          style={{
            background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: "12px", padding: "9px 16px", color: "#f1f5f9",
            fontSize: "14px", outline: "none", width: "220px"
          }}
        />
      </header>

      <main style={{ maxWidth: "860px", margin: "0 auto", padding: "32px 20px" }}>

        {/* Top 3 podium */}
        {!loading && filtered.length >= 3 && (
          <div style={{
            display: "flex", justifyContent: "center", alignItems: "flex-end",
            gap: "16px", marginBottom: "48px"
          }}>
            {[1, 0, 2].map(idx => {
              const p = filtered[idx];
              const isFirst = idx === 0;
              return (
                <div key={idx} style={{
                  display: "flex", flexDirection: "column", alignItems: "center",
                  animation: `fadeInUp 0.4s ${idx * 0.1}s both`
                }}>
                  <div style={{ fontSize: isFirst ? 40 : 28, marginBottom: "8px" }}>
                    {top3Emojis[idx]}
                  </div>
                  <div style={{
                    background: `linear-gradient(145deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))`,
                    border: `2px solid ${top3Colors[idx]}40`,
                    borderRadius: "20px",
                    padding: isFirst ? "28px 24px" : "20px 20px",
                    textAlign: "center",
                    minWidth: isFirst ? "180px" : "150px",
                    boxShadow: isFirst ? `0 0 40px ${top3Colors[idx]}30` : "none"
                  }}>
                    <div style={{
                      fontSize: isFirst ? "42px" : "32px",
                      fontWeight: 900, color: top3Colors[idx], lineHeight: 1
                    }}>
                      {formatRasch(p.t_score)}
                    </div>
                    <div style={{ color: "#f1f5f9", fontWeight: 700, fontSize: "13px", marginTop: "8px" }}>
                      {p.full_name || "Noma'lum"}
                    </div>
                    <div style={{ color: "#64748b", fontSize: "11px", marginTop: "4px" }}>
                      {p.subject_name}
                    </div>
                    {p.level && (
                      <span style={{
                        display: "inline-block", marginTop: "8px",
                        background: LEVEL_COLORS[p.level]?.bg || "#f1f5f9",
                        color: LEVEL_COLORS[p.level]?.text || "#475569",
                        border: `1px solid ${LEVEL_COLORS[p.level]?.border || "#e2e8f0"}`,
                        borderRadius: "8px", padding: "2px 10px",
                        fontSize: "12px", fontWeight: 800
                      }}>{p.level}</span>
                    )}
                  </div>
                  {/* Podium stand */}
                  <div style={{
                    width: isFirst ? "180px" : "150px",
                    height: isFirst ? "40px" : "24px",
                    background: `${top3Colors[idx]}20`,
                    borderRadius: "0 0 12px 12px",
                    border: `1px solid ${top3Colors[idx]}30`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: top3Colors[idx], fontWeight: 900, fontSize: "18px"
                  }}>
                    {idx + 1}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Full table */}
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {[...Array(8)].map((_, i) => (
              <div key={i} style={{
                height: "64px", borderRadius: "16px",
                background: "rgba(255,255,255,0.05)",
                animation: "pulse-slow 1.4s infinite"
              }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#64748b" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
            <p style={{ fontWeight: 700 }}>Natija topilmadi</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {filtered.map((p, i) => {
              const lc = LEVEL_COLORS[p.level] || LEVEL_COLORS["D"];
              return (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: "16px",
                  background: i < 3 ? "rgba(245,158,11,0.06)" : "rgba(255,255,255,0.04)",
                  border: `1px solid ${i < 3 ? "rgba(245,158,11,0.15)" : "rgba(255,255,255,0.07)"}`,
                  borderRadius: "16px", padding: "14px 20px",
                  animation: `fadeInUp 0.3s ${Math.min(i * 0.03, 0.3)}s both`,
                  transition: "transform 0.2s",
                }}>
                  {/* Rank */}
                  <div style={{
                    width: 36, height: 36, borderRadius: "10px",
                    background: i < 3 ? `${top3Colors[i]}20` : "rgba(255,255,255,0.05)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: i < 3 ? top3Colors[i] : "#64748b",
                    fontWeight: 900, fontSize: i < 3 ? "18px" : "14px", flexShrink: 0
                  }}>
                    {i < 3 ? top3Emojis[i] : i + 1}
                  </div>
                  {/* Name & subject */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ color: "#f1f5f9", fontWeight: 700, fontSize: "14px", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {p.full_name || "Noma'lum"}
                    </p>
                    <p style={{ color: "#64748b", fontSize: "12px", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {p.subject_name}
                    </p>
                  </div>
                  {/* Level badge */}
                  {p.level && (
                    <span style={{
                      background: lc.bg, color: lc.text, border: `1px solid ${lc.border}`,
                      borderRadius: "8px", padding: "3px 10px",
                      fontSize: "12px", fontWeight: 800, flexShrink: 0
                    }}>{p.level}</span>
                  )}
                  {/* Score */}
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ color: "#f1f5f9", fontWeight: 900, fontSize: "18px" }}>
                      {formatRasch(p.t_score)}
                    </div>
                    <div style={{ color: "#64748b", fontSize: "10px" }}>Rasch</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
