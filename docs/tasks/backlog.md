# 📥 Backlog — Future Plans

> Not yet planned, but potentially needed ideas.

---

- [ ] **B-01** — Mobile app (React Native or PWA)
  - Complete `manifest.json` for Progressive Web App
  - Offline support (Service Worker)
  - Push notifications

- [ ] **B-02** — CI/CD pipeline (GitHub Actions)
  - Auto-run tests on push
  - Auto-deploy on merge to main branch
  - Docker image build and push

- [ ] **B-03** — Full Redis + BullMQ setup in production
  - Install Redis server or use cloud Redis (Upstash, Redis Cloud)
  - Run worker process separately in PM2
  - Queue monitoring (Bull Board)

- [ ] **B-04** — API versioning (`/api/v1/`, `/api/v2/`)
  - Version new endpoints
  - Deprecation strategy for old versions

- [ ] **B-05** — CDN integration (for static files)
  - Deploy frontend build files to CDN
  - Object storage for images and PDFs

- [ ] **B-06** — Load testing and performance optimization
  - Stress test with `autocannon` or `k6`
  - Optimize slow queries (indexes)
  - Response caching (Redis or in-memory)
