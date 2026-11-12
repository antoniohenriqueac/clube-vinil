import { Link } from 'react-router-dom'
import { brand } from '../brand'
import { publicSellUrl } from '../lib/lotValuation'

export function Flyer() {
  const url = publicSellUrl()
  const qr = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(url)}`

  return (
    <div className="quiz-shell">
      <div className="container">
        <div className="inline-actions" style={{ marginBottom: '1rem' }}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => window.print()}
          >
            Imprimir flyer
          </button>
          <Link className="btn btn-ghost" to="/venda-sua-colecao">
            Formulário
          </Link>
          <Link className="btn btn-ghost" to="/admin/parceiros">
            Parceiros
          </Link>
        </div>

        <article className="flyer">
          <img
            className="flyer__logo"
            src={brand.logoHeader}
            alt={brand.name}
            width={320}
            height={64}
          />
          <p className="flyer__eyebrow">BH · coleções inteiras</p>
          <h1>Compramos discos de vinil</h1>
          <p className="flyer__lead">
            Herança, mudança ou inventário? O <strong>{brand.name}</strong>{' '}
            avalia e compra coleções usadas com proposta justa e retirada.
          </p>
          <ul>
            <li>Sem precisar triar disco a disco</li>
            <li>Atendimento em Belo Horizonte</li>
            <li>Indicações de parceiros bem-vindas</li>
          </ul>
          <div className="flyer__qr">
            <img src={qr} alt="QR code para o formulário Venda sua coleção" />
            <div>
              <strong>Escaneie ou acesse:</strong>
              <div className="flyer__url">{url}</div>
              <p className="muted" style={{ marginTop: '0.5rem' }}>
                WhatsApp demo: anote o número do piloto no verso.
              </p>
            </div>
          </div>
          <p className="flyer__foot">
            {brand.name} — curadoria musical em vinil usado · protótipo
          </p>
        </article>
      </div>
    </div>
  )
}
