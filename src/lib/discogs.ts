import type { CatalogRelease, CatalogMode, Decade, Genre, MusicalProfile } from '../types'
import { seedCatalog } from '../data/seedCatalog'
import {
  canCallDiscogs,
  getCached,
  markDiscogsCall,
  setCached,
} from './catalogCache'

const DISCOGS_API = 'https://api.discogs.com'

export function getEnvDiscogsToken(): string | null {
  const env = import.meta.env.VITE_DISCOGS_TOKEN
  return typeof env === 'string' && env.trim() ? env.trim() : null
}

export function resolveDiscogsToken(stored: string | null): string | null {
  return stored?.trim() || getEnvDiscogsToken()
}

export function getCatalogMode(token: string | null): CatalogMode {
  return resolveDiscogsToken(token) ? 'discogs' : 'seed'
}

function decadeFromYear(year: number): Decade {
  if (year < 1970) return '60s'
  if (year < 1980) return '70s'
  if (year < 1990) return '80s'
  if (year < 2000) return '90s'
  if (year < 2010) return '00s'
  if (year < 2020) return '10s'
  return '20s'
}

const GENRE_MAP: Record<string, Genre> = {
  rock: 'Rock',
  jazz: 'Jazz',
  funk: 'Funk',
  soul: 'Soul',
  'hip hop': 'Hip-Hop',
  'hip-hop': 'Hip-Hop',
  electronic: 'Eletrônico',
  pop: 'Pop',
  blues: 'Blues',
  reggae: 'Reggae',
  folk: 'Folk',
  classical: 'Clássico',
  latin: 'MPB',
  brazilian: 'MPB',
  samba: 'Samba',
  'bossa nova': 'Bossa Nova',
}

function mapGenres(raw: string[] = []): Genre[] {
  const out = new Set<Genre>()
  for (const g of raw) {
    const key = g.toLowerCase()
    if (GENRE_MAP[key]) out.add(GENRE_MAP[key])
    else if (key.includes('samba')) out.add('Samba')
    else if (key.includes('bossa')) out.add('Bossa Nova')
    else if (key.includes('mpb') || key.includes('brazilian')) out.add('MPB')
    else if (key.includes('electr')) out.add('Eletrônico')
    else if (key.includes('funk')) out.add('Funk')
    else if (key.includes('soul')) out.add('Soul')
    else if (key.includes('rock')) out.add('Rock')
    else if (key.includes('jazz')) out.add('Jazz')
  }
  return out.size ? [...out] : ['Pop']
}

function guessMood(styles: string[], genres: Genre[]): CatalogRelease['mood'] {
  const blob = `${styles.join(' ')} ${genres.join(' ')}`.toLowerCase()
  let energy = 50
  let acousticElectronic = 40
  let groove = 50
  if (/disco|house|dance|funk|afrobeat|samba-rock/.test(blob)) {
    energy += 25
    groove += 30
    acousticElectronic += 10
  }
  if (/ambient|folk|bossa|acoustic|singer|classical|choro/.test(blob)) {
    energy -= 20
    acousticElectronic -= 25
    groove -= 15
  }
  if (/electronic|synth|techno|electro|idm/.test(blob)) {
    acousticElectronic += 35
  }
  if (/punk|metal|hardcore|thrash/.test(blob)) {
    energy += 30
    groove -= 5
  }
  const clamp = (n: number) => Math.max(0, Math.min(100, n))
  return {
    energy: clamp(energy),
    acousticElectronic: clamp(acousticElectronic),
    groove: clamp(groove),
  }
}

interface DiscogsSearchResult {
  id: number
  title: string
  year?: string
  genre?: string[]
  style?: string[]
  format?: string[]
}

interface DiscogsSearchResponse {
  results: DiscogsSearchResult[]
}

interface DiscogsMarketplaceStats {
  lowest_price?: { value: number; currency: string }
  num_for_sale?: number
}

function parseTitle(title: string): { artist: string; album: string } {
  const parts = title.split(' - ')
  if (parts.length >= 2) {
    return { artist: parts[0].trim(), album: parts.slice(1).join(' - ').trim() }
  }
  return { artist: title, album: title }
}

async function discogsFetch<T>(
  path: string,
  token: string,
  cacheKey: string,
): Promise<T | null> {
  const cached = getCached<T>(cacheKey)
  if (cached) return cached
  if (!canCallDiscogs()) return null

  markDiscogsCall()
  const url = `${DISCOGS_API}${path}`
  const res = await fetch(url, {
    headers: {
      Authorization: `Discogs token=${token}`,
      'User-Agent': 'GarimpoClubeVinil/0.1 +https://antoniohenriqueac.github.io/clube-vinil/',
    },
  })
  if (!res.ok) return null
  const data = (await res.json()) as T
  setCached(cacheKey, data)
  return data
}

function toCatalogRelease(r: DiscogsSearchResult): CatalogRelease {
  const { artist, album } = parseTitle(r.title)
  const year = Number(r.year) || 1975
  const genres = mapGenres(r.genre)
  const styles = r.style ?? []
  return {
    id: `discogs-${r.id}`,
    discogsId: r.id,
    artist,
    album,
    year,
    decade: decadeFromYear(year),
    genres,
    styles,
    mood: guessMood(styles, genres),
    source: 'discogs',
  }
}

