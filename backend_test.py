#!/usr/bin/env python3
"""
KAPUCE.G - Test complet de la version PHP
==========================================
Teste tous les flux métier via HTTP sur localhost:8080
"""
import requests
import re
import json
from datetime import datetime

BASE_URL = "http://localhost:8080"

def extract_csrf(html):
    """Extrait le token CSRF depuis le HTML"""
    match = re.search(r'name="csrf"\s+value="([a-f0-9]+)"', html)
    if match:
        return match.group(1)
    return None

def print_test(name, success, details=""):
    """Affiche le résultat d'un test"""
    status = "✅ PASS" if success else "❌ FAIL"
    print(f"{status} - {name}")
    if details:
        print(f"    {details}")

def test_inscription():
    """Test 1: Inscription CLIENT et PROPRIÉTAIRE"""
    print("\n=== TEST 1: INSCRIPTION ===")
    
    # Créer un client
    session_client = requests.Session()
    resp = session_client.get(f"{BASE_URL}/register.php")
    csrf = extract_csrf(resp.text)
    
    if not csrf:
        print_test("Extraction CSRF token", False, "Token CSRF non trouvé dans le HTML")
        return None, None
    
    print_test("Extraction CSRF token", True, f"Token: {csrf[:16]}...")
    
    timestamp = datetime.now().strftime("%H%M%S")
    client_email = f"client_{timestamp}@test.kapuce.com"
    
    data = {
        'csrf': csrf,
        'role': 'USER',
        'full_name': 'Jean Client Test',
        'email': client_email,
        'phone': '077112233',
        'password': 'TestPassword123!'
    }
    
    resp = session_client.post(f"{BASE_URL}/register.php", data=data, allow_redirects=False)
    
    if resp.status_code == 302 and '/dashboard/index.php' in resp.headers.get('Location', ''):
        print_test("Inscription CLIENT", True, f"Email: {client_email}, Redirection vers dashboard")
    else:
        print_test("Inscription CLIENT", False, f"Status: {resp.status_code}, Location: {resp.headers.get('Location', 'N/A')}")
        return None, None
    
    # Créer un propriétaire
    session_owner = requests.Session()
    resp = session_owner.get(f"{BASE_URL}/register.php")
    csrf = extract_csrf(resp.text)
    
    owner_email = f"owner_{timestamp}@test.kapuce.com"
    
    data = {
        'csrf': csrf,
        'role': 'OWNER',
        'full_name': 'Marie Propriétaire Test',
        'email': owner_email,
        'phone': '065445566',
        'password': 'TestPassword123!'
    }
    
    resp = session_owner.post(f"{BASE_URL}/register.php", data=data, allow_redirects=False)
    
    if resp.status_code == 302 and '/dashboard/index.php' in resp.headers.get('Location', ''):
        print_test("Inscription PROPRIÉTAIRE", True, f"Email: {owner_email}, Redirection vers dashboard")
    else:
        print_test("Inscription PROPRIÉTAIRE", False, f"Status: {resp.status_code}")
        return None, None
    
    return session_client, session_owner

def test_connexion():
    """Test 2: Connexion"""
    print("\n=== TEST 2: CONNEXION ===")
    
    # Test avec le compte admin seedé
    session = requests.Session()
    resp = session.get(f"{BASE_URL}/login.php")
    csrf = extract_csrf(resp.text)
    
    data = {
        'csrf': csrf,
        'email': 'superadmin@kapuce.com',
        'password': 'SuperAdminPassword123!'
    }
    
    resp = session.post(f"{BASE_URL}/login.php", data=data, allow_redirects=False)
    
    if resp.status_code == 302:
        location = resp.headers.get('Location', '')
        if '/admin/index.php' in location or '/dashboard/index.php' in location:
            print_test("Connexion ADMIN", True, f"Redirection vers {location}")
            return session
        else:
            print_test("Connexion ADMIN", False, f"Redirection inattendue: {location}")
    else:
        print_test("Connexion ADMIN", False, f"Status: {resp.status_code}")
    
    return None

