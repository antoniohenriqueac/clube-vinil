import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { brand } from '../brand'
import { TasteProfilePanel } from '../components/TasteProfilePanel'
import { STYLE_SUGGESTIONS } from '../lib/tasteProfile'
import { useApp } from '../state/AppContext'
import {
  emptyMusicalProfile,
  type Decade,
  type Genre,
  type MusicalProfile,
} from '../types'

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

function toggleItem<T>(list: T[], item: T): T[] {
  return list.includes(item) ? list.filter((x) => x !== item) : [...list, item]
}

export function Quiz() {
  const navigate = useNavigate()
  const { setOnboardingDraft, setSelectedPlan } = useApp()
  const [step, setStep] = useState(0)
  const [profile, setProfile] = useState<MusicalProfile>(emptyMusicalProfile)
  const [artistInput, setArtistInput] = useState('')
  const [albumInput, setAlbumInput] = useState('')
  const [blockedInput, setBlockedInput] = useState('')
  const [styleInput, setStyleInput] = useState('')

  const steps = [
    'Artistas',
    'Gêneros',
    'Estilos',
    'Décadas',
    'Energia',
    'Álbuns',
    'Evitar',
    'Descoberta',
    'Toca-discos',
    'Resumo',
  ]

  const progress = ((step + 1) / steps.length) * 100
  const liveProfile = useMemo(() => profile, [profile])

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

  function addStyle() {
    const v = styleInput.trim()
    if (!v) return
    setProfile((p) => ({
      ...p,
      styles: p.styles.includes(v) ? p.styles : [...p.styles, v],
    }))
    setStyleInput('')
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

        <div className="quiz-layout">
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
                <h2>Estilos e subgêneros</h2>
                <p className="muted">
                  Afina a curadoria além do gênero amplo (ex.: Samba-Rock,
                  Trip-Hop).
                </p>
                <div className="chip-grid">
                  {STYLE_SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      className={`chip ${profile.styles.includes(s) ? 'chip--on' : ''}`}
                      onClick={() =>
                        setProfile((p) => ({
                          ...p,
                          styles: toggleItem(p.styles, s),
                        }))
                      }
                    >
                      {s}
                    </button>
                  ))}
                </div>
                <div className="field">
                  <label htmlFor="style-extra">Outro estilo</label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                      id="style-extra"
                      value={styleInput}
                      onChange={(e) => setStyleInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addStyle()}
                    />
                    <button type="button" className="btn btn-ghost btn-sm" onClick={addStyle}>
                      Add
                    </button>
                  </div>
                </div>
              </>
            )}

            {step === 3 && (
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

            {step === 4 && (
              <>
                <h2>Energia, textura e groove</h2>
                <p className="muted">
                  Como você curte a batida — dançante vs calmo, acústico vs
                  eletrônico, groove.
                </p>
                <div className="slider-row">
                  <label htmlFor="energy">
                    Energia / batida: {profile.energy} (calmo → dançante)
                  </label>
                  <input
                    id="energy"
                    type="range"
                    min={0}
                    max={100}
                    value={profile.energy}
                    onChange={(e) =>
                      setProfile((p) => ({
                        ...p,
                        energy: Number(e.target.value),
                      }))
                    }
                  />
                </div>
                <div className="slider-row">
                  <label htmlFor="ae">
                    Textura: {profile.acousticElectronic} (acústico → eletrônico)
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
                  <label htmlFor="groove">
                    Groove: {profile.groove} (sutil → forte)
                  </label>
                  <input
                    id="groove"
                    type="range"
                    min={0}
                    max={100}
                    value={profile.groove}
                    onChange={(e) =>
                      setProfile((p) => ({
                        ...p,
                        groove: Number(e.target.value),
                      }))
                    }
                  />
                </div>
              </>
            )}

            {step === 5 && (
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

            {step === 6 && (
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

            {step === 7 && (
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

            {step === 8 && (
              <>
                <h2>Você tem toca-discos?</h2>
                <div className="chip-grid">
                  {(
                    [
                      { v: true as boolean | null, label: 'Sim' },
                      { v: false, label: 'Ainda não' },
                      { v: null, label: 'Prefiro não dizer' },
                    ] as const
                  ).map((opt) => (
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

            {step === 9 && (
              <>
                <h2>Perfil pronto para curadoria</h2>
                <p className="muted">
                  O painel ao lado (ou abaixo no celular) mostra o mapa do seu
                  gosto. Em seguida você escolhe o plano.
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

          <TasteProfilePanel profile={liveProfile} />
        </div>
      </div>
    </div>
  )
}
