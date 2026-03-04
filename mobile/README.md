# 📱 KAMA Mobile - Application React Native

Application mobile officielle de KAMA pour Android (et iOS dans le futur).

## 🚀 Technologies utilisées

- **React Native** avec Expo
- **React Navigation** pour la navigation
- **Expo SecureStore** pour le stockage sécurisé
- **Axios** pour les appels API

## 📁 Structure du projet

```
mobile/
├── App.js                 # Point d'entrée
├── app.json              # Configuration Expo
├── package.json          # Dépendances
├── src/
│   ├── context/
│   │   └── AuthContext.js    # Gestion authentification
│   ├── screens/
│   │   ├── SplashScreen.js       # Écran de démarrage
│   │   ├── ChooseAccountScreen.js # Choix type de compte
│   │   ├── LoginScreen.js        # Connexion
│   │   ├── RegisterScreen.js     # Inscription
│   │   ├── HomeScreen.js         # Accueil
│   │   ├── ListingsScreen.js     # Liste annonces
│   │   ├── ListingDetailScreen.js # Détail annonce
│   │   ├── CreateListingScreen.js # Création annonce
│   │   ├── ProfileScreen.js      # Profil utilisateur
│   │   └── FavoritesScreen.js    # Favoris
│   └── services/
│       └── api.js           # Configuration API
└── assets/                  # Images et ressources
```

## 🛠️ Installation

### Prérequis
- Node.js 18+
- npm ou yarn
- Expo CLI (`npm install -g expo-cli`)
- EAS CLI (`npm install -g eas-cli`)

### Étapes

1. **Installer les dépendances**
```bash
cd mobile
npm install
# ou
yarn install
```

2. **Démarrer en mode développement**
```bash
npx expo start
```

3. **Tester sur un appareil Android**
   - Téléchargez l'app "Expo Go" sur votre téléphone
   - Scannez le QR code affiché dans le terminal

## 📦 Build pour production (Android)

### 1. Créer un compte Expo

```bash
npx expo register
# ou
npx expo login
```

### 2. Configurer EAS Build

```bash
eas build:configure
```

### 3. Créer le fichier eas.json

```json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {
      "android": {
        "buildType": "apk"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

### 4. Générer l'APK

```bash
# APK pour tests
eas build --platform android --profile preview

# AAB pour Play Store
eas build --platform android --profile production
```

## 🏪 Publication sur Google Play Store

### Prérequis
- Compte Google Play Console (25$ une fois)
- Créer le compte: https://play.google.com/console/signup

### Étapes de publication

1. **Créer une nouvelle application** dans la Play Console

2. **Préparer les assets requis**:
   - Icône de l'app (512x512 PNG)
   - Feature graphic (1024x500 PNG)
   - Screenshots (min 2, différentes tailles)
   - Description courte (80 caractères max)
   - Description complète (4000 caractères max)

3. **Remplir les informations**:
   - Nom de l'app: KAMA
   - Catégorie: Immobilier / Petites annonces
   - Pays: Gabon (et autres)

4. **Configurer la version**:
   - Uploader le fichier AAB généré
   - Notes de version

5. **Passer les tests**:
   - Classification du contenu
   - Politique de confidentialité
   - Publicités (déclarer si présentes)

6. **Soumettre pour examen**
   - Délai: 1-7 jours ouvrés

## 🎨 Assets à créer

### Icône de l'app
- `assets/icon.png` - 1024x1024 PNG
- `assets/adaptive-icon.png` - 1024x1024 PNG (Android)
- `assets/splash.png` - 1284x2778 PNG

### Pour le Play Store
- Icône HD: 512x512 PNG
- Feature Graphic: 1024x500 PNG
- Screenshots: 
  - Téléphone: 1080x1920 (portrait)
  - Tablette 7": 1200x1920
  - Tablette 10": 1600x2560

## 🔧 Configuration API

L'API backend est configurée dans `src/services/api.js`:

```javascript
const API_URL = 'https://kama-preview.preview.emergentagent.com/api';
```

Pour la production, mettez à jour avec votre domaine personnalisé.

## 📝 Fonctionnalités implémentées

- ✅ Authentification (login/register)
- ✅ Choix du type de compte (User/Owner/Agency)
- ✅ Liste des annonces avec filtres
- ✅ Détail d'une annonce
- ✅ Profil utilisateur
- ✅ Favoris (interface)
- ✅ Navigation par onglets
- ✅ Thème KAMA (couleurs officielles)

## 🔜 Fonctionnalités à venir

- [ ] Création d'annonces depuis l'app
- [ ] Upload de photos
- [ ] Notifications push
- [ ] Chat intégré
- [ ] Paiements in-app

## 📞 Support

Pour toute question: contact@kama-gabon.com

---

© 2024 KAMA - Transactions Sécurisées au Gabon 🇬🇦
