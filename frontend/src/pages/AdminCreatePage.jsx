import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
// API funksiyalarini import qilamiz
import { getSubjects, createTestWithQuestions } from "../api/api";

export default function AdminCreatePage() {
  const navigate = useNavigate();
  
  // 1. Holatlar (States)
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  
  const [testData, setTestData] = useState({
    title: "",
    description: "",
    subject_id: "",
    questions: []
  });

  const [qType, setQType] = useState("choice"); // 'choice' yoki 'writing'
  const [newQ, setNewQ] = useState({
    question_text: "",
    options: ["", "", "", ""],
    correct_option: 0,
    correct_answer_text: ""
  });

  // 2. Fanlarni bazadan yuklash (useEffect xatosi tuzatildi)
  useEffect(() => {
    const loadSubjects = async () => {
      try {
        const data = await getSubjects();
        setSubjects(data);
      } catch (err) {
        console.error("Fanlarni yuklashda xato:", err);
      }
    };
    loadSubjects();
  }, []);

  // 3. Savol qo'shish (Validation qo'shildi)
  const handleAddQuestion = () => {
    if (!newQ.question_text.trim()) return alert("Savol matnini kiriting!");
    
    if (qType === "choice" && newQ.options.some(opt => opt.trim() === "")) {
      return alert("Barcha variantlarni to'ldiring!");
    }

    const questionToAdd = {
      ...newQ,
      type: qType,
      id: Date.now(),
      options: qType === "choice" ? newQ.options : null
    };

    setTestData(prev => ({
      ...prev,
      questions: [...prev.questions, questionToAdd]
    }));

    // Formani tozalash
    setNewQ({
      question_text: "",
      options: ["", "", "", ""],
      correct_option: 0,
      correct_answer_text: ""
    });
  };

  // 4. Testni saqlash (401 va 403 xatolarini oldini olish)
  const handleSaveTest = async () => {
    if (!testData.title || !testData.subject_id) {
      return alert("Sarlavha va fanni tanlang!");
    }
    if (testData.questions.length === 0) {
      return alert("Kamida bitta savol qo'shing!");
    }

    // Ma'lumotlarni tozalash va formatlash
    const formattedQuestions = testData.questions.map(q => {
      if (q.type === "choice") {
        return {
          question_text: q.question_text,
          type: "choice",
          options: Array.isArray(q.options) ? q.options : [],
          correct_option: Number(q.correct_option),
          correct_answer_text: null
        };
      } else {
        return {
          question_text: q.question_text,
          type: "writing",
          options: [], // Yozma savollar uchun bo'sh massiv
          correct_option: null,
          correct_answer_text: q.correct_answer_text
        };
      }
    });

    const payload = {
      ...testData,
      subject_id: Number(testData.subject_id),
      questions: formattedQuestions
    };

    // JSON.stringify check (console)
    try {
      JSON.stringify(payload);
    } catch (e) {
      alert("Yuborilayotgan ma'lumotda JSON xatolik bor: " + e.message);
      return;
    }

    // Headerlarni konsolga chiqaramiz
    console.log("Headerlar:", require("../api/api").getAuthHeaders());

    setLoading(true);
    try {
      await createTestWithQuestions(payload);
      setMessage("✅ Test muvaffaqiyatli saqlandi!");
      setTimeout(() => navigate("/admin"), 2000);
    } catch (err) {
      if (err.message && err.message.includes("401")) {
        setMessage("❌ Sessiya muddati tugadi, qayta login qiling");
      } else {
        setMessage("❌ Xato: " + (err.message || "Serverga ulanib bo'lmadi"));
      }
      console.error("Saqlashda xato:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-['Inter'] pb-20">
      <nav className="bg-white border-b px-8 py-4 flex justify-between items-center sticky top-0 z-50">
        <h1 className="font-black text-slate-800 uppercase tracking-tighter text-xl">BBA Admin</h1>
        <button onClick={() => navigate("/admin")} className="text-slate-500 font-bold">Ortga</button>
      </nav>
        {/* AI uchun PDF savol chiqarish prompti (Column-Aware) */}
        <div className="max-w-4xl mx-auto mt-8 mb-8 p-6 bg-yellow-50 border-l-8 border-yellow-400 rounded-2xl shadow text-slate-800">
          <h2 className="font-black text-lg mb-2">AI uchun PDF savollarini chiqarish prompti (Yangi Qoidalar)</h2>
          <pre className="whitespace-pre-wrap text-sm bg-yellow-100 p-4 rounded-xl overflow-x-auto"><code>{`
    Vazifa: Ushbu PDF-dagi matnni tahlil qil. DIQQAT: Matn ikki ustunli (A4 formatda ikki qatorli ustun).

    1. O'qish qoidasi:
      - Matnni qator bo'yicha emas, ustun bo'yicha o'qi. Chap ustunni to'liq tugat, keyin o'ng ustunga o't.
      - "Moslang" yoki "Keltirilgan" deb boshlanuvchi savollarni, ularga tegishli barcha bandlarni (I, II, III... va a, b, c...) va javob variantlarini (A, B, C, D) bitta yaxlit savol sifatida jamla. Hech birini alohida savol qilib bo'lma!

    2. Hajm (Pagination):
      - Hozircha menga faqat birinchi 20 ta savolni ber.
      - To'xtab qolma, hamma so'zni so'zma-so'z ko'chir.

    3. JSON Formati (Qat'iy):

    JSON
    [
      {
        "question_text": "To'liq savol matni, barcha moslashtirish bandlari bilan birga",
        "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
        "type": "choice"
      }
    ]

    4. Muhim:
      - "Moslang" degan savolda variantlar (A, B, C, D) ichidagi 1-c, 2-f... kabi kodlarni ham to'liq options ichiga yoz.

    Natijani faqat yuqoridagi JSON formatida, ustunlar aralashmasdan, so'zma-so'z va to'liq qaytar!
    `}</code></pre>
        </div>

      <main className="max-w-6xl mx-auto pt-10 px-4 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* CHAP: Sozlamalar */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
            <h2 className="font-black text-xs uppercase tracking-widest text-slate-400 mb-4">Test Asoslari</h2>
            <div className="space-y-4">
              <select 
                className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold text-slate-700"
                value={testData.subject_id}
                onChange={(e) => setTestData({...testData, subject_id: e.target.value})}
              >
                <option value="">Fanni tanlang</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <input 
                type="text" 
                placeholder="Test sarlavhasi" 
                className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold"
                value={testData.title}
                onChange={(e) => setTestData({...testData, title: e.target.value})}
              />
            </div>
          </div>

          <div className="bg-blue-600 p-6 rounded-[2rem] text-white shadow-xl">
            <p className="text-3xl font-black">{testData.questions.length} ta savol</p>
            <button 
              disabled={loading}
              onClick={handleSaveTest}
              className="w-full mt-6 bg-white text-blue-600 py-4 rounded-2xl font-black uppercase text-xs"
            >
              {loading ? "Saqlanmoqda..." : "Bazaga Saqlash"}
            </button>
          </div>
        </div>

        {/* O'NG: Konstruktor */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border-2 border-blue-50">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-black text-lg uppercase">Savol qo'shish</h2>
              <div className="flex bg-slate-100 p-1 rounded-xl">
                <button onClick={() => setQType("choice")} className={`px-4 py-2 rounded-lg text-xs font-bold ${qType === "choice" ? "bg-white shadow text-blue-600" : "text-slate-500"}`}>Test</button>
                <button onClick={() => setQType("writing")} className={`px-4 py-2 rounded-lg text-xs font-bold ${qType === "writing" ? "bg-white shadow text-blue-600" : "text-slate-500"}`}>Yozma</button>
              </div>
            </div>
            
            <div className="space-y-6">
              <textarea 
                placeholder="Savol matni..." 
                className="w-full p-6 bg-slate-50 rounded-[1.5rem] border-none font-bold text-lg"
                value={newQ.question_text}
                onChange={e => setNewQ({...newQ, question_text: e.target.value})}
              />

              {qType === "choice" ? (
                <div className="grid gap-3">
                  {newQ.options.map((opt, i) => (
                    <div key={i} className="flex gap-3">
                      <button 
                        onClick={() => setNewQ({...newQ, correct_option: i})}
                        className={`w-14 h-14 rounded-2xl font-black ${newQ.correct_option === i ? 'bg-green-500 text-white' : 'bg-white text-slate-300 border'}`}
                      >
                        {String.fromCharCode(65+i)}
                      </button>
                      <input 
                        type="text" 
                        placeholder={`Variant ${String.fromCharCode(65+i)}`}
                        className="flex-grow p-4 bg-slate-50 rounded-2xl border-none font-bold"
                        value={opt}
                        onChange={e => {
                          const clone = [...newQ.options];
                          clone[i] = e.target.value;
                          setNewQ({...newQ, options: clone});
                        }}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <input 
                  type="text" 
                  placeholder="To'g'ri javobni yozing..." 
                  className="w-full p-5 bg-blue-50 rounded-2xl border-2 border-blue-100 font-bold"
                  value={newQ.correct_answer_text}
                  onChange={e => setNewQ({...newQ, correct_answer_text: e.target.value})}
                />
              )}

              <button onClick={handleAddQuestion} className="w-full py-5 bg-slate-900 text-white rounded-[1.5rem] font-black uppercase text-xs">
                Savolni ro'yxatga kiritish
              </button>
            </div>
          </div>
        </div>
      </main>

      {message && (
        <div className={`fixed bottom-10 left-1/2 -translate-x-1/2 px-10 py-5 rounded-3xl font-black shadow-2xl ${message.includes('✅') ? 'bg-green-600' : 'bg-red-600'} text-white`}>
          {message}
        </div>
      )}
    </div>
  );
}