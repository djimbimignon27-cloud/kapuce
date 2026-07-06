<?php
/**
 * KAPUCE.G - Script d'installation
 * =================================
 * 1. Configurez d'abord config.php avec vos identifiants MySQL LWS
 * 2. Visitez cette page UNE SEULE FOIS : https://votredomaine.com/install.php
 * 3. Supprimez ensuite ce fichier de votre hébergement par sécurité
 */
require_once __DIR__ . '/config.php';

try {
    // Connexion sans base pour la créer si besoin (en local). Sur LWS, la base existe déjà.
    try {
        $pdo = new PDO('mysql:host=' . DB_HOST . ';charset=utf8mb4', DB_USER, DB_PASS, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
        $pdo->exec('CREATE DATABASE IF NOT EXISTS `' . DB_NAME . '` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
    } catch (PDOException $e) {
        // Sur LWS on ne peut pas créer de base : on continue, elle existe déjà.
    }

    $pdo = new PDO('mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4', DB_USER, DB_PASS, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);

    $pdo->exec("CREATE TABLE IF NOT EXISTS users (
        id CHAR(36) PRIMARY KEY,
        full_name VARCHAR(150) NOT NULL,
        email VARCHAR(190) NOT NULL UNIQUE,
        phone VARCHAR(30) NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(20) NOT NULL DEFAULT 'USER',
        is_banned TINYINT(1) DEFAULT 0,
        ban_reason TEXT NULL,
        banned_at DATETIME NULL,
        fraud_risk_level VARCHAR(10) DEFAULT 'NONE',
        fraud_alert_count INT DEFAULT 0,
        last_fraud_alert_at DATETIME NULL,
        custom_commission_rate DECIMAL(5,2) NULL,
        transactions_count INT DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_role (role)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

    $pdo->exec("CREATE TABLE IF NOT EXISTS listings (
        id CHAR(36) PRIMARY KEY,
        owner_id CHAR(36) NOT NULL,
        title VARCHAR(200) NOT NULL,
        description TEXT NOT NULL,
        price BIGINT NOT NULL,
        type VARCHAR(10) NOT NULL,
        sub_category VARCHAR(30) NOT NULL,
        category VARCHAR(10) NOT NULL,
        city VARCHAR(80) NOT NULL,
        address VARCHAR(255) NOT NULL,
        neighborhood VARCHAR(120) NULL,
        details TEXT NULL,
        images TEXT NULL,
        video_url VARCHAR(500) NULL,
        status VARCHAR(15) DEFAULT 'PENDING',
        verified TINYINT(1) DEFAULT 0,
        featured TINYINT(1) DEFAULT 0,
        views_count INT DEFAULT 0,
        rejection_reason TEXT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        published_at DATETIME NULL,
        sold_at DATETIME NULL,
        INDEX idx_search (type, category, city, status),
        INDEX idx_owner (owner_id),
        INDEX idx_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

    $pdo->exec("CREATE TABLE IF NOT EXISTS visit_requests (
        id CHAR(36) PRIMARY KEY,
        listing_id CHAR(36) NOT NULL,
        requester_id CHAR(36) NOT NULL,
        owner_id CHAR(36) NOT NULL,
        status VARCHAR(10) DEFAULT 'PENDING',
        message TEXT NULL,
        proposed_date DATETIME NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        accepted_at DATETIME NULL,
        rejected_at DATETIME NULL,
        completed_at DATETIME NULL,
        INDEX idx_owner (owner_id, status),
        INDEX idx_requester (requester_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

    $pdo->exec("CREATE TABLE IF NOT EXISTS conversations (
        id CHAR(36) PRIMARY KEY,
        participant1_id CHAR(36) NOT NULL,
        participant2_id CHAR(36) NOT NULL,
        listing_id CHAR(36) NULL,
        listing_title VARCHAR(200) NULL,
        last_message VARCHAR(200) NULL,
        last_sender_id CHAR(36) NULL,
        is_active TINYINT(1) DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_p1 (participant1_id),
        INDEX idx_p2 (participant2_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

    $pdo->exec("CREATE TABLE IF NOT EXISTS messages (
        id CHAR(36) PRIMARY KEY,
        conversation_id CHAR(36) NOT NULL,
        sender_id VARCHAR(36) NOT NULL,
        receiver_id VARCHAR(36) NOT NULL,
        content TEXT NOT NULL,
        original_content TEXT NULL,
        is_filtered TINYINT(1) DEFAULT 0,
        filter_reason VARCHAR(30) NULL,
        is_system TINYINT(1) DEFAULT 0,
        read_at DATETIME NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_conv (conversation_id, created_at),
        INDEX idx_receiver (receiver_id, read_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

    $pdo->exec("CREATE TABLE IF NOT EXISTS transactions (
        id CHAR(36) PRIMARY KEY,
        listing_id CHAR(36) NOT NULL,
        buyer_id CHAR(36) NOT NULL,
        seller_id CHAR(36) NOT NULL,
        amount BIGINT NOT NULL,
        commission_rate_client DECIMAL(5,2) NOT NULL,
        commission_rate_owner DECIMAL(5,2) NOT NULL,
        commission_client BIGINT NOT NULL,
        commission_owner BIGINT NOT NULL,
        total_paid_by_buyer BIGINT NOT NULL,
        seller_receives BIGINT NOT NULL,
        status VARCHAR(20) DEFAULT 'PENDING_PAYMENT',
        payment_method VARCHAR(20) NULL,
        payment_phone VARCHAR(30) NULL,
        payment_reference VARCHAR(60) NULL,
        transaction_type VARCHAR(10) DEFAULT 'SALE',
        notes TEXT NULL,
        admin_notes TEXT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        paid_at DATETIME NULL,
        completed_at DATETIME NULL,
        INDEX idx_buyer (buyer_id, status),
        INDEX idx_seller (seller_id, status),
        INDEX idx_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

    $pdo->exec("CREATE TABLE IF NOT EXISTS fraud_alerts (
        id CHAR(36) PRIMARY KEY,
        user_id CHAR(36) NOT NULL,
        message_id CHAR(36) NULL,
        conversation_id CHAR(36) NULL,
        alert_type VARCHAR(30) NOT NULL,
        severity VARCHAR(10) DEFAULT 'LOW',
        detected_content TEXT NULL,
        status VARCHAR(15) DEFAULT 'NEW',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_user (user_id),
        INDEX idx_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

    $pdo->exec("CREATE TABLE IF NOT EXISTS settings (
        id VARCHAR(30) PRIMARY KEY,
        commission_client DECIMAL(5,2) DEFAULT 7,
        commission_owner DECIMAL(5,2) DEFAULT 7,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_by CHAR(36) NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

    $pdo->exec("CREATE TABLE IF NOT EXISTS favorites (
        id CHAR(36) PRIMARY KEY,
        user_id CHAR(36) NOT NULL,
        listing_id CHAR(36) NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uniq_fav (user_id, listing_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

    $pdo->exec("CREATE TABLE IF NOT EXISTS reviews (
        id CHAR(36) PRIMARY KEY,
        transaction_id CHAR(36) NOT NULL,
        listing_id CHAR(36) NOT NULL,
        reviewer_id CHAR(36) NOT NULL,
        reviewed_id CHAR(36) NOT NULL,
        rating TINYINT NOT NULL,
        comment TEXT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uniq_review (transaction_id, reviewer_id),
        INDEX idx_reviewed (reviewed_id),
        INDEX idx_listing (listing_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

    // Seed settings
    $exists = $pdo->query("SELECT COUNT(*) FROM settings WHERE id = 'global'")->fetchColumn();
    if (!$exists) {
        $pdo->prepare("INSERT INTO settings (id, commission_client, commission_owner) VALUES ('global', ?, ?)")
            ->execute([DEFAULT_COMMISSION_CLIENT, DEFAULT_COMMISSION_OWNER]);
    }

    // Seed super admin (idempotent)
    $adminEmail = 'superadmin@kapuce.com';
    $exists = $pdo->prepare('SELECT COUNT(*) FROM users WHERE email = ?');
    $exists->execute([$adminEmail]);
    if (!$exists->fetchColumn()) {
        $id = sprintf('%s%s-%s-%s-%s-%s%s%s', ...str_split(bin2hex(random_bytes(16)), 4));
        $hash = password_hash('SuperAdminPassword123!', PASSWORD_BCRYPT);
        $pdo->prepare("INSERT INTO users (id, full_name, email, phone, password_hash, role) VALUES (?, 'Super Admin', ?, '+24100000000', ?, 'SUPER_ADMIN')")
            ->execute([$id, $adminEmail, $hash]);
    }

    echo '<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><title>Installation KAPUCE.G</title><script src="https://cdn.tailwindcss.com"></script></head><body class="bg-gray-50 flex items-center justify-center min-h-screen">';
    echo '<div class="bg-white rounded-xl shadow p-8 max-w-md text-center">';
    echo '<div class="text-5xl mb-4">✅</div>';
    echo '<h1 class="text-2xl font-bold text-gray-900 mb-2">Installation réussie !</h1>';
    echo '<p class="text-gray-600 mb-4">La base de données KAPUCE.G a été initialisée avec succès.</p>';
    echo '<div class="bg-gray-50 rounded-lg p-4 text-left text-sm mb-4"><strong>Compte Super Admin :</strong><br>Email : superadmin@kapuce.com<br>Mot de passe : SuperAdminPassword123!</div>';
    echo '<p class="text-red-600 text-sm font-semibold mb-4">⚠️ IMPORTANT : Supprimez maintenant le fichier install.php de votre hébergement !</p>';
    echo '<a href="/index.php" class="inline-block bg-green-600 text-white px-6 py-2 rounded-lg font-semibold">Accéder au site</a>';
    echo '</div></body></html>';
} catch (PDOException $e) {
    echo '<h1>Erreur d\'installation</h1><p>' . htmlspecialchars($e->getMessage()) . '</p><p>Vérifiez vos identifiants MySQL dans config.php</p>';
}
