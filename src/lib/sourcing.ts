import type {
  CatalogRelease,
  MusicalProfile,
  SourcingSuggestion,
  VinylRecord,
} from '../types'
import { normalizeProfile } from '../types'

function normalize(s: string): string {
  return s
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim()
}

function artistMatch(a: string, b: string): boolean {
  const na = normalize(a)
  const nb = normalize(b)
  return na === nb || na.includes(nb) || nb.includes(na)
}

function releaseKey(artist: string, album: string): string {
  return `${normalize(artist)}|${normalize(album)}`
}

export function scoreReleaseForSourcing(
  release: CatalogRelease,
  rawProfile: Partial<MusicalProfile>,
  stock: VinylRecord[],
): SourcingSuggestion | null {
  const profile = normalizeProfile(rawProfile)

  if (profile.blockedArtists.some((a) => artistMatch(a, release.artist))) {
    return null
  }

  let score = 0
  const reasons: string[] = []

  const genreHits = release.genres.filter((g) => profile.genres.includes(g))
  if (genreHits.length) {
    score += genreHits.length * 18
    reasons.push(`Gênero: ${genreHits.join(', ')}`)
  }

  const styleHits = release.styles.filter((st) =>
    profile.styles.some(
      (p) =>
        normalize(p) === normalize(st) ||
        normalize(st).includes(normalize(p)) ||
        normalize(p).includes(normalize(st)),
    ),
  )
  if (styleHits.length) {
    score += styleHits.length * 16
    reasons.push(`Estilo: ${styleHits.slice(0, 2).join(', ')}`)
  }

  if (profile.decades.includes(release.decade)) {
    score += 14
    reasons.push(`Década ${release.decade}`)
  }

  const fav = profile.favoriteArtists.some((a) =>
    artistMatch(a, release.artist),
  )
  const discovery = profile.discoveryLevel / 100
  if (fav) {
    const boost = Math.round(32 * (1 - discovery * 0.5))
    score += boost
    reasons.push('Artista favorito')
  } else {
    score += Math.round(12 * discovery)
    if (discovery >= 0.55) reasons.push('Descoberta alinhada')
  }

  const energyDelta = Math.abs(release.mood.energy - profile.energy)
  const acousticDelta = Math.abs(
    release.mood.acousticElectronic - profile.acousticElectronic,
  )
  const grooveDelta = Math.abs(release.mood.groove - profile.groove)

  if (energyDelta <= 18) {
    score += 12
    reasons.push(
      profile.energy >= 66
        ? 'Energia dançante'
        : profile.energy <= 33
          ? 'Energia calma'
          : 'Energia equilibrada',
    )
  } else {
    score -= energyDelta * 0.2
  }

  if (acousticDelta <= 20) {
    score += 10
    reasons.push(
      profile.acousticElectronic >= 66
        ? 'Textura eletrônica'
        : profile.acousticElectronic <= 33
          ? 'Textura acústica'
          : 'Textura mista',
    )
  } else {
    score -= acousticDelta * 0.15
  }

  if (grooveDelta <= 18) {
    score += 10
    reasons.push(profile.groove >= 66 ? 'Groove forte' : 'Groove alinhado')
  } else {
    score -= grooveDelta * 0.15
  }

  const favAlbum = profile.favoriteAlbums.some(
    (a) => normalize(a) === normalize(release.album),
  )
  if (favAlbum) {
    score += 8
    reasons.push('Álbum citado no perfil')
  }

  const key = releaseKey(release.artist, release.album)
  const stockHit = stock.find(
    (s) => releaseKey(s.artist, s.album) === key && s.inStock,
  )

  if (stockHit) {
    score += 6
    reasons.push('Já temos em estoque')
  }

  score = Math.round(score)
  if (score < 12 && !fav && !genreHits.length) return null

  return {
    release,
    score,
    reasons: reasons.slice(0, 5),
    inStock: Boolean(stockHit),
    stockRecordId: stockHit?.id,
  }
}

export function suggestSourcing(
  profile: Partial<MusicalProfile>,
  catalog: CatalogRelease[],
  stock: VinylRecord[],
  limit = 20,
): SourcingSuggestion[] {
  const scored: SourcingSuggestion[] = []
  for (const release of catalog) {
    const result = scoreReleaseForSourcing(release, profile, stock)
    if (result) scored.push(result)
  }
  return scored.sort((a, b) => b.score - a.score).slice(0, limit)
}

export function formatPriceBrl(value?: number): string {
  if (value == null) return '—'
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function exportGarimpoCsv(
  items: { release: CatalogRelease; score: number; reasons: string[] }[],
): string {
  const header = 'artista,album,ano,estilos,score,preco_tipico_brl,motivos'
  const lines = items.map((i) => {
    const cols = [
      i.release.artist,
      i.release.album,
      String(i.release.year),
      i.release.styles.join(' / '),
      String(i.score),
      i.release.typicalUsedPriceBrl != null
        ? String(i.release.typicalUsedPriceBrl)
        : '',
      i.reasons.join(' | '),
    ]
    return cols.map((c) => `"${c.replace(/"/g, '""')}"`).join(',')
  })
  return [header, ...lines].join('\n')
}

export function exportGarimpoWhatsApp(
  subscriberName: string,
  items: { release: CatalogRelease; score: number; reasons: string[] }[],
): string {
  const lines = [
    `*Lista de garimpo — ${subscriberName}*`,
    '',
    ...items.map(
      (i, idx) =>
        `${idx + 1}. *${i.release.artist}* — ${i.release.album} (${i.release.year})\n` +
        `   ${i.release.styles.slice(0, 2).join(', ') || i.release.genres.join(', ')}` +
        (i.release.typicalUsedPriceBrl != null
          ? ` · ~${formatPriceBrl(i.release.typicalUsedPriceBrl)}`
          : '') +
        `\n   Por quê: ${i.reasons.slice(0, 2).join('; ')}`,
    ),
    '',
    '_Gerado no protótipo Garimpo_',
  ]
  return lines.join('\n')
}
