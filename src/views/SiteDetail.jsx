import { useRef, useState } from 'react'
import { ConfirmSheet, Empty, Field, Icon, Photo, ProgressBar, Sheet, StatusBadge } from '../components/ui.jsx'
import { useStore } from '../lib/store.jsx'
import {
  allCategories,
  alertMaterials,
  expensesByCategory,
  fmtDate,
  fmtEUR,
  fmtQty,
  isoDate,
  materialStatus,
  parseNum,
  progress,
  resizeImage,
  STATUSES,
  totalExpenses,
  uid,
} from '../lib/utils.js'

const TABS = [
  { id: 'etapes', label: 'Étapes', icon: 'steps' },
  { id: 'photos', label: 'Photos', icon: 'image' },
  { id: 'materiel', label: 'Matériel', icon: 'box' },
  { id: 'depenses', label: 'Dépenses', icon: 'wallet' },
  { id: 'notes', label: 'Notes', icon: 'note' },
]

export default function SiteDetail({ id, tab, go }) {
  const { data, updateSite, deleteSite } = useStore()
  const site = data.sites.find((s) => s.id === id)
  const [menu, setMenu] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  if (!site) {
    return (
      <div className="page">
        <Empty icon="list" title="Chantier introuvable" hint="Il a peut-être été supprimé." />
        <button type="button" className="btn btn-primary btn-block" onClick={() => go('/chantiers')}>
          Retour aux chantiers
        </button>
      </div>
    )
  }

  const current = TABS.some((t) => t.id === tab) ? tab : 'etapes'
  const alerts = alertMaterials(site).length
  const patch = (p) => updateSite(site.id, (s) => ({ ...s, ...p }))

  return (
    <div className="page page-detail">
      <div className="detail-cover">
        <Photo src={site.cover} className="detail-cover-img" />
        <div className="detail-cover-shade" />
        <button type="button" className="round-btn left" onClick={() => go('/chantiers')} aria-label="Retour">
          <Icon name="back" />
        </button>
        <button type="button" className="round-btn right" onClick={() => setMenu(true)} aria-label="Options du chantier">
          <Icon name="more" />
        </button>
        <div className="detail-cover-text">
          <StatusBadge status={site.status} />
          <h1>{site.client}</h1>
          <span className="addr light">
            <Icon name="pin" size={14} /> {site.address || 'Adresse non renseignée'}
          </span>
        </div>
      </div>

      <section className="summary" aria-label="Résumé du chantier">
        <div className="summary-main">
          <span>Total des dépenses</span>
          <strong>{fmtEUR(totalExpenses(site))}</strong>
        </div>
        <div className="summary-side">
          <div>
            <b>{progress(site)} %</b>
            <span>avancement</span>
          </div>
          <div className={alerts ? 'warn' : ''}>
            <b>{alerts}</b>
            <span>alerte{alerts > 1 ? 's' : ''}</span>
          </div>
        </div>
        <div className="summary-bar">
          <ProgressBar value={progress(site)} tone={site.status === 'done' ? 'green' : 'blue'} label="Avancement" />
        </div>
      </section>

      <nav className="tabs" role="tablist" aria-label="Sections du chantier">
        {TABS.map((t) => (
          <button key={t.id} type="button" role="tab" aria-selected={current === t.id} className={`tab ${current === t.id ? 'on' : ''}`} onClick={() => go(`/chantier/${site.id}?t=${t.id}`)}>
            <Icon name={t.icon} size={18} />
            {t.label}
            {t.id === 'materiel' && alerts > 0 && <i className="tab-dot" />}
          </button>
        ))}
      </nav>

      <div className="tab-panel">
        {current === 'etapes' && <Steps site={site} update={updateSite} />}
        {current === 'photos' && <Photos site={site} update={updateSite} />}
        {current === 'materiel' && <Materials site={site} update={updateSite} />}
        {current === 'depenses' && <Expenses site={site} update={updateSite} sites={data.sites} />}
        {current === 'notes' && <Notes site={site} patch={patch} />}
      </div>

      {menu && (
        <SiteMenu
          site={site}
          onClose={() => setMenu(false)}
          onSave={(p) => {
            patch(p)
            setMenu(false)
          }}
          onDelete={() => {
            setMenu(false)
            setConfirmDelete(true)
          }}
        />
      )}
      {confirmDelete && (
        <ConfirmSheet
          title="Supprimer ce chantier ?"
          message={`« ${site.client} » sera supprimé avec ses étapes, photos, matériel et dépenses. Cette action est définitive.`}
          confirmLabel="Supprimer"
          onConfirm={() => {
            deleteSite(site.id)
            go('/chantiers')
          }}
          onClose={() => setConfirmDelete(false)}
        />
      )}
    </div>
  )
}

