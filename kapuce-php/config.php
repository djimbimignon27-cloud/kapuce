<?php
/**
 * KAPUCE.G - Configuration
 * ============================================
 * SUR LWS : Modifiez les 4 lignes DB_* ci-dessous avec les informations
 * de votre base MySQL LWS (visibles dans votre panel LWS > MySQL & PhpMyAdmin)
 * ============================================
 */

// --- Base de données MySQL ---
define('DB_HOST', 'localhost');       // LWS : généralement 'localhost' ou 'mysql-votrecompte.lws-hosting.com'
define('DB_NAME', 'kapuce');          // LWS : le nom de votre base (ex: votrecompte_kapuce)
define('DB_USER', 'root');            // LWS : votre utilisateur MySQL
define('DB_PASS', '');                // LWS : votre mot de passe MySQL

// --- Cloudinary (upload photos/vidéos) ---
define('CLOUDINARY_CLOUD_NAME', 'dfwkn9hks');
define('CLOUDINARY_API_KEY', '775926854653575');
define('CLOUDINARY_API_SECRET', '42smXbPlNun1n4JgkHK_TpsX_MM');

// --- Site ---
define('SITE_NAME', 'KAPUCE.G');
define('CONTACT_AIRTEL', '077347262');   // Numéro Airtel Money officiel KAPUCE.G
define('CONTACT_MOOV', '065216069');     // Numéro Moov Money officiel KAPUCE.G
define('DEFAULT_COMMISSION_CLIENT', 7);  // % commission client
define('DEFAULT_COMMISSION_OWNER', 7);   // % commission propriétaire
define('MAX_PHOTOS', 5);
define('MAX_VIDEOS', 1);

// --- Sessions ---
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
date_default_timezone_set('Africa/Libreville');
mb_internal_encoding('UTF-8');
