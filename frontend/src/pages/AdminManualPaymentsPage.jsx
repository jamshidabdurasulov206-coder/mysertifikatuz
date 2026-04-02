import React, { useCallback, useEffect, useMemo, useState } from "react";
import Header from "../components/Header";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import {
  getPendingManualPayments,
  approveManualPayment,
  rejectManualPayment,
  buildReceiptUrl,
} from "../api/api";

const AdminManualPaymentsPage = () => {
  const { user } = useAuth();
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const isAdmin = useMemo(() => user && user.role === "admin", [user]);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getPendingManualPayments();
      setItems(res.payments || []);
    } catch (err) {
      toast.error(err.message || "To'lovlarni yuklab bo'lmadi");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (isAdmin) load();
  }, [isAdmin, load]);

  const handleAction = async (id, type) => {
    const comment = window.prompt(type === "approve" ? "(Ixtiyoriy) izoh" : "Rad etish sababi", "");
    try {
      setActionLoadingId(id);
      if (type === "approve") {
        await approveManualPayment(id, comment || "");
        toast.success("Tasdiqlandi");
      } else {
        await rejectManualPayment(id, comment || "");
        toast.success("Rad etildi");
      }
      await load();
    } catch (err) {
      toast.error(err.message || "Amalda xatolik");
    } finally {
      setActionLoadingId(null);
    }
  };

  if (!isAdmin) {
    return <div style={{ padding: 40 }}>Ruxsat yo'q.</div>;
  }

  const getFileName = (url) => {
    if (!url) return "";
    try {
      return decodeURIComponent(url.split("/").pop() || url);
    } catch (_) {
      return url.split("/").pop() || url;
    }
  };

  const isPdf = (url = "") => /\.pdf($|\?)/i.test(url);
  const isImage = (url = "") => /\.(png|jpe?g|gif|webp|bmp|svg)($|\?)/i.test(url);

  return (
    <div style={{ minHeight: "100vh", background: "var(--bba-bg)" }}>
      <Header />
      <main className="bba-container" style={{ padding: "48px 24px", maxWidth: "1200px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 900, marginBottom: 6 }}>Qo'lda to'lovlar</h1>
            <p style={{ color: "var(--bba-text-muted)" }}>Foydalanuvchilar yuborgan cheklar. Tasdiqlanganda testga ruxsat ochiladi.</p>
          </div>
          <button onClick={load} className="bba-button" style={{ padding: "10px 16px", borderRadius: 12 }}>Yangilash</button>
        </div>

        {loading ? (
          <div style={{ padding: 40 }}>Yuklanmoqda...</div>
        ) : items.length === 0 ? (
          <div className="bba-glass-card" style={{ padding: 32 }}>Kutayotgan to'lov yo'q.</div>
        ) : (
          <div className="bba-glass-card" style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr", gap: 0, borderBottom: "1px solid var(--bba-border)", background: "var(--bba-card)" }}>
              <div style={thStyle}>Foydalanuvchi</div>
              <div style={thStyle}>Test ID</div>
              <div style={thStyle}>Summa</div>
              <div style={thStyle}>Chek</div>
              <div style={thStyle}>Harakat</div>
            </div>
            {items.map(item => (
              (() => {
                const receiptLink = buildReceiptUrl(item.receipt_url) || item.receipt_file_url || "";
                return (
              <div key={item.id} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr", borderBottom: "1px solid var(--bba-border)", alignItems: "center", padding: "12px 16px" }}>
                <div style={tdStyle}>
                  <div style={{ fontWeight: 700 }}>{item.username || `User #${item.user_id}`}</div>
                  <div style={{ fontSize: 12, color: "var(--bba-text-muted)" }}>{item.email || "-"}</div>
                </div>
                <div style={tdStyle}>{item.test_id || "—"}</div>
                <div style={tdStyle}>{Number(item.amount || 0).toLocaleString()} {item.currency || "UZS"}</div>
                <div style={tdStyle}>
                  {item.receipt_url ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {isImage(item.receipt_url) && (
                        <a href={receiptLink} target="_blank" rel="noreferrer" style={{ display: "inline-block" }}>
                          <img
                            src={receiptLink}
                            alt="Chek"
                            style={{ width: 88, height: 88, objectFit: "cover", borderRadius: 10, border: "1px solid var(--bba-border)" }}
                          />
                        </a>
                      )}

                      {isPdf(item.receipt_url) && (
                        <div style={{ fontSize: 12, color: "var(--bba-text-muted)", fontWeight: 700 }}>
                          PDF fayl
                        </div>
                      )}

                      <a href={receiptLink} target="_blank" rel="noreferrer" style={{ color: "var(--bba-primary)", fontWeight: 700 }}>
                        Chekni ko'rish
                      </a>
                      <div style={{ fontSize: 11, color: "var(--bba-text-muted)", wordBreak: "break-all" }}>
                        {getFileName(item.receipt_url)}
                      </div>
                    </div>
                  ) : (
                    <span style={{ color: "var(--bba-text-muted)" }}>Yuklanmagan</span>
                  )}
                </div>
                <div style={tdStyle}>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <button
                      disabled={actionLoadingId === item.id}
                      onClick={() => handleAction(item.id, "approve")}
                      className="bba-button bba-button-primary"
                      style={{ padding: "8px 12px", borderRadius: 10 }}
                    >
                      Tasdiqlash
                    </button>
                    <button
                      disabled={actionLoadingId === item.id}
                      onClick={() => handleAction(item.id, "reject")}
                      className="bba-button"
                      style={{ padding: "8px 12px", borderRadius: 10, background: "#fee2e2", color: "#b91c1c" }}
                    >
                      Rad etish
                    </button>
                  </div>
                </div>
              </div>
                );
              })()
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

const thStyle = {
  padding: "12px 16px",
  fontWeight: 800,
  fontSize: 13,
  textTransform: "uppercase",
  letterSpacing: "0.5px",
  color: "var(--bba-text-muted)",
};

const tdStyle = {
  padding: "8px 16px",
  fontSize: 14,
};

export default AdminManualPaymentsPage;
