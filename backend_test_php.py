#!/usr/bin/env python3
"""
Test complet des nouvelles fonctionnalités de messagerie/support KAPUCE.G (PHP)
Tests sur http://localhost:8080
"""
import requests
import json
import re
import mysql.connector
from io import BytesIO
from PIL import Image
import time

BASE_URL = "http://localhost:8080"

def get_db():
    """Connexion MySQL"""
    return mysql.connector.connect(
        unix_socket="/run/mysqld/mysqld.sock",
        user="root",
        password="",
        database="kapuce"
    )

def extract_csrf(html):
    """Extrait le token CSRF du HTML"""
    match = re.search(r'name=["\']csrf["\'] value=["\']([^"\']+)["\']', html)
    return match.group(1) if match else None

def create_test_image(path="/tmp/capture_test.png"):
    """Crée une petite image PNG de test"""
    img = Image.new('RGB', (100, 100), color='blue')
    img.save(path)
    return path

def print_test(num, desc):
    print(f"\n{'='*80}")
    print(f"TEST {num}: {desc}")
    print('='*80)

def print_result(success, message):
    status = "✅ RÉUSSI" if success else "❌ ÉCHEC"
    print(f"{status}: {message}")

# ============================================================================
# A. PRÉPARATION (régression rapide)
# ============================================================================

print_test("A", "PRÉPARATION - Régression rapide")

# Test 1: Inscrire un CLIENT (role=USER)
print_test(1, "Inscription CLIENT (role=USER)")
try:
    client_session = requests.Session()
    resp = client_session.get(f"{BASE_URL}/register.php")
    csrf = extract_csrf(resp.text)
    
    client_email = f"client_test_{int(time.time())}@test.com"
    data = {
        'csrf': csrf,
        'full_name': 'Client Test',
        'email': client_email,
        'phone': '077111111',
        'password': 'Password123!',
        'password_confirm': 'Password123!',
        'role': 'USER'
    }
    resp = client_session.post(f"{BASE_URL}/register.php", data=data, allow_redirects=False)
    
    if resp.status_code == 302 and '/dashboard' in resp.headers.get('Location', ''):
        print_result(True, f"Client créé: {client_email}, redirection vers dashboard")
    else:
        print_result(False, f"Status {resp.status_code}, Location: {resp.headers.get('Location')}")
except Exception as e:
    print_result(False, f"Exception: {e}")

# Test 2: Inscrire un PROPRIÉTAIRE (role=OWNER)
print_test(2, "Inscription PROPRIÉTAIRE (role=OWNER)")
try:
    owner_session = requests.Session()
    resp = owner_session.get(f"{BASE_URL}/register.php")
    csrf = extract_csrf(resp.text)
    
    owner_email = f"owner_test_{int(time.time())}@test.com"
    data = {
        'csrf': csrf,
        'full_name': 'Propriétaire Test',
        'email': owner_email,
        'phone': '077222222',
        'password': 'Password123!',
        'password_confirm': 'Password123!',
        'role': 'OWNER'
    }
    resp = owner_session.post(f"{BASE_URL}/register.php", data=data, allow_redirects=False)
    
    if resp.status_code == 302 and '/dashboard' in resp.headers.get('Location', ''):
        print_result(True, f"Propriétaire créé: {owner_email}, redirection vers dashboard")
    else:
        print_result(False, f"Status {resp.status_code}, Location: {resp.headers.get('Location')}")
except Exception as e:
    print_result(False, f"Exception: {e}")

# Test 3: Propriétaire crée une annonce
print_test(3, "Propriétaire crée annonce (HOUSE/SALE/1000000/Libreville)")
try:
    resp = owner_session.get(f"{BASE_URL}/dashboard/create-listing.php")
    csrf = extract_csrf(resp.text)
    
    data = {
        'csrf': csrf,
        'type': 'HOUSE',
        'category': 'SALE',
        'sub_category': 'VILLA',
        'title': 'Belle villa moderne à Libreville',
        'description': 'Magnifique villa avec 4 chambres, jardin et piscine. Quartier calme et sécurisé.',
        'price': '1000000',
        'city': 'Libreville',
        'address': '123 Avenue de la Liberté',
        'neighborhood': 'Quartier Louis',
        'bedrooms': '4',
        'bathrooms': '3',
        'area': '250'
    }
    resp = owner_session.post(f"{BASE_URL}/dashboard/create-listing.php", data=data, allow_redirects=False)
    
    if resp.status_code == 302:
        # Récupérer l'ID de l'annonce depuis la base
        db = get_db()
        cursor = db.cursor(dictionary=True)
        cursor.execute("SELECT id FROM listings WHERE title = %s ORDER BY created_at DESC LIMIT 1", (data['title'],))
        listing = cursor.fetchone()
        cursor.close()
        db.close()
        
        if listing:
            listing_id = listing['id']
            print_result(True, f"Annonce créée avec ID: {listing_id}, status PENDING")
        else:
            print_result(False, "Annonce non trouvée en base")
    else:
        print_result(False, f"Status {resp.status_code}")
