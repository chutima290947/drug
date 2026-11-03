-- คลังยา OutList Clinic — PostgreSQL schema ฉบับรวม (ใช้ได้กับ Neon)
-- รวมของเดิม (schema.sql) + ล็อกอิน (users) + ข่าวสาร (news, news_clinics)
-- รันไฟล์นี้ไฟล์เดียวได้เลยบนฐานข้อมูลใหม่ และรันซ้ำบนฐานข้อมูลเดิมได้ปลอดภัย (ใช้ IF NOT EXISTS)
-- ข้อมูลตัวอย่าง (ถ้าต้องการ): รัน seed_sample.sql ต่อท้าย

CREATE TABLE IF NOT EXISTS clinics (
  code        text PRIMARY KEY,                 -- BCA, BKL, ...
  name        text NOT NULL UNIQUE,             -- BCA Airport Clinic
  location_th text,
  active      boolean NOT NULL DEFAULT true
);

-- รายการยาหลัก (Drug master) : พิมพ์รหัสแล้วดึงชื่อ/หน่วย/ราคามาจากตารางนี้
CREATE TABLE IF NOT EXISTS drugs (
  code       text PRIMARY KEY,
  name       text NOT NULL,
  unit       text NOT NULL,
  unit_price numeric(12,2) NOT NULL CHECK (unit_price >= 0),
  item_type  text NOT NULL DEFAULT 'drug' CHECK (item_type IN ('drug','supply')), -- drug = ยา, supply = เวชภัณฑ์ (กรอกเอง)
  active     boolean NOT NULL DEFAULT true
);

-- สต็อกคงเหลือแยก Lot (ยา 1 ตัวมีได้หลาย Lot)
CREATE TABLE IF NOT EXISTS drug_lots (
  id          bigserial PRIMARY KEY,
  clinic_code text NOT NULL REFERENCES clinics(code),
  drug_code   text NOT NULL REFERENCES drugs(code),
  lot_no      text NOT NULL,
  qty         integer NOT NULL CHECK (qty >= 0),
  expiry_date date NOT NULL,
  created_by  text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (clinic_code, drug_code, lot_no)
);
CREATE INDEX IF NOT EXISTS idx_lots_expiry ON drug_lots (expiry_date);

-- ประวัติการเคลื่อนไหว (Movement) : ใช้คำนวณอัตราการใช้ 30/90/180 วัน
-- qty เก็บเป็นจำนวนบวกเสมอ ทิศทางดูจาก movement_type
CREATE TABLE IF NOT EXISTS stock_movements (
  id            bigserial PRIMARY KEY,
  clinic_code   text NOT NULL REFERENCES clinics(code),
  drug_code     text NOT NULL REFERENCES drugs(code),
  lot_id        bigint REFERENCES drug_lots(id) ON DELETE SET NULL,
  movement_type text NOT NULL CHECK (movement_type IN
                ('receive','dispense','transfer_in','transfer_out','return','adjust','write_off')),
  qty           integer NOT NULL CHECK (qty > 0),
  moved_at      timestamptz NOT NULL DEFAULT now(),
  ref_no        text,
  note          text,
  created_by    text
);
CREATE INDEX IF NOT EXISTS idx_mv_usage ON stock_movements (clinic_code, drug_code, moved_at);

