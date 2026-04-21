# CoPartir - Frontend

Application web (PWA) de saisie et visualisation pour CoPartir.

Le frontend ne calcule plus le point de ralliement localement: il appelle le backend via `POST /api/calculate-meeting-point`, stocke la reponse dans `sessionStorage`, puis redirige vers la page de resultat.

## Vue d'ensemble

Le frontend contient:
- la page de saisie (`index.html`)
- la page resultat avec carte Leaflet (`result.html`)
- la logique UI et appel API (`app.js`)
- le service worker (`sw.js`) pour cache statique et fallback offline

## Prerequis

- Un backend CoPartir en cours d'execution (par defaut sur `http://localhost:3001`)
- Un serveur statique pour servir `front/` (ne pas ouvrir directement en `file://` en production)

## Lancer le frontend en local

Exemple avec Python:

```bash
cd front
python3 -m http.server 3000
```

Puis ouvrir:
- [http://localhost:3000/index.html](http://localhost:3000/index.html)

## Flux utilisateur

1. L'utilisateur saisit au moins 2 departs + 1 destination
2. `app.js` envoie la requete a `/api/calculate-meeting-point`
3. La reponse est stockee dans `sessionStorage` (`covoipoint_result`)
4. Redirection vers `result.html` (ou `testBox/resultTest.html` en mode dev)
5. `result.html` lit le payload et affiche carte, stats et trajets

## Integration API

Payload envoye:

```json
{
  "startAddresses": ["Paris", "Lyon"],
  "destination": "Dijon",
  "mode": "fast",
  "placeType": "optimal"
}
```

Le frontend attend notamment ces champs en retour:
- `success`
- `meetingPoint`, `destination`, `startPoints`
- `mode`, `stats`
- `routes`, `usedORS`
- `placeTypeLabel`, `nearbyMeetingSpots`

## Structure des fichiers

```text
front/
├── index.html
├── indexTest.html
├── result.html
├── testBox/resultTest.html
├── app.js
├── style.css
├── sw.js
├── manifest.json
├── icons/
└── README.md
```

## Service Worker

`sw.js`:
- cache les assets statiques
- utilise `network-first` pour les documents HTML
- utilise `network-first` pour `/api/*`
- ne migre aucune logique metier vers le backend

## Notes

- L'ancien calculateur frontend (`calculator.js`) a ete retire.
- Le nom produit est maintenant `CoPartir`.
