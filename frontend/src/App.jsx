import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { CLINICS, USAGE } from './data.js'
import { api, auth } from './api.js'
import { DEFAULTS, summarize, thDate, EXP_LABEL, short, drugMap } from './utils.js'
import Sidebar from './components/Sidebar.jsx'
import TopBar from './components/TopBar.jsx'
import Drawer from './components/Drawer.jsx'
import AddItemModal from './components/AddItemModal.jsx'
import SettingsModal from './components/SettingsModal.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import InventoryPage from './pages/InventoryPage.jsx'
import UsagePage from './pages/UsagePage.jsx'
import AlertsPage from './pages/AlertsPage.jsx'
import NewsPage from './pages/NewsPage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import PrintReport from './components/PrintReport.jsx'
import { card, btnGhost, btnPrimary } from './classes.js'

const EMPTY_FORM = { type: 'supply', code: '', name: '', unit: '', price: '', clinic: CLINICS[0], qty: '', lot: '', exp: '' }


function Main({ user, onLogout }) {
  const [tab, setTab] = useState('dash')
  const [clinic, setClinic] = useState('all')
  const [q, setQ] = useState('')
  const [cfg, setCfg] = useState(DEFAULTS)
  const [draft, setDraft] = useState(cfg)
  const [saved, setSaved] = useState(false)
  const [showCfg, setShowCfg] = useState(false)
  const [lots, setLots] = useState([])
  const [notes, setNotes] = useState({})
  const [status, setStatus] = useState('loading') // loading | ok | error
  const [errMsg, setErrMsg] = useState('')
  const [toast, setToast] = useState('')
  const [lookup, setLookup] = useState(null)
  const [kind, setKind] = useState('drug') // drug | supply (เริ่มที่ยาเสมอ)
  const [picked, setPicked] = useState(() => new Set())
  const [checking, setChecking] = useState(false)
  const [sugg, setSugg] = useState([])
  const [sel, setSel] = useState(null)
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [fs, setFs] = useState('all')
  const [uf, setUf] = useState('all')
  const [stockSrc, setStockSrc] = useState('manual') // แหล่งยอดคงเหลือ: manual = กรอกในระบบนี้ | imed = ดึงจาก iMed Stock
  const [updatedAt, setUpdatedAt] = useState(null)
  const [news, setNews] = useState([]) // ข่าวสารทั้งหมด (ใช้แสดงเลขที่เมนู และดูข่าวในหน้าคลังยา/Lot)
  const [editing, setEditing] = useState(null) // ข่าวที่กำลังแก้ไข (ส่งไปใส่ฟอร์มในหน้าข่าวสาร)
  const reloadNews = () => api.news().then(setNews).catch(() => {})

  const notify = (m) => { setToast(m); setTimeout(() => setToast(''), 3500) }
  const lotsRef = useRef(lots); lotsRef.current = lots
  const noteTimers = useRef({})

  // โหลดข้อมูลทั้งหมดจาก backend (Lot, ยอดจ่ายยา, ค่าตั้งเกณฑ์, หมายเหตุ)
  const loadAll = useCallback(async (silent = false) => {
    try {
      const [rowsL, rowsU, st] = await Promise.all([api.lots(), api.usage(), api.settings()])
      const byCode = Object.fromEntries(CLINICS.map((n) => [short(n), n]))
      Object.keys(USAGE).forEach((k) => delete USAGE[k])
      Object.keys(drugMap).forEach((k) => delete drugMap[k])
      const nn = {}
      rowsU.forEach((u) => {
        const n = byCode[u.clinic_code]; if (!n) return
        USAGE[`${n}|${u.drug_code}`] = { out30: u.out30, out90: u.out90, out180: u.out180 }
        if (u.note) nn[`${n}|${u.drug_code}`] = u.note
      })
      const L = rowsL.filter((r) => byCode[r.clinic_code]).map((r) => {
        drugMap[r.drug_code] = { code: r.drug_code, name: r.drug_name, unit: r.unit, price: Number(r.unit_price), type: r.item_type || 'drug' }
        const c = byCode[r.clinic_code]
        if (r.note) nn[`${c}|${r.lot_no}`] = r.note
        return { id: r.id, clinic: c, code: r.drug_code, lot: r.lot_no, qty: r.qty, exp: String(r.expiry_date).slice(0, 10) }
      })
      setCfg({ ...DEFAULTS, ...st }); setLots(L); setNotes(nn); setStatus('ok'); setUpdatedAt(new Date())
      return true
    } catch (e) {
      if (!silent) { setErrMsg(e.message); setStatus('error') } // รีเฟรชเบื้องหลังที่พลาด ไม่ต้องล้มทั้งหน้า
      return false
    }
  }, [])
  useEffect(() => { loadAll() }, [loadAll])
  useEffect(() => { api.authConfig().then((c) => setStockSrc(c.stock || 'manual')).catch(() => {}) }, [])
  // ยอดคงเหลือจาก iMed เป็น real-time: รีเฟรชอัตโนมัติทุก 1 นาที (เฉพาะเมื่อเปิดหน้านี้อยู่)
  useEffect(() => {
    if (stockSrc !== 'imed') return
    const t = setInterval(() => { if (!document.hidden) loadAll(true) }, 60000)
    return () => clearInterval(t)
  }, [stockSrc, loadAll])
  useEffect(() => { api.news().then(setNews).catch(() => {}) }, [])

  // ค้นรหัสจากฐานข้อมูลตอนพิมพ์ (ไม่ดึงทั้งหมด) — ยา: ดึงอัตโนมัติ / เวชภัณฑ์: ถ้าเคยกรอกไว้จะเติมให้
  useEffect(() => {
    const c = form.code.trim().toUpperCase()
    setLookup(null)
    if (!c) { setSugg([]); setChecking(false); return }
    setChecking(true)
    const t = setTimeout(async () => {
      try {
        const d = await api.drug(c)
        const L = { code: d.code, name: d.name, unit: d.unit, price: Number(d.unit_price), type: d.item_type || 'drug' }
        setLookup(L)
        if (L.type === 'supply') setForm((f) => (f.type === 'supply' && f.code.trim().toUpperCase() === L.code ? { ...f, name: L.name, unit: L.unit, price: String(L.price) } : f))
      } catch { setLookup(null) }
      setChecking(false)
      api.drugs(c, form.type).then(setSugg).catch(() => setSugg([]))
    }, 250)
    return () => clearTimeout(t)
  }, [form.code, form.type])

  // หมายเหตุ: พิมพ์แล้วหน่วงนิดหนึ่งค่อยบันทึกลงฐานข้อมูล
  const saveNote = (key, text) => {
    const lot = lotsRef.current.find((l) => `${l.clinic}|${l.lot}` === key)
    const job = lot ? api.noteLot(lot.id, text) : (() => { const i = key.indexOf('|'); return api.noteDrug(short(key.slice(0, i)), key.slice(i + 1), text) })()
    job.catch((e) => notify('บันทึกหมายเหตุไม่สำเร็จ: ' + e.message))
  }
  const setNotesApi = (next) => {
    const k = Object.keys(next).find((x) => next[x] !== notes[x])
    setNotes(next)
    if (!k) return
    clearTimeout(noteTimers.current[k])
    noteTimers.current[k] = setTimeout(() => saveNote(k, next[k] || ''), 600)
  }

  const all = useMemo(() => summarize(lots, cfg), [lots, cfg])
  const rowMap = useMemo(() => Object.fromEntries(all.map((r) => [r.key, r])), [all])
  const allK = useMemo(() => all.filter((r) => kind === 'all' || (r.drug.type || 'drug') === kind), [all, kind])
  const rows = useMemo(
    () => allK.filter((r) => (clinic === 'all' || r.clinic === clinic) && (r.drug.name + r.drug.code).toLowerCase().includes(q.toLowerCase())),
    [allK, clinic, q]
  )
  const lotRows = rows.flatMap((r) => r.lots.map((l) => ({ ...l, drug: r.drug, key: r.key })))
    .sort((a, b) => new Date(a.exp) - new Date(b.exp))
  const invRows = fs === 'all' ? lotRows : fs === 'soon' ? lotRows.filter((l) => l.status === 'red' || l.status === 'orange') : fs === 'note' ? lotRows.filter((l) => (notes[`${l.clinic}|${l.lot}`] || '').trim()) : lotRows.filter((l) => l.status === fs)
  const pickToggle = (id) => setPicked((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n })
  const pickMany = (ids, on) => setPicked((p) => { const n = new Set(p); ids.forEach((i) => (on ? n.add(i) : n.delete(i))); return n })
  const clearPick = () => setPicked(new Set())
  const reportRows = picked.size ? lotRows.filter((l) => picked.has(l.id)) : invRows
  const FS_TITLE = { all: 'ทะเบียนเวชภัณฑ์คงคลัง (ทุกสถานะ)', expired: EXP_LABEL.expired, red: `${EXP_LABEL.red} (≤ ${cfg.redMonths} เดือน)`, orange: `เฝ้าระวัง (≤ ${cfg.orangeMonths} เดือน)`, soon: `รายการใกล้หมดอายุภายใน ${cfg.orangeMonths} เดือน`, ok: 'ปกติ (ระยะปลอดภัย)', note: 'รายการที่มีหมายเหตุ' }
  const reportTitle = picked.size ? `รายการที่เลือก (${picked.size} รายการ)` : FS_TITLE[fs]
  const scope = kind === 'drug' ? 'เฉพาะยา' : kind === 'supply' ? 'เฉพาะเวชภัณฑ์' : 'ยาและเวชภัณฑ์'
  const printReport = () => window.print()
  const by = (s) => lotRows.filter((l) => l.status === s)
  const cnt = (s) => by(s).length
  const qty = (s) => by(s).reduce((a, l) => a + l.qty, 0)
  const val = (s) => by(s).reduce((a, l) => a + l.qty * l.drug.price, 0)
  const total = rows.reduce((a, r) => a + r.value, 0)
  const empty = status === 'ok' && lots.length === 0
  const noKind = status === 'ok' && lots.length > 0 && allK.length === 0 // ยังไม่มีรายการของประเภทที่เลือก
  const T = (k) => status === 'ok' && !empty && !noKind && tab === k
  const invTab = tab !== 'news' // แท็บที่ใช้ข้อมูลคลังยา (ข่าวสารไม่ต้องรอข้อมูลคลัง)
  const go = (t, o = {}) => { setTab(t); if (o.c) setClinic(o.c); if (o.f) setFs(o.f); if (o.u) setUf(o.u) }

  // สถิติรายคลินิก (ไม่ขึ้นกับตัวกรอง)
  const stat = CLINICS.map((c) => {
    const r = allK.filter((x) => x.clinic === c), ls = r.flatMap((x) => x.lots)
    const n = (s) => ls.filter((l) => l.status === s).length
    return { c, items: r.length, ex: n('expired'), rd: n('red'), or: n('orange'), os: r.filter((x) => x.overstock && !x.noMove).length,
      nm: r.filter((x) => x.noMove).length, val: r.reduce((a, x) => a + x.value, 0), use: r.reduce((a, x) => a + x.avg, 0) }
  })
  const sum = (k) => stat.reduce((a, s) => a + s[k], 0)
  const risk = [...stat].sort((a, b) => b.ex * 5 + b.rd - (a.ex * 5 + a.rd))[0]
  const busy = [...stat].filter((s) => s.c !== risk.c).sort((a, b) => b.use - a.use)[0]
  const where = (s) => [...new Set(by(s).map((l) => short(l.clinic)))].join(', ') || '—'

  const codeU = form.code.trim().toUpperCase()
  const mismatch = lookup && lookup.type !== form.type
  const item = form.type === 'drug'
    ? (lookup && lookup.type === 'drug' ? lookup : null)
    : (!mismatch && codeU && form.name.trim() && form.unit.trim() && form.price !== '' && +form.price >= 0
      ? { code: codeU, name: form.name.trim(), unit: form.unit.trim(), price: +form.price, type: 'supply' } : null)
  const dup = lots.some((l) => l.clinic === form.clinic && l.lot === form.lot.trim() && l.code === codeU)
  const formOk = !!item && +form.qty > 0 && !!form.lot.trim() && !!form.exp && !dup
  const addItem = async () => {
    if (!formOk) return
    try {
      await api.addLot({ clinic: short(form.clinic), code: item.code, lot: form.lot.trim(), qty: +form.qty, exp: form.exp,
        ...(form.type === 'supply' ? { supply: { name: item.name, unit: item.unit, unit_price: item.price } } : {}) })
      await loadAll()
      setKind(form.type); setForm({ ...EMPTY_FORM, clinic: form.clinic, type: form.type }); setAdding(false); notify('เพิ่มรายการแล้ว')
    } catch (e) { notify('เพิ่มไม่สำเร็จ: ' + e.message) }
  }
  const del = async (l) => {
    if (!confirm(`ลบ Lot ${l.lot} (${l.drug.name}) ?`)) return
    try { await api.delLot(l.id); await loadAll() } catch (e) { notify('ลบไม่สำเร็จ: ' + e.message) }
  }
  const F = (k) => (e) => setForm({ ...form, [k]: e.target.value })
  const exportCsv = () => {
    const head = ['รหัส', 'รายการ', 'ประเภท', 'คลินิก', 'Lot', 'คงเหลือ', 'หน่วย', 'มูลค่า', 'วันหมดอายุ', 'สถานะ Exp', 'หมายเหตุ']
    const body = reportRows.map((l) => [l.code, l.drug.name, l.drug.type === 'supply' ? 'เวชภัณฑ์' : 'ยา', l.clinic, l.lot, l.qty, l.drug.unit, l.qty * l.drug.price, l.exp, EXP_LABEL[l.status] || 'ปกติ', notes[`${l.clinic}|${l.lot}`] || ''])
    const csv = '\ufeff' + [head, ...body].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = 'drug-inventory.csv'; a.click()
  }

  const setC = (k) => (e) => { setSaved(false); setDraft({ ...draft, [k]: +e.target.value }) }
  const dirty = JSON.stringify(draft) !== JSON.stringify(cfg)
  const err = Object.values(draft).some((v) => !(v > 0)) ? 'ทุกช่องต้องเป็นตัวเลขมากกว่า 0'
    : draft.orangeMonths <= draft.redMonths ? 'จำนวนเดือนสีส้มต้องมากกว่าสีแดง' : ''
  const save = async () => {
    if (err) return
    try { await api.saveSettings(draft); setCfg(draft); setSaved(true) } catch (e) { notify('บันทึกค่าตั้งเกณฑ์ไม่สำเร็จ: ' + e.message) }
  }

  const titles = { dash: `สรุปภาพรวมคลังเวชภัณฑ์ คลินิก ${CLINICS.length} สาขา`, inv: 'ทะเบียนยาคงคลังแยกตาม Lot', use: 'วิเคราะห์อัตราการใช้ยา', alert: 'แจ้งเตือนเวชภัณฑ์', news: 'ข่าวสาร (ยาขาดคราว / ประกาศ)' }
  const d = { cfg, rows, all, rowMap, lotRows, by, cnt, qty, val, total, stat, sum, risk, busy, where, go, clinic, fs, setFs, uf, setUf, notes, setNotes: setNotesApi, setSel, del, invRows, picked, pickToggle, pickMany, clearPick, exportCsv, printReport, kind, news, user, setClinic, reloadNews, notify, setEditing }
  return (
    <>
    <div className="flex min-h-screen max-[1000px]:flex-col print:hidden">
      <Sidebar tab={tab} setTab={setTab} badge={cnt('expired') + cnt('red')} newsCount={news.length} onLogout={onLogout} />

      <div className="flex-1 min-w-0 flex flex-col">
        <TopBar clinic={clinic} setClinic={setClinic} q={q} setQ={setQ} onSettings={() => { setDraft(cfg); setSaved(false); setShowCfg(true) }} onAdd={() => { setForm((f) => ({ ...f, type: 'supply' })); setAdding(true) }} user={user} />

        <main className="px-6 pt-[22px] pb-9 flex-1 max-[1000px]:px-3 max-[1000px]:pt-4 max-[1000px]:pb-4">
          <div className="flex justify-between items-center flex-wrap gap-2.5 mb-[18px]">
            <div><h2 className="text-[22px] font-semibold">{titles[tab]}</h2>{tab !== 'dash' && <small className="text-mut">{clinic === 'all' ? `ทุกคลินิก (${CLINICS.length} สาขา)` : clinic}</small>}{invTab && status === 'ok' && (
              <small className="block text-mut print:hidden">
                {updatedAt && ` · อัปเดตล่าสุด ${updatedAt.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', hour12: false })} น.`}
                <button className="ml-2 cursor-pointer border-0 bg-transparent p-0 text-accent underline" onClick={() => loadAll(true).then((ok) => notify(ok ? 'อัปเดตข้อมูลแล้ว' : 'อัปเดตไม่สำเร็จ'))}>รีเฟรช</button>
              </small>
            )}</div>
            {invTab && <div className="inline-flex rounded-xl bg-[#e9edf1] p-[3px] print:hidden">
              {[['drug', 'ยา'], ['supply', 'เวชภัณฑ์']].map(([k, l]) => (
                <button key={k} onClick={() => setKind(k)} className={`px-4 py-1.5 rounded-[9px] text-[13.5px] cursor-pointer border-0 ${kind === k ? 'bg-white text-accent font-semibold shadow-card' : 'bg-transparent text-mut'}`}>{l}</button>
              ))}
            </div>}
          </div>

          {invTab && status === 'loading' && <div className="py-20 text-center text-mut">กำลังโหลดข้อมูลจากฐานข้อมูล...</div>}
          {invTab && status === 'error' && (
            <div className={`${card} bg-white px-6 py-8`}>
              <h2 className="mb-1.5 text-[19px] font-bold text-[#a8322a]">เชื่อมต่อ backend ไม่ได้</h2>
              <p className="text-mut mb-3">{errMsg}</p>
              <ul className="list-disc pl-5 text-[14px] text-mut mb-4 space-y-1">
                <li>เปิด backend ไว้หรือยัง (<code>cd backend</code> แล้ว <code>npm run dev</code>)</li>
                <li>ลองเปิด <code>http://localhost:4000/api/health</code> ต้องเห็น {'{"api":"ok","database":"ok"}'}</li>
                <li>แก้ <code>vite.config.js</code> แล้ว ต้องรีสตาร์ต <code>npm run dev</code> ฝั่ง frontend ด้วย</li>
              </ul>
              <button className={btnPrimary} onClick={() => { setStatus('loading'); loadAll() }}>ลองใหม่</button>
            </div>
          )}

          {invTab && noKind && (
            <div className={`${card} bg-white px-6 py-10 text-center`}>
              <h2 className="mb-1.5 text-[19px] font-bold">ยังไม่มี{kind === 'supply' ? 'เวชภัณฑ์' : 'ยา'}ในระบบ</h2>
              <p className="text-mut mb-4">{kind === 'supply' ? 'เวชภัณฑ์ต้องกรอกข้อมูลเอง กดปุ่มด้านล่างเพื่อเพิ่มรายการแรก' : 'ระบบเพิ่มได้เฉพาะเวชภัณฑ์ ส่วนรายการยามาจากทะเบียนยาในระบบ'}</p>
              {kind === 'supply' && <button className={btnPrimary} onClick={() => { setForm((f) => ({ ...f, type: 'supply' })); setAdding(true) }}>+ เพิ่มรายการเวชภัณฑ์</button>}
            </div>
          )}

          {invTab && empty && (
            <div className={`${card} bg-white px-6 py-10 text-center`}>
              <h2 className="mb-1.5 text-[19px] font-bold">ยังไม่มีรายการเวชภัณฑ์</h2>
              <p className="text-mut">กด “เพิ่มรายการเวชภัณฑ์” แล้วใส่รหัสยา ระบบจะดึงชื่อ หน่วย และราคามาให้ จากนั้นกรอก Lot จำนวน และวันหมดอายุ</p>
              <div className="flex items-center justify-center gap-2.5 flex-wrap pt-1.5">
                <button className={btnPrimary} onClick={() => setAdding(true)}>+ เพิ่มรายการเวชภัณฑ์</button>
              </div>
            </div>
          )}

          {T('dash') && <DashboardPage d={d} />}

          {T('inv') && <InventoryPage d={d} />}

          {T('use') && <UsagePage d={d} />}

          {T('alert') && <AlertsPage d={d} />}

          {tab === 'news' && <NewsPage user={user} notify={notify} editing={editing} onSaved={() => { setEditing(null); reloadNews() }} onCancel={() => setEditing(null)} />}

        </main>
        <footer className="flex justify-between flex-wrap gap-2 px-6 py-4 bg-white border-t border-line text-mut text-[13px] print:hidden"><span>© 2569 โรงพยาบาลกรุงเทพสิริโรจน์ (Bangkok Hospital Siriroj)</span><span>ฝ่ายเภสัชกรรม คลินิกเครือข่ายภูเก็ต</span></footer>
      </div>

      {adding && <AddItemModal form={form} F={F} setForm={setForm} lookup={lookup} checking={checking} sugg={sugg} item={item} dup={dup} formOk={formOk} addItem={addItem} onClose={() => setAdding(false)} />}

      {showCfg && <SettingsModal draft={draft} setDraft={setDraft} setC={setC} dirty={dirty} err={err} save={save} saved={saved} setSaved={setSaved} onClose={() => setShowCfg(false)} />}

      {toast && <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-30 rounded-xl bg-[#0a1a4a] px-5 py-3 text-sm text-white shadow-card">{toast}</div>}

      <Drawer r={all.find((r) => r.key === sel)} onClose={() => setSel(null)} />
    </div>
    <PrintReport rows={reportRows} title={reportTitle} clinic={clinic} scope={scope} notes={notes} />
    </>
  )
}

// ครอบด้วยการล็อกอิน: ยังไม่ล็อกอิน → หน้า Login / ล็อกอินแล้ว → แอปเดิม
export default function App() {
  const [user, setUser] = useState(null)
  const [ready, setReady] = useState(false)
  useEffect(() => {
    auth.onExpire = () => setUser(null) // token หมดอายุ → กลับหน้า login
    if (!auth.get()) { setReady(true); return }
    api.me().then(setUser).catch(() => {}).finally(() => setReady(true))
  }, [])
  const logout = () => { auth.clear(); setUser(null) }
  if (!ready) return <div className="py-20 text-center text-mut">กำลังตรวจสอบการเข้าสู่ระบบ...</div>
  if (!user) return <LoginPage onLogin={setUser} />
  return <Main user={user} onLogout={logout} />
}