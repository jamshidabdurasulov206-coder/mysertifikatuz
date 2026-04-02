import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getSubjects } from "../api/api";
import { createTestWithQuestions } from "../api/api";
import * as pdfjsLib from "pdfjs-dist";

// PDF Worker sozlamasi
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

export default function AdminTestCreatePage() {
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState([]);
  const [subjectId, setSubjectId] = useState("");
  const [testTitle, setTestTitle] = useState("");
  const [testDesc, setTestDesc] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState([]);

  useEffect(() => {
    getSubjects()
      .then(setSubjects)
      .catch(() => setMessage("❌ Fanlarni yuklashda xatolik"));
  }, []);

  // Yangi bo'sh savol qo'shish funksiyasi
  const handleAddEmptyQuestion = () => {
    setQuestions(qs => ([
      ...qs,
      {
        type: 'MULTIPLE_CHOICE',
        question_text: '',
        options: ['', '', '', ''],
        correct_option: 0,
        correct_answer_text: '',
        image_url: ''
      }
    ]));
  };

  const handleFileUpload = async (e) => {
    if (!subjectId) {
      setMessage("⚠️ Avval fanni tanlang!");
      e.target.value = null;
      return;
    }
    const file = e.target.files[0];
    if (!file) return;
    setLoading(true);
    setMessage("📄 PDF matni tahlil qilinmoqda...");

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const typedarray = new Uint8Array(reader.result);
        const pdf = await pdfjsLib.getDocument(typedarray).promise;
        let fullText = "";
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          fullText += textContent.items.map(item => item.str).join(" ") + "\n\n";
        }
        sendToAI(fullText);
      };
      reader.readAsArrayBuffer(file);
    } catch (err) {
      setMessage("❌ PDF o'qishda xato: " + err.message);
      setLoading(false);
    }
  };

  const sendToAI = async (text) => {
    setMessage("🤖 AI savollarni ajratib olmoqda...");
    try {
      const res = await fetch("http://localhost:4000/api/ai/parse-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text })
      });
      if (!res.ok) throw new Error("Backend serverdan xato keldi");
      const data = await res.json();
      const extractedQuestions = data.questions || (Array.isArray(data) ? data : []);

      if (extractedQuestions.length > 0) {
        setQuestions(extractedQuestions);
        setMessage(`✅ ${extractedQuestions.length} ta savol tayyor!`);
      } else {
        setMessage("⚠️ AI savollarni topa olmadi.");
      }
    } catch (err) {
      setMessage("❌ AI tahlilida xatolik: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleQuestionChange = (idx, field, value) => {
    setQuestions(qs => {
      const copy = [...qs];
      if (field === "type") {
        copy[idx].type = value;
        if (value === "MULTIPLE_CHOICE" && (!copy[idx].options || copy[idx].options.length === 0)) {
          copy[idx].options = ["A varianti", "B varianti", "C varianti", "D varianti"];
          copy[idx].correct_option = 0;
        }
      } 
      else if (field === "question_text") copy[idx].question_text = value;
      else if (field === "image_url") copy[idx].image_url = value;
      else if (field === "correct_answer_text") copy[idx].correct_answer_text = value;
      else if (field.startsWith("option")) {
        const optIdx = parseInt(field.replace("option", ""));
        copy[idx].options[optIdx] = value;
      } else if (field === "correct_option") copy[idx].correct_option = parseInt(value);
      return copy;
    });
  };

  const handleTestCreate = async (e) => {

    e.preventDefault();
    if (!subjectId) return setMessage("❌ Iltimos, fanni tanlang!");
    if (questions.length === 0) return setMessage("❌ Savollar mavjud emas!");

    // Ochiq savollar uchun to'g'ri javob majburiy
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if ((q.type === 'OPEN_ENDED' || q.type === 'open' || q.type === 'writing') && (!q.correct_answer_text || q.correct_answer_text.trim() === "")) {
        return setMessage(`❌ ${i+1}-savolda to'g'ri javob kiritilishi shart!`);
      }
    }

    setLoading(true);
    try {

      const payload = {
        title: testTitle,
        description: testDesc,
        subject_id: Number(subjectId),
        questions: questions.map(q => {
          let type = (q.type || '').toLowerCase();
          if (["multiple_choice", "choice", "multiple"].includes(type)) type = "multiple";
          else if (["open_ended", "open", "writing"].includes(type)) type = "open";
          return {
            question_text: q.question_text,
            type,
            options: type === 'multiple' ? JSON.stringify(q.options) : "[]",
            correct_option: type === 'multiple' ? Number(q.correct_option) : null,
            correct_answer_text: type === 'open' ? (q.correct_answer_text || "") : null,
            image_url: q.image_url || ''
          };
        })
      };

      // api.js dan import qilingan createTestWithQuestions funksiyasidan foydalanamiz
      await createTestWithQuestions(payload);
      setMessage("✅ Muvaffaqiyatli saqlandi!");
      setTimeout(() => navigate("/admin"), 2000);
    } catch (err) {
      setMessage("❌ Saqlashda xatolik: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-['Inter'] pb-20 text-slate-900">
      <nav className="bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-blue-600">post_add</span>
          <h1 className="font-black text-slate-800 uppercase tracking-tight">Test Konstruktori</h1>
        </div>
        <button onClick={() => navigate("/admin")} className="text-xs font-black text-slate-400 hover:text-blue-600 transition-colors uppercase tracking-widest">Ortga</button>
      </nav>

      <main className="max-w-4xl mx-auto pt-10 px-4">
        {/* PDF SECTION */}
        <div className={`mb-10 p-10 border-2 border-dashed rounded-[3rem] text-center transition-all group ${!subjectId ? 'bg-gray-100 border-gray-300 opacity-60' : 'bg-blue-50/20 border-blue-200 hover:bg-blue-50/40'}`}>
          <input type="file" id="pdf-upload" accept=".pdf" className="hidden" onChange={handleFileUpload} disabled={!subjectId || loading} />
          <label htmlFor="pdf-upload" className={`${(!subjectId || loading) ? 'cursor-not-allowed' : 'cursor-pointer'} flex flex-col items-center gap-4`}>
            <div className={`w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-md`}>
              {loading ? <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div> : <span className="material-symbols-outlined text-3xl text-blue-600">picture_as_pdf</span>}
            </div>
            <p className="font-black text-sm uppercase tracking-widest text-blue-900">{loading ? "AI tahlil qilmoqda..." : "PDF yuklash"}</p>
          </label>
        </div>

        {message && <div className={`mb-6 p-4 rounded-2xl text-center font-black text-[10px] uppercase tracking-[0.2em] shadow-xl ${message.includes('❌') ? 'bg-red-600 text-white' : 'bg-blue-600 text-white'}`}>{message}</div>}

        <form onSubmit={handleTestCreate} className="space-y-10">
          <section className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="space-y-4">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Umumiy ma'lumot</label>
               <input type="text" placeholder="Test nomi" className="w-full bg-slate-50 rounded-2xl px-6 py-4 font-bold border-none" value={testTitle} onChange={e => setTestTitle(e.target.value)} required />
               <textarea placeholder="Tavsif..." className="w-full bg-slate-50 rounded-2xl px-6 py-4 font-medium border-none h-24" value={testDesc} onChange={e => setTestDesc(e.target.value)} />
             </div>
             <div className="space-y-4">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Fan va holat</label>
               <select className="w-full bg-blue-50/50 rounded-2xl px-6 py-4 font-black text-blue-900 border-2 border-blue-100" value={subjectId} onChange={e => setSubjectId(e.target.value)} required>
                 <option value="">Fanni tanlang...</option>
                 {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
               </select>
               <div className="p-6 bg-slate-900 rounded-[2rem] text-white flex justify-between items-center shadow-lg">
                 <div><p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-50">Jami savollar</p><p className="text-3xl font-black">{questions.length}</p></div>
                 <span className="material-symbols-outlined text-4xl opacity-20">quiz</span>
               </div>
             </div>
          </section>

          <div className="space-y-6">
            <div className="flex justify-between items-center px-4">
              <h3 className="font-black text-slate-400 uppercase tracking-widest text-[10px]">Savollar ro'yxati</h3>
              <button type="button" onClick={handleAddEmptyQuestion} className="bg-blue-600 hover:bg-blue-700 text-white font-black px-6 py-2 rounded-2xl text-[10px] uppercase tracking-widest shadow-lg flex items-center gap-2 transition-all active:scale-95">
                <span className="material-symbols-outlined text-sm">add</span> Savol qo'shish
              </button>
            </div>

            {questions.map((q, idx) => (
              <div key={idx} className="bg-white p-8 rounded-[2.5rem] shadow-lg border border-slate-100 relative group overflow-hidden animate-in slide-in-from-bottom-4">
                                <div className="mb-4">
                                  <label className="block text-xs font-bold text-blue-400 mb-1">Rasm (image_url):</label>
                                  <input type="text" className="w-full bg-blue-50 rounded-xl px-4 py-2 border border-blue-100 font-mono text-xs text-blue-700" placeholder="https://..." value={q.image_url || ''} onChange={e => handleQuestionChange(idx, 'image_url', e.target.value)} />
                                </div>
                <div className={`absolute top-0 left-0 w-2 h-full ${q.type === 'OPEN_ENDED' ? 'bg-orange-500' : 'bg-blue-500'}`}></div>
                
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-2">
                    <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase text-white ${q.type === 'OPEN_ENDED' ? 'bg-orange-600' : 'bg-slate-900'}`}>
                      {q.type === 'OPEN_ENDED' ? 'Ochiq savol' : `Savol #${idx + 1}`}
                    </span>
                    <button type="button" onClick={() => handleQuestionChange(idx, "type", q.type === 'OPEN_ENDED' ? 'MULTIPLE_CHOICE' : 'OPEN_ENDED')} className="text-[9px] font-black text-blue-600 uppercase hover:underline">
                      [Turini o'zgartirish]
                    </button>
                  </div>
                </div>

                <textarea className="w-full bg-slate-50 rounded-2xl px-6 py-4 font-bold text-slate-800 border-none mb-6 min-h-[80px]" value={q.question_text} onChange={e => handleQuestionChange(idx, "question_text", e.target.value)} required placeholder="Savol matnini kiriting..." />

                {q.type === 'MULTIPLE_CHOICE' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {q.options.map((opt, oidx) => (
                      <div key={oidx} className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all ${q.correct_option === oidx ? 'bg-green-50 border-green-500' : 'bg-slate-50 border-transparent'}`}>
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${q.correct_option === oidx ? 'bg-green-500 text-white' : 'bg-white text-slate-300 shadow-sm'}`}>{String.fromCharCode(65 + oidx)}</div>
                        <input className="flex-1 bg-transparent border-none font-bold text-sm outline-none text-slate-700" value={opt} onChange={e => handleQuestionChange(idx, `option${oidx}`, e.target.value)} required />
                        <input type="radio" name={`correct-${idx}`} checked={q.correct_option === oidx} onChange={() => handleQuestionChange(idx, "correct_option", oidx)} className="w-5 h-5 accent-green-600 cursor-pointer" />
                        {q.options.length > 2 && (
                          <button type="button" className="ml-2 text-red-400 hover:text-red-700 text-lg font-black" title="Variantni o'chirish" onClick={() => {
                            setQuestions(qs => {
                              const copy = [...qs];
                              copy[idx].options = copy[idx].options.filter((_, i) => i !== oidx);
                              // correct_option ni moslashtirish
                              if (copy[idx].correct_option === oidx) copy[idx].correct_option = 0;
                              else if (copy[idx].correct_option > oidx) copy[idx].correct_option--;
                              return copy;
                            });
                          }}>
                            ×
                          </button>
                        )}
                      </div>
                    ))}
                    <button type="button" className="mt-4 px-4 py-2 bg-blue-100 text-blue-700 rounded-xl font-bold text-xs hover:bg-blue-200 transition-all" onClick={() => {
                      setQuestions(qs => {
                        const copy = [...qs];
                        copy[idx].options = [...copy[idx].options, ""];
                        return copy;
                      });
                    }}>
                      + Variant qo'shish
                    </button>
                  </div>
                ) : (
                  <div className="p-6 bg-orange-50/50 rounded-[2rem] border-2 border-dashed border-orange-200">
                    <label className="text-[10px] font-black text-orange-400 uppercase tracking-[0.2em] mb-3 block">To'g'ri javobni kiriting:</label>
                    <input className="w-full bg-white px-6 py-4 rounded-2xl font-bold text-orange-700 shadow-sm border-none focus:ring-2 focus:ring-orange-500" value={q.correct_answer_text || ""} onChange={e => handleQuestionChange(idx, "correct_answer_text", e.target.value)} placeholder="Misol: Amir Temur" />
                  </div>
                )}
              </div>
            ))}
          </div>

          {questions.length > 0 && (
            <button type="submit" disabled={loading} className="w-full bg-slate-900 text-white py-6 rounded-[2.5rem] font-black uppercase text-sm tracking-[0.4em] shadow-2xl hover:bg-blue-600 transition-all flex justify-center items-center gap-4">
              {loading ? "SAQLANMOQDA..." : <>Saqlash <span className="material-symbols-outlined">save</span></>}
            </button>
          )}
        </form>
      </main>
    </div>
  );
}