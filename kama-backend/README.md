# KAMA Backend API

API Backend Express.js pour la plateforme KAMA - Immobilier, Véhicules et Terrains au Gabon.

## 🚀 Démarrage rapide

### Prérequis
- Node.js 18+
- MongoDB Atlas (ou local)
- Compte Cloudinary

### Installation

```bash
# Cloner le repo
git clone <url>
cd kama-backend

# Installer les dépendances
npm install

# Configurer les variables d'environnement
cp .env.example .env
# Éditer .env avec vos credentials

# Lancer en développement
npm run dev

# Lancer en production
npm start
```

## 📚 Endpoints API

### Authentification
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/auth/register` | Inscription |
| POST | `/api/auth/login` | Connexion |
| POST | `/api/auth/refresh` | Rafraîchir le token |
| GET | `/api/auth/me` | Profil utilisateur |
| POST | `/api/auth/logout` | Déconnexion |

### Annonces
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/listings` | Liste des annonces |
| GET | `/api/listings/search` | Recherche avancée |
| GET | `/api/listings/:id` | Détail annonce |
| POST | `/api/listings` | Créer annonce |
| PUT | `/api/listings/:id` | Modifier annonce |
| DELETE | `/api/listings/:id` | Supprimer annonce |

### Transactions
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/transactions` | Mes transactions |
| POST | `/api/transactions` | Initier transaction |
| PUT | `/api/transactions/:id` | Mettre à jour statut |

### Admin
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/admin/auth/login` | Connexion admin |
| GET | `/api/admin/dashboard-stats` | Statistiques |
| GET | `/api/admin/listings` | Annonces en attente |
| PUT | `/api/admin/listings/:id/approve` | Approuver |
| PUT | `/api/admin/listings/:id/reject` | Rejeter |

## 🛡️ Sécurité

- JWT pour l'authentification
- Rate limiting (100 req/15min)
- Helmet pour les headers HTTP
- CORS configuré

## 🚀 Déploiement sur Railway

1. Créer un projet sur Railway
2. Connecter votre repo GitHub
3. Ajouter les variables d'environnement
4. Déployer !

## 📄 License

MIT