function SiteMenu({ site, onClose, onSave, onDelete }) {
  const [f, setF] = useState({ client: site.client, address: site.address, status: site.status })
  return (
    <Sheet title="Modifier le chantier" onClose={onClose}>
      <form
        className="form"
        onSubmit={(e) => {
          e.preventDefault()
          if (f.client.trim()) onSave({ client: f.client.trim(), address: f.address.trim(), status: f.status })
        }}
      >
        <Field label="Nom du client">
          <input required value={f.client} onChange={(e) => setF({ ...f, client: e.target.value })} />
        </Field>
        <Field label="Adresse">
          <input value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} />
        </Field>
        <Field label="Statut">
          <div className="segmented">
            {STATUSES.map((s) => (
              <button key={s.id} type="button" className={f.status === s.id ? 'on' : ''} onClick={() => setF({ ...f, status: s.id })}>
                {s.label}
              </button>
            ))}
          </div>
        </Field>
        <button type="submit" className="btn btn-primary btn-block">
          Enregistrer
        </button>
        <button type="button" className="btn btn-danger-outline btn-block" onClick={onDelete}>
          <Icon name="trash" size={18} /> Supprimer le chantier
        </button>
      </form>
    </Sheet>
  )
}

/* ------------------------------ Étapes ------------------------------ */

function Steps({ site, update }) {
  const [editing, setEditing] = useState(null)
  const [label, setLabel] = useState('')
  const setSteps = (fn) => update(site.id, (s) => ({ ...s, steps: fn(s.steps) }))
  const done = site.steps.filter((s) => s.done).length

  const add = (e) => {
    e.preventDefault()
    if (!label.trim()) return
    setSteps((steps) => [...steps, { id: uid(), label: label.trim(), done: false }])
    setLabel('')
  }

  return (
    <>
      <p className="tab-hint">
        {done} étape{done > 1 ? 's' : ''} sur {site.steps.length} terminée{done > 1 ? 's' : ''}
      </p>
      {site.steps.length === 0 && <Empty icon="steps" title="Aucune étape" hint="Ajoutez la première étape ci-dessous." />}
      <ul className="steps">
        {site.steps.map((st) => (
          <li key={st.id} className={st.done ? 'done' : ''}>
            <button
              type="button"
              className="step-check"
              role="checkbox"
              aria-checked={st.done}
              aria-label={st.label}
              onClick={() => setSteps((steps) => steps.map((x) => (x.id === st.id ? { ...x, done: !x.done } : x)))}
            >
              <span className="box">{st.done && <Icon name="check" size={16} />}</span>
              <span className="step-label">{st.label}</span>
            </button>
            <button type="button" className="icon-btn" aria-label={`Modifier l’étape ${st.label}`} onClick={() => setEditing(st)}>
              <Icon name="edit" size={18} />
            </button>
          </li>
        ))}
      </ul>
      <form className="add-row" onSubmit={add}>
        <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Ajouter une étape…" aria-label="Nouvelle étape" />
        <button type="submit" className="btn btn-primary btn-icon" aria-label="Ajouter l’étape" disabled={!label.trim()}>
          <Icon name="plus" />
        </button>
      </form>

      {editing && (
        <StepEditor
          step={editing}
          onClose={() => setEditing(null)}
          onSave={(text) => {
            setSteps((steps) => steps.map((x) => (x.id === editing.id ? { ...x, label: text } : x)))
            setEditing(null)
          }}
          onDelete={() => {
            setSteps((steps) => steps.filter((x) => x.id !== editing.id))
            setEditing(null)
          }}
        />
      )}
    </>
  )
}

function StepEditor({ step, onSave, onDelete, onClose }) {
  const [text, setText] = useState(step.label)
  return (
    <Sheet title="Modifier l’étape" onClose={onClose}>
      <form
        className="form"
        onSubmit={(e) => {
          e.preventDefault()
          if (text.trim()) onSave(text.trim())
        }}
      >
        <Field label="Nom de l’étape">
          <input autoFocus value={text} onChange={(e) => setText(e.target.value)} />
        </Field>
        <button type="submit" className="btn btn-primary btn-block" disabled={!text.trim()}>
          Enregistrer
        </button>
        <button type="button" className="btn btn-danger-outline btn-block" onClick={onDelete}>
          <Icon name="trash" size={18} /> Supprimer l’étape
        </button>
      </form>
    </Sheet>
  )
}

