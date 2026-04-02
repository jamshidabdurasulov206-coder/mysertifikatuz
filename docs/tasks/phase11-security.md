# 🔒 Phase 11 — Security Hardening (Production)

> Strengthen security for the production environment.

---

- [ ] **S-01** — Rotate all exposed API keys
  - `GEMINI_API_KEY` — new key from Google AI Console
  - `ANTHROPIC_API_KEY` — new key from Anthropic Dashboard
  - `JWT_SECRET` — regenerate with `openssl rand -hex 64`
  - Revoke old keys

- [ ] **S-02** — Clean `.env` file from git history
  - Verify `.env` is in `.gitignore`
  - If `.env` was committed, remove from history with `git filter-branch` or `BFG Repo-Cleaner`
  - Rotate all keys (since they were visible in history)

- [ ] **S-03** — Add HTTP security headers
  - Install `helmet` middleware (`npm install helmet`)
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `Strict-Transport-Security` (HSTS)
  - `Content-Security-Policy` basic rules

- [ ] **S-04** — Tune rate limiting for production
  - Auth endpoints: 5 attempts / 15 min (brute-force protection)
  - AI endpoints: 10 requests / hour
  - Global: 500 requests / 15 min
  - Adjust `trust proxy` to match server architecture

- [ ] **S-05** — Strengthen input validation
  - Add `express-validator` or `joi`
  - Validate email/password format on auth endpoints
  - Audit for SQL injection and XSS vulnerabilities
  - Restrict file upload size and type (allowed MIME types only)

- [ ] **S-06** — Audit Payme webhook security
  - Ensure `PAYME_SECRET_KEY` Basic Auth verification
  - IP whitelist (if Payme provides IP ranges)
  - Validate webhook payload
  - Double-spend protection (idempotent transactions)