export async function searchDiscogsForProfile(
  profile: MusicalProfile,
  token: string,
  limit = 40,
): Promise<CatalogRelease[]> {
  const queries: string[] = []
  for (const g of profile.genres.slice(0, 3)) {
    queries.push(`genre=${encodeURIComponent(g)}`)
  }
  for (const s of profile.styles.slice(0, 2)) {
    queries.push(`style=${encodeURIComponent(s)}`)
  }
  for (const a of profile.favoriteArtists.slice(0, 2)) {
    queries.push(`artist=${encodeURIComponent(a)}`)
  }
  if (!queries.length) queries.push('genre=Jazz')

  const collected: CatalogRelease[] = []
  const seen = new Set<number>()

  for (const q of queries.slice(0, 4)) {
    const path = `/database/search?type=release&format=Vinyl&per_page=15&${q}`
    const data = await discogsFetch<DiscogsSearchResponse>(
      path,
      token,
      `search:${q}`,
    )
    if (!data?.results) continue
    for (const r of data.results) {
      if (seen.has(r.id)) continue
      seen.add(r.id)
      collected.push(toCatalogRelease(r))
      if (collected.length >= limit) break
    }
    if (collected.length >= limit) break
  }

  // Enrich a few with marketplace prices
  for (const item of collected.slice(0, 8)) {
    if (!item.discogsId) continue
    const stats = await discogsFetch<DiscogsMarketplaceStats>(
      `/marketplace/stats/${item.discogsId}`,
      token,
      `stats:${item.discogsId}`,
    )
    if (stats?.lowest_price?.value) {
      const v = stats.lowest_price.value
      const cur = stats.lowest_price.currency
      // rough BRL conversion if USD/EUR
      const brl =
        cur === 'BRL'
          ? v
          : cur === 'EUR'
            ? v * 6
            : v * 5.5
      item.typicalUsedPriceBrl = Math.round(brl)
    }
  }

  return collected
}

export async function loadCatalogForSourcing(
  profile: MusicalProfile,
  storedToken: string | null,
): Promise<{ releases: CatalogRelease[]; mode: CatalogMode; note: string }> {
  const token = resolveDiscogsToken(storedToken)
  if (!token) {
    return {
      releases: seedCatalog,
      mode: 'seed',
      note: 'Modo seed — catálogo local (~400 lançamentos). Informe um token Discogs nas configurações para buscar no catálogo real.',
    }
  }

  try {
    const remote = await searchDiscogsForProfile(profile, token)
    if (!remote.length) {
      return {
        releases: seedCatalog,
        mode: 'seed',
        note: 'Discogs sem resultados úteis — usando catálogo seed.',
      }
    }
    // Merge unique seed matches for denser scoring offline-friendly
    const ids = new Set(remote.map((r) => `${r.artist}|${r.album}`.toLowerCase()))
    const extras = seedCatalog.filter(
      (s) => !ids.has(`${s.artist}|${s.album}`.toLowerCase()),
    )
    return {
      releases: [...remote, ...extras],
      mode: 'discogs',
      note: `Modo Discogs ativo (${remote.length} resultados da API + seed complementar). Cache local respeita rate limit.`,
    }
  } catch {
    return {
      releases: seedCatalog,
      mode: 'seed',
      note: 'Falha ao consultar Discogs — fallback para catálogo seed.',
    }
  }
}

/** Search Discogs by free-text query (artist/album), with cache + rate limit. */
export async function searchDiscogsByQuery(
  query: string,
  token: string,
): Promise<CatalogRelease[]> {
  const q = query.trim()
  if (!q) return []
  const path = `/database/search?type=release&format=Vinyl&per_page=5&q=${encodeURIComponent(q)}`
  const data = await discogsFetch<DiscogsSearchResponse>(
    path,
    token,
    `q:${q.toLowerCase()}`,
  )
  if (!data?.results?.length) return []
  const releases = data.results.slice(0, 3).map(toCatalogRelease)
  for (const item of releases.slice(0, 1)) {
    if (!item.discogsId) continue
    const stats = await discogsFetch<DiscogsMarketplaceStats>(
      `/marketplace/stats/${item.discogsId}`,
      token,
      `stats:${item.discogsId}`,
    )
    if (stats?.lowest_price?.value) {
      const v = stats.lowest_price.value
      const cur = stats.lowest_price.currency
      const brl =
        cur === 'BRL' ? v : cur === 'EUR' ? v * 6 : v * 5.5
      item.typicalUsedPriceBrl = Math.round(brl)
    }
  }
  return releases
}

/** Build a catalog for lot valuation: seed + optional Discogs enrichment for each line. */
export async function loadCatalogForLotTitles(
  titles: string[],
  storedToken: string | null,
): Promise<{ catalog: CatalogRelease[]; mode: CatalogMode; note: string }> {
  const token = resolveDiscogsToken(storedToken)
  if (!token) {
    return {
      catalog: seedCatalog,
      mode: 'seed',
      note: 'Avaliação via catálogo seed (sem token Discogs).',
    }
  }

  const extras: CatalogRelease[] = []
  const seen = new Set(seedCatalog.map((r) => `${r.artist}|${r.album}`.toLowerCase()))
  for (const title of titles.slice(0, 12)) {
    try {
      const hits = await searchDiscogsByQuery(title, token)
      for (const h of hits) {
        const key = `${h.artist}|${h.album}`.toLowerCase()
        if (seen.has(key)) continue
        seen.add(key)
        extras.push(h)
      }
    } catch {
      /* keep going with seed */
    }
  }

  return {
    catalog: [...extras, ...seedCatalog],
    mode: extras.length ? 'discogs' : 'seed',
    note: extras.length
      ? `Discogs enriquecido (${extras.length} resultados) + seed.`
      : 'Token presente, mas Discogs sem hits úteis — usando seed.',
  }
}

/** Test helper: simulate discogs mapping without network. */
export function mockDiscogsReleasesFromSeed(n = 12): CatalogRelease[] {
  return seedCatalog.slice(0, n).map((r) => ({
    ...r,
    id: `discogs-mock-${r.id}`,
    source: 'discogs' as const,
    discogsId: 100000 + Math.floor(Math.random() * 900000),
  }))
}
