import React, { useEffect, useState } from "react";
import axios from "../api/axios";
import { useNavigate } from "react-router-dom";

const ResultsPage = () => {
  const navigate = useNavigate();
  // const [attempts, setAttempts] = useState([]);
  const [userTests, setUserTests] = useState([]); // Foydalanuvchining ishlagan testlari uchun state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [message, setMessage] = useState("");
  const [raschMessage, setRaschMessage] = useState("");


  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      console.error("Foydalanuvchi tokeni topilmadi. Iltimos, tizimga qayta kiring.");
      setMessage("Foydalanuvchi tizimga kirmagan. Iltimos, tizimga qayta kiring.");
      return;
    }

    // fetchUnreviewed();
    fetchUserTests(currentPage);
  }, [currentPage]);





  const fetchUserTests = async (page = 1) => {
    try {
      const res = await axios.get(`/attempts/all-user-tests?page=${page}&limit=20`);
      console.log("/attempts/all-user-tests javobi:", res.data);
      if (res.data && res.data.data) {
        setUserTests(res.data.data);
        setTotalPages(res.data.totalPages || 1);
      } else {
        setUserTests(res.data);
      }
    } catch (e) {
      console.error("Foydalanuvchi testlarini olishda xatolik:", e);
      setMessage("Natijalarni olishda xatolik yoki admin token talab qilinadi");
      setUserTests([]);
    }
  };


  const handleBatchPublish = async () => {
    setMessage("");
    try {
      await axios.post("/attempts/publish-all");
      setMessage("Barcha baholangan natijalar e'lon qilindi!");
      // fetchUnreviewed();
    } catch (e) {
      setMessage("Xatolik: E'lon qilishda muammo yuz berdi");
    }
  };

  const handleRaschRun = async () => {
    setRaschMessage("");
    try {
      await axios.post("/attempts/rasch-run");
      setRaschMessage("Rasch hisoblandi (e'lon qilinmadi)");
      fetchUserTests(currentPage);
    } catch (e) {
      setRaschMessage("Xatolik: Rasch hisoblashda muammo yuz berdi");
    }
  };


  console.log("Render: userTests:", userTests);
  return (
    <div className="p-8 bg-gradient-to-br from-blue-50 via-white to-green-50 min-h-screen">
      <h2 className="text-3xl font-black mb-8 text-blue-900 tracking-tight drop-shadow">
        Yozma javoblarni baholash markazi
      </h2>
      {message && (
        <div className="mb-4 text-green-700 font-bold bg-green-50 px-4 py-2 rounded-xl shadow animate-pulse">
          {message}
        </div>
      )}
      {raschMessage && (
        <div className="mb-4 text-blue-700 font-bold bg-blue-50 px-4 py-2 rounded-xl shadow animate-pulse">
          {raschMessage}
        </div>
      )}
      <div className="flex flex-wrap gap-3 mb-6">
        <button
          onClick={() => navigate('/admin/pre-rasch-review')}
          className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg transition-all"
        >
          AI/kalit tekshiruvini ko'rish
        </button>
        <button
          onClick={handleRaschRun}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg transition-all"
        >
          Rasch hisoblash (e'lon qilmasdan)
        </button>
        <button
          onClick={handleBatchPublish}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg transition-all"
        >
          Barcha natijalarni e'lon qilish
        </button>
      </div>


      <div className="bg-white rounded-3xl shadow-xl p-6 mb-8">
        <h3 className="text-xl font-bold mb-4 text-slate-900">Foydalanuvchining ishlagan testlari</h3>

        <table className="w-full text-sm text-slate-900">
          <thead>
            <tr className="bg-slate-100 text-slate-700 uppercase text-xs">
              <th className="px-4 py-2">#</th>
              <th className="px-4 py-2">Foydalanuvchi</th>
              <th className="px-4 py-2">Fan nomi</th>
              <th className="px-4 py-2">Test nomi</th>
              <th className="px-4 py-2">Rasch balli</th>
              <th className="px-4 py-2">Daraja</th>
              <th className="px-4 py-2">Holat</th>
            </tr>
          </thead>
          <tbody className="text-slate-900">
            {userTests.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-8 text-slate-400 font-bold">
                  Testlar topilmadi
                </td>
              </tr>
            )}
            {userTests.map((test, i) => (
              <tr key={test.id}>
                <td className="px-4 py-2 font-bold text-slate-400">{i + 1}</td>
                <td className="px-4 py-2">{test.user_name}</td>
                <td className="px-4 py-2">{test.subject_name}</td>
                <td className="px-4 py-2">{test.test_name}</td>
                <td className="px-4 py-2 font-bold">{Number.isFinite(Number(test.t_score)) ? Number(test.t_score).toFixed(1) : "-"}</td>
                <td className="px-4 py-2 font-bold">{test.level ?? "-"}</td>
                <td className="px-4 py-2">
                  {test.is_published ? (
                    <span className="text-green-600 font-bold">E'lon qilingan</span>
                  ) : test.status === "rasch_scored" ? (
                    <span className="text-indigo-600 font-bold">Rasch tayyor, e'lon kutmoqda</span>
                  ) : test.status === "ready_for_rasch" || test.status === "reviewed" ? (
                    <span className="text-blue-600 font-bold">AI tayyor, Rasch kutilmoqda</span>
                  ) : test.status === "waiting_ai" ? (
                    <span className="text-amber-600 font-bold">AI tekshirilmoqda</span>
                  ) : (
                    <span className="text-slate-500 font-bold">Kutilmoqda</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {totalPages > 1 && (
          <div className="flex justify-center mt-6 space-x-2">
            <button 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              className="px-4 py-2 bg-slate-200 rounded disabled:opacity-50"
            >Oldingi</button>
            <span className="px-4 py-2 font-bold">{currentPage} / {totalPages}</span>
            <button 
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              className="px-4 py-2 bg-slate-200 rounded disabled:opacity-50"
            >Keyingi</button>
          </div>
        )}
      </div>


    </div>
  );
};

export default ResultsPage;
