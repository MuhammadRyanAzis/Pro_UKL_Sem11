#!/bin/bash

echo "============================================="
echo "  🎓 DevAcademy - Setup Otomatis"
echo "============================================="
echo ""

# Cek Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js belum terinstall! Download di https://nodejs.org"
    exit 1
fi

# Cek PostgreSQL connection
echo "⚙️  Menginstall dependencies..."
npm install
cd backend && npm install && cd ..
cd frontend && npm install && cd ..

echo ""
echo "🗄️  Menjalankan migrasi database..."
cd backend
npx prisma migrate deploy

echo ""
echo "🌱 Mengisi data awal (seed)..."
npx ts-node prisma/seed.ts

cd ..

echo ""
echo "============================================="
echo "  ✅ Setup Selesai!"
echo "============================================="
echo ""
echo "  Jalankan: npm run dev"
echo ""
echo "  🌐 Website  : http://localhost:3000"
echo "  ⚙️  API      : http://localhost:8000/api"
echo ""
echo "  👑 Admin    : admin@devacademy.com / admin123"
echo "  👤 Student  : student@devacademy.com / student123"
echo "============================================="
