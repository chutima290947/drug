# 📋 คลังยา OutList Clinic — Database Schema & API Reference

> **Web (Frontend)**: `http://localhost:5173/`
> **Base URL (API)**: `http://localhost:4000/api` — เรียกผ่านหน้าเว็บได้ที่ `http://localhost:5173/api` 
> **Database**: PostgreSQL (Neon)
> **Content-Type**: `application/json`
> **Authentication**: Bearer Token (JWT)

**หน้าที่ของระบบ**: ดูข้อมูลคลังยาของแต่ละคลินิก (ยอดคงเหลือ, วันหมดอายุ, อัตราการใช้) ที่ดึงมาจาก iMed และให้พนักงานโพสต์ **ข่าวสาร** (เช่น ยาขาดคราว) ถึงคลินิกที่เลือกเอง

---

## 🔗 สิ่งที่ต้องการจาก iMed/HIS (Integration Requirements)

ระบบต้องการดึงข้อมูลจาก iMed ใน **4 จุดหลัก** (ระบบนี้ **อ่านอย่างเดียว** ไม่เขียนกลับ iMed)

---

### 1. 🔐 Employee Authentication — Login ใช้รหัสเดียวกับ iMed

เมื่อพนักงาน login → ระบบส่งรหัสพนักงานและรหัสผ่านไปตรวจกับ iMed 

**ตอนนี้ (โหมดทดลอง)**:   
### "username": "admin",
### "password": "test1234"

**ระบบจะส่งไป:**
```json
POST {IMED_BASE_URL}/api/auth/login

{
  "username": "12345",
  "password": "••••••••"
}
```

**ต้องการ Response กลับมา:**
```json
{
  "success": true,
  "fullname": "ภก. ชาติชาย มีสุข",
  "token": "..."
}
```

| Field | iMed Field Name | Type | จำเป็น | คำอธิบาย |
|-------|----------------|------|--------|----------|
| `success` | TBD | boolean | ✅ | `false` เมื่อรหัสไม่ถูกต้อง |
| `fullname` | TBD | string | ✅ | ชื่อ-นามสกุลพนักงาน (แสดงมุมขวาบน และในข่าวสาร) |
| `token` | TBD | string | ❌ | Token สำหรับ request ถัดไป (ถ้ามี) |

> 📌 **Key ที่ใช้ match**: `username` = รหัสพนักงาน iMed (เก็บเป็นตัวพิมพ์เล็ก)
> พนักงานที่ iMed ยืนยันแล้วจะถูกเพิ่มในตาราง `users` อัตโนมัติ (`role = user`) — ผู้ดูแลระบบตั้งด้วย `npm run create-user`
> ทางเลือกอื่นที่ใช้ได้ (ตามที่ฝ่าย IT สะดวก): SSO / LDAP — ขอแค่ได้ "ผ่าน/ไม่ผ่าน" และชื่อพนักงาน

---

### 2. 📦 Stock — ยอดคงเหลือแยกคลินิก / ยา / Lot

ใช้แสดงหน้าคลังยา, แจ้งเตือนใกล้หมดอายุ และคำนวณมูลค่า (ต้องการแบบ real-time)

**ระบบจะส่งไป:**
```
GET {IMED_BASE_URL}/api/stock
```

**ต้องการ Response กลับมา:**
```json
{
  "items": [
    {
      "clinic_code": "BCA",
      "drug_code": "D014",
      "drug_name": "Paracetamol 500 mg",
      "unit": "เม็ด",
      "unit_price": 1.5,
      "item_type": "drug",
      "lot_no": "D014-L1",
      "qty": 1200,
      "expiry_date": "2027-06-30"
    }
  ]
}
```

