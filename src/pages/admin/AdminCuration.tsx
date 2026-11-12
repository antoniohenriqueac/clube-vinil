import { useEffect, useMemo, useState } from 'react'
import { ConditionBadge } from '../../components/ConditionBadge'
import { VinylCover } from '../../components/VinylCover'
import { getPlan } from '../../data/plans'
import { getCatalogMode } from '../../lib/discogs'
import { loadCatalogForSourcing } from '../../lib/discogs'
import { pickForSubscriber, recommendForSubscriber } from '../../lib/recommend'
import {
  exportGarimpoCsv,
  exportGarimpoWhatsApp,
  formatPriceBrl,
  suggestSourcing,
} from '../../lib/sourcing'
import { useApp } from '../../state/AppContext'
import type { CatalogMode, MonthPick, SourcingSuggestion } from '../../types'

export function AdminCuration() {
  const {
    state,
    stock,
    setMonthPicks,
    confirmPicks,
    addToGarimpoList,
    removeFromGarimpoList,
    clearGarimpoList,
  } = useApp()
  const [selectedSubId, setSelectedSubId] = useState(
    state.subscribers.find((s) => s.status === 'ativo')?.id ?? '',
  )
  const [tab, setTab] = useState<'estoque' | 'garimpar'>('garimpar')
  const [mode, setMode] = useState<CatalogMode>('seed')
  const [modeNote, setModeNote] = useState('')
  const [sourcing, setSourcing] = useState<SourcingSuggestion[]>([])
  const [loading, setLoading] = useState(false)

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

  const stockSuggestions = useMemo(() => {
    if (!selected) return []
    return recommendForSubscriber(selected, stock, takenIds).slice(0, 8)
  }, [selected, stock, takenIds])

  const currentPick = state.monthPicks.find(
    (p) => p.subscriberId === selectedSubId,
  )

  const listForSub = state.garimpoList.filter(
    (x) => x.subscriberId === selectedSubId,
  )

  useEffect(() => {
    let cancelled = false
    async function run() {
      if (!selected) return
      setLoading(true)
      const result = await loadCatalogForSourcing(
        selected.profile,
        state.discogsToken,
      )
      if (cancelled) return
      setMode(result.mode)
      setModeNote(result.note)
      setSourcing(
        suggestSourcing(selected.profile, result.releases, stock, 18),
      )
      setLoading(false)
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [selected, state.discogsToken, stock])

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

    const scored = stockSuggestions.find((s) => s.record.id === recordId)
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

  function downloadCsv() {
    if (!selected || !listForSub.length) return
    const csv = exportGarimpoCsv(listForSub)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `garimpo-${selected.name.replace(/\s+/g, '-').toLowerCase()}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function copyWhatsApp() {
    if (!selected || !listForSub.length) return
    const text = exportGarimpoWhatsApp(selected.name, listForSub)
    await navigator.clipboard.writeText(text)
    alert('Texto copiado — cole no WhatsApp.')
  }

  return (
    <div>
      <div className="surface" style={{ marginBottom: '1rem' }}>
        <div className="field" style={{ marginBottom: '0.75rem' }}>
          <label htmlFor="sub">Assinante</label>
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
        <span className="example-tag">
          Catálogo: {mode === 'discogs' ? 'Discogs API' : 'Seed local'} · modo
          efetivo {getCatalogMode(state.discogsToken)}
        </span>
        <p className="muted" style={{ margin: '0.5rem 0 0', fontSize: '0.88rem' }}>
          {modeNote || 'Carregando catálogo…'}
        </p>
        <div className="admin-nav" style={{ marginBottom: 0 }}>
          <button
            type="button"
            className={tab === 'garimpar' ? 'active' : undefined}
            onClick={() => setTab('garimpar')}
            style={{
              padding: '0.45rem 0.8rem',
              border: '1px solid var(--cream-line)',
              background: tab === 'garimpar' ? 'var(--ink)' : 'transparent',
              color: tab === 'garimpar' ? 'var(--paper)' : 'inherit',
              cursor: 'pointer',
            }}
          >
            Sugestões para garimpar
          </button>
          <button
            type="button"
            className={tab === 'estoque' ? 'active' : undefined}
            onClick={() => setTab('estoque')}
            style={{
              padding: '0.45rem 0.8rem',
              border: '1px solid var(--cream-line)',
              background: tab === 'estoque' ? 'var(--ink)' : 'transparent',
              color: tab === 'estoque' ? 'var(--paper)' : 'inherit',
              cursor: 'pointer',
            }}
          >
            Estoque do mês
          </button>
        </div>
      </div>

      {tab === 'garimpar' && selected && (
        <div className="grid-2">
          <section className="surface">
            <h3>O que garimpar para {selected.name.split(' ')[0]}</h3>
            <p className="muted">
              Recomendações de sourcing (catálogo amplo), não só o que já está
              na prateleira. Score explicável por gênero, estilo, década,
              energia/groove e descoberta.
            </p>
            {loading ? (
              <div className="empty">Calculando sugestões…</div>
            ) : sourcing.length === 0 ? (
              <div className="empty">Sem sugestões para este perfil.</div>
            ) : (
              <div className="history-list">
                {sourcing.map((s) => {
                  const maxScore = sourcing[0]?.score || 1
                  const listed = listForSub.some(
                    (x) => x.release.id === s.release.id,
                  )
                  return (
                    <div key={s.release.id} className="surface" style={{ padding: '0.85rem' }}>
                      <strong>
                        {s.release.album}{' '}
                        <span className="muted">({s.release.year})</span>
                      </strong>
                      <div className="muted" style={{ fontSize: '0.85rem' }}>
                        {s.release.artist} ·{' '}
                        {s.release.styles.slice(0, 2).join(', ') ||
                          s.release.genres.join(', ')}{' '}
                        · score {s.score}
                        {s.inStock ? ' · em estoque' : ' · fora do estoque'}
                        {' · ~'}
                        {formatPriceBrl(s.release.typicalUsedPriceBrl)}
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
                      <div className="inline-actions">
                        <button
                          type="button"
                          className="btn btn-amber btn-sm"
                          disabled={listed}
                          onClick={() =>
                            addToGarimpoList({
                              subscriberId: selected.id,
                              release: s.release,
                              score: s.score,
                              reasons: s.reasons,
                            })
                          }
                        >
                          {listed ? 'Na lista' : 'Add lista de garimpo'}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </section>

          <section className="surface">
            <h3>Lista de garimpo ({listForSub.length})</h3>
            <p className="muted">
              Lista de compras para sebos, OLX, feiras e Discogs Marketplace.
            </p>
            {listForSub.length === 0 ? (
              <div className="empty">Nenhum item ainda.</div>
            ) : (
              <div className="history-list">
                {listForSub.map((item) => (
                  <div key={item.id} className="history-item">
                    <div>
                      <strong>
                        {item.release.artist} — {item.release.album}
                      </strong>
                      <div className="muted" style={{ fontSize: '0.82rem' }}>
                        {item.release.year} · score {item.score} ·{' '}
                        {formatPriceBrl(item.release.typicalUsedPriceBrl)}
                      </div>
                    </div>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => removeFromGarimpoList(item.id)}
                    >
                      Remover
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="inline-actions">
              <button
                type="button"
                className="btn btn-primary btn-sm"
                disabled={!listForSub.length}
                onClick={downloadCsv}
              >
                Exportar CSV
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                disabled={!listForSub.length}
                onClick={() => void copyWhatsApp()}
              >
                Copiar p/ WhatsApp
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                disabled={!listForSub.length}
                onClick={() => clearGarimpoList(selected.id)}
              >
                Limpar lista
              </button>
            </div>
          </section>
        </div>
      )}

      {tab === 'estoque' && (
        <div className="grid-2">
          <section className="surface">
            <h3>Pick do mês (estoque)</h3>
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
                  <li>Estilos: {selected.profile.styles.join(', ') || '—'}</li>
                  <li>Décadas: {selected.profile.decades.join(', ') || '—'}</li>
                  <li>
                    Energia {selected.profile.energy} · Groove{' '}
                    {selected.profile.groove} · Descoberta{' '}
                    {selected.profile.discoveryLevel}%
                  </li>
                </ul>
              </div>
            )}
          </section>

          <section className="surface">
            <h3>Sugestões no estoque</h3>
            {stockSuggestions.length === 0 ? (
              <div className="empty">Sem sugestões de estoque.</div>
            ) : (
              <div className="history-list">
                {stockSuggestions.map((s) => {
                  const selectedIds = currentPick?.recordIds ?? []
                  const on = selectedIds.includes(s.record.id)
                  const maxScore = stockSuggestions[0]?.score || 1
                  return (
                    <button
                      key={s.record.id}
                      type="button"
                      onClick={() => selectRecord(s.record.id)}
                      className="surface"
                      style={{
                        textAlign: 'left',
                        cursor: 'pointer',
                        borderColor: on ? 'var(--gold)' : undefined,
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
      )}
    </div>
  )
}
