import React, { useCallback, useEffect, useState } from "react";
import axios from "../api/axios";
import { useNavigate } from "react-router-dom";

const AdminReviewPage = () => {
  const navigate = useNavigate();
  const [attempts, setAttempts] = useState([]);
  const [selected, setSelected] = useState(null);
  const [scores, setScores] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [showOnlyDiff, setShowOnlyDiff] = useState(false);
  const [showOnlyOpenEnded, setShowOnlyOpenEnded] = useState(false);

  const OPEN_TYPES = new Set(["writing", "open", "open_ended", "open-ended", "open ended", "openended"]);

  const isOpenEndedQuestion = (question) => {
    const normalized = String(question?.type || "").toLowerCase();
    return OPEN_TYPES.has(normalized) || normalized === "open_ended";
  };

  const normalizeBinary = (value) => (Number(value) >= 0.5 ? 1 : 0);

  const getOptionText = (question, optionValue) => {
    if (optionValue === undefined || optionValue === null || optionValue === "") return "-";
    const options = Array.isArray(question.options) ? question.options : [];
    const found = options.find((opt) => String(opt?.value) === String(optionValue));
    return found ? `${optionValue}) ${found.label}` : String(optionValue);
  };

  const getCorrectDisplay = (question) => {
    if ((question.type || "").toLowerCase() === "multiple_choice") {
      return getOptionText(question, question.correct_option);
    }
    return question.correct_answer_text || "-";
  };

  const getUserAnswerDisplay = (question) => {
    if ((question.type || "").toLowerCase() === "multiple_choice") {
      return getOptionText(question, question.user_answer);
    }
    return String(question.user_answer || "-");
  };

  const fetchAttempts = useCallback(async () => {
    setLoading(true);
    setMessage("");

    const token = localStorage.getItem("token");
    if (!token) {
      setAttempts([]);
      setSelected(null);
      setScores({});
      setMessage("Admin token topilmadi. Iltimos, qaytadan login qiling.");
      setLoading(false);
      return;
    }

    try {
      const res = await axios.get("/attempts/admin/pre-rasch-review");
      const list = Array.isArray(res.data) ? res.data : [];
      setAttempts(list);
      setSelected((prev) => {
        if (!prev) return prev;
        const nextSelected = list.find(a => a.id === prev.id);
        if (!nextSelected) setScores({});
        return nextSelected || null;
      });
    } catch (e) {
      setAttempts([]);
      const status = e?.response?.status;
      const apiMessage = e?.response?.data?.message;
      if (status === 401 || status === 403) {
        setMessage("Ruxsat yo'q yoki sessiya tugagan. Admin sifatida qayta login qiling.");
      } else {
        setMessage(apiMessage || "Xatolik: tekshiruv ma'lumotlarini yuklab bo'lmadi");
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAttempts();
  }, [fetchAttempts]);

  const handleSelect = (attempt) => {
    setSelected(attempt);
    const initialScores = {};
    (attempt.questions || []).forEach(q => {
      initialScores[q.id] = normalizeBinary(q.current_score);
    });
    setScores(initialScores);
  };

  const handleScoreChange = (qid, value) => {
    const normalized = normalizeBinary(value);
    setScores(prev => ({ ...prev, [qid]: normalized }));
  };

  const handleSave = async () => {
    if (!selected) return;
    setSaving(true);
    setMessage("");
    try {
      await axios.patch(`/attempts/${selected.id}/save-review`, {
        written_scores: scores
      });
      setMessage("Tekshiruv saqlandi");
      await fetchAttempts();

      const updatedQuestions = (selected.questions || []).map(q => {
        const finalScore = normalizeBinary(scores[q.id]);
        const autoScore = normalizeBinary(q.auto_score);
        return {
          ...q,
          current_score: finalScore,
          is_overridden: finalScore !== autoScore
        };
      });
      setSelected({ ...selected, questions: updatedQuestions, status: 'reviewed' });
    } catch (e) {
      setMessage("Xatolik: saqlanmadi");
    }
    setSaving(false);
  };

  const visibleQuestions = (selected?.questions || []).filter((q) => {
    if (showOnlyOpenEnded && !isOpenEndedQuestion(q)) return false;
    if (!showOnlyDiff) return true;
    const finalScore = normalizeBinary(scores[q.id] ?? 0);
    const autoScore = normalizeBinary(q.auto_score ?? 0);
    return finalScore !== autoScore;
  });

  const stats = {
    total: visibleQuestions.length,
    aiPass: visibleQuestions.filter((q) => normalizeBinary(q.auto_score) === 1).length,
    adminChanged: visibleQuestions.filter((q) => normalizeBinary(scores[q.id]) !== normalizeBinary(q.auto_score)).length
  };

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Raschdan oldingi AI/kalit tekshiruv</h2>
        <button
          className="text-blue-700 underline"
          onClick={() => navigate('/admin/results')}
        >
          Natijalar sahifasiga qaytish
        </button>
      </div>

      {message && (
        <div className="mb-4 bg-blue-50 text-blue-700 px-4 py-2 rounded">{message}</div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <div>
          <h3 className="font-semibold mb-2">Raschdan oldin tekshiriladigan urinishlar</h3>
          <table className="min-w-full border text-sm bg-white rounded overflow-hidden">
            <thead>
              <tr className="bg-slate-100">
                <th className="border px-2 py-1">#</th>
                <th className="border px-2 py-1">Foydalanuvchi</th>
                <th className="border px-2 py-1">Test</th>
                <th className="border px-2 py-1">Fan</th>
                <th className="border px-2 py-1">Holat</th>
              </tr>
            </thead>
            <tbody>
              {!loading && attempts.length === 0 && (
                <tr><td colSpan={5} className="text-center py-4">Rasch oldidan tekshiriladigan urinish yo'q</td></tr>
              )}
              {loading && (
                <tr><td colSpan={5} className="text-center py-4">Yuklanmoqda...</td></tr>
              )}
              {attempts.map((a, i) => (
                <tr key={a.id} className={selected && selected.id === a.id ? "bg-blue-50" : ""}>
                  <td className="border px-2 py-1">{i + 1}</td>
                  <td className="border px-2 py-1">
                    <button className="text-blue-700 underline" onClick={() => handleSelect(a)}>{a.user_name || "-"}</button>
                  </td>
                  <td className="border px-2 py-1">{a.test_name || "-"}</td>
                  <td className="border px-2 py-1">{a.subject_name || "-"}</td>
                  <td className="border px-2 py-1">{a.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div>
          {selected ? (
            <div className="bg-white rounded shadow p-6 text-slate-900">
              <h4 className="font-bold mb-2 text-slate-900">{selected.user_name} - {selected.subject_name}</h4>
              <p className="text-xs text-slate-600 mb-4">Test: {selected.test_name || "-"}</p>

              <div className="grid grid-cols-3 gap-3 mb-4 text-sm">
                <div className="bg-slate-100 rounded p-3">
                  <div className="text-slate-500">Savollar</div>
                  <div className="text-lg font-bold">{stats.total}</div>
                </div>
                <div className="bg-blue-50 rounded p-3">
                  <div className="text-blue-700">AI/kalit 1 bergan</div>
                  <div className="text-lg font-bold text-blue-900">{stats.aiPass}</div>
                </div>
                <div className="bg-amber-50 rounded p-3">
                  <div className="text-amber-700">Admin o'zgartirgan</div>
                  <div className="text-lg font-bold text-amber-900">{stats.adminChanged}</div>
                </div>
              </div>

              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded"
                    onClick={() => setShowOnlyDiff(prev => !prev)}
                  >
                    {showOnlyDiff ? "Barcha savollarni ko'rsatish" : "Faqat farq qilganlarni ko'rsatish"}
                  </button>
                  <button
                    className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded"
                    onClick={() => setShowOnlyOpenEnded(prev => !prev)}
                  >
                    {showOnlyOpenEnded ? "Barcha turlar" : "Faqat open-ended"}
                  </button>
                </div>
                <div className="text-xs text-slate-500">AI tekshiruv ko'rinadi, yakuniy ballni admin tanlaydi</div>
              </div>

              {selected.questions && selected.questions.length > 0 ? (
                <div className="space-y-4 mb-4">
                  {visibleQuestions.map((q, idx) => {
                    const autoScore = normalizeBinary(q.auto_score);
                    const finalScore = normalizeBinary(scores[q.id]);
                    const isChanged = autoScore !== finalScore;
                    return (
                      <div
                        key={q.id}
                        className={`border rounded-lg p-4 ${isChanged ? "border-amber-300 bg-amber-50" : "border-slate-200 bg-white"}`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-semibold text-slate-900">Savol #{idx + 1} ({q.type})</div>
                          <div className="flex items-center gap-2 text-xs">
                            <span className="px-2 py-1 rounded bg-indigo-100 text-indigo-700">AI/kalit: {autoScore}</span>
                            <span className={`px-2 py-1 rounded ${isChanged ? "bg-amber-200 text-amber-800" : "bg-emerald-100 text-emerald-700"}`}>
                              Yakuniy: {finalScore}
                            </span>
                          </div>
                        </div>

                        <div className="text-sm text-slate-700 mb-3">{q.question_text || "-"}</div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                          <div className="bg-slate-50 rounded p-3">
                            <div className="text-xs text-slate-500 mb-1">Foydalanuvchi javobi</div>
                            <div className="text-slate-900 whitespace-pre-wrap">{getUserAnswerDisplay(q)}</div>
                          </div>
                          <div className="bg-slate-50 rounded p-3">
                            <div className="text-xs text-slate-500 mb-1">To'g'ri javob</div>
                            <div className="text-slate-900 whitespace-pre-wrap">{getCorrectDisplay(q)}</div>
                          </div>
                        </div>

                        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="bg-blue-50 rounded p-3 text-sm">
                            <div className="text-xs text-blue-700 mb-1">AI qanday tekshirgan</div>
                            <div className="text-blue-900 font-medium">
                              {q.ai_check_type === "ai" ? "AI mazmuniy tekshiruv" : "Kalit bo'yicha tekshiruv"}
                            </div>
                            <div className="text-blue-800 text-xs mt-1">{q.ai_check_detail || "-"}</div>
                            <div className="text-blue-900 text-xs mt-2">AI/kalit bergan ball: {autoScore}</div>
                          </div>
                          <div className="bg-white border rounded p-3 text-sm">
                            <div className="text-xs text-slate-500 mb-1">Admin yakuniy balli</div>
                            <select
                              className="border rounded px-2 py-2 text-slate-900 bg-white w-full"
                              value={scores[q.id] ?? 0}
                              onChange={e => handleScoreChange(q.id, e.target.value)}
                            >
                              <option value={0}>0</option>
                              <option value={1}>1</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {visibleQuestions.length === 0 && (
                    <div className="border rounded px-2 py-6 text-center text-slate-500">
                      Farq qilgan savol topilmadi
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-slate-500">Savollar topilmadi yoki yuklanmadi.</div>
              )}

              <button
                className="bg-green-600 text-white px-4 py-2 rounded font-bold mt-2"
                onClick={handleSave}
                disabled={saving}
              >{saving ? "Saqlanmoqda..." : "Tekshiruvni saqlash"}</button>
              <button
                className="ml-4 text-slate-500 underline"
                onClick={() => { setSelected(null); setScores({}); }}
              >Orqaga</button>
            </div>
          ) : (
            <div className="text-slate-400 italic">Foydalanuvchi tanlang</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminReviewPage;
