// Fonctions pures (sans React) : formats, totaux, alertes matériel.

export const LOW_RATIO = 0.2 // seuil « bientôt épuisé » : moins de 20 % de la quantité prévue restante

const EPS = 1e-9

export const STATUSES = [
  { id: 'upcoming', label: 'À venir' },
  { id: 'active', label: 'En cours' },
  { id: 'done', label: 'Terminé' },
]

export const statusLabel = (id) => STATUSES.find((s) => s.id === id)?.label ?? id

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4)

export function parseNum(v) {
  if (typeof v === 'number') return Number.isFinite(v) ? v : 0
  const n = parseFloat(String(v ?? '').replace(/\s/g, '').replace(',', '.'))
  return Number.isFinite(n) ? n : 0
}

export function fmtQty(n) {
  const r = Math.round(n * 100) / 100
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 }).format(r)
}

const eur = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' })
export const fmtEUR = (n) => eur.format(Math.round((n || 0) * 100) / 100)

export function isoDate(d = new Date()) {
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

export function fmtDate(iso) {
  if (!iso) return ''
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function fmtMonth(now = new Date()) {
  return now.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
}

/** Niveau d'alerte d'une ligne de matériel : ok | low (orange) | out (orange) | over (rouge). */
export function materialStatus(m) {
  const planned = parseNum(m.planned)
  const used = parseNum(m.used)
  const remaining = planned - used
  if (remaining < -EPS) return { level: 'over', alert: true, label: `Dépassé de ${fmtQty(-remaining)} ${m.unit || ''}`.trim(), remaining }
  if (planned > 0 && Math.abs(remaining) <= EPS) return { level: 'out', alert: true, label: 'Épuisé', remaining: 0 }
  if (planned > 0 && remaining / planned < LOW_RATIO) {
    return { level: 'low', alert: true, label: `Bientôt épuisé · reste ${fmtQty(remaining)} ${m.unit || ''}`.trim(), remaining }
  }
  return { level: 'ok', alert: false, label: `Reste ${fmtQty(remaining)} ${m.unit || ''}`.trim(), remaining }
}

// Un chantier terminé n'a plus besoin de réapprovisionnement : pas d'alerte.
export const alertMaterials = (site) => (site.status === 'done' ? [] : site.materials.filter((m) => materialStatus(m).alert))

export const totalExpenses = (site) => site.expenses.reduce((s, e) => s + parseNum(e.amount), 0)

export function monthExpenses(sites, now = new Date()) {
  const key = isoDate(now).slice(0, 7)
  return sites.reduce(
    (sum, s) => sum + s.expenses.filter((e) => (e.date || '').startsWith(key)).reduce((a, e) => a + parseNum(e.amount), 0),
    0,
  )
}

export function progress(site) {
  if (!site.steps.length) return 0
  return Math.round((site.steps.filter((s) => s.done).length / site.steps.length) * 100)
}

export function expensesByCategory(site) {
  const map = new Map()
  for (const e of site.expenses) {
    const c = (e.category || '').trim() || 'Sans catégorie'
    map.set(c, (map.get(c) || 0) + parseNum(e.amount))
  }
  return [...map.entries()].map(([category, total]) => ({ category, total })).sort((a, b) => b.total - a.total)
}

export function allCategories(sites) {
  const set = new Set()
  for (const s of sites) for (const e of s.expenses) if ((e.category || '').trim()) set.add(e.category.trim())
  return [...set].sort((a, b) => a.localeCompare(b, 'fr'))
}

/** Réduit une photo importée (max 1280 px, JPEG) pour tenir dans le localStorage. */
export async function resizeImage(file, max = 1280, quality = 0.72) {
  const url = URL.createObjectURL(file)
  try {
    const img = await new Promise((resolve, reject) => {
      const i = new Image()
      i.onload = () => resolve(i)
      i.onerror = () => reject(new Error('Image illisible'))
      i.src = url
    })
    const ratio = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(img.naturalWidth * ratio)
    canvas.height = Math.round(img.naturalHeight * ratio)
    canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
    return canvas.toDataURL('image/jpeg', quality)
  } finally {
    URL.revokeObjectURL(url)
  }
}
