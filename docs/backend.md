# ⚙️ Milliy Sertifikat — Backend Hujjati

## 1. Umumiy Ma'lumot

- **Framework**: Express 5.2.1
- **Database**: PostgreSQL (pg 8.20.0)
- **Auth**: JWT (jsonwebtoken) + bcrypt
- **AI**: Google Generative AI (Gemini)
- **Payment**: Payme integratsiyasi
- **Port**: 4000 (default)

---

## 2. API Endpointlar (Barcha Yo'nalishlar)

### 🔐 Auth (`/api/auth`)
| Method | Endpoint                   | Middleware | Tavsif                         |
|--------|----------------------------|------------|--------------------------------|
| POST   | `/api/auth/register`       | —          | Yangi foydalanuvchi ro'yxat    |
| POST   | `/api/auth/login`          | —          | Foydalanuvchi kirish           |
| GET    | `/api/auth/me`             | auth       | Joriy foydalanuvchi ma'lumoti  |
| PATCH  | `/api/auth/profile`        | auth       | Profilni yangilash (ism/email/parol) |
| POST   | `/api/auth/verify-email`   | —          | Email tasdiqlash               |
| POST   | `/api/auth/forgot-password`| —          | Parol tiklash havolasi yuborish|
| POST   | `/api/auth/reset-password` | —          | Yangi parol o'rnatish          |
| POST   | `/api/auth/send-otp`       | —          | 2FA OTP kodni emailga yuborish |
| POST   | `/api/auth/verify-otp`     | —          | OTP kodni tekshirish va JWT    |

### 🛡️ Admin (`/api/admin`)
| Method | Endpoint                       | Middleware          | Tavsif                              |
|--------|--------------------------------|---------------------|-------------------------------------|
| POST   | `/api/admin/login`             | —                   | Admin kirish                        |
| POST   | `/api/admin/publish-test/:id`  | auth + isAdmin      | Test natijalarini e'lon qilish      |
| GET    | `/api/admin/stats`             | auth + isAdmin      | Dashboard statistikasi (real DB)    |
| GET    | `/api/admin/export/results`    | auth + isAdmin      | Natijalarni CSV ga eksport          |
| GET    | `/api/admin/leaderboard`       | —                   | Top natijalar reytingi (public)     |
| GET    | `/api/admin/audit-logs`        | auth + isAdmin      | Admin harakatlar tarixi             |

### 📚 Subjects — Fanlar (`/api/subjects`)
| Method | Endpoint              | Middleware          | Tavsif              |
|--------|-----------------------|---------------------|---------------------|
| GET    | `/api/subjects`       | —                   | Barcha fanlar       |
| POST   | `/api/subjects`       | auth + isAdmin      | Yangi fan yaratish  |
| DELETE | `/api/subjects/:id`   | auth + isAdmin      | Fan o'chirish       |

### 📝 Tests — Testlar (`/api/tests`)
| Method | Endpoint              | Middleware          | Tavsif                      |
|--------|-----------------------|---------------------|-----------------------------|
| GET    | `/api/tests`          | —                   | Barcha testlar              |
| GET    | `/api/tests?subject_id=X` | —              | Fan bo'yicha testlar        |
| POST   | `/api/tests`          | auth + isAdmin      | Test + savollar yaratish    |
| DELETE | `/api/tests/:id`      | auth + isAdmin      | Test o'chirish              |

### ❓ Questions — Savollar (`/api/questions`)
| Method | Endpoint                  | Middleware | Tavsif              |
|--------|---------------------------|------------|---------------------|
| GET    | `/api/questions/:testId`  | —          | Test savollari      |

### 📊 Attempts — Urinishlar (`/api/attempts`)
| Method | Endpoint                          | Middleware          | Tavsif                          |
|--------|-----------------------------------|---------------------|---------------------------------|
| POST   | `/api/attempts`                   | auth                | Javoblarni yuborish             |
| GET    | `/api/attempts/user-tests`        | auth                | O'z natijalari                  |
| GET    | `/api/attempts/user/:userId`      | auth                | Foydalanuvchi natijalari        |
| GET    | `/api/attempts/:testId`           | auth                | Test bo'yicha natijalar         |
| GET    | `/api/attempts/all-user-tests`    | auth + isAdmin      | Barcha natijalar (admin)        |
| GET    | `/api/attempts/unreviewed`        | isAdmin             | Tekshirilmagan natijalar        |
| GET    | `/api/attempts/theta-stats`       | auth + isAdmin      | Rasch statistikasi (μ, σ)       |
| POST   | `/api/attempts/:id/auto-evaluate` | auth + isAdmin      | AI avtomatik baholash           |
| POST   | `/api/attempts/review`            | isAdmin             | Admin baholash                  |
| PATCH  | `/api/attempts/:id/save-review`   | auth + isAdmin      | Baholashni saqlash              |
| POST   | `/api/attempts/publish-all`       | auth + isAdmin      | Barcha natijalarni e'lon qilish |
| POST   | `/api/attempts/publish`           | auth                | Natijalarni e'lon qilish        |
| POST   | `/api/attempts/:id/publish`       | auth + isAdmin      | Bitta natijani e'lon qilish     |

