# 🎨 Milliy Sertifikat — Frontend Hujjati

## 1. Umumiy Ma'lumot

- **Framework**: React 19.2.4 (Create React App)
- **Routing**: React Router DOM 7.13.2
- **API Client**: Fetch API (custom wrappers in `api/api.js`)
- **State Management**: React Context API (`AuthContext`, `ThemeContext`, `ToastContext`)
- **Port**: 3000 (development), proxy → `http://localhost:4000`

---

## 2. Sahifalar Ro'yxati va Routing

| Yo'l (Route)               | Komponent              | Himoya       | Tavsif                               |
|----------------------------|------------------------|--------------|---------------------------------------|
| `/`                        | LoginPage              | ❌           | Kirish sahifasi (default)             |
| `/login`                   | LoginPage              | ❌           | Kirish                                |
| `/register`                | RegisterPage           | ❌           | Ro'yxatdan o'tish                     |
| `/forgot-password`         | ForgotPasswordPage     | ❌           | Parolni tiklash (email yuborish)      |
| `/reset-password`          | ResetPasswordPage      | ❌           | Yangi parol o'rnatish (token)         |
| `/payment`                 | PaymentPage            | ✅ Protected | To'lov sahifasi                       |
| `/tests`                   | TestsPage              | ❌           | Testlar ro'yxati                      |
| `/test/:id`                | TestPage               | ❌           | Test tafsilotlari                     |
| `/profile`                 | ProfilePage            | ✅ Protected | Profil va natijalar                   |
| `/exam`                    | ExamPage               | ✅ Protected | Imtihon yechish                       |
| `/result`                  | ResultPage             | ❌           | Natija ko'rish                        |
| `/result-pending`          | ResultPendingPage      | ❌           | Natija kutilmoqda                     |
| `/verify/:testId`          | VerifyCertificate      | ❌           | Sertifikatni tekshirish (QR)          |
| `/leaderboard`             | LeaderboardPage        | ❌           | Reyting jadvali (top natijalar)       |
| `/admin`                   | AdminDashboard         | ✅ Admin     | Admin boshqaruv paneli                |
| `/admin-login`             | AdminLoginPage         | ❌           | Admin kirish                          |
| `/admin-create`            | AdminCreatePage        | ✅ Admin     | Fan/Test yaratish                     |
| `/admin-test-create`       | AdminTestCreatePage    | ✅ Admin     | AI bilan test yaratish                |
| `/admin/results`           | ResultsPage            | ✅ Admin     | Natijalar boshqaruvi                  |
| `/admin/audit-log`         | AuditLogPage           | ✅ Admin     | Admin harakatlar tarixi               |
| `/otp`                     | OtpPage                | ❌           | 2FA OTP kodni kiritish                |

> Admin sahifalari `ProtectedAdminRoute` komponenti orqali himoyalangan.

---

## 3. Autentifikatsiya Tizimi

### AuthContext (`context/AuthContext.js`)

```javascript
// Context qiymatlari:
{
  user,       // Foydalanuvchi obyekti (null agar kirmagan)
  setUser,    // Foydalanuvchini o'rnatish
  login,      // Login funksiyasi (localStorage + state)
  logout,     // Logout funksiyasi
  loading     // Yuklanish holati
}
```

### Token Boshqaruvi
- **Saqlash**: `localStorage` (`token`, `user`, `userId`)
- **Format**: `Bearer <jwt_token>`
- **Muddati**: 24 soat (server tomonida belgilangan)
- **Yuborish**: `Authorization` header orqali

### Protected Route Komponenti
```jsx
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div>Yuklanmoqda...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}
```

### ThemeContext (`context/ThemeContext.jsx`)
```javascript
// Dark/Light mode boshqaruvi
{
  dark,     // Boolean: qorong'u rejim yoqilganmi
  toggle    // Funksiya: rejimni almashtirish
}
// data-theme="dark" HTML atributi o'rnatiladi
// localStorage('theme') da saqlanadi
```

