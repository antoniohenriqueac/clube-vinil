import { useState } from 'react'
import { getCatalogMode, getEnvDiscogsToken } from '../../lib/discogs'
import { clearCatalogCache } from '../../lib/catalogCache'
import { useApp } from '../../state/AppContext'

export function AdminSettings() {
  const { state, setDiscogsToken } = useApp()
  const [draft, setDraft] = useState(state.discogsToken ?? '')
  const [saved, setSaved] = useState(false)
  const envToken = getEnvDiscogsToken()
  const mode = getCatalogMode(state.discogsToken)

  function save() {
    const value = draft.trim() || null
    setDiscogsToken(value)
    setSaved(true)
  }

  function clear() {
    setDraft('')
    setDiscogsToken(null)
    setSaved(true)
  }

  return (
    <div className="grid-2">
      <section className="surface">
        <h3>Discogs API</h3>
        <p className="muted">
          Token pessoal opcional (Personal Access Token). Fica só no{' '}
          <code>localStorage</code> deste navegador — nunca é commitado. Também
          aceita <code>VITE_DISCOGS_TOKEN</code> em build local.
        </p>
        <div className="field">
          <label htmlFor="token">Token Discogs</label>
          <input
            id="token"
            type="password"
            autoComplete="off"
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value)
              setSaved(false)
            }}
            placeholder="cole o token aqui"
          />
        </div>
        <div className="inline-actions">
          <button type="button" className="btn btn-primary" onClick={save}>
            Salvar token
          </button>
          <button type="button" className="btn btn-ghost" onClick={clear}>
            Remover
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => clearCatalogCache()}
          >
            Limpar cache de catálogo
          </button>
        </div>
        {saved && <p className="muted">Preferências salvas neste navegador.</p>}
      </section>

      <section className="surface">
        <span className={`example-tag ${mode === 'discogs' ? '' : ''}`}>
          Modo ativo: {mode === 'discogs' ? 'Discogs API' : 'Catálogo seed'}
        </span>
        <h3>Status da inteligência musical</h3>
        <ul className="muted">
          <li>
            Token no navegador:{' '}
            {state.discogsToken ? 'configurado' : 'não configurado'}
          </li>
          <li>
            Token via env de build: {envToken ? 'presente' : 'ausente'}
          </li>
          <li>
            Sem token (ex.: GitHub Pages demo): usa catálogo seed local com
            centenas de lançamentos reais BR + internacionais.
          </li>
          <li>
            Respostas da API são cacheadas em localStorage e respeitam rate
            limit conservador.
          </li>
        </ul>
      </section>
    </div>
  )
}
