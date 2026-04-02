# ✨ Phase 13 — New Features v3

> Post-MVP additional features.

---

- [ ] **F-01** — Telegram bot integration
  - Notify user via Telegram when results are ready
  - Notify admin on new payments or new attempts
  - Store bot token in `.env`

- [ ] **F-02** — Download test results as PDF certificate
  - Improve certificate design (emblem, signature, QR)
  - Server-side PDF generation (jsPDF already available)
  - Unique certificate number

- [ ] **F-03** — User management in admin panel
  - Full user list (search, filter, pagination)
  - Block/activate users
  - User statistics (attempt count, average score)

- [ ] **F-04** — Test categories and difficulty levels
  - Group subjects into categories (e.g., Exact Sciences, Social Sciences)
  - Test difficulty level: Easy / Medium / Hard
  - Frontend filtering support

- [ ] **F-05** — Multi-language support (i18n)
  - Uzbek (current — primary)
  - Russian
  - English
  - `react-i18next` or simple context-based translation

- [ ] **F-06** — Real-time results (WebSocket/SSE)
  - Notify user in real-time when AI evaluation completes
  - Live update of new attempts in admin panel
  - Socket.IO or Server-Sent Events

- [ ] **F-07** — Exam session management
  - Admin opens/closes exam sessions
  - Time window (e.g., 14:00–16:00)
  - Only paid users can enter a session

- [ ] **F-08** — Analytics dashboard (admin)
  - Average score by subject chart
  - Registration trend over time
  - Payment conversion rate
  - Visualization with Chart.js or Recharts
