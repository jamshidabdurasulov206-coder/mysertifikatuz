# 🏗️ Milliy Sertifikat — Arxitektura (Architecture)

## 1. Umumiy Ko'rinish (System Overview)

**Milliy Sertifikat** — bu onlayn sertifikatlash platformasi bo'lib, foydalanuvchilarga turli fanlar bo'yicha testlarni yechish, AI orqali avtomatik baholash, Rasch (IRT) modeli asosida statistik tahlil qilish va sertifikat olish imkoniyatini beradi.

```
┌─────────────────────────────────────────────────────────────┐
│                     MILLIY SERTIFIKAT                        │
│                                                             │
│  ┌──────────────┐     ┌──────────────┐     ┌─────────────┐ │
│  │   Frontend    │────▶│   Backend    │────▶│  PostgreSQL  │ │
│  │  (React 19)   │◀────│ (Express 5)  │◀────│   Database   │ │
│  └──────────────┘     └──────┬───────┘     └─────────────┘ │
│                              │                              │
│                    ┌─────────┴──────────┐                   │
│                    │                    │                    │
│              ┌─────▼─────┐      ┌──────▼──────┐            │
│              │ Google AI  │      │    Payme     │            │
│              │ (Gemini)   │      │  (To'lovlar) │            │
│              └───────────┘      └─────────────┘            │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Texnologiyalar (Tech Stack)

### Frontend
| Texnologiya       | Versiya  | Vazifasi                              |
|-------------------|----------|---------------------------------------|
| React             | 19.2.4   | UI framework                          |
| React Router DOM  | 7.13.2   | Client-side routing                   |
| Axios             | 1.14.0   | HTTP so'rovlar                        |
| html2canvas       | 1.4.1    | Sertifikat screenshot                 |
| jsPDF             | 4.2.1    | PDF generatsiya                       |
| QRCode.react      | 4.2.0    | QR kod generatsiya                    |
| pdfjs-dist        | 5.4.624  | PDF fayllarni o'qish                  |

### Backend
| Texnologiya             | Versiya  | Vazifasi                          |
|-------------------------|----------|-----------------------------------|
| Express                 | 5.2.1    | Web framework                     |
| PostgreSQL (pg)         | 8.20.0   | Ma'lumotlar bazasi drayveri       |
| bcrypt                  | 6.0.0    | Parol hashlash                    |
| jsonwebtoken (JWT)      | 9.0.3    | Autentifikatsiya tokenlari        |
| @google/generative-ai   | 0.24.1   | Gemini AI integratsiyasi          |
| cors                    | 2.8.6    | Cross-Origin so'rovlar            |
| dotenv                  | 17.3.1   | Muhit o'zgaruvchilari             |
| qrcode                  | 1.5.4    | QR kod server-side                |

---

## 3. Loyiha Tuzilishi (Project Structure)

```
Milliysertifikat/
├── frontend/                   # React SPA
│   ├── public/                 # Statik fayllar
│   ├── src/
│   │   ├── api/                # API qatlami
│   │   │   ├── api.js          # Asosiy API funksiyalari
│   │   │   ├── adminApi.js     # Admin API
│   │   │   └── axios.js        # Axios instance config
│   │   ├── context/
│   │   │   └── AuthContext.js  # Autentifikatsiya konteksti
│   │   ├── pages/              # Sahifalar (17 ta)
│   │   │   ├── LoginPage.jsx
│   │   │   ├── RegisterPage.jsx
│   │   │   ├── ProfilePage.jsx
│   │   │   ├── TestsPage.jsx
│   │   │   ├── TestPage.jsx
│   │   │   ├── ExamPage.jsx
│   │   │   ├── ResultPage.jsx
│   │   │   ├── ResultsPage.jsx
│   │   │   ├── ResultPendingPage.jsx
│   │   │   ├── PaymentPage.jsx
│   │   │   ├── VerifyCertificate.jsx
│   │   │   ├── AdminLoginPage.jsx
│   │   │   ├── AdminDashboard.jsx
│   │   │   ├── AdminCreatePage.jsx
│   │   │   ├── AdminTestCreatePage.jsx
│   │   │   ├── AdminReviewPage.jsx
│   │   │   └── ResultsManagement.jsx
│   │   ├── App.js              # Router va asosiy layout
│   │   └── index.js            # Entry point
│   └── package.json
│
├── server/                     # Express API
│   ├── migrations/             # SQL migratsiyalar
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js           # PostgreSQL Pool config
│   │   ├── controllers/        # Route handler'lar
│   │   │   ├── admin.controller.js
│   │   │   ├── ai.controller.js
│   │   │   ├── attempt.controller.js  # Eng katta (582 satr)
│   │   │   ├── auth.controller.js
│   │   │   ├── exam.controller.js
│   │   │   ├── payme.controller.js
│   │   │   ├── question.controller.js
│   │   │   ├── subject.controller.js
│   │   │   └── test.controller.js
│   │   ├── middlewares/
│   │   │   ├── auth.middleware.js      # JWT tekshirish
│   │   │   └── isAdmin.middleware.js   # Admin roli tekshirish
│   │   ├── models/             # DB query funksiyalari
│   │   │   ├── attempt.model.js
│   │   │   ├── question.model.js
│   │   │   ├── subject.model.js
│   │   │   └── test.model.js
│   │   ├── routes/             # Express router'lar
│   │   │   ├── admin.routes.js
│   │   │   ├── ai.routes.js
│   │   │   ├── attempt.routes.js
│   │   │   ├── auth.routes.js
│   │   │   ├── exam.routes.js
│   │   │   ├── payme.routes.js
│   │   │   ├── question.routes.js
│   │   │   ├── subject.routes.js
│   │   │   └── test.routes.js
│   │   ├── services/           # Biznes logika
│   │   │   ├── attempt.service.js
│   │   │   ├── auth.service.js
│   │   │   ├── evaluationService.js   # AI baholash (Gemini)
│   │   │   ├── question.service.js
│   │   │   ├── subject.service.js
│   │   │   ├── test.service.js
│   │   │   └── user.service.js
│   │   ├── utils/              # (Bo'sh — kengaytirish uchun)
│   │   ├── app.js              # Express app config
│   │   └── server.js           # Server ishga tushirish
│   ├── .env                    # Muhit o'zgaruvchilari
│   └── package.json
│
├── docs/                       # Hujjatlar
├── .github/                    # GitHub agent config
├── .gitignore
└── README.md
```

---

## 4. Ma'lumotlar Bazasi Sxemasi (Database Schema)

### `users` jadvali
| Ustun      | Turi         | Tavsif                        |
|------------|--------------|-------------------------------|
| id         | SERIAL PK    | Avtomatik ID                  |
| username   | VARCHAR      | Foydalanuvchi ismi             |
| email      | VARCHAR      | Email (unique)                |
| password   | VARCHAR      | Hashlangan parol (bcrypt)     |
| role       | VARCHAR      | `user` yoki `admin`           |

### `subjects` jadvali
| Ustun  | Turi       | Tavsif          |
|--------|------------|-----------------|
| id     | SERIAL PK  | Avtomatik ID    |
| name   | VARCHAR    | Fan nomi        |

### `tests` jadvali
| Ustun       | Turi       | Tavsif                    |
|-------------|------------|---------------------------|
| id          | SERIAL PK  | Avtomatik ID              |
| title       | VARCHAR    | Test nomi                 |
| description | TEXT       | Test tavsifi              |
| subject_id  | INTEGER FK | Fan ID (→ subjects.id)    |
| price       | INTEGER    | Narx (so'mda)             |

### `questions` jadvali
| Ustun               | Turi       | Tavsif                                |
|---------------------|------------|---------------------------------------|
| id                  | SERIAL PK  | Avtomatik ID                          |
| test_id             | INTEGER FK | Test ID (→ tests.id)                  |
| question_text       | TEXT       | Savol matni                           |
| type                | VARCHAR    | `MULTIPLE_CHOICE` / `OPEN_ENDED`      |
| options             | JSONB      | Javob variantlari massivi             |
| correct_option      | INTEGER    | To'g'ri variant indeksi               |
| correct_answer_text | TEXT       | Ochiq savol uchun to'g'ri javob       |
| difficulty_level    | NUMERIC    | Qiyinlik darajasi (0.1 - 3.0)        |

### `attempts` jadvali
| Ustun             | Turi       | Tavsif                              |
|-------------------|------------|-------------------------------------|
| id                | SERIAL PK  | Avtomatik ID                        |
| user_id           | INTEGER FK | Foydalanuvchi ID (→ users.id)       |
| test_id           | INTEGER FK | Test ID (→ tests.id)                |
| subject_name      | VARCHAR    | Fan nomi (denormalized)             |
| answers           | JSONB      | Foydalanuvchi javoblari             |
| score             | INTEGER    | Dastlabki ball                      |
| written_scores    | JSONB      | Yozma javob ballari (AI/Admin)      |
| is_reviewed       | BOOLEAN    | AI/Admin baholaganmi?               |
| is_published      | BOOLEAN    | Natija e'lon qilinganmi?            |
| final_score       | INTEGER    | Yakuniy ball (0-100)                |
| final_theta_score | NUMERIC    | Rasch theta qiymati                 |
| z_score           | NUMERIC    | Z-ball (standart normal)            |
| t_score           | NUMERIC    | T-ball (o'rtacha=50, std=10)        |
| standard_ball     | NUMERIC    | Standart ball (maxBall ga nisbatan) |
| level             | VARCHAR(10)| Daraja: A+, A, B+, B, C+, C, D     |
| created_at        | TIMESTAMP  | Yaratilgan vaqt                     |

### `orders` jadvali (Payme integratsiyasi)
| Ustun          | Turi       | Tavsif                          |
|----------------|------------|---------------------------------|
| id             | SERIAL PK  | Avtomatik ID                    |
| user_id        | INTEGER FK | Foydalanuvchi ID                |
| test_id        | INTEGER FK | Test ID                         |
| transaction_id | VARCHAR    | Payme tranzaksiya ID            |
| payme_time     | BIGINT     | Payme vaqti                     |
| state          | INTEGER    | 0=kutilmoqda, 1=yaratildi, 2=bajarildi, -1=bekor |
| cancel_time    | BIGINT     | Bekor qilish vaqti              |
| reason         | INTEGER    | Bekor qilish sababi             |

---

## 5. API Arxitekturasi

Barcha API endpointlar `/api` prefiksi bilan boshlanadi. Server port: **4000**.

### Autentifikatsiya oqimi
```
Foydalanuvchi → POST /api/auth/register → JWT token
Foydalanuvchi → POST /api/auth/login    → JWT token
Admin         → POST /api/admin/login   → JWT token (role: admin)
```

### Himoya qatlamlari
```
Ochiq endpointlar → Hech qanday middleware yo'q
Foydalanuvchi     → auth.middleware.js (JWT tekshirish)
Admin             → auth.middleware.js + isAdmin.middleware.js
```

---

## 6. Asosiy Ma'lumotlar Oqimi (Data Flow)

### Test Yaratish (Admin)
```
Admin → PDF/Matn yuborish → AI (Gemini) tahlil qiladi
     → Savollar generatsiya → Admin ko'rib chiqadi
     → Test + Savollar bazaga saqlanadi
