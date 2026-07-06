<?php
require_once __DIR__ . '/includes/auth.php';
$user = require_login();

$pdo = db();

// Liste des conversations
$stmt = $pdo->prepare('SELECT c.*,
    CASE WHEN c.participant1_id = ? THEN c.participant2_id ELSE c.participant1_id END AS other_id
    FROM conversations c WHERE c.participant1_id = ? OR c.participant2_id = ? ORDER BY c.updated_at DESC');
$stmt->execute([$user['id'], $user['id'], $user['id']]);
$conversations = $stmt->fetchAll();

// Noms des interlocuteurs + non-lus
foreach ($conversations as &$c) {
    $s = $pdo->prepare('SELECT full_name FROM users WHERE id = ?');
    $s->execute([$c['other_id']]);
    $c['other_name'] = $s->fetchColumn() ?: 'Utilisateur';
    $s = $pdo->prepare('SELECT COUNT(*) FROM messages WHERE conversation_id = ? AND receiver_id = ? AND read_at IS NULL AND is_system = 0');
    $s->execute([$c['id'], $user['id']]);
    $c['unread'] = (int)$s->fetchColumn();
}
unset($c);

$activeConvId = $_GET['c'] ?? ($conversations[0]['id'] ?? null);
$activeConv = null;
foreach ($conversations as $c) {
    if ($c['id'] === $activeConvId) { $activeConv = $c; break; }
}

$pageTitle = 'Messagerie';
require_once __DIR__ . '/includes/header.php';
?>
<div class="max-w-7xl mx-auto px-4 py-6">
    <h1 class="text-2xl font-extrabold text-gray-900 mb-4">💬 Messagerie sécurisée</h1>
    <div class="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800 mb-4">
        🛡️ <strong>Protection anti-fraude active</strong> : les numéros de téléphone, emails et références à des paiements externes sont automatiquement masqués. Toute transaction doit passer par KAPUCE.G.
    </div>

    <div class="bg-white rounded-xl border border-gray-200 overflow-hidden grid grid-cols-1 md:grid-cols-3" style="height: 600px">
        <!-- Liste conversations -->
        <div class="border-r border-gray-200 overflow-y-auto <?= $activeConv ? 'hidden md:block' : '' ?>">
            <?php if (!$conversations): ?>
                <div class="p-8 text-center text-gray-400 text-sm">Aucune conversation.<br>Les conversations s'ouvrent automatiquement quand une visite est acceptée.</div>
            <?php endif; ?>
            <?php foreach ($conversations as $c): ?>
            <a href="/messages.php?c=<?= h($c['id']) ?>" class="block p-4 border-b border-gray-100 hover:bg-gray-50 <?= $activeConvId === $c['id'] ? 'bg-brand-50 border-l-4 border-l-brand-600' : '' ?>">
                <div class="flex justify-between items-start">
                    <div class="font-semibold text-gray-900 text-sm"><?= h($c['other_name']) ?></div>
                    <?php if ($c['unread']): ?><span class="bg-red-500 text-white text-xs font-bold rounded-full px-2 py-0.5"><?= $c['unread'] ?></span><?php endif; ?>
                </div>
                <?php if ($c['listing_title']): ?><div class="text-xs text-brand-600 truncate">📌 <?= h($c['listing_title']) ?></div><?php endif; ?>
                <div class="text-xs text-gray-400 truncate mt-0.5"><?= h($c['last_message'] ?? '') ?></div>
            </a>
            <?php endforeach; ?>
        </div>

        <!-- Zone de chat -->
        <div class="md:col-span-2 flex flex-col <?= !$activeConv ? 'hidden md:flex' : '' ?>">
            <?php if (!$activeConv): ?>
                <div class="flex-1 flex items-center justify-center text-gray-400">Sélectionnez une conversation</div>
            <?php else: ?>
            <div class="p-4 border-b border-gray-200 flex items-center gap-3">
                <a href="/messages.php" class="md:hidden text-gray-500">←</a>
                <div class="w-9 h-9 bg-brand-100 text-brand-700 rounded-full flex items-center justify-center font-bold"><?= h(mb_strtoupper(mb_substr($activeConv['other_name'], 0, 1))) ?></div>
                <div>
                    <div class="font-bold text-sm"><?= h($activeConv['other_name']) ?></div>
                    <?php if ($activeConv['listing_title']): ?><div class="text-xs text-gray-400"><?= h($activeConv['listing_title']) ?></div><?php endif; ?>
                </div>
            </div>
            <div id="chatBox" class="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50"></div>
            <form id="sendForm" class="p-3 border-t border-gray-200 flex gap-2">
                <input type="text" id="msgInput" placeholder="Écrivez votre message..." autocomplete="off" class="flex-1 border border-gray-200 rounded-lg px-4 py-2.5 text-sm">
                <button class="bg-brand-600 hover:bg-brand-700 text-white px-6 py-2.5 rounded-lg font-bold text-sm">Envoyer</button>
            </form>
            <?php endif; ?>
        </div>
    </div>
</div>

<?php if ($activeConv): ?>
<script>
const CONV_ID = <?= json_encode($activeConv['id']) ?>;
const MY_ID = <?= json_encode($user['id']) ?>;
const chatBox = document.getElementById('chatBox');

function esc(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

function render(messages) {
    chatBox.innerHTML = messages.map(m => {
        if (m.is_system == 1) {
            return `<div class="text-center"><span class="inline-block bg-amber-100 text-amber-800 text-xs px-3 py-2 rounded-lg max-w-md">${esc(m.content)}</span></div>`;
        }
        const mine = m.sender_id === MY_ID;
        const filtered = m.is_filtered == 1 ? `<div class="text-[10px] mt-1 ${mine ? 'text-green-200' : 'text-red-500'}">⚠️ Contenu filtré par l'anti-fraude</div>` : '';
        return `<div class="flex ${mine ? 'justify-end' : 'justify-start'}">
            <div class="max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${mine ? 'bg-brand-600 text-white rounded-br-sm' : 'bg-white border border-gray-200 text-gray-800 rounded-bl-sm'}">
                ${esc(m.content)}${filtered}
                <div class="text-[10px] mt-1 ${mine ? 'text-green-200' : 'text-gray-400'}">${m.time}</div>
            </div></div>`;
    }).join('');
    chatBox.scrollTop = chatBox.scrollHeight;
}

async function load() {
    try {
        const r = await fetch('/api/messages.php?conversation_id=' + encodeURIComponent(CONV_ID));
        const data = await r.json();
        if (data.success) render(data.messages);
    } catch (e) { console.error(e); }
}

document.getElementById('sendForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const input = document.getElementById('msgInput');
    const content = input.value.trim();
    if (!content) return;
    input.value = '';
    try {
        const r = await fetch('/api/messages.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ conversation_id: CONV_ID, content })
        });
        const data = await r.json();
        if (data.warning) {
            // rien : le message d'avertissement système apparaît dans le fil
        }
        await load();
    } catch (e) { console.error(e); }
});

load();
setInterval(load, 4000);
</script>
<?php endif; ?>
<?php require_once __DIR__ . '/includes/footer.php'; ?>
