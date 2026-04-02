import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAdminMessages, markMessageAsRead } from "../api/api";

export default function AdminMessagesPage() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const navigate = useNavigate();

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const data = await getAdminMessages();
      setMessages(data.data || []);
    } catch (err) {
      console.error("Xabarlarni yuklashda xatolik:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMessages(); }, []);

  const handleOpen = async (msg) => {
    setSelected(msg);
    if (!msg.is_read) {
      try {
        await markMessageAsRead(msg.id);
        setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, is_read: true } : m));
      } catch (err) { /* silent */ }
    }
  };

  const unreadCount = messages.filter(m => !m.is_read).length;

  return (
    <div style={{
      minHeight: "100vh", background: "#0f172a",
      fontFamily: "'Inter', sans-serif", paddingBottom: "60px"
    }}>
      {/* Header */}
      <header style={{
        background: "#1e293b", borderBottom: "1px solid #334155",
        padding: "20px 28px", display: "flex", alignItems: "center",
        gap: "16px", position: "sticky", top: 0, zIndex: 50
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
            📨 Foydalanuvchi Murojaatlari
          </h1>
          <p style={{ color: "#64748b", fontSize: "12px", margin: 0 }}>
            {unreadCount > 0 ? `${unreadCount} ta yangi murojaat` : "Barcha murojaatlar ko'rilgan"}
          </p>
        </div>
        <div style={{ marginLeft: "auto", background: "#334155", borderRadius: "10px", padding: "6px 14px" }}>
          <span style={{ color: "#94a3b8", fontSize: "13px", fontWeight: 600 }}>
            Jami: <b style={{ color: "#f1f5f9" }}>{messages.length}</b> ta
          </span>
        </div>
      </header>

      <main style={{ maxWidth: "960px", margin: "0 auto", padding: "28px 20px", display: "flex", gap: "20px" }}>
        {/* List panel */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px", minWidth: 0 }}>
          {loading ? (
            [...Array(6)].map((_, i) => (
              <div key={i} style={{
                height: "80px", borderRadius: "14px",
                background: "#1e293b", animation: "pulse 1.4s infinite"
              }} />
            ))
          ) : messages.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 0", color: "#64748b" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
              <p style={{ fontWeight: 700 }}>Hali hech qanday murojaat yo'q</p>
            </div>
          ) : messages.map((msg) => (
            <div
              key={msg.id}
              onClick={() => handleOpen(msg)}
              style={{
                background: selected?.id === msg.id ? "rgba(59,130,246,0.12)" : "#1e293b",
                border: `1px solid ${selected?.id === msg.id ? "#3b82f6" : (msg.is_read ? "#334155" : "#3b82f640")}`,
                borderRadius: "14px", padding: "14px 18px",
                cursor: "pointer", transition: "all 0.2s",
                display: "flex", alignItems: "flex-start", gap: "14px"
              }}
            >
              {/* Unread dot */}
              <div style={{ paddingTop: "4px", flexShrink: 0 }}>
                <div style={{
                  width: 10, height: 10, borderRadius: "50%",
                  background: msg.is_read ? "#334155" : "#3b82f6",
                  boxShadow: msg.is_read ? "none" : "0 0 6px #3b82f6"
                }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px" }}>
                  <p style={{
                    color: "#f1f5f9", fontWeight: msg.is_read ? 600 : 800,
                    fontSize: "14px", margin: 0, overflow: "hidden",
                    textOverflow: "ellipsis", whiteSpace: "nowrap"
                  }}>{msg.name}</p>
                  <span style={{ color: "#475569", fontSize: "11px", flexShrink: 0 }}>
                    {new Date(msg.created_at).toLocaleDateString("uz-UZ", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                <p style={{ color: "#64748b", fontSize: "12px", margin: "3px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {msg.email}
                </p>
                <p style={{ color: "#94a3b8", fontSize: "12px", margin: "4px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {msg.message}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Detail panel */}
        {selected ? (
          <div style={{
            width: "360px", flexShrink: 0, background: "#1e293b",
            border: "1px solid #334155", borderRadius: "20px",
            padding: "24px", position: "sticky", top: "88px",
            alignSelf: "flex-start", maxHeight: "calc(100vh - 120px)", overflow: "auto"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
              <div>
                <p style={{ color: "#f1f5f9", fontWeight: 800, fontSize: "18px", margin: 0 }}>{selected.name}</p>
                <a href={`mailto:${selected.email}`} style={{ color: "#3b82f6", fontSize: "13px", wordBreak: "break-all" }}>
                  {selected.email}
                </a>
              </div>
              <button
                onClick={() => setSelected(null)}
                style={{ background: "#334155", border: "none", borderRadius: "8px", padding: "6px 12px", color: "#94a3b8", cursor: "pointer", fontSize: "12px" }}
              >✕</button>
            </div>

            <div style={{
              background: "#0f172a", borderRadius: "12px", padding: "16px",
              color: "#cbd5e1", fontSize: "14px", lineHeight: "1.8", marginBottom: "20px"
            }}>
              {selected.message}
            </div>

            <div style={{ display: "flex", gap: "8px" }}>
              <a
                href={`mailto:${selected.email}?subject=Murojaatingizga javob`}
                style={{
                  flex: 1, background: "#3b82f6", color: "#fff", textDecoration: "none",
                  borderRadius: "12px", padding: "12px 16px", fontWeight: 700,
                  fontSize: "13px", textAlign: "center", display: "block"
                }}
              >📧 Javob berish</a>
            </div>
            <p style={{ color: "#475569", fontSize: "11px", marginTop: "12px", textAlign: "center" }}>
              {new Date(selected.created_at).toLocaleString("uz-UZ")}
            </p>
          </div>
        ) : (
          <div style={{
            width: "360px", flexShrink: 0, background: "rgba(30,41,59,0.4)",
            border: "1px dashed #334155", borderRadius: "20px",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#475569", fontSize: "14px", fontWeight: 600, padding: "40px",
            textAlign: "center"
          }}>
            Murojaat tanlang va batafsil ma'lumot ko'ring
          </div>
        )}
      </main>
    </div>
  );
}
