import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { records as baseRecords } from '../data/records'
import {
  createSubscriberFromOnboarding,
  loadState,
  persistDiscogsToken,
  saveState,
} from '../lib/storage'
import type {
  AppState,
  CatalogRelease,
  CollectionLead,
  GarimpoListItem,
  LotValuationSummary,
  MonthPick,
  MusicalProfile,
  PlanId,
  RatingLabel,
  ReferralPartner,
  StockExtraRecord,
  Subscriber,
  VinylRecord,
} from '../types'
import { normalizeProfile } from '../types'

interface AppContextValue {
  state: AppState
  stock: VinylRecord[]
  sessionSubscriber: Subscriber | null
  setOnboardingDraft: (draft: Partial<MusicalProfile> | null) => void
  setSelectedPlan: (planId: PlanId | null) => void
  completeCheckout: (input: {
    name: string
    email: string
    planId: PlanId
    profile: MusicalProfile
  }) => Subscriber
  loginAs: (subscriberId: string) => void
  logout: () => void
  updateSubscriber: (subscriber: Subscriber) => void
  rateCurrentDisc: (input: {
    recordId: string
    stars: number
    label: RatingLabel
  }) => void
  setMonthPicks: (picks: MonthPick[]) => void
  confirmPicks: (subscriberId: string) => void
  setDiscogsToken: (token: string | null) => void
  addToGarimpoList: (input: {
    subscriberId: string
    release: CatalogRelease
    score: number
    reasons: string[]
  }) => void
  removeFromGarimpoList: (id: string) => void
  clearGarimpoList: (subscriberId?: string) => void
  addCollectionLead: (lead: CollectionLead) => void
  updateCollectionLead: (lead: CollectionLead) => void
  upsertPartner: (partner: ReferralPartner) => void
  removePartner: (id: string) => void
  purchaseLeadIntoStock: (input: {
    leadId: string
    valuation: LotValuationSummary
  }) => void
  resetDemo: () => void
}

const AppContext = createContext<AppContextValue | null>(null)

