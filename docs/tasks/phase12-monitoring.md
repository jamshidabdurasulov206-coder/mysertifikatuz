# 📊 Phase 12 — Monitoring & Reliability

> Monitor system health and improve reliability.

---

- [ ] **M-01** — Configure structured logging for production
  - Review Winston config (`server/src/utils/logger.js`)
  - `info` level in production, `debug` in development
  - Log file rotation (daily, retain 14 days)
  - Full error stack traces

- [ ] **M-02** — Set up automated PostgreSQL backups
  - Create daily backup script with `pg_dump`
  - Store backups in a separate location (cloud storage or different disk)
  - Auto-delete old backups (older than 30 days)
  - Document and test the restore process

- [ ] **M-03** — Set up uptime monitoring
  - Connect `/api/health` endpoint to external monitoring
  - Use UptimeRobot, Hetrixtools, or similar free service
  - Email or Telegram notification on downtime
  - 5-minute check intervals

- [ ] **M-04** — Set up error tracking
  - Verify unhandled rejection and uncaught exception logging
  - Notify admin on critical errors (email or Telegram bot)
  - Add Winston transport (file + optional remote)

- [ ] **M-05** — Database connection pool monitoring
  - Log `pg` Pool events (connect, error, remove)
  - Set max connections for production load
  - Optimize idle timeout and connection timeout
  - Enable slow query logging (>1s queries)
