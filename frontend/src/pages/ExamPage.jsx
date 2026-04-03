import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getQuestions, sendAttempt } from "../api/api";
import { useToast } from "../context/ToastContext";

const getGoogleDriveDirectLink = (url) => {
  if (!url || typeof url !== 'string' || !url.includes('drive.google.com')) return url;
  try {
    const fileIdMatch = url.match(/(?:\/d\/|id=)([\w-]+)/);
    const fileId = fileIdMatch ? fileIdMatch[1] : null;
    if (fileId) return `https://lh3.googleusercontent.com/d/${fileId}`;
  } catch (error) { console.error("GD Link error:", error); }
  return url;
};

export default function ExamPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 768);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [currentSubject, setCurrentSubject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const isAnsweredValue = (value) => {
    if (value === undefined || value === null) return false;
    if (typeof value === "string") return value.trim().length > 0;
    return true;
  };

  // 2.5 hours = 9000 seconds
  const TOTAL_TIME = 9000;
  const [timeLeft, setTimeLeft] = useState(() => {
    const savedTime = localStorage.getItem("exam_time_left");
    return savedTime ? parseInt(savedTime) : TOTAL_TIME;
  });

  const submitTest = useCallback(async () => {
    const subjects = JSON.parse(localStorage.getItem("subjectsCache") || "[]");
    const selectedSubjectId = localStorage.getItem("selectedSubjectId");
    const subjectName = currentSubject?.name || subjects.find(s => String(s.id) === String(selectedSubjectId))?.name;

    if (!subjectName) {
      toast.error("Fan ma'lumotlari yuklanmadi. Iltimos, sahifani yangilang.");
      return;
    }
    const finalAnswers = JSON.parse(localStorage.getItem("temp_answers") || "{}" );
    const currentTestId = localStorage.getItem('selectedTestId');
    const userId = localStorage.getItem("userId");
    
    const allAnswers = {};
    questions.forEach(q => {
      const hasValue = Object.prototype.hasOwnProperty.call(finalAnswers, q.id);
      allAnswers[q.id] = hasValue ? finalAnswers[q.id] : "";
    });

    const answeredCount = questions.reduce((count, q) => {
      return count + (isAnsweredValue(allAnswers[q.id]) ? 1 : 0);
    }, 0);

    try {
      const createdAttempt = await sendAttempt({
        test_id: Number(currentTestId),
        user_id: Number(userId),
        subject_name: subjectName,
        answers: allAnswers,
        score: 0,
        is_published: false
      });
      localStorage.removeItem("temp_answers");
      localStorage.removeItem("exam_time_left");
      navigate("/result-pending", {
        state: {
          total: questions.length,
          answered: answeredCount,
          attemptId: createdAttempt?.id || createdAttempt?.attemptId || null,
          status: createdAttempt?.status || null,
        },
      });
    } catch (err) {
      toast.error("Xatolik: " + (err.response?.data?.message || "Server xatosi"));
    }
  }, [navigate, questions, currentSubject, toast]);

  useEffect(() => {
    if (loading || questions.length === 0) return;
    if (timeLeft <= 0) { submitTest(); return; }
    const timerId = setInterval(() => {
      setTimeLeft(prev => {
        const newTime = prev - 1;
        localStorage.setItem("exam_time_left", newTime);
        return newTime;
      });
    }, 1000);
    return () => clearInterval(timerId);
  }, [timeLeft, loading, questions, submitTest]);

  useEffect(() => {
    const testId = localStorage.getItem("selectedTestId");
    const subjects = JSON.parse(localStorage.getItem("subjectsCache") || "[]");
    const selectedSubjectId = localStorage.getItem("selectedSubjectId");
    
    getQuestions(testId)
      .then(data => {
        setQuestions(data);
        const q1 = data[0];
        const candidateSubjectId = q1?.subject_id || selectedSubjectId;
        if (candidateSubjectId) {
          const subj = subjects.find(s => String(s.id) === String(candidateSubjectId));
          if (subj) setCurrentSubject(subj);
        }
        const savedAnswers = JSON.parse(localStorage.getItem("temp_answers") || "{}");
        setAnswers(savedAnswers);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleAnswerChange = (qId, val) => {
    const newAnswers = { ...answers, [qId]: val };
    setAnswers(newAnswers);
    localStorage.setItem("temp_answers", JSON.stringify(newAnswers));
  };

  if (loading) return <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bba-bg)" }}><div style={{ width: "40px", height: "40px", borderRadius: "50%", border: "4px solid var(--bba-primary)", borderTopColor: "transparent", animation: "spin 1s linear infinite" }} /></div>;

  const currentQuestion = questions[currentIndex];
  const progressPct = ((currentIndex + 1) / questions.length) * 100;
  const isCritical = timeLeft < 180;

  return (
    <div style={{ minHeight: "100vh", background: "var(--bba-bg)", paddingBottom: isMobile ? "108px" : "120px" }}>
      {/* Progress Bar Top */}
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, height: "6px", background: "rgba(0,0,0,0.05)", zIndex: 1000 }}>
        <div style={{ width: `${progressPct}%`, height: "100%", background: isCritical ? "var(--bba-danger)" : "var(--bba-primary)", transition: "width 0.4s ease" }} />
      </div>

      {/* Header */}
      <header style={{ 
        position: "sticky", top: "6px", zIndex: 900, 
        background: "rgba(255,255,255,0.7)", backdropFilter: "blur(20px)",
        borderBottom: "1px solid var(--bba-border)", padding: isMobile ? "12px" : "20px"
      }}>
        <div className="bba-container" style={{ display: "flex", justifyContent: "space-between", alignItems: isMobile ? "flex-start" : "center", gap: isMobile ? "10px" : "0", flexDirection: isMobile ? "column" : "row" }}>
           <div>
            <h1 style={{ fontSize: isMobile ? "16px" : "18px", fontWeight: 900, margin: 0, color: "#1e40af" }}>{currentSubject?.name}</h1>
              <p style={{ fontSize: "11px", fontWeight: 800, color: "var(--bba-text-muted)", textTransform: "uppercase" }}>Milliy Sertifikat Imtihoni</p>
           </div>
          <div style={{ display: "flex", alignItems: "center", gap: isMobile ? "12px" : "24px", width: isMobile ? "100%" : "auto", justifyContent: isMobile ? "space-between" : "flex-start" }}>
              <div style={{ textAlign: "right" }}>
                 <p style={{ fontSize: "10px", fontWeight: 800, color: "var(--bba-text-muted)", margin: 0 }}>QOLGAN VAQT</p>
              <span style={{ fontSize: isMobile ? "20px" : "24px", fontWeight: 900, color: isCritical ? "var(--bba-danger)" : "var(--bba-text-main)", fontVariantNumeric: "tabular-nums" }}>
                    {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                 </span>
              </div>
              <button 
                onClick={() => setShowConfirm(true)}
                className="bba-button bba-button-primary"
             style={{ background: "var(--bba-danger)", boxShadow: "0 10px 20px -5px rgba(244,63,94,0.4)", padding: isMobile ? "10px 14px" : undefined }}
              >Yakunlash</button>
           </div>
        </div>
      </header>

      <main className="bba-container" style={{ marginTop: isMobile ? "18px" : "40px", maxWidth: "900px", padding: isMobile ? "0 10px" : undefined }}>
        {/* Question Card */}
        <div className="bba-glass-card" style={{ padding: isMobile ? "18px" : "48px", animation: "fadeInUp 0.4s ease" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "32px" }}>
             <span style={{ padding: "6px 16px", borderRadius: "10px", background: "rgba(37,99,235,0.1)", color: "var(--bba-primary)", fontWeight: 800, fontSize: "13px" }}>
                Savol {currentIndex + 1} / {questions.length}
             </span>
          </div>

         <h2 style={{ fontSize: isMobile ? "20px" : "28px", fontWeight: 800, lineHeight: 1.4, marginBottom: "32px", color: "var(--bba-text-main)" }}>
            {currentQuestion?.question_text}
          </h2>

          {currentQuestion?.image_url && (
            <div style={{ marginBottom: "32px", borderRadius: "24px", overflow: "hidden", border: "1px solid var(--bba-border)" }}>
               <img src={getGoogleDriveDirectLink(currentQuestion.image_url)} alt="Question" style={{ width: "100%", maxHeight: "400px", objectContain: "contain" }} />
            </div>
          )}

          {/* Options */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {currentQuestion?.type === 'multiple' ? (
              currentQuestion.options.map((opt, i) => (
                <label 
                  key={i} 
                  style={{ 
                    padding: "20px 24px", borderRadius: "20px", border: `2px solid ${answers[currentQuestion.id] === i ? "var(--bba-primary)" : "var(--bba-border)"}`,
                    background: answers[currentQuestion.id] === i ? "rgba(37,99,235,0.05)" : "transparent",
                    display: "flex", alignItems: "center", gap: "16px", cursor: "pointer", transition: "var(--bba-transition)"
                  }}
                >
                  <input type="radio" style={{ display: "none" }} checked={answers[currentQuestion.id] === i} onChange={() => handleAnswerChange(currentQuestion.id, i)} />
                  <div style={{ 
                    width: "40px", height: "40px", borderRadius: "12px", background: answers[currentQuestion.id] === i ? "var(--bba-primary)" : "rgba(0,0,0,0.05)",
                    color: answers[currentQuestion.id] === i ? "#fff" : "var(--bba-text-muted)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900
                  }}>
                    {String.fromCharCode(65 + i)}
                  </div>
                  <span style={{ fontSize: isMobile ? "16px" : "18px", fontWeight: 600 }}>{opt}</span>
                </label>
              ))
            ) : (
               <textarea 
                className="exam-open-answer"
                  value={answers[currentQuestion.id] || ""}
                  onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                  placeholder="Javobingizni shu yerga yozing..."
                style={{ width: "100%", height: "160px", padding: "20px", borderRadius: "20px", border: "2px solid var(--bba-border)", fontSize: isMobile ? "16px" : "18px", fontFamily: "inherit", outline: "none", background: "#ffffff", color: "#111827", caretColor: "#111827" }}
               />
            )}
          </div>
        </div>

        {/* Question Palette */}
        <div style={{ marginTop: "48px", display: "flex", flexWrap: "wrap", gap: "10px", justifyContent: "center" }}>
          {questions.map((q, i) => (
             <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                style={{
                  width: "44px", height: "44px", borderRadius: "14px", border: "none",
                  background: currentIndex === i ? "var(--bba-primary)" : (isAnsweredValue(answers[q.id]) ? "#10b981" : "var(--bba-card)"),
                  color: currentIndex === i || isAnsweredValue(answers[q.id]) ? "#fff" : "var(--bba-text-muted)",
                  fontWeight: 800, cursor: "pointer", boxShadow: currentIndex === i ? "0 10px 20px -5px var(--bba-primary-glow)" : "none",
                  transition: "var(--bba-transition)"
                }}
             >
               {i + 1}
             </button>
          ))}
        </div>
      </main>

      {/* Footer Navigation */}
      <footer style={{ 
        position: "fixed", bottom: isMobile ? "14px" : "32px", left: "50%", transform: "translateX(-50%)",
        width: "90%", maxWidth: "600px", padding: "16px", borderRadius: "24px",
        background: "rgba(255,255,255,0.8)", backdropFilter: "blur(20px)",
        border: "1px solid var(--bba-border)", boxShadow: "var(--bba-shadow-premium)",
        display: "flex", justifyContent: "space-between", zIndex: 1000
      }}>
         <button 
           disabled={currentIndex === 0}
           onClick={() => setCurrentIndex(c => c - 1)}
           className="bba-button" style={{ padding: isMobile ? "12px 14px" : "16px 32px", fontSize: isMobile ? "12px" : undefined }}>← OLDINGI</button>
         <button 
           disabled={currentIndex === questions.length - 1}
           onClick={() => setCurrentIndex(c => c + 1)}
           className="bba-button bba-button-primary" style={{ padding: isMobile ? "12px 14px" : "16px 32px", fontSize: isMobile ? "12px" : undefined }}>KEYINGI →</button>
      </footer>

      {/* Confirm Modal */}
      {showConfirm && (
        <div style={{ position: "fixed", inset: 0, zIndex: 2000, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(10px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div className="bba-glass-card" style={{ maxWidth: "400px", width: "100%", padding: "40px", textAlign: "center" }}>
             <div style={{ fontSize: "48px", marginBottom: "16px" }}>🏁</div>
             <h2 style={{ fontSize: "24px", fontWeight: 900, marginBottom: "8px" }}>Imtihonni yakunlash?</h2>
             <p style={{ color: "var(--bba-text-muted)", marginBottom: "32px" }}>Siz {questions.reduce((count, q) => count + (isAnsweredValue(answers[q.id]) ? 1 : 0), 0)} ta savolga javob berdingiz. Ishonchingiz komilmi?</p>
             <div style={{ display: "flex", gap: "12px" }}>
                <button onClick={() => setShowConfirm(false)} style={{ flex: 1, padding: "14px", borderRadius: "16px", border: "1px solid var(--bba-border)", background: "transparent", fontWeight: 700 }}>Davom etish</button>
                <button onClick={submitTest} className="bba-button bba-button-primary" style={{ flex: 1, background: "var(--bba-danger)" }}>Yakunlash</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}