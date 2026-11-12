import { useState } from 'react'
import { Link } from 'react-router-dom'
import { PARTNER_TYPES } from '../../data/captacao'
import { buildWhatsAppPartnerMessage } from '../../lib/lotValuation'
import { useApp } from '../../state/AppContext'
import type { PartnerType, ReferralPartner } from '../../types'

const emptyPartner = (): ReferralPartner => ({
  id: `partner-${Date.now()}`,
  name: '',
  type: 'advogado',
  contact: '',
  city: 'Belo Horizonte',
  commissionPercent: 5,
  notes: '',
  active: true,
})

export function AdminPartners() {
  const { state, upsertPartner, removePartner } = useApp()
  const [draft, setDraft] = useState<ReferralPartner>(emptyPartner())
  const [editing, setEditing] = useState(false)

  function save() {
    if (!draft.name.trim()) return
    upsertPartner({ ...draft, name: draft.name.trim() })
    setDraft(emptyPartner())
    setEditing(false)
  }

  async function copyMsg(p: ReferralPartner) {
    await navigator.clipboard.writeText(buildWhatsAppPartnerMessage(p.name))
    alert('Mensagem WhatsApp copiada.')
  }

  return (
    <div className="grid-2">
      <section className="surface">
        <h3>Parceiros de indicação</h3>
        <p className="muted">
          Advogados de inventário, leiloeiros, imobiliárias, mudanças e sebos —
          quem encontra coleções inteiras antes da placa no poste.
        </p>
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Tipo</th>
                <th>%</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {state.referralPartners.map((p) => (
                <tr key={p.id}>
                  <td>
                    <strong>{p.name}</strong>
                    <div className="muted" style={{ fontSize: '0.8rem' }}>
                      {p.contact} · {p.city}
                      {!p.active ? ' · inativo' : ''}
                    </div>
                  </td>
                  <td>
                    {PARTNER_TYPES.find((t) => t.id === p.type)?.label}
                  </td>
                  <td>{p.commissionPercent}%</td>
                  <td>
                    <div className="inline-actions">
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => {
                          setDraft(p)
                          setEditing(true)
                        }}
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        className="btn btn-amber btn-sm"
                        onClick={() => void copyMsg(p)}
                      >
                        WhatsApp
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => removePartner(p.id)}
                      >
                        Remover
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="inline-actions">
          <Link className="btn btn-primary btn-sm" to="/flyer">
            Abrir flyer / QR
          </Link>
        </div>
      </section>

      <section className="surface">
        <h3>{editing ? 'Editar parceiro' : 'Novo parceiro'}</h3>
        <div className="field">
          <label htmlFor="pname">Nome</label>
          <input
            id="pname"
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
          />
        </div>
        <div className="field">
          <label htmlFor="ptype">Tipo</label>
          <select
            id="ptype"
            value={draft.type}
            onChange={(e) =>
              setDraft({ ...draft, type: e.target.value as PartnerType })
            }
          >
            {PARTNER_TYPES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="pcontact">Contato</label>
          <input
            id="pcontact"
            value={draft.contact}
            onChange={(e) => setDraft({ ...draft, contact: e.target.value })}
          />
        </div>
        <div className="field">
          <label htmlFor="pcity">Cidade</label>
          <input
            id="pcity"
            value={draft.city}
            onChange={(e) => setDraft({ ...draft, city: e.target.value })}
          />
        </div>
        <div className="field">
          <label htmlFor="pcomm">Comissão %</label>
          <input
            id="pcomm"
            type="number"
            min={0}
            max={30}
            value={draft.commissionPercent}
            onChange={(e) =>
              setDraft({
                ...draft,
                commissionPercent: Number(e.target.value),
              })
            }
          />
        </div>
        <div className="field">
          <label htmlFor="pnotes">Notas</label>
          <textarea
            id="pnotes"
            rows={3}
            value={draft.notes}
            onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
          />
        </div>
        <label className="consent">
          <input
            type="checkbox"
            checked={draft.active}
            onChange={(e) =>
              setDraft({ ...draft, active: e.target.checked })
            }
          />
          <span>Parceiro ativo</span>
        </label>
        <div className="inline-actions">
          <button type="button" className="btn btn-primary" onClick={save}>
            Salvar
          </button>
          {editing && (
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                setDraft(emptyPartner())
                setEditing(false)
              }}
            >
              Cancelar
            </button>
          )}
        </div>
      </section>
    </div>
  )
}
