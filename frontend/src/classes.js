// ชุด class กลางที่ใช้ซ้ำหลายหน้า (แทน selector ใน styles.css เดิม)

/* ---------- ฟอร์ม / ปุ่ม ---------- */
const ctl = 'text-sm px-[13px] py-[9px] border rounded-[10px] transition-[border-color,box-shadow] duration-150'
const plain = 'border-line bg-white text-ink'
export const field = `${ctl} ${plain} focus:outline-none focus:border-accent focus:shadow-[0_0_0_3px_var(--color-accent-soft)]`
const btn = `${ctl} cursor-pointer focus-visible:outline-none focus-visible:border-accent focus-visible:shadow-[0_0_0_3px_var(--color-accent-soft)]`
export const btnGhost = `${btn} ${plain} hover:bg-head`
export const btnPrimary = `${btn} bg-accent border-accent text-white font-medium enabled:hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed`
export const noteInput = 'w-[140px] px-2.5 py-1.5 border border-transparent rounded-[10px] bg-white text-ink text-[13px] shadow-[0_0_0_1px_var(--color-line)] transition-[border-color,box-shadow] duration-150 focus:outline-none focus:border-accent focus:shadow-[0_0_0_3px_var(--color-accent-soft)]'
// ช่องหมายเหตุที่มีข้อความ: พื้นเหลืองอ่อน + ตัวอักษรสีน้ำเงินหนา ให้เด่นบนแถวที่มีสีพื้นหลัง
export const noteCls = (v) => (v && v.trim()
  ? 'w-[140px] px-2.5 py-1.5 border border-transparent rounded-[10px] bg-[#fff4c2] text-[#1d4ed8] font-semibold text-[13px] shadow-[0_0_0_1px_#f1d36b] transition-[border-color,box-shadow] duration-150 focus:outline-none focus:border-accent'
  : noteInput)

/* ---------- การ์ด ---------- */
export const card = 'bg-white rounded-[14px] shadow-card overflow-hidden'
export const clickable = 'cursor-pointer transition-[transform,box-shadow] duration-150 hover:-translate-y-0.5 hover:shadow-lift focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2'

/* ---------- Pill สถานะ ---------- */
const PILL = {
  expired: 'bg-dk text-white',
  red: 'bg-white text-rd border border-[#f3c7c3]',
  orange: 'bg-white text-or border border-[#f5d9a8]',
  nomove: 'bg-[#eef1f4] text-[#4b5864] border border-[#dde3e8]',
  over: 'bg-[#f0edfb] text-[#5b4bb5] border border-[#dcd5f4]',
  low: 'bg-[#e9f1fa] text-[#2f6fb5] border border-[#cfe0f2]',
}
const PILL_SOLID = { red: 'bg-rd text-white border border-rd', orange: 'bg-or text-white border border-or' }
// small = ป้ายเล็กต่อท้ายวันที่, solid = ป้ายตัวเลขสีเต็มในหน้าแจ้งเตือน
export const pillCls = (kind, { small, solid } = {}) =>
  `inline-block rounded-full font-medium leading-[1.6] mr-1 ${small ? 'ml-2 px-2 text-[11.5px]' : 'px-[11px] py-0.5 text-[12.5px]'} ${solid ? 'min-w-7 text-center ' + (PILL_SOLID[kind] || PILL[kind]) : PILL[kind]}`

/* ---------- แถวตารางตามสถานะ Exp (ใช้กับ <tr>) ---------- */
// pill ภายในแถวสีเข้มจะกลับเป็นพื้นขาว (เขียน class ตรงๆ ห้ามต่อสตริง เพราะ Tailwind สแกนไม่เจอ)
const pillRow = '[&_[data-pill]]:bg-white! [&_[data-pill]]:border-white!'
export const ROW = {
  ok: '[&:hover>td]:bg-[#f7f9fa]',
  expired: `[&>td]:bg-dk [&>td]:text-white [&>td]:border-b-white/20 [&:hover>td]:bg-[#6e1111] [&_.text-mut]:text-white/80 ${pillRow} [&_[data-pill]]:text-dk!`,
  red: `[&>td]:bg-rd [&>td]:text-white [&>td]:border-b-white/20 [&:hover>td]:bg-[#c42a1e] [&_.text-mut]:text-white/80 ${pillRow} [&_[data-pill]]:text-rd!`,
  orange: `[&>td]:bg-or [&>td]:text-white [&>td]:border-b-white/20 [&:hover>td]:bg-[#e0750f] [&_.text-mut]:text-white/80 ${pillRow} [&_[data-pill]]:text-[#a24d05]!`,
}
// แถว Lot ใน Drawer (พื้นสีทั้งบล็อก)
export const LI = {
  ok: 'bg-head',
  expired: 'bg-dk text-white [&_.text-mut]:text-white/80',
  red: 'bg-rd text-white [&_.text-mut]:text-white/80',
  orange: 'bg-or text-white [&_.text-mut]:text-white/80',
}