// API manzili: prod-da REACT_APP_API_URL ni bering (masalan, https://api.mysite.com/api).
// Agar env yo'q bo'lsa, brauzer origin'iga tayangan holda /api ga relative yo'l ishlatiladi.
const ENV_API_URL = process.env.REACT_APP_API_URL;

const computedBase = (() => {
  if (ENV_API_URL) return ENV_API_URL;
  if (typeof window !== "undefined" && window.location?.origin) {
    return `${window.location.origin}/api`;
  }
  return "/api"; // CRA dev proxy
})();

const BASE_URL = computedBase.replace(/\/$/, "");

// Uploadlar uchun to'g'ridan-to'g'ri backend origin (devda proxy 3000 emas, 4000 kerak)
const UPLOAD_ORIGIN = (() => {
  try {
    if (ENV_API_URL) return new URL(ENV_API_URL).origin;
    if (typeof window !== "undefined" && window.location?.origin) {
      const { protocol, hostname, port } = window.location;
      const isLocal = hostname === "localhost" || hostname === "127.0.0.1";
      if (isLocal) {
        // Devda frontend 3000/3001/... bo'lishi mumkin, upload har doim backenddan olinadi
        return `${protocol}//${hostname}:4000`;
      }
      // Prod/dev-server bo'lmagan holatda joriy originni ishlatamiz
      if (port) return `${protocol}//${hostname}:${port}`;
      return `${protocol}//${hostname}`;
    }
  } catch (_) {}
  return "http://localhost:4000";
})();

/**
 * Serverdan kelgan javobni qayta ishlash funksiyasi.
 * Agar xato bo'lsa, xatoni throw qiladi.
 */
const handleResponse = async (res, defaultMsg) => {
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || data.error || defaultMsg);
  }
  return data;
};

/**
 * LocalStorage'dan tokenni oladi va Authorization header'ini tayyorlaydi.
 */
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    console.warn("Token topilmadi! Foydalanuvchi tizimga kirmagan.");
    return {};
  }

  // Token formatini standartlashtiramiz (Bearer borligini tekshiramiz)
  const formattedToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;

  return {
    "Authorization": formattedToken
  };
};

// --- AUTH (Ro'yxatdan o'tish va Kirish) ---
export const register = async (name, email, password) => {
  const res = await fetch(`${BASE_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ full_name: name, email, password })
  });
  return handleResponse(res, "Ro'yxatdan o'tishda xatolik");
};

export const login = async (email, password) => {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });
  const data = await handleResponse(res, "Kirishda xatolik");
  if (data.token) localStorage.setItem("token", data.token);
  return data;
};

export const googleLogin = async (credential) => {
  const res = await fetch(`${BASE_URL}/auth/google`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ credential })
  });
  const data = await handleResponse(res, "Google avtorizatsiyasida xatolik");
  if (data.token) localStorage.setItem("token", data.token);
  return data;
};

export const adminLogin = async (email, password) => {
  const res = await fetch(`${BASE_URL}/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await handleResponse(res, "Admin login xatosi");
  
  // Admin tokenni saqlash
  if (data.token) localStorage.setItem("token", data.token); 
  return data;
};

// --- SUBJECTS (Fanlar) ---
export const getSubjects = async () => {
  const res = await fetch(`${BASE_URL}/subjects`);
  if (!res.ok) throw new Error("Fanlarni olishda xatolik");
  return res.json();
};

export const deleteSubject = async (id) => {
  const res = await fetch(`${BASE_URL}/subjects/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  return handleResponse(res, "Fan o'chirilmadi");
};

// --- TESTS (Testlar) ---
export const getTests = async (subjectId = null) => {
  const url = (subjectId && subjectId !== "undefined")
    ? `${BASE_URL}/tests?subject_id=${subjectId}` 
    : `${BASE_URL}/tests`;
  const res = await fetch(url);
  return res.json();
};

export const deleteTest = async (id) => {
  const res = await fetch(`${BASE_URL}/tests/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  return handleResponse(res, "Test o'chirilmadi");
};

/**
 * Eng muhim qism: Testni savollari bilan birga saqlash.
 * 401 hatosini oldini olish uchun Authorization va Content-Type headerlari qo'shilgan.
 */
export const createTestWithQuestions = async (testData) => {
  const res = await fetch(`${BASE_URL}/tests`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders() // Tokenni shu yerda yuboramiz
    },
    body: JSON.stringify(testData),
  });

  // Agar 401 kelsa, foydalanuvchini ogohlantirish
  if (res.status === 401 || res.status === 403) {
    throw new Error("Ruxsat berilmadi! Admin huquqi kerak yoki sessiya muddati tugagan.");
  }

  return handleResponse(res, "Testni saqlashda xatolik");
};

