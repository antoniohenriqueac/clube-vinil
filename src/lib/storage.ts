import { seedLeads, seedPartners } from '../data/captacao'
import { seedSubscribers } from '../data/subscribers'
import type {
  AppState,
  CollectionLead,
  GarimpoListItem,
  MonthPick,
  MusicalProfile,
  PlanId,
  ReferralPartner,
  StockExtraRecord,
  Subscriber,
} from '../types'
import { normalizeProfile } from '../types'

const KEY = 'garimpo-app-state-v1'
const TOKEN_KEY = 'garimpo-discogs-token'

const defaultState = (): AppState => ({
  sessionSubscriberId: null,
  onboardingDraft: null,
  selectedPlanId: null,
  monthPicks: [],
  subscribers: structuredClone(seedSubscribers).map((s) => ({
    ...s,
    profile: normalizeProfile(s.profile),
  })),
  stockOverrides: {},
  stockExtras: [],
  garimpoList: [],
  discogsToken: loadStoredToken(),
  collectionLeads: structuredClone(seedLeads),
  referralPartners: structuredClone(seedPartners),
})

function loadStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function persistDiscogsToken(token: string | null): void {
  if (!token) localStorage.removeItem(TOKEN_KEY)
  else localStorage.setItem(TOKEN_KEY, token)
}

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return defaultState()
    const parsed = JSON.parse(raw) as Partial<AppState>
    const base = defaultState()
    const subscribers = (parsed.subscribers?.length
      ? parsed.subscribers
      : base.subscribers
    ).map((s) => ({ ...s, profile: normalizeProfile(s.profile) }))
    return {
      ...base,
      ...parsed,
      subscribers,
      stockExtras: parsed.stockExtras ?? [],
      garimpoList: parsed.garimpoList ?? [],
      discogsToken: parsed.discogsToken ?? loadStoredToken(),
      collectionLeads: parsed.collectionLeads?.length
        ? parsed.collectionLeads
        : structuredClone(seedLeads),
      referralPartners: parsed.referralPartners?.length
        ? parsed.referralPartners
        : structuredClone(seedPartners),
    }
  } catch {
    return defaultState()
  }
}

export function saveState(state: AppState): void {
  localStorage.setItem(KEY, JSON.stringify(state))
  persistDiscogsToken(state.discogsToken)
}

export function resetState(): AppState {
  const state = defaultState()
  saveState(state)
  return state
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
    profile: normalizeProfile(input.profile),
    status: 'ativo',
    joinedAt: new Date().toISOString().slice(0, 10),
    deliveries: [],
    currentPickIds: [],
  }
}

export function setMonthPicks(state: AppState, picks: MonthPick[]): AppState {
  return { ...state, monthPicks: picks }
}

export function addGarimpoItem(
  state: AppState,
  item: GarimpoListItem,
): AppState {
  if (state.garimpoList.some((x) => x.id === item.id)) return state
  return { ...state, garimpoList: [...state.garimpoList, item] }
}

export function removeGarimpoItem(state: AppState, id: string): AppState {
  return {
    ...state,
    garimpoList: state.garimpoList.filter((x) => x.id !== id),
  }
}

export type { CollectionLead, ReferralPartner, StockExtraRecord }
