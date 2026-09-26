import { Icon, Photo, ProgressBar, StatusBadge, Empty } from '../components/ui.jsx'
import { useStore } from '../lib/store.jsx'
import { alertMaterials, fmtDate, fmtEUR, fmtMonth, materialStatus, monthExpenses, progress } from '../lib/utils.js'

function greeting() {
  const h = new Date().getHours()
  return h < 6 || h >= 18 ? 'Bonsoir' : 'Bonjour'
}

export default function Dashboard({ go }) {
  const { data } = useStore()
  const { sites } = data
  const active = sites.filter((s) => s.status === 'active')
  const upcoming = sites.filter((s) => s.status === 'upcoming')
  const alerts = sites.flatMap((s) => alertMaterials(s).map((m) => ({ site: s, m })))
  const month = monthExpenses(sites)
  const bySite = sites
    .map((s) => ({ s, total: monthExpenses([s]) }))
    .filter((x) => x.total > 0)

  return (
    <div className="page">
      <header className="hero">
        <p className="hero-hello">{greeting()} 👋</p>
        <h1>{data.company}</h1>
        <p className="hero-sub">Voici l’état de vos chantiers aujourd’hui.</p>
      </header>

      <section className="kpis" aria-label="Indicateurs">
        <button type="button" className="kpi" onClick={() => go('/chantiers?f=active')}>
          <span className="kpi-ico blue">
            <Icon name="sun" />
          </span>
          <strong>{active.length}</strong>
          <span>Chantier{active.length > 1 ? 's' : ''} en cours</span>
        </button>
        <div className="kpi">
          <span className="kpi-ico green">
            <Icon name="wallet" />
          </span>
          <strong>{fmtEUR(month)}</strong>
          <span>Dépenses · {fmtMonth()}</span>
        </div>
        <button type="button" className={`kpi ${alerts.length ? 'kpi-alert' : ''}`} onClick={() => alerts[0] && go(`/chantier/${alerts[0].site.id}?t=materiel`)}>
          <span className="kpi-ico orange">
            <Icon name="alert" />
          </span>
          <strong>{alerts.length}</strong>
          <span>Matériel en alerte</span>
        </button>
      </section>

      <section>
        <div className="section-head">
          <h2>En cours</h2>
          <button type="button" className="link" onClick={() => go('/chantiers')}>
            Tout voir
          </button>
        </div>
        {active.length === 0 ? (
          <Empty icon="list" title="Aucun chantier en cours" hint="Démarrez un chantier depuis la liste." />
        ) : (
          <div className="stack">
            {active.map((s) => (
              <button key={s.id} type="button" className="card card-hero" onClick={() => go(`/chantier/${s.id}`)}>
                <Photo src={s.cover} className="card-cover" />
                <div className="card-body">
                  <div className="card-title-row">
                    <strong>{s.client}</strong>
                    <StatusBadge status={s.status} />
                  </div>
                  <span className="addr">
                    <Icon name="pin" size={14} /> {s.address}
                  </span>
                  <div className="progress-row">
                    <ProgressBar value={progress(s)} label="Avancement" />
                    <span>{progress(s)} %</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="section-head">
          <h2>Matériel en alerte</h2>
        </div>
        {alerts.length === 0 ? (
          <div className="ok-note">
            <Icon name="check" /> Aucun manque à signaler.
          </div>
        ) : (
          <ul className="list">
            {alerts.map(({ site, m }) => {
              const st = materialStatus(m)
              return (
                <li key={m.id}>
                  <button type="button" className="list-row" onClick={() => go(`/chantier/${site.id}?t=materiel`)}>
                    <span className={`dot dot-${st.level}`} />
                    <span className="list-main">
                      <strong>{m.name}</strong>
                      <small>
                        {site.client} · {st.label}
                      </small>
                    </span>
                    <Icon name="next" size={18} className="chev" />
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      {upcoming.length > 0 && (
        <section>
          <div className="section-head">
            <h2>À venir</h2>
          </div>
          <ul className="list">
            {upcoming.map((s) => (
              <li key={s.id}>
                <button type="button" className="list-row" onClick={() => go(`/chantier/${s.id}`)}>
                  <Photo src={s.cover} className="thumb" />
                  <span className="list-main">
                    <strong>{s.client}</strong>
                    <small>Début prévu le {fmtDate(s.startDate)}</small>
                  </span>
                  <Icon name="next" size={18} className="chev" />
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {bySite.length > 0 && (
        <section>
          <div className="section-head">
            <h2>Dépenses du mois par chantier</h2>
          </div>
          <ul className="list">
            {bySite.map(({ s, total }) => (
              <li key={s.id}>
                <button type="button" className="list-row" onClick={() => go(`/chantier/${s.id}?t=depenses`)}>
                  <span className="list-main">
                    <strong>{s.client}</strong>
                    <small>Voir le détail</small>
                  </span>
                  <strong className="amount">{fmtEUR(total)}</strong>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