### ToastContext (`context/ToastContext.jsx`)
```javascript
// Global notification tizimi
toast.success("Muvaffaqiyatli!")   // Yashil
toast.error("Xatolik yuz berdi")   // Qizil
toast.warning("Diqqat!")           // Sariq
toast.info("Ma'lumot")             // Ko'k
// Pastki o'ng burchakda animatsiyali xabar
// 3.5s (yoki 5s error uchun) dan so'ng avtomatik yo'qoladi
```

---

## 4. API Qatlami (`src/api/`)

### `api.js` — Asosiy API Funksiyalari

| Funksiya                  | HTTP Method | Endpoint                    | Tavsif                          |
|---------------------------|-------------|-----------------------------|---------------------------------|
| `register()`              | POST        | `/api/auth/register`        | Ro'yxatdan o'tish               |
| `login()`                 | POST        | `/api/auth/login`           | Kirish                          |
| `adminLogin()`            | POST        | `/api/admin/login`          | Admin kirish                    |
| `getSubjects()`           | GET         | `/api/subjects`             | Fanlar ro'yxati                 |
| `deleteSubject(id)`       | DELETE      | `/api/subjects/:id`         | Fan o'chirish                   |
| `getTests(subjectId?)`    | GET         | `/api/tests`                | Testlar ro'yxati                |
| `deleteTest(id)`          | DELETE      | `/api/tests/:id`            | Test o'chirish                  |
| `createTestWithQuestions()`| POST       | `/api/tests`                | Test + savollar yaratish        |
| `getQuestions(testId)`    | GET         | `/api/questions/:testId`    | Test savollari                  |
| `sendAttempt(data)`       | POST        | `/api/attempts`             | Javoblarni yuborish             |
| `getUserAttempts(userId)` | GET         | `/api/attempts/user/:userId`| Foydalanuvchi natijalari        |

### `axios.js` — Axios Instance
```javascript
// Base URL konfiguratsiyasi va interceptor'lar
// Authorization header avtomatik qo'shiladi
```

### Yordamchi Funksiyalar
```javascript
// handleResponse(res, defaultMsg) — Server javobini qayta ishlash
// getAuthHeaders() — Token bilan Authorization header tayyorlash
```

---

## 5. Sahifalar Tafsiloti

### 🔐 LoginPage.jsx (12,093 bayt)
- Email + parol orqali kirish
- Muvaffaqiyatli kirganda `AuthContext.login()` chaqiriladi
- Token `localStorage`-ga saqlanadi
- Foydalanuvchi `/profile` sahifasiga yo'naltiriladi

### 📝 RegisterPage.jsx (2,824 bayt)
- Ism, email, parol bilan ro'yxatdan o'tish
- Muvaffaqiyatli ro'yxatdan so'ng login sahifasiga yo'naltirish

### 👤 ProfilePage.jsx (18,991 bayt — eng katta sahifa)
- Foydalanuvchi ma'lumotlari
- Test natijalari ro'yxati (attempts)
- Sertifikat ko'rish va yuklab olish
- QR kod generatsiya (qrcode.react)
- PDF sertifikat generatsiya (jsPDF + html2canvas)

### 📋 TestsPage.jsx (3,881 bayt)
- Barcha testlar ro'yxati (fanlar bo'yicha filtrlash)
- Test tanlash va tafsilotlarga o'tish

### 📄 TestPage.jsx (5,427 bayt)
- Tanlangan test tafsilotlari
- To'lov sahifasiga o'tish tugmasi

### ✏️ ExamPage.jsx (10,862 bayt)
- Test savollari ko'rsatiladi
- Yopiq savollar: A, B, C, D variant tanlash
- Ochiq savollar: Matn kiritish maydoni
- Vaqt cheklovi (agar mavjud)
- Javoblarni yuborish (`sendAttempt()`)

### 💳 PaymentPage.jsx (8,538 bayt)
- Payme orqali to'lov
- To'lov holati kuzatuvi
- Muvaffaqiyatli to'lovdan so'ng imtihonga o'tish

### 📊 ResultPage.jsx (7,646 bayt)
- Natijalar ko'rsatiladi: ball, daraja (level), theta, z-score, t-score
- Standard ball va sertifikat holati