### 🤖 AI (`/api/ai`)
| Method | Endpoint              | Middleware | Tavsif                              |
|--------|-----------------------|------------|-------------------------------------|
| POST   | `/api/ai/parse-test`  | —          | Matndan test savollarini ajratish   |

### 📝 Exams (`/api/exams`)
| Method | Endpoint              | Middleware | Tavsif              |
|--------|-----------------------|------------|---------------------|
| GET    | `/api/exams`          | —          | Imtihonlar ro'yxati |

### 💳 Payme (`/api/payme`)
| Method | Endpoint                | Middleware | Tavsif                |
|--------|-------------------------|------------|-----------------------|
| POST   | `/api/payme/callback`   | —          | Payme webhook callback|

---

## 3. Controllerlar Tafsiloti

### `attempt.controller.js` (582 satr — eng katta)

Bu controller loyihaning yadrosi hisoblanadi. Asosiy funksiyalar:

#### `createAttempt(req, res)`
- Foydalanuvchi javoblarini qabul qiladi
- `attempts` jadvaliga yozadi
- **Avtomatik AI baholashni ishga tushiradi** (`autoEvaluateAttempt`)

#### `autoEvaluateAttempt(req, res)`
Eng murakkab funksiya:
1. Attempt va savollarni bazadan oladi
2. Yopiq savollarni avtomatik tekshiradi (correct_option solishtirish)
3. Ochiq savollarni AI (Gemini) orqali baholaydi (`evaluationService.checkAllAnswers`)
4. **Rasch modeli** bo'yicha hisoblaydi:
   - `theta = ln(P / (1-P))` — logit qiymat
   - `z_score = (theta - μ) / σ` — normallashtirilgan ball
   - `t_score = 50 + 10 × z_score` — T-ball
   - `standard_ball` — Fan bo'yicha standart ball
   - `level` — Daraja (A+ dan D gacha)
5. Natijalarni `attempts` jadvaliga saqlaydi

#### `getAllUserAttempts(req, res)`
- Barcha foydalanuvchilarning natijalarini JOIN bilan oladi
- `written_scores` JSON string → obyektga aylantiradi

#### `publishResult(req, res)`
- Tekshirilgan, lekin e'lon qilinmagan natijalarni topadi
- Har biri uchun z/t/standard ball va level qayta hisoblaydi
- `is_published = true` qiladi

#### `reviewAttempt(req, res)`
- Admin tomonidan qo'lda ball qo'yish
- Test ball + yozma ballni yig'adi
- Natijani darhol e'lon qiladi

