export type ConditionGrade = 'Mint' | 'NM' | 'VG+' | 'VG' | 'G'

export type PlanId = 'garimpo' | 'garimpo-plus' | 'garimpo-duplo'

export type RecordSource =
  | 'colecao-inteira'
  | 'sebo'
  | 'olx'
  | 'marketplace'
  | 'feira'
  | 'lote'

export type Genre =
  | 'MPB'
  | 'Rock'
  | 'Jazz'
  | 'Soul'
  | 'Funk'
  | 'Samba'
  | 'Bossa Nova'
  | 'Pop'
  | 'Eletrônico'
  | 'Hip-Hop'
  | 'Blues'
  | 'Reggae'
  | 'Folk'
  | 'Clássico'

export type Decade = '60s' | '70s' | '80s' | '90s' | '00s' | '10s' | '20s'

export interface VinylRecord {
  id: string
  artist: string
  album: string
  year: number
  decade: Decade
  genres: Genre[]
  condition: ConditionGrade
  cost: number
  source: RecordSource
  story: string
  coverHue: number
  coverPattern: 'radial' | 'stripes' | 'blocks' | 'waves' | 'dots'
  valueTier: 1 | 2 | 3
  specialEdition?: boolean
  inStock: boolean
}

export interface Plan {
  id: PlanId
  name: string
  badge?: string
  price: number
  discsPerMonth: number
  description: string
  features: string[]
  valueTierMin: 1 | 2 | 3
  prefersSpecial?: boolean
}

export interface MusicalProfile {
  favoriteArtists: string[]
  genres: Genre[]
  decades: Decade[]
  favoriteAlbums: string[]
  blockedArtists: string[]
  discoveryLevel: number
  hasTurntable: boolean | null
}

export type RatingLabel = 'ja-tinha' | 'nao-curti' | 'amei' | null

export interface DiscFeedback {
  recordId: string
  stars: number
  label: RatingLabel
  month: string
}

export interface Delivery {
  month: string
  recordIds: string[]
  feedback?: DiscFeedback[]
  status: 'enviado' | 'em-preparacao' | 'confirmado'
}

export interface Subscriber {
  id: string
  name: string
  email: string
  planId: PlanId
  profile: MusicalProfile
  status: 'ativo' | 'pausado' | 'cancelado'
  joinedAt: string
  deliveries: Delivery[]
  currentPickIds: string[]
}

export interface MonthPick {
  subscriberId: string
  recordIds: string[]
  confirmed: boolean
  scores: Record<string, number>
}

export interface AppState {
  sessionSubscriberId: string | null
  onboardingDraft: Partial<MusicalProfile> | null
  selectedPlanId: PlanId | null
  monthPicks: MonthPick[]
  subscribers: Subscriber[]
  stockOverrides: Partial<Record<string, Partial<VinylRecord>>>
}
