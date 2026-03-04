# 🏆 KAMA - Marketplace Gabon

## 🎯 Vision du Projet

**KAMA** est la plateforme digitale de référence au Gabon pour:
- 🏠 Location et vente immobilière
- 🚗 Vente et location de véhicules  
- 🏞️ Vente de terrains

**Positionnement stratégique**: Sécuriser les transactions et restaurer la confiance sur le marché gabonais.

---

## ✅ État d'Implémentation

### Backend (Next.js + MongoDB) - ✅ 85%+ Fonctionnel

#### ✅ Authentification Complète
- ✅ Inscription utilisateur avec JWT
- ✅ Connexion sécurisée
- ✅ Refresh tokens
- ✅ Vérification email (mockée)
- ✅ Hash bcrypt pour mots de passe
- ✅ Système de bannissement

#### ✅ Gestion des Annonces (CRUD Complet)
- ✅ Créer une annonce (auth requise)
- ✅ Lister toutes les annonces actives
- ✅ Détails d'une annonce (+ compteur de vues)
- ✅ Modifier/Supprimer annonce (propriétaire ou admin)
- ✅ Recherche avancée avec filtres:
  - Type (HOUSE, CAR, LAND)
  - Catégorie (SALE, RENT)
  - Ville
  - Prix min/max
  - Annonces vérifiées uniquement
  - Tri par date/prix

#### ✅ Système de Transactions
- ✅ Créer transaction
- ✅ Calcul automatique commission 7%
- ✅ Paiement mocké (95% taux de succès simulé)
- ✅ Mise à jour automatique statut annonce
- ✅ Notifications email mockées

#### ✅ Système de Favoris
- ✅ Ajouter/Retirer des favoris
- ✅ Lister mes favoris

#### ⚠️ Système de Reviews
- ⚠️ Créer un avis (paramètre fixé)
- ⚠️ Lister avis d'un utilisateur
- ⚠️ Calcul note moyenne

#### ✅ Dashboard Admin
- ✅ Statistiques globales (users, listings, transactions, revenus)
- ✅ Revenus mensuels
- ⚠️ Gestion utilisateurs (bannir/débannir) - Route à finaliser
- ⚠️ Validation annonces - Route à finaliser
- ✅ Gestion signalements

#### ✅ Système de Signalements
- ✅ Créer signalement
- ✅ Lister signalements
- ✅ Admin peut mettre à jour statut

---

### Frontend (Next.js + TailwindCSS + shadcn/ui) - ✅ Core Implémenté

#### ✅ Design System KAMA
- Couleur primaire: `#0B3D91` (Bleu foncé)
- Couleur accent: `#C9A227` (Doré premium)
- Design moderne, minimal, professionnel
- Responsive mobile-first

#### ✅ Pages Implémentées
- ✅ **Homepage** (/)
  - Hero section avec recherche
  - Features section
  - Annonces récentes
  - Footer complet
  
- ✅ **Authentification**
  - `/auth/login` - Page de connexion
  - `/auth/register` - Page d'inscription

- ✅ **Annonces**
  - `/listings` - Liste avec filtres
  - `/listings/create` - Créer annonce
  - `/listings/[id]` - Détail (à créer)

- ⏳ **Dashboards**
  - `/dashboard` - Dashboard utilisateur (à créer)
  - `/admin` - Dashboard admin (à créer)
  - `/favorites` - Mes favoris (à créer)

---

## 🛠️ Architecture Technique

### Stack Technologique
- **Frontend**: Next.js 14, React, TailwindCSS, shadcn/ui
- **Backend**: Next.js API Routes
- **Base de données**: MongoDB + Mongoose ODM
- **Auth**: JWT (access + refresh tokens)
- **Email**: Service mocké (prêt pour SendGrid)
- **Paiement**: Service mocké (prêt pour Stripe)

### Structure du Projet

