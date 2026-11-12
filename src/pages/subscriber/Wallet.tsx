import { Link, Navigate } from 'react-router-dom'
import { formatPrice, getPlan } from '../../data/plans'
import {
  nextPaymentWithCredit,
  walletBalance,
} from '../../lib/sellOffer'
import { useApp } from '../../state/AppContext'

export function Wallet() {
  const { sessionSubscriber, state, applyMonthlyCredit } = useApp()
  if (!sessionSubscriber) return <Navigate to="/assinante" replace />

  const balance = walletBalance(state.walletEntries, sessionSubscriber.id)
  const plan = getPlan(sessionSubscriber.planId)
  const planPrice = plan?.price ?? 0
  const next = nextPaymentWithCredit({
    planPrice,
    creditBalance: Math.max(0, balance),
  })
  const entries = state.walletEntries.filter(
    (e) => e.subscriberId === sessionSubscriber.id,
  )

  return (
    <div className="sub-shell">
      <div className="container" style={{ maxWidth: 720 }}>
        <p className="muted">
          <Link to="/assinante">← Área do assinante</Link>
          {' · '}
          <Link to="/assinante/vender">Vender meus discos</Link>
        </p>
        <h1 className="page-title">Carteira de crédito</h1>
        <p className="muted">
          Créditos da venda de discos abatem as próximas mensalidades.
        </p>

        <div className="kpi-grid" style={{ marginBottom: '1.25rem' }}>
          <div className="kpi">
            <span>Saldo</span>
            <strong>{formatPrice(Math.max(0, balance))}</strong>
          </div>
          <div className="kpi">
            <span>Próxima mensalidade</span>
            <strong>{formatPrice(planPrice)}</strong>
          </div>
          <div className="kpi">
            <span>Crédito a aplicar</span>
            <strong>{formatPrice(next.creditApplied)}</strong>
          </div>
          <div className="kpi">
            <span>Você paga</span>
            <strong>{formatPrice(next.due)}</strong>
          </div>
        </div>

        <section className="surface" style={{ marginBottom: '1.25rem' }}>
          <h3>Próximo pagamento (demo)</h3>
          <p>
            Plano {plan?.name}: {formatPrice(planPrice)} − crédito{' '}
            {formatPrice(next.creditApplied)} ={' '}
            <strong>{formatPrice(next.due)}</strong>
            {next.remainingCredit > 0
              ? ` · sobra ${formatPrice(next.remainingCredit)} para o mês seguinte`
              : ''}
          </p>
          <button
            type="button"
            className="btn btn-primary"
            disabled={next.creditApplied <= 0}
            onClick={() => {
              const applied = applyMonthlyCredit(
                sessionSubscriber.id,
                planPrice,
              )
              if (applied > 0) {
                alert(
                  `Crédito de ${formatPrice(applied)} aplicado na mensalidade (demo).`,
                )
              }
            }}
          >
            Aplicar crédito na mensalidade
          </button>
        </section>

        <section className="surface">
          <h3>Extrato</h3>
          {entries.length === 0 ? (
            <div className="empty">Sem lançamentos.</div>
          ) : (
            <div className="table-wrap">
              <table className="data">
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Descrição</th>
                    <th>Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((e) => (
                    <tr key={e.id}>
                      <td>
                        {new Date(e.createdAt).toLocaleDateString('pt-BR')}
                      </td>
                      <td>{e.label}</td>
                      <td
                        style={{
                          color:
                            e.amount >= 0
                              ? 'var(--success)'
                              : 'var(--burgundy)',
                        }}
                      >
                        {formatPrice(e.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
