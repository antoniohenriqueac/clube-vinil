import { buildTasteProfile } from '../lib/tasteProfile'
import type { MusicalProfile } from '../types'

function Meter({
  label,
  value,
  left,
  right,
}: {
  label: string
  value: number
  left: string
  right: string
}) {
  return (
    <div className="taste-meter">
      <div className="taste-meter__head">
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
      <div className="taste-meter__track">
        <span style={{ width: `${value}%` }} />
      </div>
      <div className="taste-meter__labels">
        <span>{left}</span>
        <span>{right}</span>
      </div>
    </div>
  )
}

export function TasteProfilePanel({
  profile,
  compact = false,
}: {
  profile: Partial<MusicalProfile>
  compact?: boolean
}) {
  const taste = buildTasteProfile(profile)

  return (
    <aside className={`taste-panel ${compact ? 'taste-panel--compact' : ''}`}>
      <div className="taste-panel__eyebrow">Inteligência musical</div>
      <h3>Seu perfil musical</h3>
      <p className="muted" style={{ fontSize: '0.88rem' }}>
        Atualiza ao vivo conforme você responde o quiz.
      </p>

      <div className="taste-tags">
        {taste.topGenres.length === 0 && taste.topStyles.length === 0 ? (
          <span className="muted">Escolha gêneros e estilos para começar…</span>
        ) : (
          <>
            {taste.topGenres.slice(0, 4).map((g) => (
              <span key={`g-${g.name}`} className="taste-tag">
                {g.name}
              </span>
            ))}
            {taste.topStyles.slice(0, 4).map((s) => (
              <span key={`s-${s.name}`} className="taste-tag taste-tag--alt">
                {s.name}
              </span>
            ))}
          </>
        )}
      </div>

      {taste.decades.length > 0 && (
        <p className="muted" style={{ fontSize: '0.85rem' }}>
          Décadas: {taste.decades.map((d) => d.name).join(', ')}
        </p>
      )}

      <Meter
        label="Energia / batida"
        value={taste.energy}
        left="Calmo"
        right="Dançante"
      />
      <Meter
        label="Textura"
        value={taste.acousticElectronic}
        left="Acústico"
        right="Eletrônico"
      />
      <Meter
        label="Groove"
        value={taste.groove}
        left="Sutil"
        right="Forte"
      />

      {!compact && taste.exampleAlbums.length > 0 && (
        <div className="taste-examples">
          <h4>Álbuns-exemplo do perfil</h4>
          <ul>
            {taste.exampleAlbums.map((a) => (
              <li key={a.id}>
                <strong>{a.album}</strong>
                <span className="muted">
                  {' '}
                  — {a.artist} ({a.year})
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <ul className="taste-summary">
        {taste.summaryLines.slice(0, compact ? 4 : 8).map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
    </aside>
  )
}
