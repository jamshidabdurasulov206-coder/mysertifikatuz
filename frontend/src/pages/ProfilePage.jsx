import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getUserAttempts, updateProfile } from "../api/api";
import { useAuth } from "../context/AuthContext";
import jsPDF from "jspdf";
import QRCode from "qrcode";
import html2canvas from "html2canvas";
import { useTheme } from "../context/ThemeContext";
import Header from "../components/Header";

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, login: loginContext } = useAuth();
  const { dark } = useTheme();

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editFatherName, setEditFatherName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");
  const [editSuccess, setEditSuccess] = useState("");

  const [activeAttempt, setActiveAttempt] = useState(null);
  const [profileQr, setProfileQr] = useState("");
  const certRef = useRef(null);

  useEffect(() => {
    if (user?.full_name) {
      const parts = user.full_name.split(" ");
      setEditLastName(parts[0] || "");
      setEditFirstName(parts[1] || "");
      setEditFatherName(parts.slice(2).join(" ") || "");
    }
    if (user?.email) {
      setEditEmail(user.email);
    }
  }, [user]);

  useEffect(() => {
    const fetchResults = async () => {
      const effectiveUserId = user?.id || localStorage.getItem("userId");
      if (!effectiveUserId) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setError("");
      try {
        const data = await getUserAttempts(effectiveUserId);
        setResults(data || []);
      } catch (err) {
        setError("Natijalarni yuklashda xatolik yuz berdi.");
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [user]);

  useEffect(() => {
    if (!loading) return;
    const t = setTimeout(() => {
      setLoading(false);
      setError((prev) => prev || "Ma'lumotni yuklash cho'zildi. Sahifani yangilang.");
    }, 10000);
    return () => clearTimeout(t);
  }, [loading]);

  useEffect(() => {
    if (!user) return;
    const qrPayload = `user:${user.id}`;
    QRCode.toDataURL(qrPayload).then(setProfileQr).catch(() => setProfileQr(""));
  }, [user]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) navigate("/login");
  }, [authLoading, user, navigate]);

  const handleUpdateProfile = async (event) => {
    event.preventDefault();
    setEditError("");
    setEditSuccess("");
    setEditLoading(true);

    try {
      const full_name = [editLastName, editFirstName, editFatherName].filter(Boolean).join(" ");
      const updated = await updateProfile({
        full_name,
        email: editEmail,
        password: editPassword || undefined,
      });
      const updatedUser = updated?.user ? { ...user, ...updated.user } : { ...user, ...updated };
      loginContext(updatedUser);
      setEditSuccess("Profil yangilandi.");
      setEditPassword("");
      setEditModalOpen(false);
    } catch (err) {
      setEditError(err.message || "Profilni yangilashda xatolik yuz berdi.");
    } finally {
      setEditLoading(false);
    }
  };

  const handleDownloadCertificate = async (attempt) => {
    setActiveAttempt(attempt);
    const qrData = `attempt:${attempt.id}|user:${user?.id}|score:${attempt.final_score}`;
    try {
      const qr = await QRCode.toDataURL(qrData);
      setProfileQr(qr);
    } catch (err) {
      setProfileQr("");
    }

    // Wait for hidden certificate renderer to paint
    setTimeout(async () => {
      if (!certRef.current) return;
      const canvas = await html2canvas(certRef.current, { scale: 2 });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`certificate_${attempt.id}.pdf`);
    }, 150);
  };

  if (authLoading || loading) {
    return (
      <div className="bba-container" style={{ padding: "40px", textAlign: "center" }}>
        <Header />
        <p>Yuklanmoqda...</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className={`app ${dark ? "dark" : ""}`} style={{ minHeight: "100vh", background: "var(--bba-bg)" }}>
      <Header />
      <main className="bba-container" style={{ padding: "32px 20px", maxWidth: "1100px" }}>
        <div className="bba-grid" style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "16px" }}>
          <section className="bba-glass-card" style={{ padding: "32px", minHeight: "420px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div>
                <p style={{ margin: 0, fontSize: "14px", color: "var(--bba-text-muted)" }}>Profil</p>
                <h1 style={{ margin: "4px 0 0 0", fontSize: "26px" }}>{user.full_name || "Foydalanuvchi"}</h1>
                <p style={{ margin: 0, color: "var(--bba-text-muted)" }}>{user.email}</p>
              </div>
              <button onClick={() => setEditModalOpen(true)} className="bba-button" style={{ padding: "10px 14px" }}>
                Ma'lumotlarni tahrirlash
              </button>
            </div>

            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <div className="bba-stat" style={{ flex: "1 1 140px", padding: "16px", border: "1px solid var(--bba-border)", borderRadius: "14px" }}>
                <p style={{ margin: 0, color: "var(--bba-text-muted)", fontSize: "12px" }}>Umumiy urinishlar</p>
                <h3 style={{ margin: "4px 0 0 0" }}>{results.length}</h3>
              </div>
              <div className="bba-stat" style={{ flex: "1 1 140px", padding: "16px", border: "1px solid var(--bba-border)", borderRadius: "14px" }}>
                <p style={{ margin: 0, color: "var(--bba-text-muted)", fontSize: "12px" }}>E'lon qilingan</p>
                <h3 style={{ margin: "4px 0 0 0" }}>{results.filter((r) => r.is_published).length}</h3>
              </div>
              <div className="bba-stat" style={{ flex: "1 1 140px", padding: "16px", border: "1px solid var(--bba-border)", borderRadius: "14px" }}>
                <p style={{ margin: 0, color: "var(--bba-text-muted)", fontSize: "12px" }}>Kutilmoqda</p>
                <h3 style={{ margin: "4px 0 0 0" }}>{results.filter((r) => !r.is_published).length}</h3>
              </div>
            </div>

            {error && <p style={{ color: "var(--bba-danger)", marginTop: "12px" }}>{error}</p>}
          </section>

          <section className="bba-glass-card" style={{ padding: "32px", minHeight: "420px" }}>
            <h2 style={{ marginTop: 0 }}>QR kod</h2>
            {profileQr ? (
              <div style={{ textAlign: "center" }}>
                <img src={profileQr} alt="QR" style={{ width: "160px", border: "1px solid var(--bba-border)", padding: "8px", borderRadius: "12px", background: "#fff" }} />
                <p style={{ color: "var(--bba-text-muted)" }}>Profil ma'lumoti</p>
              </div>
            ) : (
              <p style={{ color: "var(--bba-text-muted)" }}>QR kod tayyorlanmoqda...</p>
            )}
          </section>
        </div>

        <section
          className="bba-glass-card"
          style={{
            padding: "32px",
            marginTop: "20px",
            background: "radial-gradient(circle at 20% 20%, rgba(59,130,246,0.08), transparent 30%), radial-gradient(circle at 80% 0%, rgba(16,185,129,0.1), transparent 32%), #0b1223",
            border: "1px solid rgba(148, 163, 184, 0.15)",
            color: "#e2e8f0",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
            <div>
              <p style={{ margin: 0, color: "#94a3b8", letterSpacing: "0.02em", fontWeight: 600 }}>Natijalarim</p>
              <h2 style={{ fontSize: "22px", fontWeight: 900, margin: "4px 0 0" }}>Oxirgi urinishlar</h2>
            </div>
            <span style={{ fontSize: "12px", color: "#94a3b8" }}>
              {results.length} ta urinish • {results.filter((r) => r.is_published).length} tasi e'lon qilingan
            </span>
          </div>

          {results.length === 0 ? (
            <div style={{ padding: "40px", textAlign: "center", color: "#94a3b8" }}>
              <p>Hozircha natijalar yo'q.</p>
              <button
                onClick={() => navigate("/tests")}
                style={{ marginTop: "16px", color: "#60a5fa", fontWeight: 700, border: "1px solid rgba(148,163,184,0.4)", background: "transparent", cursor: "pointer", padding: "10px 16px", borderRadius: "12px" }}
              >
                Test ishlashni boshlash →
              </button>
            </div>
          ) : (
            <div style={{ display: "grid", gap: "16px", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}>
              {results.map((attempt) => {
                const status = attempt.status || (attempt.is_published ? "published" : "pending");
                const isPublished = Boolean(attempt.is_published);
                const hasRaschScore = isPublished && attempt.t_score !== null && attempt.t_score !== undefined;
                const raschScore = hasRaschScore ? Number(attempt.t_score) : null;
                const showLevel = attempt.level && String(attempt.level).toLowerCase() !== "fail";
                const statusLabel = (() => {
                  if (isPublished) return "E'lon qilingan";
                  if (status === "ready_for_rasch" || status === "reviewed") return "AI tekshirildi";
                  if (status === "waiting_ai") return "AI tekshirilmoqda";
                  return "Tekshirilmoqda";
                })();
                const badgeColors = isPublished
                  ? { bg: "rgba(22,163,74,0.15)", text: "#22c55e", border: "rgba(34,197,94,0.5)" }
                  : status === "ready_for_rasch" || status === "reviewed"
                    ? { bg: "rgba(59,130,246,0.12)", text: "#60a5fa", border: "rgba(96,165,250,0.5)" }
                    : { bg: "rgba(234,179,8,0.14)", text: "#facc15", border: "rgba(250,204,21,0.5)" };

                return (
                  <div
                    key={attempt.id}
                    style={{
                      borderRadius: "18px",
                      background: "linear-gradient(135deg, rgba(15,23,42,0.9), rgba(30,41,59,0.85))",
                      border: "1px solid rgba(148, 163, 184, 0.12)",
                      padding: "18px",
                      position: "relative",
                      overflow: "hidden",
                      boxShadow: "0 15px 35px rgba(0,0,0,0.35)",
                      minHeight: "160px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "12px",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ padding: "6px 10px", borderRadius: "10px", background: badgeColors.bg, color: badgeColors.text, border: `1px solid ${badgeColors.border}`, fontSize: "12px", fontWeight: 700 }}>
                        {statusLabel}
                      </div>
                      <span style={{ fontSize: "11px", color: "#94a3b8" }}>
                        {new Date(attempt.created_at).toLocaleDateString("uz-UZ")}
                      </span>
                    </div>

                    <div>
                      <p style={{ margin: 0, color: "#cbd5e1", fontSize: "13px" }}>Fan</p>
                      <h3 style={{ margin: "2px 0 0", fontSize: "18px", fontWeight: 900, color: "#e2e8f0" }}>{attempt.subject_name}</h3>
                    </div>

                    <div style={{ display: "flex", alignItems: "flex-end", gap: "10px", marginTop: "auto" }}>
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: 0, color: "#94a3b8", fontSize: "12px" }}>Rasch bali</p>
                        <div style={{ fontSize: "26px", fontWeight: 900, color: "#22c55e" }}>
                          {isPublished ? (hasRaschScore ? `${raschScore.toFixed(1)} ball` : "E'lon qilingan") : "Kutilmoqda"}
                        </div>
                        {isPublished && showLevel && (
                          <p style={{ margin: 0, color: "#94a3b8", fontSize: "12px" }}>Daraja: {attempt.level}</p>
                        )}
                      </div>

                      {isPublished ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                          <button
                            onClick={() => navigate(`/attempt-analysis/${attempt.id}`)}
                            className="bba-button"
                            style={{ padding: "10px 14px", fontSize: "12px", background: "rgba(96,165,250,0.12)", color: "#bfdbfe", border: "1px solid rgba(96,165,250,0.4)" }}
                          >
                            Tahlil
                          </button>
                          <button
                            onClick={() => handleDownloadCertificate(attempt)}
                            className="bba-button bba-button-primary"
                            style={{ padding: "10px 14px", fontSize: "12px" }}
                          >
                            Sertifikat
                          </button>
                        </div>
                      ) : (
                        <div style={{ padding: "12px 14px", borderRadius: "12px", border: "1px dashed rgba(148,163,184,0.4)", color: "#94a3b8", fontSize: "12px" }}>
                          Tekshiruv yakunlanishi kutilmoqda
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {editModalOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div className="bba-glass-card" style={{ maxWidth: "420px", width: "100%", padding: "40px" }}>
            <h2 style={{ marginBottom: "24px" }}>Profil yangilash</h2>
            <form onSubmit={handleUpdateProfile} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <input type="text" placeholder="Familiya" value={editLastName} onChange={(e) => setEditLastName(e.target.value)} required style={{ padding: "12px", borderRadius: "12px", border: "1px solid var(--bba-border)" }} />
              <input type="text" placeholder="Ism" value={editFirstName} onChange={(e) => setEditFirstName(e.target.value)} required style={{ padding: "12px", borderRadius: "12px", border: "1px solid var(--bba-border)" }} />
              <input type="text" placeholder="Otasining ismi" value={editFatherName} onChange={(e) => setEditFatherName(e.target.value)} style={{ padding: "12px", borderRadius: "12px", border: "1px solid var(--bba-border)" }} />
              <input type="email" placeholder="Email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} required style={{ padding: "12px", borderRadius: "12px", border: "1px solid var(--bba-border)" }} />
              <input type="password" placeholder="Yangi parol (ixtiyoriy)" value={editPassword} onChange={(e) => setEditPassword(e.target.value)} style={{ padding: "12px", borderRadius: "12px", border: "1px solid var(--bba-border)" }} />

              {editError && <p style={{ color: "var(--bba-danger)", fontSize: "12px" }}>{editError}</p>}
              {editSuccess && <p style={{ color: "var(--bba-success)", fontSize: "12px" }}>{editSuccess}</p>}

              <div style={{ display: "flex", gap: "12px", marginTop: "12px" }}>
                <button type="button" onClick={() => setEditModalOpen(false)} style={{ flex: 1, padding: "12px", borderRadius: "12px", border: "1px solid var(--bba-border)", background: "transparent", cursor: "pointer" }}>
                  Bekor qilish
                </button>
                <button type="submit" disabled={editLoading} className="bba-button bba-button-primary" style={{ flex: 1 }}>
                  {editLoading ? "Saqlanmoqda..." : "Saqlash"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {activeAttempt && (() => {
        const nameParts = (user?.full_name || "").split(" ");
        const lastName = nameParts[0] || "NOMA'LUM";
        const firstName = nameParts[1] || "";
        const fatherName = nameParts.slice(2).join(" ") || "";
        const percent = Math.round((activeAttempt.final_score / 100) * 100);
        const expiryDate = new Date(activeAttempt.created_at);
        expiryDate.setFullYear(expiryDate.getFullYear() + 3);
        const qrData = `UZ26-${activeAttempt.id}-${user?.id}`;

        return (
          <div style={{ position: "absolute", left: "-9999px", top: 0, zIndex: -1 }}>
            <div
              ref={certRef}
              style={{
                width: "210mm",
                height: "297mm",
                background: "#fff",
                padding: "15mm",
                position: "relative",
                border: "12px double #b8860b",
                boxSizing: "border-box",
                display: "flex",
                flexDirection: "column",
                fontFamily: "'Times New Roman', serif",
                color: "#000",
              }}
            >
              <div style={{ position: "absolute", inset: 0, opacity: 0.03, backgroundImage: "radial-gradient(#000 0.5px, transparent 0.5px)", backgroundSize: "10px 10px", pointerEvents: "none" }} />

              <div style={{ textAlign: "center", marginBottom: "10mm" }}>
                <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/7/77/Emblem_of_Uzbekistan.svg/512px-Emblem_of_Uzbekistan.svg.png" alt="Emblem" style={{ width: "35mm", marginBottom: "5mm" }} />
                <div style={{ fontSize: "12pt", fontWeight: "bold", lineHeight: 1.4, textTransform: "uppercase" }}>
                  O'ZBEKISTON RESPUBLIKASI OLIY TA'LIM, FAN VA INNOVATSIYALAR VAZIRLIGI
                  <br />
                  HUZURIDAGI BILIM VA MALAKALARNI BAHOLASH AGENTLIGI
                </div>
                <div style={{ borderBottom: "2px solid #000", margin: "5mm auto", width: "80%" }} />
                <h1 style={{ fontSize: "18pt", fontWeight: "bold", margin: "5mm 0" }}>
                  UMUMTA'LIM FANINI BILISH DARAJASI
                  <br />
                  TO'G'RISIDA SERTIFIKAT
                </h1>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", gap: "5mm", padding: "0 10mm" }}>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8mm" }}>
                  {[
                    { label: "Sertifikat raqami:", val: `UZ26 ${activeAttempt.id.toString().substring(0, 5)}`, bold: true },
                    { label: "Talabgorning shaxsiy kodi:", val: user?.id },
                    { label: "Familiyasi:", val: lastName.toUpperCase(), bold: true },
                    { label: "Ismi:", val: firstName.toUpperCase(), bold: true },
                    { label: "Otasining ismi:", val: fatherName.toUpperCase(), bold: true },
                    { label: "Umumta'lim fani:", val: activeAttempt.subject_name, bold: true },
                    { label: "Umumiy to'plagan bali:", val: activeAttempt.final_score, bold: true },
                    { label: "Umumiy ballga nisbatan foiz ko'rsatkichi:", val: `${percent} %`, bold: true },
                    { label: "Sertifikat darajasi:", val: activeAttempt.level || "C+", bold: true },
                    { label: "Test sinovi natijasi:", val: activeAttempt.final_score, bold: true },
                  ].map((field, index) => (
                    <div key={index} style={{ display: "flex", borderBottom: "0.5px dotted #ccc", paddingBottom: "2px" }}>
                      <span style={{ fontSize: "12pt", minWidth: "80mm" }}>{field.label}</span>
                      <span style={{ fontSize: "12pt", fontWeight: field.bold ? "bold" : "normal", textAlign: "right", flex: 1 }}>{field.val}</span>
                    </div>
                  ))}
                </div>

                <div style={{ width: "40mm", height: "50mm", border: "1px solid #000", display: "flex", alignItems: "center", justifyContent: "center", background: "#fff", alignSelf: "flex-start", marginTop: "15mm" }}>
                  <span className="material-symbols-outlined" style={{ fontSize: "48pt", color: "#3b82f6" }}>
                    person
                  </span>
                </div>
              </div>

              <div style={{ marginTop: "auto", textAlign: "center", paddingBottom: "10mm" }}>
                <div style={{ padding: "4px", background: "#fff", display: "inline-block", border: "1px solid #ccc", marginBottom: "10mm" }}>
                  {profileQr ? <img src={profileQr} alt="QR" style={{ width: "40mm" }} /> : <img src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(qrData)}`} alt="QR" style={{ width: "40mm" }} />}
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", padding: "0 10mm", width: "100%", boxSizing: "border-box" }}>
                  <div style={{ textAlign: "left" }}>
                    <p style={{ margin: 0, fontSize: "11pt" }}>Berilgan sanasi:</p>
                    <p style={{ margin: 0, fontSize: "12pt", fontWeight: "bold" }}>{new Date(activeAttempt.created_at).toISOString().split("T")[0]}</p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ margin: 0, fontSize: "11pt" }}>Amal qilish muddati:</p>
                    <p style={{ margin: 0, fontSize: "12pt", fontWeight: "bold" }}>{expiryDate.toISOString().split("T")[0]}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default ProfilePage;
