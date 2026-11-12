import { LEAD_SOURCES } from '../data/captacao'
import type { CollectionLead, SubscriberSellListing, WalletEntry } from '../types'

export interface CaptacaoKpis {
  leadsTotal: number
  leadsBySource: { source: string; label: string; count: number }[]
  conversionRate: number
  lotsBought: number
  avgCostPerDiscAcquired: number
  labeledExample: true
}

export function computeCaptacaoKpis(leads: CollectionLead[]): CaptacaoKpis {
  const leadsTotal = leads.length
  const lotsBought = leads.filter((l) => l.stage === 'comprado').length
  const closed = leads.filter(
    (l) => l.stage === 'comprado' || l.stage === 'perdido',
  ).length
  const conversionRate =
    closed === 0 ? 0 : Math.round((lotsBought / closed) * 1000) / 10

  const leadsBySource = LEAD_SOURCES.map((s) => ({
    source: s.id,
    label: s.label,
    count: leads.filter((l) => l.source === s.id).length,
  })).filter((x) => x.count > 0)

  const purchased = leads.filter(
    (l) => l.stage === 'comprado' && l.valuationSnapshot,
  )
  const costs = purchased
    .map((l) => l.valuationSnapshot!.avgCostPerDisc)
    .filter((n) => n > 0)
  const avgCostPerDiscAcquired =
    costs.length === 0
      ? 0
      : Math.round((costs.reduce((a, b) => a + b, 0) / costs.length) * 100) /
        100

  return {
    leadsTotal,
    leadsBySource,
    conversionRate,
    lotsBought,
    avgCostPerDiscAcquired,
    labeledExample: true,
  }
}

export interface SubscriberSellKpis {
  creditIssued: number
  creditOpen: number
  discsFromSubscribers: number
  avgCostSubscriberChannel: number
  avgCostExternalChannel: number
  labeledExample: true
}

export function computeSubscriberSellKpis(input: {
  walletEntries: WalletEntry[]
  sellListings: SubscriberSellListing[]
  leads: CollectionLead[]
}): SubscriberSellKpis {
  const creditIssued = input.walletEntries
    .filter((e) => e.type === 'credito')
    .reduce((s, e) => s + e.amount, 0)
  const creditOpen = input.walletEntries.reduce((s, e) => s + e.amount, 0)

  const received = input.sellListings.filter(
    (l) => l.status === 'recebido' || l.status === 'credito-liberado',
  )
  const discsFromSubscribers = received.reduce(
    (s, l) => s + l.offers.filter((o) => !o.rejected).length,
    0,
  )

  const subCosts: number[] = []
  for (const l of received) {
    const accepted = l.offers.filter((o) => !o.rejected)
    if (!accepted.length) continue
    const total =
      l.payoutChoice === 'dinheiro' ? l.offerTotalCash : l.offerTotalCredit
    subCosts.push(total / accepted.length)
  }
  const avgCostSubscriberChannel =
    subCosts.length === 0
      ? 0
      : Math.round(
          (subCosts.reduce((a, b) => a + b, 0) / subCosts.length) * 100,
        ) / 100

  const external = input.leads.filter(
    (l) =>
      l.stage === 'comprado' &&
      l.source !== 'assinante' &&
      l.valuationSnapshot,
  )
  const extCosts = external.map((l) => l.valuationSnapshot!.avgCostPerDisc)
  const avgCostExternalChannel =
    extCosts.length === 0
      ? 0
      : Math.round(
          (extCosts.reduce((a, b) => a + b, 0) / extCosts.length) * 100,
        ) / 100

  return {
    creditIssued: Math.round(creditIssued * 100) / 100,
    creditOpen: Math.round(Math.max(0, creditOpen) * 100) / 100,
    discsFromSubscribers,
    avgCostSubscriberChannel,
    avgCostExternalChannel,
    labeledExample: true,
  }
}
