import { useEffect, useState } from "react";
import { getTests, getSubjects } from "../api/api";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";

export default function TestsPage() {
  const [tests, setTests] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([getTests(), getSubjects()])
      .then(([testData, subData]) => {
        setTests(Array.isArray(testData) ? testData : []);
        setSubjects(Array.isArray(subData) ? subData : []);
        setLoading(false);
      })
      .catch(() => {
        setTests([]);
        setSubjects([]);
        setLoading(false);
      });
  }, []);

  const filtered = tests
    .filter(t => {
      const matchesSearch =
        (t.title || "").toLowerCase().includes(search.toLowerCase()) ||
        (t.description || "").toLowerCase().includes(search.toLowerCase());
      const matchesSubject =
        selectedSubject === "all" || String(t.subject_id) === selectedSubject;
      return matchesSearch && matchesSubject;
    })
    .sort((a, b) => {
      if (sortBy === "newest") return (b.id || 0) - (a.id || 0);
      if (sortBy === "oldest") return (a.id || 0) - (b.id || 0);
      if (sortBy === "name") return (a.title || "").localeCompare(b.title || "");
      return 0;
    });

  return (
    <div style={{ minHeight: "100vh", background: "var(--bba-bg)" }}>
      <Header />
      
      <main className="bba-container" style={{ padding: "40px 24px" }}>
        {/* Banner Section */}
        <section style={{
          background: "linear-gradient(135deg, #2563eb, #6366f1)",
          borderRadius: "var(--bba-radius-xl)",
          padding: "48px 40px",
          marginBottom: "40px",
          color: "#fff",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          boxShadow: "0 20px 40px -10px rgba(37, 99, 235, 0.4)",
          position: "relative",
          overflow: "hidden"
        }}>
          <div style={{ position: "absolute", top: "-20%", right: "-10%", width: "400px", height: "400px", background: "rgba(255,255,255,0.05)", borderRadius: "50%" }}></div>
          <div style={{ position: "relative", zIndex: 1 }}>
            <h2 style={{ fontSize: "32px", fontWeight: 900, marginBottom: "12px", color: "white" }}>
              Bilimlariningni sinovdan o'tkaz 🚀
            </h2>
            <p style={{ fontSize: "16px", fontWeight: 500, opacity: 0.9 }}>
              BBA platformasida mavjud testlarni tanlang va o'z darajangizni aniqlang.
            </p>
          </div>
          <div style={{ fontSize: "64px", filter: "drop-shadow(0 10px 20px rgba(0,0,0,0.2))" }}>📚</div>
        </section>

        {/* Filters and Search */}
        <div style={{
          display: "flex",
          gap: "16px",
          flexWrap: "wrap",
          marginBottom: "32px",
          alignItems: "center"
        }}>
          <div style={{ flex: 1, minWidth: "280px", position: "relative" }}>
            <input
              type="text"
              placeholder="Test nomi bo'yicha qidirish..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%",
                padding: "14px 20px 14px 44px",
                borderRadius: "var(--bba-radius-lg)",
                border: `1px solid var(--bba-border)`,
                background: "var(--bba-card)",
                color: "var(--bba-text-main)",
                fontSize: "14px",
                fontWeight: 600,
                outline: "none",
                transition: "var(--bba-transition)"
              }}
            />
            <span className="material-symbols-outlined" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--bba-text-muted)" }}>
              search
            </span>
          </div>

          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            style={{
              padding: "14px 20px",
              borderRadius: "var(--bba-radius-lg)",
              border: `1px solid var(--bba-border)`,
              background: "var(--bba-card)",
              color: "var(--bba-text-main)",
              fontSize: "14px",
              fontWeight: 700,
              cursor: "pointer",
              outline: "none"
            }}
          >
            <option value="all">Barcha fanlar</option>
            {subjects.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{
              padding: "14px 20px",
              borderRadius: "var(--bba-radius-lg)",
              border: `1px solid var(--bba-border)`,
              background: "var(--bba-card)",
              color: "var(--bba-text-main)",
              fontSize: "14px",
              fontWeight: 700,
              cursor: "pointer",
              outline: "none"
            }}
          >
            <option value="newest">Eng yangi</option>
            <option value="oldest">Eski</option>
            <option value="name">Nomi bo'yicha</option>
          </select>
        </div>

        {/* Tests Grid */}
        {loading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "60px 0" }}>
              <div style={{ width: "40px", height: "40px", borderRadius: "50%", border: "4px solid var(--bba-primary)", borderTopColor: "transparent", animation: "spin 1s linear infinite" }} />
            </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "var(--bba-text-muted)" }}>
             <span style={{ fontSize: "64px" }}>🔍</span>
             <h3 style={{ margin: "16px 0 8px" }}>Hech narsa topilmadi</h3>
             <p>Qidiruv so'zini o'zgartirib ko'ring.</p>
          </div>
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            gap: "24px"
          }}>
            {filtered.map(test => {
              const subject = subjects.find(s => String(s.id) === String(test.subject_id));
              return (
                <div 
                  key={test.id}
                  className="bba-glass-card"
                  style={{
                    padding: "24px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "16px",
                    transition: "var(--bba-transition)",
                    cursor: "pointer",
                    animation: "fadeInUp 0.3s ease both"
                  }}
                  onMouseOver={(e) => e.currentTarget.style.transform = "translateY(-8px)"}
                  onMouseOut={(e) => e.currentTarget.style.transform = "translateY(0)"}
                  onClick={() => navigate(`/payment/${test.id}`)}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{
                      padding: "4px 12px",
                      borderRadius: "8px",
                      background: "rgba(37,99,235,0.1)",
                      color: "var(--bba-primary)",
                      fontSize: "11px",
                      fontWeight: 800,
                      textTransform: "uppercase"
                    }}>
                      {subject?.name || "Fan"}
                    </div>
                    <div style={{ fontSize: "20px" }}>📝</div>
                  </div>

                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: "20px", fontWeight: 800, margin: "0 0 8px", color: "var(--bba-text-main)" }}>
                      {test.title}
                    </h3>
                    <p style={{ 
                      fontSize: "14px", 
                      color: "var(--bba-text-muted)", 
                      lineHeight: "1.6",
                      display: "-webkit-box",
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden" 
                    }}>
                      {test.description || "Ushbu test orqali o'z bilimlaringizni sinab ko'rishingiz mumkin."}
                    </p>
                  </div>

                  <div style={{ 
                    marginTop: "8px",
                    paddingTop: "16px",
                    borderTop: `1px solid var(--bba-border)`,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                  }}>
                    <div style={{ display: "flex", gap: "12px", color: "var(--bba-text-muted)", fontSize: "12px", fontWeight: 700 }}>
                       <span>⏱️ 90 daqiqa</span>
                       <span>📋 Savollar: 45 ta</span>
                    </div>
                    <span style={{ 
                      color: "var(--bba-primary)", 
                      fontSize: "14px", 
                      fontWeight: 900,
                      display: "flex",
                      alignItems: "center",
                      gap: "4px"
                    }}>
                      Boshlash →
                    </span>
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