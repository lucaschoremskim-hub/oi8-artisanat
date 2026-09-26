import test from 'node:test'
import assert from 'node:assert/strict'
import { alertMaterials, allCategories, expensesByCategory, materialStatus, monthExpenses, parseNum, progress, totalExpenses } from '../src/lib/utils.js'
import { seedData } from '../src/lib/seed.js'

test('alerte matériel : ok, bientôt épuisé (<20 %), épuisé, dépassé', () => {
  assert.equal(materialStatus({ planned: 100, used: 50 }).level, 'ok')
  assert.equal(materialStatus({ planned: 100, used: 80 }).level, 'ok') // il reste exactement 20 %
  assert.equal(materialStatus({ planned: 100, used: 81 }).level, 'low')
  assert.equal(materialStatus({ planned: 3, used: 3 }).level, 'out')
  assert.equal(materialStatus({ planned: 4, used: 4.5, unit: 'L' }).level, 'over')
  assert.equal(materialStatus({ planned: 0, used: 0 }).alert, false)
})

test('parseNum accepte la virgule française', () => {
  assert.equal(parseNum('12,5'), 12.5)
  assert.equal(parseNum('abc'), 0)
})

test('totaux et catégories', () => {
  const site = { expenses: [{ amount: 10, category: 'A', date: '2026-09-01' }, { amount: '5,5', category: 'A', date: '2026-08-30' }, { amount: 4, category: '', date: '2026-09-02' }] }
  assert.equal(totalExpenses(site), 19.5)
  assert.deepEqual(expensesByCategory(site), [{ category: 'A', total: 15.5 }, { category: 'Sans catégorie', total: 4 }])
  assert.equal(monthExpenses([site], new Date(2026, 8, 15)), 14)
  assert.deepEqual(allCategories([site]), ['A'])
})

test('la démo est vivante : 3 chantiers, alertes, dépenses du mois', () => {
  const now = new Date(2026, 8, 26)
  const { sites } = seedData(now)
  assert.deepEqual(sites.map((s) => s.status), ['active', 'upcoming', 'done'])
  const active = sites[0]
  assert.equal(progress(active), 50)
  assert.equal(alertMaterials(active).length, 3)
  assert.equal(sites.flatMap(alertMaterials).length, 3) // le chantier terminé ne génère aucune alerte
  assert.ok(active.photos.length >= 3)
  assert.ok(monthExpenses(sites, now) > 0)
  for (const s of sites) assert.ok(s.steps.length && s.materials.length && s.expenses.length && s.photos.length)
})