### ⏳ ResultPendingPage.jsx (1,448 bayt)
- Natija hali e'lon qilinmagan holati
- "Kutilmoqda..." xabari

### 🏆 ResultsPage.jsx (4,715 bayt)
- Admin: Barcha natijalar ro'yxati
- Filtr va qidiruv imkoniyati

### ✅ VerifyCertificate.jsx (796 bayt)
- QR kod orqali sertifikatni tekshirish
- Test ID bo'yicha natijani ko'rsatish

### 🛡️ AdminDashboard.jsx
- Admin boshqaruv paneli
- **Real statistika** API dan yuklanadi (foydalanuvchilar, urinishlar, o'rtacha ball)
- **CSV Export** tugmasi — natijalarni yuklab olish
- Fanlar, testlar boshqaruvi
- Sidebar: Dashboard, Yangi Test, Natijalar, **Reyting**, **Audit Log** linklari

### 🔑 ForgotPasswordPage.jsx
- Email kiritish formasi
- Muvaffaqiyatli yuborilgandan so'ng tasdiqlash holati

### 🔐 ResetPasswordPage.jsx
- URL query param dan token olinadi
- Parol kuchi ko'rsatgichi (zaif/o'rtacha/kuchli)
- Parol tasdiqlash maydoni (real-time mos kelish tekshiruvi)

### 🏆 LeaderboardPage.jsx
- Qorong'u tema dizayn
- Top-3 podium (oltin/kumush/bronza)
- Animatsiyali jadval, daraja badges (A+, A, B+...)
- Qidiruv (ism yoki fan bo'yicha filtrlash)

### 📋 AuditLogPage.jsx
- Admin harakatlar tarixi (audit_logs jadvalidan)
- Pagination bilan (sahifada 30 ta)
- Harakat turi bo'yicha ikonlar
- Jadval mavjud bo'lmasa graceful empty state

### ➕ AdminCreatePage.jsx (11,015 bayt)
- Yangi fan yaratish
- Mavjud fanlarni boshqarish

### 🤖 AdminTestCreatePage.jsx (16,508 bayt — 2-eng katta)
- PDF/matn yuklash
- AI (Gemini) orqali savollarni avtomatik ajratish
- Savollarni ko'rib chiqish va tahrirlash
- Test + savollarni bazaga saqlash

### 📝 AdminReviewPage.jsx (6,703 bayt)
- Yozma javoblarni ko'rib chiqish
- Ball qo'yish (0, 0.5, 1)
- Natijani saqlash va e'lon qilish

### 📈 ResultsManagement.jsx (2,466 bayt)
- Natijalar boshqaruvi
- E'lon qilish (publish) funksionali

---

## 6. Kalit Komponentlar Oqimi

### Foydalanuvchi Oqimi (User Flow)
```
Login → Tests → Test Detail → Payment → Exam → Result
  ↕                                              ↓
Register                                    Profile (Sertifikat)
```

### Admin Oqimi (Admin Flow)
```
Admin Login → Dashboard → Create Subject → Create Test (AI)
                ↓
         Review Results → Evaluate (AI/Manual) → Publish
```

---

## 7. Sertifikat Generatsiya

### Texnologiyalar
- **html2canvas**: DOM elementni rasm sifatida olish
- **jsPDF**: PDF faylga eksport qilish
- **QRCode.react**: Sertifikat tasdiqlash QR kodi

### QR Kod Tarkibi
```
URL: /verify/{testId}
→ Sertifikat haqiqiyligini onlayn tekshirish
```

---

## 8. Muhim Eslatmalar

> ✅ **Admin sahifalari** `ProtectedAdminRoute` bilan himoyalangan.

> ✅ **Error handling** toast notification tizimiga o'tkazildi — barcha `alert()` olib tashlandi.

> ✅ **`window.confirm()`** ExamPage da custom modal bilan almashtirildi.

> ⚠️ **BASE_URL** `api.js` faylida hardcode qilingan: `http://localhost:4000/api`
> Production uchun muhit o'zgaruvchisiga o'tkazish kerak.