| Field | iMed Field Name | Type | จำเป็น | คำอธิบาย |
|-------|----------------|------|--------|----------|
| `clinic_code` | TBD | string | ✅ | รหัสคลินิก (BCA, BKL, BKM, BPT, BRW, TLC) |
| `drug_code` | TBD | string | ✅ | รหัสยา/เวชภัณฑ์ |
| `drug_name` | TBD | string | ✅ | ชื่อยา |
| `unit` | TBD | string | ✅ | หน่วย |
| `unit_price` | TBD | number | ✅ | ราคาต่อหน่วย (ใช้คำนวณมูลค่า) |
| `item_type` | TBD | string | ❌ | `drug` = ยา, `supply` = เวชภัณฑ์ |
| `lot_no` | TBD | string | ✅ | เลข Lot |
| `qty` | TBD | integer | ✅ | จำนวนคงเหลือ |
| `expiry_date` | TBD | date | ✅ | วันหมดอายุ (`YYYY-MM-DD`) |

> 📌 **Key ที่ใช้ match**: `clinic_code | drug_code | lot_no` (เช่น `BCA|D014|D014-L1`)
> ตอนนี้โค้ดอยู่ใน `backend/imedstock.js` ฟังก์ชัน `fetchReal` — เปิดใช้ด้วย `IMED_STOCK=imed`

---

### 3. 💊 Dispense — ประวัติการจ่ายยา

ใช้คำนวณอัตราการใช้ยา **30 / 90 / 180 วัน** (หน้าการใช้ยา)

**ระบบจะส่งไป:**
```
GET {IMED_BASE_URL}/api/movements?type=dispense&from=2026-05-01
```

**ต้องการ Response กลับมา:**
```json
{
  "movements": [
    {
      "clinic_code": "BCA",
      "drug_code": "D014",
      "lot_no": "D014-L1",
      "movement_type": "dispense",
      "qty": 20,
      "moved_at": "2026-10-30T09:15:00+07:00"
    }
  ]
}
```

| Field | iMed Field Name | Type | จำเป็น | คำอธิบาย |
|-------|----------------|------|--------|----------|
| `clinic_code` | TBD | string | ✅ | รหัสคลินิก |
| `drug_code` | TBD | string | ✅ | รหัสยา |
| `lot_no` | TBD | string | ❌ | เลข Lot (ถ้ามี) |
| `movement_type` | TBD | string | ✅ | ใช้เฉพาะ `dispense` (จ่ายออก) ในการคำนวณ |
| `qty` | TBD | integer | ✅ | จำนวน (เป็นบวกเสมอ) |
| `moved_at` | TBD | datetime | ✅ | วันเวลาที่จ่าย |

> 📌 **Key ที่ใช้ match**: `clinic_code + drug_code`

### 4. 🧾 Item Master — ข้อมูลรายการจากรหัสเวชภัณฑ์

เมื่อกรอก **รหัสเวชภัณฑ์** ในหน้า "เพิ่มรายการเวชภัณฑ์" → ระบบดึงข้อมูลทั้งหมดที่ iMed มีมาเติมให้อัตโนมัติ ช่องไหนที่ iMed ไม่มีข้อมูล ผู้ใช้กรอกเอง

| ช่องในหน้าเพิ่มรายการ | ที่มา |
|------------------------|-------|
| รหัสเวชภัณฑ์ | ผู้ใช้กรอก (ใช้เป็น key ค้นหาใน iMed) |
| ชื่อเวชภัณฑ์ | ดึงจาก iMed |
| หน่วย | ดึงจาก iMed |
| ราคา/หน่วย | ดึงจาก iMed |
| คลินิก, Lot, จำนวน, วันหมดอายุ | ผู้ใช้กรอก (iMed รายการนี้ไม่มีข้อมูลส่วนนี้) |
| มูลค่า | ระบบคำนวณ (จำนวน × ราคา/หน่วย) |

ถ้า iMed ไม่มีรหัสนั้น → ผู้ใช้กรอกชื่อ/หน่วย/ราคาเองได้ตามเดิม

**ระบบจะส่งไป:**
```
GET {IMED_BASE_URL}/api/items/S001
```

