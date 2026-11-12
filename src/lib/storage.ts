import { seedSubscribers } from '../data/subscribers'
import type { AppState, MonthPick, MusicalProfile, PlanId, Subscriber } from '../types'

const KEY = 'garimpo-app-state-v1'

const defaultState = (): AppState => ({
  sessionSubscriberId: null,
  onboardingDraft: null,
  selectedPlanId: null,
  monthPicks: [],
  subscribers: structuredClone(seedSubscribers),
  stockOverrides: {},
})

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return defaultState()
    const parsed = JSON.parse(raw) as AppState
    return {
      ...defaultState(),
      ...parsed,
      subscribers: parsed.subscribers?.length
        ? parsed.subscribers
        : structuredClone(seedSubscribers),
    }
  } catch {
    return defaultState()
  }
}

export function saveState(state: AppState): void {
  localStorage.setItem(KEY, JSON.stringify(state))
}

export function resetState(): AppState {
  const state = defaultState()
  saveState(state)
  return state
}

export function upsertSubscriber(
  state: AppState,
  subscriber: Subscriber,
): AppState {
  const idx = state.subscribers.findIndex((s) => s.id === subscriber.id)
  const subscribers = [...state.subscribers]
  if (idx >= 0) subscribers[idx] = subscriber
  else subscribers.push(subscriber)
  return { ...state, subscribers }
}

export function createSubscriberFromOnboarding(input: {
  name: string
  email: string
  planId: PlanId
  profile: MusicalProfile
}): Subscriber {
  return {
    id: `sub-${Date.now()}`,
    name: input.name,
    email: input.email,
    planId: input.planId,
    profile: input.profile,
    status: 'ativo',
    joinedAt: new Date().toISOString().slice(0, 10),
    deliveries: [],
    currentPickIds: [],
  }
}

export function setMonthPicks(state: AppState, picks: MonthPick[]): AppState {
  return { ...state, monthPicks: picks }
}
