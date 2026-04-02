import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getAttemptAnalysis } from "../api/api";
import Header from "../components/Header";

export default function AttemptAnalysisPage() {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getAttemptAnalysis(attemptId)
      .then(d => {
        if (d.success) setData(d);
        else setError("Ma'lumotlarni yuklashda xatolik");
      })
      .catch(err => setError(err.message || "Xatolik yuz berdi"))
      .finally(() => setLoading(false));
  }, [attemptId]);

  if (loading) return <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bba-bg)" }}><div style={{ width: "40px", height: "40px", borderRadius: "50%", border: "4px solid var(--bba-primary)", borderTopColor: "transparent", animation: "spin 1s linear infinite" }} /></div>;

  if (error || !data) return <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bba-bg)", flexDirection: "column", gap: "20px" }}><span style={{ fontSize: "48px" }}>⚠️</span><p>{error}</p><button className="bba-button bba-button-primary" onClick={() => navigate(-1)}>Orqaga</button></div>;

  const { attempt, questions } = data;
  let userAnswers = {};
  try { userAnswers = typeof attempt.answers === 'string' ? JSON.parse(attempt.answers) : (attempt.answers || {}); } catch(e) { userAnswers = {}; }
  let writtenScores = {};
  try { writtenScores = typeof attempt.written_scores === 'string' ? JSON.parse(attempt.written_scores) : (attempt.written_scores || {}); } catch(e) { writtenScores = {}; }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bba-bg)" }}>
      <Header />
      
      <main className="bba-container" style={{ padding: "40px 24px", maxWidth: "800px" }}>
        <div style={{ marginBottom: "40px", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
           <div>
              <h1 style={{ fontSize: "32px", fontWeight: 900, marginBottom: "8px" }}>📊 Natija Tahlili</h1>
              <p style={{ color: "var(--bba-text-muted)", fontSize: "16px" }}>{attempt.subject_name} • {new Date(attempt.created_at).toLocaleDateString("uz-UZ")}</p>
           </div>
           <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "32px", fontWeight: 900, color: "var(--bba-primary)" }}>{attempt.final_score || attempt.score || 0} ball</div>
              <div style={{ fontSize: "12px", fontWeight: 800, color: "var(--bba-success)", background: "rgba(16,185,129,0.1)", padding: "4px 12px", borderRadius: "8px", display: "inline-block" }}>{attempt.level || "B"} daraja</div>
           </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {questions.map((q, idx) => {
            const userAnswer = userAnswers[q.id];
            const type = (q.type || '').toLowerCase();
            const isMultiple = type === 'multiple';
            const scoreForOpen = Number(writtenScores[q.id] ?? 0);
            const isCorrect = isMultiple
              ? String(userAnswer) === String(q.correct_option)
              : scoreForOpen > 0;
            const hasAnswer = userAnswer !== undefined && userAnswer !== null && String(userAnswer).trim() !== "";
            const indicatorColor = isCorrect
              ? "#10b981"
              : (hasAnswer ? "#f43f5e" : "#94a3b8");
            const statusLabel = isMultiple
              ? (isCorrect ? "To'g'ri ✓" : (hasAnswer ? "Xato ✕" : "Javob berilmagan"))
              : (isCorrect ? "To'g'ri ✓" : (hasAnswer ? "Xato ✕" : "Javob berilmagan"));

            return (
              <div key={q.id} className="bba-glass-card" style={{ padding: "32px", position: "relative", overflow: "hidden" }}>
                {/* Visual Indicator */}
                <div style={{ position: "absolute", top: 0, left: 0, width: "6px", height: "100%", background: indicatorColor }} />

                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px" }}>
                   <span style={{ fontSize: "12px", fontWeight: 800, color: "var(--bba-text-muted)", background: "rgba(0,0,0,0.05)", padding: "4px 10px", borderRadius: "8px" }}>Savol {idx+1}</span>
                   <span style={{ fontSize: "14px", fontWeight: 800, color: indicatorColor }}>
                      {statusLabel}
                   </span>
                </div>

                <h3 style={{ fontSize: "18px", fontWeight: 800, lineHeight: 1.5, marginBottom: "24px" }}>{q.question_text}</h3>

                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {isMultiple ? (
                     (() => {
                        let opts = [];
                        try { opts = typeof q.options === 'string' ? JSON.parse(q.options) : (q.options || []); } catch(e) {}
                        return opts.map((opt, oIdx) => {
                           const isUser = String(userAnswer) === String(oIdx);
                           const isCorrectOpt = String(q.correct_option) === String(oIdx);
                           return (
                             <div key={oIdx} style={{ 
                               padding: "16px 20px", borderRadius: "16px", border: `2px solid ${isUser ? (isCorrect ? "#10b981" : "#f43f5e") : (isCorrectOpt ? "#10b981" : "var(--bba-border)")}`,
                               background: isUser ? (isCorrect ? "rgba(16,185,129,0.05)" : "rgba(244,63,94,0.05)") : (isCorrectOpt ? "rgba(16,185,129,0.05)" : "transparent"),
                               display: "flex", alignItems: "center", gap: "12px", transition: "var(--bba-transition)"
                             }}>
                               <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: isCorrectOpt ? "#10b981" : (isUser ? "#f43f5e" : "rgba(0,0,0,0.05)"), color: (isCorrectOpt || isUser) ? "#fff" : "var(--bba-text-muted)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 900 }}>
                                 {String.fromCharCode(65 + oIdx)}
                               </div>
                               <span style={{ fontSize: "15px", fontWeight: 600 }}>{opt}</span>
                               {isCorrectOpt && !isUser && <span style={{ marginLeft: "auto", fontSize: "11px", fontWeight: 800, color: "#10b981" }}>To'g'ri javob</span>}
                             </div>
                           );
                        });
                     })()
                  ) : (
                    <div>
                       <div style={{ padding: "16px", borderRadius: "16px", border: "1px solid var(--bba-border)", background: "rgba(0,0,0,0.02)", fontSize: "14px", color: "var(--bba-text-main)" }}>
                          <p style={{ fontSize: "11px", fontWeight: 800, color: "var(--bba-text-muted)", textTransform: "uppercase", marginBottom: "8px" }}>Sizning javobingiz:</p>
                          {userAnswer || "(Bo'sh)"}
                         {!isCorrect && q.correct_answer_text && (
                            <div style={{ marginTop: "12px", padding: "14px", borderRadius: "12px", border: "1px dashed #10b981", background: "rgba(16,185,129,0.04)", fontSize: "13px", color: "var(--bba-text-main)" }}>
                              <p style={{ fontSize: "11px", fontWeight: 800, color: "#10b981", textTransform: "uppercase", marginBottom: "6px" }}>To'g'ri javob:</p>
                              {q.correct_answer_text}
                            </div>
                         )}
                       </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
