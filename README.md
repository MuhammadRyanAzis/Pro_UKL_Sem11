# 🎓 DevAcademy — E-Learning Platform

Platform e-learning modern berbasis **Next.js + NestJS + PostgreSQL**.

---

## ⚡ Cara Setup Setelah Clone (Baca Ini Dulu!)

### Prasyarat (Wajib Terinstall di Laptop Anda)
- [Node.js v18+](https://nodejs.org)
- [PostgreSQL 15/16](https://www.postgresql.org/download/)
- npm (sudah termasuk dalam Node.js)

---

### Langkah 1 — Buat Database PostgreSQL

Buka **pgAdmin** atau **psql** di laptop Anda, lalu jalankan:
```sql
CREATE DATABASE ukl_sem2_11;
```

---

### Langkah 2 — Konfigurasi File `.env`

Buka file **`backend/.env`** dan sesuaikan password PostgreSQL Anda:

```env
DATABASE_URL="postgresql://postgres:PASSWORD_ANDA@localhost:5432/ukl_sem2_11?schema=public"
JWT_SECRET="rahasia-super-aman-dan-rahasia"
PORT=8000
```

> ⚠️ Ganti `PASSWORD_ANDA` dengan password PostgreSQL yang Anda set saat instalasi.
> Biasanya ini adalah password yang Anda masukkan pertama kali saat install PostgreSQL.

---

### Langkah 3 — Install & Jalankan (Satu Perintah)

Buka terminal di folder root project ini, lalu jalankan:

**Mac / Linux:**
```bash
chmod +x setup.sh && ./setup.sh
```

**Windows (PowerShell):**
```powershell
.\setup.bat
```

Atau jalankan **manual** langkah demi langkah:
```bash
# 1. Install semua dependencies
npm install
cd backend && npm install && cd ..
cd frontend && npm install && cd ..

# 2. Jalankan migrasi database
cd backend
npx prisma migrate deploy

# 3. Isi data awal (admin, kursus, dll)
npx ts-node prisma/seed.ts

# 4. Kembali ke root dan jalankan
cd ..
npm run dev
```

---

### Langkah 4 — Akses Website

| Layanan | URL |
|---|---|
| 🌐 Frontend (Website) | http://localhost:3000 |
| ⚙️ Backend API | http://localhost:8000/api |
| 📚 API Dokumentasi | http://localhost:8000/api/docs |
| 🗄️ Database GUI | `cd backend && npx prisma studio` → http://localhost:5555 |

---

### 🔑 Akun Default (Setelah Seed)

| Role | Email | Password |
|---|---|---|
| Admin | admin@devacademy.com | admin123 |
| Student | student@devacademy.com | student123 |

---

## 🛠️ Tech Stack

| Layer | Teknologi |
|---|---|
| Frontend | Next.js 14, React, Tailwind CSS |
| Backend | NestJS, Prisma ORM |
| Database | PostgreSQL |
| Auth | JWT + Bcrypt |

---

## ❓ Troubleshooting

**Error: password authentication failed for user "postgres"**
→ Password di `backend/.env` tidak cocok. Ubah `PASSWORD_ANDA` dengan password PostgreSQL Anda.

**Error: database "ukl_sem2_11" does not exist**
→ Jalankan `CREATE DATABASE ukl_sem2_11;` di pgAdmin/psql terlebih dahulu.

**Error: EADDRINUSE address already in use**
→ Port sudah dipakai. Jalankan perintah berikut:
- Mac/Linux: `lsof -ti:8000 | xargs kill -9 && lsof -ti:3000 | xargs kill -9`
- Windows: `netstat -ano | findstr :8000` lalu `taskkill /PID [nomor_pid] /F`