```

### Imtihon Topshirish (Foydalanuvchi)
```
Foydalanuvchi → To'lov (Payme) → Test yechish (ExamPage)
             → Javoblar yuboriladi (POST /api/attempts)
             → Yopiq savollar: Avtomatik tekshirish
             → Ochiq savollar: AI (Gemini) baholash
             → Rasch modeli: theta, z-score, t-score hisoblash
             → Natija saqlanadi (is_reviewed = true)
```

### Natija E'lon Qilish (Admin)
```
Admin → Tekshirilgan natijalarni ko'rish
     → "Publish" → is_published = true
     → Foydalanuvchi natijani ko'rishi mumkin
     → Sertifikat + QR kod generatsiya
```

---

## 7. AI va Rasch Modeli

### AI Baholash (evaluationService.js)
- **Model**: Google Gemini (`gemini-3.1-flash-lite-preview`)
- **Vazifa**: Ochiq yozma javoblarni etalon javob bilan solishtirish
- **Baholash**: Har bir javobga 0 yoki 1 ball (dichotomous)
- **Format**: Barcha javoblar bitta so'rovda yuboriladi (batch evaluation)

### Rasch (IRT) Hisoblash Formulalari
```
P = totalScore / maxScore    (0.01 ≤ P ≤ 0.99)
θ (theta) = ln(P / (1 - P))  (logit)

