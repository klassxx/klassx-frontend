# KLASSX — Frontend (React + Vite)

Consomme l'API Django construite dans `klassx_backend/`. Reprend fidèlement
les trois maquettes validées : accueil → catalogue/réservation →
inscription/connexion → tableau de bord élève.

⚠️ Comme pour le backend, ce code a été écrit sans connexion réseau dans cet
environnement, donc **`npm install` et `npm run dev` n'ont pas encore été
exécutés**. Il a été écrit avec soin mais mérite un premier passage réel
avant d'être considéré stable.

## 1. Installation

```bash
npm install
cp .env.example .env
npm run dev
```

Le serveur de dev tourne sur `http://localhost:3000` et redirige automatiquement
les appels `/api/*` vers le backend Django sur `http://localhost:8000`
(voir `vite.config.js`). Lancez donc le backend en parallèle.

## 2. Ce qui est implémenté

| Page | Route | Statut |
|---|---|---|
| Accueil | `/` | ✅ |
| Connexion | `/connexion` | ✅ |
| Inscription | `/inscription` | ✅ |
| Catalogue / réservation | `/catalogue` | ✅ filtres matière/niveau, réservation, liste d'attente, redirection vers Stripe Checkout |
| Tableau de bord élève | `/tableau-de-bord` | ✅ sessions à venir |
| Tableau de bord admin | `/admin` | ✅ stats, affectation enseignant, validation candidatures |
| Tableau de bord enseignant | `/enseignant` | ✅ cours assignés, dépôt de supports |
| Forum | `/forum` | ✅ liste, création, réponses, marquer résolu |
| Capsules vidéo | `/capsules` | ✅ lecteur vidéo réel, bloqué si pas d'abonnement actif (redirige vers Stripe) |

## 3. Ce qu'il reste à faire

- **Confirmation visuelle post-paiement** : Stripe redirige vers `/tableau-de-bord?payment=success` ou `/catalogue?payment=cancelled`, mais ces query params ne déclenchent pas encore de bandeau de confirmation à l'écran.
- Les tokens JWT sont stockés dans `localStorage` — standard pour ce type d'app,
  mais à revoir si vous voulez une politique de sécurité plus stricte (ex. cookies
  httpOnly + refresh côté serveur).
- Design des pages admin/enseignant plus sommaire que les pages élève — fonctionnel mais pas encore peaufiné visuellement.
- Aucun test automatisé (unitaire ou end-to-end).

## 4. Structure

```
src/
  api/
    client.js       # appels fetch + gestion JWT
    AuthContext.jsx # état d'authentification global
  components/
    Navbar.jsx
    ProtectedRoute.jsx
  pages/
    Home.jsx, Login.jsx, Register.jsx
    Catalog.jsx, Dashboard.jsx
    AdminDashboard.jsx, TeacherDashboard.jsx
    Forum.jsx, VideoCapsules.jsx
  styles/global.css  # tokens de design (couleurs, espacements)
```
