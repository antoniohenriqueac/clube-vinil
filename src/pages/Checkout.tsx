import { useMemo, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { PlanCard } from '../components/PlanCard'
import { plans } from '../data/plans'
import { summarizeProfile } from '../lib/recommend'
import { useApp } from '../state/AppContext'
import type { MusicalProfile, PlanId } from '../types'

export function Checkout() {
  const navigate = useNavigate()
  const { state, completeCheckout, setSelectedPlan } = useApp()
  const draft = state.onboardingDraft as MusicalProfile | null
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [done, setDone] = useState(false)

  const summary = useMemo(
    () => (draft ? summarizeProfile(draft as MusicalProfile) : []),
    [draft],
  )

  if (!draft || !draft.genres) {
    return <Navigate to="/quiz" replace />
  }

  const profile = draft as MusicalProfile
  const selected = state.selectedPlanId

  function confirm() {
    if (!selected || !name.trim() || !email.trim()) return
    completeCheckout({
      name: name.trim(),
      email: email.trim(),
      planId: selected,
      profile,
    })
    setDone(true)
  }

  if (done) {
    return (
      <div className="quiz-shell">
        <div className="container" style={{ maxWidth: 560 }}>
          <div className="surface">
            <span className="example-tag">Demonstração</span>
            <h1 className="page-title">Assinatura simulada!</h1>
            <p>
              Nenhum pagamento foi processado. Você já pode explorar a área do
              assinante com o disco do mês (após a curadoria no admin) e avaliar
              os envios.
            </p>
            <div className="inline-actions">
              <Link className="btn btn-primary" to="/assinante">
                Ir para área do assinante
              </Link>
              <Link className="btn btn-ghost" to="/admin/curadoria">
                Ver painel de curadoria
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="quiz-shell">
      <div className="container">
        <span className="example-tag">Checkout demonstração — sem cartão</span>
        <h1 className="page-title">Escolha seu plano</h1>
        <p className="muted">
          Frete à parte no piloto. Nenhum dado de pagamento é solicitado.
        </p>

        <div className="profile-summary" style={{ maxWidth: 640 }}>
          <h3>Perfil musical</h3>
          <ul>
            {summary.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>

        <div className="plans-grid" style={{ marginBottom: '2rem' }}>
          {plans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              featured={selected === plan.id}
              ctaLabel={selected === plan.id ? 'Selecionado' : 'Selecionar'}
              onSelect={() => setSelectedPlan(plan.id as PlanId)}
            />
          ))}
        </div>

        {selected && (
          <div className="surface" style={{ maxWidth: 520 }}>
            <h3>Dados para a demonstração</h3>
            <div className="field">
              <label htmlFor="name">Nome</label>
              <input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome"
              />
            </div>
            <div className="field">
              <label htmlFor="email">E-mail</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="voce@email.com"
              />
            </div>
            <p className="muted" style={{ fontSize: '0.88rem' }}>
              Ao confirmar, criamos um assinante local no navegador
              (localStorage). Não há cobrança. Se você acumular crédito vendendo
              discos, o abatimento aparece na área do assinante / carteira.
            </p>
            <div className="inline-actions">
              <button
                type="button"
                className="btn btn-amber"
                onClick={confirm}
                disabled={!name.trim() || !email.trim()}
              >
                Confirmar assinatura (demo)
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => navigate('/quiz')}
              >
                Refazer quiz
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
