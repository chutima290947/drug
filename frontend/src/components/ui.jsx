import { EXP_LABEL } from '../utils.js'
import { card, clickable, pillCls } from '../classes.js'

export const Pill = ({ s }) => (s === 'ok' ? <span className="text-mut">—</span> : <span data-pill className={pillCls(s)}>{EXP_LABEL[s]}</span>)
export const Flags = ({ r }) => (
  <>
    {r.noMove && <span data-pill className={pillCls('nomove')}>ไม่เคลื่อนไหว</span>}
    {r.overstock && !r.noMove && <span data-pill className={pillCls('over')}>Overstock</span>}
    {r.low && <span data-pill className={pillCls('low')}>ใกล้หมด</span>}
  </>
)

export const chipBase = 'cursor-pointer border rounded-full px-4 py-1.5 text-[13.5px] transition-[border-color,box-shadow] duration-150 focus-visible:outline-none focus-visible:border-accent focus-visible:shadow-[0_0_0_3px_var(--color-accent-soft)]'
export const Chips = ({ items, v, set, extra }) => (
  <div className="flex gap-2 flex-wrap mb-3.5 print:hidden">
    {items.map(([k, l]) => (
      <button key={k} onClick={() => set(k)}
        className={`${chipBase} ${v === k ? 'bg-accent border-accent text-white' : 'bg-white border-line text-ink'}`}>{l}</button>
    ))}
    {extra}
  </div>
)

/* ---------- การ์ดสรุปตัวเลข ---------- */
const SC_VARIANT = {
  '': { bar: 'border-l-[#9db0c0]', num: '' },
  purple: { bar: 'border-l-pu', num: 'text-pu' },
  gray: { bar: 'border-l-gr', num: '' },
  dk: { bar: 'border-l-dk', num: 'text-dk' },
  rd: { bar: 'border-l-rd', num: 'text-rd' },
  or: { bar: 'border-l-or', num: 'text-or' },
  teal2: { bar: 'border-l-accent', num: 'text-accent' },
  teal: { bar: 'border-l-[#0a1a4a]', num: '', bg: 'bg-linear-135 from-[#050d2b] to-accent text-white', soft: 'text-white/80', go: 'text-white' },
}
export const SC = ({ c, t, n, u, sub, onClick }) => {
  const v = SC_VARIANT[c] ?? SC_VARIANT['']
  const soft = v.soft || 'text-mut'
  return (
    <div className={`${card} ${v.bg || 'bg-white'} border-l-[5px] ${v.bar} px-[18px] py-4 flex flex-col gap-0.5 ${onClick ? clickable : ''}`}
      onClick={onClick} role={onClick ? 'button' : undefined} tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}>
      <span className="text-[13.5px] font-medium">{t}</span>
      <div className="flex items-baseline gap-2">
        <b className={`text-[34px] font-semibold leading-[1.2] tabular-nums ${v.num}`}>{n}</b>
        <em className={`not-italic text-[13px] ${soft}`}>{u}</em>
      </div>
      {onClick
        ? <div className="flex justify-between items-center gap-2"><small className={`text-[13px] ${soft}`}>{sub}</small><em className={`not-italic text-[13px] font-semibold ${v.go || 'text-accent'}`}>ดูรายการ ›</em></div>
        : <small className={`text-[13px] ${soft}`}>{sub}</small>}
    </div>
  )
}

/* ---------- การ์ดสถานะหมดอายุ (Dashboard) ---------- */
const XC_VARIANT = {
  d: { bar: 'border-l-dk', txt: 'text-dk', tag: 'bg-dk/10' },
  r: { bar: 'border-l-rd', txt: 'text-rd', tag: 'bg-rd/10' },
  o: { bar: 'border-l-or', txt: 'text-or', tag: 'bg-or/10' },
}
export const XC = ({ c, n, tag, title, foot, onClick, onKeyDown }) => {
  const v = XC_VARIANT[c]
  return (
    <div className={`${card} bg-white border-l-[5px] ${v.bar} pt-4 px-[18px] pb-0 ${clickable}`}
      role="button" tabIndex={0} onClick={onClick} onKeyDown={onKeyDown}>
      <div className="flex justify-between items-start gap-2.5">
        <b className={`text-[44px] leading-[1.1] font-semibold ${v.txt}`}>{n}</b>
        <span className={`text-xs font-medium px-2.5 py-[3px] rounded-lg ${v.txt} ${v.tag}`}>{tag}</span>
      </div>
      <p className="font-medium mt-1 mb-3">{title}</p>
      <div className="flex justify-between items-center gap-2 py-2.5 border-t border-line text-[13px] text-mut">
        <span>{foot}</span><em className="not-italic text-[13px] font-semibold text-accent">ดูรายการ ›</em>
      </div>
    </div>
  )
}

/* ---------- เซลล์ตาราง ---------- */
export const Th = ({ n, className = '', ...p }) => (
  <th className={`px-3.5 py-3 whitespace-nowrap border-b border-line bg-head text-[12.5px] font-semibold text-[#55636f] sticky top-0 ${n ? 'text-right tabular-nums' : 'text-left'} ${className}`} {...p} />
)
export const Td = ({ n, className = '', ...p }) => (
  <td className={`px-3.5 py-3 whitespace-nowrap border-b border-line ${n ? 'text-right tabular-nums' : 'text-left'} ${className}`} {...p} />
)