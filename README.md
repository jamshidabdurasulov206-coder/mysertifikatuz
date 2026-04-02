# mysertifikatuz

Production deployment guide (Docker)

1) Serverga repositoryni clone qiling

- git clone <repo-url>
- cd mysertifikatuz

2) Environment tayyorlang

- cp .env.example .env
- .env ichida kamida quyidagilarni to'ldiring:
	- JWT_SECRET
	- DB_PASSWORD
	- GEMINI_API_KEY / ANTHROPIC_API_KEY
	- PAYME_MERCHANT_ID / PAYME_SECRET_KEY
	- ADMIN_PASSWORD

3) Deploy

- chmod +x deploy.sh
- ./deploy.sh

4) Holatni tekshirish

- docker compose ps
- docker compose logs -f app

App: http://SERVER_IP:4000

Muqobil qo'lda ishga tushirish

- docker compose build --pull
- docker compose up -d

Muhim xavfsizlik eslatmalari

- Server/.env yoki root .env ni GitHub'ga push qilmang.
- Agar test jarayonida real API key/tokenlar ochilib qolgan bo'lsa, ularni rotate qiling.
- Productionda CORS_ORIGIN ni aniq domen(lar) bilan cheklang.