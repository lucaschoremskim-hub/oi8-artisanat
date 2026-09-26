// Illustrations vectorielles générées (photos fictives de la démo).
// Une photo de démo est stockée sous la forme "art:<scène>:<graine>" et dessinée à l'affichage.

function rng(seed) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const SKIES = [
  ['#7ec3ff', '#e8f5ff'],
  ['#5aa9f0', '#d6ecff'],
  ['#8fd0ff', '#fff3d9'],
]

const SLOPE = -0.0875

function panelsGroup(scene, r) {
  const cols = 6
  const rows = 3
  let cells = ''
  let seams = ''
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x = 90 + col * 103
      const y = 345 + row * 68
      cells += `<rect x="${x}" y="${y}" width="100" height="62" rx="2" fill="url(#pv)" stroke="#c9d6e8" stroke-width="2"/>`
      for (let k = 1; k < 4; k++) seams += `<line x1="${x + k * 25}" y1="${y}" x2="${x + k * 25}" y2="${y + 62}" stroke="#4d78b8" stroke-opacity=".5" stroke-width="1"/>`
      seams += `<line x1="${x}" y1="${y + 31}" x2="${x + 100}" y2="${y + 31}" stroke="#4d78b8" stroke-opacity=".45" stroke-width="1"/>`
    }
  }
  let dirt = ''
  const dirty = scene === 'panels-dirty' || scene === 'panels-mid'
  if (dirty) {
    const limit = scene === 'panels-mid' ? 400 : 720
    for (let i = 0; i < 130; i++) {
      const x = 90 + r() * 620
      if (x > limit) continue
      const y = 345 + r() * 200
      const rad = 2 + r() * 9
      const tone = r() > 0.55 ? '#a98b5f' : '#8d7350'
      dirt += `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="${rad.toFixed(1)}" ry="${(rad * 0.7).toFixed(1)}" fill="${tone}" fill-opacity="${(0.25 + r() * 0.4).toFixed(2)}"/>`
    }
    dirt += `<rect x="90" y="345" width="${limit === 400 ? 310 : 620}" height="204" fill="#b39a6f" fill-opacity=".22"/>`
  }
  let gloss = ''
  if (scene === 'panels-clean' || scene === 'panels-mid') {
    const from = scene === 'panels-mid' ? 400 : 90
    gloss = `<clipPath id="gl"><rect x="${from}" y="345" width="${710 - from}" height="204"/></clipPath><g clip-path="url(#gl)">` +
      [0, 1, 2, 3, 4, 5, 6, 7].map((i) => `<polygon points="${from + i * 90},549 ${from + i * 90 + 40},549 ${from + i * 90 + 110},345 ${from + i * 90 + 70},345" fill="#fff" fill-opacity=".14"/>`).join('') +
      '</g>'
  }
  return `<g transform="matrix(1 ${SLOPE} 0 1 0 0)">${cells}${seams}${dirt}${gloss}</g>`
}

function tilesGroup(scene, r) {
  const clean = scene === 'roof-clean'
  let out = ''
  for (let i = 0; i < 14; i++) {
    const y0 = 300 + i * 24
    out += `<line x1="0" y1="${y0}" x2="800" y2="${y0 + SLOPE * 800}" stroke="#000" stroke-opacity=".16" stroke-width="2"/>`
  }
  for (let row = 0; row < 14; row++) {
    for (let k = 0; k < 16; k++) {
      const x = k * 52 + (row % 2) * 26
      const y = 300 + row * 24 + SLOPE * x
      out += `<line x1="${x}" y1="${y}" x2="${x}" y2="${y + 24}" stroke="#000" stroke-opacity=".12" stroke-width="1.5"/>`
    }
  }
  if (!clean) {
    for (let i = 0; i < 90; i++) {
      const x = r() * 800
      const y = 300 + r() * 300 + SLOPE * x
      const rad = 6 + r() * 24
      out += `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="${rad.toFixed(1)}" ry="${(rad * 0.55).toFixed(1)}" fill="${r() > 0.5 ? '#587a3a' : '#2f4a2a'}" fill-opacity="${(0.25 + r() * 0.35).toFixed(2)}"/>`
    }
  }
  return out
}

export function buildArt(scene, seed = 1) {
  const r = rng(seed * 131 + scene.length * 7)
  const [top, bottom] = SKIES[seed % SKIES.length]
  const isPanels = scene.startsWith('panels')
  const roofColor = isPanels ? '#4a5568' : scene === 'roof-clean' ? '#c56a45' : '#a8654a'
  const sunX = 80 + ((seed * 97) % 640)
  const cloud = (x, y, s) =>
    `<g fill="#fff" fill-opacity=".85" transform="translate(${x} ${y}) scale(${s})"><ellipse cx="0" cy="0" rx="46" ry="16"/><ellipse cx="-26" cy="8" rx="28" ry="12"/><ellipse cx="30" cy="8" rx="32" ry="13"/></g>`
  const roofBody = isPanels ? panelsGroup(scene, r) : tilesGroup(scene, r)
  const extras =
    scene === 'gutter'
      ? '<rect x="0" y="262" width="800" height="14" fill="#8993a3"/><path d="M0 276h800v10H0z" fill="#5c6675"/>'
      : ''
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice">
<defs>
<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${top}"/><stop offset="1" stop-color="${bottom}"/></linearGradient>
<linearGradient id="pv" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1c3f7a"/><stop offset="1" stop-color="#2c5fae"/></linearGradient>
<radialGradient id="sun"><stop offset="0" stop-color="#fff7c2"/><stop offset="1" stop-color="#fff7c2" stop-opacity="0"/></radialGradient>
</defs>
<rect width="800" height="600" fill="url(#sky)"/>
<circle cx="${sunX}" cy="90" r="90" fill="url(#sun)"/><circle cx="${sunX}" cy="90" r="30" fill="#fff4b0"/>
${cloud(140 + (seed % 3) * 120, 80, 1)}${cloud(560 - (seed % 2) * 160, 150, 0.8)}
<polygon points="0,600 0,300 800,230 800,600" fill="${roofColor}"/>
<polygon points="0,300 800,230 800,246 0,318" fill="#000" fill-opacity=".18"/>
${roofBody}${extras}
</svg>`
  return svg
}

const cache = new Map()

/** Transforme une source de photo ("art:scène:graine" ou data URL importée) en URL affichable. */
export function resolveSrc(src) {
  if (!src || !src.startsWith('art:')) return src
  if (cache.has(src)) return cache.get(src)
  const [, scene, seed] = src.split(':')
  const url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(buildArt(scene, Number(seed) || 1))}`
  cache.set(src, url)
  return url
}
