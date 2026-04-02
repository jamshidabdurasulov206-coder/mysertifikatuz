import { useEffect, useState } from "react";
import { getTests } from "../api/api";

const publishTestResults = async (testId) => {
  const token = localStorage.getItem('token');
  const res = await fetch(`http://localhost:4000/api/attempts/publish-all`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token ? (token.startsWith('Bearer ') ? token : `Bearer ${token}`) : ''
    },
    body: JSON.stringify({ testId })
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || 'Natijalarni e\'lon qilishda xatolik');
  }
  return res.json();
};

export default function ResultsManagement() {
  const [tests, setTests] = useState([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    getTests().then(setTests).catch(() => setTests([]));
  }, []);

  return (
    <div className="bg-[#F8FAFC] min-h-screen p-8 font-['Inter']">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-black text-slate-800 mb-8">Natijalarni e'lon qilish</h1>
        {message && (
          <div className="bg-green-500 text-white p-4 rounded-2xl font-bold text-center mb-6 animate-bounce shadow-lg shadow-green-100">
            {message}
          </div>
        )}
        <div className="space-y-6">
          {tests.map(test => (
            <div key={test.id} className="bg-white rounded-2xl shadow p-6 flex items-center justify-between border border-slate-100">
              <div>
                <div className="font-black text-lg text-slate-800">{test.title}</div>
                <div className="text-xs text-slate-400 mt-1">ID: #{test.id}</div>
              </div>
              <button
                onClick={async () => {
                  try {
                    await publishTestResults(test.id);
                    setMessage('Natijalar e\'lon qilindi!');
                    setTimeout(() => setMessage(''), 3000);
                  } catch (err) {
                    setMessage('Xatolik: ' + (err.message || '')); setTimeout(() => setMessage(''), 3000);
                  }
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg transition-all"
              >
                <span className="material-symbols-outlined align-middle mr-2">assignment_turned_in</span>
                Natijalarni e'lon qilish
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
