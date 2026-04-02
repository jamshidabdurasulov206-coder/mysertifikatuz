import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getUserAttempts } from "../api/api";

export default function ResultPendingPage() {
  const location = useLocation();
  const total = location.state?.total || 0;
  const answered = location.state?.answered || 0;
  const attemptId = location.state?.attemptId || null;

  const navigate = useNavigate();
  const [statusText, setStatusText] = useState("AI tekshiruv kutilmoqda...");
  const [seconds, setSeconds] = useState(0);

  const doneStatuses = useMemo(() => new Set(["ready_for_rasch", "reviewed", "rasch_scored", "published"]), []);

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (!userId) return;

    let cancelled = false;
    let redirected = false;

    const tick = async () => {
      try {
        const attempts = await getUserAttempts(userId);
        if (cancelled || !Array.isArray(attempts) || attempts.length === 0) return;

        const target = attemptId
          ? attempts.find((a) => String(a.id) === String(attemptId))
          : attempts[0];

        if (!target) return;
        const status = target.status || "pending";

        if (status === "waiting_ai") {
          setStatusText("AI tekshiruv davom etmoqda...");
        } else if (doneStatuses.has(status)) {
          redirected = true;
          setStatusText("Natija qabul qilindi. Profilga yo'naltirilmoqda...");
          setTimeout(() => {
            if (!cancelled) navigate("/profile");
          }, 700);
        } else {
          setStatusText("Natija qayta ishlanmoqda...");
        }
      } catch (_e) {
        if (!cancelled) setStatusText("Holatni tekshirishda xatolik. Qayta urinish...");
      }
    };

    const hardRedirect = setTimeout(() => {
      if (!cancelled && !redirected) {
        setStatusText("Jarayon uzoq davom etdi. Profilga yo'naltirilmoqda...");
        navigate("/profile");
      }
    }, 15000);

    const timer = setInterval(() => {
      setSeconds((s) => s + 1);
      tick();
    }, 2000);

    tick();
    return () => {
      cancelled = true;
      clearInterval(timer);
      clearTimeout(hardRedirect);
    };
  }, [attemptId, doneStatuses, navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-yellow-50">
      <div className="bg-white rounded-[2.5rem] p-12 shadow-lg border-l-8 border-yellow-400 flex flex-col items-center">
        <div className="h-24 w-24 rounded-3xl bg-yellow-400 text-white flex flex-col items-center justify-center shadow-lg mb-6">
          <span className="text-6xl font-black material-symbols-outlined">hourglass_empty</span>
        </div>
        <h1 className="text-3xl font-black text-yellow-700 mb-2">Imtihon yakunlandi!</h1>
        <div className="text-slate-700 text-lg font-bold mb-4 text-center">
          <div>Jami savollar: {total}</div>
          <div>Javob berildi: {answered}</div>
          <div className="mt-2 text-yellow-700">{statusText}</div>
          <div className="mt-1 text-xs text-slate-500">Avtomatik tekshiruv: {seconds}s</div>
        </div>
        <button
          onClick={() => navigate("/profile")}
          className="mt-4 bg-blue-600 text-white px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg active:scale-95 transition-all"
        >
          Asosiy sahifaga qaytish
        </button>
      </div>
    </div>
  );
}
