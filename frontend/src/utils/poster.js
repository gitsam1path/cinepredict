/*
 * poster.js — affiches de secours générées localement.
 *
 * Quand TMDb n'est pas disponible (pas de clé, pas d'internet, film sans affiche),
 * on fabrique une affiche en SVG : un dégradé dont la couleur dépend du titre,
 * le titre en grand, l'année et le genre principal.
 * Résultat : une URL "data:image/svg+xml" utilisable directement dans <img src>.
 */

// Petite fonction de hachage : un même titre donne toujours la même couleur
function hash(text) {
  let h = 0
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) | 0
  return Math.abs(h)
}

// Découpe le titre en lignes d'environ maxChars caractères (au plus 4 lignes)
function wrap(title, maxChars = 14) {
  const words = title.split(/\s+/)
  const lines = []
  let line = ''
  for (const w of words) {
    if ((line + ' ' + w).trim().length > maxChars && line) {
      lines.push(line)
      line = w
    } else {
      line = (line + ' ' + w).trim()
    }
  }
  if (line) lines.push(line)
  if (lines.length > 4) {
    lines.length = 4
    lines[3] = lines[3].replace(/.{0,2}$/, '…')
  }
  return lines
}

const escapeXml = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[c])

export function fallbackPoster(film = {}) {
  const title = film.title || 'Film'
  const h = hash(title)
  const hue = h % 360
  const hue2 = (hue + 40 + (h % 60)) % 360
  const lines = wrap(title)
  const year = film.release_year || film.year || ''
  const genre = (film.genres && film.genres[0]) || ''
  const startY = 225 - (lines.length - 1) * 21

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="450" viewBox="0 0 300 450">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="hsl(${hue},55%,32%)"/>
      <stop offset="1" stop-color="hsl(${hue2},60%,10%)"/>
    </linearGradient>
    <radialGradient id="r" cx="0.75" cy="0.2" r="0.7">
      <stop offset="0" stop-color="hsl(${hue},80%,60%)" stop-opacity="0.45"/>
      <stop offset="1" stop-color="hsl(${hue},80%,60%)" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="300" height="450" fill="url(#g)"/>
  <rect width="300" height="450" fill="url(#r)"/>
  <rect x="14" y="14" width="272" height="422" fill="none" stroke="#d4af37" stroke-opacity="0.35" stroke-width="1.5"/>
  <text x="150" y="70" text-anchor="middle" font-family="Georgia, serif" font-size="13" letter-spacing="4" fill="#d4af37">CINÉPREDICT</text>
  ${lines
    .map(
      (l, i) =>
        `<text x="150" y="${startY + i * 42}" text-anchor="middle" font-family="Georgia, serif" font-weight="700" font-size="32" fill="#fff">${escapeXml(l)}</text>`,
    )
    .join('')}
  <text x="150" y="395" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" fill="#ddd">${escapeXml([genre, year].filter(Boolean).join(' · '))}</text>
</svg>`
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

/* Choisit la vraie affiche si elle existe, sinon l'affiche de secours. */
export function posterOf(film, failed = false) {
  return !failed && film?.poster ? film.poster : fallbackPoster(film)
}