**ต้องการ Response กลับมา** (ไม่พบรหัส → `404`):
```json
{
  "code": "S001",
  "name": "ผ้าก๊อซปิดแผล 4x4 นิ้ว",
  "unit": "ห่อ",
  "unit_price": 12.5,
  "item_type": "supply"
}
```

| Field | iMed Field Name | Type | จำเป็น | คำอธิบาย |
|-------|----------------|------|--------|----------|
| `code` | TBD | string | ✅ | รหัสรายการ |
| `name` | TBD | string | ✅ | ชื่อรายการ |
| `unit` | TBD | string | ✅ | หน่วย |
| `unit_price` | TBD | number | ✅ | ราคาต่อหน่วย (บาท) |
| `item_type` | TBD | string | ❌ | `drug` = ยา, `supply` = เวชภัณฑ์ (ถ้าไม่ระบุ ถือเป็นเวชภัณฑ์) |

> 📌 **Key ที่ใช้ match**: `code` = รหัสรายการ (ตัวพิมพ์ใหญ่)
> ตอนนี้โค้ดอยู่ใน `backend/imeditem.js` ฟังก์ชัน `fetchReal` — เปิดใช้ด้วย `IMED_ITEM=imed` (`IMED_ITEM=mock` = ข้อมูลตัวอย่างสำหรับทดสอบหน้าจอ)
> ตอนบันทึก ระบบถาม iMed ซ้ำอีกครั้งที่ฝั่งเซิร์ฟเวอร์ และใช้ค่าจาก iMed เสมอ (ไม่รับค่าที่แก้มาจากหน้าเว็บ)

---

## 🗄️ Database Tables

### 1. `clinics` — คลินิก

| Column | Type | PK | Nullable | คำอธิบาย |
|--------|------|----|----------|-----------|
| `code` | text | ✅ | NO | รหัสคลินิก (BCA, BKL, ...) |
| `name` | text | | NO | ชื่อคลินิก **(unique)** |
| `location_th` | text | | YES | สถานที่ (ภาษาไทย) |
| `active` | boolean | | NO | เปิดใช้งาน (default `true`) |

> มีข้อมูลตั้งต้น 6 คลินิก: BCA, BKL, BKM, BPT, BRW, TLC

---

### 2. `drugs` — รายการยาหลัก (Drug master)

| Column | Type | PK | Nullable | คำอธิบาย |
|--------|------|----|----------|-----------|
| `code` | text | ✅ | NO | รหัสยา |
| `name` | text | | NO | ชื่อยา |
| `unit` | text | | NO | หน่วย |
| `unit_price` | numeric(12,2) | | NO | ราคาต่อหน่วย (`>= 0`) |
| `item_type` | text | | NO | `drug` = ยา / `supply` = เวชภัณฑ์ (default `drug`) |
| `active` | boolean | | NO | เปิดใช้งาน (default `true`) |

---

### 3. `drug_lots` — สต็อกคงเหลือแยก Lot

| Column | Type | PK | Nullable | คำอธิบาย |
|--------|------|----|----------|-----------|
| `id` | bigserial | ✅ | NO | Primary key |
| `clinic_code` | text | | NO | FK → `clinics.code` |
| `drug_code` | text | | NO | FK → `drugs.code` |
| `lot_no` | text | | NO | เลข Lot |
| `qty` | integer | | NO | จำนวนคงเหลือ (`>= 0`) |
| `expiry_date` | date | | NO | วันหมดอายุ |
| `created_by` | text | | YES | ผู้บันทึก |
| `created_at` | timestamptz | | NO | วันที่สร้าง |
| `updated_at` | timestamptz | | NO | วันที่แก้ไขล่าสุด |

> 📌 **unique**: `(clinic_code, drug_code, lot_no)` — ยา 1 ตัวมีได้หลาย Lot
> Index: `idx_lots_expiry` (expiry_date)

---

### 4. `stock_movements` — ประวัติการเคลื่อนไหว

