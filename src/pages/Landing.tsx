import { Link } from 'react-router-dom'
import { brand } from '../brand'
import { PlanCard } from '../components/PlanCard'
import { faqs } from '../data/faqs'
import { plans } from '../data/plans'

const steps = [
  {
    title: 'Quiz musical',
    text: 'Artistas, gêneros, décadas, o que evitar e quanto quer descobrir.',
  },
  {
    title: 'Match com estoque',
    text: 'O sistema cruza seu perfil com discos disponíveis e sugere picks.',
  },
  {
    title: 'Grading & limpeza',
    text: 'Cada disco é classificado (Mint → G), testado e preparado.',
  },
  {
    title: 'Embalagem + história',
    text: 'Embalagem especial e um cartão contando a história do álbum.',
  },
  {
    title: 'Feedback',
    text: 'Você avalia o envio; o mês seguinte aprende e evita repetições.',
  },
]

export function Landing() {
  return (
    <>
      <section className="hero">
        <div className="hero__bg" aria-hidden>
          <div className="hero__vinyl">
            <div className="hero__label">vinil usado · curadoria</div>
          </div>
        </div>
        <div className="container hero__content">
          <img
            className="hero__logo"
            src={brand.logoHeader}
            alt={brand.name}
            width={420}
            height={84}
          />
          <h1>Descoberta musical recorrente, em vinil usado.</h1>
          <p>
            Não competimos por quem tem mais discos — competimos por quem entende
            melhor o seu gosto. Piloto em {brand.city}.
          </p>
          <div className="hero__cta">
            <Link className="btn btn-amber" to="/quiz">
              Fazer o quiz musical
            </Link>
            <a className="btn btn-ghost" href="#planos">
              Ver planos
            </a>
          </div>
        </div>
      </section>

      <section className="section" id="como-funciona">
        <div className="container">
          <div className="section__head">
            <h2>Como funciona</h2>
            <p>
              Uma experiência de curadoria contínua: do perfil musical ao sulco
              limpo na sua prateleira.
            </p>
          </div>
          <div className="steps">
            {steps.map((s) => (
              <article key={s.title} className="step">
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section section--alt" id="planos">
        <div className="container">
          <div className="section__head">
            <h2>Planos do piloto</h2>
            <p>
              Preços de teste. Frete cobrado à parte. Acessível, enxuto, feito
              para validar curadoria em {brand.city}.
            </p>
          </div>
          <div className="plans-grid">
            {plans.map((plan, i) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                featured={i === 1}
                ctaTo="/quiz"
                ctaLabel="Quero esse"
              />
            ))}
          </div>
        </div>
      </section>

      <section className="section" id="faq">
        <div className="container">
          <div className="section__head">
            <h2>Perguntas frequentes</h2>
            <p>Transparência de um piloto lean — sem enrolação de loja disfarçada.</p>
          </div>
          <div className="faq">
            {faqs.map((item) => (
              <details key={item.q}>
                <summary>{item.q}</summary>
                <p>{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="section" id="credito-discos">
        <div className="container">
          <div className="section__head">
            <h2>Tem discos parados? Troque por crédito</h2>
            <p>
              Assinantes podem vender discos ao clube e abater o valor nas
              próximas mensalidades — ou receber em dinheiro com taxa menor.
            </p>
          </div>
          <Link className="btn btn-amber" to="/assinante/vender">
            Vender meus discos
          </Link>
        </div>
      </section>

      <section className="section section--alt" id="venda-colecao">
        <div className="container">
          <div className="section__head">
            <h2>Tem uma coleção para vender?</h2>
            <p>
              Herança, mudança ou inventário em {brand.city}: compramos lotes
              inteiros com avaliação cuidadosa — sem depender só de placa no
              poste.
            </p>
          </div>
          <Link className="btn btn-primary" to="/venda-sua-colecao">
            Venda sua coleção
          </Link>
        </div>
      </section>

      <section className="cta-band">
        <div className="container">
          <h2>Pronto para garimpar o próximo disco?</h2>
          <p>
            Monte seu perfil musical em poucos minutos e veja como a curadoria
            encaixa no seu gosto.
          </p>
          <Link className="btn btn-amber" to="/quiz">
            Começar o quiz
          </Link>
        </div>
      </section>
    </>
  )
}