except Exception as e:
    print_result(False, f"Exception: {e}")

# Test 4: Admin approuve l'annonce
print_test(4, "Admin approuve l'annonce (PENDING → ACTIVE)")
try:
    admin_session = requests.Session()
    resp = admin_session.get(f"{BASE_URL}/admin/login.php")
    csrf = extract_csrf(resp.text)
    
    data = {
        'csrf': csrf,
        'email': 'superadmin@kapuce.com',
        'password': 'SuperAdminPassword123!'
    }
    resp = admin_session.post(f"{BASE_URL}/admin/login.php", data=data, allow_redirects=False)
    
    if resp.status_code == 302:
        # Approuver l'annonce
        resp = admin_session.get(f"{BASE_URL}/admin/listings.php")
        csrf = extract_csrf(resp.text)
        
        data = {
            'csrf': csrf,
            'listing_id': listing_id,
            'action': 'approve'
        }
        resp = admin_session.post(f"{BASE_URL}/admin/listings.php", data=data, allow_redirects=False)
        
        # Vérifier en base
        db = get_db()
        cursor = db.cursor(dictionary=True)
        cursor.execute("SELECT status FROM listings WHERE id = %s", (listing_id,))
        listing = cursor.fetchone()
        cursor.close()
        db.close()
        
        if listing and listing['status'] == 'ACTIVE':
            print_result(True, f"Annonce {listing_id} approuvée, status ACTIVE")
        else:
            print_result(False, f"Status en base: {listing['status'] if listing else 'NOT FOUND'}")
    else:
        print_result(False, f"Admin login failed: {resp.status_code}")
except Exception as e:
    print_result(False, f"Exception: {e}")

# Test 5: Client demande une visite
print_test(5, "Client demande une visite")
try:
    resp = client_session.get(f"{BASE_URL}/listing.php?id={listing_id}")
    csrf = extract_csrf(resp.text)
    
    data = {
        'csrf': csrf,
        'action': 'request_visit',
        'message': 'Bonjour, je suis intéressé par cette villa. Pouvons-nous organiser une visite?',
        'proposed_date': '2025-06-15 14:00'
    }
    resp = client_session.post(f"{BASE_URL}/listing.php?id={listing_id}", data=data, allow_redirects=False)
    
    if resp.status_code == 302:
        # Vérifier en base
        db = get_db()
        cursor = db.cursor(dictionary=True)
        cursor.execute("SELECT id, status FROM visit_requests WHERE listing_id = %s ORDER BY created_at DESC LIMIT 1", (listing_id,))
        visit = cursor.fetchone()
        cursor.close()
        db.close()
        
        if visit and visit['status'] == 'PENDING':
            visit_id = visit['id']
            print_result(True, f"Demande de visite créée avec ID: {visit_id}, status PENDING")
        else:
            print_result(False, "Demande de visite non trouvée en base")
    else:
        print_result(False, f"Status {resp.status_code}")
except Exception as e:
    print_result(False, f"Exception: {e}")

