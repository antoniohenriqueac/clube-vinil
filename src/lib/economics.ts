import { plans } from '../data/plans'
import { records } from '../data/records'
import type { Subscriber } from '../types'

/** Unit economics hypothesis for Garimpo plan — example data for the pilot. */
export const unitEconomicsGarimpo = {
  receita: 89.9,
  aquisicaoDisco: 25,
  limpezaPreparacao: 5,
  embalagem: 5,
  pagamentoPlataforma: 4,
  outros: 8,
  get contribuicao() {
    return (
      this.receita -
      this.aquisicaoDisco -
      this.limpezaPreparacao -
      this.embalagem -
      this.pagamentoPlataforma -
      this.outros
    )
  },
  notas:
    'Frete, impostos, marketing e custos fixos não incluídos. Dados de exemplo do piloto.',
}

export interface PilotKpis {
  subscribersActive: number
  subscribersTotal: number
  retentionRate: number
  avgSatisfaction: number
  qualityIssueRate: number
  marginPerDisc: number
  estimatedCac: number
  labeledExample: true
}

export function computePilotKpis(subscribers: Subscriber[]): PilotKpis {
  const total = subscribers.length
  const active = subscribers.filter((s) => s.status === 'ativo').length
  const pausedOrActive = subscribers.filter(
    (s) => s.status === 'ativo' || s.status === 'pausado',
  ).length
  const retentionRate =
    total === 0 ? 0 : Math.round((pausedOrActive / total) * 1000) / 10

  const allFeedback = subscribers.flatMap((s) =>
    s.deliveries.flatMap((d) => d.feedback ?? []),
  )
  const avgSatisfaction =
    allFeedback.length === 0
      ? 0
      : Math.round(
          (allFeedback.reduce((sum, f) => sum + f.stars, 0) /
            allFeedback.length) *
            10,
        ) / 10

  const qualityIssues = allFeedback.filter(
    (f) => f.stars <= 2 || f.label === 'nao-curti',
  ).length
  const qualityIssueRate =
    allFeedback.length === 0
      ? 0
      : Math.round((qualityIssues / allFeedback.length) * 1000) / 10

  const avgCost =
    records.reduce((s, r) => s + r.cost, 0) / Math.max(records.length, 1)
  const marginPerDisc =
    Math.round(
      (unitEconomicsGarimpo.receita -
        avgCost -
        unitEconomicsGarimpo.limpezaPreparacao -
        unitEconomicsGarimpo.embalagem -
        unitEconomicsGarimpo.pagamentoPlataforma -
        unitEconomicsGarimpo.outros) *
        100,
    ) / 100

  // Mock CAC derived from small pilot spend hypothesis
  const estimatedCac = 45

  return {
    subscribersActive: active,
    subscribersTotal: total,
    retentionRate,
    avgSatisfaction,
    qualityIssueRate,
    marginPerDisc,
    estimatedCac,
    labeledExample: true,
  }
}

export function mrrFromSubscribers(subscribers: Subscriber[]): number {
  return subscribers
    .filter((s) => s.status === 'ativo')
    .reduce((sum, s) => {
      const plan = plans.find((p) => p.id === s.planId)
      return sum + (plan?.price ?? 0)
    }, 0)
}
