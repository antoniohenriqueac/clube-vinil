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
  saveState,
} from '../lib/storage'
import type {
  AppState,
  MonthPick,
  MusicalProfile,
  PlanId,
  RatingLabel,
  Subscriber,
  VinylRecord,
} from '../types'

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
  resetDemo: () => void
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(() => loadState())

  useEffect(() => {
    saveState(state)
  }, [state])

  const stock = useMemo(() => {
    return baseRecords.map((r) => ({
      ...r,
      ...(state.stockOverrides[r.id] ?? {}),
    }))
  }, [state.stockOverrides])

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
      const subscriber = createSubscriberFromOnboarding(input)
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
        x.id === subscriber.id ? subscriber : x,
      ),
    }))
  }, [])

  const rateCurrentDisc = useCallback(
    (input: { recordId: string; stars: number; label: RatingLabel }) => {
      setState((s) => {
        const sub = s.subscribers.find((x) => x.id === s.sessionSubscriberId)
        if (!sub) return s
        const month = new Date().toISOString().slice(0, 7)
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
      // mark stock as reserved (out of stock) for confirmed picks
      const stockOverrides = { ...s.stockOverrides }
      for (const id of pick.recordIds) {
        stockOverrides[id] = { ...(stockOverrides[id] ?? {}), inStock: false }
      }
      return { ...s, monthPicks, subscribers, stockOverrides }
    })
  }, [])

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
    resetDemo,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
