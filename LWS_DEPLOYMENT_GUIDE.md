# 🚀 Guide de Déploiement KAPUCE.G sur LWS

Ce guide explique comment déployer l'application KAPUCE.G sur la plateforme LWS (Ligne Web Services).

## 📋 Prérequis

1. **Compte LWS** avec un hébergement Node.js actif
2. **Compte MongoDB Atlas** (gratuit M0) - https://www.mongodb.com/atlas
3. **Compte Cloudinary** (gratuit) - https://cloudinary.com/
4. **Accès SSH** à votre hébergement LWS

---

## 🏗️ Architecture du Projet

```
KAPUCE.G/
├── Frontend (Next.js) → Port 3000
└── Backend (Express.js) → Port 5000
```

---

## 📦 Étape 1: Configurer MongoDB Atlas

1. Allez sur https://cloud.mongodb.com/
2. Créez un nouveau cluster M0 (gratuit)
3. Créez un utilisateur de base de données
4. Ajoutez votre IP LWS à la liste blanche (ou 0.0.0.0/0 pour autoriser toutes les IPs)
5. Copiez l'URL de connexion:
   ```
   mongodb+srv://<username>:<password>@<cluster>.mongodb.net/kapuce_db
   ```

---

## 📦 Étape 2: Préparer les fichiers

### Backend (Express.js)

1. Copiez le dossier `kama-backend/` sur votre serveur LWS
2. Renommez-le en `kapuce-backend/` si vous le souhaitez
3. Créez le fichier `.env` à partir de `.env.example`:
   ```bash
   cd kapuce-backend
   cp .env.example .env
   nano .env  # Éditez avec vos valeurs
   ```

4. Installez les dépendances:
   ```bash
   npm install
   ```

5. Démarrez le serveur:
   ```bash
   npm start
   ```

### Frontend (Next.js)

1. Copiez le dossier principal (sans `node_modules`, `.next`, `kama-backend`)
2. Créez/modifiez le fichier `.env.local`:
   ```env
   NEXT_PUBLIC_API_URL=https://votre-domaine-backend.lws.fr/api
   MONGO_URL=mongodb+srv://...
   ```

3. Installez les dépendances et buildez:
   ```bash
   npm install
   npm run build
   npm start
   ```

---

## 🔧 Étape 3: Configuration LWS

### Option A: Hébergement Node.js simple

Si votre hébergement LWS supporte Node.js:

1. Uploadez les fichiers via FTP ou SSH
2. Configurez le fichier de démarrage dans le panel LWS
3. Pointez vers `npm start` pour chaque application

### Option B: Avec PM2 (recommandé)

PM2 permet de garder vos applications en vie:

```bash
# Installer PM2 globalement
npm install -g pm2

# Démarrer le backend
cd /chemin/vers/kapuce-backend
pm2 start src/index.js --name "kapuce-api"

# Démarrer le frontend
cd /chemin/vers/kapuce-frontend
pm2 start npm --name "kapuce-web" -- start

# Sauvegarder la configuration
pm2 save
pm2 startup
```

---

## 🌐 Étape 4: Configuration DNS et Reverse Proxy

### Configuration Nginx (si disponible)

Créez un fichier de configuration pour le reverse proxy:

```nginx
# /etc/nginx/sites-available/kapuce

# Frontend
server {
    listen 80;
    server_name kapuce-gabon.com www.kapuce-gabon.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# API Backend
server {
    listen 80;
    server_name api.kapuce-gabon.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 🔒 Étape 5: Certificat SSL

Activez HTTPS avec Let's Encrypt:

```bash
sudo certbot --nginx -d kapuce-gabon.com -d www.kapuce-gabon.com -d api.kapuce-gabon.com
```

---

## ✅ Checklist de Déploiement

- [ ] MongoDB Atlas configuré et URL copiée
- [ ] Cloudinary configuré avec les clés API
- [ ] Backend déployé et accessible
- [ ] Frontend déployé et accessible
- [ ] Variables d'environnement configurées
- [ ] Certificat SSL actif
- [ ] DNS configuré
- [ ] Tests de fonctionnement effectués

---

## 🧪 Tests Post-Déploiement

1. **Vérifier l'API**:
   ```bash
   curl https://api.kapuce-gabon.com/health
   ```

2. **Tester l'inscription**:
   - Allez sur https://kapuce-gabon.com
   - Créez un compte utilisateur
   - Vérifiez la connexion

3. **Tester la création d'annonce**:
   - Connectez-vous
   - Créez une nouvelle annonce avec images
   - Vérifiez l'upload Cloudinary

---

## 📞 Support

Pour toute question technique:
- Email: contact@kapuce-gabon.com
- Documentation LWS: https://www.lws.fr/aide/
- MongoDB Atlas Support: https://www.mongodb.com/docs/atlas/

---

© 2024 KAPUCE.G - Tous droits réservés
