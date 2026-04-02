# 📋 Milliy Sertifikat — Master Task List

> **35 ta muammo** — xavfsizlik, buglar, arxitektura va yo'q xususiyatlar.
> Har bir vazifa bajarilganda `[x]` bilan belgilanadi.

---

## Phase 1 — 🔴 Security Fixes (Critical)

- [x] **T-01** — Revoke exposed Gemini API key, create `.env.example` with placeholders
- [x] **T-02** — Change JWT_SECRET to a strong random value in `.env`
- [x] **T-03** — Restrict CORS to frontend origin only (`app.js`)
- [x] **T-04** — Add auth middleware to AI parse-test endpoint (`ai.routes.js`)
- [x] **T-05** — Fix `user.service.js` to exclude password from SELECT
- [x] **T-06** — Add Payme secret key verification to callback endpoint
- [x] **T-07** — Protect admin routes on frontend with `ProtectedAdminRoute` (`App.js`)

---

## Phase 2 — 🟠 Bug Fixes (High Priority)

- [x] **T-08** — Fix axios.js baseURL from port 3000 → 4000 (or remove entirely)
- [x] **T-09** — Delete dead `adminApi.js` file
- [x] **T-10** — Fix `BASE_URL` declaration order in `api.js` (move to top)
- [x] **T-11** — Remove dead `evaluateAnswer()` function from `attempt.controller.js`
- [x] **T-12** — Remove dead `calculateThetaRasch()` and fix `saveReview()` broken query
- [x] **T-13** — Standardize question type naming (`multiple` / `open`) across codebase
- [x] **T-14** — Fix or remove `exam.controller.js` (references non-existent `exam_results` table)
- [x] **T-15** — Fix import order in `attempt.model.js`, `attempt.controller.js`, `attempt.service.js`
- [x] **T-16** — Remove duplicate AI logic — keep `ai.controller.js`, simplify `ai.routes.js`

---

## Phase 3 — 🟡 Architecture Refactoring

- [x] **T-17** — Extract Rasch formula to `server/src/utils/rasch.js` (remove 4x duplication)
- [x] **T-18** — Split `attempt.controller.js` into smaller focused files
- [x] **T-19** — Move direct `pool.query()` from controllers to models/services
- [x] **T-20** — Set up proper migration runner or document migration process
- [x] **T-21** — Add React `ErrorBoundary` component
- [x] **T-22** — Add proper loading states / skeleton screens to pages
- [x] **T-23** — Unify API client — remove axios, standardize on fetch wrappers
- [x] **T-24** — Add global CSS design system / base styles

---

## Phase 4 — 🔵 Missing Features

- [x] **T-25** — Add rate limiting (`express-rate-limit`) to auth and AI endpoints
- [x] **T-26** — Add pagination to list endpoints (attempts, tests, subjects)
- [x] **T-27** — Add password reset / forgot password flow
- [x] **T-28** — Add email verification on registration
- [x] **T-29** — Add test timer enforcement on backend (`started_at` / `expires_at`)
- [x] **T-30** — Add audit trail / structured logging (winston/pino)
- [x] **T-31** — Add attempt deletion endpoint (admin)
- [x] **T-32** — Add user profile update (name, email, password change)
- [x] **T-33** — Write unit tests (Jest) for services and utils
- [x] **T-34** — Add file upload endpoint for PDF test parsing
- [x] **T-35** — Add Docker setup for development and deployment

---

## Phase 5 — 🟣 Yangi Funksiyalar (v2)

### Global komponentlar
- [x] **T-36** — Toast notification tizimi (`ToastContext.jsx`) — barcha `alert()` lari almashtirildi
- [x] **T-37** — Dark mode tizimi (`ThemeContext.jsx`) — CSS variables, `localStorage` da saqlanadi

### Auth UX
- [x] **T-38** — Parol tiklash sahifasi (`ForgotPasswordPage.jsx`) — backend endpoint mavjud edi, UI yaratildi
- [x] **T-39** — Yangi parol o'rnatish sahifasi (`ResetPasswordPage.jsx`) — parol kuchi ko'rsatgichi, tasdiqlash
- [x] **T-40** — LoginPage "Unutdingizmi?" havolasini `/forgot-password` ga yo'naltirish

### Admin yaxshilash
- [x] **T-41** — Admin dashboard real statistika (`GET /api/admin/stats`) — DB dan haqiqiy raqamlar
- [x] **T-42** — Natijalarni CSV export (`GET /api/admin/export/results`) — Excel bilan mos BOM formati
- [x] **T-43** — Audit Log sahifasi (`AuditLogPage.jsx`) — admin harakatlar tarixi
- [x] **T-44** — Admin sidebar: Reyting va Audit Log navigatsiya linklari

### Foydalanuvchi UX
- [x] **T-45** — Leaderboard sahifasi (`LeaderboardPage.jsx`) — top natijalar, podium, daraja badges
- [x] **T-46** — Imtihon taymer vizual yaxshilash — progress bar, rang o'zgarishi, pulsatsiya
- [x] **T-47** — Imtihon yakunlash modali — `window.confirm()` o'rniga chiroyli modal
- [x] **T-48** — Profile tahrirlash modali — `prompt()` o'rniga inline form (ism, email, parol)

