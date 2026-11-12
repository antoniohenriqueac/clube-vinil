import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ConditionBadge } from '../../components/ConditionBadge'
import { VinylCover } from '../../components/VinylCover'
import { getPlan, formatPrice } from '../../data/plans'
import { useApp } from '../../state/AppContext'
import type { RatingLabel, Subscriber, VinylRecord } from '../../types'

function DemoLogin() {
  const { state, loginAs } = useApp()
  return (
    <div className="sub-shell">
      <div className="container" style={{ maxWidth: 560 }}>
        <h1 className="page-title">Área do assinante</h1>
        <p className="muted">
          Entre com um assinante de exemplo ou faça o quiz para criar o seu.
        </p>
        <div className="surface">
          <h3>Assinantes demo</h3>
          <div className="chip-grid">
            {state.subscribers
              .filter((s) => s.status !== 'cancelado')
              .map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className="chip"
                  onClick={() => loginAs(s.id)}
                >
                  {s.name} · {getPlan(s.planId)?.name}
                </button>
              ))}
          </div>
          <div className="inline-actions">
            <Link className="btn btn-primary" to="/quiz">
              Fazer quiz e assinar (demo)
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

function RatingBlock({
  record,
  onSubmit,
}: {
  record: VinylRecord
  onSubmit: (stars: number, label: RatingLabel) => void
}) {
  const [stars, setStars] = useState(0)
  const [label, setLabel] = useState<RatingLabel>(null)

  return (
    <div>
      <h3>Como foi o disco?</h3>
      <div className="rating-row">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            className={`star-btn ${stars >= n ? 'star-btn--on' : ''}`}
            onClick={() => setStars(n)}
            aria-label={`${n} estrelas`}
          >
            {n}★
          </button>
        ))}
      </div>
      <div className="rating-row">
        {(
          [
            ['ja-tinha', 'Já tinha'],
            ['nao-curti', 'Não curti'],
            ['amei', 'Amei'],
          ] as const
        ).map(([id, text]) => (
          <button
            key={id}
            type="button"
            className={`tag-btn ${label === id ? 'tag-btn--on' : ''}`}
            onClick={() => setLabel(label === id ? null : id)}
          >
            {text}
          </button>
        ))}
      </div>
      <button
        type="button"
        className="btn btn-primary btn-sm"
        disabled={stars === 0}
        onClick={() => onSubmit(stars, label)}
      >
        Enviar avaliação de {record.album}
      </button>
    </div>
  )
}

function SubscriberDashboard({ sub }: { sub: Subscriber }) {
  const { stock, rateCurrentDisc, updateSubscriber, state } = useApp()
  const plan = getPlan(sub.planId)

  const monthPick = state.monthPicks.find(
    (p) => p.subscriberId === sub.id && p.confirmed,
  )
  const currentIds =
    sub.currentPickIds.length > 0
      ? sub.currentPickIds
      : (monthPick?.recordIds ?? [])

  const currentRecords = currentIds
    .map((id) => stock.find((r) => r.id === id) ?? null)
    .filter(Boolean) as VinylRecord[]

  const history = useMemo(() => {
    return [...sub.deliveries]
      .sort((a, b) => b.month.localeCompare(a.month))
      .flatMap((d) =>
        d.recordIds.map((id) => ({
          month: d.month,
          record: stock.find((r) => r.id === id),
          feedback: d.feedback?.find((f) => f.recordId === id),
        })),
      )
      .filter((x) => x.record)
  }, [sub.deliveries, stock])

  function setStatus(status: Subscriber['status']) {
    updateSubscriber({ ...sub, status })
  }

  return (
    <div className="sub-shell">
      <div className="container">
        <p className="muted">
          Olá, {sub.name} · {plan?.name} · {formatPrice(plan?.price ?? 0)}/mês
          {sub.status !== 'ativo' ? ` · ${sub.status}` : ''}
        </p>
        <h1 className="page-title">Disco do mês</h1>

        {currentRecords.length === 0 ? (
          <div className="empty" style={{ marginBottom: '1.5rem' }}>
            Ainda não há disco confirmado para este mês. Peça à curadoria no{' '}
            <Link to="/admin/curadoria">painel admin</Link> ou explore o
            histórico.
          </div>
        ) : (
          <div className="grid-2" style={{ marginBottom: '2rem' }}>
            {currentRecords.map((record) => (
              <article key={record.id} className="surface">
                <VinylCover record={record} />
                <div style={{ marginTop: '1rem' }}>
                  <div className="inline-actions" style={{ marginTop: 0 }}>
                    <ConditionBadge grade={record.condition} />
                    {record.specialEdition && (
                      <span className="plan__badge">Edição especial</span>
                    )}
                  </div>
                  <h2 style={{ marginTop: '0.75rem' }}>{record.album}</h2>
                  <p className="muted">
                    {record.artist} · {record.year} · {record.genres.join(', ')}
                  </p>
                  <h3>Cartão da história</h3>
                  <p>{record.story}</p>
                  <RatingBlock
                    record={record}
                    onSubmit={(stars, label) =>
                      rateCurrentDisc({ recordId: record.id, stars, label })
                    }
                  />
                </div>
              </article>
            ))}
          </div>
        )}

        <div className="grid-2">
          <section className="surface">
            <h3>Histórico</h3>
            {history.length === 0 ? (
              <p className="muted">Nenhum envio anterior ainda.</p>
            ) : (
              <div className="history-list">
                {history.map((item) => (
                  <div key={`${item.month}-${item.record!.id}`} className="history-item">
                    <VinylCover record={item.record!} showMeta={false} compact />
                    <div>
                      <strong>
                        {item.record!.album}
                      </strong>
                      <div className="muted" style={{ fontSize: '0.85rem' }}>
                        {item.record!.artist} · {item.month}
                        {item.feedback
                          ? ` · ${item.feedback.stars}★${item.feedback.label ? ` · ${item.feedback.label}` : ''}`
                          : ''}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="surface">
            <h3>Conta</h3>
            <p className="muted">
              Status: <strong>{sub.status}</strong>
            </p>
            <div className="inline-actions">
              <Link className="btn btn-ghost btn-sm" to="/assinante/preferencias">
                Editar preferências
              </Link>
              {sub.status === 'ativo' && (
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => setStatus('pausado')}
                >
                  Pausar
                </button>
              )}
              {sub.status === 'pausado' && (
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => setStatus('ativo')}
                >
                  Retomar
                </button>
              )}
              {sub.status !== 'cancelado' && (
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => setStatus('cancelado')}
                >
                  Cancelar
                </button>
              )}
            </div>
            <p className="muted" style={{ marginTop: '1rem', fontSize: '0.85rem' }}>
              Ações apenas locais neste protótipo.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}

export function SubscriberHome() {
  const { sessionSubscriber } = useApp()
  if (!sessionSubscriber) return <DemoLogin />
  return <SubscriberDashboard sub={sessionSubscriber} />
}
