# 📱 KAPUCE.G - Application Mobile

Application mobile React Native (Expo) pour la plateforme KAPUCE.G.

## 🚀 Installation

### Prérequis
- Node.js 18+
- npm ou yarn
- Expo CLI: `npm install -g expo-cli`
- EAS CLI: `npm install -g eas-cli`

### Installation des dépendances

```bash
cd mobile
npm install
```

### Lancer en mode développement

```bash
npx expo start
```

## 📦 Build APK Android

### Configuration initiale

1. Créez un compte sur [Expo.dev](https://expo.dev/)
2. Connectez-vous: `eas login`
3. Configurez le projet: `eas build:configure`

### Générer l'APK

```bash
# Build de développement (installation directe)
eas build --platform android --profile preview

# Build de production (pour Play Store)
eas build --platform android --profile production
```

### Build local (sans compte Expo)

```bash
npx expo prebuild --platform android
cd android
./gradlew assembleRelease
```

L'APK sera dans: `android/app/build/outputs/apk/release/`

## 🔧 Configuration

L'URL de l'API est configurée dans `app.json`:

```json
{
  "extra": {
    "apiUrl": "https://api.kapuce-gabon.com/api"
  }
}
```

## 📁 Structure du projet

```
mobile/
├── src/
│   ├── screens/        # Écrans de l'application
│   ├── components/     # Composants réutilisables
│   ├── services/       # Services API
│   ├── context/        # Contextes React (Auth, etc.)
│   └── utils/          # Utilitaires
├── assets/             # Images, polices, icônes
├── app.json            # Configuration Expo
├── eas.json            # Configuration EAS Build
└── package.json
```

## 🎨 Thème

Couleurs principales:
- Bleu KAPUCE: `#0B3D91`
- Or KAPUCE: `#C9A227`

## 📲 Fonctionnalités

- ✅ Authentification (Login/Register)
- ✅ Navigation par onglets
- ✅ Liste des annonces
- ✅ Détail d'une annonce
- ✅ Création d'annonce avec photos
- ✅ Profil utilisateur
- ✅ Favoris
- ✅ Géolocalisation

## 🔗 Liens utiles

- [Documentation Expo](https://docs.expo.dev/)
- [EAS Build](https://docs.expo.dev/build/introduction/)
- [React Navigation](https://reactnavigation.org/)

---

© 2024 KAPUCE.G
