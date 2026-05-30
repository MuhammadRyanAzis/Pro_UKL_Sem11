@echo off
echo =============================================
echo   DevAcademy - Setup Otomatis (Windows)
echo =============================================
echo.

echo [1/4] Menginstall dependencies root...
call npm install

echo [2/4] Menginstall dependencies backend...
cd backend
call npm install
cd ..

echo [3/4] Menginstall dependencies frontend...
cd frontend
call npm install
cd ..

echo [4/4] Menjalankan migrasi dan seed database...
cd backend
call npx prisma migrate deploy
call npx ts-node prisma/seed.ts
cd ..

echo.
echo =============================================
echo   Setup Selesai!
echo =============================================
echo.
echo   Jalankan: npm run dev
echo.
echo   Website  : http://localhost:3000
echo   API      : http://localhost:8000/api
echo.
echo   Admin    : admin@devacademy.com / admin123
echo   Student  : student@devacademy.com / student123
echo =============================================
pause
