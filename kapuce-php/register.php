<?php
require_once __DIR__ . '/includes/auth.php';

if (is_logged_in()) redirect('/dashboard/index.php');

$error = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    check_csrf();
    $fullName = trim($_POST['full_name'] ?? '');
    $email = mb_strtolower(trim($_POST['email'] ?? ''));
    $phone = trim($_POST['phone'] ?? '');
    $password = $_POST['password'] ?? '';
    $role = in_array($_POST['role'] ?? '', ['USER', 'OWNER', 'AGENCY']) ? $_POST['role'] : 'USER';

    if (mb_strlen($fullName) < 3) $error = 'Veuillez saisir votre nom complet.';
    elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) $error = 'Email invalide.';
    elseif (mb_strlen($phone) < 8) $error = 'Numéro de téléphone invalide.';
    elseif (mb_strlen($password) < 8) $error = 'Le mot de passe doit contenir au moins 8 caractères.';
    else {
        $stmt = db()->prepare('SELECT COUNT(*) FROM users WHERE email = ?');
        $stmt->execute([$email]);
        if ($stmt->fetchColumn()) {
            $error = 'Un compte existe déjà avec cet email.';
        } else {
            $id = uuid();
            db()->prepare('INSERT INTO users (id, full_name, email, phone, password_hash, role) VALUES (?, ?, ?, ?, ?, ?)')
                ->execute([$id, $fullName, $email, $phone, password_hash($password, PASSWORD_BCRYPT), $role]);
            $_SESSION['user_id'] = $id;
            flash('Bienvenue sur KAPUCE.G, ' . $fullName . ' ! Votre compte a été créé.');
            redirect('/dashboard/index.php');
        }
    }
}
$pageTitle = 'Inscription';
require_once __DIR__ . '/includes/header.php';
?>
<div class="max-w-md mx-auto px-4 py-12">
    <div class="bg-white rounded-xl border border-gray-200 p-8">
        <h1 class="text-2xl font-extrabold text-gray-900 mb-1">Créer un compte</h1>
        <p class="text-sm text-gray-500 mb-6">Rejoignez la plateforme de référence au Gabon</p>
        <?php if ($error): ?><div class="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4"><?= h($error) ?></div><?php endif; ?>
        <form method="post" class="space-y-4">
            <input type="hidden" name="csrf" value="<?= csrf_token() ?>">
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Je suis</label>
                <select name="role" class="w-full border border-gray-200 rounded-lg px-3 py-2.5">
                    <option value="USER">Client (je cherche un bien)</option>
                    <option value="OWNER">Propriétaire (je publie des annonces)</option>
                    <option value="AGENCY">Agence immobilière</option>
                </select>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Nom complet</label>
                <input type="text" name="full_name" required value="<?= h($_POST['full_name'] ?? '') ?>" class="w-full border border-gray-200 rounded-lg px-3 py-2.5">
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" name="email" required value="<?= h($_POST['email'] ?? '') ?>" class="w-full border border-gray-200 rounded-lg px-3 py-2.5">
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Téléphone (privé, jamais affiché)</label>
                <input type="tel" name="phone" required placeholder="+241 XX XX XX XX" value="<?= h($_POST['phone'] ?? '') ?>" class="w-full border border-gray-200 rounded-lg px-3 py-2.5">
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Mot de passe (8 caractères min.)</label>
                <input type="password" name="password" required minlength="8" class="w-full border border-gray-200 rounded-lg px-3 py-2.5">
            </div>
            <button class="w-full bg-brand-600 hover:bg-brand-700 text-white py-3 rounded-lg font-bold">Créer mon compte</button>
        </form>
        <p class="text-sm text-gray-500 text-center mt-5">Déjà inscrit ? <a href="/login.php" class="text-brand-600 font-semibold">Se connecter</a></p>
    </div>
</div>
<?php require_once __DIR__ . '/includes/footer.php'; ?>
