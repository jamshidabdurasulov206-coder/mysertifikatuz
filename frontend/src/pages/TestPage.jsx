import { useEffect, useState } from "react";
import { getQuestions, getTests, sendAttempt } from "../api/api";

export default function TestPage() {
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [test, setTest] = useState(null);

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/";
  };

  useEffect(() => {
    const selectedSubjectId = localStorage.getItem("selectedSubjectId");
    
    if (!selectedSubjectId) {
      setError("Fan tanlanmagan! Iltimos, asosiy sahifaga qaytib fanni tanlang.");
      setLoading(false);
      return;
    }

    getTests()
      .then(tests => {
        const foundTest = tests.find(t => String(t.subject_id) === String(selectedSubjectId));
        
        if (!foundTest) {
          setError("Bu fan uchun hali testlar yuklanmagan.");
          setLoading(false);
          return;
        }
        
        setTest(foundTest);
        return getQuestions(foundTest.id);
      })
      .then((data) => {
        if (!data) return;

        const safeData = Array.isArray(data) ? data : [];
        const parsed = safeData.map((q) => {
          let optionsArray = [];
          try {
            // Agar options string bo'lsa parse qilamiz, aks holda o'zini olamiz
            optionsArray = typeof q.options === "string" ? JSON.parse(q.options) : q.options;
          } catch (e) {
            optionsArray = [];
          }
          
          return {
            ...q,
            options: Array.isArray(optionsArray) ? optionsArray : Object.values(optionsArray || {}),
          };
        });

        setQuestions(parsed);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Xatolik:", err);
        setError("Ma'lumotlarni yuklashda xatolik yuz berdi.");
        setLoading(false);
      });
  }, []);

  const handleSelect = (qId, optionIndex) => {
    setAnswers((prev) => ({
      ...prev,
      [qId]: optionIndex,
    }));
  };

  const submitTest = async () => {
    // 1. LocalStoragedan foydalanuvchi ma'lumotini olish
    const userStr = localStorage.getItem("user");
    if (!userStr) {
      alert("Siz tizimga kirmagansiz!");
      window.location.href = "/";
      return;
    }
    // const user = JSON.parse(userStr); // removed unused

    // 2. Ballni hisoblash
    let score = 0;
    questions.forEach((q) => {
      // String va Number farq qilmasligi uchun == ishlatamiz
      if (answers[q.id] !== undefined && String(answers[q.id]) === String(q.correct_option)) {
        score++;
      }
    });

    try {
      // 3. Natijani bazaga yuborish
      await sendAttempt({
        test_id: test?.id,
        answers: answers, // always send as object, backend will stringify
        score: score,
      });

      alert(`Test yakunlandi! Sizning natijangiz: ${score} ta to'g'ri.`);
      window.location.href = "/profile";
    } catch (err) {
      console.error("Natijani yuborishda xato:", err);
      alert("Xatolik: Natija saqlanmadi.");
    }
  };

  return (
    <div style={{ padding: 20, maxWidth: 800, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginBottom: 20 }}>
        <button 
          style={{ background: '#0ea5e9', color: 'white', padding: '10px 20px', border: 'none', borderRadius: 8, cursor: 'pointer' }} 
          onClick={() => window.location.href = "/profile"}
        >
          Asosiy sahifa
        </button>
        <button 
          style={{ background: '#ef4444', color: 'white', padding: '10px 20px', border: 'none', borderRadius: 8, cursor: 'pointer' }} 
          onClick={handleLogout}
        >
          Chiqish
        </button>
      </div>

      <h1 style={{ textAlign: 'center' }}>{test ? test.title : "Test Page"}</h1>
      <hr />

      {loading && <div style={{ textAlign: 'center', marginTop: 20 }}>Yuklanmoqda...</div>}
      {error && <div style={{ color: 'red', textAlign: 'center', fontWeight: 'bold' }}>{error}</div>}

      {!loading && !error && questions.map((q, index) => (
        <div key={q.id} style={{ marginBottom: 30, padding: 15, border: '1px solid #ddd', borderRadius: 10 }}>
          <h3>{index + 1}. {q.question_text}</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {q.options.map((opt, i) => (
              <label key={i} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', padding: '5px' }}>
                <input
                  type="radio"
                  name={`q-${q.id}`}
                  style={{ marginRight: 10, width: 18, height: 18 }}
                  onChange={() => handleSelect(q.id, i)}
                />
                {opt}
              </label>
            ))}
          </div>
        </div>
      ))}

      {!loading && !error && questions.length > 0 && (
        <button 
          onClick={submitTest}
          style={{ 
            width: '100%', 
            padding: '15px', 
            background: '#22c55e', 
            color: 'white', 
            fontSize: '18px', 
            fontWeight: 'bold', 
            border: 'none', 
            borderRadius: 10, 
            cursor: 'pointer',
            marginTop: 20
          }}
        >
          Testni yakunlash
        </button>
      )}
    </div>
  );
}