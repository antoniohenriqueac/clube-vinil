import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { STYLE_SUGGESTIONS } from '../../lib/tasteProfile'
import { useApp } from '../../state/AppContext'
import { normalizeProfile, type Decade, type Genre, type MusicalProfile } from '../../types'

const GENRES: Genre[] = [
  'MPB',
  'Rock',
  'Jazz',
  'Soul',
  'Funk',
  'Samba',
  'Bossa Nova',
  'Pop',
  'Eletrônico',
  'Hip-Hop',
  'Blues',
  'Reggae',
  'Folk',
]
const DECADES: Decade[] = ['60s', '70s', '80s', '90s', '00s', '10s', '20s']

function toggle<T>(list: T[], item: T): T[] {
  return list.includes(item) ? list.filter((x) => x !== item) : [...list, item]
}

function PreferencesForm({
  initial,
  subscriberId,
}: {
  initial: MusicalProfile
  subscriberId: string
}) {
  const { state, updateSubscriber } = useApp()
  const [saved, setSaved] = useState(false)
  const [profile, setProfile] = useState<MusicalProfile>(initial)
  const [artist, setArtist] = useState('')
  const [blocked, setBlocked] = useState('')

  const sub = state.subscribers.find((s) => s.id === subscriberId)
  if (!sub) return <Navigate to="/assinante" replace />

  function save() {
    updateSubscriber({ ...sub!, profile })
    setSaved(true)
  }

  return (
    <div className="sub-shell">
      <div className="container" style={{ maxWidth: 640 }}>
        <p className="muted">
          <Link to="/assinante">← Voltar</Link>
        </p>
        <h1 className="page-title">Preferências musicais</h1>
        <div className="surface">
          <h3>Gêneros</h3>
          <div className="chip-grid">
            {GENRES.map((g) => (
              <button
                key={g}
                type="button"
                className={`chip ${profile.genres.includes(g) ? 'chip--on' : ''}`}
                onClick={() =>
                  setProfile((p) => ({ ...p, genres: toggle(p.genres, g) }))
                }
              >
                {g}
              </button>
            ))}
          </div>

          <h3>Décadas</h3>
          <div className="chip-grid">
            {DECADES.map((d) => (
              <button
                key={d}
                type="button"
                className={`chip ${profile.decades.includes(d) ? 'chip--on' : ''}`}
                onClick={() =>
                  setProfile((p) => ({ ...p, decades: toggle(p.decades, d) }))
                }
              >
                {d}
              </button>
            ))}
          </div>

          <h3>Estilos</h3>
          <div className="chip-grid">
            {STYLE_SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                className={`chip ${profile.styles.includes(s) ? 'chip--on' : ''}`}
                onClick={() =>
                  setProfile((p) => ({ ...p, styles: toggle(p.styles, s) }))
                }
              >
                {s}
              </button>
            ))}
          </div>

          <div className="slider-row">
            <label htmlFor="energy">Energia (calmo → dançante): {profile.energy}</label>
            <input
              id="energy"
              type="range"
              min={0}
              max={100}
              value={profile.energy}
              onChange={(e) =>
                setProfile((p) => ({ ...p, energy: Number(e.target.value) }))
              }
            />
          </div>
          <div className="slider-row">
            <label htmlFor="ae">
              Textura (acústico → eletrônico): {profile.acousticElectronic}
            </label>
            <input
              id="ae"
              type="range"
              min={0}
              max={100}
              value={profile.acousticElectronic}
              onChange={(e) =>
                setProfile((p) => ({
                  ...p,
                  acousticElectronic: Number(e.target.value),
                }))
              }
            />
          </div>
          <div className="slider-row">
            <label htmlFor="groove">Groove: {profile.groove}</label>
            <input
              id="groove"
              type="range"
              min={0}
              max={100}
              value={profile.groove}
              onChange={(e) =>
                setProfile((p) => ({ ...p, groove: Number(e.target.value) }))
              }
            />
          </div>

          <h3>Artistas favoritos</h3>
          <div className="chip-grid">
            {profile.favoriteArtists.map((a) => (
              <button
                key={a}
                type="button"
                className="chip chip--on"
                onClick={() =>
                  setProfile((p) => ({
                    ...p,
                    favoriteArtists: p.favoriteArtists.filter((x) => x !== a),
                  }))
                }
              >
                {a} ×
              </button>
            ))}
          </div>
          <div className="field">
            <label htmlFor="fav">Adicionar artista</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                id="fav"
                value={artist}
                onChange={(e) => setArtist(e.target.value)}
              />
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  const v = artist.trim()
                  if (!v) return
                  setProfile((p) => ({
                    ...p,
                    favoriteArtists: [...p.favoriteArtists, v],
                  }))
                  setArtist('')
                }}
              >
                Add
              </button>
            </div>
          </div>

          <h3>Evitar</h3>
          <div className="chip-grid">
            {profile.blockedArtists.map((a) => (
              <button
                key={a}
                type="button"
                className="chip chip--on"
                onClick={() =>
                  setProfile((p) => ({
                    ...p,
                    blockedArtists: p.blockedArtists.filter((x) => x !== a),
                  }))
                }
              >
                {a} ×
              </button>
            ))}
          </div>
          <div className="field">
            <label htmlFor="block">Bloquear artista</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                id="block"
                value={blocked}
                onChange={(e) => setBlocked(e.target.value)}
              />
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  const v = blocked.trim()
                  if (!v) return
                  setProfile((p) => ({
                    ...p,
                    blockedArtists: [...p.blockedArtists, v],
                  }))
                  setBlocked('')
                }}
              >
                Add
              </button>
            </div>
          </div>

          <div className="slider-row">
            <label htmlFor="disc">
              Nível de descoberta: {profile.discoveryLevel}%
            </label>
            <input
              id="disc"
              type="range"
              min={0}
              max={100}
              value={profile.discoveryLevel}
              onChange={(e) =>
                setProfile((p) => ({
                  ...p,
                  discoveryLevel: Number(e.target.value),
                }))
              }
            />
          </div>

          <div className="inline-actions">
            <button type="button" className="btn btn-primary" onClick={save}>
              Salvar preferências
            </button>
            {saved && <span className="muted">Salvo neste navegador.</span>}
          </div>
        </div>
      </div>
    </div>
  )
}

export function Preferences() {
  const { sessionSubscriber } = useApp()
  if (!sessionSubscriber) return <Navigate to="/assinante" replace />
  return (
    <PreferencesForm
      initial={normalizeProfile(sessionSubscriber.profile)}
      subscriberId={sessionSubscriber.id}
    />
  )
}
