import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const BASE_URL = "http://localhost:4000/api";

function getAuthHeaders() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: token.startsWith("Bearer ") ? token : `Bearer ${token}` } : {};
}

const ACTION_ICONS = {
  login: "🔑", logout: "🚪", create: "✅", update: "✏️",
  delete: "🗑️", publish: "📢", review: "👁️", export: "📤",
};

export default function AuditLogPage() {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();
  const PER_PAGE = 30;

  useEffect(() => {
    setLoading(true);
    fetch(`${BASE_URL}/admin/audit-logs?page=${page}&limit=${PER_PAGE}`, {
      headers: getAuthHeaders(),
    })
      .then(r => r.json())
      .then(data => {
        setLogs(data.logs || []);
        setTotal(data.total || 0);
        setMessage(data.message || "");
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [page]);

  const totalPages = Math.ceil(total / PER_PAGE);

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0f172a",
      fontFamily: "'Inter', sans-serif",
      paddingBottom: "60px"
    }}>
      {/* Header */}
      <header style={{
        background: "#1e293b",
        borderBottom: "1px solid #334155",
        padding: "20px 28px",
        display: "flex", alignItems: "center", gap: "16px",
        position: "sticky", top: 0, zIndex: 50
      }}>
        <button
          onClick={() => navigate("/admin")}
          style={{
            background: "#334155", border: "none", borderRadius: "10px",
            padding: "8px 14px", color: "#94a3b8", cursor: "pointer",
            fontSize: "13px", fontWeight: 700
          }}
        >← Orqaga</button>
        <div>
          <h1 style={{ color: "#f1f5f9", fontSize: "20px", fontWeight: 800, margin: 0 }}>
            📋 Audit Log
          </h1>
          <p style={{ color: "#64748b", fontSize: "12px", margin: 0 }}>
            Admin harakatlar tarixi
          </p>
        </div>
        <div style={{ marginLeft: "auto", background: "#334155", borderRadius: "10px", padding: "6px 14px" }}>
          <span style={{ color: "#94a3b8", fontSize: "13px", fontWeight: 600 }}>
            Jami: <b style={{ color: "#f1f5f9" }}>{total}</b> ta yozuv
          </span>
        </div>
      </header>

      <main style={{ maxWidth: "900px", margin: "0 auto", padding: "28px 20px" }}>

        {message && (
          <div style={{
            background: "#1e293b", border: "1px solid #334155", borderRadius: "16px",
            padding: "20px 24px", textAlign: "center", color: "#64748b", marginBottom: "20px"
          }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>ℹ️</div>
            <p style={{ fontWeight: 600, margin: 0 }}>{message}</p>
            <p style={{ fontSize: "13px", marginTop: "8px", color: "#475569" }}>
              Audit log yoqish uchun <code style={{ background: "#0f172a", padding: "2px 6px", borderRadius: "4px", color: "#94a3b8" }}>audit_logs</code> jadvali yaratilishi kerak.
            </p>
          </div>
        )}

        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {[...Array(10)].map((_, i) => (
              <div key={i} style={{
                height: "72px", borderRadius: "16px",
                background: "#1e293b", animation: "pulse-slow 1.4s infinite"
              }} />
            ))}
          </div>
        ) : logs.length === 0 && !message ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#64748b" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
            <p style={{ fontWeight: 700 }}>Hech qanday yozuv topilmadi</p>
          </div>
        ) : (
          <>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {logs.map((log, i) => {
                const icon = ACTION_ICONS[log.action?.toLowerCase()] || "📌";
                return (
                  <div key={log.id || i} style={{
                    background: "#1e293b",
                    border: "1px solid #334155",
                    borderRadius: "14px",
                    padding: "14px 18px",
                    display: "flex", alignItems: "flex-start", gap: "14px",
                    animation: `fadeInUp 0.2s ${Math.min(i * 0.02, 0.2)}s both`
                  }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: "10px",
                      background: "#0f172a", display: "flex",
                      alignItems: "center", justifyContent: "center",
                      fontSize: "18px", flexShrink: 0
                    }}>{icon}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                        {log.action && (
                          <span style={{
                            background: "#0f172a", color: "#94a3b8",
                            border: "1px solid #334155", borderRadius: "6px",
                            padding: "2px 8px", fontSize: "11px", fontWeight: 700,
                            textTransform: "uppercase"
                          }}>{log.action}</span>
                        )}
                        <span style={{ color: "#f1f5f9", fontSize: "14px", fontWeight: 600 }}>
                          {log.description || log.message || JSON.stringify(log)}
                        </span>
                      </div>
                      <div style={{ display: "flex", gap: "16px", marginTop: "4px", flexWrap: "wrap" }}>
                        {log.user_email && (
                          <span style={{ color: "#64748b", fontSize: "12px" }}>👤 {log.user_email}</span>
                        )}
                        {log.created_at && (
                          <span style={{ color: "#475569", fontSize: "12px" }}>
                            🕒 {new Date(log.created_at).toLocaleString("uz-UZ")}
                          </span>
                        )}
                        {log.ip && (
                          <span style={{ color: "#475569", fontSize: "12px" }}>🌐 {log.ip}</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ display: "flex", justifyContent: "center", gap: "8px", marginTop: "28px" }}>
                <button
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                  style={{
                    padding: "8px 16px", borderRadius: "10px",
                    background: page === 1 ? "#1e293b" : "#3b82f6",
                    color: page === 1 ? "#475569" : "#fff",
                    border: "none", cursor: page === 1 ? "not-allowed" : "pointer",
                    fontWeight: 700
                  }}
                >← Oldingi</button>
                <span style={{ color: "#94a3b8", padding: "8px 16px", fontWeight: 600 }}>
                  {page} / {totalPages}
                </span>
                <button
                  disabled={page === totalPages}
                  onClick={() => setPage(p => p + 1)}
                  style={{
                    padding: "8px 16px", borderRadius: "10px",
                    background: page === totalPages ? "#1e293b" : "#3b82f6",
                    color: page === totalPages ? "#475569" : "#fff",
                    border: "none", cursor: page === totalPages ? "not-allowed" : "pointer",
                    fontWeight: 700
                  }}
                >Keyingi →</button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
