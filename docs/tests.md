# Manual Test Plan for Milliy Sertifikat

## Authentication & Access Control
- Sign up (valid/invalid), login (valid/invalid), logout clears token, token stored as Bearer, protected routes blocked without token.
- Role checks: admin-only routes/buttons hidden/blocked for users; admin routes accessible for admins.

## Navigation & Layout
- Header links (Testlar, Natijalarim) route correctly; Ortga button goes back; theme toggle persists across pages; responsive layout (mobile/desktop).

## Tests Catalog
- Tests list loads; subject tags correct; search/filter (if any); card click opens payment page; price and description visible.

## Payments (Manual)
- Payment page loads selected test; shows price, admin card number, status badge (red message).
- Upload receipt file (pdf/png/jpg) succeeds; missing file rejected; upload progress/disabled state works.
- Payment submit sets status pending; pending message shown; rejected message shown on reject; approved message shown on approve; download link (if any) works.

## Test Start Restrictions
- Starting a test checks previous attempts: if already taken, shows “Siz avval bu testga qatnashgansiz.” and blocks.
- Backend start-session returns 409 if attempt exists.

## Exam Flow
- Starting new test creates session; session expiry enforced; questions load; single-choice/open inputs work; timer (if any) counts down; prevents navigation loss (localStorage temp answers cleared on start).
- Submit answers sends attempt; duplicate submit blocked; pending status shown while AI/review runs.

## Attempts & Results (Profile)
- Natijalarim page loads attempts for user; cards show status, subject, date; published attempts show score/level; zero/FAIL hidden per design; pending shows awaiting message.
- Certificate download works (PDF with QR, correct data); Analysis button opens attempt analysis.

## Admin Flows
- Admin dashboard accessible only to admin; subject create/delete works with auth; test create (with questions/types/options/answers/difficulty/image) works; delete test removes questions; analytics endpoints load.
- Attempts review: list unreviewed/pending; review submission saves; publish single/all works; rasch-run endpoint works.
- Manual payment admin: pending list loads; approve/reject updates user view/status.

## API/Backend
- CORS origins honored; /api prefixes routing; auth middleware rejects missing/invalid tokens; admin middleware checks role; rate limiting enabled.
- Attempt creation enforces uniqueness (user,test); requires required fields; payment check when REQUIRE_MANUAL_PAYMENT=true.
- Question service validations (type, options, correct_option/correct_answer_text, difficulty) enforced.

## Files & Uploads
- Receipt upload via file works; URL build uses UPLOAD_ORIGIN; invalid types rejected.

## Error States & Messaging
- Friendly toasts/messages for network/server errors; 401/403 handling redirects to login (if implemented); 404 for missing test.

## Performance & UX
- Loading spinners on auth/test/payment fetches; buttons disabled during submit; no layout shifts on theme toggle.

## Data Persistence
- Token persisted; selectedSubjectId/selectedTestId set on start; temp answers cleared on new start; subjects cache saved.

## Security
- JWT verified on backend; no admin access for normal users; no directory traversal in uploads; SQL inputs parameterized.
