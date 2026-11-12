import { Link } from 'react-router-dom'
import { formatPrice } from '../../data/plans'
import { computeCaptacaoKpis } from '../../lib/captacaoKpis'
import {
  computePilotKpis,
  mrrFromSubscribers,
  unitEconomicsGarimpo,
} from '../../lib/economics'
import { useApp } from '../../state/AppContext'

export function AdminDashboard() {
  const { state } = useApp()
  const kpis = computePilotKpis(state.subscribers)
  const mrr = mrrFromSubscribers(state.subscribers)
  const u = unitEconomicsGarimpo
  const captacao = computeCaptacaoKpis(state.collectionLeads)

  return (
    <>
      <div className="grid-2">
        <section className="surface">
          <span className="example-tag">Dados de exemplo</span>
          <h3>KPIs do piloto</h3>
          <div className="kpi-grid">
            <div className="kpi">
              <span>Assinantes ativos</span>
              <strong>
                {kpis.subscribersActive}/{kpis.subscribersTotal}
              </strong>
            </div>
            <div className="kpi">
              <span>Retenção (meta ≥80%)</span>
              <strong>{kpis.retentionRate}%</strong>
            </div>
            <div className="kpi">
              <span>Satisfação curadoria</span>
              <strong>{kpis.avgSatisfaction || '—'}★</strong>
            </div>
            <div className="kpi">
              <span>Problemas qualidade (meta &lt;5%)</span>
              <strong>{kpis.qualityIssueRate}%</strong>
            </div>
            <div className="kpi">
              <span>Margem/disco (aprox.)</span>
              <strong>{formatPrice(kpis.marginPerDisc)}</strong>
            </div>
            <div className="kpi">
              <span>CAC estimado</span>
              <strong>{formatPrice(kpis.estimatedCac)}</strong>
            </div>
            <div className="kpi">
              <span>MRR ativo</span>
              <strong>{formatPrice(mrr)}</strong>
            </div>
          </div>
        </section>

        <section className="surface">
          <span className="example-tag">Hipótese unit economics · Garimpo</span>
          <h3>Economia unitária</h3>
          <table className="data">
            <tbody>
              <tr>
                <td>Receita</td>
                <td>{formatPrice(u.receita)}</td>
              </tr>
              <tr>
                <td>Aquisição do disco</td>
                <td>−{formatPrice(u.aquisicaoDisco)}</td>
              </tr>
              <tr>
                <td>Limpeza e preparação</td>
                <td>−{formatPrice(u.limpezaPreparacao)}</td>
              </tr>
              <tr>
                <td>Embalagem</td>
                <td>−{formatPrice(u.embalagem)}</td>
              </tr>
              <tr>
                <td>Pagamento/plataforma</td>
                <td>−{formatPrice(u.pagamentoPlataforma)}</td>
              </tr>
              <tr>
                <td>Outros</td>
                <td>−{formatPrice(u.outros)}</td>
              </tr>
              <tr>
                <td>
                  <strong>Contribuição</strong>
                </td>
                <td>
                  <strong>{formatPrice(u.contribuicao)}</strong>
                </td>
              </tr>
            </tbody>
          </table>
          <p className="muted" style={{ marginTop: '0.85rem', fontSize: '0.85rem' }}>
            {u.notas}
          </p>
        </section>
      </div>

      <section className="surface" style={{ marginTop: '1.25rem' }}>
        <span className="example-tag">Captação · dados de exemplo</span>
        <h3>Captação de coleções</h3>
        <div className="kpi-grid">
          <div className="kpi">
            <span>Leads</span>
            <strong>{captacao.leadsTotal}</strong>
          </div>
          <div className="kpi">
            <span>Lotes comprados</span>
            <strong>{captacao.lotsBought}</strong>
          </div>
          <div className="kpi">
            <span>Conversão (comprado/fechados)</span>
            <strong>{captacao.conversionRate}%</strong>
          </div>
          <div className="kpi">
            <span>Custo médio/disco adquirido</span>
            <strong>
              {captacao.avgCostPerDiscAcquired
                ? formatPrice(captacao.avgCostPerDiscAcquired)
                : '—'}
            </strong>
          </div>
        </div>
        <h4 style={{ marginTop: '1rem' }}>Leads por fonte</h4>
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Fonte</th>
                <th>Qtd</th>
              </tr>
            </thead>
            <tbody>
              {captacao.leadsBySource.map((row) => (
                <tr key={row.source}>
                  <td>{row.label}</td>
                  <td>{row.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="inline-actions">
          <Link className="btn btn-primary btn-sm" to="/admin/captacao">
            Abrir pipeline
          </Link>
        </div>
      </section>
    </>
  )
}
