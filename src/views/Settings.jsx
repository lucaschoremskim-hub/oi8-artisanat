import { useState } from 'react'
import { ConfirmSheet, Field, Icon } from '../components/ui.jsx'
import { useStore } from '../lib/store.jsx'

export default function Settings() {
  const { data, setCompany, resetDemo } = useStore()
  const [confirm, setConfirm] = useState(false)
  const [done, setDone] = useState(false)

  return (
    <div className="page">
      <header className="page-head">
        <h1>Réglages</h1>
      </header>

      <section className="panel">
        <h2 className="panel-title">Entreprise</h2>
        <Field label="Nom de l’entreprise">
          <input value={data.company} onChange={(e) => setCompany(e.target.value)} placeholder="Nom affiché sur l’accueil" />
        </Field>
        <p className="muted small">Ce nom s’affiche en haut du tableau de bord.</p>
      </section>

      <section className="panel">
        <h2 className="panel-title">Données</h2>
        <p className="muted">
          Tout est enregistré dans ce navigateur, sur cet appareil. Aucun compte, aucun serveur : vos chantiers et vos photos ne quittent jamais votre téléphone.
        </p>
        <button
          type="button"
          className="btn btn-danger-outline btn-block"
          onClick={() => {
            setDone(false)
            setConfirm(true)
          }}
        >
          <Icon name="trash" size={18} /> Réinitialiser la démo
        </button>
        {done && (
          <div className="ok-note">
            <Icon name="check" /> Démo réinitialisée : les 3 chantiers d’exemple sont de retour.
          </div>
        )}
      </section>

      <p className="foot">Oi-8 Artisanat · démo · v1.0</p>

      {confirm && (
        <ConfirmSheet
          title="Réinitialiser la démo ?"
          message="Toutes vos modifications (chantiers, photos, dépenses, notes) seront effacées et remplacées par les 3 chantiers d’exemple."
          confirmLabel="Réinitialiser"
          onConfirm={() => {
            resetDemo()
            setDone(true)
          }}
          onClose={() => setConfirm(false)}
        />
      )}
    </div>
  )
}
