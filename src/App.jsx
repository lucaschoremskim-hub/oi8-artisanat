import { useCallback, useEffect, useState } from 'react'
import { Icon, Logo } from './components/ui.jsx'
import { useStore } from './lib/store.jsx'
import Dashboard from './views/Dashboard.jsx'
import Settings from './views/Settings.jsx'
import SiteDetail from './views/SiteDetail.jsx'
import Sites from './views/Sites.jsx'

function parseHash() {
  const raw = window.location.hash.replace(/^#/, '') || '/'
  const [path, query = ''] = raw.split('?')
  return { path, params: new URLSearchParams(query) }
}

function useRoute() {
  const [route, setRoute] = useState(parseHash)
  useEffect(() => {
    const onChange = () => {
      setRoute(parseHash())
      window.scrollTo(0, 0)
    }
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  const go = useCallback((to) => {
    window.location.hash = to
  }, [])
  return [route, go]
}

const NAV = [
  { path: '/', label: 'Accueil', icon: 'home' },
  { path: '/chantiers', label: 'Chantiers', icon: 'list' },
  { path: '/reglages', label: 'Réglages', icon: 'settings' },
]

export default function App() {
  const [{ path, params }, go] = useRoute()
  const { storageError, data } = useStore()

  useEffect(() => {
    document.title = `${data.company || 'Oi-8 Artisanat'} · Suivi de chantier`
  }, [data.company])

  let view
  const detail = path.match(/^\/chantier\/([^/]+)$/)
  if (detail) view = <SiteDetail key={detail[1]} id={detail[1]} tab={params.get('t')} go={go} />
  else if (path === '/chantiers') view = <Sites go={go} filter={params.get('f')} />
  else if (path === '/reglages') view = <Settings />
  else view = <Dashboard go={go} />

  const section = detail ? '/chantiers' : path

  return (
    <div className="shell">
      <div className="topbar">
        <Logo size={28} />
        <span>{data.company || 'Oi-8 Artisanat'}</span>
      </div>
      {storageError && (
        <div className="storage-warning" role="alert">
          <Icon name="alert" size={18} /> Espace de stockage plein : les dernières modifications ne sont pas enregistrées. Supprimez quelques photos.
        </div>
      )}
      <main>{view}</main>
      <nav className="bottom-nav" aria-label="Navigation principale">
        {NAV.map((n) => (
          <button key={n.path} type="button" className={section === n.path ? 'on' : ''} aria-current={section === n.path ? 'page' : undefined} onClick={() => go(n.path)}>
            <Icon name={n.icon} size={22} />
            <span>{n.label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}