| Column | Type | PK | Nullable | คำอธิบาย |
|--------|------|----|----------|-----------|
| `id` | bigserial | ✅ | NO | Primary key |
| `clinic_code` | text | | NO | FK → `clinics.code` |
| `drug_code` | text | | NO | FK → `drugs.code` |
| `lot_id` | bigint | | YES | FK → `drug_lots.id` (`ON DELETE SET NULL`) |
| `movement_type` | text | | NO | ดูด้านล่าง |
| `qty` | integer | | NO | จำนวน (`> 0` เสมอ ทิศทางดูจาก `movement_type`) |
| `moved_at` | timestamptz | | NO | วันเวลาที่เคลื่อนไหว |
| `ref_no` | text | | YES | เลขอ้างอิง |
| `note` | text | | YES | หมายเหตุ |
| `created_by` | text | | YES | ผู้บันทึก |

`movement_type`: `receive` · `dispense` · `transfer_in` · `transfer_out` · `return` · `adjust` · `write_off`

> Index: `idx_mv_usage` (clinic_code, drug_code, moved_at)
> ใช้เฉพาะ `dispense` คำนวณอัตราการใช้ 30/90/180 วัน

---

### 5. `lot_notes` — หมายเหตุต่อ Lot

| Column | Type | PK | Nullable | คำอธิบาย |
|--------|------|----|----------|-----------|
| `lot_id` | bigint | ✅ | NO | FK → `drug_lots.id` (`ON DELETE CASCADE`) |
| `note` | text | | NO | หมายเหตุ |
| `updated_at` | timestamptz | | NO | วันที่แก้ไขล่าสุด |

---

### 6. `drug_notes` — หมายเหตุต่อ ยา + คลินิก

| Column | Type | PK | Nullable | คำอธิบาย |
|--------|------|----|----------|-----------|
| `clinic_code` | text | ✅ | NO | FK → `clinics.code` |
| `drug_code` | text | ✅ | NO | FK → `drugs.code` |
| `note` | text | | NO | หมายเหตุ |
| `updated_at` | timestamptz | | NO | วันที่แก้ไขล่าสุด |

---

### 7. `app_settings` — ค่าตั้งเกณฑ์ (ทุกเครื่องใช้ค่าเดียวกัน)

| Column | Type | PK | Nullable | คำอธิบาย |
|--------|------|----|----------|-----------|
| `key` | text | ✅ | NO | ชื่อค่า (ตอนนี้มี `thresholds`) |
| `value` | jsonb | | NO | ค่าที่ตั้ง |
| `updated_at` | timestamptz | | NO | วันที่แก้ไขล่าสุด |

ค่าเริ่มต้นของ `thresholds`:

| Key | ค่าเริ่มต้น | ความหมาย |
|-----|-------------|----------|
| `redMonths` | 6 | หมดอายุภายในกี่เดือน = 🔴 |
| `orangeMonths` | 8 | หมดอายุภายในกี่เดือน = 🟠 |
| `overstockDays` | 180 | ยอดคงเหลือพอใช้เกินกี่วัน = สต็อกเกิน |
| `noMoveDays` | 90 | ไม่มีการเคลื่อนไหวกี่วัน = ยาไม่เคลื่อนไหว |
| `minDays` | 14 | คงเหลือพอใช้ต่ำกว่ากี่วัน = ใกล้หมด |
| `window` | 90 | ช่วงวันที่ใช้คำนวณอัตราการใช้ |

---

### 8. `users` — ผู้ใช้งาน

| Column | Type | PK | Nullable | คำอธิบาย |
|--------|------|----|----------|-----------|
| `id` | bigserial | ✅ | NO | Primary key |
| `username` | text | | NO | รหัสพนักงาน iMed (ตัวพิมพ์เล็ก) **(unique)** |
| `display_name` | text | | NO | ชื่อที่แสดง |
| `password_hash` | text | | NO | ไม่ได้ใช้ — เก็บค่าคงที่ `'!imed'` (ตรวจรหัสผ่านกับ iMed) |
| `role` | text | | NO | `admin` / `user` (default `user`) |
| `active` | boolean | | NO | `false` = ปิดบัญชี เข้าใช้ไม่ได้ (default `true`) |
| `created_at` | timestamptz | | NO | วันที่สร้าง |

