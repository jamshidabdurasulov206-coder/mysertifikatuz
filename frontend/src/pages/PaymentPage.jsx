import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getSubjects, getTests, createManualPayment, uploadManualReceiptFile, getMyManualPayments, getUserAttempts } from "../api/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import Header from "../components/Header";

const PaymentPage = () => {
  const { testId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { user, loading: authLoading } = useAuth();
  
  const [selectedTest, setSelectedTest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [receiptUrl, setReceiptUrl] = useState(""); // serverdan qaytgan url
  const [receiptFile, setReceiptFile] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState("none"); // none | pending | approved | rejected
  const [paymentId, setPaymentId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user || !testId) return;
    setLoading(true);
    Promise.all([getSubjects(), getTests(), getMyManualPayments()])
      .then(([subjectsData, testsData, myPays]) => {
        const test = testsData.find(t => String(t.id) === String(testId));
        if (test) {
          const subject = subjectsData.find(s => String(s.id) === String(test.subject_id));
          setSelectedTest({ ...test, subjectName: subject?.name || "Fan" });
          localStorage.setItem("subjectsCache", JSON.stringify(subjectsData));
          const existing = (myPays?.payments || []).find(p => String(p.test_id) === String(testId));
          if (existing) {
            setPaymentId(existing.id);
            setPaymentStatus(existing.status || "pending");
            setReceiptUrl(existing.receipt_url || "");
          }
        } else {
          toast.error("Test topilmadi!");
          navigate("/tests");
        }
        setLoading(false);
      })
      .catch(() => {
        toast.error("Ma'lumotlarni yuklashda xatolik");
        setLoading(false);
      });
  }, [user, testId, navigate, toast]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTest) return;
    if (!receiptFile && !receiptUrl) {
      toast.error("Chek faylini yuklang (PDF/JPG/PNG)");
      return;
    }
    try {
      setSubmitting(true);
      let pid = paymentId;
      if (!pid) {
        const created = await createManualPayment({
          test_id: selectedTest.id,
          amount: selectedTest.price || 0,
          currency: "UZS",
          receipt_url: receiptUrl,
          comment: "Chek yuborildi"
        });
        pid = created?.payment?.id || created?.id;
        setPaymentId(pid || null);
      }
      if (pid) {
        if (receiptFile) {
          const uploadRes = await uploadManualReceiptFile(pid, receiptFile);
          const fileUrl = uploadRes?.fileUrl || uploadRes?.payment?.receipt_url;
          if (fileUrl) setReceiptUrl(fileUrl);
        }
      }
      setPaymentStatus("pending");
      toast.success("Chekingiz qabul qilindi. Tez orada testga ruxsat beriladi.");
    } catch (err) {
      toast.error(err.message || "Chek yuborishda xatolik");
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartTest = async () => {
    if (!selectedTest || !user) return;
    try {
      const attempts = await getUserAttempts(user.id);
      const alreadyTook = Array.isArray(attempts) && attempts.some(a => String(a.test_id) === String(selectedTest.id));
      if (alreadyTook) {
        toast.error("Siz avval bu testga qatnashgansiz.");
        return;
      }

      localStorage.setItem("selectedSubjectId", String(selectedTest.subject_id));
      localStorage.setItem("selectedTestId", String(selectedTest.id));
      localStorage.removeItem("exam_time_left");
      localStorage.removeItem("temp_answers");
      navigate("/exam");
    } catch (err) {
      toast.error(err.message || "Testni boshlashda xatolik");
    }
  };

  if (authLoading || loading) return <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bba-bg)" }}><div style={{ width: "40px", height: "40px", borderRadius: "50%", border: "4px solid var(--bba-primary)", borderTopColor: "transparent", animation: "spin 1s linear infinite" }} /></div>;

  return (
    <div style={{ minHeight: "100vh", background: "var(--bba-bg)" }}>
      <Header />
      
      <main className="bba-container" style={{ padding: "60px 24px", maxWidth: "800px" }}>
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <h1 style={{ fontSize: "32px", fontWeight: 900, marginBottom: "12px" }}>To'lovni tasdiqlash</h1>
          <p style={{ color: "var(--bba-text-muted)", fontSize: "16px" }}>Admin karta raqamiga to'lov qiling, chek linkini yuboring.</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "32px" }}>
           {/* Selected Test Details */}
           <section className="bba-glass-card" style={{ padding: "32px", textAlign: "center", background: "linear-gradient(135deg, rgba(37,99,235,0.05) 0%, rgba(99,102,241,0.05) 100%)" }}>
              <div style={{ fontSize: "40px", marginBottom: "16px" }}>📝</div>
              <h2 style={{ fontSize: "24px", fontWeight: 900, marginBottom: "8px" }}>{selectedTest?.title}</h2>
              <div style={{ display: "inline-block", padding: "4px 12px", borderRadius: "8px", background: "rgba(37,99,235,0.1)", color: "var(--bba-primary)", fontSize: "12px", fontWeight: 800, textTransform: "uppercase", marginBottom: "16px" }}>
                 {selectedTest?.subjectName}
              </div>
              <p style={{ fontSize: "14px", color: "var(--bba-text-muted)", maxWidth: "500px", margin: "0 auto" }}>{selectedTest?.description || "Ushbu test orqali o'z darajangizni aniqlang."}</p>
           </section>

           {/* Manual Payment Section */}
           <section className="bba-glass-card" style={{ padding: "40px" }}>
              <h3 style={{ fontSize: "18px", fontWeight: 800, marginBottom: "24px" }}>To'lov ma'lumoti</h3>
              <div style={{ background: "rgba(37,99,235,0.05)", padding: "16px", borderRadius: "16px", border: "1px dashed var(--bba-primary)" }}>
                <p style={{ fontWeight: 800, fontSize: "14px", marginBottom: 8 }}>Admin karta raqami:</p>
                <p style={{ fontSize: "22px", fontWeight: 900, letterSpacing: "1px" }}>9860 3501 4000 3541</p>
                <p style={{ fontSize: "14px", fontWeight: 700, marginTop: 6 }}>Abdurasulov Jamshid</p>
                <p style={{ fontSize: "13px", color: "var(--bba-text-muted)", marginTop: 6 }}>To'lovni shu kartaga qiling va chekningiz linkini yuboring.</p>
              </div>

              <div style={{ 
                background: "rgba(0,0,0,0.02)", padding: "24px", borderRadius: "24px", 
                border: "1px dashed var(--bba-border)", marginTop: "24px", marginBottom: "24px",
                display: "flex", justifyContent: "space-between", alignItems: "center"
              }}>
                 <div>
                    <p style={{ fontSize: "12px", fontWeight: 800, color: "var(--bba-text-muted)", textTransform: "uppercase" }}>To'lov miqdori</p>
                    <p style={{ fontSize: "24px", fontWeight: 900 }}>{selectedTest?.price ? Number(selectedTest.price).toLocaleString() : "0"} UZS</p>
                 </div>
                 <div style={{ textAlign: "right" }}>
                    <p style={{ fontSize: "12px", fontWeight: 800, color: "#dc2626", background: "rgba(239,68,68,0.12)", padding: "6px 14px", borderRadius: "999px", border: "1px solid rgba(239,68,68,0.35)" }}>
                      Chek yuborilgach admin tasdiqlaydi
                    </p>
                 </div>
              </div>

              {paymentStatus !== "approved" && (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 800, color: "var(--bba-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      Chek fayli (PDF/JPG/PNG)
                    </label>
                    <input
                      type="file"
                      accept="application/pdf,image/*"
                      onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                      style={{ width: "100%", padding: "12px", marginTop: 8, borderRadius: 14, border: "1px solid var(--bba-border)", background: "#fff" }}
                      required={!receiptUrl}
                    />
                    <p style={{ fontSize: 12, color: "var(--bba-text-muted)", marginTop: 6 }}>
                      Google Drive linksiz: faylni yuklang, PDF tavsiya etiladi.
                    </p>
                  </div>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="bba-button bba-button-primary"
                    style={{ width: "100%", padding: "16px", fontSize: "16px", borderRadius: "14px", opacity: submitting ? 0.7 : 1 }}
                  >
                    {submitting ? "Yuborilmoqda..." : "Chekni yuborish"}
                  </button>
                  {paymentStatus === "pending" && (
                    <div style={{ textAlign: "center", fontSize: 13, color: "var(--bba-text-muted)", fontWeight: 700 }}>
                      Chekingiz qabul qilindi, admin tasdiqlashi kutilmoqda.
                    </div>
                  )}
                </form>
              )}

              {paymentStatus === "rejected" && (
                <div className="bba-glass-card" style={{ padding: 16, marginTop: 16, background: "rgba(239,68,68,0.08)", color: "#b91c1c", fontWeight: 800 }}>
                  Chek rad etildi. Yangi chek yuboring.
                </div>
              )}

              {paymentStatus === "approved" && (
                <div className="bba-glass-card" style={{ padding: 16, marginTop: 16, background: "rgba(16,185,129,0.1)", color: "#047857", fontWeight: 800 }}>
                  Chek tasdiqlandi! Quyidagi tugma orqali testni boshlang.
                </div>
              )}

              {paymentStatus === "approved" && (
                <button
                  onClick={handleStartTest}
                  className="bba-button bba-button-primary"
                  style={{ width: "100%", padding: "18px", fontSize: "17px", borderRadius: "16px", marginTop: "16px" }}
                >
                  Testni boshlash
                </button>
              )}
           </section>
        </div>
      </main>
    </div>
  );
};

export default PaymentPage;
