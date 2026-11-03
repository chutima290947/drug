# Backend (Express + PostgreSQL / Neon)

## ตั้งค่าฐานข้อมูล
1. Neon > SQL Editor > วาง sql/schema.sql แล้ว Run
2. (ถ้าต้องการข้อมูลตัวอย่าง) วาง sql/seed_sample.sql แล้ว Run

## รัน API
cp .env.example .env     # ใส่ DATABASE_URL ของ Neon
npm install
npm run dev              # API: http://localhost:4000/api/health
# (ใน frontend) npm run dev  → หน้าเว็บ: http://localhost:5173/

