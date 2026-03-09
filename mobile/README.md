# KAMA Mobile - Application Android/iOS

Application mobile officielle de la plateforme KAMA pour la location et vente de biens immobiliers, véhicules et terrains au Gabon.

## 📱 Fonctionnalités

- **Navigation intuitive** avec barre d'onglets
- **Authentification sécurisée** (Login/Register)
- **Recherche d'annonces** par catégorie (Immobilier, Véhicules, Terrains)
- **Liste des favoris** personnalisée
- **Détails des annonces** avec galerie photos
- **Profil utilisateur** avec gestion du compte

## 🎨 Design

L'application utilise les couleurs officielles KAMA :
- **Bleu foncé** : `#0B3D91`
- **Doré** : `#C9A227`

## 🛠️ Prérequis

1. **Node.js** (v18+)
2. **npm** ou **yarn**
3. **Expo CLI** : `npm install -g expo-cli`
4. **EAS CLI** : `npm install -g eas-cli`
5. **Compte Expo** : https://expo.dev/signup

## 📦 Installation

```bash
cd mobile
npm install
```

## 🚀 Développement

### Lancer l'application en mode développement

```bash
# Démarrer le serveur Expo
npx expo start

# Scanner le QR code avec Expo Go (Android/iOS)
```

### Tester sur simulateur

```bash
# Android
npx expo start --android

# iOS (Mac uniquement)
npx expo start --ios
```

## 📲 Build Android (APK)

### 1. Se connecter à Expo

```bash
eas login
```

### 2. Configurer le projet

```bash
eas build:configure
```

### 3. Générer l'APK (Preview)

```bash
# Build APK pour test interne
eas build --platform android --profile preview
```

Le build sera effectué sur les serveurs Expo. Une fois terminé, vous recevrez un lien pour télécharger l'APK.

### 4. Build Production (AAB pour Play Store)

```bash
eas build --platform android --profile production
```

## 🍎 Build iOS

### 1. Générer le build iOS

```bash
# Nécessite un compte Apple Developer ($99/an)
eas build --platform ios --profile production
```

### 2. Soumettre sur l'App Store

```bash
eas submit --platform ios
```

## 📤 Publication sur Google Play Store

### 1. Créer un compte Google Play Console

- Accédez à https://play.google.com/console
- Payez les frais d'inscription ($25 unique)

### 2. Créer une application

- Nouvelle application > Android
- Remplir les informations de l'application

### 3. Configurer le fichier de clé

Créez un fichier `google-service-account.json` pour l'upload automatique :

```bash
# Soumettre automatiquement
eas submit --platform android
```

Ou uploadez manuellement l'AAB via la console.

## 🔧 Configuration API

L'application est configurée pour se connecter à :
```
https://digital-marketplace-186.preview.emergentagent.com/api
```

Pour modifier l'URL de l'API, éditez `/src/services/api.js`.

## 📁 Structure du projet

```
mobile/
├── App.js                    # Point d'entrée
├── app.json                  # Configuration Expo
├── eas.json                  # Configuration EAS Build
├── package.json
└── src/
    ├── context/
    │   └── AuthContext.js    # Gestion authentification
    ├── screens/
    │   ├── SplashScreen.js   # Écran de chargement
    │   ├── LoginScreen.js    # Connexion
    │   ├── RegisterScreen.js # Inscription
    │   ├── HomeScreen.js     # Accueil
    │   ├── ListingsScreen.js # Liste des annonces
    │   ├── ListingDetailScreen.js
    │   ├── CreateListingScreen.js
    │   ├── FavoritesScreen.js
    │   └── ProfileScreen.js
    └── services/
        └── api.js            # Configuration Axios
```

## 🔒 Sécurité

- Les tokens sont stockés avec `expo-secure-store`
- Communication HTTPS avec l'API
- Authentification JWT

## 🐛 Dépannage

### Erreur "Unable to resolve module"
```bash
rm -rf node_modules
npm install
npx expo start --clear
```

### Build échoue sur EAS
Vérifiez que vous avez la dernière version d'EAS CLI :
```bash
npm install -g eas-cli@latest
```

## 📞 Support

Pour toute question technique, contactez l'équipe KAMA.

---

**KAMA** - La plateforme de référence au Gabon 🇬🇦
