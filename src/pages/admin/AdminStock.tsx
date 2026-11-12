import { ConditionBadge } from '../../components/ConditionBadge'
import { formatPrice } from '../../data/plans'
import { useApp } from '../../state/AppContext'

const sourceLabel: Record<string, string> = {
  'colecao-inteira': 'Coleção inteira',
  sebo: 'Sebo',
  olx: 'OLX',
  marketplace: 'Marketplace',
  feira: 'Feira',
  lote: 'Lote',
}

export function AdminStock() {
  const { stock } = useApp()
  const inStock = stock.filter((r) => r.inStock).length

  return (
    <section className="surface">
      <h3>
        Estoque ({inStock} disponíveis / {stock.length} total)
      </h3>
      <p className="muted">
        Capas são placeholders CSS/SVG — sem imagens protegidas por direitos
        autorais.
      </p>
      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>Álbum</th>
              <th>Ano</th>
              <th>Gênero</th>
              <th>Condição</th>
              <th>Custo</th>
              <th>Fonte</th>
              <th>Tier</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {stock.map((r) => (
              <tr key={r.id}>
                <td>
                  <strong>{r.album}</strong>
                  <div className="muted">{r.artist}</div>
                </td>
                <td>{r.year}</td>
                <td>{r.genres.join(', ')}</td>
                <td>
                  <ConditionBadge grade={r.condition} />
                </td>
                <td>{formatPrice(r.cost)}</td>
                <td>{sourceLabel[r.source] ?? r.source}</td>
                <td>
                  {r.valueTier}
                  {r.specialEdition ? ' ★' : ''}
                </td>
                <td>{r.inStock ? 'Disponível' : 'Reservado'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
