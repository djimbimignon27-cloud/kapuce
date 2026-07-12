<?php
require_once __DIR__ . '/../includes/auth.php';
$user = require_login();

$prefs = json_decode($user['notification_prefs'] ?? '', true) ?: [
    'email_notifications' => true,
    'sms_notifications' => false,
    'listing_updates' => true,
    'message_alerts' => true,
    'transaction_alerts' => true,
];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    check_csrf();
    $prefs = [
        'email_notifications' => isset($_POST['email_notifications']),
        'sms_notifications' => isset($_POST['sms_notifications']),
        'listing_updates' => isset($_POST['listing_updates']),
        'message_alerts' => isset($_POST['message_alerts']),
        'transaction_alerts' => isset($_POST['transaction_alerts']),
    ];
    db()->prepare('UPDATE users SET notification_prefs = ? WHERE id = ?')->execute([json_encode($prefs), $user['id']]);
    flash('✅ Vos préférences de notification ont été enregistrées.');
    redirect('/dashboard/settings.php');
}

$pageTitle = 'Paramètres';
require_once __DIR__ . '/../includes/header.php';

$options = [
    'email_notifications' => ['📧 Notifications par email', 'Recevoir les notifications importantes par email'],
    'sms_notifications' => ['📱 Notifications SMS', 'Recevoir des alertes par SMS (bientôt disponible)'],
    'listing_updates' => ['🏠 Mises à jour des annonces', 'Être notifié des validations et changements de statut de vos annonces'],
    'message_alerts' => ['💬 Alertes messagerie', 'Être notifié lors de la réception de nouveaux messages'],
    'transaction_alerts' => ['💰 Alertes transactions', 'Être notifié des paiements et validations de transactions'],
];
?>
<div class="container mx-auto max-w-2xl px-4 py-8">
    <a href="/dashboard/index.php" class="inline-flex items-center text-gray-600 hover:text-kama-blue mb-6 font-medium">← Retour au tableau de bord</a>
    <div class="mb-8">
        <h1 class="text-3xl font-black text-gray-900">⚙️ Paramètres</h1>
        <p class="text-gray-500">Gérez vos préférences de notifications</p>
    </div>

    <form method="post" class="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 space-y-1">
        <input type="hidden" name="csrf" value="<?= csrf_token() ?>">
        <?php foreach ($options as $key => [$label, $desc]): ?>
        <label class="flex items-center justify-between py-4 border-b border-gray-50 last:border-0 cursor-pointer group">
            <div class="pr-4">
                <div class="font-semibold text-gray-900"><?= $label ?></div>
                <div class="text-sm text-gray-500"><?= $desc ?></div>
            </div>
            <div class="relative flex-shrink-0">
                <input type="checkbox" name="<?= $key ?>" <?= !empty($prefs[$key]) ? 'checked' : '' ?> class="sr-only peer">
                <div class="w-12 h-7 bg-gray-200 peer-checked:bg-kama-blue rounded-full transition-colors"></div>
                <div class="absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow transition-transform peer-checked:translate-x-5"></div>
            </div>
        </label>
        <?php endforeach; ?>
        <div class="pt-4">
            <button class="w-full h-12 bg-gradient-to-r from-kama-blue to-blue-600 hover:shadow-lg text-white rounded-xl font-bold transition-all">Enregistrer les préférences</button>
        </div>
    </form>
</div>
<?php require_once __DIR__ . '/../includes/footer.php'; ?>
