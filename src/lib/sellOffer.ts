import { seedCatalog } from '../data/seedCatalog'
import { adjustPriceByCondition, matchReleaseInCatalog } from './lotValuation'
import type {
  CatalogRelease,
  ConditionGrade,
  GarimpoListItem,
  SellItemDraft,
  SellItemOffer,
  Subscriber,
  SubscriberSellConfig,
} from '../types'
import { defaultSellConfig } from '../data/subscriberSell'

function normalize(s: string): string {
  return s
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim()
}

function inDemand(
  artist: string,
  album: string,
  garimpoList: GarimpoListItem[],
  subscribers: Subscriber[],
): boolean {
  const keyA = normalize(artist)
  const keyB = normalize(album)
  for (const g of garimpoList) {
    if (
      normalize(g.release.artist).includes(keyA) ||
      keyA.includes(normalize(g.release.artist))
    ) {
      if (
        normalize(g.release.album).includes(keyB) ||
        keyB.includes(normalize(g.release.album))
      ) {
        return true
      }
    }
  }
  // Demand if any active subscriber lists the artist as favorite
  return subscribers.some(
    (s) =>
      s.status === 'ativo' &&
      s.profile.favoriteArtists.some(
        (a) => normalize(a).includes(keyA) || keyA.includes(normalize(a)),
      ),
  )
}

export function buildOffersForItems(input: {
  items: SellItemDraft[]
  catalog?: CatalogRelease[]
  config?: SubscriberSellConfig
  garimpoList: GarimpoListItem[]
  subscribers: Subscriber[]
}): { offers: SellItemOffer[]; totalCredit: number; totalCash: number } {
  const catalog = input.catalog ?? seedCatalog
  const config = input.config ?? defaultSellConfig
  const offers: SellItemOffer[] = []

  for (const item of input.items) {
    const raw = `${item.artist} - ${item.album}`
    const release = matchReleaseInCatalog(raw, catalog)
    const base = release?.typicalUsedPriceBrl ?? 60
    const marketValue = adjustPriceByCondition(base, item.condition)
    const demand = inDemand(
      item.artist,
      item.album,
      input.garimpoList,
      input.subscribers,
    )

    if (marketValue < config.minMarketValue) {
      offers.push({
        itemId: item.id,
        artist: item.artist,
        album: item.album,
        condition: item.condition,
        marketValue,
        creditOffer: 0,
        cashOffer: 0,
        demandBonus: 0,
        rejected: true,
        rejectReason: `Abaixo do mínimo de R$ ${config.minMarketValue.toFixed(0)}`,
        inDemand: demand,
        release,
      })
      continue
    }

    let creditPct = config.creditPercent
    let cashPct = config.cashPercent
    let demandBonus = 0
    if (demand) {
      demandBonus = config.demandBonusPercent
      creditPct += config.demandBonusPercent
      cashPct += Math.round(config.demandBonusPercent / 2)
    }

    const creditOffer =
      Math.round(marketValue * (creditPct / 100) * 100) / 100
    const cashOffer = Math.round(marketValue * (cashPct / 100) * 100) / 100

    offers.push({
      itemId: item.id,
      artist: item.artist,
      album: item.album,
      condition: item.condition as ConditionGrade,
      marketValue,
      creditOffer,
      cashOffer,
      demandBonus,
      rejected: false,
      inDemand: demand,
      release,
    })
  }

  const accepted = offers.filter((o) => !o.rejected)
  const totalCredit =
    Math.round(accepted.reduce((s, o) => s + o.creditOffer, 0) * 100) / 100
  const totalCash =
    Math.round(accepted.reduce((s, o) => s + o.cashOffer, 0) * 100) / 100

  return { offers, totalCredit, totalCash }
}

export function walletBalance(
  entries: { subscriberId: string; amount: number }[],
  subscriberId: string,
): number {
  return (
    Math.round(
      entries
        .filter((e) => e.subscriberId === subscriberId)
        .reduce((s, e) => s + e.amount, 0) * 100,
    ) / 100
  )
}

export function nextPaymentWithCredit(input: {
  planPrice: number
  creditBalance: number
}): { due: number; creditApplied: number; remainingCredit: number } {
  const creditApplied = Math.min(input.creditBalance, input.planPrice)
  const due =
    Math.round((input.planPrice - creditApplied) * 100) / 100
  const remainingCredit =
    Math.round((input.creditBalance - creditApplied) * 100) / 100
  return { due, creditApplied, remainingCredit }
}