// --- QUESTIONS (Savollar) ---
export const getQuestions = async (testId) => {
  const res = await fetch(`${BASE_URL}/questions/${testId}`);
  if (!res.ok) throw new Error("Savollarni yuklashda xatolik");
  const data = await res.json();
  return Array.isArray(data) ? data : (data.data || []);
};

export const getAdminTestFull = async (testId) => {
  const res = await fetch(`${BASE_URL}/admin/tests/${testId}/full`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(res, "Testni yuklashda xatolik");
};

export const updateAdminTestAndQuestions = async (testId, payload) => {
  const res = await fetch(`${BASE_URL}/admin/tests/${testId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    },
    body: JSON.stringify(payload),
  });
  return handleResponse(res, "Testni yangilashda xatolik");
};

// --- TEST ANALYTICS ---
export const getTestAnalytics = async (testId) => {
  const res = await fetch(`${BASE_URL}/admin/analytics/${testId}`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(res, "Test tahlilini yuklashda xatolik");
};

// --- EXAM & ATTEMPTS (Urinishlar) ---
export const sendAttempt = async (data) => {
  const res = await fetch(`${BASE_URL}/attempts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error("Server xatosi: " + errorText);
  }
  return await res.json();
};

// --- USER ATTEMPTS (Foydalanuvchi natijalari) ---
export const getUserAttempts = async (userId) => {
  const res = await fetch(`${BASE_URL}/attempts/user/${encodeURIComponent(userId)}`, {
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
  });
  if (!res.ok) throw new Error("Natijalarni olishda xatolik");
  return res.json();
};

export const getAttemptAnalysis = async (attemptId) => {
  const res = await fetch(`${BASE_URL}/attempts/${attemptId}/analysis`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(res, "Tahlilni yuklashda xatolik");
};

export const deleteAttempt = async (id) => {
  const res = await fetch(`${BASE_URL}/attempts/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  return handleResponse(res, "Natijani o'chirishda xatolik");
};

// --- PROFILE ---
export const updateProfile = async (profileData) => {
  const res = await fetch(`${BASE_URL}/auth/profile`, {
    method: "PATCH",
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify(profileData),
  });
  return handleResponse(res, "Profilni yangilashda xatolik");
};

// --- SUPPORT MESSAGES ---
export const sendSupportMessage = async (data) => {
  const res = await fetch(`${BASE_URL}/support/send`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse(res, "Xabar yuborishda xatolik");
};

export const getAdminMessages = async () => {
  const res = await fetch(`${BASE_URL}/support/admin/messages`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(res, "Xabarlarni yuklashda xatolik");
};

export const markMessageAsRead = async (id) => {
  const res = await fetch(`${BASE_URL}/support/admin/messages/${id}/read`, {
    method: "PUT",
    headers: getAuthHeaders(),
  });
  return handleResponse(res, "Holatni yangilashda xatolik");
};

// --- MANUAL PAYMENTS ---
export const getPendingManualPayments = async () => {
  const res = await fetch(`${BASE_URL}/pay/manual/pending`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(res, "To'lovlar ro'yxatini yuklashda xatolik");
};

export const getMyManualPayments = async () => {
  const res = await fetch(`${BASE_URL}/pay/manual/my`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(res, "To'lovlarni olishda xatolik");
};

export const createManualPayment = async ({ test_id, amount, currency = "UZS", receipt_url = "", comment = "" }) => {
  const res = await fetch(`${BASE_URL}/pay/manual`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify({ test_id, amount, currency, receipt_url, comment })
  });
  return handleResponse(res, "To'lov so'rovi yaratishda xatolik");
};

export const uploadManualReceipt = async (id, receipt_url) => {
  const res = await fetch(`${BASE_URL}/pay/manual/${id}/receipt`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify({ receipt_url })
  });
  return handleResponse(res, "Chek yuborishda xatolik");
};

export const uploadManualReceiptFile = async (id, file) => {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${BASE_URL}/pay/manual/${id}/receipt/upload`, {
    method: "POST",
    headers: {
      ...getAuthHeaders(),
      // Multer/form-data uchun Content-Type avtomatik qo'yiladi
    },
    body: formData,
  });
  return handleResponse(res, "Chek faylini yuborishda xatolik");
};

export const approveManualPayment = async (id, comment = "") => {
  const res = await fetch(`${BASE_URL}/pay/manual/${id}/approve`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify({ comment }),
  });
  return handleResponse(res, "Tasdiqlashda xatolik");
};

export const rejectManualPayment = async (id, comment = "") => {
  const res = await fetch(`${BASE_URL}/pay/manual/${id}/reject`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify({ comment }),
  });
  return handleResponse(res, "Rad etishda xatolik");
};

export const buildReceiptUrl = (relativeUrl) => {
  if (!relativeUrl) return "";
  if (relativeUrl.startsWith("http")) return relativeUrl;
  const path = relativeUrl.startsWith("/") ? relativeUrl : `/${relativeUrl}`;
  return `${UPLOAD_ORIGIN}${path}`;
};