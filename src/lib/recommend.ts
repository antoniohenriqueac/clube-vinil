import { getPlan } from '../data/plans'
import { records as allRecords } from '../data/records'
import type {
  MusicalProfile,
  PlanId,
  Subscriber,
  VinylRecord,
} from '../types'

export interface ScoredRecord {
  record: VinylRecord
  score: number
  reasons: string[]
}

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

export function getDeliveredRecordIds(sub: Subscriber): Set<string> {
  const ids = new Set<string>()
  for (const d of sub.deliveries) {
    for (const id of d.recordIds) ids.add(id)
  }
  for (const id of sub.currentPickIds) ids.add(id)
  return ids
}

export function scoreRecordForProfile(
  record: VinylRecord,
  profile: MusicalProfile,
  planId: PlanId,
  delivered: Set<string>,
): ScoredRecord | null {
  if (!record.inStock) return null
  if (delivered.has(record.id)) return null

  const blocked = profile.blockedArtists.some((a) =>
    artistMatch(a, record.artist),
  )
  if (blocked) return null

  const plan = getPlan(planId)
  if (!plan) return null
  if (record.valueTier < plan.valueTierMin) {
    // still allow but penalize heavily later via score
  }

  let score = 0
  const reasons: string[] = []

  const genreHits = record.genres.filter((g) => profile.genres.includes(g))
  if (genreHits.length) {
    score += genreHits.length * 18
    reasons.push(`Gênero: ${genreHits.join(', ')}`)
  }

  if (profile.decades.includes(record.decade)) {
    score += 14
    reasons.push(`Década ${record.decade}`)
  }

  const favArtist = profile.favoriteArtists.some((a) =>
    artistMatch(a, record.artist),
  )
  if (favArtist) {
    const discovery = profile.discoveryLevel / 100
    const boost = Math.round(28 * (1 - discovery * 0.55))
    score += boost
    reasons.push('Artista favorito')
  } else {
    const discovery = profile.discoveryLevel / 100
    score += Math.round(10 * discovery)
    if (discovery >= 0.5) reasons.push('Descoberta alinhada ao perfil')
  }

  const favAlbum = profile.favoriteAlbums.some(
    (a) => normalize(a) === normalize(record.album),
  )
  if (favAlbum) {
    score += 8
    reasons.push('Álbum citado no onboarding')
  }

  if (plan.valueTierMin > 1 && record.valueTier >= plan.valueTierMin) {
    score += 12
    reasons.push('Faixa de valor do plano')
  } else if (record.valueTier < plan.valueTierMin) {
    score -= 20
  }

  if (plan.prefersSpecial && record.specialEdition) {
    score += 15
    reasons.push('Edição especial')
  }

  const conditionBonus: Record<string, number> = {
    Mint: 8,
    NM: 6,
    'VG+': 4,
    VG: 2,
    G: 0,
  }
  score += conditionBonus[record.condition] ?? 0

  // Mild cost efficiency preference for entry plan
  if (planId === 'garimpo' && record.cost <= 25) score += 4

  return { record, score, reasons }
}

export function recommendForSubscriber(
  sub: Subscriber,
  stock: VinylRecord[] = allRecords,
  excludeIds: Set<string> = new Set(),
): ScoredRecord[] {
  const delivered = getDeliveredRecordIds(sub)
  for (const id of excludeIds) delivered.add(id)

  const scored: ScoredRecord[] = []
  for (const record of stock) {
    const result = scoreRecordForProfile(
      record,
      sub.profile,
      sub.planId,
      delivered,
    )
    if (result) scored.push(result)
  }

  return scored.sort((a, b) => b.score - a.score)
}

export function pickForSubscriber(
  sub: Subscriber,
  stock: VinylRecord[] = allRecords,
  alreadyTaken: Set<string> = new Set(),
): ScoredRecord[] {
  const plan = getPlan(sub.planId)
  const count = plan?.discsPerMonth ?? 1
  const ranked = recommendForSubscriber(sub, stock, alreadyTaken)
  return ranked.slice(0, count)
}

export function summarizeProfile(profile: MusicalProfile): string[] {
  const lines: string[] = []
  if (profile.genres.length)
    lines.push(`Gêneros: ${profile.genres.join(', ')}`)
  if (profile.decades.length)
    lines.push(`Décadas: ${profile.decades.join(', ')}`)
  if (profile.favoriteArtists.length)
    lines.push(`Artistas: ${profile.favoriteArtists.join(', ')}`)
  if (profile.blockedArtists.length)
    lines.push(`Evitar: ${profile.blockedArtists.join(', ')}`)
  lines.push(
    `Descoberta × familiar: ${profile.discoveryLevel}% descoberta`,
  )
  if (profile.hasTurntable === true) lines.push('Tem toca-discos')
  if (profile.hasTurntable === false) lines.push('Ainda sem toca-discos')
  return lines
}
