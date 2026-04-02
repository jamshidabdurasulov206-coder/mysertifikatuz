# 🚀 Phase 10 — Production Deployment (cPanel / Server)

> Deploy the project to cPanel or a small server.

---

- [ ] **D-01** — Set up Node.js app on cPanel (Setup Node.js App or PM2)
  - Upload `server/` directory to the server
  - Select Node.js version 20.x
  - Install dependencies with `npm ci --production`
  - Start via PM2: `pm2 start src/server.js --name milliysertifikat`

- [ ] **D-02** — Build frontend and deploy to server
  - `cd frontend && npm run build` — generate static files
  - Serve build folder via Express or place in `public_html`
  - Point `express.static()` in `server/src/app.js` to the production build folder

- [ ] **D-03** — Set up PostgreSQL database on server
  - Create database via cPanel PostgreSQL or `psql` on the server
  - Set `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_HOST` correctly in `.env`
  - Run all migrations with `node migrate.js`
  - Create admin user (`node scripts/resetAdmin.js`)

- [ ] **D-04** — Configure production `.env` file
  - `NODE_ENV=production`
  - `CORS_ORIGIN=https://yourdomain.uz` (exact domain)
  - Generate new `JWT_SECRET` (64+ char random string)
  - Rotate all API keys (Gemini, Anthropic)
  - Enter Payme production keys
  - `ENABLE_REDIS_QUEUE=false` (if Redis is not available)

- [ ] **D-05** — Set up domain and SSL
  - Bind domain to the app in cPanel
  - Install SSL certificate (cPanel AutoSSL or Let's Encrypt)
  - Configure HTTPS redirect

- [ ] **D-06** — Add `GET /api/health` endpoint in Express
  - Check DB connection (`SELECT 1`)
  - Return server version and uptime
  - Used for monitoring

- [ ] **D-07** — Create PM2 ecosystem file (`ecosystem.config.js`)
  - Cluster mode (if CPU allows)
  - Auto-restart on crash
  - Direct log files to `server/logs/`
  - Auto-start on server reboot with `pm2 startup`

- [ ] **D-08** — Document the deployment process
  - Write deploy steps in `README.md`
  - Update `.env.example` (all required variables)
  - cPanel-specific instructions

---

## Deployment Checklist

```
[ ] Node.js 20.x installed on server
[ ] PostgreSQL running and migrated
[ ] Frontend build ready and being served
[ ] .env production values configured
[ ] SSL certificate installed
[ ] CORS_ORIGIN set to exact domain
[ ] PM2 managing the application
[ ] /api/health returns 200
[ ] Admin login works
[ ] Payment (Payme) webhook works
```
