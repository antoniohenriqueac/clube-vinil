import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ConditionBadge } from '../../components/ConditionBadge'
import { formatPrice, getPlan } from '../../data/plans'
import { SELL_STATUS_LABELS } from '../../data/subscriberSell'
import { useApp } from '../../state/AppContext'

export function AdminSubscriberSells() {
  const {
    state,
    generateSellOffer,
    updateSellListing,
    markSellReceived,
    releaseSellCredit,
  } = useApp()
  const [selectedId, setSelectedId] = useState(
    state.sellListings[0]?.id ?? '',
  )

  const selected = state.sellListings.find((l) => l.id === selectedId)
  const sub = state.subscribers.find((s) => s.id === selected?.subscriberId)

  const sorted = useMemo(
    () =>
      [...state.sellListings].sort((a, b) =>
        b.updatedAt.localeCompare(a.updatedAt),
      ),
    [state.sellListings],
  )

  return (
    <div className="grid-2">
      <section className="surface">
        <h3>Vendas de assinantes</h3>
        <p className="muted">
          Origem integrada ao pipeline de{' '}
          <Link to="/admin/captacao">Captação</Link> (fonte Assinante).
        </p>
        <div className="history-list">
          {sorted.map((l) => {
            const s = state.subscribers.find((x) => x.id === l.subscriberId)
            return (
              <button
                key={l.id}
                type="button"
                className={`kanban__card ${selectedId === l.id ? 'kanban__card--on' : ''}`}
                onClick={() => setSelectedId(l.id)}
              >
                <strong>{s?.name ?? l.subscriberId}</strong>
                <div className="muted" style={{ fontSize: '0.82rem' }}>
                  {SELL_STATUS_LABELS[l.status]} · {l.items.length} disco(s)
                </div>
              </button>
            )
          })}
        </div>
      </section>

      <section className="surface">
        {!selected ? (
          <div className="empty">Selecione um envio.</div>
        ) : (
          <>
            <h3>
              {sub?.name} · {getPlan(sub?.planId ?? '')?.name}
            </h3>
            <p className="muted">
              Status: <strong>{SELL_STATUS_LABELS[selected.status]}</strong>
              {selected.payoutChoice
                ? ` · payout ${selected.payoutChoice}`
                : ''}
              {selected.deliveryMethod
                ? ` · ${selected.deliveryMethod}`
                : ''}
            </p>
            <div className="field">
              <label htmlFor="notes">Notas internas</label>
              <textarea
                id="notes"
                rows={3}
                value={selected.adminNotes}
                onChange={(e) =>
                  updateSellListing({
                    ...selected,
                    adminNotes: e.target.value,
                  })
                }
              />
            </div>
            <div className="inline-actions">
              <button
                type="button"
                className="btn btn-amber btn-sm"
                disabled={
                  selected.status === 'oferta' ||
                  selected.status === 'aceito' ||
                  selected.status === 'recebido' ||
                  selected.status === 'credito-liberado'
                }
                onClick={() => generateSellOffer(selected.id)}
              >
                Gerar / recalcular oferta
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                disabled={selected.status !== 'aceito'}
                onClick={() => markSellReceived(selected.id)}
              >
                Marcar recebido → estoque
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                disabled={
                  selected.status !== 'recebido' ||
                  selected.payoutChoice !== 'credito'
                }
                onClick={() => releaseSellCredit(selected.id)}
              >
                Liberar crédito
              </button>
            </div>

            {selected.offers.length > 0 && (
              <>
                <p style={{ marginTop: '1rem' }}>
                  Totais: crédito{' '}
                  <strong>{formatPrice(selected.offerTotalCredit)}</strong> ·
                  dinheiro{' '}
                  <strong>{formatPrice(selected.offerTotalCash)}</strong>
                </p>
                <div className="table-wrap">
                  <table className="data">
                    <thead>
                      <tr>
                        <th>Disco</th>
                        <th>Mercado</th>
                        <th>Crédito</th>
                        <th>Dinheiro</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {selected.offers.map((o) => (
                        <tr key={o.itemId}>
                          <td>
                            {o.artist} — {o.album}{' '}
                            <ConditionBadge grade={o.condition} />
                          </td>
                          <td>{formatPrice(o.marketValue)}</td>
                          <td>
                            {o.rejected ? '—' : formatPrice(o.creditOffer)}
                          </td>
                          <td>
                            {o.rejected ? '—' : formatPrice(o.cashOffer)}
                          </td>
                          <td className="muted" style={{ fontSize: '0.78rem' }}>
                            {o.rejected
                              ? o.rejectReason
                              : o.inDemand
                                ? `demanda +${o.demandBonus}%`
                                : ''}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {selected.offers.length === 0 && (
              <div className="empty" style={{ marginTop: '1rem' }}>
                Itens enviados ({selected.items.length}). Gere a oferta para
                revisar valores.
              </div>
            )}
          </>
        )}
      </section>
    </div>
  )
}