```
/app
├── app/
│   ├── api/                      # Backend API Routes
│   │   ├── auth/                 # Authentification
│   │   │   ├── register/
│   │   │   ├── login/
│   │   │   ├── refresh/
│   │   │   └── verify-email/
│   │   ├── listings/             # Annonces
│   │   │   ├── [id]/
│   │   │   └── search/
│   │   ├── transactions/         # Transactions
│   │   ├── reviews/              # Avis
│   │   ├── favorites/            # Favoris
│   │   └── admin/                # Administration
│   │       ├── dashboard/
│   │       ├── users/
│   │       ├── listings/
│   │       └── reports/
│   ├── auth/                     # Pages auth frontend
│   │   ├── login/
│   │   └── register/
│   ├── listings/                 # Pages annonces frontend
│   │   ├── create/
│   │   └── [id]/
│   ├── page.js                   # Homepage
│   ├── layout.js                 # Layout principal
│   └── globals.css               # Styles globaux
├── lib/
│   ├── models/                   # Modèles MongoDB
│   │   ├── User.js
│   │   ├── Listing.js
│   │   ├── Transaction.js
│   │   ├── Review.js
│   │   ├── Favorite.js
│   │   └── Report.js
│   ├── db.js                     # Connexion MongoDB
│   ├── auth.js                   # Utilitaires JWT
│   ├── email.js                  # Service email mocké
│   └── payment.js                # Service paiement mocké
├── components/ui/                # Composants shadcn/ui
└── .env                          # Variables d'environnement
```

---

## 📊 Modèles de Données

### User
```javascript
{
  fullName: String,
  email: String (unique),
  phone: String,
  passwordHash: String,
  role: 'USER' | 'OWNER' | 'ADMIN',
  isVerified: Boolean,
  isBanned: Boolean,
  banReason: String,
  profilePicture: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Listing
```javascript
{
  title: String,
  description: String,
  price: Number,
  type: 'HOUSE' | 'CAR' | 'LAND',
  category: 'SALE' | 'RENT',
  city: String,
  address: String,
  images: [String],
  ownerId: ObjectId (ref User),
  status: 'ACTIVE' | 'SOLD' | 'RENTED' | 'PENDING',
  verified: Boolean,
  viewsCount: Number,
  createdAt: Date,
  updatedAt: Date
}
```

### Transaction
```javascript
{
  listingId: ObjectId (ref Listing),
  buyerId: ObjectId (ref User),
  sellerId: ObjectId (ref User),
  amount: Number,
  commissionAmount: Number, // Automatique: amount * 0.07
  status: 'INITIATED' | 'PAID' | 'COMPLETED' | 'CANCELLED',
  paymentMethod: String,
  transactionId: String,
  createdAt: Date
}
```

---

## 🚀 Installation & Démarrage

### Prérequis
- Node.js 18+
- MongoDB en cours d'exécution
- Yarn

### Variables d'Environnement (.env)
```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=kama_marketplace

# JWT Configuration
JWT_SECRET=kama_super_secret_jwt_key_change_in_production_2024
JWT_REFRESH_SECRET=kama_refresh_token_secret_key_change_in_production_2024
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# Email Configuration (Mocked)
EMAIL_MOCK_MODE=true
SENDGRID_API_KEY=mock_sendgrid_key
EMAIL_FROM=noreply@kama-gabon.com

# Payment Configuration (Mocked)
PAYMENT_MOCK_MODE=true
COMMISSION_RATE=0.07

NEXT_PUBLIC_BASE_URL=https://your-domain.com
CORS_ORIGINS=*
```

### Installation
```bash
cd /app
yarn install
```

### Démarrage
```bash
# En développement
yarn dev

# En production
yarn build
yarn start
```

L'application sera accessible sur `http://localhost:3000`

---

## 📝 API Documentation

### Authentification

#### POST /api/auth/register
Inscription d'un nouvel utilisateur

**Body:**
```json
{
  "fullName": "Jean Dupont",
  "email": "jean@example.com",
  "phone": "+241 XX XX XX XX",
  "password": "password123",
  "role": "USER" // ou "OWNER"
}
```

**Response:**
```json
{
  "message": "Inscription réussie!",
  "user": { ... },
  "accessToken": "...",
  "refreshToken": "..."
}
```

#### POST /api/auth/login
Connexion utilisateur

**Body:**
```json
{
  "email": "jean@example.com",
  "password": "password123"
}
```

### Annonces

#### GET /api/listings
Lister toutes les annonces actives (pagination)

**Query params:**
- `page`: Numéro de page (défaut: 1)
- `limit`: Résultats par page (défaut: 12)

#### POST /api/listings
Créer une annonce (auth requise)

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Body:**
```json
{
  "title": "Villa 3 chambres",
  "description": "Belle villa...",
  "price": 50000000,
  "type": "HOUSE",
  "category": "SALE",
  "city": "Libreville",
  "address": "Quartier Glass",
  "images": ["url1", "url2"]
}
```

