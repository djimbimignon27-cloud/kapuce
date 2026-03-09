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

## 📦 Installation Rapide

```bash
# 1. Aller dans le dossier mobile
cd mobile

# 2. Installer les dépendances
npm install

# 3. Se connecter à Expo (créer un compte si nécessaire)
npx eas login

# 4. Configurer le projet EAS
npx eas build:configure

# 5. Builder l'APK Android
npx eas build --platform android --profile preview
```

## 🚀 Guide Complet de Build

### Étape 1 : Créer un compte Expo

1. Allez sur https://expo.dev/signup
2. Créez votre compte gratuit
3. Confirmez votre email

### Étape 2 : Installer les outils

```bash
# Installer EAS CLI globalement
npm install -g eas-cli

# Vérifier l'installation
eas --version
```

### Étape 3 : Se connecter

```bash
# Se connecter avec votre compte Expo
eas login

# Entrez votre email et mot de passe
```

### Étape 4 : Configurer le projet

```bash
cd mobile
npm install

# Lier le projet à votre compte Expo
eas build:configure
# Sélectionnez "All" quand demandé
```

### Étape 5 : Builder l'APK

```bash
# Build APK de preview (pour test)
eas build --platform android --profile preview

# Le build prend ~10-15 minutes
# Une fois terminé, vous recevrez un lien pour télécharger l'APK
```

### Étape 6 : Tester l'APK

1. Téléchargez l'APK depuis le lien fourni
2. Transférez-le sur votre téléphone Android
3. Activez "Sources inconnues" dans Paramètres > Sécurité
4. Installez l'APK

## 📤 Publication sur Google Play Store

### 1. Créer un compte développeur Google Play

- Accédez à https://play.google.com/console
- Payez les frais d'inscription ($25 unique)

### 2. Builder pour la production

```bash
# Build AAB pour Google Play
eas build --platform android --profile production
```

### 3. Uploader sur Play Console

1. Créez une nouvelle application
2. Allez dans "Production" > "Créer une version"
3. Uploadez le fichier .aab généré
4. Remplissez les informations requises

## 🍎 Build iOS (Optionnel)

```bash
# Nécessite un compte Apple Developer ($99/an)
eas build --platform ios --profile production

# Soumettre sur l'App Store
eas submit --platform ios
```

## 🔧 Configuration API

L'application est configurée pour se connecter à :
```
https://digital-marketplace-186.preview.emergentagent.com/api
```

Pour modifier l'URL, éditez `app.json` > `extra` > `apiUrl`

## 📁 Structure du projet

```
mobile/
├── App.js                    # Point d'entrée + Navigation
├── app.json                  # Configuration Expo
├── eas.json                  # Configuration EAS Build
├── package.json
├── assets/                   # Icônes et splash screen
│   ├── icon.png             # Icône principale (1024x1024)
│   ├── adaptive-icon.png    # Icône Android adaptative
│   ├── splash.png           # Écran de démarrage
│   └── favicon.png          # Favicon web
└── src/
    ├── context/
    │   └── AuthContext.js    # Gestion authentification
    ├── screens/
    │   ├── SplashScreen.js
    │   ├── LoginScreen.js
    │   ├── RegisterScreen.js
    │   ├── HomeScreen.js
    │   ├── ListingsScreen.js
    │   ├── ListingDetailScreen.js
    │   ├── CreateListingScreen.js
    │   ├── FavoritesScreen.js
    │   └── ProfileScreen.js
    └── services/
        └── api.js            # Configuration Axios
```

## 🔒 Sécurité

- Tokens stockés avec `expo-secure-store`
- Communication HTTPS
- Authentification JWT

## 🐛 Dépannage

### "Unable to resolve module"
```bash
rm -rf node_modules
npm install
npx expo start --clear
```

### Build échoue
```bash
npm install -g eas-cli@latest
eas build:configure
```

### Erreur de connexion API
Vérifiez que l'URL dans `app.json` est correcte et accessible.

---

**KAMA** - La plateforme de référence au Gabon 🇬🇦
