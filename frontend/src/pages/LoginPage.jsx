import { useState, useEffect } from "react";
import { login, googleLogin as apiGoogleLogin } from "../api/api";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { useGoogleLogin } from "@react-oauth/google";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { login: loginContext } = useAuth();
  const toast = useToast();
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleGoogleSuccess = async (tokenResponse) => {
    try {
      setGoogleLoading(true);
      const data = await apiGoogleLogin(tokenResponse.access_token);
      loginContext(data);
      toast.success("Google orqali muvaffaqiyatli kirdingiz!");
      navigate("/profile");
    } catch (err) {
      toast.error(err.message || "Google tizimida xatolik");
    } finally {
      setGoogleLoading(false);
    }
  };

  const loginWithGoogle = useGoogleLogin({
    onSuccess: handleGoogleSuccess,
    onError: () => toast.error("Avtorizatsiya bekor qilindi")
  });

  useEffect(() => {
    const user = localStorage.getItem("user");
    if (user) navigate("/profile");
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const data = await login(email, password);
      localStorage.setItem("token", data.token);
      const userObj = { id: data.id, name: data.name || email, email: data.email, role: data.role };
      loginContext(userObj);
      if (data.id) localStorage.setItem("userId", String(data.id));
      localStorage.setItem("isAdmin", data.role === "admin" ? "true" : "false");
      
      if (data.role === "admin") navigate("/admin");
      else navigate("/profile");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="bg-[#f8fafb] text-[#191c1d] min-h-screen flex flex-col font-['Inter']">
      {/* Header Logo Area */}
      <header className="fixed top-0 w-full z-50 flex justify-between items-center px-4 md:px-8 py-4 md:py-6 bg-[#f8fafb]/80 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-[#00425e] text-3xl">account_balance</span>
          <span className="text-lg md:text-xl font-extrabold text-[#00425e] tracking-tight font-heading">BBA tizimi</span>
        </div>
        <div className="hidden md:flex gap-8 items-center text-sm font-medium text-slate-600">
          <span className="hover:text-[#00425e] transition-colors cursor-pointer">Imtihonlar</span>
          <span className="hover:text-[#00425e] transition-colors cursor-pointer">Yordam</span>
          <div className="w-8 h-8 rounded-full bg-[#cbe7f5] flex items-center justify-center">
            <span className="material-symbols-outlined text-sm text-[#304a55]">person</span>
          </div>
        </div>
      </header>

      <main className="flex-grow flex items-center justify-center px-3 md:px-4 pt-20 md:pt-24 pb-8 md:pb-12 relative overflow-hidden">
        {/* Abstract Background Elements */}
        <div className="absolute top-[-10%] right-[-10%] w-[40vw] h-[40vw] rounded-full bg-[#8ecef7]/20 blur-[120px]"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[30vw] h-[30vw] rounded-full bg-[#8df5e4]/20 blur-[100px]"></div>

        <div className="w-full max-w-[1100px] grid md:grid-cols-2 gap-0 overflow-hidden rounded-2xl md:rounded-[2rem] shadow-[32px_0_64px_-20px_rgba(0,0,0,0.05)] bg-white">
          {/* Visual Editorial Side */}
          <div className="hidden md:flex flex-col justify-between p-12 bg-[#00425e] relative">
            <div className="absolute inset-0 opacity-20 pointer-events-none">
              <img className="w-full h-full object-cover" alt="Modern library" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCA-a94JR9Q0t1ZQ8boU9yQG4xhLXrp8kKsv3sWBc0_h2T7qD-f-FVxRluPKjBQX-DLpoF4vAzIUQEIsmeSxnON6juMzxnHlnWI2oGmMisxh2u3OKYSbGwn3ALcvdmpkhpwJ214LOsr3e6eJ-bfRr9uvFE8TEr70-hd7w_VxW63RC8Hru8ZL8-kqW62MP92EmXmNb3mo6hwcS4yM6ZC4lBZL3JHhxnZ013wNeUXUBjbQeI9KxcqqzcYo7d42ve--JgUeXjeV5hOFw" />
            </div>
            <div className="relative z-10">
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-[#005b7f] text-[#91d1fb] text-xs font-bold tracking-widest uppercase mb-6">
                Milliy Sertifikatsiya
              </div>
              <h2 className="text-4xl font-extrabold text-white leading-tight font-heading">Kelajak sari birinchi qadamni biz bilan tashlang.</h2>
              <p className="mt-4 text-[#8ecef7] text-lg max-w-md">Akademik mukammallik va ishonchli bilim platformasiga xush kelibsiz.</p>
            </div>
            <div className="relative z-10 space-y-6">
              <div className="flex items-center gap-4 text-white/90">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-md">
                  <span className="material-symbols-outlined">verified</span>
                </div>
                <div>
                  <p className="font-bold text-sm">Rasmiy tasdiqlangan</p>
                  <p className="text-xs text-white/60">Davlat standartlari asosida</p>
                </div>
              </div>
            </div>
          </div>

          {/* Form Side */}
          <div className="p-5 sm:p-8 md:p-16 flex flex-col justify-center">
            <div className="mb-8 md:mb-10">
              <h1 className="text-2xl md:text-3xl font-extrabold text-[#191c1d] font-headline mb-2">Xush kelibsiz</h1>
              <p className="text-[#40484e] text-sm font-body">Tizimga kirish uchun ma'lumotlaringizni kiriting</p>
            </div>

            <form className="space-y-5 md:space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label className="block text-xs font-bold text-[#40484e] uppercase tracking-wider ml-1">Foydalanuvchi nomi yoki Email</label>
                <div className="relative group">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#70787e] group-focus-within:text-[#00425e] transition-colors">alternate_email</span>
                  <input 
                    className="w-full pl-12 pr-4 py-3.5 md:py-4 rounded-xl bg-[#f2f4f5] border-none focus:ring-2 focus:ring-[#00425e]/20 focus:bg-white transition-all text-[#191c1d] placeholder:text-[#70787e]/60" 
                    placeholder="misol@scholar.uz" 
                    type="text" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <label className="block text-xs font-bold text-[#40484e] uppercase tracking-wider">Parol</label>
                  <Link to="/forgot-password" global="true" className="text-xs font-semibold text-[#00425e] hover:underline">Unutdingizmi?</Link>
                </div>
                <div className="relative group">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#70787e] group-focus-within:text-[#00425e] transition-colors">lock</span>
                  <input 
                    className="w-full pl-12 pr-4 py-3.5 md:py-4 rounded-xl bg-[#f2f4f5] border-none focus:ring-2 focus:ring-[#00425e]/20 focus:bg-white transition-all text-[#191c1d] placeholder:text-[#70787e]/60" 
                    placeholder="••••••••" 
                    type={showPassword ? "text" : "password"} 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <span 
                    className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-[#70787e] cursor-pointer hover:text-[#191c1d]" 
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? "visibility_off" : "visibility"}
                  </span>
                </div>
              </div>

              {error && <div className="text-red-500 text-xs font-bold text-center bg-red-50 py-3 rounded-xl">{error}</div>}

              <button type="submit" className="w-full py-3.5 md:py-4 bg-[#00425e] text-white rounded-xl font-bold text-base shadow-lg shadow-slate-900/10 hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                Kirish
                <span className="material-symbols-outlined text-xl">arrow_forward</span>
              </button>
            </form>

            <div className="relative my-7 md:my-10 text-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#e6e8e9]"></div>
              </div>
              <span className="relative px-4 bg-white text-xs font-bold text-[#70787e] uppercase tracking-widest">Yoki</span>
            </div>

            <div className="space-y-4">
              <button 
                onClick={() => loginWithGoogle()}
                disabled={googleLoading}
                className="w-full py-3.5 md:py-4 bg-[#f2f4f5] border border-transparent hover:border-[#c0c7ce] rounded-xl font-semibold text-sm text-[#191c1d] flex items-center justify-center gap-3 transition-all active:scale-[0.99]"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"></path>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
                </svg>
                {googleLoading ? "Kutilmoqda..." : "Google orqali kirish"}
              </button>
            </div>

            <p className="mt-8 md:mt-10 text-center text-sm font-medium text-[#40484e]">
              Hali ro'yxatdan o'tmaganmisiz? 
              <Link to="/register" className="text-[#00425e] font-bold ml-1 hover:underline">Ro'yxatdan o'tish</Link>
            </p>
          </div>
        </div>
      </main>

      {/* Footer Content */}
      <footer className="w-full bg-[#f8fafb] px-4 md:px-12 py-6 md:py-8 mt-auto flex flex-col md:flex-row justify-between items-center border-t border-slate-100">
        <div className="text-xs text-center md:text-left font-['Inter'] tracking-wide text-slate-500 mb-4 md:mb-0">
          © 2024 National Certification Board. All Rights Reserved.
        </div>
        <div className="flex gap-4 md:gap-8 flex-wrap justify-center">
          <button className="text-xs font-medium text-slate-400 hover:text-[#00425e] transition-opacity">Privacy Policy</button>
          <button className="text-xs font-medium text-slate-400 hover:text-[#00425e] transition-opacity">Terms of Service</button>
          <button className="text-xs font-medium text-slate-400 hover:text-[#00425e] transition-opacity">Help Center</button>
        </div>
      </footer>
    </div>
  );
}