/* ------------------------------ Photos ------------------------------ */

function Photos({ site, update }) {
  const input = useRef(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [open, setOpen] = useState(null)
  const photo = site.photos.find((p) => p.id === open)

  const onFiles = async (e) => {
    const files = [...e.target.files].filter((f) => f.type.startsWith('image/'))
    e.target.value = ''
    if (!files.length) return
    setBusy(true)
    setError('')
    try {
      const added = []
      for (const f of files) added.push({ id: uid(), src: await resizeImage(f), caption: '', date: isoDate() })
      update(site.id, (s) => ({ ...s, photos: [...added, ...s.photos] }))
    } catch {
      setError('Une photo n’a pas pu être lue. Essayez un autre fichier.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <input ref={input} type="file" accept="image/*" multiple hidden onChange={onFiles} />
      <button type="button" className="btn btn-primary btn-block" onClick={() => input.current?.click()} disabled={busy}>
        <Icon name="camera" size={18} /> {busy ? 'Import en cours…' : 'Ajouter des photos'}
      </button>
      {error && <p className="error">{error}</p>}
      {site.photos.length === 0 ? (
        <Empty icon="image" title="Pas encore de photo" hint="Prenez une photo ou choisissez-en dans la galerie de l’appareil." />
      ) : (
        <div className="grid">
          {site.photos.map((p) => (
            <button key={p.id} type="button" className="grid-item" onClick={() => setOpen(p.id)} aria-label={p.caption || 'Photo du chantier'}>
              <Photo src={p.src} alt={p.caption} />
              {p.src === site.cover && <span className="cover-tag">Couverture</span>}
            </button>
          ))}
        </div>
      )}
      {photo && (
        <PhotoViewer
          photo={photo}
          isCover={photo.src === site.cover}
          onClose={() => setOpen(null)}
          onCaption={(caption) => update(site.id, (s) => ({ ...s, photos: s.photos.map((p) => (p.id === photo.id ? { ...p, caption } : p)) }))}
          onCover={() => update(site.id, (s) => ({ ...s, cover: photo.src }))}
          onDelete={() => {
            update(site.id, (s) => ({ ...s, photos: s.photos.filter((p) => p.id !== photo.id), cover: s.cover === photo.src ? 'art:roof-clean:1' : s.cover }))
            setOpen(null)
          }}
        />
      )}
    </>
  )
}

function PhotoViewer({ photo, isCover, onClose, onCaption, onCover, onDelete }) {
  return (
    <Sheet title="Photo" onClose={onClose}>
      <Photo src={photo.src} alt={photo.caption} className="viewer-img" />
      <p className="muted small">Prise le {fmtDate(photo.date)}</p>
      <Field label="Légende">
        <input value={photo.caption} onChange={(e) => onCaption(e.target.value)} placeholder="Ex. Avant nettoyage, face sud" />
      </Field>
      <div className="row-actions">
        <button type="button" className="btn btn-ghost" onClick={onCover} disabled={isCover}>
          {isCover ? 'Photo de couverture' : 'Définir en couverture'}
        </button>
        <button type="button" className="btn btn-danger-outline" onClick={onDelete}>
          <Icon name="trash" size={18} /> Supprimer
        </button>
      </div>
    </Sheet>
  )
}

/* ------------------------------ Matériel ------------------------------ */

function Materials({ site, update }) {
  const [editing, setEditing] = useState(null)
  const setMaterials = (fn) => update(site.id, (s) => ({ ...s, materials: fn(s.materials) }))
  const bump = (m, delta) => {
    const step = Number(m.planned) >= 50 ? 5 : 1
    setMaterials((list) => list.map((x) => (x.id === m.id ? { ...x, used: Math.max(0, Math.round((parseNum(x.used) + delta * step) * 100) / 100) } : x)))
  }
  const alerts = alertMaterials(site).length

  return (
    <>
      {alerts > 0 && (
        <div className="banner">
          <Icon name="alert" size={18} /> {alerts} matériel{alerts > 1 ? 's' : ''} à surveiller ou à racheter
        </div>
      )}
      <button type="button" className="btn btn-primary btn-block" onClick={() => setEditing({})}>
        <Icon name="plus" size={18} /> Ajouter du matériel
      </button>
      {site.materials.length === 0 ? (
        <Empty icon="box" title="Aucun matériel" hint="Listez les produits et outils prévus pour ce chantier." />
      ) : (
        <ul className="cards">
          {site.materials.map((m) => {
            const st = materialStatus(m)
            const planned = parseNum(m.planned)
            const pct = planned > 0 ? (parseNum(m.used) / planned) * 100 : 100
            return (
              <li key={m.id} className={`mat mat-${st.level}`}>
                <div className="mat-top">
                  <button type="button" className="mat-name" onClick={() => setEditing(m)}>
                    <strong>{m.name}</strong>
                    <small>
                      Prévu : {fmtQty(planned)} {m.unit}
                    </small>
                  </button>
                  <div className="stepper" aria-label={`Quantité utilisée de ${m.name}`}>
                    <button type="button" onClick={() => bump(m, -1)} aria-label="Moins">
                      <Icon name="minus" size={18} />
                    </button>
                    <span>
                      <b>{fmtQty(parseNum(m.used))}</b>
                      <small>utilisé</small>
                    </span>
                    <button type="button" onClick={() => bump(m, 1)} aria-label="Plus">
                      <Icon name="plus" size={18} />
                    </button>
                  </div>
                </div>
                <ProgressBar value={pct} tone={st.level === 'over' ? 'red' : st.alert ? 'orange' : 'blue'} label={`Utilisation de ${m.name}`} />
                <span className={`mat-status s-${st.level}`}>
                  {st.alert && <Icon name="alert" size={14} />} {st.label}
                </span>
              </li>
            )
          })}
        </ul>
      )}
      {editing && (
        <MaterialEditor
          material={editing}
          onClose={() => setEditing(null)}
          onSave={(m) => {
            setMaterials((list) => (m.id ? list.map((x) => (x.id === m.id ? m : x)) : [...list, { ...m, id: uid() }]))
            setEditing(null)
          }}
          onDelete={() => {
            setMaterials((list) => list.filter((x) => x.id !== editing.id))
            setEditing(null)
          }}
        />
      )}
    </>
  )
}

function MaterialEditor({ material, onSave, onDelete, onClose }) {
  const [f, setF] = useState({
    name: material.name ?? '',
    unit: material.unit ?? '',
    planned: material.planned != null ? String(material.planned) : '',
    used: material.used != null ? String(material.used) : '0',
  })
  const isNew = !material.id
  return (
    <Sheet title={isNew ? 'Ajouter du matériel' : 'Modifier le matériel'} onClose={onClose}>
      <form
        className="form"
        onSubmit={(e) => {
          e.preventDefault()
          if (!f.name.trim()) return
          onSave({ ...material, name: f.name.trim(), unit: f.unit.trim(), planned: parseNum(f.planned), used: parseNum(f.used) })
        }}
      >
        <Field label="Désignation">
          <input autoFocus required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Ex. Eau osmosée" />
        </Field>
        <Field label="Unité">
          <input value={f.unit} onChange={(e) => setF({ ...f, unit: e.target.value })} placeholder="L, pièces, kg…" />
        </Field>
        <div className="two">
          <Field label="Quantité prévue">
            <input inputMode="decimal" value={f.planned} onChange={(e) => setF({ ...f, planned: e.target.value })} placeholder="0" />
          </Field>
          <Field label="Quantité utilisée">
            <input inputMode="decimal" value={f.used} onChange={(e) => setF({ ...f, used: e.target.value })} placeholder="0" />
          </Field>
        </div>
        <button type="submit" className="btn btn-primary btn-block">
          {isNew ? 'Ajouter' : 'Enregistrer'}
        </button>
        {!isNew && (
          <button type="button" className="btn btn-danger-outline btn-block" onClick={onDelete}>
            <Icon name="trash" size={18} /> Supprimer
          </button>
        )}
      </form>
    </Sheet>
  )
}

/* ------------------------------ Dépenses ------------------------------ */

function Expenses({ site, update, sites }) {
  const [editing, setEditing] = useState(null)
  const setExpenses = (fn) => update(site.id, (s) => ({ ...s, expenses: fn(s.expenses) }))
  const total = totalExpenses(site)
  const cats = expensesByCategory(site)
  const sorted = [...site.expenses].sort((a, b) => (b.date || '').localeCompare(a.date || ''))

  return (
    <>
      <button type="button" className="btn btn-primary btn-block" onClick={() => setEditing({})}>
        <Icon name="plus" size={18} /> Ajouter une dépense
      </button>
      {cats.length > 0 && (
        <div className="panel compact">
          <h3 className="panel-title">Par catégorie</h3>
          <ul className="cat-list">
            {cats.map((c) => (
              <li key={c.category}>
                <div className="cat-line">
                  <span>{c.category}</span>
                  <b>{fmtEUR(c.total)}</b>
                </div>
                <ProgressBar value={total ? (c.total / total) * 100 : 0} label={c.category} />
              </li>
            ))}
          </ul>
        </div>
      )}
      {sorted.length === 0 ? (
        <Empty icon="wallet" title="Aucune dépense" hint="Notez chaque achat pour suivre la rentabilité du chantier." />
      ) : (
        <ul className="list">
          {sorted.map((e) => (
            <li key={e.id}>
              <button type="button" className="list-row" onClick={() => setEditing(e)}>
                <span className="list-main">
                  <strong>{e.label}</strong>
                  <small>
                    {fmtDate(e.date)} · <span className="cat-pill">{e.category || 'Sans catégorie'}</span>
                  </small>
                </span>
                <strong className="amount">{fmtEUR(parseNum(e.amount))}</strong>
              </button>
            </li>
          ))}
        </ul>
      )}
      {editing && (
        <ExpenseEditor
          expense={editing}
          categories={allCategories(sites)}
          onClose={() => setEditing(null)}
          onSave={(x) => {
            setExpenses((list) => (x.id ? list.map((y) => (y.id === x.id ? x : y)) : [...list, { ...x, id: uid() }]))
            setEditing(null)
          }}
          onDelete={() => {
            setExpenses((list) => list.filter((y) => y.id !== editing.id))
            setEditing(null)
          }}
        />
      )}
    </>
  )
}

function ExpenseEditor({ expense, categories, onSave, onDelete, onClose }) {
  const [f, setF] = useState({
    label: expense.label ?? '',
    amount: expense.amount != null ? String(expense.amount) : '',
    category: expense.category ?? '',
    date: expense.date ?? isoDate(),
  })
  const isNew = !expense.id
  const typed = f.category.trim()
  const canCreate = typed && !categories.some((c) => c.toLowerCase() === typed.toLowerCase())
  return (
    <Sheet title={isNew ? 'Ajouter une dépense' : 'Modifier la dépense'} onClose={onClose}>
      <form
        className="form"
        onSubmit={(e) => {
          e.preventDefault()
          if (!f.label.trim()) return
          onSave({ ...expense, label: f.label.trim(), amount: parseNum(f.amount), category: typed, date: f.date })
        }}
      >
        <Field label="Libellé">
          <input autoFocus required value={f.label} onChange={(e) => setF({ ...f, label: e.target.value })} placeholder="Ex. Détergent 10 L" />
        </Field>
        <div className="two">
          <Field label="Montant (€)">
            <input required inputMode="decimal" value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} placeholder="0,00" />
          </Field>
          <Field label="Date">
            <input type="date" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} />
          </Field>
        </div>
        <Field label="Catégorie">
          <input value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })} placeholder="Choisissez ou créez une catégorie" />
        </Field>
        <div className="chips wrap">
          {categories.map((c) => (
            <button key={c} type="button" className={`chip ${typed.toLowerCase() === c.toLowerCase() ? 'on' : ''}`} onClick={() => setF({ ...f, category: c })}>
              {c}
            </button>
          ))}
          {canCreate && <span className="chip chip-new">+ Nouvelle catégorie : {typed}</span>}
        </div>
        <button type="submit" className="btn btn-primary btn-block">
          {isNew ? 'Ajouter' : 'Enregistrer'}
        </button>
        {!isNew && (
          <button type="button" className="btn btn-danger-outline btn-block" onClick={onDelete}>
            <Icon name="trash" size={18} /> Supprimer
          </button>
        )}
      </form>
    </Sheet>
  )
}

/* ------------------------------ Notes ------------------------------ */

function Notes({ site, patch }) {
  return (
    <>
      <p className="tab-hint">Enregistrées automatiquement.</p>
      <textarea
        className="notes"
        value={site.notes}
        onChange={(e) => patch({ notes: e.target.value })}
        placeholder="Code portail, contact sur place, points d’attention…"
        aria-label="Notes du chantier"
        rows={12}
      />
    </>
  )
}