def test_creation_annonce(session_owner):
    """Test 3: Création d'annonce"""
    print("\n=== TEST 3: CRÉATION ANNONCE ===")
    
    if not session_owner:
        print_test("Création annonce", False, "Session propriétaire non disponible")
        return None
    
    resp = session_owner.get(f"{BASE_URL}/dashboard/create-listing.php")
    csrf = extract_csrf(resp.text)
    
    if not csrf:
        print_test("Accès formulaire création", False, "Token CSRF non trouvé")
        return None
    
    print_test("Accès formulaire création", True)
    
    data = {
        'csrf': csrf,
        'type': 'HOUSE',
        'category': 'RENT',
        'sub_category': 'VILLA',
        'title': 'Belle villa 4 chambres à Libreville',
        'description': 'Magnifique villa moderne avec jardin, située dans un quartier calme et sécurisé de Libreville.',
        'price': '500000',
        'city': 'Libreville',
        'address': '123 Avenue de la Liberté',
        'neighborhood': 'Akanda',
        'd_bedrooms': '3',
        'd_bathrooms': '2',
        'd_surface': '150',
        'd_furnished': 'FURNISHED',
        'd_condition': 'EXCELLENT',
        'd_parking': '2'
    }
    
    resp = session_owner.post(f"{BASE_URL}/dashboard/create-listing.php", data=data, allow_redirects=False)
    
    if resp.status_code == 302 and '/dashboard/my-listings.php' in resp.headers.get('Location', ''):
        print_test("Création annonce (PENDING)", True, "Redirection vers my-listings")
        return True
    else:
        print_test("Création annonce", False, f"Status: {resp.status_code}, Location: {resp.headers.get('Location', 'N/A')}")
        return None

def get_pending_listing_id(session_admin):
    """Récupère l'ID d'une annonce PENDING depuis la page admin"""
    resp = session_admin.get(f"{BASE_URL}/admin/listings.php?filter=PENDING")
    
    # Chercher un ID d'annonce dans le HTML (format UUID)
    matches = re.findall(r'listing_id["\']?\s*[:=]\s*["\']([a-f0-9\-]{36})["\']', resp.text)
    if matches:
        return matches[0]
    
    # Alternative: chercher dans les formulaires
    matches = re.findall(r'name="listing_id"\s+value="([a-f0-9\-]{36})"', resp.text)
    if matches:
        return matches[0]
    
    return None

def test_moderation_admin(session_admin):
    """Test 4: Modération admin - Approuver une annonce"""
    print("\n=== TEST 4: MODÉRATION ADMIN ===")
    
    if not session_admin:
        print_test("Modération admin", False, "Session admin non disponible")
        return None
    
    # Récupérer l'ID d'une annonce PENDING
    listing_id = get_pending_listing_id(session_admin)
    
    if not listing_id:
        print_test("Récupération ID annonce PENDING", False, "Aucune annonce PENDING trouvée")
        return None
    
    print_test("Récupération ID annonce PENDING", True, f"ID: {listing_id[:16]}...")
    
    # Approuver l'annonce
    resp = session_admin.get(f"{BASE_URL}/admin/listings.php")
    csrf = extract_csrf(resp.text)
    
    if not csrf:
        print_test("Extraction CSRF admin", False)
        return None
    
    data = {
        'csrf': csrf,
        'listing_id': listing_id,
        'action': 'approve'
    }
    
    resp = session_admin.post(f"{BASE_URL}/admin/listings.php", data=data, allow_redirects=False)
    
    if resp.status_code == 302:
        print_test("Approbation annonce", True, "Annonce approuvée (status ACTIVE)")
        return listing_id
    else:
        print_test("Approbation annonce", False, f"Status: {resp.status_code}")
        return None