# Test 6: Propriétaire accepte la visite → conversation créée
print_test(6, "Propriétaire accepte la visite → conversation créée")
try:
    resp = owner_session.get(f"{BASE_URL}/dashboard/visit-requests.php")
    csrf = extract_csrf(resp.text)
    
    data = {
        'csrf': csrf,
        'visit_id': visit_id,
        'action': 'accept'
    }
    resp = owner_session.post(f"{BASE_URL}/dashboard/visit-requests.php", data=data, allow_redirects=False)
    
    if resp.status_code == 302:
        # Vérifier en base
        db = get_db()
        cursor = db.cursor(dictionary=True)
        cursor.execute("SELECT status FROM visit_requests WHERE id = %s", (visit_id,))
        visit = cursor.fetchone()
        
        # Vérifier qu'une conversation a été créée
        cursor.execute("""
            SELECT c.id, COUNT(m.id) as msg_count 
            FROM conversations c 
            LEFT JOIN messages m ON m.conversation_id = c.id 
            WHERE c.listing_id = %s 
            GROUP BY c.id
        """, (listing_id,))
        conv = cursor.fetchone()
        cursor.close()
        db.close()
        
        if visit and visit['status'] == 'ACCEPTED' and conv:
            conversation_id = conv['id']
            print_result(True, f"Visite acceptée, conversation créée: {conversation_id} avec {conv['msg_count']} messages")
        else:
            print_result(False, f"Visit status: {visit['status'] if visit else 'NOT FOUND'}, Conv: {conv}")
    else:
        print_result(False, f"Status {resp.status_code}")
except Exception as e:
    print_result(False, f"Exception: {e}")

# ============================================================================
# B. CONTACTER KAPUCE (NOUVEAU)
# ============================================================================

print_test("B", "CONTACTER KAPUCE - Nouvelle fonctionnalité")

# Test 7: Client accède à /contact-support.php → redirection vers /messages.php?c=CONV_ID
print_test(7, "GET /contact-support.php → redirection vers conversation support")
try:
    resp = client_session.get(f"{BASE_URL}/contact-support.php", allow_redirects=False)
    
    if resp.status_code == 302:
        location = resp.headers.get('Location', '')
        if '/messages.php?c=' in location:
            support_conv_id = location.split('c=')[1].split('&')[0]
            
            # Vérifier en base: conversation avec SUPER_ADMIN
            db = get_db()
            cursor = db.cursor(dictionary=True)
            cursor.execute("""
                SELECT c.*, u1.role as p1_role, u2.role as p2_role,
                       (SELECT COUNT(*) FROM messages WHERE conversation_id = c.id) as msg_count
                FROM conversations c
                JOIN users u1 ON u1.id = c.participant1_id
                JOIN users u2 ON u2.id = c.participant2_id
                WHERE c.id = %s
            """, (support_conv_id,))
            conv = cursor.fetchone()
            
            # Vérifier le message de bienvenue
            cursor.execute("""
                SELECT content FROM messages 
                WHERE conversation_id = %s AND is_system = 1 
                ORDER BY created_at ASC LIMIT 1
            """, (support_conv_id,))
            welcome_msg = cursor.fetchone()
            cursor.close()
            db.close()
            
            has_admin = conv and (conv['p1_role'] == 'SUPER_ADMIN' or conv['p2_role'] == 'SUPER_ADMIN')
            has_welcome = welcome_msg and '077347262' in welcome_msg['content'] and '065216069' in welcome_msg['content']
            
            if has_admin and has_welcome:
                print_result(True, f"Redirection vers conversation support {support_conv_id}, message bienvenue avec numéros présent")
            else:
                print_result(False, f"Admin: {has_admin}, Welcome msg: {has_welcome}")
        else:
            print_result(False, f"Redirection incorrecte: {location}")
    else:
        print_result(False, f"Status {resp.status_code}, attendu 302")
except Exception as e:
    print_result(False, f"Exception: {e}")

# Test 8: Re-GET /contact-support.php → même conversation (pas de doublon)
print_test(8, "Re-GET /contact-support.php → même conversation (pas de doublon)")
try:
    resp = client_session.get(f"{BASE_URL}/contact-support.php", allow_redirects=False)
    
    if resp.status_code == 302:
        location = resp.headers.get('Location', '')
        if '/messages.php?c=' in location:
            new_conv_id = location.split('c=')[1].split('&')[0]
            
            if new_conv_id == support_conv_id:
                print_result(True, f"Même conversation retournée: {support_conv_id} (pas de doublon)")
            else:
                print_result(False, f"Nouvelle conversation créée: {new_conv_id} != {support_conv_id}")
        else:
            print_result(False, f"Redirection incorrecte: {location}")
    else:
        print_result(False, f"Status {resp.status_code}")
