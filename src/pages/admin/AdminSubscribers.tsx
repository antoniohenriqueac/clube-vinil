import { Link } from 'react-router-dom'
import { getPlan, formatPrice } from '../../data/plans'
import { summarizeProfile } from '../../lib/recommend'
import { useApp } from '../../state/AppContext'

export function AdminSubscribers() {
  const { state, loginAs } = useApp()

  return (
    <section className="surface">
      <h3>Assinantes ({state.subscribers.length})</h3>
      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Plano</th>
              <th>Status</th>
              <th>Perfil</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {state.subscribers.map((s) => (
              <tr key={s.id}>
                <td>
                  <strong>{s.name}</strong>
                  <div className="muted">{s.email}</div>
                </td>
                <td>
                  {getPlan(s.planId)?.name}
                  <div className="muted">
                    {formatPrice(getPlan(s.planId)?.price ?? 0)}
                  </div>
                </td>
                <td>{s.status}</td>
                <td style={{ maxWidth: 280, fontSize: '0.82rem' }}>
                  {summarizeProfile(s.profile).slice(0, 3).join(' · ')}
                </td>
                <td>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => loginAs(s.id)}
                  >
                    Ver como
                  </button>{' '}
                  <Link className="btn btn-ghost btn-sm" to="/assinante">
                    Abrir
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
