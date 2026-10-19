// ตัวเรียก backend (Vite ส่ง /api ต่อไปที่ http://localhost:4000 — ดู vite.config.js)
const TOKEN_KEY = 'drug_token'

// เก็บ token ล็อกอินไว้ในเบราว์เซอร์ / onExpire ให้ App ตั้งค่าไว้ เพื่อเด้งกลับหน้า login เมื่อ token หมดอายุ
export const auth = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (t) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
  onExpire: () => {},
}

async function req(path, opts = {}) {
  const token = auth.get()
  const res = await fetch('/api' + path, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) },
  })
  if (res.status === 401 && token && path !== '/auth/login') { auth.clear(); auth.onExpire() }
  if (!res.ok) {
    let msg = res.statusText
    try { msg = (await res.json()).error || msg } catch {}
    throw Object.assign(new Error(msg), { status: res.status })
  }
  return res.status === 204 ? null : res.json()
}
const body = (b) => ({ body: JSON.stringify(b) })

export const api = {
  login: (username, password) => req('/auth/login', { method: 'POST', ...body({ username, password }) }),
  me: () => req('/auth/me'),
  authConfig: () => req('/auth/config'),
  lots: () => req('/lots'),
  usage: () => req('/usage'),
  drug: (code) => req('/drugs/' + encodeURIComponent(code)),
  drugs: (q, type) => req('/drugs?q=' + encodeURIComponent(q) + (type ? '&type=' + type : '')),
  addLot: (b) => req('/lots', { method: 'POST', ...body(b) }),
  delLot: (id) => req('/lots/' + id, { method: 'DELETE' }),
  noteLot: (id, note) => req('/notes/lot/' + id, { method: 'PUT', ...body({ note }) }),
  noteDrug: (clinic, drug, note) => req(`/notes/drug/${clinic}/${drug}`, { method: 'PUT', ...body({ note }) }),
  settings: () => req('/settings'),
  saveSettings: (v) => req('/settings', { method: 'PUT', ...body(v) }),
  news: () => req('/news'),
  addNews: (b) => req('/news', { method: 'POST', ...body(b) }),
  editNews: (id, b) => req('/news/' + id, { method: 'PUT', ...body(b) }),
  delNews: (id) => req('/news/' + id, { method: 'DELETE' }),
}