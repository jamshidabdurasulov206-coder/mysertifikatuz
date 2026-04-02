import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function ReviewPage() {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [userAnswers, setUserAnswers] = useState({});
  const [resultSummary, setResultSummary] = useState(null);

  useEffect(() => {
    // Ma'lumotlarni tiklash
    const lastResult = JSON.parse(localStorage.getItem("lastResult"));
    const savedQuestions = JSON.parse(localStorage.getItem("last_exam_questions")) || [];
    const savedAnswers = JSON.parse(localStorage.getItem("temp_answers")) || {};

    if (!lastResult) {
      navigate("/profile");
      return;
    }

    setResultSummary(lastResult);
    setQuestions(savedQuestions);
    setUserAnswers(savedAnswers);
  }, [navigate]);

  if (!resultSummary) return null;

  return (
    <div className="bg-slate-50 min-h-screen font-['Inter'] pb-20">
      {/* Yopishqoq Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50 px-6 py-4 shadow-sm">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <button onClick={() => navigate("/profile")} className="flex items-center gap-2 text-slate-600 font-black hover:text-blue-600 transition-all group">
            <span className="material-symbols-outlined group-hover:-translate-x-1 transition-transform">arrow_back</span>
            PROFILGA QAYTISH
          </button>
          <div className="text-right">
            <p className="text-[10px] font-black text-slate-400 uppercase leading-none">Natija</p>
            <p className="text-lg font-black text-blue-600">{resultSummary.percentage}%</p>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 pt-10 space-y-10">
        
        {/* Xulosa Sarlavhasi */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Imtihon Tahlili</h1>
          <p className="text-slate-500 font-medium italic">Sizning javoblaringiz va to'g'ri yechimlar bilan tanishing</p>
        </div>

        {/* Savollar Ro'yxati */}
        <div className="space-y-8">
          {questions.map((q, idx) => {
            const isCorrect = userAnswers[q.id] === q.correct_option;
            const isSkipped = userAnswers[q.id] === undefined;

            return (
              <div key={q.id} className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/40 border border-slate-100 relative overflow-hidden transition-all hover:shadow-blue-50">
                {/* Chap tomondagi holat chizig'i */}
                <div className={`absolute top-0 left-0 w-2 h-full ${isCorrect ? 'bg-green-500' : isSkipped ? 'bg-amber-400' : 'bg-red-500'}`}></div>

                <div className="flex justify-between items-center mb-6">
                  <span className="bg-slate-100 text-slate-500 font-black text-[10px] px-4 py-1.5 rounded-full uppercase tracking-widest border border-slate-200">
                    Savol {idx + 1}
                  </span>
                  {isCorrect ? (
                    <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-1 rounded-lg border border-green-100">
                      <span className="material-symbols-outlined text-sm font-black">check</span>
                      <span className="text-[10px] font-black uppercase">To'g'ri</span>
                    </div>
                  ) : (
                    <div className={`flex items-center gap-2 ${isSkipped ? 'text-amber-600 bg-amber-50 border-amber-100' : 'text-red-600 bg-red-50 border-red-100'} px-3 py-1 rounded-lg border`}>
                      <span className="material-symbols-outlined text-sm font-black">{isSkipped ? 'priority_high' : 'close'}</span>
                      <span className="text-[10px] font-black uppercase">{isSkipped ? 'O' + "'" + 'tkazilgan' : 'Xato'}</span>
                    </div>
                  )}
                </div>

                <h3 className="text-xl font-bold text-slate-800 mb-8 leading-relaxed">
                  {q.question_text}
                </h3>

                {/* Variantlar Tahlili */}
                <div className="grid gap-3">
                  {q.options.map((opt, optIdx) => {
                    const isUserChoice = userAnswers[q.id] === optIdx;
                    const isCorrectChoice = q.correct_option === optIdx;

                    let cardStyle = "bg-slate-50 border-slate-100 text-slate-600";
                    if (isCorrectChoice) cardStyle = "bg-green-50 border-green-500/30 text-green-700 shadow-sm shadow-green-100 ring-1 ring-green-500/20";
                    if (isUserChoice && !isCorrectChoice) cardStyle = "bg-red-50 border-red-500/30 text-red-700 ring-1 ring-red-500/20";

                    return (
                      <div key={optIdx} className={`p-5 rounded-2xl border-2 flex items-center gap-4 transition-all ${cardStyle}`}>
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm border-2 ${
                          isCorrectChoice ? "bg-green-600 border-green-600 text-white shadow-lg shadow-green-200" : "bg-white border-slate-200"
                        }`}>
                          {String.fromCharCode(65 + optIdx)}
                        </div>
                        <span className="flex-grow font-bold">{opt}</span>
                        {isCorrectChoice && <span className="material-symbols-outlined text-green-600">verified</span>}
                        {isUserChoice && !isCorrectChoice && <span className="material-symbols-outlined text-red-600">report</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Pastki qism */}
        <div className="pt-10 pb-20 text-center">
            <button 
                onClick={() => navigate("/profile")}
                className="bg-slate-900 text-white px-12 py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-2xl hover:bg-blue-600 transition-all active:scale-95"
            >
                Tahlilni tugatish
            </button>
        </div>
      </main>
    </div>
  );
}