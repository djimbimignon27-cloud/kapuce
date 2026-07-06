# 🚀 KAPUCE.G - Guide de déploiement sur LWS (PHP + MySQL)

## 📦 Contenu du projet
Application complète en **PHP pur + MySQL** — aucune installation de framework nécessaire.
Compatible avec tous les hébergements mutualisés LWS (PHP 7.4+ / 8.x).

## ✅ Étapes de déploiement

### 1. Créer la base de données MySQL sur LWS
1. Connectez-vous à votre **panel LWS** (https://panel.lws.fr)
2. Allez dans **MySQL & PhpMyAdmin**
3. Créez une nouvelle base de données (ex: `votrecompte_kapuce`)
4. Notez : le **nom de la base**, l'**utilisateur**, le **mot de passe** et l'**hôte** (souvent `localhost`)

### 2. Configurer le projet
Ouvrez le fichier `config.php` et modifiez les 4 lignes :
```php
define('DB_HOST', 'localhost');            // Hôte MySQL LWS
define('DB_NAME', 'votrecompte_kapuce');   // Nom de votre base
define('DB_USER', 'votrecompte_user');     // Utilisateur MySQL
define('DB_PASS', 'VotreMotDePasse');      // Mot de passe MySQL
```

### 3. Envoyer les fichiers sur LWS
1. Dans le panel LWS, ouvrez le **Gestionnaire de fichiers** (ou utilisez FileZilla en FTP)
2. Envoyez **TOUT le contenu** de ce dossier dans le répertoire `htdocs/` (ou `www/`)
3. Vérifiez que le fichier `.htaccess` est bien transféré (fichier caché)

### 4. Installer la base de données
1. Visitez : `https://votredomaine.com/install.php`
2. Le script crée toutes les tables + le compte Super Admin
3. **⚠️ IMPORTANT : supprimez ensuite `install.php` de votre hébergement !**

### 5. C'est prêt ! 🎉
- Site public : `https://votredomaine.com`
- Administration : `https://votredomaine.com/admin/login.php`
  - Email : `superadmin@kapuce.com`
  - Mot de passe : `SuperAdminPassword123!`
  - **⚠️ Changez ce mot de passe dès la première connexion en créant un nouveau compte admin**

## 🗂️ Structure du projet
```
/
├── config.php              # Configuration (BDD, Cloudinary)
├── install.php             # Installation (à supprimer après usage)
├── index.php               # Page d'accueil
├── listings.php            # Liste des annonces + filtres
├── listing.php             # Détail annonce + demande de visite + paiement
├── login.php / register.php / logout.php
├── messages.php            # Messagerie sécurisée (anti-fraude)
├── pay.php                 # Paiement séquestre Mobile Money
├── api/messages.php        # API AJAX du chat
├── includes/               # Fonctions partagées (BDD, auth, anti-fraude, Cloudinary)
├── dashboard/              # Espace utilisateur/propriétaire
│   ├── index.php           # Tableau de bord
│   ├── create-listing.php  # Publier une annonce (5 photos + 1 vidéo max)
│   ├── my-listings.php     # Mes annonces
│   ├── visit-requests.php  # Demandes de visite reçues (propriétaire)
│   ├── my-visits.php       # Mes demandes de visite (client)
│   └── transactions.php    # Mes transactions
└── admin/                  # Panel administration
    ├── login.php           # Connexion admin
    ├── index.php           # Dashboard (stats, séquestre, commissions)
    ├── listings.php        # Modération des annonces
    ├── users.php           # Gestion utilisateurs (ban, commissions perso)
    ├── messages.php        # Supervision messages + alertes fraude
    ├── transactions.php    # Validation séquestre (verser/rembourser)
    └── settings.php        # Taux de commission (double commission)
```

## 🔐 Fonctionnalités clés
- **Anti-fraude** : numéros de téléphone, emails, WhatsApp, propositions de paiement externe → automatiquement masqués + alerte admin
- **Séquestre** : le client paie via KAPUCE.G (Airtel/Moov), l'admin valide, le propriétaire reçoit son montant moins commission
- **Double commission** : configurable dans Admin > Taux (+ taux personnalisé par propriétaire)
- **Flux de visite** : demande → acceptation propriétaire → conversation sécurisée → paiement
- **Médias** : 5 photos + 1 vidéo max par annonce (hébergés sur Cloudinary)

## ⚠️ Notes importantes
- Le paiement Mobile Money est actuellement **SIMULÉ** (en attente des accès API marchands Airtel Money / Moov Money). Dès que vous obtenez vos clés API marchandes, l'intégration réelle pourra remplacer la simulation dans `pay.php`.
- Les uploads passent par **Cloudinary** (clés déjà configurées dans `config.php`).
- Si l'upload de grosses vidéos échoue sur LWS, augmentez `upload_max_filesize` dans le panel LWS (PHP > Configuration).