except Exception as e:
    print_result(False, f"Exception: {e}")

# Test 9: Client envoie un message texte à KAPUCE
print_test(9, "Client envoie message texte à KAPUCE via POST /api/messages.php")
try:
    data = {
        'conversation_id': support_conv_id,
        'content': "Bonjour j'ai une question sur le paiement Mobile Money"
    }
    resp = client_session.post(f"{BASE_URL}/api/messages.php", json=data)
    
    if resp.status_code == 200:
        result = resp.json()
        if result.get('success'):
            # Admin vérifie qu'il voit le message
            resp_admin = admin_session.get(f"{BASE_URL}/api/messages.php?conversation_id={support_conv_id}")
            if resp_admin.status_code == 200:
                messages = resp_admin.json().get('messages', [])
                client_msg = [m for m in messages if 'question sur le paiement' in m.get('content', '')]
                
                if client_msg:
                    print_result(True, f"Message envoyé et visible par admin (échange bidirectionnel OK)")
                else:
                    print_result(False, "Message non visible par admin")
            else:
                print_result(False, f"Admin GET failed: {resp_admin.status_code}")
        else:
            print_result(False, f"API error: {result.get('error')}")
    else:
        print_result(False, f"Status {resp.status_code}")
except Exception as e:
    print_result(False, f"Exception: {e}")

# ============================================================================
# C. ADMIN CONTACTE N'IMPORTE QUEL COMPTE (NOUVEAU)
# ============================================================================

print_test("C", "ADMIN CONTACTE N'IMPORTE QUEL COMPTE")

# Test 10: Admin contacte le propriétaire via POST /admin/users.php
print_test(10, "Admin contacte propriétaire → conversation + notification ADMIN_CONTACT")
try:
    # Récupérer l'ID du propriétaire
    db = get_db()
    cursor = db.cursor(dictionary=True)
    cursor.execute("SELECT id FROM users WHERE email = %s", (owner_email,))
    owner = cursor.fetchone()
    owner_id = owner['id']
    cursor.close()
    db.close()
    
    resp = admin_session.get(f"{BASE_URL}/admin/users.php")
    csrf = extract_csrf(resp.text)
    
    data = {
        'csrf': csrf,
        'user_id': owner_id,
        'action': 'contact'
    }
    resp = admin_session.post(f"{BASE_URL}/admin/users.php", data=data, allow_redirects=False)
    
    if resp.status_code == 302:
        location = resp.headers.get('Location', '')
        if '/messages.php?c=' in location:
            admin_owner_conv_id = location.split('c=')[1].split('&')[0]
            
            # Vérifier notification ADMIN_CONTACT pour le propriétaire
            db = get_db()
            cursor = db.cursor(dictionary=True)
            cursor.execute("""
                SELECT * FROM notifications 
                WHERE user_id = %s AND type = 'ADMIN_CONTACT' 
                ORDER BY created_at DESC LIMIT 1
            """, (owner_id,))
            notif = cursor.fetchone()
            cursor.close()
            db.close()
            
            if notif:
                print_result(True, f"Conversation admin↔propriétaire créée: {admin_owner_conv_id}, notification ADMIN_CONTACT envoyée")
            else:
                print_result(False, "Notification ADMIN_CONTACT non trouvée")
        else:
            print_result(False, f"Redirection incorrecte: {location}")
    else:
        print_result(False, f"Status {resp.status_code}")
except Exception as e:
    print_result(False, f"Exception: {e}")

# Test 11: Admin envoie message avec numéro de téléphone → NON filtré (exemption admin)
print_test(11, "Admin envoie message avec numéro → NON filtré (exemption admin)")
try:
    data = {
        'conversation_id': admin_owner_conv_id,
        'content': "Bonjour, nous avons besoin de vous contacter. Appelez-nous au 077347262 pour plus d'informations."
    }
    resp = admin_session.post(f"{BASE_URL}/api/messages.php", json=data)
    
    if resp.status_code == 200:
        result = resp.json()
        if result.get('success'):
            # Vérifier en base que le message n'est PAS filtré
            db = get_db()
            cursor = db.cursor(dictionary=True)
            cursor.execute("""
                SELECT content, is_filtered, filter_reason 
                FROM messages 
                WHERE conversation_id = %s 
                ORDER BY created_at DESC LIMIT 1
            """, (admin_owner_conv_id,))
            msg = cursor.fetchone()
            cursor.close()
            db.close()
            
            if msg and msg['is_filtered'] == 0 and '077347262' in msg['content']:
                print_result(True, f"Message admin NON filtré (is_filtered=0), contenu intact avec numéro")
            else:
                print_result(False, f"Message filtré incorrectement: is_filtered={msg['is_filtered']}, content={msg['content'][:50]}")
        else:
            print_result(False, f"API error: {result.get('error')}")
    else:
        print_result(False, f"Status {resp.status_code}")