#### `saveReview(req, res)`
- Admin baholashni saqlaydi (e'lon qilmaydi)
- Rasch theta qayta hisoblaydi

---

### `ai.controller.js` (74 satr)

#### `parseTest(req, res)`
- Matndan test savollarini AI orqali ajratish
- Katta matnlarni 7000 belgilik bo'laklarga bo'ladi
- Har bir bo'lak uchun Gemini-ga prompt yuboradi
- Natijalar: `MULTIPLE_CHOICE` va `OPEN_ENDED` turidagi savollar

---

### `payme.controller.js` (78 satr)

#### `paymeCallback(req, res)`
Payme to'lov tizimi callback'lari:

| Method                   | Vazifasi                              |
|--------------------------|---------------------------------------|
| `CheckPerformTransaction`| To'lov imkonini tekshirish            |
| `CreateTransaction`      | Tranzaksiya yaratish                  |
| `PerformTransaction`     | To'lovni amalga oshirish              |
| `CancelTransaction`      | To'lovni bekor qilish                 |

---

### `auth.controller.js` (1,225 bayt)
- Register va Login controller wrappers
- `auth.service.js`-ga delegatsiya qiladi

### `test.controller.js` (3,591 bayt)
- Test CRUD operatsiyalari
- Test + savollarni birgalikda yaratish

### `question.controller.js` (2,158 bayt)
- Savol CRUD
- Test bo'yicha savollarni olish

### `subject.controller.js` (727 bayt)
- Fan CRUD operatsiyalari

### `exam.controller.js` (3,373 bayt)
- Imtihon boshqaruvi

### `admin.controller.js`
- Admin login (hardcoded credentials — production uchun DB dan o'qish kerak)
- `getStats()` — Dashboard statistikasi (users, tests, attempts, avg score, bugungi urinishlar)
- `exportResults()` — Barcha natijalarni CSV formatda eksport (BOM + UTF-8)
- `getLeaderboard()` — Top natijalar (public, is_published = true)
- `getAuditLogs()` — Audit log jadvalidan yozuvlar (pagination bilan)

---

## 4. Servislar (Business Logic)

### `auth.service.js`
```javascript
register(userData)
  → Email borligini tekshirish
  → Parolni bcrypt bilan hashlash (10 rounds)
  → Users jadvaliga yozish
  → { id, username, email, role } qaytarish

login({ email, password })
  → Email bo'yicha foydalanuvchi topish
  → bcrypt.compare bilan solishtirish
  → JWT token yaratish (24h, { id, email, role })
  → { token, id, name, email, role } qaytarish
```

### `evaluationService.js`
```javascript
checkAllAnswers(answersArray)
  → Barcha ochiq javoblarni bitta prompt'ga yig'ish
  → Gemini AI'ga yuborish
  → Natija: { "savol_id": 0/0.5/1, ... }
```

### `attempt.service.js`
```javascript
createAttempt({ user_id, test_id, subject_name, answers, score })
  → attempts jadvaliga INSERT
  → is_reviewed: false, is_published: false

getAttemptsByTest(test_id)
  → Test bo'yicha barcha urinishlar

getAttemptsByUser(user_id)
  → Foydalanuvchi bo'yicha barcha urinishlar
```

### `question.service.js`
- Savol yaratish va olish operatsiyalari

### `test.service.js`
- Test CRUD operatsiyalari

### `subject.service.js`
- Fan CRUD operatsiyalari

### `user.service.js`
- Foydalanuvchi ma'lumotlari

---

## 5. Middleware'lar

### `auth.middleware.js`
```javascript
// JWT tokenni tekshirish
1. req.headers.authorization → token olish
2. "Bearer " prefiksini olib tashlash
3. jwt.verify(token, JWT_SECRET) → decoded
4. req.user = decoded → keyingi middleware'ga o'tish
// Xato bo'lsa: 401 { message: "Invalid or expired token" }
```

### `isAdmin.middleware.js`
```javascript
// Admin rolini tekshirish (auth.middleware dan keyin ishlaydi)
1. req.user.role === 'admin' tekshirish
2. Ha → next()
3. Yo'q → 403 { message: "Admin rights required" }
```

---

## 6. Modellar (Database Layer)

Barcha modellar `pg` Pool orqali to'g'ridan-to'g'ri SQL query'lar bilan ishlaydi (ORM ishlatilmaydi).

### `attempt.model.js`
- `createAttempt(test_id, user_id, answers, score, subject_name)`
- `getAttemptsByTest(test_id)`
- `getAttemptsByUser(user_id)`
- `publishAttemptsByTest(test_id)`
- `publishAttemptForUser(test_id, user_id)`

### `test.model.js`
- `createTest(title, description, subject_id)`
- `getTests()` — subjects bilan JOIN
- `deleteTest(id)`

### `question.model.js`
- `createQuestion(test_id, question_text, options, correct_option)`
- `getQuestionsByTest(test_id)`

### `subject.model.js`
- `createSubject(name)`
- `getSubjects()`
- `deleteSubject(id)`

---

## 7. Database Konfiguratsiya

### `config/db.js`
```javascript
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});
```

---

## 8. Migratsiyalar

| Fayl                                            | Tavsif                               |
|-------------------------------------------------|--------------------------------------|
| `20260329_add_final_theta_score_to_attempts.sql` | `final_theta_score` ustuni           |
| `20260329_add_is_published_to_attempts.sql`      | `is_published` ustuni                |
| `20260329_add_subject_name_to_attempts.sql`      | `subject_name` ustuni                |
| `20260329_add_subject_name_is_published_...sql`  | Ikki ustun birga                     |
| `20260329_fix_is_reviewed_column.sql`            | `is_reviewed` tuzatish               |
| `20260329_fix_is_reviewed_and_is_published...sql`| Ikki ustunni tuzatish                |
| `20260329_full_attempts_fix.sql`                 | Barcha ustunlarni to'liq tuzatish    |
| `20260401_add_rasch_fields_to_attempts.sql`      | Rasch maydonlari: z/t_score, level   |

---

## 9. Xatoliklar Boshqaruvi (Error Handling)

### Global Error Handler (`app.js`)
```javascript
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Server ichki xatosi!" });
});
```

### Unhandled Rejection (`server.js`)
```javascript
process.on('unhandledRejection', (err) => {
  console.log("Unhandled Rejection! O'chirilmoqda...");
  server.close(() => process.exit(1));
});
```

---

## 10. Ma'lum Muammolar va Tavsiyalar

> ✅ **`attempt.controller.js`** 4 ta faylga bo'lindi: `crud`, `ai`, `review`, `publish`.

> ✅ **Rasch formulasi** `utils/rasch.js` ga chiqarildi (DRY tamoyiliga amal qilinadi).

> ✅ **AI routes** (`ai.routes.js`) tozalandi — barcha logika `ai.controller.js` da.

> ✅ **`evaluateAnswer()`** o'lik funksiya olib tashlandi.

> ✅ **SQL injection himoyasi** parametrized query'lar orqali ta'minlangan ($1, $2...) ✅

> ✅ **Rate limiting** qo'shildi — global (15 daqiqada 1000), AI (1 soatda 20).

> ✅ **Structured logging** winston orqali qo'shildi.

> ⚠️ **Input validation** yetarli emas. `express-validator` qo'shish tavsiya etiladi.

> ⚠️ **Admin credentials** hardcoded — production uchun DB ga o'tkazish kerak.
