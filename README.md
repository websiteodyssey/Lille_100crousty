# 100% Crousti Lille — site indépendant

Site vitrine **one page** dédié au restaurant **100% Crousti Original Lille**
(3 rue des Sarrazins, 59000 Lille). Projet autonome, séparé du site général de
la marque, déployable indépendamment.

Stack : **HTML / CSS / JavaScript natifs** (aucun framework). Carte via Leaflet
(CDN). Polices Anton + Inter (Google Fonts).

## Lancer en local
```sh
# depuis ce dossier
python3 -m http.server 5178
# puis ouvrir http://localhost:5178/
```

## Structure
```
100-crousti-lille/
├── index.html      # page unique (13 sections, ancres de navigation)
├── styles.css      # design complet (DA 100% Crousti), responsive, reduced-motion
├── script.js       # menu, modale, carrousel, galerie/lightbox, carte, horaires…
├── assets/
│   ├── images/     # photos produits & univers de la marque
│   ├── videos/     # hero.mp4 + poster
│   ├── logo/       # logo, badge & mot 100% Tasty
│   ├── mascotte/   # poses de la mascotte (pose-1…6)
│   └── icons/      # (icônes en SVG inline dans le HTML)
└── README.md
```

## Données réelles intégrées
- Adresse : 3 rue des Sarrazins, 59000 Lille
- Téléphone : 03 20 47 75 24 (`tel:+33320477524`)
- Uber Eats & Deliveroo : liens **exacts** vers le restaurant de Lille (quartier Gambetta)
- Réseaux sociaux : comptes **officiels de l'enseigne** (pas de compte local)

## À confirmer avant mise en ligne (voir les `TODO` dans le code)
- **Horaires** : valeur provisoire = standard de l'enseigne (11 h – 23 h, 7j/7).
  Confirmer sur la fiche Google, puis compléter `LILLE_OPENING_HOURS` et passer
  `HOURS_VERIFIED = true` dans `script.js` pour activer le badge Ouvert/Fermé.
- **Note Google / nombre d'avis** : non affichés tant que non vérifiés sur la
  fiche officielle. Renseigner `SITE_CONFIG.google` dans `script.js` (l'encart
  note + étoiles s'affiche automatiquement).
- **URL publiques** : `og:url`, `canonical` (dans `index.html`) et
  `GENERAL_WEBSITE_URL` / `RESTAURANTS_URL` (dans `script.js`).

## Lien avec le site général
- Le site général renvoie vers ce site via une constante unique `LILLE_WEBSITE_URL`
  (dans `app.js` du projet général) : fiche restaurant, bouton « Découvrir Lille »
  et popup Leaflet du marqueur Lille.
- Ce site renvoie vers le site général via `GENERAL_WEBSITE_URL` (header, menu
  mobile et footer).

## Déploiement séparé
Dossier 100 % statique : déployable tel quel sur n'importe quel hébergement
statique (Netlify, Vercel, GitHub Pages, OVH, S3…). Aucune étape de build.
Remplacer les `TODO` d'URL par le domaine de production avant publication.
