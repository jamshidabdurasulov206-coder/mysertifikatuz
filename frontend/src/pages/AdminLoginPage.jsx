import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Agar admin allaqachon login qilgan bo'lsa, avtomatik dashboardga o'tkazish
  useEffect(() => {
    const token = localStorage.getItem("token");
    const isAdmin = localStorage.getItem("isAdmin");
    if (token && isAdmin === "true") navigate("/admin", { replace: true });
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await res.json();
      
      if (res.ok && data.token) {
        localStorage.setItem("token", data.token);
        const isAdmin = data.role === "admin";
        localStorage.setItem("isAdmin", isAdmin ? "true" : "false");
        const userPayload = { id: data.id || 0, email: email || "admin@example.com", role: "admin" };
        localStorage.setItem("user", JSON.stringify(userPayload));
        localStorage.setItem("userId", String(userPayload.id || 0));
        navigate("/admin", { replace: true });
      } else {
        setError(data.message || "Email yoki parol noto'g'ri");
      }
    } catch (err) {
      setError("Tarmoq xatosi yoki server ishlamayapti");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] font-['Inter'] p-6">
      <div className="w-full max-w-md">
        
        {/* Logo / Brend qismi */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-[1.5rem] shadow-xl shadow-blue-200 mb-4">
            <span className="material-symbols-outlined text-white text-3xl font-bold">shield_person</span>
          </div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tighter uppercase">BBA <span className="text-blue-600">ADMIN</span></h1>
          <p className="text-slate-400 font-medium mt-2">Milliy Sertifikat Tizimi Boshqaruvi</p>
        </div>

        {/* Login Formasi */}
        <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl shadow-slate-200/60 border border-slate-100 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-blue-600"></div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-xs font-black uppercase tracking-widest text-center border border-red-100 animate-shake">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Email Manzil</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 text-xl">alternate_email</span>
                <input
                  type="email"
                  placeholder="admin@uzbmb.uz"
                  className="w-full pl-12 pr-6 py-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Maxfiy Parol</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 text-xl">lock</span>
                <input
                  type="password"
                  placeholder="••••••••"
                  className="w-full pl-12 pr-6 py-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className={`w-full py-5 rounded-2xl font-black uppercase text-xs tracking-[0.3em] shadow-xl transition-all active:scale-95 flex justify-center items-center gap-2 ${
                loading ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-slate-900 text-white hover:bg-blue-600 shadow-blue-100'
              }`}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>Kirish <span className="material-symbols-outlined text-sm">login</span></>
              )}
            </button>
          </form>
        </div>

        <p className="text-center mt-8 text-slate-400 text-xs font-medium">
          Texnik yordam: <span className="text-blue-600 font-bold cursor-pointer hover:underline">support@uzbmb.uz</span>
        </p>
      </div>
    </div>
  );
}
