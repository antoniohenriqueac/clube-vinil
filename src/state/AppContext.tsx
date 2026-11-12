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
import { buildOffersForItems } from '../lib/sellOffer'
import type {
  AppState,
  CatalogRelease,
  CollectionLead,
  DeliveryMethod,
  GarimpoListItem,
  LotValuationSummary,
  MonthPick,
  MusicalProfile,
  PayoutChoice,
  PlanId,
  RatingLabel,
  ReferralPartner,
  SellItemDraft,
  StockExtraRecord,
  Subscriber,
  SubscriberSellConfig,
  SubscriberSellListing,
  VinylRecord,
  WalletEntry,
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
  setSellConfig: (config: SubscriberSellConfig) => void
  submitSellListing: (input: {
    subscriberId: string
    items: SellItemDraft[]
  }) => SubscriberSellListing
  updateSellListing: (listing: SubscriberSellListing) => void
  generateSellOffer: (listingId: string) => void
  acceptSellOffer: (input: {
    listingId: string
    payoutChoice: PayoutChoice
    deliveryMethod: DeliveryMethod
  }) => void
  refuseSellOffer: (listingId: string) => void
  markSellReceived: (listingId: string) => void
  releaseSellCredit: (listingId: string) => void
  applyMonthlyCredit: (subscriberId: string, planPrice: number) => number
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

  const setSellConfig = useCallback((config: SubscriberSellConfig) => {
    setState((s) => ({ ...s, sellConfig: config }))
  }, [])

  const submitSellListing = useCallback(
    (input: { subscriberId: string; items: SellItemDraft[] }) => {
      const now = new Date().toISOString()
      const listing: SubscriberSellListing = {
        id: `sell-${Date.now()}`,
        subscriberId: input.subscriberId,
        status: 'enviado',
        items: input.items,
        offers: [],
        payoutChoice: null,
        deliveryMethod: null,
        adminNotes: '',
        createdAt: now,
        updatedAt: now,
        offerTotalCredit: 0,
        offerTotalCash: 0,
      }
      const sub = state.subscribers.find((x) => x.id === input.subscriberId)
      const lead: CollectionLead = {
        id: `lead-sell-${listing.id}`,
        name: sub?.name ?? 'Assinante',
        whatsapp: sub?.email ?? '—',
        neighborhood: 'Assinante',
        city: 'Belo Horizonte',
        approxCount: input.items.length,
        genresNote: '',
        artistsNote: input.items.map((i) => i.artist).join(', '),
        condition: 'misto',
        reason: 'desapego',
        titlesText: input.items
          .map((i) => `${i.artist} - ${i.album}`)
          .join('\n'),
        photoDataUrls: input.items.flatMap((i) => i.photoDataUrls),
        lgpdConsent: true,
        source: 'assinante',
        stage: 'novo',
        notes: `Origem: assinante ${input.subscriberId} · listing ${listing.id}`,
        nextStepDate: null,
        offerPercent: 30,
        createdAt: now,
        updatedAt: now,
      }
      listing.leadId = lead.id
      setState((s) => ({
        ...s,
        sellListings: [listing, ...s.sellListings],
        collectionLeads: [lead, ...s.collectionLeads],
      }))
      return listing
    },
    [state.subscribers],
  )

  const updateSellListing = useCallback((listing: SubscriberSellListing) => {
    setState((s) => ({
      ...s,
      sellListings: s.sellListings.map((l) =>
        l.id === listing.id
          ? { ...listing, updatedAt: new Date().toISOString() }
          : l,
      ),
    }))
  }, [])

  const generateSellOffer = useCallback((listingId: string) => {
    setState((s) => {
      const listing = s.sellListings.find((l) => l.id === listingId)
      if (!listing) return s
      const { offers, totalCredit, totalCash } = buildOffersForItems({
        items: listing.items,
        config: s.sellConfig,
        garimpoList: s.garimpoList,
        subscribers: s.subscribers,
      })
      const updated: SubscriberSellListing = {
        ...listing,
        status: 'oferta',
        offers,
        offerTotalCredit: totalCredit,
        offerTotalCash: totalCash,
        updatedAt: new Date().toISOString(),
      }
      const leads = s.collectionLeads.map((lead) =>
        lead.id === listing.leadId
          ? {
              ...lead,
              stage: 'proposta' as const,
              notes:
                lead.notes +
                `\n[Oferta gerada] crédito ${totalCredit} / dinheiro ${totalCash}`,
              updatedAt: new Date().toISOString(),
            }
          : lead,
      )
      return {
        ...s,
        sellListings: s.sellListings.map((l) =>
          l.id === listingId ? updated : l,
        ),
        collectionLeads: leads,
      }
    })
  }, [])

  const acceptSellOffer = useCallback(
    (input: {
      listingId: string
      payoutChoice: PayoutChoice
      deliveryMethod: DeliveryMethod
    }) => {
      setState((s) => ({
        ...s,
        sellListings: s.sellListings.map((l) =>
          l.id === input.listingId
            ? {
                ...l,
                status: 'aceito',
                payoutChoice: input.payoutChoice,
                deliveryMethod: input.deliveryMethod,
                updatedAt: new Date().toISOString(),
              }
            : l,
        ),
        collectionLeads: s.collectionLeads.map((lead) => {
          const listing = s.sellListings.find((x) => x.id === input.listingId)
          if (!listing || lead.id !== listing.leadId) return lead
          return {
            ...lead,
            stage: 'visita',
            notes:
              lead.notes +
              `\n[Aceito] payout=${input.payoutChoice} · entrega=${input.deliveryMethod}`,
            updatedAt: new Date().toISOString(),
          }
        }),
      }))
    },
    [],
  )

  const refuseSellOffer = useCallback((listingId: string) => {
    setState((s) => ({
      ...s,
      sellListings: s.sellListings.map((l) =>
        l.id === listingId
          ? {
              ...l,
              status: 'recusado',
              updatedAt: new Date().toISOString(),
            }
          : l,
      ),
      collectionLeads: s.collectionLeads.map((lead) => {
        const listing = s.sellListings.find((x) => x.id === listingId)
        if (!listing || lead.id !== listing.leadId) return lead
        return {
          ...lead,
          stage: 'perdido',
          updatedAt: new Date().toISOString(),
        }
      }),
    }))
  }, [])

  const markSellReceived = useCallback((listingId: string) => {
    setState((s) => {
      const listing = s.sellListings.find((l) => l.id === listingId)
      if (!listing) return s
      const accepted = listing.offers.filter((o) => !o.rejected)
      const payoutTotal =
        listing.payoutChoice === 'dinheiro'
          ? listing.offerTotalCash
          : listing.offerTotalCredit
      const costEach =
        accepted.length === 0 ? 0 : payoutTotal / accepted.length

      const extras: StockExtraRecord[] = accepted.map((offer, idx) => {
        const year = offer.release?.year ?? 1975
        return {
          id: `sell-acq-${listingId}-${idx}`,
          artist: offer.artist,
          album: offer.album,
          year,
          decade: decadeFromYear(year),
          genres: offer.release?.genres ?? ['MPB'],
          condition: offer.condition,
          cost: Math.round(costEach * 100) / 100,
          source: 'colecao-inteira',
          story: `Comprado de assinante (${listing.subscriberId}) via crédito/dinheiro.`,
          coverHue: (year * 13 + idx * 29) % 360,
          coverPattern: (['radial', 'stripes', 'blocks', 'waves', 'dots'] as const)[
            idx % 5
          ],
          valueTier: costEach > 40 ? 3 : costEach > 25 ? 2 : 1,
          inStock: true,
          fromLeadId: listing.leadId,
          fromSellListingId: listing.id,
        }
      })

      return {
        ...s,
        stockExtras: [...s.stockExtras, ...extras],
        sellListings: s.sellListings.map((l) =>
          l.id === listingId
            ? {
                ...l,
                status: 'recebido',
                updatedAt: new Date().toISOString(),
              }
            : l,
        ),
        collectionLeads: s.collectionLeads.map((lead) =>
          lead.id === listing.leadId
            ? {
                ...lead,
                stage: 'comprado',
                purchasedAt: new Date().toISOString(),
                purchasedRecordIds: extras.map((e) => e.id),
                updatedAt: new Date().toISOString(),
              }
            : lead,
        ),
      }
    })
  }, [])

  const releaseSellCredit = useCallback((listingId: string) => {
    setState((s) => {
      const listing = s.sellListings.find((l) => l.id === listingId)
      if (!listing || listing.payoutChoice !== 'credito') {
        return {
          ...s,
          sellListings: s.sellListings.map((l) =>
            l.id === listingId
              ? {
                  ...l,
                  status: 'credito-liberado',
                  updatedAt: new Date().toISOString(),
                }
              : l,
          ),
        }
      }
      const entry: WalletEntry = {
        id: `w-${Date.now()}`,
        subscriberId: listing.subscriberId,
        type: 'credito',
        amount: listing.offerTotalCredit,
        label: `Crédito pela venda de ${listing.offers.filter((o) => !o.rejected).length} disco(s)`,
        listingId: listing.id,
        createdAt: new Date().toISOString(),
      }
      return {
        ...s,
        walletEntries: [entry, ...s.walletEntries],
        sellListings: s.sellListings.map((l) =>
          l.id === listingId
            ? {
                ...l,
                status: 'credito-liberado',
                updatedAt: new Date().toISOString(),
              }
            : l,
        ),
      }
    })
  }, [])

  const applyMonthlyCredit = useCallback(
    (subscriberId: string, planPrice: number) => {
      let applied = 0
      setState((s) => {
        const balance = s.walletEntries
          .filter((e) => e.subscriberId === subscriberId)
          .reduce((sum, e) => sum + e.amount, 0)
        applied = Math.min(Math.max(0, balance), planPrice)
        if (applied <= 0) return s
        const entry: WalletEntry = {
          id: `w-abat-${Date.now()}`,
          subscriberId,
          type: 'abatimento',
          amount: -applied,
          label: `Abatimento mensalidade (${planPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })})`,
          createdAt: new Date().toISOString(),
        }
        return { ...s, walletEntries: [entry, ...s.walletEntries] }
      })
      return applied
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
    setSellConfig,
    submitSellListing,
    updateSellListing,
    generateSellOffer,
    acceptSellOffer,
    refuseSellOffer,
    markSellReceived,
    releaseSellCredit,
    applyMonthlyCredit,
    resetDemo,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
