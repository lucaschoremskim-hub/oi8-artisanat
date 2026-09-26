import { isoDate, uid } from './utils.js'

export const DEFAULT_COMPANY = 'Oi-8 Artisanat'

export const DEFAULT_STEPS = [
  'Repérage et sécurisation',
  'Inspection avant intervention',
  'Nettoyage',
  'Rinçage et contrôle',
  'Photos et rapport final',
]

// Date de démo : jamais avant le 1er du mois courant pour que le tableau de bord « dépenses du mois » soit vivant
function recent(now, daysAgo) {
  const d = new Date(now.getFullYear(), now.getMonth(), Math.max(1, now.getDate() - daysAgo))
  return isoDate(d)
}

function lastMonth(now, day) {
  return isoDate(new Date(now.getFullYear(), now.getMonth() - 1, day))
}

const steps = (list, doneCount) => list.map((label, i) => ({ id: uid(), label, done: i < doneCount }))
const mat = (name, unit, planned, used) => ({ id: uid(), name, unit, planned, used })
const exp = (label, amount, category, date) => ({ id: uid(), label, amount, category, date })

export function seedData(now = new Date()) {
  const active = {
    id: uid(),
    client: 'Villa Lefèvre',
    address: '14 allée des Cyprès, 34130 Mauguio',
    status: 'active',
    startDate: recent(now, 6),
    cover: 'art:panels-mid:2',
    steps: steps(
      [
        'Repérage et sécurisation de la toiture',
        'Relevé de production avant nettoyage',
        'Inspection des 24 panneaux',
        'Pré-rinçage à l’eau osmosée',
        'Nettoyage des panneaux à la perche',
        'Nettoyage des cadres et fixations',
        'Relevé de production après nettoyage',
        'Rapport photos avant / après',
      ],
      4,
    ),
    photos: [
      { id: uid(), src: 'art:panels-dirty:2', caption: 'Avant : poussière et fientes sur toute la surface', date: recent(now, 6) },
      { id: uid(), src: 'art:panels-mid:2', caption: 'En cours : première moitié nettoyée', date: recent(now, 1) },
      { id: uid(), src: 'art:panels-mid:5', caption: 'Comparaison côté nettoyé / côté sale', date: recent(now, 1) },
      { id: uid(), src: 'art:gutter:4', caption: 'Rive et gouttière à contrôler', date: recent(now, 3) },
    ],
    materials: [
      mat('Eau osmosée', 'L', 400, 260),
      mat('Détergent spécial photovoltaïque', 'L', 6, 5.2),
      mat('Chiffons microfibres', 'pièces', 20, 8),
      mat('Brosse rotative (têtes de rechange)', 'pièces', 3, 3),
      mat('Anti-mousse pour cadres', 'L', 4, 4.5),
    ],
    expenses: [
      exp('Détergent photovoltaïque 10 L', 64.9, 'Produits', recent(now, 6)),
      exp('Location perche télescopique 12 m', 85, 'Location matériel', recent(now, 5)),
      exp('Carburant fourgon', 42.3, 'Carburant', recent(now, 2)),
      exp('Eau osmosée (recharge cuve 500 L)', 38, 'Produits', recent(now, 1)),
    ],
    notes:
      'Accès toiture par l’échelle côté garage. Client absent le matin : clé chez la voisine (n° 16).\nOnduleur dans le cellier : relever la production avant et après.\nPenser à prévenir le client quand le rapport est prêt.',
  }

  const upcoming = {
    id: uid(),
    client: 'Copropriété Les Terrasses',
    address: '3 rue du Port, 34200 Sète',
    status: 'upcoming',
    startDate: isoDate(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 9)),
    cover: 'art:roof-moss:3',
    steps: steps(
      [
        'Visite de repérage avec le syndic',
        'Installation des lignes de vie',
        'Démoussage de la toiture (180 m²)',
        'Rinçage haute pression',
        'Traitement hydrofuge',
        'Nettoyage des gouttières',
        'Rapport de fin de chantier',
      ],
      0,
    ),
    photos: [{ id: uid(), src: 'art:roof-moss:3', caption: 'Visite de devis : mousse épaisse côté nord', date: recent(now, 12) }],
    materials: [
      mat('Produit de démoussage', 'L', 60, 0),
      mat('Hydrofuge toiture', 'L', 45, 0),
      mat('Sacs à déchets', 'pièces', 12, 0),
    ],
    expenses: [exp('Acompte location nacelle', 120, 'Location matériel', recent(now, 4))],
    notes: 'Devis accepté. Syndic : Mme Roussel (présente le jour du repérage). Prévoir affichage d’information dans le hall.',
  }

  const done = {
    id: uid(),
    client: 'SCI Bel-Air',
    address: '27 avenue des Vignes, 34070 Montpellier',
    status: 'done',
    startDate: lastMonth(now, 12),
    cover: 'art:roof-clean:6',
    steps: steps(
      [
        'Repérage et sécurisation',
        'Démoussage des tuiles',
        'Rinçage et brossage',
        'Traitement hydrofuge',
        'Nettoyage des gouttières',
        'Contrôle final et rapport',
      ],
      6,
    ),
    photos: [
      { id: uid(), src: 'art:roof-moss:6', caption: 'Avant : tuiles couvertes de mousse', date: lastMonth(now, 12) },
      { id: uid(), src: 'art:roof-clean:6', caption: 'Après : toiture propre et traitée', date: lastMonth(now, 14) },
      { id: uid(), src: 'art:gutter:6', caption: 'Gouttières dégagées', date: lastMonth(now, 14) },
    ],
    materials: [
      mat('Produit de démoussage', 'L', 40, 38),
      mat('Hydrofuge toiture', 'L', 30, 29),
      mat('Sacs à déchets', 'pièces', 10, 9),
    ],
    expenses: [
      exp('Produit de démoussage', 96, 'Produits', lastMonth(now, 12)),
      exp('Hydrofuge 30 L', 189, 'Produits', lastMonth(now, 12)),
      exp('Location nacelle 2 jours', 340, 'Location matériel', lastMonth(now, 13)),
      exp('Carburant', 51.4, 'Carburant', lastMonth(now, 14)),
    ],
    notes: 'Chantier soldé. Facture envoyée, garantie hydrofuge 10 ans remise au client. Repasser dans 2 ans pour un contrôle.',
  }

  return { version: 1, company: DEFAULT_COMPANY, sites: [active, upcoming, done] }
}