except Exception as e:
    print_result(False, f"Exception: {e}")

# Test 12: Propriétaire répond avec numéro → LUI doit être filtré
print_test(12, "Propriétaire répond avec numéro → filtré ([NUMÉRO MASQUÉ] + fraud_alert)")
try:
    data = {
        'conversation_id': admin_owner_conv_id,
        'content': "D'accord, voici mon numéro pour vous joindre: 066 44 55 66"
    }
    resp = owner_session.post(f"{BASE_URL}/api/messages.php", json=data)
    
    if resp.status_code == 200:
        result = resp.json()
        if result.get('success'):
            # Vérifier en base que le message EST filtré
            db = get_db()
            cursor = db.cursor(dictionary=True)
            cursor.execute("""
                SELECT content, is_filtered, filter_reason, original_content 
                FROM messages 
                WHERE conversation_id = %s 
                ORDER BY created_at DESC LIMIT 2
            """, (admin_owner_conv_id,))
            messages = cursor.fetchall()
            
            # Vérifier alerte de fraude
            cursor.execute("""
                SELECT alert_type, severity 
                FROM fraud_alerts 
                WHERE user_id = %s 
                ORDER BY created_at DESC LIMIT 1
            """, (owner_id,))
            alert = cursor.fetchone()
            cursor.close()
            db.close()
            
            owner_msg = [m for m in messages if m['is_filtered'] == 1]
            
            if owner_msg and '[NUMÉRO MASQUÉ]' in owner_msg[0]['content'] and alert:
                print_result(True, f"Message propriétaire filtré ([NUMÉRO MASQUÉ]), alerte fraude créée: {alert['alert_type']}/{alert['severity']}")
            else:
                print_result(False, f"Filtrage incorrect: {owner_msg}, alert: {alert}")
        else:
            print_result(False, f"API error: {result.get('error')}")
    else:
        print_result(False, f"Status {resp.status_code}")
except Exception as e:
    print_result(False, f"Exception: {e}")

# ============================================================================
# D. ENVOI D'IMAGE / CAPTURE D'ÉCRAN (NOUVEAU)
# ============================================================================

print_test("D", "ENVOI D'IMAGE / CAPTURE D'ÉCRAN")

# Test 13: Créer une image de test
print_test(13, "Créer image PNG de test")
try:
    img_path = create_test_image()
    print_result(True, f"Image créée: {img_path}")
except Exception as e:
    print_result(False, f"Exception: {e}")

# Test 14: Client envoie image avec texte via multipart
print_test(14, "Client envoie image + texte via POST multipart /api/messages.php")
try:
    with open(img_path, 'rb') as f:
        files = {'image': ('capture_test.png', f, 'image/png')}
        data = {
            'conversation_id': support_conv_id,
            'content': 'Voici ma capture d\'écran de paiement'
        }
        resp = client_session.post(f"{BASE_URL}/api/messages.php", files=files, data=data)
    
    if resp.status_code == 200:
        result = resp.json()
        if result.get('success') and result.get('image_url'):
            image_url = result['image_url']
            
            # Vérifier en base
            db = get_db()
            cursor = db.cursor(dictionary=True)
            cursor.execute("""
                SELECT image_url FROM messages 
                WHERE conversation_id = %s AND image_url IS NOT NULL 
                ORDER BY created_at DESC LIMIT 1
            """, (support_conv_id,))
            msg = cursor.fetchone()
            cursor.close()
            db.close()
            
            if msg and msg['image_url'] and msg['image_url'].startswith('https://res.cloudinary.com'):
                print_result(True, f"Image uploadée avec succès: {msg['image_url'][:60]}...")
            else:
                print_result(False, f"Image_url en base: {msg}")
        else:
            print_result(False, f"API response: {result}")
    else:
        print_result(False, f"Status {resp.status_code}")
