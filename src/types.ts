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

export type StyleTag = string

export interface MoodAxes {
  /** 0 = calmo · 100 = dançante */
  energy: number
  /** 0 = acústico · 100 = eletrônico */
  acousticElectronic: number
  /** 0 = sutil · 100 = groove forte */
  groove: number
}

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
  styles: StyleTag[]
  decades: Decade[]
  favoriteAlbums: string[]
  blockedArtists: string[]
  discoveryLevel: number
  energy: number
  acousticElectronic: number
  groove: number
  hasTurntable: boolean | null
}

export interface WeightedTag {
  name: string
  weight: number
}

export interface TasteProfile {
  topGenres: WeightedTag[]
  topStyles: WeightedTag[]
  decades: WeightedTag[]
  energy: number
  acousticElectronic: number
  groove: number
  favoriteArtists: string[]
  blockedArtists: string[]
  discoveryLevel: number
  exampleAlbums: CatalogRelease[]
  summaryLines: string[]
}

export interface CatalogRelease {
  id: string
  artist: string
  album: string
  year: number
  decade: Decade
  genres: Genre[]
  styles: string[]
  mood: MoodAxes
  typicalUsedPriceBrl?: number
  discogsId?: number
  source: 'seed' | 'discogs'
}

export interface SourcingSuggestion {
  release: CatalogRelease
  score: number
  reasons: string[]
  inStock: boolean
  stockRecordId?: string
}

export interface GarimpoListItem {
  id: string
  subscriberId: string
  release: CatalogRelease
  score: number
  reasons: string[]
  addedAt: string
}

export type CatalogMode = 'seed' | 'discogs'

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

export type LeadStage =
  | 'novo'
  | 'contato'
  | 'visita'
  | 'proposta'
  | 'comprado'
  | 'perdido'

export type LeadSource =
  | 'placa'
  | 'google'
  | 'olx'
  | 'marketplace'
  | 'indicacao'
  | 'advogado'
  | 'leiloeiro'
  | 'imobiliaria'
  | 'mudanca'
  | 'sebo'
  | 'formulario'

export type LeadReason =
  | 'heranca'
  | 'mudanca'
  | 'downsizing'
  | 'desapego'
  | 'outro'

export type PartnerType =
  | 'advogado'
  | 'leiloeiro'
  | 'imobiliaria'
  | 'mudanca'
  | 'sebo'
  | 'outro'

export interface CollectionLead {
  id: string
  name: string
  whatsapp: string
  neighborhood: string
  city: string
  approxCount: number
  genresNote: string
  artistsNote: string
  condition: ConditionGrade | 'misto' | 'desconhecido'
  reason: LeadReason
  titlesText: string
  photoDataUrls: string[]
  lgpdConsent: boolean
  source: LeadSource
  stage: LeadStage
  notes: string
  nextStepDate: string | null
  offerPercent: number
  createdAt: string
  updatedAt: string
  purchasedAt?: string
  purchasedRecordIds?: string[]
  valuationSnapshot?: LotValuationSummary | null
}

export interface LotLineItem {
  raw: string
  matched: boolean
  release?: CatalogRelease
  condition: ConditionGrade
  estimatedUsedPrice: number
  adjustedPrice: number
  matchingSubscriberIds: string[]
}

export interface LotValuationSummary {
  items: LotLineItem[]
  resaleTotal: number
  suggestedOffer: number
  offerPercent: number
  avgCostPerDisc: number
  targetAcquisitionCost: number
  discsMatchingSubscribers: number
  subscribersServed: number
  matchedCount: number
  unmatchedCount: number
  mode: CatalogMode
}

export interface ReferralPartner {
  id: string
  name: string
  type: PartnerType
  contact: string
  city: string
  commissionPercent: number
  notes: string
  active: boolean
}

export interface StockExtraRecord extends VinylRecord {
  fromLeadId?: string
}

export interface AppState {
  sessionSubscriberId: string | null
  onboardingDraft: Partial<MusicalProfile> | null
  selectedPlanId: PlanId | null
  monthPicks: MonthPick[]
  subscribers: Subscriber[]
  stockOverrides: Partial<Record<string, Partial<VinylRecord>>>
  stockExtras: StockExtraRecord[]
  garimpoList: GarimpoListItem[]
  discogsToken: string | null
  collectionLeads: CollectionLead[]
  referralPartners: ReferralPartner[]
}

export function emptyMusicalProfile(): MusicalProfile {
  return {
    favoriteArtists: [],
    genres: [],
    styles: [],
    decades: [],
    favoriteAlbums: [],
    blockedArtists: [],
    discoveryLevel: 50,
    energy: 50,
    acousticElectronic: 40,
    groove: 50,
    hasTurntable: null,
  }
}

export function normalizeProfile(
  partial?: Partial<MusicalProfile> | null,
): MusicalProfile {
  return { ...emptyMusicalProfile(), ...(partial ?? {}) }
}