### Hali qolganlar
- [x] **T-49** — TestsPage qidiruv va filterlash (fan, nomi, saralash) + dark mode toggle
- [x] **T-50** — Ko'p urinish tarixi grafigi (ProfilePage da SVG chart)
- [x] **T-51** — 2FA (Email OTP — nodemailer orqali, 6-raqamli kod, 5 min)
- [x] **T-52** — Dark mode toggle tugmasi (DarkModeToggle component, TestsPage da mavjud)

---

## Phase 6 — 🧪 Algoritmik Baholash (AI o'rniga)

### Baholash mantiqi
- [x] **T-53** — `evaluator.js` moduli yaratish: Matematik, "Fuzzy text", va "Substring/Keyword" usullarini yozish.
- [x] **T-54** — `evaluationService.js` ni yangilab, eski AI chaqiruvidan voz kechish va `evaluator.js` ni o'rnatish.

---

## Phase 7 — 💎 Premium Profile Dashboard

### Foydalanuvchi Tajribasi (UX/UI)
- [x] **T-55** — Kichik statistika vidjetlari (Umumiy testlar, Eng yuqori ball, O'rtacha reyting) qo'shish.
- [x] **T-56** — Jonli yutuqlar (Achievements layblari) orqali statusni bildirish.
- [x] **T-57** — Natijalarni "Telegram'da ulashish" integratsiyasi (URL Share).
- [x] **T-58** — Yuqori natija uchun "Confetti" (Mushakbozlik) animatsiyasini ulab berish (`react-confetti`).
- [x] **T-59** — Shaxsiy QR kodni qulaylik uchun to'g'ridan-to'g'ri profil bannerida chiqarish.

---

## Progress Tracker

| 🔴 Security | 7 | 7 | ✅ Done |
| 🟠 Bug Fixes | 9 | 9 | ✅ Done |
| 🟡 Architecture | 8 | 8 | ✅ Done |
| 🔵 Features | 11 | 11 | ✅ Done |
| 🟣 Yangi v2 | 17 | 17 | ✅ Done |
| 🧪 Baholash Algoritmi | 2 | 2 | ✅ Done |
| 💎 Premium Profile | 5 | 5 | ✅ Done |
| 🛡️ Admin & Fixes | 5 | 5 | ✅ Done |
| **Total** | **64** | **64** | **100%** |

---

## Phase 8 — 🛡️ Yakuniy Xavfsizlik, Xatoliklarni Tuzatish va Admin Boshqaruvi
### Foydalanuvchi Interfeysi (UI) va Xatoliklar (Bug Fixes)
- [x] **T-60** — Google Auth jarayoni: `.env` da kalit yo'q bo'lsa sayt qotib qolishini oldini olib, `Interceptor` (qo'lga tushiruvchi) Toast Alert xabarnoma yozildi.
- [x] **T-61** — `ExamPage` dagi buzilgan rasmlarni (Google Drive) ko'rinishini sozlash uchun `crossOrigin` atributi o'chirildi va yuqori tezlikdagi `lh3` proksi tarmog'i joriy etildi.
- [x] **T-62** — `ExamPage` da "Qiyinchilik: 1" matni foydalanuvchini chalg'itmasligi uchun dizayndan olib tashlandi.

### Admin Boshqaruvini Kengaytirish (Admin Edit)
- [x] **T-63** — **Backend**: `GET /api/admin/tests/:testId/full` va `PUT /api/admin/tests/:testId` marshrutlari yaratilib, test savollarini individual xavfsiz Update/Delete qilish imkoni qo'shildi (Foreign Key himoyasi bilan).
- [x] **T-64** — **Frontend**: `AdminTestEditPage.jsx` yaratilib, test tuzilishi va savollar ro'yxatini to'liq matnli, parametrli darajada jonli ravishda (A/B/C) tahrirlash imkoniyati joriy etildi.

---

## Phase 9 — ⚡ Real-time AI + Guruh Rasch (Yangi Talab)
- [x] **R-01** — Status oqimini yangilash: `pending` → `waiting_ai` (submit paytida), AI tekshiruvdan so'ng `ready_for_rasch`, publishdan so'ng `published`; oraliqda `is_reviewed=false/true` ni moslashtirish.
- [x] **R-02** — BullMQ navbati: submit vaqtida attempt job ga tushadi; Redis ulanishi env orqali; worker ochiq savollarni Claude 3 Haiku yoki fallback evaluator bilan tekshiradi, `written_scores` + `score` yangilanadi, status `ready_for_rasch`.
- [x] **R-03** — Guruhli Rasch publish: Admin tugmasi `ready_for_rasch` larni olib, matritsa asosida item qiyinligi `b_i` ni smoothing bilan hisoblaydi, person `theta` ni logit(raw) + avg(b) orqali topadi, Z/T/standard_ball/level ni yangilab `published` holatiga o'tkazadi.
- [x] **R-04** — UI holatlari: Foydalanuvchi profilida "natijalar kutilmoqda" holatini `waiting_ai`/`ready_for_rasch` bo'yicha ko'rsatish; Admin panelida "Tekshirildi (AI)" belgilari va "Natijalarni hisoblash va e'lon qilish" tugmasi yangi oqimga bog'lash.
