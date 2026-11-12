import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { brand } from '../brand'
import { LEAD_REASONS } from '../data/captacao'
import { useApp } from '../state/AppContext'
import type { CollectionLead, ConditionGrade, LeadReason } from '../types'

const CONDITIONS: Array<ConditionGrade | 'misto' | 'desconhecido'> = [
  'Mint',
  'NM',
  'VG+',
  'VG',
  'G',
  'misto',
  'desconhecido',
]

async function filesToDataUrls(files: FileList | null): Promise<string[]> {
  if (!files?.length) return []
  const list = [...files].slice(0, 4)
  const urls: string[] = []
  for (const file of list) {
    if (!file.type.startsWith('image/')) continue
    if (file.size > 1_200_000) continue
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result))
      reader.onerror = () => reject(reader.error)
      reader.readAsDataURL(file)
    })
    urls.push(dataUrl)
  }
  return urls
}

export function SellCollection() {
  const { addCollectionLead } = useApp()
  const [sent, setSent] = useState(false)
  const [name, setName] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [neighborhood, setNeighborhood] = useState('')
  const [city, setCity] = useState('Belo Horizonte')
  const [approxCount, setApproxCount] = useState(50)
  const [genresNote, setGenresNote] = useState('')
  const [artistsNote, setArtistsNote] = useState('')
  const [condition, setCondition] =
    useState<CollectionLead['condition']>('desconhecido')
  const [reason, setReason] = useState<LeadReason>('heranca')
  const [titlesText, setTitlesText] = useState('')
  const [photos, setPhotos] = useState<string[]>([])
  const [lgpd, setLgpd] = useState(false)
  const [error, setError] = useState('')

  async function onPhotos(files: FileList | null) {
    try {
      const urls = await filesToDataUrls(files)
      setPhotos(urls)
    } catch {
      setError('Não foi possível ler as fotos (demo local).')
    }
  }

  function submit(e: FormEvent) {
    e.preventDefault()
    setError('')
    if (!name.trim() || !whatsapp.trim() || !lgpd) {
      setError('Preencha nome, WhatsApp e o consentimento LGPD.')
      return
    }
    const now = new Date().toISOString()
    const lead: CollectionLead = {
      id: `lead-${Date.now()}`,
      name: name.trim(),
      whatsapp: whatsapp.trim(),
      neighborhood: neighborhood.trim() || '—',
      city: city.trim() || brand.city,
      approxCount: Number(approxCount) || 0,
      genresNote: genresNote.trim(),
      artistsNote: artistsNote.trim(),
      condition,
      reason,
      titlesText: titlesText.trim(),
      photoDataUrls: photos,
      lgpdConsent: true,
      source: 'formulario',
      stage: 'novo',
      notes: 'Lead criado pelo formulário público (demonstração).',
      nextStepDate: null,
      offerPercent: 30,
      createdAt: now,
      updatedAt: now,
    }
    addCollectionLead(lead)
    setSent(true)
  }

  if (sent) {
    return (
      <div className="quiz-shell">
        <div className="container" style={{ maxWidth: 640 }}>
          <div className="surface">
            <span className="example-tag">Demonstração</span>
            <h1 className="page-title">Recebemos seu interesse</h1>
            <p>
              Neste protótipo o lead foi salvo só no seu navegador (localStorage).
              Nenhum WhatsApp ou e-mail real foi enviado. No produto, a equipe do{' '}
              {brand.name} entraria em contato para avaliar a coleção.
            </p>
            <div className="inline-actions">
              <Link className="btn btn-primary" to="/admin/captacao">
                Ver no admin (demo)
              </Link>
              <Link className="btn btn-ghost" to="/">
                Voltar ao início
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="quiz-shell">
      <div className="container" style={{ maxWidth: 720 }}>
        <span className="example-tag">Demonstração · sem envio real</span>
        <h1 className="page-title">Venda sua coleção</h1>
        <p>
          Herdou discos? Vai mudar de casa? Em {brand.city} compramos{' '}
          <strong>coleções inteiras</strong> de vinil usado — com avaliação
          cuidadosa, proposta justa e retirada. Feito para famílias, inventários
          e quem quer desapegar sem triar disco a disco.
        </p>
        <p className="muted">
          Hoje muita gente só encontra comprador por placa no poste. Queremos
          tornar isso simples e digno.
        </p>

        <form className="surface" onSubmit={submit}>
          <div className="grid-2">
            <div className="field">
              <label htmlFor="name">Nome</label>
              <input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="wa">WhatsApp</label>
              <input
                id="wa"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="31 9xxxx-xxxx"
                required
              />
            </div>
          </div>
          <div className="grid-2">
            <div className="field">
              <label htmlFor="bairro">Bairro</label>
              <input
                id="bairro"
                value={neighborhood}
                onChange={(e) => setNeighborhood(e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="city">Cidade</label>
              <input
                id="city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
            </div>
          </div>
          <div className="grid-2">
            <div className="field">
              <label htmlFor="count">Nº aproximado de discos</label>
              <input
                id="count"
                type="number"
                min={1}
                value={approxCount}
                onChange={(e) => setApproxCount(Number(e.target.value))}
              />
            </div>
            <div className="field">
              <label htmlFor="reason">Motivo</label>
              <select
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value as LeadReason)}
              >
                {LEAD_REASONS.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="field">
            <label htmlFor="genres">Gêneros / estilos (livre)</label>
            <input
              id="genres"
              value={genresNote}
              onChange={(e) => setGenresNote(e.target.value)}
              placeholder="Ex.: MPB, samba, rock dos 70"
            />
          </div>
          <div className="field">
            <label htmlFor="artists">Artistas que lembra</label>
            <input
              id="artists"
              value={artistsNote}
              onChange={(e) => setArtistsNote(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="cond">Condição geral</label>
            <select
              id="cond"
              value={condition}
              onChange={(e) =>
                setCondition(e.target.value as CollectionLead['condition'])
              }
            >
              {CONDITIONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="titles">
              Lista de títulos (opcional — uma por linha ou CSV: Artista - Álbum)
            </label>
            <textarea
              id="titles"
              rows={5}
              value={titlesText}
              onChange={(e) => setTitlesText(e.target.value)}
              placeholder={'Tim Maia - Racional Vol. 1\nPink Floyd - The Dark Side of the Moon'}
            />
          </div>
          <div className="field">
            <label htmlFor="photos">Fotos da estante / capas (demo local)</label>
            <input
              id="photos"
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => void onPhotos(e.target.files)}
            />
            {photos.length > 0 && (
              <div className="photo-row">
                {photos.map((src) => (
                  <img key={src.slice(0, 40)} src={src} alt="Prévia da coleção" />
                ))}
              </div>
            )}
            <p className="muted" style={{ fontSize: '0.82rem' }}>
              Fotos ficam só neste navegador (data URL). Máx. 4 imagens leves.
            </p>
          </div>

          <label className="consent">
            <input
              type="checkbox"
              checked={lgpd}
              onChange={(e) => setLgpd(e.target.checked)}
            />
            <span>
              Concordo com o tratamento dos dados informados para contato sobre a
              venda da coleção (LGPD). Em produção haveria política completa; aqui
              é apenas demonstração.
            </span>
          </label>

          {error && <p style={{ color: 'var(--burgundy)' }}>{error}</p>}

          <div className="inline-actions">
            <button type="submit" className="btn btn-amber">
              Enviar interesse (demo)
            </button>
            <Link className="btn btn-ghost" to="/flyer">
              Ver flyer imprimível
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
