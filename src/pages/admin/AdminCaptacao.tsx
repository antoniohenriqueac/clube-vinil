import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { LEAD_SOURCES, LEAD_STAGES } from '../../data/captacao'
import { loadCatalogForLotTitles } from '../../lib/discogs'
import { formatPrice } from '../../data/plans'
import {
  parseTitleLines,
  valueLot,
} from '../../lib/lotValuation'
import { useApp } from '../../state/AppContext'
import type { CollectionLead, LeadSource, LeadStage, LotValuationSummary } from '../../types'

export function AdminCaptacao() {
  const { state, updateCollectionLead, purchaseLeadIntoStock } = useApp()
  const [selectedId, setSelectedId] = useState(
    state.collectionLeads[0]?.id ?? '',
  )
  const [valuating, setValuating] = useState(false)
  const [valuation, setValuation] = useState<LotValuationSummary | null>(null)
  const [note, setNote] = useState('')

  const selected = state.collectionLeads.find((l) => l.id === selectedId)

  const byStage = useMemo(() => {
    const map: Record<LeadStage, CollectionLead[]> = {
      novo: [],
      contato: [],
      visita: [],
      proposta: [],
      comprado: [],
      perdido: [],
    }
    for (const lead of state.collectionLeads) map[lead.stage].push(lead)
    return map
  }, [state.collectionLeads])

  function patch(partial: Partial<CollectionLead>) {
    if (!selected) return
    updateCollectionLead({ ...selected, ...partial })
  }

  async function runValuation() {
    if (!selected) return
    setValuating(true)
    setNote('')
    const titles = parseTitleLines(selected.titlesText)
    const { catalog, mode, note: n } = await loadCatalogForLotTitles(
      titles,
      state.discogsToken,
    )
    const result = valueLot({
      titlesText: selected.titlesText,
      condition: selected.condition,
      catalog,
      subscribers: state.subscribers,
      offerPercent: selected.offerPercent,
      mode,
    })
    setValuation(result)
    setNote(n)
    updateCollectionLead({ ...selected, valuationSnapshot: result })
    setValuating(false)
  }

  function markPurchased() {
    if (!selected || !valuation) return
    if (!confirm('Mover itens casados para o estoque e marcar lead como Comprado?'))
      return
    purchaseLeadIntoStock({ leadId: selected.id, valuation })
  }

  return (
    <div>
      <p className="muted">
        Pipeline de captação de coleções inteiras — o canal mais rentável (herança,
        mudança, inventário).{' '}
        <Link to="/venda-sua-colecao">Formulário público</Link> ·{' '}
        <Link to="/admin/parceiros">Parceiros</Link> ·{' '}
        <Link to="/flyer">Flyer/QR</Link>
      </p>

      <div className="kanban">
        {LEAD_STAGES.map((stage) => (
          <div key={stage.id} className="kanban__col">
            <h3>
              {stage.label}{' '}
              <span className="muted">({byStage[stage.id].length})</span>
            </h3>
            {byStage[stage.id].map((lead) => (
              <button
                key={lead.id}
                type="button"
                className={`kanban__card ${selectedId === lead.id ? 'kanban__card--on' : ''}`}
                onClick={() => {
                  setSelectedId(lead.id)
                  setValuation(lead.valuationSnapshot ?? null)
                }}
              >
                <strong>{lead.name}</strong>
                <div className="muted" style={{ fontSize: '0.8rem' }}>
                  ~{lead.approxCount} discos · {lead.neighborhood}
                </div>
                <div className="muted" style={{ fontSize: '0.75rem' }}>
                  {LEAD_SOURCES.find((s) => s.id === lead.source)?.label}
                </div>
              </button>
            ))}
          </div>
        ))}
      </div>

      {selected && (
        <div className="grid-2" style={{ marginTop: '1.25rem' }}>
          <section className="surface">
            <h3>{selected.name}</h3>
            <p className="muted">
              {selected.whatsapp} · {selected.neighborhood}, {selected.city}
            </p>
            <div className="field">
              <label htmlFor="stage">Etapa</label>
              <select
                id="stage"
                value={selected.stage}
                onChange={(e) =>
                  patch({ stage: e.target.value as LeadStage })
                }
              >
                {LEAD_STAGES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="source">Fonte</label>
              <select
                id="source"
                value={selected.source}
                onChange={(e) =>
                  patch({ source: e.target.value as LeadSource })
                }
              >
                {LEAD_SOURCES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="next">Próximo passo (data)</label>
              <input
                id="next"
                type="date"
                value={selected.nextStepDate ?? ''}
                onChange={(e) =>
                  patch({ nextStepDate: e.target.value || null })
                }
              />
            </div>
            <div className="field">
              <label htmlFor="notes">Notas</label>
              <textarea
                id="notes"
                rows={4}
                value={selected.notes}
                onChange={(e) => patch({ notes: e.target.value })}
              />
            </div>
            <div className="field">
              <label htmlFor="titles">Títulos do lote</label>
              <textarea
                id="titles"
                rows={6}
                value={selected.titlesText}
                onChange={(e) => patch({ titlesText: e.target.value })}
              />
            </div>
            <div className="field">
              <label htmlFor="pct">
                % da oferta sobre valor de revenda estimado ({selected.offerPercent}%)
              </label>
              <input
                id="pct"
                type="range"
                min={20}
                max={40}
                value={selected.offerPercent}
                onChange={(e) =>
                  patch({ offerPercent: Number(e.target.value) })
                }
              />
              <div className="slider-labels">
                <span>20%</span>
                <span>sugerido 25–35%</span>
                <span>40%</span>
              </div>
            </div>
            {selected.photoDataUrls.length > 0 && (
              <div className="photo-row">
                {selected.photoDataUrls.map((src) => (
                  <img key={src.slice(0, 32)} src={src} alt="Foto do lote" />
                ))}
              </div>
            )}
          </section>

          <section className="surface">
            <h3>Avaliação do lote</h3>
            <p className="muted">
              Casa títulos com Discogs (se houver token) ou seed; ajusta por
              condição; estima oferta e quantos assinantes o lote atende.
            </p>
            <div className="inline-actions">
              <button
                type="button"
                className="btn btn-amber"
                disabled={valuating || !selected.titlesText.trim()}
                onClick={() => void runValuation()}
              >
                {valuating ? 'Avaliando…' : 'Avaliar lote'}
              </button>
              <button
                type="button"
                className="btn btn-primary"
                disabled={!valuation || selected.stage === 'comprado'}
                onClick={markPurchased}
              >
                Comprado → estoque
              </button>
            </div>
            {note && (
              <p className="muted" style={{ fontSize: '0.85rem' }}>
                {note}
              </p>
            )}
            {(valuation || selected.valuationSnapshot) && (
              <ValuationView
                data={valuation ?? selected.valuationSnapshot!}
              />
            )}
          </section>
        </div>
      )}
    </div>
  )
}

function ValuationView({ data }: { data: LotValuationSummary }) {
  return (
    <div style={{ marginTop: '1rem' }}>
      <span className="example-tag">
        Modo {data.mode} · dados estimados
      </span>
      <div className="kpi-grid">
        <div className="kpi">
          <span>Revenda estimada</span>
          <strong>{formatPrice(data.resaleTotal)}</strong>
        </div>
        <div className="kpi">
          <span>Oferta sugerida ({data.offerPercent}%)</span>
          <strong>{formatPrice(data.suggestedOffer)}</strong>
        </div>
        <div className="kpi">
          <span>Custo médio / disco</span>
          <strong>{formatPrice(data.avgCostPerDisc)}</strong>
        </div>
        <div className="kpi">
          <span>Meta aquisição (R$ 25)</span>
          <strong>
            {data.avgCostPerDisc <= data.targetAcquisitionCost
              ? 'Dentro'
              : 'Acima'}
          </strong>
        </div>
        <div className="kpi">
          <span>Discos que casam assinantes</span>
          <strong>
            {data.discsMatchingSubscribers}/{data.matchedCount}
          </strong>
        </div>
        <div className="kpi">
          <span>Assinantes atendidos</span>
          <strong>{data.subscribersServed}</strong>
        </div>
      </div>
      <div className="table-wrap" style={{ marginTop: '0.85rem' }}>
        <table className="data">
          <thead>
            <tr>
              <th>Entrada</th>
              <th>Match</th>
              <th>Preço aj.</th>
              <th>Assinantes</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((item) => (
              <tr key={item.raw}>
                <td>{item.raw}</td>
                <td>
                  {item.matched && item.release
                    ? `${item.release.artist} — ${item.release.album}`
                    : '—'}
                </td>
                <td>
                  {item.matched ? formatPrice(item.adjustedPrice) : '—'}
                </td>
                <td>{item.matchingSubscriberIds.length || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="muted" style={{ fontSize: '0.82rem' }}>
        Casados: {data.matchedCount} · sem match: {data.unmatchedCount}
      </p>
    </div>
  )
}
