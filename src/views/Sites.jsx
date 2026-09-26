import { useState } from 'react'
import { Empty, Field, Icon, Photo, ProgressBar, Sheet, StatusBadge } from '../components/ui.jsx'
import { useStore } from '../lib/store.jsx'
import { alertMaterials, fmtEUR, progress, STATUSES, totalExpenses } from '../lib/utils.js'

export default function Sites({ go, filter }) {
  const { data, addSite } = useStore()
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ client: '', address: '', status: 'upcoming' })
  const current = STATUSES.some((s) => s.id === filter) ? filter : 'all'
  const shown = data.sites.filter((s) => current === 'all' || s.status === current)
  const count = (id) => data.sites.filter((s) => s.status === id).length

  const submit = (e) => {
    e.preventDefault()
    if (!form.client.trim()) return
    const id = addSite(form)
    setAdding(false)
    setForm({ client: '', address: '', status: 'upcoming' })
    go(`/chantier/${id}`)
  }

  return (
    <div className="page">
      <header className="page-head">
        <h1>Chantiers</h1>
        <button type="button" className="btn btn-primary btn-sm" onClick={() => setAdding(true)}>
          <Icon name="plus" size={18} /> Nouveau
        </button>
      </header>

      <div className="chips" role="tablist" aria-label="Filtrer par statut">
        <button type="button" role="tab" aria-selected={current === 'all'} className={`chip ${current === 'all' ? 'on' : ''}`} onClick={() => go('/chantiers')}>
          Tous <b>{data.sites.length}</b>
        </button>
        {STATUSES.map((s) => (
          <button key={s.id} type="button" role="tab" aria-selected={current === s.id} className={`chip ${current === s.id ? 'on' : ''}`} onClick={() => go(`/chantiers?f=${s.id}`)}>
            {s.label} <b>{count(s.id)}</b>
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <Empty icon="list" title="Aucun chantier ici" hint="Créez un chantier avec le bouton « Nouveau »." />
      ) : (
        <div className="stack">
          {shown.map((s) => {
            const alerts = alertMaterials(s).length
            return (
              <button key={s.id} type="button" className="card" onClick={() => go(`/chantier/${s.id}`)}>
                <div className="cover-wrap">
                  <Photo src={s.cover} className="card-cover" />
                  <span className="cover-badge">
                    <StatusBadge status={s.status} />
                  </span>
                </div>
                <div className="card-body">
                  <strong className="card-title">{s.client}</strong>
                  <span className="addr">
                    <Icon name="pin" size={14} /> {s.address || 'Adresse non renseignée'}
                  </span>
                  <div className="progress-row">
                    <ProgressBar value={progress(s)} tone={s.status === 'done' ? 'green' : 'blue'} label="Avancement" />
                    <span>{progress(s)} %</span>
                  </div>
                  <div className="meta-row">
                    <span>
                      <Icon name="wallet" size={15} /> {fmtEUR(totalExpenses(s))}
                    </span>
                    <span>
                      <Icon name="image" size={15} /> {s.photos.length}
                    </span>
                    {alerts > 0 && (
                      <span className="meta-alert">
                        <Icon name="alert" size={15} /> {alerts} alerte{alerts > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      )}

      {adding && (
        <Sheet title="Nouveau chantier" onClose={() => setAdding(false)}>
          <form onSubmit={submit} className="form">
            <Field label="Nom du client">
              <input autoFocus required value={form.client} onChange={(e) => setForm({ ...form, client: e.target.value })} placeholder="Ex. Villa Martin" />
            </Field>
            <Field label="Adresse">
              <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Numéro, rue, ville" />
            </Field>
            <Field label="Statut">
              <div className="segmented">
                {STATUSES.map((s) => (
                  <button key={s.id} type="button" className={form.status === s.id ? 'on' : ''} onClick={() => setForm({ ...form, status: s.id })}>
                    {s.label}
                  </button>
                ))}
              </div>
            </Field>
            <p className="muted small">Un modèle de 5 étapes est ajouté : vous pourrez les renommer, en ajouter ou en supprimer.</p>
            <button type="submit" className="btn btn-primary btn-block">
              Créer le chantier
            </button>
          </form>
        </Sheet>
      )}
    </div>
  )
}
