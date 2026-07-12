<?php
require_once __DIR__ . '/../includes/auth.php';
$user = require_login();

$error = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    check_csrf();
    if (($_POST['form'] ?? '') === 'profile') {
        $fullName = trim($_POST['full_name'] ?? '');
        $phone = trim($_POST['phone'] ?? '');
        $city = trim($_POST['city'] ?? '');
        $address = trim($_POST['address'] ?? '');
        $bio = trim($_POST['bio'] ?? '');
        if (mb_strlen($fullName) < 3) $error = 'Nom complet invalide.';
        elseif (mb_strlen($phone) < 8) $error = 'Téléphone invalide.';
        else {
            db()->prepare('UPDATE users SET full_name = ?, phone = ?, city = ?, address = ?, bio = ? WHERE id = ?')
                ->execute([$fullName, $phone, $city ?: null, $address ?: null, $bio ?: null, $user['id']]);
            flash('✅ Profil mis à jour avec succès.');
            redirect('/dashboard/profile.php');
        }
    } elseif (($_POST['form'] ?? '') === 'password') {
        $current = $_POST['current_password'] ?? '';
        $new = $_POST['new_password'] ?? '';
        $confirm = $_POST['confirm_password'] ?? '';
        if (!password_verify($current, $user['password_hash'])) $error = 'Mot de passe actuel incorrect.';
        elseif (mb_strlen($new) < 8) $error = 'Le nouveau mot de passe doit contenir au moins 8 caractères.';
        elseif ($new !== $confirm) $error = 'Les mots de passe ne correspondent pas.';
        else {
            db()->prepare('UPDATE users SET password_hash = ? WHERE id = ?')->execute([password_hash($new, PASSWORD_BCRYPT), $user['id']]);
            flash('🔒 Mot de passe modifié avec succès.');
            redirect('/dashboard/profile.php');
        }
    }
}

