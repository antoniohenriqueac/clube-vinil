import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { brand } from '../brand'
import { summarizeProfile } from '../lib/recommend'
import { useApp } from '../state/AppContext'
import type { Decade, Genre, MusicalProfile } from '../types'

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

const ARTIST_SUGGESTIONS = [
  'Tim Maia',
  'Cartola',
  'Elis Regina',
  'Caetano Veloso',
  'Gilberto Gil',
  'Chico Buarque',
  'Milton Nascimento',
  'Djavan',
  'Pink Floyd',
  'The Beatles',
  'David Bowie',
  'Miles Davis',
  'Aretha Franklin',
  'Radiohead',
  'Queen',
  'Raul Seixas',
  'Legião Urbana',
  'Marisa Monte',
]

const emptyProfile = (): MusicalProfile => ({
  favoriteArtists: [],
  genres: [],
  decades: [],
  favoriteAlbums: [],
  blockedArtists: [],
  discoveryLevel: 50,
  hasTurntable: null,
})

function toggleItem<T>(list: T[], item: T): T[] {
  return list.includes(item) ? list.filter((x) => x !== item) : [...list, item]
}

export function Quiz() {
  const navigate = useNavigate()
  const { setOnboardingDraft, setSelectedPlan } = useApp()
  const [step, setStep] = useState(0)
  const [profile, setProfile] = useState<MusicalProfile>(emptyProfile)
  const [artistInput, setArtistInput] = useState('')
  const [albumInput, setAlbumInput] = useState('')
  const [blockedInput, setBlockedInput] = useState('')

  const steps = [
    'Artistas',
    'Gêneros',
    'Décadas',
    'Álbuns',
    'Evitar',
    'Descoberta',
    'Toca-discos',
    'Resumo',
  ]

  const progress = ((step + 1) / steps.length) * 100

  const summary = useMemo(() => summarizeProfile(profile), [profile])

  function addArtist() {
    const v = artistInput.trim()
    if (!v) return
    setProfile((p) => ({
      ...p,
      favoriteArtists: p.favoriteArtists.includes(v)
        ? p.favoriteArtists
        : [...p.favoriteArtists, v],
    }))
    setArtistInput('')
  }

  function addAlbum() {
    const v = albumInput.trim()
    if (!v) return
    setProfile((p) => ({
      ...p,
      favoriteAlbums: p.favoriteAlbums.includes(v)
        ? p.favoriteAlbums
        : [...p.favoriteAlbums, v],
    }))
    setAlbumInput('')
  }

  function addBlocked() {
    const v = blockedInput.trim()
    if (!v) return
    setProfile((p) => ({
      ...p,
      blockedArtists: p.blockedArtists.includes(v)
        ? p.blockedArtists
        : [...p.blockedArtists, v],
    }))
    setBlockedInput('')
  }

  function finish() {
    setOnboardingDraft(profile)
    setSelectedPlan(null)
    navigate('/checkout')
  }

  return (
    <div className="quiz-shell">
      <div className="container">
        <p className="muted">Onboarding · {brand.name}</p>
        <h1 className="page-title">Quiz do perfil musical</h1>
        <p className="muted">
          Passo {step + 1} de {steps.length}: {steps[step]}
        </p>
        <div className="quiz-progress" aria-hidden>
          <div className="quiz-progress__bar" style={{ width: `${progress}%` }} />
        </div>

        <div className="quiz-card surface">
          {step === 0 && (
            <>
              <h2>Quais artistas você ama?</h2>
              <p className="muted">Escolha sugestões ou digite os seus.</p>
              <div className="chip-grid">
                {ARTIST_SUGGESTIONS.map((a) => (
                  <button
                    key={a}
                    type="button"
                    className={`chip ${profile.favoriteArtists.includes(a) ? 'chip--on' : ''}`}
                    onClick={() =>
                      setProfile((p) => ({
                        ...p,
                        favoriteArtists: toggleItem(p.favoriteArtists, a),
                      }))
                    }
                  >
                    {a}
                  </button>
                ))}
              </div>
              <div className="field">
                <label htmlFor="artist-extra">Outro artista</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    id="artist-extra"
                    value={artistInput}
                    onChange={(e) => setArtistInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addArtist()}
                    placeholder="Nome do artista"
                  />
                  <button type="button" className="btn btn-ghost btn-sm" onClick={addArtist}>
                    Add
                  </button>
                </div>
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <h2>Gêneros favoritos</h2>
              <div className="chip-grid">
                {GENRES.map((g) => (
                  <button
                    key={g}
                    type="button"
                    className={`chip ${profile.genres.includes(g) ? 'chip--on' : ''}`}
                    onClick={() =>
                      setProfile((p) => ({
                        ...p,
                        genres: toggleItem(p.genres, g),
                      }))
                    }
                  >
                    {g}
                  </button>
                ))}
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h2>Décadas que mais te pegam</h2>
              <div className="chip-grid">
                {DECADES.map((d) => (
                  <button
                    key={d}
                    type="button"
                    className={`chip ${profile.decades.includes(d) ? 'chip--on' : ''}`}
                    onClick={() =>
                      setProfile((p) => ({
                        ...p,
                        decades: toggleItem(p.decades, d),
                      }))
                    }
                  >
                    {d}
                  </button>
                ))}
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h2>Álbuns que marcaram você</h2>
              <p className="muted">Opcional, mas ajuda a afinar a curadoria.</p>
              <div className="chip-grid">
                {profile.favoriteAlbums.map((a) => (
                  <button
                    key={a}
                    type="button"
                    className="chip chip--on"
                    onClick={() =>
                      setProfile((p) => ({
                        ...p,
                        favoriteAlbums: p.favoriteAlbums.filter((x) => x !== a),
                      }))
                    }
                  >
                    {a} ×
                  </button>
                ))}
              </div>
              <div className="field">
                <label htmlFor="album">Álbum</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    id="album"
                    value={albumInput}
                    onChange={(e) => setAlbumInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addAlbum()}
                    placeholder="Ex.: Acabou Chorare"
                  />
                  <button type="button" className="btn btn-ghost btn-sm" onClick={addAlbum}>
                    Add
                  </button>
                </div>
              </div>
            </>
          )}

          {step === 4 && (
            <>
              <h2>Artistas que você NÃO quer</h2>
              <p className="muted">Bloqueamos esses nomes na recomendação.</p>
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
                <label htmlFor="blocked">Artista a evitar</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    id="blocked"
                    value={blockedInput}
                    onChange={(e) => setBlockedInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addBlocked()}
                  />
                  <button type="button" className="btn btn-ghost btn-sm" onClick={addBlocked}>
                    Add
                  </button>
                </div>
              </div>
            </>
          )}

          {step === 5 && (
            <>
              <h2>Descoberta × familiar</h2>
              <p className="muted">
                Quanto mais à direita, mais discos novos fora da sua zona de
                conforto.
              </p>
              <div className="slider-row">
                <input
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
                <div className="slider-labels">
                  <span>Mais familiar</span>
                  <span>{profile.discoveryLevel}% descoberta</span>
                  <span>Mais descoberta</span>
                </div>
              </div>
            </>
          )}

          {step === 6 && (
            <>
              <h2>Você tem toca-discos?</h2>
              <div className="chip-grid">
                {[
                  { v: true, label: 'Sim' },
                  { v: false, label: 'Ainda não' },
                  { v: null, label: 'Prefiro não dizer' },
                ].map((opt) => (
                  <button
                    key={String(opt.v)}
                    type="button"
                    className={`chip ${profile.hasTurntable === opt.v ? 'chip--on' : ''}`}
                    onClick={() =>
                      setProfile((p) => ({ ...p, hasTurntable: opt.v }))
                    }
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </>
          )}

          {step === 7 && (
            <>
              <h2>Seu perfil musical</h2>
              <div className="profile-summary">
                <ul>
                  {summary.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </div>
              <p className="muted">
                Em seguida você escolhe o plano e simula o checkout (demonstração).
              </p>
            </>
          )}

          <div className="quiz-nav">
            {step === 0 ? (
              <Link className="btn btn-ghost" to="/">
                Voltar
              </Link>
            ) : (
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setStep((s) => s - 1)}
              >
                Anterior
              </button>
            )}
            {step < steps.length - 1 ? (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setStep((s) => s + 1)}
              >
                Continuar
              </button>
            ) : (
              <button type="button" className="btn btn-amber" onClick={finish}>
                Escolher plano
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
