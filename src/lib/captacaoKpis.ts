import { LEAD_SOURCES } from '../data/captacao'
import type { CollectionLead } from '../types'

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
    closed === 0
      ? 0
      : Math.round((lotsBought / closed) * 1000) / 10

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
      : Math.round(
          (costs.reduce((a, b) => a + b, 0) / costs.length) * 100,
        ) / 100

  return {
    leadsTotal,
    leadsBySource,
    conversionRate,
    lotsBought,
    avgCostPerDiscAcquired,
    labeledExample: true,
  }
}