$rating = user_rating($user['id']);
$cities = ['', 'Libreville', 'Port-Gentil', 'Franceville', 'Oyem', 'Moanda', 'Mouila', 'Lambaréné', 'Tchibanga', 'Koulamoutou', 'Makokou', 'Akanda', 'Owendo', 'Ntoum'];
$pageTitle = 'Mon profil';
require_once __DIR__ . '/../includes/header.php';
// Recharger après header (current_user statique)
$stmt = db()->prepare('SELECT * FROM users WHERE id = ?');
$stmt->execute([$user['id']]);
$user = $stmt->fetch();
?>
<div class="container mx-auto max-w-4xl px-4 py-8">
    <a href="/dashboard/index.php" class="inline-flex items-center text-gray-600 hover:text-kama-blue mb-6 font-medium">← Retour au tableau de bord</a>

    <!-- En-tête profil -->
    <div class="bg-gradient-to-r from-kama-blue via-blue-700 to-kama-blue rounded-3xl p-8 text-white mb-8 relative overflow-hidden">
        <div class="absolute top-0 right-0 w-64 h-64 bg-kama-gold/20 rounded-full filter blur-3xl"></div>
        <div class="relative flex items-center gap-5">
            <div class="w-20 h-20 bg-gradient-to-br from-kama-gold to-yellow-600 rounded-2xl flex items-center justify-center text-3xl font-black shadow-lg"><?= h(mb_strtoupper(mb_substr($user['full_name'], 0, 1))) ?></div>
            <div>
                <h1 class="text-3xl font-black"><?= h($user['full_name']) ?></h1>
                <p class="text-blue-200"><?= h($user['role']) ?> • Membre depuis <?= date('m/Y', strtotime($user['created_at'])) ?></p>
                <?php if ($rating['count'] > 0): ?><div class="mt-1"><?= stars_html($rating['avg']) ?> <span class="text-sm text-blue-100"><?= $rating['avg'] ?>/5 (<?= $rating['count'] ?> avis)</span></div><?php endif; ?>
            </div>
        </div>
    </div>

    <?php if ($error): ?><div class="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-6"><?= h($error) ?></div><?php endif; ?>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Informations personnelles -->
        <div class="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <h2 class="font-bold text-lg text-gray-900 mb-5">👤 Informations personnelles</h2>
            <form method="post" class="space-y-4">
                <input type="hidden" name="csrf" value="<?= csrf_token() ?>">
                <input type="hidden" name="form" value="profile">
                <div>
                    <label class="block text-sm font-semibold text-gray-700 mb-1">Email (non modifiable)</label>
                    <input type="email" value="<?= h($user['email']) ?>" disabled class="w-full h-11 border border-gray-200 rounded-xl px-4 bg-gray-50 text-gray-400">
                </div>
                <div>
                    <label class="block text-sm font-semibold text-gray-700 mb-1">Nom complet</label>
                    <input type="text" name="full_name" required value="<?= h($user['full_name']) ?>" placeholder="Votre nom complet" class="w-full h-11 border border-gray-200 rounded-xl px-4 focus:border-kama-blue focus:ring-2 focus:ring-kama-blue/20">
                </div>
                <div>
                    <label class="block text-sm font-semibold text-gray-700 mb-1">Téléphone (privé, jamais affiché)</label>
                    <input type="tel" name="phone" required value="<?= h($user['phone']) ?>" placeholder="+241 XX XX XX XX" class="w-full h-11 border border-gray-200 rounded-xl px-4 focus:border-kama-blue focus:ring-2 focus:ring-kama-blue/20">
                </div>
                <div>
                    <label class="block text-sm font-semibold text-gray-700 mb-1">Ville</label>
                    <select name="city" class="w-full h-11 border border-gray-200 rounded-xl px-4">
                        <?php foreach ($cities as $c): ?><option value="<?= $c ?>" <?= ($user['city'] ?? '') === $c ? 'selected' : '' ?>><?= $c ?: '-- Choisir --' ?></option><?php endforeach; ?>
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-semibold text-gray-700 mb-1">Adresse</label>
                    <input type="text" name="address" value="<?= h($user['address'] ?? '') ?>" placeholder="Votre adresse complète" class="w-full h-11 border border-gray-200 rounded-xl px-4">
                </div>
                <div>
                    <label class="block text-sm font-semibold text-gray-700 mb-1">À propos de moi</label>
                    <textarea name="bio" rows="3" maxlength="500" placeholder="Présentez-vous en quelques mots..." class="w-full border border-gray-200 rounded-xl px-4 py-3"><?= h($user['bio'] ?? '') ?></textarea>
                </div>
                <button class="w-full h-12 bg-gradient-to-r from-kama-blue to-blue-600 hover:shadow-lg text-white rounded-xl font-bold transition-all">Enregistrer le profil</button>
            </form>
        </div>

        <!-- Sécurité -->
        <div class="space-y-6">
            <div class="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <h2 class="font-bold text-lg text-gray-900 mb-5">🔒 Changer le mot de passe</h2>
                <form method="post" class="space-y-4">
                    <input type="hidden" name="csrf" value="<?= csrf_token() ?>">
                    <input type="hidden" name="form" value="password">
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-1">Mot de passe actuel</label>
                        <input type="password" name="current_password" required class="w-full h-11 border border-gray-200 rounded-xl px-4">
                    </div>
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-1">Nouveau mot de passe (8 min.)</label>
                        <input type="password" name="new_password" required minlength="8" class="w-full h-11 border border-gray-200 rounded-xl px-4">
                    </div>
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-1">Confirmer le nouveau mot de passe</label>
                        <input type="password" name="confirm_password" required minlength="8" class="w-full h-11 border border-gray-200 rounded-xl px-4">
                    </div>
                    <button class="w-full h-12 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-bold transition-all">Modifier le mot de passe</button>
                </form>
            </div>
            <div class="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <h2 class="font-bold text-lg text-gray-900 mb-3">⚙️ Préférences</h2>
                <p class="text-sm text-gray-500 mb-4">Gérez vos préférences de notifications.</p>
                <a href="/dashboard/settings.php" class="inline-flex items-center bg-slate-100 hover:bg-slate-200 text-gray-700 px-5 py-2.5 rounded-xl font-semibold text-sm transition">Ouvrir les paramètres →</a>
            </div>
        </div>
    </div>
</div>
<?php require_once __DIR__ . '/../includes/footer.php'; ?>
