import { useMemo, useState } from 'react'
import { ConditionBadge } from '../../components/ConditionBadge'
import { VinylCover } from '../../components/VinylCover'
import { getPlan } from '../../data/plans'
import { pickForSubscriber, recommendForSubscriber } from '../../lib/recommend'
import { useApp } from '../../state/AppContext'
import type { MonthPick } from '../../types'

export function AdminCuration() {
  const { state, stock, setMonthPicks, confirmPicks } = useApp()
  const [selectedSubId, setSelectedSubId] = useState(
    state.subscribers.find((s) => s.status === 'ativo')?.id ?? '',
  )

  const activeSubs = state.subscribers.filter((s) => s.status === 'ativo')
  const selected = activeSubs.find((s) => s.id === selectedSubId)

  const takenIds = useMemo(() => {
    const set = new Set<string>()
    for (const p of state.monthPicks) {
      if (p.subscriberId === selectedSubId) continue
      for (const id of p.recordIds) set.add(id)
    }
    return set
  }, [state.monthPicks, selectedSubId])

  const suggestions = useMemo(() => {
    if (!selected) return []
    return recommendForSubscriber(selected, stock, takenIds).slice(0, 8)
  }, [selected, stock, takenIds])

  const currentPick = state.monthPicks.find(
    (p) => p.subscriberId === selectedSubId,
  )

  function autoSuggestAll() {
    const taken = new Set<string>()
    const picks: MonthPick[] = []
    for (const sub of activeSubs) {
      const top = pickForSubscriber(sub, stock, taken)
      for (const s of top) taken.add(s.record.id)
      picks.push({
        subscriberId: sub.id,
        recordIds: top.map((t) => t.record.id),
        confirmed: false,
        scores: Object.fromEntries(top.map((t) => [t.record.id, t.score])),
      })
    }
    setMonthPicks(picks)
    if (picks[0]) setSelectedSubId(picks[0].subscriberId)
  }

  function selectRecord(recordId: string) {
    if (!selected) return
    const plan = getPlan(selected.planId)
    const max = plan?.discsPerMonth ?? 1
    const existing = currentPick?.recordIds ?? []
    let next = existing.includes(recordId)
      ? existing.filter((id) => id !== recordId)
      : [...existing, recordId]
    if (next.length > max) next = next.slice(-max)

    const scored = suggestions.find((s) => s.record.id === recordId)
    const scores = { ...(currentPick?.scores ?? {}) }
    if (scored) scores[recordId] = scored.score

    const pick: MonthPick = {
      subscriberId: selected.id,
      recordIds: next,
      confirmed: false,
      scores,
    }
    const others = state.monthPicks.filter(
      (p) => p.subscriberId !== selected.id,
    )
    setMonthPicks([...others, pick])
  }

  function applyAutoForSelected() {
    if (!selected) return
    const top = pickForSubscriber(selected, stock, takenIds)
    const pick: MonthPick = {
      subscriberId: selected.id,
      recordIds: top.map((t) => t.record.id),
      confirmed: false,
      scores: Object.fromEntries(top.map((t) => [t.record.id, t.score])),
    }
    const others = state.monthPicks.filter(
      (p) => p.subscriberId !== selected.id,
    )
    setMonthPicks([...others, pick])
  }

  return (
    <div className="grid-2">
      <section className="surface">
        <h3>Assinante</h3>
        <div className="field">
          <label htmlFor="sub">Selecionar</label>
          <select
            id="sub"
            value={selectedSubId}
            onChange={(e) => setSelectedSubId(e.target.value)}
          >
            {activeSubs.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} — {getPlan(s.planId)?.name}
              </option>
            ))}
          </select>
        </div>
        <div className="inline-actions">
          <button type="button" className="btn btn-amber btn-sm" onClick={autoSuggestAll}>
            Auto-sugerir todos
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={applyAutoForSelected}
            disabled={!selected}
          >
            Auto para este
          </button>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            disabled={!currentPick || currentPick.recordIds.length === 0}
            onClick={() => selected && confirmPicks(selected.id)}
          >
            Confirmar pick do mês
          </button>
        </div>
        {currentPick && (
          <p className="muted" style={{ marginTop: '0.75rem' }}>
            Selecionados: {currentPick.recordIds.join(', ') || 'nenhum'} ·{' '}
            {currentPick.confirmed ? 'confirmado' : 'rascunho'}
          </p>
        )}
        {selected && (
          <div className="profile-summary" style={{ marginTop: '1rem' }}>
            <strong>Perfil</strong>
            <ul>
              <li>Gêneros: {selected.profile.genres.join(', ') || '—'}</li>
              <li>Décadas: {selected.profile.decades.join(', ') || '—'}</li>
              <li>
                Favoritos: {selected.profile.favoriteArtists.join(', ') || '—'}
              </li>
              <li>
                Evitar: {selected.profile.blockedArtists.join(', ') || '—'}
              </li>
              <li>Descoberta: {selected.profile.discoveryLevel}%</li>
            </ul>
          </div>
        )}
      </section>

      <section className="surface">
        <h3>Sugestões ranqueadas</h3>
        <p className="muted">
          Score por gênero, década, artista, descoberta, tier do plano, edição
          especial e sem repetir envios.
        </p>
        {suggestions.length === 0 ? (
          <div className="empty">Sem sugestões para este perfil.</div>
        ) : (
          <div className="history-list">
            {suggestions.map((s) => {
              const selectedIds = currentPick?.recordIds ?? []
              const on = selectedIds.includes(s.record.id)
              const maxScore = suggestions[0]?.score || 1
              return (
                <button
                  key={s.record.id}
                  type="button"
                  onClick={() => selectRecord(s.record.id)}
                  className="surface"
                  style={{
                    textAlign: 'left',
                    cursor: 'pointer',
                    borderColor: on ? 'var(--burgundy)' : undefined,
                    padding: '0.85rem',
                  }}
                >
                  <div className="history-item">
                    <VinylCover record={s.record} showMeta={false} compact />
                    <div>
                      <strong>
                        {s.record.album}{' '}
                        <ConditionBadge grade={s.record.condition} />
                      </strong>
                      <div className="muted" style={{ fontSize: '0.85rem' }}>
                        {s.record.artist} · score {s.score}
                        {on ? ' · selecionado' : ''}
                      </div>
                      <div className="score-bar">
                        <span
                          style={{
                            width: `${Math.min(100, (s.score / maxScore) * 100)}%`,
                          }}
                        />
                      </div>
                      <div className="muted" style={{ fontSize: '0.78rem', marginTop: 4 }}>
                        {s.reasons.join(' · ')}
                      </div>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