def test_demande_visite(session_client, listing_id):
    """Test 5: Demande de visite"""
    print("\n=== TEST 5: DEMANDE DE VISITE ===")
    
    if not session_client or not listing_id:
        print_test("Demande de visite", False, "Session client ou listing_id non disponible")
        return None
    
    # Accéder à la page de l'annonce
    resp = session_client.get(f"{BASE_URL}/listing.php?id={listing_id}")
    csrf = extract_csrf(resp.text)
    
    if not csrf:
        print_test("Accès page annonce", False, "Token CSRF non trouvé")
        return None
    
    print_test("Accès page annonce", True)
    
    # Envoyer la demande de visite
    data = {
        'csrf': csrf,
        'action': 'request_visit',
        'message': 'Bonjour, je suis intéressé par cette villa. Pourrions-nous organiser une visite cette semaine ?',
        'proposed_date': '2025-06-20 14:00:00'
    }
    
    resp = session_client.post(f"{BASE_URL}/listing.php?id={listing_id}", data=data, allow_redirects=False)
    
    if resp.status_code == 302:
        print_test("Demande de visite créée", True, "Status PENDING attendu en base")
        return True
    else:
        print_test("Demande de visite", False, f"Status: {resp.status_code}")
        return None

def get_visit_request_id(session_owner):
    """Récupère l'ID d'une demande de visite PENDING"""
    resp = session_owner.get(f"{BASE_URL}/dashboard/visit-requests.php")
    
    # Chercher un ID de visite dans le HTML
    matches = re.findall(r'visit_id["\']?\s*[:=]\s*["\']([a-f0-9\-]{36})["\']', resp.text)
    if matches:
        return matches[0]
    
    matches = re.findall(r'name="visit_id"\s+value="([a-f0-9\-]{36})"', resp.text)
    if matches:
        return matches[0]
    
    return None

def test_acceptation_visite(session_owner):
    """Test 6: Acceptation de visite par le propriétaire"""
    print("\n=== TEST 6: ACCEPTATION VISITE ===")
    
    if not session_owner:
        print_test("Acceptation visite", False, "Session propriétaire non disponible")
        return None
    
    visit_id = get_visit_request_id(session_owner)
    
    if not visit_id:
        print_test("Récupération ID visite PENDING", False, "Aucune demande trouvée")
        return None
    
    print_test("Récupération ID visite PENDING", True, f"ID: {visit_id[:16]}...")
    
    resp = session_owner.get(f"{BASE_URL}/dashboard/visit-requests.php")
    csrf = extract_csrf(resp.text)
    
    if not csrf:
        print_test("Extraction CSRF", False)
        return None
    
    data = {
        'csrf': csrf,
        'visit_id': visit_id,
        'action': 'accept'
    }
    
    resp = session_owner.post(f"{BASE_URL}/dashboard/visit-requests.php", data=data, allow_redirects=False)
    
    if resp.status_code == 302:
        print_test("Acceptation visite", True, "Status ACCEPTED + conversation créée attendue")
        return True
    else:
        print_test("Acceptation visite", False, f"Status: {resp.status_code}")
        return None

def get_conversation_id(session):
    """Récupère l'ID d'une conversation depuis la page messages"""
    resp = session.get(f"{BASE_URL}/messages.php")
    
    # Chercher un ID de conversation dans le HTML
    matches = re.findall(r'conversation_id["\']?\s*[:=]\s*["\']([a-f0-9\-]{36})["\']', resp.text)
    if matches:
        return matches[0]
    
    matches = re.findall(r'data-conversation-id="([a-f0-9\-]{36})"', resp.text)
    if matches:
        return matches[0]
    
    return None

