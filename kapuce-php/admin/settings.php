<?php
$pageTitle = 'Taux de commission';
require_once __DIR__ . '/_header.php';

if ($admin['role'] !== 'SUPER_ADMIN' && $admin['role'] !== 'ADMIN_FINANCE') {
    flash('Accès réservé au Super Admin / Admin Finance.', 'error');
    redirect('/admin/index.php');
}

$pdo = db();
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    check_csrf();
    $client = max(0, min(50, (float)($_POST['commission_client'] ?? 7)));
    $owner = max(0, min(50, (float)($_POST['commission_owner'] ?? 7)));
    $pdo->prepare("UPDATE settings SET commission_client = ?, commission_owner = ?, updated_at = NOW(), updated_by = ? WHERE id = 'global'")
        ->execute([$client, $owner, $admin['id']]);
    flash('✅ Taux de commission mis à jour : Client ' . $client . '% / Propriétaire ' . $owner . '%');
    redirect('/admin/settings.php');
}
$settings = get_settings();
?>
<div class="max-w-2xl mx-auto px-4 py-8">
    <h1 class="text-2xl font-extrabold text-gray-900 mb-2">Taux de commission KAPUCE.G</h1>
    <p class="text-sm text-gray-500 mb-6">La double commission est prélevée sur chaque transaction : le client paie le montant + sa commission, le propriétaire reçoit le montant - sa commission.</p>

    <form method="post" class="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
        <input type="hidden" name="csrf" value="<?= csrf_token() ?>">
        <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Commission CLIENT (%) — ajoutée au montant payé</label>
            <input type="number" name="commission_client" step="0.5" min="0" max="50" value="<?= h($settings['commission_client']) ?>" class="w-full border border-gray-200 rounded-lg px-3 py-2.5">
        </div>
        <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Commission PROPRIÉTAIRE (%) — déduite du versement</label>
            <input type="number" name="commission_owner" step="0.5" min="0" max="50" value="<?= h($settings['commission_owner']) ?>" class="w-full border border-gray-200 rounded-lg px-3 py-2.5">
        </div>
        <div class="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
            <strong>Exemple avec un bien à 1 000 000 FCFA :</strong><br>
            Client paie : 1 000 000 + <?= h($settings['commission_client']) ?>% = <?= format_price(1000000 * (1 + $settings['commission_client'] / 100)) ?><br>
            Propriétaire reçoit : 1 000 000 - <?= h($settings['commission_owner']) ?>% = <?= format_price(1000000 * (1 - $settings['commission_owner'] / 100)) ?><br>
            <strong class="text-blue-700">KAPUCE.G gagne : <?= format_price(1000000 * ($settings['commission_client'] + $settings['commission_owner']) / 100) ?></strong>
        </div>
        <button class="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-bold">Enregistrer les taux</button>
    </form>
    <p class="text-xs text-gray-400 mt-3">💡 Vous pouvez aussi définir une commission personnalisée par propriétaire dans la page Utilisateurs.</p>
</div>
</body></html>
