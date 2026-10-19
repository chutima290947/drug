# Login (รหัส iMed จำลอง) + ข่าวสาร + ยอดคงเหลือจาก iMed — ขั้นตอนติดตั้ง

1. คัดลอกไฟล์ใน zip ทับโปรเจกต์เดิม (โครงโฟลเดอร์เดียวกัน) และ **ลบไฟล์ที่ไม่ใช้แล้ว**:
   `backend/users.js`, `backend/sql/user_clinics.sql`, `frontend/src/pages/UsersPage.jsx`, `frontend/src/pages/ChangePasswordPage.jsx` (ถ้ายังมี)
2. ฐานข้อมูล: ต้องรัน `backend/sql/auth_news.sql` แล้ว (ตาราง users, news, news_clinics) — ไม่ต้องรันอะไรเพิ่ม
   (คอลัมน์ all_clinics / ตาราง user_clinics ที่เคยสร้างไว้ ปล่อยไว้ได้ ไม่กระทบ)
3. `backend/.env` ต้องมี: `JWT_SECRET=` (สุ่มยาวๆ), `IMED_PROVIDER=mock`, `IMED_MOCK_PASSWORD=test1234`, `IMED_STOCK=manual`
4. `cd backend && npm install` แล้วรีสตาร์ต backend

## ข่าวสาร
- ทุกคนที่ล็อกอินเห็นข่าวทั้งหมด ไม่มีการจำกัดสิทธิ์ — เลือก "ดูข่าวของคลินิก" ได้ที่แถบปุ่มเหนือรายการข่าว (หรือช่องเลือกคลินิกด้านบน)
- ข่าวเรียงเก่า→ใหม่ มีเลขข่าว 1, 2, 3... ลบข่าวไหนแล้วเลขที่เหลือเรียงใหม่
- แก้/ลบได้เฉพาะเจ้าของข่าว หรือ role admin (กำหนด admin: `npm run create-user -- <รหัสพนักงาน> "<ชื่อ>" admin`)

## ยอดคงเหลือ
- ตอนนี้ `IMED_STOCK=manual` = ใช้ยอดที่บันทึกในระบบนี้ (หน้าเว็บจะแจ้งว่ายังไม่เชื่อมต่อ iMed Stock)
- เมื่อได้ข้อมูลเชื่อมต่อ iMed Stock: เขียนฟังก์ชัน `fetchReal` ใน `backend/imedStock.js` แล้วตั้ง `IMED_STOCK=imed`
  หน้าเว็บจะแสดง "คงเหลือจาก iMed Stock (real-time)" และรีเฟรชเองทุก 1 นาที
- ห้ามตั้ง `IMED_STOCK=imed` ก่อนเขียน fetchReal (หน้าคลังยาจะโหลดไม่ขึ้น)

## เมื่อเชื่อมต่อ iMed (ล็อกอินจริง)
- แก้เฉพาะฟังก์ชัน `verifyReal` ใน `backend/imed.js` แล้วตั้ง `IMED_PROVIDER=real` / โหมด mock ถูกบล็อกเมื่อ `NODE_ENV=production`