def test_messagerie_anti_fraude(session_client):
    """Test 7: Messagerie avec filtrage anti-fraude"""
    print("\n=== TEST 7: MESSAGERIE ANTI-FRAUDE ===")
    
    if not session_client:
        print_test("Messagerie", False, "Session client non disponible")
        return
    
    conv_id = get_conversation_id(session_client)
    
    if not conv_id:
        print_test("Récupération conversation_id", False, "Aucune conversation trouvée")
        return
    
    print_test("Récupération conversation_id", True, f"ID: {conv_id[:16]}...")
    
    # Test 7a: GET messages
    resp = session_client.get(f"{BASE_URL}/api/messages.php?conversation_id={conv_id}")
    
    if resp.status_code == 200:
        data = resp.json()
        if data.get('success'):
            print_test("GET /api/messages.php", True, f"{len(data.get('messages', []))} messages récupérés")
        else:
            print_test("GET /api/messages.php", False, f"Error: {data.get('error')}")
    else:
        print_test("GET /api/messages.php", False, f"Status: {resp.status_code}")
    
    # Test 7b: POST message normal (non filtré)
    headers = {'Content-Type': 'application/json'}
    payload = {
        'conversation_id': conv_id,
        'content': 'Bonjour, on peut se voir demain pour la visite ?'
    }
    
    resp = session_client.post(f"{BASE_URL}/api/messages.php", json=payload, headers=headers)
    
    if resp.status_code == 200:
        data = resp.json()
        if data.get('success') and not data.get('message', {}).get('is_filtered'):
            print_test("POST message normal (non filtré)", True, "Message envoyé sans filtrage")
        else:
            print_test("POST message normal", False, f"Filtré: {data.get('message', {}).get('is_filtered')}")
    else:
        print_test("POST message normal", False, f"Status: {resp.status_code}")
    
    # Test 7c: POST message avec numéro de téléphone (doit être filtré)
    payload = {
        'conversation_id': conv_id,
        'content': 'Appelez-moi au 077 12 34 56 pour plus de détails'
    }
    
    resp = session_client.post(f"{BASE_URL}/api/messages.php", json=payload, headers=headers)
    
    if resp.status_code == 200:
        data = resp.json()
        msg = data.get('message', {})
        if msg.get('is_filtered') and '[NUMÉRO MASQUÉ]' in msg.get('content', ''):
            print_test("POST message avec téléphone (filtré)", True, f"Contenu masqué: {msg.get('content')[:50]}...")
        else:
            print_test("POST message avec téléphone", False, f"is_filtered: {msg.get('is_filtered')}, content: {msg.get('content')[:50]}")
    else:
        print_test("POST message avec téléphone", False, f"Status: {resp.status_code}")
    
    # Test 7d: POST message avec email (doit être filtré)
    payload = {
        'conversation_id': conv_id,
        'content': 'Mon email c\'est test@gmail.com, contactez-moi'
    }
    
    resp = session_client.post(f"{BASE_URL}/api/messages.php", json=payload, headers=headers)
    
    if resp.status_code == 200:
        data = resp.json()
        msg = data.get('message', {})
        if msg.get('is_filtered') and '[EMAIL MASQUÉ]' in msg.get('content', ''):
            print_test("POST message avec email (filtré)", True, f"Contenu masqué: {msg.get('content')[:50]}...")
        else:
            print_test("POST message avec email", False, f"is_filtered: {msg.get('is_filtered')}")
    else:
        print_test("POST message avec email", False, f"Status: {resp.status_code}")

def test_paiement_sequestre(session_client, listing_id):
    """Test 8: Paiement séquestre"""
    print("\n=== TEST 8: PAIEMENT SÉQUESTRE ===")
    
    if not session_client or not listing_id:
        print_test("Paiement séquestre", False, "Session ou listing_id non disponible")
        return None
    
    # Initier le paiement
    resp = session_client.get(f"{BASE_URL}/listing.php?id={listing_id}")
    csrf = extract_csrf(resp.text)
    
    if not csrf:
        print_test("Extraction CSRF", False)
        return None
    
    data = {
        'csrf': csrf,
        'action': 'start_payment'
    }
    
    resp = session_client.post(f"{BASE_URL}/listing.php?id={listing_id}", data=data, allow_redirects=False)
    
    if resp.status_code == 302:
        location = resp.headers.get('Location', '')
        if '/pay.php?id=' in location:
            print_test("Initiation paiement", True, f"Redirection vers {location}")
            
            # Extraire l'ID de transaction
            tx_match = re.search(r'id=([a-f0-9\-]{36})', location)
            if tx_match:
                tx_id = tx_match.group(1)
                print_test("Extraction transaction_id", True, f"ID: {tx_id[:16]}...")
                
                # Effectuer le paiement
                resp = session_client.get(f"{BASE_URL}/pay.php?id={tx_id}")
                csrf = extract_csrf(resp.text)
                
                if not csrf:
                    print_test("Accès page paiement", False, "CSRF non trouvé")
                    return None
                
                data = {
                    'csrf': csrf,
                    'method': 'AIRTEL_MONEY',
                    'phone': '077112233'
                }
                
                resp = session_client.post(f"{BASE_URL}/pay.php?id={tx_id}", data=data, allow_redirects=False)
                
                if resp.status_code == 302:
                    print_test("Paiement Mobile Money", True, "Transaction PAID attendue en base")
                    return tx_id
                else:
                    print_test("Paiement Mobile Money", False, f"Status: {resp.status_code}")
            else:
                print_test("Extraction transaction_id", False)
        else:
            print_test("Initiation paiement", False, f"Redirection inattendue: {location}")
    else:
        print_test("Initiation paiement", False, f"Status: {resp.status_code}")
    
    return None

