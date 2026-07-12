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
    <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h1 class="text-2xl font-extrabold text-gray-900">💬 Messagerie sécurisée</h1>
        <?php if (!is_admin($user)): ?>
        <a href="/contact-support.php" class="inline-flex items-center gap-2 bg-gradient-to-r from-kama-gold to-yellow-600 hover:shadow-lg hover:shadow-kama-gold/30 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-all">
            🛟 Contacter KAPUCE.G
        </a>
        <?php endif; ?>
    </div>
    <div class="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800 mb-4">
        🛡️ <strong>Protection anti-fraude active</strong> : les numéros de téléphone, emails et références à des paiements externes sont automatiquement masqués. Toute transaction doit passer par KAPUCE.G. 📷 Après un paiement Mobile Money, envoyez la <strong>capture d'écran de la transaction</strong> à KAPUCE.G via cette messagerie.
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
            <div id="imgPreview" class="hidden px-3 py-2 border-t border-gray-100 bg-slate-50 flex items-center justify-between text-xs text-gray-600">
                <span>📷 Image sélectionnée : <strong id="imgName"></strong></span>
                <button type="button" onclick="clearImage()" class="text-red-500 font-bold hover:underline">Retirer</button>
            </div>
            <form id="sendForm" class="p-3 border-t border-gray-200 flex gap-2 items-center">
                <label class="cursor-pointer text-gray-400 hover:text-kama-blue p-2 transition" title="Joindre une image (ex: capture d'écran de paiement)">
                    <input type="file" id="imgInput" accept="image/*" class="hidden" onchange="imageSelected()">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"/></svg>
                </label>
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
        const image = m.image_url ? `<a href="${m.image_url}" target="_blank" class="block mb-1"><img src="${m.image_url}" class="rounded-xl max-h-52 max-w-full border ${mine ? 'border-white/30' : 'border-gray-200'}" alt="Image"/></a>` : '';
        return `<div class="flex ${mine ? 'justify-end' : 'justify-start'}">
            <div class="max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${mine ? 'bg-brand-600 text-white rounded-br-sm' : 'bg-white border border-gray-200 text-gray-800 rounded-bl-sm'}">
                ${image}${m.content ? esc(m.content) : ''}${filtered}
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

function imageSelected() {
    const input = document.getElementById('imgInput');
    if (input.files.length) {
        document.getElementById('imgName').textContent = input.files[0].name;
        document.getElementById('imgPreview').classList.remove('hidden');
    }
}
function clearImage() {
    document.getElementById('imgInput').value = '';
    document.getElementById('imgPreview').classList.add('hidden');
}

document.getElementById('sendForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const input = document.getElementById('msgInput');
    const imgInput = document.getElementById('imgInput');
    const content = input.value.trim();
    const hasImage = imgInput.files.length > 0;
    if (!content && !hasImage) return;

    try {
        let r;
        if (hasImage) {
            const fd = new FormData();
            fd.append('conversation_id', CONV_ID);
            fd.append('content', content);
            fd.append('image', imgInput.files[0]);
            r = await fetch('/api/messages.php', { method: 'POST', body: fd });
        } else {
            r = await fetch('/api/messages.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ conversation_id: CONV_ID, content })
            });
        }
        const data = await r.json();
        if (data.success) {
            input.value = '';
            clearImage();
        } else if (data.error) {
            alert(data.error);
        }
        await load();
    } catch (e) { console.error(e); }
});

load();
setInterval(load, 4000);
</script>
<?php endif; ?>
<?php require_once __DIR__ . '/includes/footer.php'; ?>