#### GET /api/listings/search
Recherche avancée

**Query params:**
- `search`: Terme de recherche
- `type`: HOUSE | CAR | LAND
- `category`: SALE | RENT
- `city`: Ville
- `minPrice`: Prix minimum
- `maxPrice`: Prix maximum
- `verified`: true | false
- `sortBy`: createdAt | price
- `sortOrder`: asc | desc

#### GET /api/listings/[id]
Détails d'une annonce

#### PUT /api/listings/[id]
Modifier une annonce (propriétaire ou admin)

#### DELETE /api/listings/[id]
Supprimer une annonce (propriétaire ou admin)

### Transactions

#### POST /api/transactions
Créer une transaction (auth requise)

**Body:**
```json
{
  "listingId": "...",
  "paymentMethod": "card"
}
```

#### GET /api/transactions
Mes transactions (auth requise)

### Favoris

#### POST /api/favorites
Ajouter/retirer un favori (auth requise)

**Body:**
```json
{
  "listingId": "..."
}
```

#### GET /api/favorites
Mes favoris (auth requise)

---

## 🔐 Sécurité

### Implémenté
- ✅ Hash bcrypt (12 rounds)
- ✅ JWT avec access + refresh tokens
- ✅ Validation backend sur toutes les routes
- ✅ Authentification requise sur routes protégées
- ✅ Vérification propriétaire/admin pour modifications
- ✅ Système de bannissement
- ✅ Rate limiting (à activer en production)

### À Ajouter en Production
- Protection XSS
- CORS configuré correctement
- Rate limiting actif
- Validation approfondie des inputs
- Logs sécurisés
- HTTPS obligatoire

---

## 🎨 Design System

### Couleurs
- **Primaire (kama-blue)**: `#0B3D91` - Représente la confiance et la sécurité
- **Accent (kama-gold)**: `#C9A227` - Premium et élégance

### Composants
Utilisation de **shadcn/ui** pour:
- Boutons
- Inputs
- Cards
- Badges
- Toasts
- Dialogs
- Selects
- etc.

---

## 🚧 Travail Restant

### Haute Priorité
1. ⏳ Finaliser dashboards (user + admin)
2. ⏳ Page détail annonce
3. ⏳ Tests frontend complets
4. ⏳ Fix routes admin (users, listings)

### Moyenne Priorité
5. Upload réel d'images
6. Géolocalisation (maps)
7. Notifications in-app
8. Système de chat vendeur/acheteur

### Basse Priorité
9. Intégration SendGrid
10. Intégration Stripe
11. Analytics avancés
12. SEO optimization
13. PWA support

---

## 🧪 Tests

### Backend Tests
- ✅ Authentification complète testée
- ✅ CRUD annonces testé
- ✅ Transactions testées
- ✅ Favoris testés
- ✅ Dashboard admin testé
- ⚠️ Reviews partiellement testé
- ⏳ Tests admin management à finaliser

### Frontend Tests
- ⏳ À effectuer avec testing agent

---

## 📈 Performance

### Optimisations
- Index MongoDB sur champs recherchés (email, type, city, price, status)
- Pagination sur toutes les listes
- Connection pooling MongoDB
- Lazy loading images (à implémenter)

### Métriques Cibles
- Lighthouse score: 90+
- Time to first byte: < 200ms
- First contentful paint: < 1.5s

---

## 🌟 Fonctionnalités Uniques KAMA

1. **Sécurité Maximale**: Vérification des annonces + utilisateurs
2. **Commission Transparente**: 7% automatique sur chaque transaction
3. **Système de Réputation**: Reviews + badges vérifiés
4. **Dashboard Complet**: Statistiques en temps réel
5. **Multi-Catégories**: Immobilier + Véhicules + Terrains

---

## 📧 Contact & Support

- **Email**: contact@kama-gabon.com
- **Téléphone**: +241 XX XX XX XX

---

## 📜 Licence

Propriétaire - KAMA © 2024

---

## 🎯 MVP Status: **PRÊT À 85%+**

✅ **Backend fonctionnel**  
✅ **Auth complète**  
✅ **CRUD annonces**  
✅ **Transactions avec commission**  
✅ **Frontend moderne**  
⏳ **Dashboards en finalisation**  

**Prochaine étape**: Finaliser dashboards et tester le frontend complet!