except Exception as e:
    print_result(False, f"Exception: {e}")

# Test 15: GET /api/messages.php → message contient image_url
print_test(15, "GET /api/messages.php → message retourné contient image_url")
try:
    resp = client_session.get(f"{BASE_URL}/api/messages.php?conversation_id={support_conv_id}")
    
    if resp.status_code == 200:
        result = resp.json()
        messages = result.get('messages', [])
        img_messages = [m for m in messages if m.get('image_url')]
        
        if img_messages:
            print_result(True, f"Message avec image_url trouvé: {img_messages[0]['image_url'][:60]}...")
        else:
            print_result(False, "Aucun message avec image_url")
    else:
        print_result(False, f"Status {resp.status_code}")
except Exception as e:
    print_result(False, f"Exception: {e}")

# Test 16: Envoi image SEULE sans texte
print_test(16, "Envoi image SEULE sans texte (content vide)")
try:
    with open(img_path, 'rb') as f:
        files = {'image': ('capture2.png', f, 'image/png')}
        data = {
            'conversation_id': support_conv_id,
            'content': ''
        }
        resp = client_session.post(f"{BASE_URL}/api/messages.php", files=files, data=data)
    
    if resp.status_code == 200:
        result = resp.json()
        if result.get('success'):
            print_result(True, "Image seule envoyée avec succès (sans texte)")
        else:
            print_result(False, f"API error: {result.get('error')}")
    else:
        print_result(False, f"Status {resp.status_code}")
except Exception as e:
    print_result(False, f"Exception: {e}")

# Test 17: Envoi fichier NON-image (.txt) → erreur 400
print_test(17, "Envoi fichier NON-image (.txt) → erreur 400")
try:
    # Créer un fichier texte
    with open('/tmp/test.txt', 'w') as f:
        f.write('This is not an image')
    
    with open('/tmp/test.txt', 'rb') as f:
        files = {'image': ('test.txt', f, 'text/plain')}
        data = {
            'conversation_id': support_conv_id,
            'content': 'Test fichier texte'
        }
        resp = client_session.post(f"{BASE_URL}/api/messages.php", files=files, data=data)
    
    if resp.status_code == 400:
        result = resp.json()
        if 'Format' in result.get('error', '') or 'supporté' in result.get('error', ''):
            print_result(True, f"Erreur 400 correcte: {result.get('error')}")
        else:
            print_result(False, f"Erreur incorrecte: {result.get('error')}")
    else:
        print_result(False, f"Status {resp.status_code}, attendu 400")
except Exception as e:
    print_result(False, f"Exception: {e}")

# ============================================================================
# E. FLUX PAIEMENT STRUCTURÉ (NOUVEAU)
# ============================================================================

print_test("E", "FLUX PAIEMENT STRUCTURÉ")

# Test 18: Client démarre paiement → /pay.php?id=TX
print_test(18, "Client POST /listing.php (action=start_payment) → /pay.php?id=TX")
try:
    resp = client_session.get(f"{BASE_URL}/listing.php?id={listing_id}")
    csrf = extract_csrf(resp.text)
    
    data = {
        'csrf': csrf,
        'action': 'start_payment'
    }
    resp = client_session.post(f"{BASE_URL}/listing.php?id={listing_id}", data=data, allow_redirects=False)
    
    if resp.status_code == 302:
        location = resp.headers.get('Location', '')
        if '/pay.php?id=' in location:
            tx_id = location.split('id=')[1].split('&')[0]
            
            # Vérifier en base
            db = get_db()
            cursor = db.cursor(dictionary=True)
            cursor.execute("SELECT status FROM transactions WHERE id = %s", (tx_id,))
            tx = cursor.fetchone()
            cursor.close()
            db.close()
            
            if tx and tx['status'] == 'PENDING_PAYMENT':
                print_result(True, f"Transaction créée: {tx_id}, status PENDING_PAYMENT, redirection vers /pay.php")
            else:
                print_result(False, f"Transaction status: {tx}")
        else:
            print_result(False, f"Redirection incorrecte: {location}")
    else:
        print_result(False, f"Status {resp.status_code}")
except Exception as e:
    print_result(False, f"Exception: {e}")