> `admin` แก้/ลบข่าวของคนอื่นได้ — `user` แก้/ลบได้เฉพาะข่าวที่ตัวเองโพสต์

---

### 9. `news` — ข่าวสาร

| Column | Type | PK | Nullable | คำอธิบาย |
|--------|------|----|----------|-----------|
| `id` | bigserial | ✅ | NO | Primary key |
| `title` | text | | NO | หัวข้อ (ไม่เกิน 200 ตัวอักษร) |
| `body` | text | | NO | รายละเอียด (ไม่เกิน 5,000 ตัวอักษร) |
| `all_clinics` | boolean | | NO | `true` = ส่งถึงทุกคลินิก (ไม่ใช้ `news_clinics`) |
| `created_by` | bigint | | YES | FK → `users.id` (`ON DELETE SET NULL`) |
| `created_by_name` | text | | NO | ชื่อผู้โพสต์ (ระบบใส่เองจาก token) |
| `created_at` | timestamptz | | NO | วันเวลาที่โพสต์ |
| `updated_by_name` | text | | NO | ชื่อผู้แก้ไขล่าสุด (ระบบใส่เอง) |
| `updated_at` | timestamptz | | NO | วันเวลาที่แก้ไขล่าสุด |

> ชื่อผู้แก้ไขและเวลา **ไม่รับจากหน้าเว็บ** — ระบบใส่เองจาก token และเวลาของฐานข้อมูล
> Index: `idx_news_created` (created_at DESC)

---

### 10. `news_clinics` — คลินิกปลายทางของแต่ละข่าว

| Column | Type | PK | Nullable | คำอธิบาย |
|--------|------|----|----------|-----------|
| `news_id` | bigint | ✅ | NO | FK → `news.id` (`ON DELETE CASCADE`) |
| `clinic_code` | text | ✅ | NO | FK → `clinics.code` |

> ใช้เมื่อ `news.all_clinics = false`

---

### Views

| View | คำอธิบาย |
|------|-----------|
| `v_lots` | Lot พร้อมชื่อคลินิก/ยา, มูลค่า (`qty × unit_price`), `days_left` และ `status` |
| `v_usage` | สรุปต่อ ยา+คลินิก: คงเหลือ + ยอดจ่ายออก `out30` / `out90` / `out180` + หมายเหตุ |

#### Status Flow ของ Lot (`v_lots.status`):
```
ok ⚪ → orange 🟠 → red 🔴 → expired ⚫
(คำนวณจากวันนี้ + เกณฑ์ redMonths / orangeMonths ใน app_settings)
```

| Status | เงื่อนไข |
|--------|----------|
| `expired` | หมดอายุแล้ว (`expiry_date < วันนี้`) |
| `red` | หมดอายุภายใน `redMonths` เดือน |
| `orange` | หมดอายุภายใน `orangeMonths` เดือน |
| `ok` | ปกติ |

---

## 🔌 API Endpoints

ทุก route ภายใต้ `/api` ต้องมี `Authorization: Bearer <token>` **ยกเว้น** `/api/health` และ `/api/auth/login`, `/api/auth/config`

### Authentication

| Method | Endpoint | คำอธิบาย | Auth Required |
|--------|----------|-----------|---------------|
| POST | `/api/auth/login` | เข้าสู่ระบบ (รหัสพนักงาน + รหัสผ่าน iMed) → `{ token, user }` | ❌ |
| GET | `/api/auth/me` | ตรวจ token / ดึงข้อมูลผู้ใช้ปัจจุบัน | ✅ |
| GET | `/api/auth/config` | ดูว่าอยู่โหมดจำลอง iMed หรือไม่ (แสดงป้าย "โหมดทดลอง") | ❌ |

