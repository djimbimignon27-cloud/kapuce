#!/usr/bin/env python3
"""
Test complémentaire de la messagerie anti-fraude
"""
import requests
import json

BASE_URL = "http://localhost:8080"

# Récupérer le conversation_id depuis la base
import subprocess
result = subprocess.run(
    ['mysql', '-u', 'root', 'kapuce', '-e', 
     'SELECT id FROM conversations ORDER BY created_at DESC LIMIT 1;'],
    capture_output=True, text=True
)
lines = result.stdout.strip().split('\n')
if len(lines) > 1:
    conv_id = lines[1].strip()
    print(f"✅ Conversation ID récupéré depuis la base: {conv_id[:16]}...")
else:
    print("❌ Aucune conversation trouvée")
    exit(1)

# Créer une session client (on va se connecter avec le client créé)
session = requests.Session()

# Récupérer l'email du client depuis la base
result = subprocess.run(
    ['mysql', '-u', 'root', 'kapuce', '-e', 
     "SELECT email FROM users WHERE role='USER' ORDER BY created_at DESC LIMIT 1;"],
    capture_output=True, text=True
)
lines = result.stdout.strip().split('\n')
if len(lines) > 1:
    client_email = lines[1].strip()
    print(f"✅ Email client: {client_email}")
else:
    print("❌ Aucun client trouvé")
    exit(1)

# Se connecter
import re
resp = session.get(f"{BASE_URL}/login.php")
csrf_match = re.search(r'name="csrf"\s+value="([a-f0-9]+)"', resp.text)
if not csrf_match:
    print("❌ CSRF token non trouvé")
    exit(1)

csrf = csrf_match.group(1)
data = {
    'csrf': csrf,
    'email': client_email,
    'password': 'TestPassword123!'
}

resp = session.post(f"{BASE_URL}/login.php", data=data, allow_redirects=False)
if resp.status_code == 302:
    print(f"✅ Connexion client réussie")
else:
    print(f"❌ Connexion échouée: {resp.status_code}")
    exit(1)

print("\n=== TEST MESSAGERIE ANTI-FRAUDE ===")

# Test 1: GET messages
resp = session.get(f"{BASE_URL}/api/messages.php?conversation_id={conv_id}")
if resp.status_code == 200:
    data = resp.json()
    if data.get('success'):
        print(f"✅ GET /api/messages.php - {len(data.get('messages', []))} messages récupérés")
    else:
        print(f"❌ GET /api/messages.php - Error: {data.get('error')}")
else:
    print(f"❌ GET /api/messages.php - Status: {resp.status_code}")

# Test 2: POST message normal (non filtré)
headers = {'Content-Type': 'application/json'}
payload = {
    'conversation_id': conv_id,
    'content': 'Bonjour, on peut se voir demain pour la visite ?'
}

resp = session.post(f"{BASE_URL}/api/messages.php", json=payload, headers=headers)
if resp.status_code == 200:
    data = resp.json()
    if data.get('success') and not data.get('message', {}).get('is_filtered'):
        print(f"✅ POST message normal (non filtré) - Message envoyé sans filtrage")
    else:
        print(f"❌ POST message normal - Filtré: {data.get('message', {}).get('is_filtered')}")
else:
    print(f"❌ POST message normal - Status: {resp.status_code}")

# Test 3: POST message avec numéro de téléphone (doit être filtré)
payload = {
    'conversation_id': conv_id,
    'content': 'Appelez-moi au 077 12 34 56 pour plus de détails'
}

resp = session.post(f"{BASE_URL}/api/messages.php", json=payload, headers=headers)
if resp.status_code == 200:
    data = resp.json()
    msg = data.get('message', {})
    if msg.get('is_filtered') and '[NUMÉRO MASQUÉ]' in msg.get('content', ''):
        print(f"✅ POST message avec téléphone (filtré) - Contenu masqué: {msg.get('content')[:60]}...")
        print(f"   Warning: {data.get('warning', 'N/A')[:80]}...")
    else:
        print(f"❌ POST message avec téléphone - is_filtered: {msg.get('is_filtered')}, content: {msg.get('content')[:50]}")
else:
    print(f"❌ POST message avec téléphone - Status: {resp.status_code}")

# Test 4: POST message avec email (doit être filtré)
payload = {
    'conversation_id': conv_id,
    'content': 'Mon email c\'est test@gmail.com, contactez-moi'
}

resp = session.post(f"{BASE_URL}/api/messages.php", json=payload, headers=headers)
if resp.status_code == 200:
    data = resp.json()
    msg = data.get('message', {})
    if msg.get('is_filtered') and '[EMAIL MASQUÉ]' in msg.get('content', ''):
        print(f"✅ POST message avec email (filtré) - Contenu masqué: {msg.get('content')[:60]}...")
        print(f"   Warning: {data.get('warning', 'N/A')[:80]}...")
    else:
        print(f"❌ POST message avec email - is_filtered: {msg.get('is_filtered')}")
else:
    print(f"❌ POST message avec email - Status: {resp.status_code}")

# Vérifier les alertes fraude créées
result = subprocess.run(
    ['mysql', '-u', 'root', 'kapuce', '-e', 
     "SELECT COUNT(*) as count FROM fraud_alerts;"],
    capture_output=True, text=True
)
lines = result.stdout.strip().split('\n')
if len(lines) > 1:
    count = lines[1].strip()
    print(f"\n✅ Alertes fraude créées en base: {count}")

# Vérifier le fraud_alert_count de l'utilisateur
result = subprocess.run(
    ['mysql', '-u', 'root', 'kapuce', '-e', 
     f"SELECT fraud_alert_count, fraud_risk_level FROM users WHERE email='{client_email}';"],
    capture_output=True, text=True
)
lines = result.stdout.strip().split('\n')
if len(lines) > 1:
    parts = lines[1].strip().split('\t')
    if len(parts) >= 2:
        print(f"✅ Utilisateur - fraud_alert_count: {parts[0]}, fraud_risk_level: {parts[1]}")

print("\n=== TESTS MESSAGERIE TERMINÉS ===")