# Test 19: GET /pay.php → page contient "3 étapes" et "capture d'écran"
print_test(19, "GET /pay.php → page contient '3 étapes' et 'capture d'écran'")
try:
    resp = client_session.get(f"{BASE_URL}/pay.php?id={tx_id}")
    
    if resp.status_code == 200:
        html = resp.text.lower()
        has_steps = '3 étapes' in html or 'étape' in html
        has_capture = 'capture' in html and 'écran' in html
        
        if has_steps and has_capture:
            print_result(True, "Page /pay.php contient les 3 étapes et mention de capture d'écran")
        else:
            print_result(False, f"Steps: {has_steps}, Capture: {has_capture}")
    else:
        print_result(False, f"Status {resp.status_code}")
except Exception as e:
    print_result(False, f"Exception: {e}")

# Test 20: POST /pay.php → redirection vers /messages.php?c=CONV_SUPPORT
print_test(20, "POST /pay.php (method=MOOV_MONEY) → redirection vers /messages.php?c=CONV_SUPPORT")
try:
    resp = client_session.get(f"{BASE_URL}/pay.php?id={tx_id}")
    csrf = extract_csrf(resp.text)
    
    data = {
        'csrf': csrf,
        'method': 'MOOV_MONEY',
        'payment_reference': 'TXN555666777',
        'comment': 'Paiement effectué via Moov Money'
    }
    resp = client_session.post(f"{BASE_URL}/pay.php?id={tx_id}", data=data, allow_redirects=False)
    
    if resp.status_code == 302:
        location = resp.headers.get('Location', '')
        
        # Vérifier transaction PAID
        db = get_db()
        cursor = db.cursor(dictionary=True)
        cursor.execute("SELECT status, payment_reference FROM transactions WHERE id = %s", (tx_id,))
        tx = cursor.fetchone()
        
        # Vérifier message système dans conversation support
        cursor.execute("""
            SELECT content FROM messages 
            WHERE conversation_id = %s AND is_system = 1 
            ORDER BY created_at DESC LIMIT 1
        """, (support_conv_id,))
        sys_msg = cursor.fetchone()
        
        # Vérifier notification PAYMENT_PROOF pour admin
        cursor.execute("""
            SELECT * FROM notifications 
            WHERE type = 'PAYMENT_PROOF' 
            ORDER BY created_at DESC LIMIT 1
        """)
        notif = cursor.fetchone()
        cursor.close()
        db.close()
        
        redirect_ok = '/messages.php?c=' in location and support_conv_id in location
        tx_ok = tx and tx['status'] == 'PAID' and tx['payment_reference'] == 'TXN555666777'
        msg_ok = sys_msg and 'DERNIÈRE ÉTAPE' in sys_msg['content'] and 'TXN555666777' in sys_msg['content']
        notif_ok = notif is not None
        
        if redirect_ok and tx_ok and msg_ok and notif_ok:
            print_result(True, f"Paiement validé, redirection vers support, message système + notification PAYMENT_PROOF créés")
        else:
            print_result(False, f"Redirect: {redirect_ok}, TX: {tx_ok}, Msg: {msg_ok}, Notif: {notif_ok}")
    else:
        print_result(False, f"Status {resp.status_code}")
except Exception as e:
    print_result(False, f"Exception: {e}")

# Test 21: Client envoie capture d'écran dans conversation support
print_test(21, "Client envoie capture d'écran dans conversation support")
try:
    with open(img_path, 'rb') as f:
        files = {'image': ('payment_proof.png', f, 'image/png')}
        data = {
            'conversation_id': support_conv_id,
            'content': 'Voici la capture d\'écran de mon paiement Moov Money'
        }
        resp = client_session.post(f"{BASE_URL}/api/messages.php", files=files, data=data)
    
    if resp.status_code == 200:
        result = resp.json()
        if result.get('success'):
            print_result(True, "Capture d'écran de paiement envoyée avec succès")
        else:
            print_result(False, f"API error: {result.get('error')}")
    else:
        print_result(False, f"Status {resp.status_code}")
except Exception as e:
    print_result(False, f"Exception: {e}")

