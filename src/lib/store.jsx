import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { DEFAULT_COMPANY, DEFAULT_STEPS, seedData } from './seed.js'
import { isoDate, uid } from './utils.js'

const KEY = 'oi8-artisanat:v1'

function load() {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const data = JSON.parse(raw)
      if (data && Array.isArray(data.sites)) return data
    }
  } catch {
    // stockage indisponible ou corrompu : on repart de la démo
  }
  return seedData()
}

const Ctx = createContext(null)

export function StoreProvider({ children }) {
  const [data, setData] = useState(load)
  const [storageError, setStorageError] = useState(false)

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(data))
      setStorageError(false)
    } catch {
      setStorageError(true)
    }
  }, [data])

  const updateSite = useCallback((id, fn) => {
    setData((d) => ({ ...d, sites: d.sites.map((s) => (s.id === id ? fn(s) : s)) }))
  }, [])

  const actions = useMemo(
    () => ({
      updateSite,
      setCompany: (company) => setData((d) => ({ ...d, company })),
      resetDemo: () => setData(seedData()),
      addSite: ({ client, address, status }) => {
        const site = {
          id: uid(),
          client: client.trim(),
          address: address.trim(),
          status,
          startDate: isoDate(),
          cover: 'art:roof-clean:1',
          steps: DEFAULT_STEPS.map((label) => ({ id: uid(), label, done: false })),
          photos: [],
          materials: [],
          expenses: [],
          notes: '',
        }
        setData((d) => ({ ...d, sites: [site, ...d.sites] }))
        return site.id
      },
      deleteSite: (id) => setData((d) => ({ ...d, sites: d.sites.filter((s) => s.id !== id) })),
    }),
    [updateSite],
  )

  const value = useMemo(() => ({ data, storageError, ...actions }), [data, storageError, actions])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export const useStore = () => useContext(Ctx)
export { DEFAULT_COMPANY }
