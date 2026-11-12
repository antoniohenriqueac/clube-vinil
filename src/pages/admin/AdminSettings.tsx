import { useState } from 'react'
import { clearCatalogCache } from '../../lib/catalogCache'
import { getCatalogMode, getEnvDiscogsToken } from '../../lib/discogs'
import { useApp } from '../../state/AppContext'
import type { SubscriberSellConfig } from '../../types'

export function AdminSettings() {
  const { state, setDiscogsToken, setSellConfig } = useApp()
  const [draft, setDraft] = useState(state.discogsToken ?? '')
  const [sellDraft, setSellDraft] = useState<SubscriberSellConfig>(
    state.sellConfig,
  )
  const [saved, setSaved] = useState(false)
  const [sellSaved, setSellSaved] = useState(false)
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

  function saveSell() {
    setSellConfig(sellDraft)
    setSellSaved(true)
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
        <span className="example-tag">
          Modo ativo: {mode === 'discogs' ? 'Discogs API' : 'Catálogo seed'}
        </span>
        <h3>Status da inteligência musical</h3>
        <ul className="muted">
          <li>
            Token no navegador:{' '}
            {state.discogsToken ? 'configurado' : 'não configurado'}
          </li>
          <li>Token via env de build: {envToken ? 'presente' : 'ausente'}</li>
          <li>
            Sem token (ex.: GitHub Pages demo): usa catálogo seed local.
          </li>
        </ul>
      </section>

      <section className="surface">
        <h3>Oferta — assinante vende discos</h3>
        <p className="muted">
          % do valor de mercado (ajustado por estado Goldmine) pago em crédito
          vs dinheiro, bônus se o disco está em demanda, e valor mínimo.
        </p>
        <div className="field">
          <label htmlFor="cred">% em crédito ({sellDraft.creditPercent}%)</label>
          <input
            id="cred"
            type="range"
            min={30}
            max={70}
            value={sellDraft.creditPercent}
            onChange={(e) => {
              setSellDraft({
                ...sellDraft,
                creditPercent: Number(e.target.value),
              })
              setSellSaved(false)
            }}
          />
        </div>
        <div className="field">
          <label htmlFor="cash">% em dinheiro ({sellDraft.cashPercent}%)</label>
          <input
            id="cash"
            type="range"
            min={15}
            max={45}
            value={sellDraft.cashPercent}
            onChange={(e) => {
              setSellDraft({
                ...sellDraft,
                cashPercent: Number(e.target.value),
              })
              setSellSaved(false)
            }}
          />
        </div>
        <div className="field">
          <label htmlFor="bonus">
            Bônus demanda ({sellDraft.demandBonusPercent}%)
          </label>
          <input
            id="bonus"
            type="range"
            min={0}
            max={20}
            value={sellDraft.demandBonusPercent}
            onChange={(e) => {
              setSellDraft({
                ...sellDraft,
                demandBonusPercent: Number(e.target.value),
              })
              setSellSaved(false)
            }}
          />
        </div>
        <div className="field">
          <label htmlFor="min">Valor mínimo de mercado (R$)</label>
          <input
            id="min"
            type="number"
            min={0}
            value={sellDraft.minMarketValue}
            onChange={(e) => {
              setSellDraft({
                ...sellDraft,
                minMarketValue: Number(e.target.value),
              })
              setSellSaved(false)
            }}
          />
        </div>
        <button type="button" className="btn btn-primary" onClick={saveSell}>
          Salvar regras de oferta
        </button>
        {sellSaved && (
          <p className="muted">Regras salvas neste navegador.</p>
        )}
      </section>
    </div>
  )
}