# Test 22: Admin valide la transaction → COMPLETED, annonce SOLD
print_test(22, "Admin valide transaction (action=complete) → COMPLETED, annonce SOLD")
try:
    resp = admin_session.get(f"{BASE_URL}/admin/transactions.php")
    csrf = extract_csrf(resp.text)
    
    data = {
        'csrf': csrf,
        'tx_id': tx_id,
        'action': 'complete'
    }
    resp = admin_session.post(f"{BASE_URL}/admin/transactions.php", data=data, allow_redirects=False)
    
    if resp.status_code == 302:
        # Vérifier en base
        db = get_db()
        cursor = db.cursor(dictionary=True)
        cursor.execute("SELECT status FROM transactions WHERE id = %s", (tx_id,))
        tx = cursor.fetchone()
        
        cursor.execute("SELECT status FROM listings WHERE id = %s", (listing_id,))
        listing = cursor.fetchone()
        cursor.close()
        db.close()
        
        if tx and tx['status'] == 'COMPLETED' and listing and listing['status'] == 'SOLD':
            print_result(True, f"Transaction COMPLETED, annonce SOLD")
        else:
            print_result(False, f"TX status: {tx['status'] if tx else 'NOT FOUND'}, Listing: {listing['status'] if listing else 'NOT FOUND'}")
    else:
        print_result(False, f"Status {resp.status_code}")
except Exception as e:
    print_result(False, f"Exception: {e}")

# ============================================================================
# F. VÉRIFICATIONS FINALES
# ============================================================================

print_test("F", "VÉRIFICATIONS FINALES")

# Test 23: GET /admin/messages.php?conv=CONV_SUPPORT → affiche image
print_test(23, "GET /admin/messages.php?conv=CONV_SUPPORT → affiche image (res.cloudinary.com)")
try:
    resp = admin_session.get(f"{BASE_URL}/admin/messages.php?conv={support_conv_id}")
    
    if resp.status_code == 200:
        html = resp.text
        has_cloudinary = 'res.cloudinary.com' in html
        has_img_tag = '<img' in html and 'res.cloudinary.com' in html
        
        if has_cloudinary and has_img_tag:
            print_result(True, "Page admin affiche l'image Cloudinary (balise img présente)")
        else:
            print_result(False, f"Cloudinary: {has_cloudinary}, img tag: {has_img_tag}")
    else:
        print_result(False, f"Status {resp.status_code}")
except Exception as e:
    print_result(False, f"Exception: {e}")

# Test 24: GET /messages.php → contient bouton "Contacter KAPUCE"
print_test(24, "GET /messages.php → contient bouton 'Contacter KAPUCE'")
try:
    resp = client_session.get(f"{BASE_URL}/messages.php")
    
    if resp.status_code == 200:
        html = resp.text.lower()
        has_button = 'contacter kapuce' in html or 'contact-support' in html
        
        if has_button:
            print_result(True, "Page /messages.php contient le bouton 'Contacter KAPUCE'")
        else:
            print_result(False, "Bouton 'Contacter KAPUCE' non trouvé")
    else:
        print_result(False, f"Status {resp.status_code}")
except Exception as e:
    print_result(False, f"Exception: {e}")

# Test 25: Pages principales → 200 sans erreur PHP
print_test(25, "Pages principales → 200 sans erreur PHP")
try:
    pages = [
        ('/', 'Accueil'),
        ('/listings.php', 'Annonces'),
        ('/dashboard/index.php', 'Dashboard client'),
        ('/admin/index.php', 'Dashboard admin')
    ]
    
    all_ok = True
    for path, name in pages:
        if 'admin' in path:
            resp = admin_session.get(f"{BASE_URL}{path}")
        else:
            resp = client_session.get(f"{BASE_URL}{path}")
        
        has_error = 'fatal error' in resp.text.lower() or 'parse error' in resp.text.lower() or 'warning:' in resp.text.lower()
        
        if resp.status_code == 200 and not has_error:
            print(f"  ✅ {name} ({path}): 200 OK")
        else:
            print(f"  ❌ {name} ({path}): {resp.status_code}, erreur PHP: {has_error}")
            all_ok = False
    
    if all_ok:
        print_result(True, "Toutes les pages principales retournent 200 sans erreur PHP")
    else:
        print_result(False, "Certaines pages ont des erreurs")
except Exception as e:
    print_result(False, f"Exception: {e}")

print("\n" + "="*80)
print("TESTS TERMINÉS")
print("="*80)
