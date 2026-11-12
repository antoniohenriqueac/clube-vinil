import { Link, NavLink, Outlet } from 'react-router-dom'
import { brand } from '../brand'
import { useApp } from '../state/AppContext'

export function Layout() {
  const { sessionSubscriber, logout } = useApp()

  return (
    <>
      <div className="demo-banner">
        Protótipo clicável · <strong>demonstração</strong> sem pagamentos reais ·
        dados de exemplo
      </div>
      <header className="site-header">
        <div className="container site-header__inner">
          <Link to="/" className="brand-mark" aria-label={brand.name}>
            <img
              className="brand-mark__logo"
              src={brand.logoHeader}
              alt={brand.name}
              width={160}
              height={28}
            />
          </Link>
          <nav className="nav" aria-label="Principal">
            <Link
              to="/"
              onClick={() => {
                window.setTimeout(
                  () =>
                    document
                      .getElementById('como-funciona')
                      ?.scrollIntoView({ behavior: 'smooth' }),
                  50,
                )
              }}
            >
              Como funciona
            </Link>
            <Link
              to="/"
              onClick={() => {
                window.setTimeout(
                  () =>
                    document
                      .getElementById('planos')
                      ?.scrollIntoView({ behavior: 'smooth' }),
                  50,
                )
              }}
            >
              Planos
            </Link>
            <NavLink to="/quiz">Quiz</NavLink>
            <NavLink to="/venda-sua-colecao">Venda sua coleção</NavLink>
            <NavLink to="/assinante">Área do assinante</NavLink>
            <NavLink to="/admin">Admin</NavLink>
            {sessionSubscriber ? (
              <button type="button" className="linkish" onClick={logout}>
                Sair ({sessionSubscriber.name.split(' ')[0]})
              </button>
            ) : null}
          </nav>
        </div>
      </header>
      <main>
        <Outlet />
      </main>
      <footer className="site-footer">
        <div className="container site-footer__inner">
          <div>
            <strong>{brand.name}</strong> — {brand.tagline}
            <div>
              Piloto em {brand.city} · ~{brand.pilotTargetSubscribers} assinantes ·{' '}
              {brand.pilotMonths} meses
            </div>
          </div>
          <div>
            <Link to="/venda-sua-colecao">Venda sua coleção</Link>
            {' · '}
            <Link to="/flyer">Flyer</Link>
            {' · '}
            Identidade em `src/brand.ts`
          </div>
        </div>
      </footer>
    </>
  )
}