μ = barcha θ larning o'rtachasi
σ = standart chetlanish

Z-score = (θ - μ) / σ
T-score = 50 + 10 × Z-score

Standard ball = 100-lik shkala (0..100)
  T ≥ 65 bo'lsa 100
  T < 46 bo'lsa 0
  Aks holda: round((T / 65) × 100)

Level:
  T ≥ 70 → A+    T ≥ 65 → A    T ≥ 60 → B+
  T ≥ 55 → B     T ≥ 50 → C+   T ≥ 46 → C    T < 46 → FAIL
```

---

## 8. Xavfsizlik

| Vosita            | Vazifasi                                      |
|-------------------|-----------------------------------------------|
| bcrypt            | Parollarni hashlash (salt rounds: 10)         |
| JWT               | Sessiya menejment (24 soat muddatli token)    |
| isAdmin middleware| Admin roli tekshirish                         |
| CORS              | Cross-Origin himoya                           |
| ProtectedRoute    | Frontend-da autentifikatsiya tekshirish       |

---

## 9. Uchinchi Tomon Integratsiyalar

### Payme (To'lov tizimi)
- Callback URL: `POST /api/payme/callback`
- Tranzaksiya holatlari: `0` → `1` → `2` (yoki `-1` bekor)
- Summalar **tiyin** (1 so'm = 100 tiyin) formatida

### Google Gemini AI
- Test savollarini matndan ajratib olish (`/api/ai/parse-test`)
- Ochiq javoblarni avtomatik baholash (`evaluationService.js`)
- Fallback modellar qo'llab-quvvatlanadi

---

## 10. Konfiguratsiya (.env)

```env
PORT=4000
NODE_ENV=development
JWT_SECRET=<secret>
DB_USER=<user>
DB_PASSWORD=<password>
DB_NAME=<database>
DB_HOST=localhost
DB_PORT=5432
GEMINI_API_KEY=<api_key>
GEMINI_MODEL=gemini-3.1-flash-lite-preview
PAYME_MERCHANT_ID=<merchant_id>
PAYME_SECRET_KEY=<secret_key>
```

---

## 11. Ishga Tushirish

```bash
# Backend
cd server
npm install
npm run dev          # nodemon bilan (development)
npm start            # production

# Frontend
cd frontend
npm install
npm start            # development (port 3000, proxy → 4000)
npm run build        # production build
```
