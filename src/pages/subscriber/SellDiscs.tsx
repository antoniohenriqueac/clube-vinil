import { useMemo, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { ConditionBadge } from '../../components/ConditionBadge'
import { formatPrice } from '../../data/plans'
import {
  seedDiscogsCollection,
  SELL_STATUS_LABELS,
} from '../../data/subscriberSell'
import { useApp } from '../../state/AppContext'
import type {
  ConditionGrade,
  DeliveryMethod,
  PayoutChoice,
  SellItemDraft,
} from '../../types'

const CONDITIONS: ConditionGrade[] = ['Mint', 'NM', 'VG+', 'VG', 'G']

export function SellDiscs() {
  const {
    sessionSubscriber,
    state,
    submitSellListing,
    acceptSellOffer,
    refuseSellOffer,
  } = useApp()
  const [artist, setArtist] = useState('')
  const [album, setAlbum] = useState('')
  const [condition, setCondition] = useState<ConditionGrade>('VG+')
  const [items, setItems] = useState<SellItemDraft[]>([])
  const [payout, setPayout] = useState<PayoutChoice>('credito')
  const [delivery, setDelivery] = useState<DeliveryMethod>('ponto-bh')
  const [msg, setMsg] = useState('')

  const myListings = useMemo(
    () =>
      sessionSubscriber
        ? state.sellListings.filter(
            (l) => l.subscriberId === sessionSubscriber.id,
          )
        : [],
    [state.sellListings, sessionSubscriber],
  )

  const openOffer = myListings.find((l) => l.status === 'oferta')

  if (!sessionSubscriber) return <Navigate to="/assinante" replace />

  function addItem() {
    if (!artist.trim() || !album.trim()) return
    setItems((prev) => [
      ...prev,
      {
        id: `si-${Date.now()}-${prev.length}`,
        artist: artist.trim(),
        album: album.trim(),
        condition,
        photoDataUrls: [],
      },
    ])
    setArtist('')
    setAlbum('')
  }

  function importSeedDiscogs() {
    const imported: SellItemDraft[] = seedDiscogsCollection.map((row, i) => ({
      id: `si-seed-${Date.now()}-${i}`,
      artist: row.artist,
      album: row.album,
      condition: row.condition,
      photoDataUrls: [],
      fromDiscogsSeed: true,
    }))
    setItems((prev) => [...prev, ...imported])
    setMsg('Coleção Discogs de exemplo importada (modo seed).')
  }

  function submit() {
    if (!sessionSubscriber) return
    if (!items.length) {
      setMsg('Adicione ao menos um disco.')
      return
    }
    submitSellListing({
      subscriberId: sessionSubscriber.id,
      items,
    })
    setItems([])
    setMsg('Lista enviada! Acompanhe o status abaixo — o admin avalia a oferta.')
  }

  return (
    <div className="sub-shell">
      <div className="container">
        <p className="muted">
          <Link to="/assinante">← Área do assinante</Link>
          {' · '}
          <Link to="/assinante/carteira">Carteira de crédito</Link>
        </p>
        <h1 className="page-title">Vender meus discos</h1>
        <p className="muted">
          Troque discos parados por <strong>crédito na assinatura</strong>{' '}
          (abatimento nas próximas mensalidades) ou dinheiro com valor menor —
          inspirado no modelo Loved Again.
        </p>

        {msg && (
          <p className="surface" style={{ marginBottom: '1rem' }}>
            {msg}
          </p>
        )}

        {openOffer && (
          <section className="surface" style={{ marginBottom: '1.25rem' }}>
            <span className="example-tag">Oferta disponível</span>
            <h3>Sua oferta</h3>
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
                  {openOffer.offers.map((o) => (
                    <tr key={o.itemId}>
                      <td>
                        {o.artist} — {o.album}{' '}
                        <ConditionBadge grade={o.condition} />
                        {o.inDemand && (
                          <span className="plan__badge">Demanda</span>
                        )}
                      </td>
                      <td>{formatPrice(o.marketValue)}</td>
                      <td>
                        {o.rejected ? '—' : formatPrice(o.creditOffer)}
                      </td>
                      <td>{o.rejected ? '—' : formatPrice(o.cashOffer)}</td>
                      <td className="muted" style={{ fontSize: '0.8rem' }}>
                        {o.rejected ? o.rejectReason : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p>
              Total crédito: <strong>{formatPrice(openOffer.offerTotalCredit)}</strong>
              {' · '}
              Total dinheiro: <strong>{formatPrice(openOffer.offerTotalCash)}</strong>
            </p>
            <div className="chip-grid">
              <button
                type="button"
                className={`chip ${payout === 'credito' ? 'chip--on' : ''}`}
                onClick={() => setPayout('credito')}
              >
                Quero crédito ({formatPrice(openOffer.offerTotalCredit)})
              </button>
              <button
                type="button"
                className={`chip ${payout === 'dinheiro' ? 'chip--on' : ''}`}
                onClick={() => setPayout('dinheiro')}
              >
                Quero dinheiro ({formatPrice(openOffer.offerTotalCash)})
              </button>
            </div>
            <div className="field">
              <label htmlFor="delivery">Entrega</label>
              <select
                id="delivery"
                value={delivery}
                onChange={(e) =>
                  setDelivery(e.target.value as DeliveryMethod)
                }
              >
                <option value="ponto-bh">Deixar em ponto em BH</option>
                <option value="coleta">Solicitar coleta</option>
              </select>
            </div>
            <div className="inline-actions">
              <button
                type="button"
                className="btn btn-amber"
                onClick={() => {
                  acceptSellOffer({
                    listingId: openOffer.id,
                    payoutChoice: payout,
                    deliveryMethod: delivery,
                  })
                  setMsg(
                    payout === 'credito'
                      ? 'Oferta aceita! Após o recebimento, o crédito será liberado.'
                      : 'Oferta aceita em dinheiro (demo). Após o recebimento, o admin finaliza.',
                  )
                }}
              >
                Aceitar oferta
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => {
                  refuseSellOffer(openOffer.id)
                  setMsg('Oferta recusada.')
                }}
              >
                Recusar
              </button>
            </div>
          </section>
        )}

        <div className="grid-2">
          <section className="surface">
            <h3>Listar discos</h3>
            <div className="field">
              <label htmlFor="artist">Artista</label>
              <input
                id="artist"
                value={artist}
                onChange={(e) => setArtist(e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="album">Título</label>
              <input
                id="album"
                value={album}
                onChange={(e) => setAlbum(e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="cond">Estado (Goldmine)</label>
              <select
                id="cond"
                value={condition}
                onChange={(e) =>
                  setCondition(e.target.value as ConditionGrade)
                }
              >
                {CONDITIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="inline-actions">
              <button type="button" className="btn btn-primary btn-sm" onClick={addItem}>
                Adicionar
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={importSeedDiscogs}
              >
                Importar coleção Discogs (seed)
              </button>
            </div>
            {items.length > 0 && (
              <ul style={{ marginTop: '1rem' }}>
                {items.map((it) => (
                  <li key={it.id}>
                    {it.artist} — {it.album}{' '}
                    <ConditionBadge grade={it.condition} />
                    {it.fromDiscogsSeed ? ' · Discogs seed' : ''}{' '}
                    <button
                      type="button"
                      className="linkish"
                      onClick={() =>
                        setItems((prev) => prev.filter((x) => x.id !== it.id))
                      }
                    >
                      remover
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <div className="inline-actions">
              <button type="button" className="btn btn-amber" onClick={submit}>
                Enviar para avaliação
              </button>
            </div>
            <p className="muted" style={{ fontSize: '0.82rem' }}>
              Regras demo: ~{state.sellConfig.creditPercent}% em crédito · ~
              {state.sellConfig.cashPercent}% em dinheiro · bônus se houver
              demanda · mínimo R$ {state.sellConfig.minMarketValue}.
            </p>
          </section>

          <section className="surface">
            <h3>Meus envios</h3>
            {myListings.length === 0 ? (
              <div className="empty">Nenhum envio ainda.</div>
            ) : (
              <div className="history-list">
                {myListings.map((l) => (
                  <div key={l.id} className="surface" style={{ padding: '0.85rem' }}>
                    <strong>{SELL_STATUS_LABELS[l.status]}</strong>
                    <div className="muted" style={{ fontSize: '0.85rem' }}>
                      {l.items.length} disco(s) ·{' '}
                      {new Date(l.createdAt).toLocaleDateString('pt-BR')}
                      {l.payoutChoice
                        ? ` · ${l.payoutChoice}`
                        : ''}
                    </div>
                    {l.offerTotalCredit > 0 && (
                      <div className="muted" style={{ fontSize: '0.85rem' }}>
                        Oferta crédito {formatPrice(l.offerTotalCredit)} / dinheiro{' '}
                        {formatPrice(l.offerTotalCash)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
