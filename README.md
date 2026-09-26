# Oi-8 Artisanat

Démo de suivi de chantier pour artisans (nettoyage de panneaux solaires et de toitures). Tout tourne dans le navigateur : pas de compte, pas de serveur, données dans le `localStorage`.

## Lancer

```
npm.cmd install --cache .npm-cache
npm.cmd run dev
```

Puis ouvrir l'adresse affichée (Vite, port 5173 par défaut). Tests : `npm.cmd test`.

## Fonctions

- Tableau de bord : chantiers en cours, dépenses du mois, matériel en alerte.
- Liste des chantiers filtrable (à venir / en cours / terminé), création et suppression.
- Fiche chantier : total des dépenses en haut, étapes (cocher, ajouter, renommer, supprimer), photos importées depuis l'appareil, matériel prévu/utilisé, dépenses avec catégories libres, notes.
- Alerte matériel : orange sous 20 % de reste (ou épuisé), rouge en cas de dépassement. Pas d'alerte pour un chantier terminé.
- Réglages : nom de l'entreprise, réinitialisation de la démo (3 chantiers d'exemple).

## Déploiement Vercel

Projet Vite standard : `vercel.json` est prêt (build `npm run build`, sortie `dist`). Importer le dépôt dans Vercel, sans variable d'environnement.

## Notes techniques

- Les photos de démo sont des illustrations SVG générées (`src/lib/art.js`), stockées sous la forme `art:<scène>:<graine>`.
- Les photos importées sont réduites (1280 px max, JPEG) ; si le stockage du navigateur est plein, un bandeau prévient.
- Clé de stockage : `oi8-artisanat:v1`.