function decadeFromYear(year: number): VinylRecord['decade'] {
  if (year < 1970) return '60s'
  if (year < 1980) return '70s'
  if (year < 1990) return '80s'
  if (year < 2000) return '90s'
  if (year < 2010) return '00s'
  if (year < 2020) return '10s'
  return '20s'
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(() => loadState())

  useEffect(() => {
    saveState(state)
  }, [state])

  const stock = useMemo(() => {
    const base = baseRecords.map((r) => ({
      ...r,
      ...(state.stockOverrides[r.id] ?? {}),
    }))
    return [...base, ...state.stockExtras]
  }, [state.stockOverrides, state.stockExtras])

  const sessionSubscriber = useMemo(
    () =>
      state.subscribers.find((s) => s.id === state.sessionSubscriberId) ??
      null,
    [state.subscribers, state.sessionSubscriberId],
  )

  const setOnboardingDraft = useCallback(
    (draft: Partial<MusicalProfile> | null) => {
      setState((s) => ({ ...s, onboardingDraft: draft }))
    },
    [],
  )

  const setSelectedPlan = useCallback((planId: PlanId | null) => {
    setState((s) => ({ ...s, selectedPlanId: planId }))
  }, [])

  const completeCheckout = useCallback(
    (input: {
      name: string
      email: string
      planId: PlanId
      profile: MusicalProfile
    }) => {
      const subscriber = createSubscriberFromOnboarding({
        ...input,
        profile: normalizeProfile(input.profile),
      })
      setState((s) => ({
        ...s,
        subscribers: [...s.subscribers, subscriber],
        sessionSubscriberId: subscriber.id,
        selectedPlanId: input.planId,
        onboardingDraft: null,
      }))
      return subscriber
    },
    [],
  )

  const loginAs = useCallback((subscriberId: string) => {
    setState((s) => ({ ...s, sessionSubscriberId: subscriberId }))
  }, [])

  const logout = useCallback(() => {
    setState((s) => ({ ...s, sessionSubscriberId: null }))
  }, [])

  const updateSubscriber = useCallback((subscriber: Subscriber) => {
    setState((s) => ({
      ...s,
      subscribers: s.subscribers.map((x) =>
        x.id === subscriber.id
          ? { ...subscriber, profile: normalizeProfile(subscriber.profile) }
          : x,
      ),
    }))
  }, [])

  const rateCurrentDisc = useCallback(
    (input: { recordId: string; stars: number; label: RatingLabel }) => {
      setState((s) => {
        const sub = s.subscribers.find((x) => x.id === s.sessionSubscriberId)
        if (!sub) return s
        const month = new Date().toISOString().slice(0, 10).slice(0, 7)
        let deliveries = [...sub.deliveries]
        const existingIdx = deliveries.findIndex((d) => d.month === month)
        const feedbackEntry = {
          recordId: input.recordId,
          stars: input.stars,
          label: input.label,
          month,
        }
        if (existingIdx >= 0) {
          const d = { ...deliveries[existingIdx] }
          const fb = [...(d.feedback ?? [])]
          const fi = fb.findIndex((f) => f.recordId === input.recordId)
          if (fi >= 0) fb[fi] = feedbackEntry
          else fb.push(feedbackEntry)
          d.feedback = fb
          deliveries[existingIdx] = d
        } else {
          deliveries = [
            ...deliveries,
            {
              month,
              recordIds: sub.currentPickIds.length
                ? sub.currentPickIds
                : [input.recordId],
              status: 'enviado',
              feedback: [feedbackEntry],
            },
          ]
        }
        const updated = { ...sub, deliveries }
        return {
          ...s,
          subscribers: s.subscribers.map((x) =>
            x.id === updated.id ? updated : x,
          ),
        }
      })
    },
    [],
  )

  const setMonthPicks = useCallback((picks: MonthPick[]) => {
    setState((s) => ({ ...s, monthPicks: picks }))
  }, [])

  const confirmPicks = useCallback((subscriberId: string) => {
    setState((s) => {
      const pick = s.monthPicks.find((p) => p.subscriberId === subscriberId)
      if (!pick) return s
      const monthPicks = s.monthPicks.map((p) =>
        p.subscriberId === subscriberId ? { ...p, confirmed: true } : p,
      )
      const subscribers = s.subscribers.map((sub) => {
        if (sub.id !== subscriberId) return sub
        return { ...sub, currentPickIds: pick.recordIds }
      })
      const stockOverrides = { ...s.stockOverrides }
      for (const id of pick.recordIds) {
        stockOverrides[id] = { ...(stockOverrides[id] ?? {}), inStock: false }
      }
      return { ...s, monthPicks, subscribers, stockOverrides }
    })
  }, [])

  const setDiscogsToken = useCallback((token: string | null) => {
    persistDiscogsToken(token)
    setState((s) => ({ ...s, discogsToken: token }))
  }, [])

  const addToGarimpoList = useCallback(
    (input: {
      subscriberId: string
      release: CatalogRelease
      score: number
      reasons: string[]
    }) => {
      const id = `${input.subscriberId}:${input.release.id}`
      const item: GarimpoListItem = {
        id,
        subscriberId: input.subscriberId,
        release: input.release,
        score: input.score,
        reasons: input.reasons,
        addedAt: new Date().toISOString(),
      }
      setState((s) => {
        if (s.garimpoList.some((x) => x.id === id)) return s
        return { ...s, garimpoList: [...s.garimpoList, item] }
      })
    },
    [],
  )

  const removeFromGarimpoList = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      garimpoList: s.garimpoList.filter((x) => x.id !== id),
    }))
  }, [])

  const clearGarimpoList = useCallback((subscriberId?: string) => {
    setState((s) => ({
      ...s,
      garimpoList: subscriberId
        ? s.garimpoList.filter((x) => x.subscriberId !== subscriberId)
        : [],
    }))
  }, [])

  const addCollectionLead = useCallback((lead: CollectionLead) => {
    setState((s) => ({
      ...s,
      collectionLeads: [lead, ...s.collectionLeads],
    }))
  }, [])

  const updateCollectionLead = useCallback((lead: CollectionLead) => {
    setState((s) => ({
      ...s,
      collectionLeads: s.collectionLeads.map((l) =>
        l.id === lead.id ? { ...lead, updatedAt: new Date().toISOString() } : l,
      ),
    }))
  }, [])

  const upsertPartner = useCallback((partner: ReferralPartner) => {
    setState((s) => {
      const exists = s.referralPartners.some((p) => p.id === partner.id)
      return {
        ...s,
        referralPartners: exists
          ? s.referralPartners.map((p) =>
              p.id === partner.id ? partner : p,
            )
          : [...s.referralPartners, partner],
      }
    })
  }, [])

  const removePartner = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      referralPartners: s.referralPartners.filter((p) => p.id !== id),
    }))
  }, [])

  const purchaseLeadIntoStock = useCallback(
    (input: { leadId: string; valuation: LotValuationSummary }) => {
      setState((s) => {
        const lead = s.collectionLeads.find((l) => l.id === input.leadId)
        if (!lead) return s
        const matched = input.valuation.items.filter((i) => i.matched && i.release)
        const costEach =
          matched.length === 0
            ? input.valuation.avgCostPerDisc
            : input.valuation.suggestedOffer / matched.length

        const extras: StockExtraRecord[] = matched.map((item, idx) => {
          const r = item.release!
          const id = `acq-${input.leadId}-${idx}-${Date.now()}`
          return {
            id,
            artist: r.artist,
            album: r.album,
            year: r.year,
            decade: decadeFromYear(r.year),
            genres: r.genres,
            condition: item.condition,
            cost: Math.round(costEach * 100) / 100,
            source: 'colecao-inteira',
            story: `Adquirido no lote de ${lead.name} (${lead.neighborhood}).`,
            coverHue: (r.year * 17 + idx * 23) % 360,
            coverPattern: (['radial', 'stripes', 'blocks', 'waves', 'dots'] as const)[
              idx % 5
            ],
            valueTier: costEach > 40 ? 3 : costEach > 25 ? 2 : 1,
            inStock: true,
            fromLeadId: lead.id,
          }
        })

        const purchasedRecordIds = extras.map((e) => e.id)
        const updatedLead: CollectionLead = {
          ...lead,
          stage: 'comprado',
          purchasedAt: new Date().toISOString(),
          purchasedRecordIds,
          valuationSnapshot: input.valuation,
          updatedAt: new Date().toISOString(),
          notes:
            lead.notes +
            `\n[Comprado] Oferta ${input.valuation.suggestedOffer.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} · ${matched.length} discos no estoque.`,
        }

        return {
          ...s,
          stockExtras: [...s.stockExtras, ...extras],
          collectionLeads: s.collectionLeads.map((l) =>
            l.id === lead.id ? updatedLead : l,
          ),
        }
      })
    },
    [],
  )

  const resetDemo = useCallback(() => {
    localStorage.removeItem('garimpo-app-state-v1')
    setState(loadState())
  }, [])

  const value: AppContextValue = {
    state,
    stock,
    sessionSubscriber,
    setOnboardingDraft,
    setSelectedPlan,
    completeCheckout,
    loginAs,
    logout,
    updateSubscriber,
    rateCurrentDisc,
    setMonthPicks,
    confirmPicks,
    setDiscogsToken,
    addToGarimpoList,
    removeFromGarimpoList,
    clearGarimpoList,
    addCollectionLead,
    updateCollectionLead,
    upsertPartner,
    removePartner,
    purchaseLeadIntoStock,
    resetDemo,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
