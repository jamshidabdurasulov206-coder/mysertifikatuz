#!/bin/bash
# Milliy Sertifikat - Deployment Script
# Bu skript loyihani VPS yoki izolyatsiyalangan serverga o'rnatish uchun yordam beradi.

set -e

echo "🚀 Milliy Sertifikat tizimini o'rnatish boshlanmoqda..."

# 1. Docker va Docker-Compose o'rnatilganligini tekshirish
if ! command -v docker &> /dev/null; then
    echo "❌ Docker topilmadi! Iltimos, serverga Docker o'rnating."
    exit 1
fi

if docker compose version &> /dev/null; then
    COMPOSE_CMD="docker compose"
elif command -v docker-compose &> /dev/null; then
    COMPOSE_CMD="docker-compose"
else
    echo "❌ docker compose (plugin) yoki docker-compose topilmadi!"
    exit 1
fi

echo "✅ Docker tizimi mavjud."

# 2. .env fayli mavjudligini tekshirish
if [ ! -f ".env" ]; then
    echo "⚠️ .env fayli topilmadi. .env.example asosida yangisi yaratilmoqda..."
    cp .env.example .env 2>/dev/null || cp server/.env.example .env 2>/dev/null
    echo "⚠️ Iltimos, .env faylini oching va haqiqiy parollarni kiriting!"
    echo "Skript to'xtatildi. Tahrirlagandan so'ng qayta ishga tushiring: ./deploy.sh"
    exit 0
fi

# 3. Eski konteynerlarni to'xtatish va tozalash
echo "🧹 Eski konteynerlar tozalanmoqda..."
$COMPOSE_CMD down

# 4. Yangi obrazlarni qurish (Frontend va Backend)
echo "🏗️ Yangi DT obrazlari (Images) qurilmoqda... Bu bir oz vaqt olishi mumkin."
$COMPOSE_CMD build --pull

# 5. Ishga tushirish (Detached mode)
echo "🚀 Tizim ishga tushirilmoqda..."
$COMPOSE_CMD up -d

echo "✅ Tizim muvaffaqiyatli ishga tushirildi!"
echo "📡 Status: $COMPOSE_CMD ps"
echo "📜 Loglar: $COMPOSE_CMD logs -f app"
