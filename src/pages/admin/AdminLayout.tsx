import { NavLink, Outlet } from 'react-router-dom'
import { useApp } from '../../state/AppContext'

const links = [
  { to: '/admin', end: true, label: 'Dashboard' },
  { to: '/admin/estoque', label: 'Estoque' },
  { to: '/admin/assinantes', label: 'Assinantes' },
  { to: '/admin/curadoria', label: 'Curadoria' },
  { to: '/admin/captacao', label: 'Captação' },
  { to: '/admin/parceiros', label: 'Parceiros' },
  { to: '/admin/config', label: 'Config' },
]

export function AdminLayout() {
  const { resetDemo } = useApp()

  return (
    <div className="panel-shell">
      <div className="container">
        <span className="example-tag">Painel interno · dados de exemplo</span>
        <h1 className="page-title">Curadoria & operação</h1>
        <p className="muted">
          Estoque, assinantes, curadoria, captação de coleções e KPIs do piloto.
        </p>
        <nav className="admin-nav" aria-label="Admin">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) => (isActive ? 'active' : undefined)}
            >
              {l.label}
            </NavLink>
          ))}
          <button type="button" className="btn btn-ghost btn-sm" onClick={resetDemo}>
            Resetar demo
          </button>
        </nav>
        <Outlet />
      </div>
    </div>
  )
}
