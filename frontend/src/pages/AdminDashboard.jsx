import { useNavigate } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { getSubjects, getTests, deleteSubject, deleteTest, getAdminMessages } from "../api/api";
import { useToast } from "../context/ToastContext";




export default function AdminDashboard() {
  const navigate = useNavigate();
  const toast = useToast();
  const { logout } = useAuth();
  const [subjects, setSubjects] = useState([]);
  const [tests, setTests] = useState([]);
  const [message, setMessage] = useState("");
  const [stats, setStats] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);

  const BASE_URL = "http://localhost:4000/api";
  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: token.startsWith("Bearer ") ? token : `Bearer ${token}` } : {};
  };

  const handleLogout = () => {
    logout();
    localStorage.clear();
    navigate("/login", { replace: true });
  };

  const loadData = useCallback(async () => {
    try {
      const subRes = await getSubjects();
      const testRes = await getTests();
      setSubjects(subRes || []);
      setTests(testRes || []);
    } catch (err) {
      console.error("Ma'lumot yuklashda xatolik");
    }
  }, []);

  const loadStats = useCallback(async () => {
    try {
      const res = await fetch(`${BASE_URL}/admin/stats`, { headers: getAuthHeaders() });
      if (res.ok) setStats(await res.json());
    } catch {}
  }, []);

  const handleExportCSV = async () => {
    try {
      const res = await fetch(`${BASE_URL}/admin/export/results`, { headers: getAuthHeaders() });
      if (!res.ok) { toast.error("Export xatosi"); return; }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `natijalar_${Date.now()}.csv`; a.click();
      URL.revokeObjectURL(url);
      toast.success("CSV fayl yuklab olindi!");
    } catch (err) {
      toast.error("Export xatosi: " + err.message);
    }
  };

  useEffect(() => { 
    loadData(); 
    loadStats();
    getAdminMessages().then(data => {
      const count = (data.data || []).filter(m => !m.is_read).length;
      setUnreadCount(count);
    }).catch(() => {});
  }, [loadData, loadStats]);

  const handleDeleteSubject = async (id) => {
    if (!window.confirm("Fanni o'chirish barcha bog'liq testlarni ham o'chirishi mumkin. Rozimisiz?")) return;
    await deleteSubject(id);
    toast.success("Fan muvaffaqiyatli o'chirildi");
    setMessage("");
    loadData();
  };

  const handleDeleteTest = async (id) => {
    if (!window.confirm("Testni o'chirishga ishonchingiz komilmi?")) return;
    await deleteTest(id);
    toast.success("Test o'chirildi");
    setMessage("");
    loadData();
  };

  return (
    <div className="bg-[#F8FAFC] text-slate-900 min-h-screen font-['Inter']">
      
      {/* Sidebar - O'zgarmas qoldi */}
      <aside className="fixed left-0 top-0 h-full w-72 bg-white flex flex-col p-6 space-y-4 shadow-[20px_0_40px_-20px_rgba(0,0,0,0.05)] z-40">
        <div className="flex items-center space-x-3 mb-10 px-2">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
            <span className="material-symbols-outlined text-white text-2xl">shield</span>
          </div>
          <span className="font-black text-xl tracking-tighter text-slate-800">BBA <span className="text-blue-600">PRO</span></span>
        </div>
        
        <nav className="flex-1 space-y-1">
          <button className="w-full flex items-center space-x-3 px-4 py-3 bg-blue-50 text-blue-600 font-bold rounded-xl transition-all">
            <span className="material-symbols-outlined">dashboard</span>
            <span>Dashboard</span>
          </button>
          <button onClick={() => navigate("/admin-test-create")} className="w-full flex items-center space-x-3 px-4 py-3 text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-all rounded-xl">
            <span className="material-symbols-outlined">add_circle</span>
            <span>Yangi Test</span>
          </button>
          <button
            onClick={() => navigate("/admin/results")}
            className="w-full flex items-center space-x-3 px-4 py-3 text-slate-400 hover:bg-slate-50 hover:text-blue-600 transition-all rounded-xl">
            <span className="material-symbols-outlined">assignment_turned_in</span>
            <span>Natijalar</span>
          </button>
          <button
            onClick={() => navigate("/leaderboard")}
            className="w-full flex items-center space-x-3 px-4 py-3 text-slate-400 hover:bg-slate-50 hover:text-yellow-600 transition-all rounded-xl">
            <span className="material-symbols-outlined">leaderboard</span>
            <span>Reyting</span>
          </button>
          <button
            onClick={() => navigate("/admin/audit-log")}
            className="w-full flex items-center space-x-3 px-4 py-3 text-slate-400 hover:bg-slate-50 hover:text-purple-600 transition-all rounded-xl">
            <span className="material-symbols-outlined">history</span>
            <span>Audit Log</span>
          </button>
          <button
            onClick={() => navigate("/admin/messages")}
            className="w-full flex items-center space-x-3 px-4 py-3 text-slate-400 hover:bg-slate-50 hover:text-blue-600 transition-all rounded-xl relative">
            <span className="material-symbols-outlined">mail</span>
            <span>Murojaatlar</span>
            {unreadCount > 0 && (
              <span style={{
                background: "#ef4444", color: "#fff", borderRadius: "999px",
                fontSize: "10px", fontWeight: 800, padding: "1px 6px",
                marginLeft: "auto", minWidth: "18px", textAlign: "center"
              }}>{unreadCount}</span>
            )}
          </button>
          <button
            onClick={() => navigate("/admin/manual-payments")}
            className="w-full flex items-center space-x-3 px-4 py-3 text-slate-400 hover:bg-slate-50 hover:text-emerald-600 transition-all rounded-xl">
            <span className="material-symbols-outlined">payments</span>
            <span>To'lovlar (chek)</span>
          </button>
          <div className="pt-4 mt-4 border-t border-slate-100">
            <button
              onClick={() => navigate("/")}
              className="w-full flex items-center space-x-3 px-4 py-3 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all rounded-xl font-bold">
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              <span>Saytga qaytish</span>
            </button>
          </div>
        </nav>

        <div className="mt-auto p-4 bg-slate-50 rounded-2xl flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center font-black text-blue-600">AD</div>
          <div className="overflow-hidden">
            <p className="text-sm font-bold truncate">Administrator</p>
            <button onClick={handleLogout} className="text-[10px] font-black uppercase text-red-500 hover:underline">Chiqish</button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-72 p-8 space-y-8">
        
        
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <button onClick={() => navigate("/admin-test-create")} className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-200 hover:scale-105 transition-all">
              + Yangi Test
            </button>
            <button onClick={handleExportCSV} className="bg-emerald-600 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg hover:scale-105 transition-all flex items-center gap-2">
              <span className="material-symbols-outlined" style={{fontSize:"16px"}}>download</span>
              CSV Export
            </button>
          </div>

        {message && (
          <div className="bg-green-500 text-white p-4 rounded-2xl font-bold text-center animate-bounce shadow-lg shadow-green-100">
            {message}
          </div>
        )}

        {/* Data Management Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Fanlar Boshqaruvi */}
          <section className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-8 border-b border-slate-50 flex justify-between items-center">
                <h3 className="font-black text-slate-800 uppercase tracking-widest text-xs">Mavjud Fanlar</h3>
                <span className="bg-slate-100 px-3 py-1 rounded-full text-[10px] font-black text-slate-500">{subjects.length} TA</span>
            </div>
            <div className="p-4 max-h-[400px] overflow-y-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                            <th className="px-4 py-3">Fan Nomi</th>
                            <th className="px-4 py-3 text-right">Amallar</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {subjects.map(subj => (
                            <tr key={subj.id} className="group hover:bg-slate-50 transition-all">
                                <td className="px-4 py-4 font-bold text-slate-700">{subj.name}</td>
                                <td className="px-4 py-4 text-right">
                                    <button 
                                        onClick={() => handleDeleteSubject(subj.id)}
                                        className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                                    >
                                        <span className="material-symbols-outlined">delete_sweep</span>
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
          </section>

          {/* Testlar Boshqaruvi */}
          <section className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-8 border-b border-slate-50 flex justify-between items-center">
                <h3 className="font-black text-slate-800 uppercase tracking-widest text-xs">Aktiv Testlar</h3>
                <span className="bg-blue-50 px-3 py-1 rounded-full text-[10px] font-black text-blue-600">{tests.length} TA</span>
            </div>
            <div className="p-4 max-h-[400px] overflow-y-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                            <th className="px-4 py-3">Test Sarlavhasi</th>
                            <th className="px-4 py-3 text-right">Amallar</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {tests.map(test => (
                            <tr key={test.id} className="group hover:bg-slate-50 transition-all">
                                <td className="px-4 py-4">
                                    <p className="font-bold text-slate-700">{test.title}</p>
                                    <p className="text-[10px] text-slate-400 font-medium">ID: #{test.id}</p>
                                </td>
                                <td className="px-4 py-4 text-right">
                                    <div className="flex justify-end gap-2">
                                        <button 
                                            onClick={() => navigate(`/admin/tests/${test.id}/edit`)}
                                            className="p-2 text-slate-300 hover:text-blue-500 transition-colors"
                                            title="Testni Tahrirlash"
                                        >
                                            <span className="material-symbols-outlined text-xl">edit_note</span>
                                        </button>
                                        <button 
                                            onClick={() => handleDeleteTest(test.id)}
                                            className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                                        >
                                            <span className="material-symbols-outlined text-xl">delete</span>
                                        </button>

                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
          </section>

        </div>

        {/* Stats Grid - Real Data */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-8 rounded-[2rem] border border-slate-100 relative overflow-hidden group">
                <div className="relative z-10">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Jami Foydalanuvchilar</p>
                    <h4 className="text-4xl font-black text-slate-800">{stats ? stats.totalUsers.toLocaleString() : "..."}</h4>
                    <div className="mt-4 flex items-center text-blue-500 font-bold text-xs">
                        <span className="material-symbols-outlined text-sm mr-1">groups</span> Ro'yxatdan o'tgan
                    </div>
                </div>
                <span className="material-symbols-outlined absolute -right-4 -bottom-4 text-[120px] text-slate-50 opacity-50 group-hover:scale-110 transition-transform">groups</span>
            </div>

            <div className="bg-blue-600 p-8 rounded-[2rem] shadow-xl shadow-blue-100 relative overflow-hidden group">
                <div className="relative z-10 text-white">
                    <p className="text-[10px] font-black text-blue-200 uppercase tracking-[0.2em] mb-1">Jami Urinishlar</p>
                    <h4 className="text-4xl font-black">{stats ? stats.totalAttempts.toLocaleString() : "..."}</h4>
                    <div className="mt-4 flex items-center text-blue-200 font-bold text-xs uppercase tracking-widest">
                        E'lon qilingan: {stats ? stats.publishedCount : "—"}
                    </div>
                </div>
                <span className="material-symbols-outlined absolute -right-4 -bottom-4 text-[120px] text-white opacity-10 group-hover:scale-110 transition-transform">assignment</span>
            </div>

            <div className="bg-emerald-600 p-8 rounded-[2rem] shadow-xl shadow-emerald-100 relative overflow-hidden group">
                <div className="relative z-10 text-white">
                    <p className="text-[10px] font-black text-emerald-200 uppercase tracking-[0.2em] mb-1">Jami Tushum</p>
                    <h4 className="text-4xl font-black">
                      {stats ? stats.totalRevenue.toLocaleString() : "..."}
                      <span className="text-lg opacity-70 ml-1">UZS</span>
                    </h4>
                    <div className="mt-3 text-emerald-100 text-xs font-bold space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm">receipt_long</span>
                        Chek: {stats ? stats.totalManual.toLocaleString() : "..."} UZS
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm">credit_card</span>
                        Payme: {stats ? stats.totalOnline.toLocaleString() : "..."} UZS
                      </div>
                    </div>
                </div>
                <span className="material-symbols-outlined absolute -right-4 -bottom-4 text-[120px] text-white opacity-10 group-hover:scale-110 transition-transform">payments</span>
            </div>

            <div className="bg-slate-900 p-8 rounded-[2rem] relative overflow-hidden group">
                <div className="relative z-10 text-white">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">O'rtacha Ball</p>
                    <h4 className="text-4xl font-black">{stats ? stats.avgScore : "..."}<span className="text-lg opacity-50">/100</span></h4>
                    <div className="mt-4 flex items-center text-green-400 font-bold text-xs uppercase tracking-widest">
                        Bugun: {stats ? stats.todayAttempts : "—"} ta
                    </div>
                </div>
                <span className="material-symbols-outlined absolute -right-4 -bottom-4 text-[120px] text-white opacity-5 group-hover:scale-110 transition-transform">analytics</span>
            </div>
        </div>

      </main>

      {/* Floating Action Button */}
      <button onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})} className="fixed bottom-8 right-8 w-14 h-14 bg-white text-slate-900 rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform border border-slate-100">
        <span className="material-symbols-outlined">expand_less</span>
      </button>

    </div>
  );
}