-- หมายเหตุ: หน้าคลังยา/Lot ผูกกับ Lot, หน้าการใช้ยาผูกกับ ยา+คลินิก
CREATE TABLE IF NOT EXISTS lot_notes (
  lot_id     bigint PRIMARY KEY REFERENCES drug_lots(id) ON DELETE CASCADE,
  note       text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS drug_notes (
  clinic_code text NOT NULL REFERENCES clinics(code),
  drug_code   text NOT NULL REFERENCES drugs(code),
  note        text NOT NULL,
  updated_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (clinic_code, drug_code)
);

-- ค่าตั้งเกณฑ์ (ปุ่ม ตั้งค่าเกณฑ์) เก็บกลางให้ทุกเครื่องใช้ค่าเดียวกัน
CREATE TABLE IF NOT EXISTS app_settings (
  key        text PRIMARY KEY,
  value      jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO app_settings (key, value) VALUES
  ('thresholds', '{"redMonths":6,"orangeMonths":8,"overstockDays":180,"noMoveDays":90,"minDays":14,"window":90}')
ON CONFLICT (key) DO NOTHING;

-- มุมมอง: Lot พร้อมสถานะ Exp (คำนวณจากวันนี้ + เกณฑ์ใน app_settings)
CREATE OR REPLACE VIEW v_lots AS
SELECT l.id, l.clinic_code, c.name AS clinic_name, l.drug_code, d.name AS drug_name, d.unit,
       d.unit_price, l.lot_no, l.qty, l.expiry_date,
       (l.qty * d.unit_price)            AS value,
       (l.expiry_date - CURRENT_DATE)    AS days_left,
       CASE WHEN l.expiry_date < CURRENT_DATE THEN 'expired'
            WHEN l.expiry_date <= CURRENT_DATE + make_interval(months => s.red)    THEN 'red'
            WHEN l.expiry_date <= CURRENT_DATE + make_interval(months => s.orange) THEN 'orange'
            ELSE 'ok' END               AS status,
       n.note, d.item_type
FROM drug_lots l
JOIN clinics c ON c.code = l.clinic_code
JOIN drugs   d ON d.code = l.drug_code
LEFT JOIN lot_notes n ON n.lot_id = l.id
CROSS JOIN LATERAL (SELECT (value->>'redMonths')::int AS red, (value->>'orangeMonths')::int AS orange
                    FROM app_settings WHERE key = 'thresholds') s;

-- มุมมอง: สรุปต่อ ยา+คลินิก (คงเหลือ + ยอดจ่ายออก 30/90/180 วัน)
CREATE OR REPLACE VIEW v_usage AS
SELECT s.clinic_code, s.drug_code, s.stock,
       COALESCE(m.out30, 0) AS out30, COALESCE(m.out90, 0) AS out90, COALESCE(m.out180, 0) AS out180,
       n.note
FROM (SELECT clinic_code, drug_code, SUM(qty)::int AS stock FROM drug_lots GROUP BY 1, 2) s
LEFT JOIN (
  SELECT clinic_code, drug_code,
         SUM(qty) FILTER (WHERE moved_at >= now() - interval '30 days')::int  AS out30,
         SUM(qty) FILTER (WHERE moved_at >= now() - interval '90 days')::int  AS out90,
         SUM(qty) FILTER (WHERE moved_at >= now() - interval '180 days')::int AS out180
  FROM stock_movements WHERE movement_type = 'dispense' GROUP BY 1, 2
) m USING (clinic_code, drug_code)
LEFT JOIN drug_notes n USING (clinic_code, drug_code);

-- ข้อมูลหลัก: คลินิก 6 แห่ง
INSERT INTO clinics (code, name, location_th) VALUES
  ('BCA','BCA Airport Clinic','สนามบิน (Airport)'),
  ('BKL','BKL Khaolak Stock','เขาหลัก (Khaolak)'),
  ('BKM','BKM Kamala Stock','กมลา (Kamala)'),
  ('BPT','BPT Patong Stock','ป่าตอง (Patong)'),
  ('BRW','BRW Rawai Stock','ราไวย์ (Rawai)'),
  ('TLC','TLC SrisunthonClinic','ศรีสุนทร (Srisunthon)')
ON CONFLICT (code) DO NOTHING;

-- ============================================================
-- ผู้ใช้งาน + ข่าวสาร
-- ============================================================

-- ผู้ใช้: ล็อกอินด้วยรหัสพนักงาน + รหัสผ่าน iMed (ระบบนี้ไม่เก็บรหัสผ่านจริง)
-- พนักงานที่ iMed ยืนยันแล้วแต่ยังไม่มีแถวในตารางนี้ จะถูกเพิ่มอัตโนมัติตอนล็อกอินครั้งแรก
CREATE TABLE IF NOT EXISTS users (
  id            bigserial PRIMARY KEY,
  username      text NOT NULL UNIQUE,                  -- รหัสพนักงาน iMed เก็บเป็นตัวพิมพ์เล็กเสมอ
  display_name  text NOT NULL,                         -- ชื่อที่แสดงในข่าวสาร/มุมขวาบน
  password_hash text NOT NULL DEFAULT '!imed',         -- ไม่ได้ใช้ (ตรวจรหัสผ่านกับ iMed) เก็บไว้เป็นค่าคงที่ '!imed'
  role          text NOT NULL DEFAULT 'user' CHECK (role IN ('admin','user')),  -- admin แก้/ลบข่าวของคนอื่นได้
  active        boolean NOT NULL DEFAULT true,         -- false = ปิดบัญชี เข้าใช้งานไม่ได้
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- ข่าวสาร (เช่น ยาขาดคราว) : free text 1 เรื่องต่อ 1 โพสต์ เลขข่าวหน้าเว็บนับจากลำดับเวลาโพสต์
CREATE TABLE IF NOT EXISTS news (
  id              bigserial PRIMARY KEY,
  title           text NOT NULL,
  body            text NOT NULL,
  all_clinics     boolean NOT NULL DEFAULT false,      -- true = ส่งถึงทุกคลินิก (ไม่ใช้ news_clinics)
  created_by      bigint REFERENCES users(id) ON DELETE SET NULL,
  created_by_name text NOT NULL,                       -- เก็บชื่อไว้ด้วย เผื่อลบ/เปลี่ยนชื่อผู้ใช้ภายหลัง
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_by_name text NOT NULL,                       -- ระบบใส่เองจากผู้ล็อกอิน (ไม่รับจากหน้าเว็บ)
  updated_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_news_created ON news (created_at DESC);

-- คลินิกปลายทางของแต่ละข่าว (ใช้เมื่อ all_clinics = false)
CREATE TABLE IF NOT EXISTS news_clinics (
  news_id     bigint NOT NULL REFERENCES news(id) ON DELETE CASCADE,
  clinic_code text   NOT NULL REFERENCES clinics(code),
  PRIMARY KEY (news_id, clinic_code)
);