> ไม่มี endpoint logout — token เป็นแบบ stateless หน้าเว็บลบ token เอง (อายุตาม `JWT_EXPIRES`, ค่าเริ่มต้น 12 ชั่วโมง)
> กันเดารหัสผ่าน: ผิดเกิน 10 ครั้งใน 15 นาที (ต่อ IP + รหัสพนักงาน) → `429`

---

### News (ข่าวสาร)

| Method | Endpoint | คำอธิบาย | Auth Required |
|--------|----------|-----------|---------------|
| GET | `/api/news` | ดึงข่าวทั้งหมด ล่าสุด 200 รายการ (พร้อมรายชื่อคลินิก) | ✅ |
| POST | `/api/news` | โพสต์ข่าวใหม่ | ✅ |
| PUT | `/api/news/:id` | แก้ไขข่าว (เจ้าของข่าวหรือ admin) | ✅ |
| DELETE | `/api/news/:id` | ลบข่าว (เจ้าของข่าวหรือ admin) | ✅ |

ตัวอย่าง body ของ `POST` / `PUT`:
```json
{
  "title": "ยา Paracetamol ขาดคราว",
  "body": "คาดว่าของเข้าสัปดาห์หน้า",
  "allClinics": false,
  "clinics": ["BCA", "BKL"]
}
```

---

### Inventory (ข้อมูลคลังยา)

| Method | Endpoint | คำอธิบาย | Auth Required |
|--------|----------|-----------|---------------|
| GET | `/api/clinics` | รายชื่อคลินิกที่เปิดใช้งาน | ✅ |
| GET | `/api/drugs?q=&type=` | ค้นหารหัส/ชื่อยาแบบแนะนำ (สูงสุด 10 รายการ, `type` = `drug`/`supply`) | ✅ |
| GET | `/api/drugs/:code` | ชื่อ/หน่วย/ราคาจากรหัส — ถาม iMed ก่อน (`from: "imed"`) ไม่พบจึงใช้ทะเบียนในระบบ (`from: "local"`) · `404` ไม่พบ · `502` เชื่อมต่อ iMed ไม่ได้ | ✅ |
| GET | `/api/lots` | Lot ทั้งหมดพร้อมสถานะ Exp (ถ้า `IMED_STOCK=imed` จะเอายอดจาก iMed มาทับ) | ✅ |
| GET | `/api/usage` | สรุปต่อ ยา+คลินิก (คงเหลือ + ยอดจ่าย 30/90/180 วัน) | ✅ |
| GET | `/api/settings` | ค่าตั้งเกณฑ์ | ✅ |

---

### Manual entry (ใช้ตอนยังไม่เชื่อม iMed)

ยังมีอยู่ในโค้ดเพื่อบันทึกข้อมูลเองระหว่างรอเชื่อม iMed

| Method | Endpoint | คำอธิบาย | Auth Required |
|--------|----------|-----------|---------------|
| POST | `/api/lots` | เพิ่ม Lot ใหม่ + บันทึก movement `receive` (เพิ่มเวชภัณฑ์ใหม่ได้ผ่าน `supply`) | ✅ |
| DELETE | `/api/lots/:id` | ลบ Lot | ✅ |
| PUT | `/api/notes/lot/:id` | บันทึก/ลบหมายเหตุของ Lot (ส่ง note ว่าง = ลบ) | ✅ |
| PUT | `/api/notes/drug/:clinic/:drug` | บันทึก/ลบหมายเหตุของ ยา+คลินิก | ✅ |
| PUT | `/api/settings` | แก้ค่าตั้งเกณฑ์ | ✅ |

---

### Health Check

| Method | Endpoint | คำอธิบาย | Auth Required |
|--------|----------|-----------|---------------|
| GET | `/api/health` | ตรวจ API + ฐานข้อมูล → `{ "api": "ok", "database": "ok" }` | ❌ |

---

