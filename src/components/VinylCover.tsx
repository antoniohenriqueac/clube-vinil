import type { CSSProperties } from 'react'
import type { VinylRecord } from '../types'

function patternStyle(record: VinylRecord): CSSProperties {
  const h = record.coverHue
  const base = `hsl(${h} 42% 28%)`
  const mid = `hsl(${h} 48% 42%)`
  const light = `hsl(${(h + 30) % 360} 55% 62%)`
  const dark = `hsl(${h} 35% 16%)`

  switch (record.coverPattern) {
    case 'stripes':
      return {
        background: `repeating-linear-gradient(135deg, ${dark} 0 14px, ${mid} 14px 28px, ${light} 28px 42px)`,
      }
    case 'blocks':
      return {
        background: `
          linear-gradient(90deg, ${dark} 50%, ${mid} 50%),
          linear-gradient(${light} 50%, ${dark} 50%)
        `,
        backgroundSize: '50% 50%',
      }
    case 'waves':
      return {
        background: `
          radial-gradient(ellipse at 20% 80%, ${light} 0 25%, transparent 26%),
          radial-gradient(ellipse at 80% 20%, ${mid} 0 30%, transparent 31%),
          linear-gradient(160deg, ${dark}, ${base})
        `,
      }
    case 'dots':
      return {
        background: `
          radial-gradient(circle at 25% 25%, ${light} 0 8%, transparent 9%),
          radial-gradient(circle at 75% 35%, ${mid} 0 10%, transparent 11%),
          radial-gradient(circle at 40% 75%, ${light} 0 7%, transparent 8%),
          linear-gradient(145deg, ${dark}, ${base})
        `,
      }
    default:
      return {
        background: `
          radial-gradient(circle at 50% 45%, ${light} 0 12%, transparent 13%),
          radial-gradient(circle at 50% 45%, transparent 28%, ${dark} 29% 32%, transparent 33%),
          radial-gradient(circle at 50% 45%, ${mid} 0 55%, ${dark} 100%)
        `,
      }
  }
}

export function VinylCover({
  record,
  showMeta = true,
  compact = false,
}: {
  record: VinylRecord
  showMeta?: boolean
  compact?: boolean
}) {
  return (
    <div
      className="vinyl-cover"
      style={compact ? { maxWidth: 72 } : undefined}
      aria-label={`Capa gerada de ${record.album} — ${record.artist}`}
    >
      <div className="vinyl-cover__art" style={patternStyle(record)}>
        <svg
          viewBox="0 0 100 100"
          width="100%"
          height="100%"
          style={{ opacity: 0.22, mixBlendMode: 'soft-light' }}
          aria-hidden
        >
          <circle cx="50" cy="50" r="38" fill="none" stroke="#fff" strokeWidth="0.6" />
          <circle cx="50" cy="50" r="26" fill="none" stroke="#fff" strokeWidth="0.4" />
          <circle cx="50" cy="50" r="8" fill="#fff" opacity="0.35" />
          <text
            x="50"
            y="92"
            textAnchor="middle"
            fill="#fff"
            fontSize="5"
            fontFamily="Georgia, serif"
          >
            {record.year}
          </text>
        </svg>
      </div>
      {showMeta && (
        <div className="vinyl-cover__meta">
          <strong>{record.album}</strong>
          <span>
            {record.artist} · {record.year}
          </span>
        </div>
      )}
    </div>
  )
}
