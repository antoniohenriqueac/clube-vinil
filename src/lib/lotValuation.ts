import { seedCatalog } from '../data/seedCatalog'
import { unitEconomicsGarimpo } from './economics'
import { scoreReleaseForSourcing } from './sourcing'
import type {
  CatalogRelease,
  CatalogMode,
  ConditionGrade,
  LotLineItem,
  LotValuationSummary,
  Subscriber,
} from '../types'

const CONDITION_FACTOR: Record<ConditionGrade, number> = {
  Mint: 1.15,
  NM: 1.05,
  'VG+': 1,
  VG: 0.85,
  G: 0.65,
}

function normalize(s: string): string {
  return s
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim()
}

export function parseTitleLines(text: string): string[] {
  return text
    .split(/\r?\n|,|;|\t/)
    .map((l) => l.trim())
    .filter((l) => l.length > 2)
}

export function parseArtistAlbum(raw: string): { artist: string; album: string } {
  const cleaned = raw.replace(/^["']|["']$/g, '').trim()
  const seps = [' - ', ' – ', ' — ', ' | ', '\t']
  for (const sep of seps) {
    if (cleaned.includes(sep)) {
      const [artist, ...rest] = cleaned.split(sep)
      return { artist: artist.trim(), album: rest.join(sep).trim() }
    }
  }
  return { artist: cleaned, album: cleaned }
}

export function matchReleaseInCatalog(
  raw: string,
  catalog: CatalogRelease[],
): CatalogRelease | undefined {
  const { artist, album } = parseArtistAlbum(raw)
  const na = normalize(artist)
  const nb = normalize(album)

  let best: CatalogRelease | undefined
  let bestScore = 0
  for (const r of catalog) {
    const ra = normalize(r.artist)
    const rb = normalize(r.album)
    let s = 0
    if (ra === na && rb === nb) s = 100
    else if (ra.includes(na) && rb.includes(nb)) s = 90
    else if (na.includes(ra) && nb.includes(rb)) s = 85
    else if (rb === nb && (ra.includes(na) || na.includes(ra))) s = 80
    else if (rb.includes(nb) && ra.includes(na.split(' ')[0] ?? na)) s = 70
    else if (rb.includes(nb) || nb.includes(rb)) s = 40
    if (s > bestScore) {
      bestScore = s
      best = r
    }
  }
  return bestScore >= 40 ? best : undefined
}

export function adjustPriceByCondition(
  base: number | undefined,
  condition: ConditionGrade,
): number {
  const price = base ?? 60
  return Math.round(price * CONDITION_FACTOR[condition] * 100) / 100
}

export function subscribersMatchingRelease(
  release: CatalogRelease,
  subscribers: Subscriber[],
  minScore = 40,
): string[] {
  const ids: string[] = []
  for (const sub of subscribers.filter((s) => s.status === 'ativo')) {
    const scored = scoreReleaseForSourcing(release, sub.profile, [])
    if (scored && scored.score >= minScore) ids.push(sub.id)
  }
  return ids
}

export function valueLot(input: {
  titlesText: string
  condition: ConditionGrade | 'misto' | 'desconhecido'
  catalog: CatalogRelease[]
  subscribers: Subscriber[]
  offerPercent: number
  mode: CatalogMode
}): LotValuationSummary {
  const lines = parseTitleLines(input.titlesText)
  const defaultCondition: ConditionGrade =
    input.condition === 'misto' || input.condition === 'desconhecido'
      ? 'VG'
      : input.condition

  const items: LotLineItem[] = lines.map((raw) => {
    const release = matchReleaseInCatalog(raw, input.catalog)
    if (!release) {
      return {
        raw,
        matched: false,
        condition: defaultCondition,
        estimatedUsedPrice: 0,
        adjustedPrice: 0,
        matchingSubscriberIds: [],
      }
    }
    const estimatedUsedPrice = release.typicalUsedPriceBrl ?? 60
    const adjustedPrice = adjustPriceByCondition(
      estimatedUsedPrice,
      defaultCondition,
    )
    return {
      raw,
      matched: true,
      release,
      condition: defaultCondition,
      estimatedUsedPrice,
      adjustedPrice,
      matchingSubscriberIds: subscribersMatchingRelease(
        release,
        input.subscribers,
      ),
    }
  })

  const matched = items.filter((i) => i.matched)
  const resaleTotal =
    Math.round(matched.reduce((s, i) => s + i.adjustedPrice, 0) * 100) / 100
  const suggestedOffer =
    Math.round(resaleTotal * (input.offerPercent / 100) * 100) / 100
  const avgCostPerDisc =
    matched.length === 0
      ? 0
      : Math.round((suggestedOffer / matched.length) * 100) / 100

  const subscriberSet = new Set(
    matched.flatMap((i) => i.matchingSubscriberIds),
  )
  const discsMatchingSubscribers = matched.filter(
    (i) => i.matchingSubscriberIds.length > 0,
  ).length

  return {
    items,
    resaleTotal,
    suggestedOffer,
    offerPercent: input.offerPercent,
    avgCostPerDisc,
    targetAcquisitionCost: unitEconomicsGarimpo.aquisicaoDisco,
    discsMatchingSubscribers,
    subscribersServed: subscriberSet.size,
    matchedCount: matched.length,
    unmatchedCount: items.length - matched.length,
    mode: input.mode,
  }
}

export function defaultCatalog(): CatalogRelease[] {
  return seedCatalog
}

export function buildWhatsAppPartnerMessage(partnerName: string): string {
  return (
    `Olá, ${partnerName}! Aqui é do *Garimpo*, clube de vinil usado em BH.\n\n` +
    `Compramos *coleções inteiras* de discos (herança, mudança, inventário) com avaliação justa e retirada.\n\n` +
    `Se aparecer um lote, pode nos indicar — trabalhamos com comissão e fazemos a triagem.\n\n` +
    `Formulário rápido: ${publicSellUrl()}\n` +
    `Obrigado!`
  )
}

export function publicSellUrl(): string {
  if (typeof window === 'undefined') {
    return 'https://antoniohenriqueac.github.io/clube-vinil/#/venda-sua-colecao'
  }
  const { origin, pathname } = window.location
  // HashRouter base
  const base = pathname.endsWith('/') ? pathname : `${pathname}/`
  return `${origin}${base}#/venda-sua-colecao`
}
