#!/bin/bash
# Milliy Sertifikat - Deployment Script
# Bu skript loyihani VPS yoki izolyatsiyalangan serverga o'rnatish uchun yordam beradi.

echo "🚀 Milliy Sertifikat tizimini o'rnatish boshlanmoqda..."

# 1. Docker va Docker-Compose o'rnatilganligini tekshirish
if ! command -v docker &> /dev/null; then
    echo "❌ Docker topilmadi! Iltimos, serverga Docker o'rnating."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker-Compose topilmadi! Iltimos, o'rnating."
    exit 1
fi

echo "✅ Docker tizimi mavjud."

# 2. .env fayli mavjudligini tekshirish
if [ ! -f ".env" ]; then
    echo "⚠️ .env fayli topilmadi. .env.example asosida yangisi yaratilmoqda..."
    cp server/.env.example .env 2>/dev/null || cp server/.env .env 2>/dev/null
    echo "⚠️ Iltimos, .env faylini oching va haqiqiy parollarni kiriting!"
    echo "Skript to'xtatildi. Tahrirlagandan so'ng qayta ishga tushiring: ./deploy.sh"
    exit 0
fi

# 3. Eski konteynerlarni to'xtatish va tozalash
echo "🧹 Eski konteynerlar tozalanmoqda..."
docker-compose down

# 4. Yangi obrazlarni qurish (Frontend va Backend)
echo "🏗️ Yangi DT obrazlari (Images) qurilmoqda... Bu bir oz vaqt olishi mumkin."
docker-compose build --no-cache

# 5. Ishga tushirish (Detached mode)
echo "🚀 Tizim ishga tushirilmoqda..."
docker-compose up -d

echo "✅ Tizim muvaffaqiyatli ishga tushirildi!"
echo "📡 Statusni ko'rish uchun: docker-compose logs -f"
