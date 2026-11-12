import { seedCatalog } from '../data/seedCatalog'
import type {
  CatalogRelease,
  MusicalProfile,
  TasteProfile,
  WeightedTag,
} from '../types'
import { normalizeProfile } from '../types'

function weigh(names: string[], base = 1): WeightedTag[] {
  const map = new Map<string, number>()
  for (const n of names) {
    if (!n) continue
    map.set(n, (map.get(n) ?? 0) + base)
  }
  return [...map.entries()]
    .map(([name, weight]) => ({ name, weight }))
    .sort((a, b) => b.weight - a.weight)
}

function energyLabel(v: number): string {
  if (v < 33) return 'mais calmo'
  if (v < 66) return 'equilíbrio dançante/calmo'
  return 'mais dançante'
}

function acousticLabel(v: number): string {
  if (v < 33) return 'mais acústico'
  if (v < 66) return 'mix acústico/eletrônico'
  return 'mais eletrônico'
}

function grooveLabel(v: number): string {
  if (v < 33) return 'groove sutil'
  if (v < 66) return 'groove moderado'
  return 'groove forte'
}

function scoreExample(release: CatalogRelease, profile: MusicalProfile): number {
  let s = 0
  s += release.genres.filter((g) => profile.genres.includes(g)).length * 20
  s += release.styles.filter((st) =>
    profile.styles.some(
      (p) => p.toLowerCase() === st.toLowerCase() || st.toLowerCase().includes(p.toLowerCase()),
    ),
  ).length * 18
  if (profile.decades.includes(release.decade)) s += 14
  if (profile.favoriteArtists.some((a) =>
    release.artist.toLowerCase().includes(a.toLowerCase()) ||
    a.toLowerCase().includes(release.artist.toLowerCase()),
  )) s += 30
  s -= Math.abs(release.mood.energy - profile.energy) * 0.15
  s -= Math.abs(release.mood.acousticElectronic - profile.acousticElectronic) * 0.12
  s -= Math.abs(release.mood.groove - profile.groove) * 0.12
  return s
}

export function buildTasteProfile(
  raw: Partial<MusicalProfile> | null | undefined,
  catalog: CatalogRelease[] = seedCatalog,
): TasteProfile {
  const profile = normalizeProfile(raw)

  const topGenres = weigh(profile.genres, 2)
  const topStyles = weigh(profile.styles, 2)
  const decades = weigh(profile.decades, 2)

  const blocked = new Set(
    profile.blockedArtists.map((a) => a.toLowerCase()),
  )

  const examples = catalog
    .filter((r) => !blocked.has(r.artist.toLowerCase()))
    .map((r) => ({ r, s: scoreExample(r, profile) }))
    .filter((x) => x.s > 8)
    .sort((a, b) => b.s - a.s)
    .slice(0, 4)
    .map((x) => x.r)

  const summaryLines: string[] = []
  if (topGenres.length)
    summaryLines.push(`Estilos-base: ${topGenres.slice(0, 4).map((g) => g.name).join(', ')}`)
  if (topStyles.length)
    summaryLines.push(`Subgêneros: ${topStyles.slice(0, 4).map((g) => g.name).join(', ')}`)
  if (decades.length)
    summaryLines.push(`Décadas: ${decades.map((d) => d.name).join(', ')}`)
  summaryLines.push(`Energia: ${energyLabel(profile.energy)}`)
  summaryLines.push(`Textura: ${acousticLabel(profile.acousticElectronic)}`)
  summaryLines.push(`Batida: ${grooveLabel(profile.groove)}`)
  summaryLines.push(`${profile.discoveryLevel}% descoberta`)
  if (profile.favoriteArtists.length)
    summaryLines.push(`Ama: ${profile.favoriteArtists.slice(0, 4).join(', ')}`)
  if (profile.blockedArtists.length)
    summaryLines.push(`Evita: ${profile.blockedArtists.slice(0, 3).join(', ')}`)

  return {
    topGenres,
    topStyles,
    decades,
    energy: profile.energy,
    acousticElectronic: profile.acousticElectronic,
    groove: profile.groove,
    favoriteArtists: profile.favoriteArtists,
    blockedArtists: profile.blockedArtists,
    discoveryLevel: profile.discoveryLevel,
    exampleAlbums: examples,
    summaryLines,
  }
}

export const STYLE_SUGGESTIONS = [
  'Tropicália',
  'Samba-Rock',
  'Soul Brasileiro',
  'Bossa Nova',
  'Clube da Esquina',
  'Psychedelic',
  'Jazz-Funk',
  'Fusion',
  'Disco',
  'Neo-Soul',
  'Indie',
  'Synthpop',
  'Afrobeat',
  'Post-Punk',
  'Grunge',
  'Trip-Hop',
  'Hard Rock',
  'Folk Brasileiro',
  'Rap Brasileiro',
  'Manguebeat',
]