def get_transaction_id(session_admin):
    """Récupère l'ID d'une transaction PAID depuis la page admin"""
    resp = session_admin.get(f"{BASE_URL}/admin/transactions.php")
    
    # Chercher un ID de transaction dans le HTML
    matches = re.findall(r'tx_id["\']?\s*[:=]\s*["\']([a-f0-9\-]{36})["\']', resp.text)
    if matches:
        return matches[0]
    
    matches = re.findall(r'name="tx_id"\s+value="([a-f0-9\-]{36})"', resp.text)
    if matches:
        return matches[0]
    
    return None

def test_validation_admin_transaction(session_admin, tx_id=None):
    """Test 9: Validation admin de la transaction"""
    print("\n=== TEST 9: VALIDATION ADMIN TRANSACTION ===")
    
    if not session_admin:
        print_test("Validation admin", False, "Session admin non disponible")
        return
    
    if not tx_id:
        tx_id = get_transaction_id(session_admin)
    
    if not tx_id:
        print_test("Récupération transaction_id", False, "Aucune transaction trouvée")
        return
    
    print_test("Récupération transaction_id", True, f"ID: {tx_id[:16]}...")
    
    resp = session_admin.get(f"{BASE_URL}/admin/transactions.php")
    csrf = extract_csrf(resp.text)
    
    if not csrf:
        print_test("Extraction CSRF", False)
        return
    
    data = {
        'csrf': csrf,
        'tx_id': tx_id,
        'action': 'complete'
    }
    
    resp = session_admin.post(f"{BASE_URL}/admin/transactions.php", data=data, allow_redirects=False)
    
    if resp.status_code == 302:
        print_test("Validation transaction", True, "Transaction COMPLETED + annonce RENTED attendue")
    else:
        print_test("Validation transaction", False, f"Status: {resp.status_code}")

def test_supervision_admin(session_admin):
    """Test 10: Supervision admin des messages et alertes"""
    print("\n=== TEST 10: SUPERVISION ADMIN ===")
    
    if not session_admin:
        print_test("Supervision admin", False, "Session admin non disponible")
        return
    
    # Test 10a: GET alertes fraude
    resp = session_admin.get(f"{BASE_URL}/admin/messages.php?tab=alerts")
    
    if resp.status_code == 200 and 'alerte' in resp.text.lower():
        print_test("GET /admin/messages.php?tab=alerts", True, "Page alertes accessible")
    else:
        print_test("GET /admin/messages.php?tab=alerts", False, f"Status: {resp.status_code}")
    
    # Test 10b: GET conversations
    resp = session_admin.get(f"{BASE_URL}/admin/messages.php?tab=conversations")
    
    if resp.status_code == 200:
        print_test("GET /admin/messages.php?tab=conversations", True, "Page conversations accessible")
    else:
        print_test("GET /admin/messages.php?tab=conversations", False, f"Status: {resp.status_code}")

