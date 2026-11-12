import { Link } from 'react-router-dom'
import { formatPrice } from '../data/plans'
import type { Plan } from '../types'

export function PlanCard({
  plan,
  featured = false,
  ctaTo = '/quiz',
  ctaLabel = 'Começar quiz',
  onSelect,
}: {
  plan: Plan
  featured?: boolean
  ctaTo?: string
  ctaLabel?: string
  onSelect?: () => void
}) {
  return (
    <article className={`plan ${featured ? 'plan--featured' : ''}`}>
      {plan.badge && <span className="plan__badge">{plan.badge}</span>}
      <h3>{plan.name}</h3>
      <div className="plan__price">
        {formatPrice(plan.price)}
        <small>/mês</small>
      </div>
      <p className="muted">{plan.description}</p>
      <ul>
        {plan.features.map((f) => (
          <li key={f}>{f}</li>
        ))}
      </ul>
      <p className="muted" style={{ fontSize: '0.82rem', margin: 0 }}>
        Frete cobrado à parte no piloto.
      </p>
      {onSelect ? (
        <button type="button" className="btn btn-primary" onClick={onSelect}>
          {ctaLabel}
        </button>
      ) : (
        <Link className="btn btn-primary" to={ctaTo}>
          {ctaLabel}
        </Link>
      )}
    </article>
  )
}