## 📊 ER Diagram

```mermaid
erDiagram
    clinics ||--o{ drug_lots : "clinic_code"
    drugs ||--o{ drug_lots : "drug_code"
    drug_lots ||--o{ stock_movements : "lot_id"
    clinics ||--o{ stock_movements : "clinic_code"
    drugs ||--o{ stock_movements : "drug_code"
    drug_lots ||--o| lot_notes : "lot_id"
    clinics ||--o{ drug_notes : "clinic_code"
    drugs ||--o{ drug_notes : "drug_code"
    users ||--o{ news : "created_by"
    news ||--o{ news_clinics : "news_id"
    clinics ||--o{ news_clinics : "clinic_code"

    clinics {
        text code PK
        text name
        text location_th
        boolean active
    }

    drugs {
        text code PK
        text name
        text unit
        numeric unit_price
        text item_type
        boolean active
    }

    drug_lots {
        bigint id PK
        text clinic_code FK
        text drug_code FK
        text lot_no
        int qty
        date expiry_date
    }

    stock_movements {
        bigint id PK
        text clinic_code FK
        text drug_code FK
        bigint lot_id FK
        text movement_type
        int qty
        timestamptz moved_at
    }

    lot_notes {
        bigint lot_id PK
        text note
    }

    drug_notes {
        text clinic_code PK
        text drug_code PK
        text note
    }

    app_settings {
        text key PK
        jsonb value
    }

    users {
        bigint id PK
        text username
        text display_name
        text role
        boolean active
    }

    news {
        bigint id PK
        text title
        text body
        boolean all_clinics
        bigint created_by FK
        text created_by_name
        timestamptz created_at
        text updated_by_name
        timestamptz updated_at
    }

    news_clinics {
        bigint news_id PK
        text clinic_code PK
    }
```

---

## ⚙️ Environment Variables

```env
# Database (Neon PostgreSQL)
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require

# Server
PORT=4000

# Auth
JWT_SECRET=your_secret_key_here      # ยาวอย่างน้อย 16 ตัวอักษร
# JWT_EXPIRES=12h

# iMed login
IMED_PROVIDER=mock                   # mock = โหมดทดลอง (ห้ามใช้บนระบบจริง)
IMED_MOCK_PASSWORD=test1234          # ใช้เมื่อ IMED_PROVIDER=mock (อย่างน้อย 4 ตัวอักษร)

# iMed Stock
# IMED_STOCK=manual                  # manual = ใช้ยอดในระบบนี้ / imed = เอายอดจาก iMed

# iMed Item master (ชื่อ/หน่วย/ราคา จากรหัสเวชภัณฑ์)
# IMED_ITEM=manual                   # manual = ไม่ถาม iMed / mock = ข้อมูลตัวอย่าง (ห้ามใช้บนระบบจริง) / imed = ถาม iMed จริง

# iMed — เพิ่มเมื่อได้รับ endpoint จากทีม iMed
# IMED_BASE_URL=https://imed.hospital.com
```

---

## 🚦 HTTP Status Codes

| Status | คำอธิบาย |
|--------|----------|
| `200` | สำเร็จ |
| `201` | สร้างข้อมูลสำเร็จ |
| `204` | สำเร็จ (ไม่มีข้อมูลตอบกลับ) |
| `400` | ข้อมูลไม่ครบ / ไม่ถูกต้อง |
| `401` | ไม่ได้ login / token หมดอายุ / บัญชีถูกปิด / รหัสไม่ถูกต้อง |
| `403` | ไม่มีสิทธิ์ (เช่น แก้ข่าวของคนอื่น) |
| `404` | ไม่พบข้อมูล |
| `409` | ข้อมูลซ้ำ (เช่น Lot นี้มีอยู่แล้ว) |
| `429` | ล็อกอินผิดหลายครั้งเกินไป รอ 15 นาที |
| `500` | Server error |
| `502` | เชื่อมต่อ iMed ไม่ได้ |

---