import { useEffect, useState } from 'react'
import { api, auth } from '../api.js'

const Icon = ({ children, size = 20 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
)

const features = [
  ['ติดตามวันหมดอายุทุก Lot', 'แจ้งเตือนยาและเวชภัณฑ์ใกล้หมดอายุ แยกตามคลินิก',
    <Icon key="a"><rect x="3" y="4" width="18" height="17" rx="3" /><path d="M8 2v4M16 2v4M3 10h18" /><path d="M12 14v3l2 1" /></Icon>],
  ['วิเคราะห์อัตราการใช้ยา', 'ดูยอดจ่าย 30 / 90 / 180 วัน ช่วยวางแผนสต็อก',
    <Icon key="b"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></Icon>],
  ['ข่าวสารยาขาดคราว', 'สื่อสารถึงทุกคลินิกหรือเฉพาะสาขาที่เกี่ยวข้อง',
    <Icon key="c"><path d="M4 5h13a1 1 0 0 1 1 1v13H6a2 2 0 0 1-2-2z" /><path d="M18 9h2v9a1 1 0 0 1-2 0" /><path d="M8 9h6M8 13h6" /></Icon>],
]

const input = 'w-full rounded-xl border border-line bg-white py-3 pl-11 pr-4 text-[15px] text-ink placeholder:text-mut2 transition-[border-color,box-shadow] duration-150 focus:outline-none focus:border-accent focus:shadow-[0_0_0_3px_var(--color-accent-soft)]'

export default function LoginPage({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [mock, setMock] = useState(false) // backend อยู่โหมดจำลอง iMed (ช่วงทำ UI)
  useEffect(() => { api.authConfig().then((c) => setMock(c.imed === 'mock')).catch(() => {}) }, [])

  const submit = async (e) => {
    e.preventDefault()
    if (busy) return
    setBusy(true); setErr('')
    try {
      const { token, user } = await api.login(username, password)
      auth.set(token)
      onLogin(user)
    } catch (e2) { setErr(e2.message); setBusy(false) }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-[1.05fr_1fr]">
      {/* ฝั่งซ้าย: แบรนด์ (ซ่อนบนจอเล็ก) */}
      <aside className="relative hidden lg:flex flex-col justify-between overflow-hidden px-14 py-12 text-white bg-[linear-gradient(135deg,#050d2b_0%,#0a1a4a_55%,#17398f_100%)]">
        <svg aria-hidden="true" className="absolute inset-0 size-full opacity-[.06]">
          <defs><pattern id="cross" width="56" height="56" patternUnits="userSpaceOnUse"><path d="M28 20v16M20 28h16" stroke="white" strokeWidth="3" strokeLinecap="round" /></pattern></defs>
          <rect width="100%" height="100%" fill="url(#cross)" />
        </svg>
        <span aria-hidden="true" className="pointer-events-none absolute -right-24 -top-28 size-80 rounded-full bg-white/10" />
        <span aria-hidden="true" className="pointer-events-none absolute -bottom-32 -left-20 size-96 rounded-full bg-sky-300/10" />

        <div className="relative inline-flex w-fit rounded-2xl bg-white px-5 py-3 shadow-[0_8px_24px_-10px_rgba(0,0,0,.5)]">
          <img className="h-12 w-auto" src="/logo.png" alt="Bangkok Hospital Siriroj" />
        </div>

        <div className="relative max-w-[460px]">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1 text-[13px] text-sky-100 ring-1 ring-white/25">
            <span className="size-2 rounded-full bg-emerald-300" /> แผนกเภสัชกรรม · คลินิกเครือข่ายภูเก็ต
          </span>
          <h1 className="mt-5 text-[38px] font-semibold leading-[1.2] tracking-tight">คลังยา<br />OutList Clinic</h1>
          <p className="mt-3 text-[16px] leading-relaxed text-blue-100/85">ระบบบริหารคลังยาและเวชภัณฑ์ของคลินิกนอก ดูแลสต็อกให้ปลอดภัย พร้อมใช้ และไม่หมดอายุ</p>

          <ul className="mt-9 grid gap-4">
            {features.map(([t, s, ic]) => (
              <li key={t} className="flex items-start gap-3.5">
                <span className="grid size-11 flex-none place-items-center rounded-xl bg-white/10 text-sky-100 ring-1 ring-white/20">{ic}</span>
                <span><b className="block text-[15px] font-medium">{t}</b><small className="text-[13.5px] text-blue-100/75">{s}</small></span>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative">
          <svg viewBox="0 0 420 60" className="mb-4 h-10 w-full max-w-[420px] text-sky-300/60" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M0 34h120l14-6 12 30 16-56 14 40 10-8h234" />
          </svg>
          <p className="text-[13px] text-blue-100/70">© 2569 โรงพยาบาลกรุงเทพสิริโรจน์ (Bangkok Hospital Siriroj)</p>
        </div>
      </aside>

      {/* ฝั่งขวา: ฟอร์ม */}
      <main className="relative flex items-center justify-center bg-[#f3f6f8] px-5 py-10">
        <div className="w-full max-w-[420px]">
          <div className="mb-7 flex flex-col items-center text-center lg:hidden">
            <img className="mb-4 h-12 w-auto" src="/logo.png" alt="Bangkok Hospital Siriroj" />
            <h1 className="text-[22px] font-semibold">คลังยา OutList Clinic</h1>
          </div>

          <form onSubmit={submit} className="rounded-[20px] bg-white px-7 py-8 shadow-lift ring-1 ring-line sm:px-9 sm:py-10">
            <div className="mb-7">
              <span className="mb-3 grid size-12 place-items-center rounded-2xl bg-accent-soft text-accent">
                <Icon size={24}><rect x="4" y="11" width="16" height="10" rx="2.5" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /><path d="M12 15.5v2" /></Icon>
              </span>
              <h2 className="text-[24px] font-semibold tracking-tight">เข้าสู่ระบบ</h2>
              <p className="mt-0.5 text-[14px] text-mut">ใช้รหัสพนักงานและรหัสผ่าน iMed ชุดเดียวกับที่ใช้เข้าระบบโรงพยาบาล</p>
            </div>

            <label htmlFor="u" className="mb-1.5 block text-[13.5px] font-medium">รหัสพนักงาน (iMed)</label>
            <div className="relative mb-4">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-mut2"><Icon size={18}><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></Icon></span>
              <input id="u" className={input} placeholder="กรอกรหัสพนักงาน" autoFocus autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)} />
            </div>

            <label htmlFor="p" className="mb-1.5 block text-[13.5px] font-medium">รหัสผ่าน iMed</label>
            <div className="relative mb-5">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-mut2"><Icon size={18}><rect x="4" y="11" width="16" height="10" rx="2.5" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></Icon></span>
              <input id="p" type={show ? 'text' : 'password'} className={`${input} pr-12`} placeholder="กรอกรหัสผ่าน iMed" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
              <button type="button" onClick={() => setShow(!show)} aria-label={show ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                className="absolute right-2 top-1/2 grid size-9 -translate-y-1/2 cursor-pointer place-items-center rounded-lg border-0 bg-transparent text-mut hover:bg-head hover:text-ink focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_var(--color-accent-soft)]">
                {show
                  ? <Icon size={18}><path d="M3 3l18 18" /><path d="M10.6 6.1A10.7 10.7 0 0 1 12 6c6 0 9.5 6 9.5 6a17 17 0 0 1-3 3.7M6.3 7.7C3.9 9.4 2.5 12 2.5 12S6 18 12 18c1.6 0 3-.4 4.2-1" /><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" /></Icon>
                  : <Icon size={18}><path d="M2.5 12S6 6 12 6s9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6z" /><circle cx="12" cy="12" r="3" /></Icon>}
              </button>
            </div>

            {err && (
              <p role="alert" className="mb-4 flex items-start gap-2 rounded-xl bg-[#fdeceb] px-3.5 py-2.5 text-[13.5px] text-rd">
                <Icon size={18}><circle cx="12" cy="12" r="9" /><path d="M12 8v5M12 16.5v.5" /></Icon>{err}
              </p>
            )}

            <button type="submit" disabled={busy || !username.trim() || !password}
              className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border-0 bg-[linear-gradient(135deg,#0a1a4a_0%,#14307a_60%,#17398f_100%)] py-3 text-[15px] font-semibold text-white shadow-[0_8px_18px_-8px_rgba(20,48,122,.7)] transition hover:brightness-110 focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_var(--color-accent-soft)] disabled:cursor-not-allowed disabled:opacity-40">
              {busy && <svg className="size-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity=".3" strokeWidth="3" /><path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" /></svg>}
              {busy ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
            </button>
          </form>

          <p className="mt-5 flex items-center justify-center gap-1.5 text-center text-[12.5px] text-mut">
            <Icon size={14}><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" /><path d="M9 12l2 2 4-4" /></Icon>
            สำหรับเจ้าหน้าที่ที่ได้รับอนุญาตเท่านั้น
          </p>
        </div>
      </main>
    </div>
  )
}