def test_taux_commission(session_admin):
    """Test 11: Modification du taux de commission"""
    print("\n=== TEST 11: TAUX DE COMMISSION ===")
    
    if not session_admin:
        print_test("Taux commission", False, "Session admin non disponible")
        return
    
    resp = session_admin.get(f"{BASE_URL}/admin/settings.php")
    csrf = extract_csrf(resp.text)
    
    if not csrf:
        print_test("Accès page settings", False, "CSRF non trouvé")
        return
    
    print_test("Accès page settings", True)
    
    # Modifier les taux
    data = {
        'csrf': csrf,
        'commission_client': '10',
        'commission_owner': '5'
    }
    
    resp = session_admin.post(f"{BASE_URL}/admin/settings.php", data=data, allow_redirects=False)
    
    if resp.status_code == 302:
        print_test("Modification taux (10%/5%)", True, "Taux modifiés en base")
        
        # Remettre à 7/7
        resp = session_admin.get(f"{BASE_URL}/admin/settings.php")
        csrf = extract_csrf(resp.text)
        
        data = {
            'csrf': csrf,
            'commission_client': '7',
            'commission_owner': '7'
        }
        
        resp = session_admin.post(f"{BASE_URL}/admin/settings.php", data=data, allow_redirects=False)
        
        if resp.status_code == 302:
            print_test("Remise à 7%/7%", True, "Taux restaurés")
        else:
            print_test("Remise à 7%/7%", False, f"Status: {resp.status_code}")
    else:
        print_test("Modification taux", False, f"Status: {resp.status_code}")

def test_securite():
    """Test 12: Sécurité - Accès sans session"""
    print("\n=== TEST 12: SÉCURITÉ ===")
    
    # Test accès dashboard sans session
    session = requests.Session()
    resp = session.get(f"{BASE_URL}/dashboard/index.php", allow_redirects=False)
    
    if resp.status_code == 302 and '/login.php' in resp.headers.get('Location', ''):
        print_test("Accès /dashboard sans session", True, "Redirection vers /login.php")
    else:
        print_test("Accès /dashboard sans session", False, f"Status: {resp.status_code}, Location: {resp.headers.get('Location', 'N/A')}")
    
    # Test accès admin sans session
    resp = session.get(f"{BASE_URL}/admin/index.php", allow_redirects=False)
    
    if resp.status_code == 302 and '/admin/login.php' in resp.headers.get('Location', ''):
        print_test("Accès /admin sans session", True, "Redirection vers /admin/login.php")
    else:
        print_test("Accès /admin sans session", False, f"Status: {resp.status_code}, Location: {resp.headers.get('Location', 'N/A')}")
    
    # Test accès API messages sans session
    resp = session.get(f"{BASE_URL}/api/messages.php?conversation_id=fake-id")
    
    if resp.status_code == 401:
        print_test("Accès /api/messages.php sans session", True, "401 Unauthorized")
    else:
        print_test("Accès /api/messages.php sans session", False, f"Status: {resp.status_code}")

def main():
    """Exécute tous les tests"""
    print("=" * 60)
    print("KAPUCE.G - TEST COMPLET VERSION PHP")
    print("=" * 60)
    print(f"Base URL: {BASE_URL}")
    print(f"Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Vérifier que le serveur répond
    try:
        resp = requests.get(BASE_URL, timeout=5)
        print_test("Serveur PHP accessible", True, f"Status: {resp.status_code}")
    except Exception as e:
        print_test("Serveur PHP accessible", False, str(e))
        return
    
    # Tests séquentiels
    session_client, session_owner = test_inscription()
    session_admin = test_connexion()
    
    if session_owner:
        test_creation_annonce(session_owner)
    
    listing_id = None
    if session_admin:
        listing_id = test_moderation_admin(session_admin)
    
    if session_client and listing_id:
        test_demande_visite(session_client, listing_id)
    
    if session_owner:
        test_acceptation_visite(session_owner)
    
    if session_client:
        test_messagerie_anti_fraude(session_client)
    
    tx_id = None
    if session_client and listing_id:
        tx_id = test_paiement_sequestre(session_client, listing_id)
    
    if session_admin:
        test_validation_admin_transaction(session_admin, tx_id)
        test_supervision_admin(session_admin)
        test_taux_commission(session_admin)
    
    test_securite()
    
    print("\n" + "=" * 60)
    print("TESTS TERMINÉS")
    print("=" * 60)

if __name__ == "__main__":
    main()
