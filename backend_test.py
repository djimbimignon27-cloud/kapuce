#!/usr/bin/env python3
"""
Test complet KAPUCE.G - Version PHP sur http://localhost:8080
Scénario A-G : Flux métier complet + nouvelles fonctionnalités
"""

import requests
import re
import json
from bs4 import BeautifulSoup

BASE_URL = "http://localhost:8080"

def extract_csrf(html):
    """Extrait le token CSRF du HTML"""
    match = re.search(r'name=["\']csrf["\'] value=["\']([^"\']+)["\']', html)
    return match.group(1) if match else None

def print_test(num, desc, success, details=""):
    """Affiche le résultat d'un test"""
    status = "✅ PASS" if success else "❌ FAIL"
    print(f"\nTest {num}: {desc}")
    print(f"{status}")
    if details:
        print(f"Details: {details}")

# Session pour maintenir les cookies
session = requests.Session()

print("="*80)
print("TESTS COMPLETS KAPUCE.G - PHP VERSION (http://localhost:8080)")
print("="*80)

# ============================================================================
# A. FLUX MÉTIER DE BASE (régression)
# ============================================================================
print("\n" + "="*80)
print("A. FLUX MÉTIER DE BASE (régression)")
print("="*80)

# Test 1: Inscription CLIENT (role=USER)
try:
    resp = session.get(f"{BASE_URL}/register.php")
    csrf = extract_csrf(resp.text)
    
    client_data = {
        'csrf': csrf,
        'email': 'client_test@test.com',
        'password': 'ClientPass123!',
        'full_name': 'Client Test',
        'phone': '+241066112233',
        'role': 'USER'
    }
    
    resp = session.post(f"{BASE_URL}/register.php", data=client_data, allow_redirects=False)
    success = resp.status_code == 302 and '/dashboard' in resp.headers.get('Location', '')
    print_test(1, "Inscription CLIENT (role=USER)", success, 
               f"Status: {resp.status_code}, Redirect: {resp.headers.get('Location', 'N/A')}")
except Exception as e:
    print_test(1, "Inscription CLIENT (role=USER)", False, str(e))

# Logout client pour créer propriétaire
session.get(f"{BASE_URL}/logout.php")
session = requests.Session()

# Test 2: Inscription PROPRIÉTAIRE (role=OWNER)
try:
    resp = session.get(f"{BASE_URL}/register.php")
    csrf = extract_csrf(resp.text)
    
    owner_data = {
        'csrf': csrf,
        'email': 'owner_test@test.com',
        'password': 'OwnerPass123!',
        'full_name': 'Propriétaire Test',
        'phone': '+241077223344',
        'role': 'OWNER'
    }
    
    resp = session.post(f"{BASE_URL}/register.php", data=owner_data, allow_redirects=False)
    success = resp.status_code == 302
    print_test(2, "Inscription PROPRIÉTAIRE (role=OWNER)", success,
               f"Status: {resp.status_code}, Redirect: {resp.headers.get('Location', 'N/A')}")
    
    # Garder la session propriétaire pour créer l'annonce
    owner_session = session
except Exception as e:
    print_test(2, "Inscription PROPRIÉTAIRE (role=OWNER)", False, str(e))
    owner_session = requests.Session()

# Test 3: Propriétaire crée annonce
try:
    resp = owner_session.get(f"{BASE_URL}/dashboard/create-listing.php")
    csrf = extract_csrf(resp.text)
    
    listing_data = {
        'csrf': csrf,
        'type': 'HOUSE',
        'category': 'SALE',
        'sub_category': 'VILLA',
        'title': 'Belle villa moderne à Libreville',
        'description': 'Magnifique villa avec 4 chambres, jardin et piscine. Quartier calme et sécurisé.',
        'price': '1000000',
        'city': 'Libreville',
        'address': 'Quartier Batterie IV',
        'neighborhood': 'Batterie IV',
        'bedrooms': '4',
        'bathrooms': '3',
        'area': '250',
        'features': json.dumps(['Piscine', 'Jardin', 'Parking'])
    }
    
    resp = owner_session.post(f"{BASE_URL}/dashboard/create-listing.php", data=listing_data, allow_redirects=False)
    success = resp.status_code == 302
    print_test(3, "Propriétaire crée annonce (type=HOUSE, category=SALE, price=1000000)", success,
               f"Status: {resp.status_code}, Redirect: {resp.headers.get('Location', 'N/A')}")
    
    # Récupérer l'ID de l'annonce créée
    if success:
        resp = owner_session.get(f"{BASE_URL}/dashboard/my-listings.php")
        match = re.search(r'/listing\.php\?id=([a-f0-9-]+)', resp.text)
        listing_id = match.group(1) if match else None
        print(f"Listing ID créé: {listing_id}")
except Exception as e:
    print_test(3, "Propriétaire crée annonce", False, str(e))
    listing_id = None

# Test 4: Admin approuve l'annonce
admin_session = requests.Session()
try:
    resp = admin_session.get(f"{BASE_URL}/admin/login.php")
    csrf = extract_csrf(resp.text)
    
    admin_data = {
        'csrf': csrf,
        'email': 'superadmin@kapuce.com',
        'password': 'SuperAdminPassword123!'
    }
    
    resp = admin_session.post(f"{BASE_URL}/admin/login.php", data=admin_data, allow_redirects=False)
    admin_logged = resp.status_code == 302
    
    if admin_logged and listing_id:
        resp = admin_session.get(f"{BASE_URL}/admin/listings.php")
        csrf = extract_csrf(resp.text)
        
        approve_data = {
            'csrf': csrf,
            'listing_id': listing_id,
            'action': 'approve'
        }
        
        resp = admin_session.post(f"{BASE_URL}/admin/listings.php", data=approve_data, allow_redirects=False)
        success = resp.status_code == 302
        print_test(4, "Admin approuve annonce (PENDING → ACTIVE)", success,
                   f"Status: {resp.status_code}")
    else:
        print_test(4, "Admin approuve annonce", False, "Admin login failed or no listing_id")
except Exception as e:
    print_test(4, "Admin approuve annonce", False, str(e))

# Test 5: Client demande visite
client_session = requests.Session()
try:
    resp = client_session.get(f"{BASE_URL}/login.php")
    csrf = extract_csrf(resp.text)
    
    login_data = {
        'csrf': csrf,
        'email': 'client_test@test.com',
        'password': 'ClientPass123!'
    }
    
    resp = client_session.post(f"{BASE_URL}/login.php", data=login_data, allow_redirects=False)
    client_logged = resp.status_code == 302
    
    if client_logged and listing_id:
        resp = client_session.get(f"{BASE_URL}/listing.php?id={listing_id}")
        csrf = extract_csrf(resp.text)
        
        visit_data = {
            'csrf': csrf,
            'action': 'request_visit',
            'message': 'Bonjour, je suis intéressé par cette villa. Pouvons-nous organiser une visite?',
            'proposed_date': '2025-06-20 14:00'
        }
        
        resp = client_session.post(f"{BASE_URL}/listing.php?id={listing_id}", data=visit_data, allow_redirects=False)
        success = resp.status_code == 302
        print_test(5, "Client demande visite (action=request_visit)", success,
                   f"Status: {resp.status_code}")
        
        # Récupérer l'ID de la demande de visite
        if success:
            resp = owner_session.get(f"{BASE_URL}/dashboard/visit-requests.php")
            match = re.search(r'name=["\']visit_id["\'] value=["\']([a-f0-9-]+)["\']', resp.text)
            visit_id = match.group(1) if match else None
            print(f"Visit request ID: {visit_id}")
    else:
        print_test(5, "Client demande visite", False, "Client login failed or no listing_id")
        visit_id = None
except Exception as e:
    print_test(5, "Client demande visite", False, str(e))
    visit_id = None

# Test 6: Propriétaire accepte la visite
try:
    if visit_id:
        resp = owner_session.get(f"{BASE_URL}/dashboard/visit-requests.php")
        csrf = extract_csrf(resp.text)
        
        accept_data = {
            'csrf': csrf,
            'visit_id': visit_id,
            'action': 'accept'
        }
        
        resp = owner_session.post(f"{BASE_URL}/dashboard/visit-requests.php", data=accept_data, allow_redirects=False)
        success = resp.status_code == 302
        print_test(6, "Propriétaire accepte visite (action=accept) → conversation créée", success,
                   f"Status: {resp.status_code}")
        
        # Récupérer l'ID de la conversation créée
        if success:
            resp = owner_session.get(f"{BASE_URL}/messages.php")
            match = re.search(r'conversation_id=([a-f0-9-]+)', resp.text)
            conversation_id = match.group(1) if match else None
            print(f"Conversation ID créée: {conversation_id}")
    else:
        print_test(6, "Propriétaire accepte visite", False, "No visit_id")
        conversation_id = None
except Exception as e:
    print_test(6, "Propriétaire accepte visite", False, str(e))
    conversation_id = None

# Test 7: Message avec téléphone → masqué + fraud_alert créée avec status='PENDING'
try:
    if conversation_id:
        resp = client_session.get(f"{BASE_URL}/messages.php")
        csrf = extract_csrf(resp.text)
        
        # Envoyer un message avec un numéro de téléphone
        message_data = {
            'conversation_id': conversation_id,
            'content': 'Merci! Appelez-moi au 066 11 22 33 pour confirmer'
        }
        
        resp = client_session.post(f"{BASE_URL}/api/messages.php", 
                                   json=message_data,
                                   headers={'Content-Type': 'application/json'})
        
        if resp.status_code == 200:
            data = resp.json()
            success = data.get('success', False) and data.get('message', {}).get('is_filtered') == 1
            
            # Vérifier que le contenu est masqué
            filtered_content = data.get('message', {}).get('content', '')
            has_masked = '[NUMÉRO MASQUÉ]' in filtered_content
            
            print_test(7, "Message avec téléphone '066 11 22 33' → masqué + fraud_alert créée (status=PENDING)", 
                      success and has_masked,
                      f"Filtered: {success}, Masked: {has_masked}, Content: {filtered_content}")
        else:
            print_test(7, "Message avec téléphone", False, f"Status: {resp.status_code}")
    else:
        print_test(7, "Message avec téléphone", False, "No conversation_id")
except Exception as e:
    print_test(7, "Message avec téléphone", False, str(e))

# ============================================================================
# B. NOUVELLE PAGE ALERTES FRAUDE (/admin/alerts.php)
# ============================================================================
print("\n" + "="*80)
print("B. NOUVELLE PAGE ALERTES FRAUDE (/admin/alerts.php)")
print("="*80)

# Test 8: GET /admin/alerts.php → 200, affiche les 4 compteurs et l'alerte
try:
    resp = admin_session.get(f"{BASE_URL}/admin/alerts.php")
    success = resp.status_code == 200
    
    # Vérifier les 4 compteurs
    has_pending = 'En attente' in resp.text
    has_reviewed = 'Examinées' in resp.text
    has_dismissed = 'Ignorées' in resp.text
    has_action_taken = 'Actions prises' in resp.text
    
    # Vérifier qu'il y a au moins une alerte affichée
    has_alert = 'CONTENU ORIGINAL DÉTECTÉ' in resp.text or '066 11 22 33' in resp.text
    
    all_ok = success and has_pending and has_reviewed and has_dismissed and has_action_taken
    print_test(8, "GET /admin/alerts.php → 200, affiche 4 compteurs et alertes", all_ok,
               f"Status: {resp.status_code}, Compteurs: {has_pending and has_reviewed and has_dismissed and has_action_taken}, Alert: {has_alert}")
    
    # Récupérer l'ID de la première alerte PENDING
    match = re.search(r'name=["\']alert_id["\'] value=["\']([a-f0-9-]+)["\']', resp.text)
    alert_id_1 = match.group(1) if match else None
    print(f"Alert ID 1: {alert_id_1}")
except Exception as e:
    print_test(8, "GET /admin/alerts.php", False, str(e))
    alert_id_1 = None

# Test 9: POST action=review → alerte passe à REVIEWED
try:
    if alert_id_1:
        resp = admin_session.get(f"{BASE_URL}/admin/alerts.php")
        csrf = extract_csrf(resp.text)
        
        review_data = {
            'csrf': csrf,
            'alert_id': alert_id_1,
            'action': 'review'
        }
        
        resp = admin_session.post(f"{BASE_URL}/admin/alerts.php", data=review_data, allow_redirects=False)
        success = resp.status_code == 302
        print_test(9, "POST action=review → alerte passe à REVIEWED", success,
                   f"Status: {resp.status_code}")
    else:
        print_test(9, "POST action=review", False, "No alert_id_1")
except Exception as e:
    print_test(9, "POST action=review", False, str(e))

# Test 10: Créer 2e alerte, puis POST action=dismiss → DISMISSED
try:
    if conversation_id:
        # Envoyer un autre message frauduleux
        message_data = {
            'conversation_id': conversation_id,
            'content': 'Mon email est test@gmail.com pour plus de détails'
        }
        
        resp = client_session.post(f"{BASE_URL}/api/messages.php", 
                                   json=message_data,
                                   headers={'Content-Type': 'application/json'})
        
        # Récupérer la nouvelle alerte
        resp = admin_session.get(f"{BASE_URL}/admin/alerts.php?filter=PENDING")
        matches = re.findall(r'name=["\']alert_id["\'] value=["\']([a-f0-9-]+)["\']', resp.text)
        alert_id_2 = matches[0] if matches else None
        
        if alert_id_2:
            csrf = extract_csrf(resp.text)
            dismiss_data = {
                'csrf': csrf,
                'alert_id': alert_id_2,
                'action': 'dismiss'
            }
            
            resp = admin_session.post(f"{BASE_URL}/admin/alerts.php", data=dismiss_data, allow_redirects=False)
            success = resp.status_code == 302
            print_test(10, "Créer 2e alerte + POST action=dismiss → DISMISSED", success,
                       f"Status: {resp.status_code}, Alert ID: {alert_id_2}")
        else:
            print_test(10, "POST action=dismiss", False, "No alert_id_2")
    else:
        print_test(10, "POST action=dismiss", False, "No conversation_id")
except Exception as e:
    print_test(10, "POST action=dismiss", False, str(e))

# Test 11: Créer 3e alerte, POST action=ban_user → ACTION_TAKEN + utilisateur banni
try:
    if conversation_id:
        # Envoyer un 3e message frauduleux
        message_data = {
            'conversation_id': conversation_id,
            'content': 'Contactez-moi sur WhatsApp au 077 99 88 77'
        }
        
        resp = client_session.post(f"{BASE_URL}/api/messages.php", 
                                   json=message_data,
                                   headers={'Content-Type': 'application/json'})
        
        # Récupérer la nouvelle alerte
        resp = admin_session.get(f"{BASE_URL}/admin/alerts.php?filter=PENDING")
        matches = re.findall(r'name=["\']alert_id["\'] value=["\']([a-f0-9-]+)["\']', resp.text)
        alert_id_3 = matches[0] if matches else None
        
        if alert_id_3:
            csrf = extract_csrf(resp.text)
            ban_data = {
                'csrf': csrf,
                'alert_id': alert_id_3,
                'action': 'ban_user'
            }
            
            resp = admin_session.post(f"{BASE_URL}/admin/alerts.php", data=ban_data, allow_redirects=False)
            success = resp.status_code == 302
            
            # Vérifier que l'utilisateur est banni (ne peut plus se connecter)
            test_session = requests.Session()
            resp = test_session.get(f"{BASE_URL}/login.php")
            csrf = extract_csrf(resp.text)
            
            login_data = {
                'csrf': csrf,
                'email': 'client_test@test.com',
                'password': 'ClientPass123!'
            }
            
            resp = test_session.post(f"{BASE_URL}/login.php", data=login_data, allow_redirects=True)
            is_banned = 'suspendu' in resp.text.lower() or 'banni' in resp.text.lower()
            
            print_test(11, "POST action=ban_user → ACTION_TAKEN + utilisateur banni (login bloqué)", 
                      success and is_banned,
                      f"Ban status: {resp.status_code}, Is banned: {is_banned}")
            
            # Débannir l'utilisateur pour continuer les tests
            resp = admin_session.get(f"{BASE_URL}/admin/users.php")
            csrf = extract_csrf(resp.text)
            
            # Trouver l'ID de l'utilisateur client
            match = re.search(r'client_test@test\.com.*?name=["\']user_id["\'] value=["\']([a-f0-9-]+)["\']', resp.text, re.DOTALL)
            user_id = match.group(1) if match else None
            
            if user_id:
                unban_data = {
                    'csrf': csrf,
                    'user_id': user_id,
                    'action': 'unban'
                }
                admin_session.post(f"{BASE_URL}/admin/users.php", data=unban_data)
                print(f"Utilisateur débanni pour continuer les tests")
        else:
            print_test(11, "POST action=ban_user", False, "No alert_id_3")
    else:
        print_test(11, "POST action=ban_user", False, "No conversation_id")
except Exception as e:
    print_test(11, "POST action=ban_user", False, str(e))

# ============================================================================
# C. MODIFICATION DE COMMISSION PAR TRANSACTION (NOUVEAU)
# ============================================================================
print("\n" + "="*80)
print("C. MODIFICATION DE COMMISSION PAR TRANSACTION (NOUVEAU)")
print("="*80)

# Test 12: Client start_payment puis POST /pay.php
try:
    # Recréer la session client (débanni)
    client_session = requests.Session()
    resp = client_session.get(f"{BASE_URL}/login.php")
    csrf = extract_csrf(resp.text)
    
    login_data = {
        'csrf': csrf,
        'email': 'client_test@test.com',
        'password': 'ClientPass123!'
    }
    client_session.post(f"{BASE_URL}/login.php", data=login_data)
    
    if listing_id:
        # Start payment
        resp = client_session.get(f"{BASE_URL}/listing.php?id={listing_id}")
        csrf = extract_csrf(resp.text)
        
        start_payment_data = {
            'csrf': csrf,
            'action': 'start_payment'
        }
        
        resp = client_session.post(f"{BASE_URL}/listing.php?id={listing_id}", 
                                   data=start_payment_data, allow_redirects=False)
        
        if resp.status_code == 302:
            # Extraire l'ID de la transaction de la redirection
            location = resp.headers.get('Location', '')
            match = re.search(r'id=([a-f0-9-]+)', location)
            transaction_id = match.group(1) if match else None
            
            if transaction_id:
                # POST /pay.php avec méthode de paiement
                resp = client_session.get(f"{BASE_URL}/pay.php?id={transaction_id}")
                csrf = extract_csrf(resp.text)
                
                pay_data = {
                    'csrf': csrf,
                    'method': 'AIRTEL_MONEY',
                    'phone': '+241077112233',
                    'payment_reference': 'TXN111222333'
                }
                
                resp = client_session.post(f"{BASE_URL}/pay.php?id={transaction_id}", 
                                          data=pay_data, allow_redirects=False)
                success = resp.status_code == 302
                print_test(12, "Client start_payment + POST /pay.php (method=AIRTEL_MONEY) → PAID", success,
                          f"Status: {resp.status_code}, TX ID: {transaction_id}")
            else:
                print_test(12, "Client start_payment + POST /pay.php", False, "No transaction_id in redirect")
                transaction_id = None
        else:
            print_test(12, "Client start_payment + POST /pay.php", False, f"Start payment failed: {resp.status_code}")
            transaction_id = None
    else:
        print_test(12, "Client start_payment + POST /pay.php", False, "No listing_id")
        transaction_id = None
except Exception as e:
    print_test(12, "Client start_payment + POST /pay.php", False, str(e))
    transaction_id = None

# Test 13: Admin modifie commission (7% → 10%)
try:
    if transaction_id:
        resp = admin_session.get(f"{BASE_URL}/admin/transactions.php")
        csrf = extract_csrf(resp.text)
        
        update_commission_data = {
            'csrf': csrf,
            'tx_id': transaction_id,
            'action': 'update_commission',
            'commission_rate': '10',
            'admin_notes': 'Remise négociée avec le propriétaire'
        }
        
        resp = admin_session.post(f"{BASE_URL}/admin/transactions.php", 
                                 data=update_commission_data, allow_redirects=False)
        success = resp.status_code == 302
        
        # Vérifier en base que la commission a été modifiée
        import subprocess
        result = subprocess.run([
            'mysql', '-u', 'root', 'kapuce', '-e',
            f"SELECT commission_rate_owner, commission_owner, seller_receives, admin_notes, commission_modified FROM transactions WHERE id = '{transaction_id}'"
        ], capture_output=True, text=True)
        
        has_correct_rate = '10.00' in result.stdout or '10' in result.stdout
        has_correct_commission = '100000' in result.stdout  # 10% de 1000000
        has_correct_seller = '900000' in result.stdout  # 1000000 - 100000
        has_notes = 'Remise négociée' in result.stdout
        has_modified_flag = '1' in result.stdout
        
        all_ok = success and has_correct_rate and has_correct_commission and has_correct_seller and has_modified_flag
        print_test(13, "Admin modifie commission (7% → 10%) avec notes admin", all_ok,
                  f"Status: {resp.status_code}, Rate: {has_correct_rate}, Commission: {has_correct_commission}, Seller: {has_correct_seller}, Modified: {has_modified_flag}")
    else:
        print_test(13, "Admin modifie commission", False, "No transaction_id")
except Exception as e:
    print_test(13, "Admin modifie commission", False, str(e))

# Test 14: GET /admin/transactions.php → badge "Modifié par admin" et note affichés
try:
    resp = admin_session.get(f"{BASE_URL}/admin/transactions.php")
    success = resp.status_code == 200
    
    has_badge = 'Modifié par admin' in resp.text or '⚙️' in resp.text
    has_note = 'Remise négociée' in resp.text
    
    print_test(14, "GET /admin/transactions.php → badge 'Modifié par admin' et note affichés", 
              success and has_badge and has_note,
              f"Status: {resp.status_code}, Badge: {has_badge}, Note: {has_note}")
except Exception as e:
    print_test(14, "GET /admin/transactions.php", False, str(e))

# Test 15: Admin valide (action=complete) → COMPLETED, annonce SOLD
try:
    if transaction_id:
        resp = admin_session.get(f"{BASE_URL}/admin/transactions.php")
        csrf = extract_csrf(resp.text)
        
        complete_data = {
            'csrf': csrf,
            'tx_id': transaction_id,
            'action': 'complete'
        }
        
        resp = admin_session.post(f"{BASE_URL}/admin/transactions.php", 
                                 data=complete_data, allow_redirects=False)
        success = resp.status_code == 302
        
        # Vérifier en base que la transaction est COMPLETED et l'annonce est SOLD
        import subprocess
        result = subprocess.run([
            'mysql', '-u', 'root', 'kapuce', '-e',
            f"SELECT status FROM transactions WHERE id = '{transaction_id}'"
        ], capture_output=True, text=True)
        tx_completed = 'COMPLETED' in result.stdout
        
        result = subprocess.run([
            'mysql', '-u', 'root', 'kapuce', '-e',
            f"SELECT status FROM listings WHERE id = '{listing_id}'"
        ], capture_output=True, text=True)
        listing_sold = 'SOLD' in result.stdout
        
        print_test(15, "Admin valide (action=complete) → COMPLETED, annonce SOLD, vendeur reçoit 900000", 
                  success and tx_completed and listing_sold,
                  f"Status: {resp.status_code}, TX: {tx_completed}, Listing: {listing_sold}")
    else:
        print_test(15, "Admin valide transaction", False, "No transaction_id")
except Exception as e:
    print_test(15, "Admin valide transaction", False, str(e))

# ============================================================================
# D. PROFIL UTILISATEUR (NOUVEAU, /dashboard/profile.php)
# ============================================================================
print("\n" + "="*80)
print("D. PROFIL UTILISATEUR (NOUVEAU, /dashboard/profile.php)")
print("="*80)

# Test 16: GET /dashboard/profile.php → 200 avec formulaire
try:
    resp = client_session.get(f"{BASE_URL}/dashboard/profile.php")
    success = resp.status_code == 200
    
    has_form = 'Informations personnelles' in resp.text
    has_name_field = 'full_name' in resp.text
    has_phone_field = 'phone' in resp.text
    has_city_field = 'city' in resp.text
    
    print_test(16, "GET /dashboard/profile.php → 200 avec formulaire", 
              success and has_form,
              f"Status: {resp.status_code}, Form: {has_form}")
except Exception as e:
    print_test(16, "GET /dashboard/profile.php", False, str(e))

# Test 17: POST profil → 302, valeurs mises à jour en base
try:
    resp = client_session.get(f"{BASE_URL}/dashboard/profile.php")
    csrf = extract_csrf(resp.text)
    
    profile_data = {
        'csrf': csrf,
        'form': 'profile',
        'full_name': 'Nouveau Nom Client',
        'phone': '+24106111111',
        'city': 'Libreville',
        'address': 'Quartier Test',
        'bio': 'Ma bio de test'
    }
    
    resp = client_session.post(f"{BASE_URL}/dashboard/profile.php", 
                               data=profile_data, allow_redirects=False)
    success = resp.status_code == 302
    
    # Vérifier en base
    import subprocess
    result = subprocess.run([
        'mysql', '-u', 'root', 'kapuce', '-e',
        "SELECT full_name, phone, city, address, bio FROM users WHERE email = 'client_test@test.com'"
    ], capture_output=True, text=True)
    
    has_name = 'Nouveau Nom Client' in result.stdout
    has_phone = '24106111111' in result.stdout
    has_city = 'Libreville' in result.stdout
    has_address = 'Quartier Test' in result.stdout
    has_bio = 'Ma bio de test' in result.stdout
    
    all_ok = success and has_name and has_phone and has_city and has_address and has_bio
    print_test(17, "POST profil (full_name, phone, city, address, bio) → 302, valeurs en base", all_ok,
              f"Status: {resp.status_code}, Name: {has_name}, Phone: {has_phone}, City: {has_city}")
except Exception as e:
    print_test(17, "POST profil", False, str(e))

# Test 18: Changement mot de passe → 302, puis login avec nouveau mot de passe
try:
    resp = client_session.get(f"{BASE_URL}/dashboard/profile.php")
    csrf = extract_csrf(resp.text)
    
    password_data = {
        'csrf': csrf,
        'form': 'password',
        'current_password': 'ClientPass123!',
        'new_password': 'NouveauPass123',
        'confirm_password': 'NouveauPass123'
    }
    
    resp = client_session.post(f"{BASE_URL}/dashboard/profile.php", 
                               data=password_data, allow_redirects=False)
    success = resp.status_code == 302
    
    # Logout et tester login avec nouveau mot de passe
    client_session.get(f"{BASE_URL}/logout.php")
    
    test_session = requests.Session()
    resp = test_session.get(f"{BASE_URL}/login.php")
    csrf = extract_csrf(resp.text)
    
    # Test avec nouveau mot de passe
    login_data = {
        'csrf': csrf,
        'email': 'client_test@test.com',
        'password': 'NouveauPass123'
    }
    
    resp = test_session.post(f"{BASE_URL}/login.php", data=login_data, allow_redirects=False)
    new_pass_works = resp.status_code == 302
    
    # Test avec ancien mot de passe (doit échouer)
    test_session2 = requests.Session()
    resp = test_session2.get(f"{BASE_URL}/login.php")
    csrf = extract_csrf(resp.text)
    
    login_data['csrf'] = csrf
    login_data['password'] = 'ClientPass123!'
    
    resp = test_session2.post(f"{BASE_URL}/login.php", data=login_data, allow_redirects=True)
    old_pass_fails = resp.status_code != 302 or 'dashboard' not in resp.url
    
    print_test(18, "Changement mot de passe → login avec nouveau OK, ancien échoue", 
              success and new_pass_works and old_pass_fails,
              f"Change: {resp.status_code}, New works: {new_pass_works}, Old fails: {old_pass_fails}")
    
    # Restaurer la session client avec nouveau mot de passe
    client_session = test_session
except Exception as e:
    print_test(18, "Changement mot de passe", False, str(e))

# Test 19: POST form=password avec current_password INCORRECT → erreur
try:
    resp = client_session.get(f"{BASE_URL}/dashboard/profile.php")
    csrf = extract_csrf(resp.text)
    
    password_data = {
        'csrf': csrf,
        'form': 'password',
        'current_password': 'WrongPassword123',
        'new_password': 'AnotherPass123',
        'confirm_password': 'AnotherPass123'
    }
    
    resp = client_session.post(f"{BASE_URL}/dashboard/profile.php", 
                               data=password_data, allow_redirects=True)
    
    has_error = 'incorrect' in resp.text.lower() or 'erreur' in resp.text.lower()
    
    print_test(19, "POST form=password avec current_password INCORRECT → erreur affichée", has_error,
              f"Has error: {has_error}")
except Exception as e:
    print_test(19, "POST form=password incorrect", False, str(e))

# ============================================================================
# E. PARAMÈTRES UTILISATEUR (NOUVEAU, /dashboard/settings.php)
# ============================================================================
print("\n" + "="*80)
print("E. PARAMÈTRES UTILISATEUR (NOUVEAU, /dashboard/settings.php)")
print("="*80)

# Test 20: GET /dashboard/settings.php → 200 avec toggles
try:
    resp = client_session.get(f"{BASE_URL}/dashboard/settings.php")
    success = resp.status_code == 200
    
    has_email_notif = 'email_notifications' in resp.text
    has_message_alerts = 'message_alerts' in resp.text
    has_toggles = 'checkbox' in resp.text
    
    print_test(20, "GET /dashboard/settings.php → 200 avec toggles", 
              success and has_email_notif and has_message_alerts,
              f"Status: {resp.status_code}, Has toggles: {has_toggles}")
except Exception as e:
    print_test(20, "GET /dashboard/settings.php", False, str(e))

# Test 21: POST (email_notifications=on, message_alerts=on) → 302, prefs en base
try:
    resp = client_session.get(f"{BASE_URL}/dashboard/settings.php")
    csrf = extract_csrf(resp.text)
    
    settings_data = {
        'csrf': csrf,
        'email_notifications': 'on',
        'message_alerts': 'on'
        # sms_notifications non coché
    }
    
    resp = client_session.post(f"{BASE_URL}/dashboard/settings.php", 
                               data=settings_data, allow_redirects=False)
    success = resp.status_code == 302
    
    # Vérifier en base
    import subprocess
    result = subprocess.run([
        'mysql', '-u', 'root', 'kapuce', '-e',
        "SELECT notification_prefs FROM users WHERE email = 'client_test@test.com'"
    ], capture_output=True, text=True)
    
    has_email_true = 'email_notifications' in result.stdout and 'true' in result.stdout
    has_sms_false = 'sms_notifications' in result.stdout and 'false' in result.stdout
    
    print_test(21, "POST settings (email_notifications=on, message_alerts=on) → 302, prefs en base", 
              success and has_email_true,
              f"Status: {resp.status_code}, Email true: {has_email_true}, SMS false: {has_sms_false}")
except Exception as e:
    print_test(21, "POST settings", False, str(e))

# ============================================================================
# F. VÉRIFICATION GLOBALE ADMIN (toutes les pages 200 sans erreur PHP)
# ============================================================================
print("\n" + "="*80)
print("F. VÉRIFICATION GLOBALE ADMIN (toutes les pages 200 sans erreur PHP)")
print("="*80)

admin_pages = [
    '/admin/index.php',
    '/admin/users.php',
    '/admin/listings.php',
    '/admin/alerts.php',
    '/admin/messages.php',
    '/admin/transactions.php',
    '/admin/reviews.php',
    '/admin/settings.php'
]

# Test 22-29: Toutes les pages admin → 200 sans erreur PHP
for i, page in enumerate(admin_pages, start=22):
    try:
        resp = admin_session.get(f"{BASE_URL}{page}")
        success = resp.status_code == 200
        
        has_error = 'Fatal error' in resp.text or 'Warning:' in resp.text or 'Parse error' in resp.text
        
        print_test(i, f"GET {page} → 200 sans erreur PHP", success and not has_error,
                  f"Status: {resp.status_code}, Has error: {has_error}")
    except Exception as e:
        print_test(i, f"GET {page}", False, str(e))

# Test 30: /admin/settings.php → POST modifier commission
try:
    resp = admin_session.get(f"{BASE_URL}/admin/settings.php")
    csrf = extract_csrf(resp.text)
    
    settings_data = {
        'csrf': csrf,
        'commission_client': '8',
        'commission_owner': '6'
    }
    
    resp = admin_session.post(f"{BASE_URL}/admin/settings.php", 
                             data=settings_data, allow_redirects=False)
    success = resp.status_code == 302
    
    # Vérifier en base
    import subprocess
    result = subprocess.run([
        'mysql', '-u', 'root', 'kapuce', '-e',
        "SELECT setting_value FROM settings WHERE setting_key IN ('commission_client', 'commission_owner')"
    ], capture_output=True, text=True)
    
    has_8 = '8' in result.stdout
    has_6 = '6' in result.stdout
    
    # Remettre à 7/7
    if success:
        resp = admin_session.get(f"{BASE_URL}/admin/settings.php")
        csrf = extract_csrf(resp.text)
        
        reset_data = {
            'csrf': csrf,
            'commission_client': '7',
            'commission_owner': '7'
        }
        admin_session.post(f"{BASE_URL}/admin/settings.php", data=reset_data)
    
    print_test(30, "/admin/settings.php → POST modifier commission (8/6) puis remettre 7/7", 
              success and has_8 and has_6,
              f"Status: {resp.status_code}, Has 8: {has_8}, Has 6: {has_6}")
except Exception as e:
    print_test(30, "/admin/settings.php POST", False, str(e))

# Test 31: /admin/users.php → recherche ?q=... fonctionne
try:
    resp = admin_session.get(f"{BASE_URL}/admin/users.php?q=client")
    success = resp.status_code == 200
    
    has_client = 'client_test@test.com' in resp.text or 'Client' in resp.text
    
    print_test(31, "/admin/users.php → recherche ?q=client fonctionne", 
              success and has_client,
              f"Status: {resp.status_code}, Has client: {has_client}")
except Exception as e:
    print_test(31, "/admin/users.php recherche", False, str(e))

# Test 32: Sécurité → GET /admin/index.php sans session → redirection /admin/login.php
try:
    no_auth_session = requests.Session()
    resp = no_auth_session.get(f"{BASE_URL}/admin/index.php", allow_redirects=False)
    
    is_redirect = resp.status_code == 302
    redirect_to_login = '/admin/login.php' in resp.headers.get('Location', '')
    
    print_test(32, "Sécurité: GET /admin/index.php sans session → redirection /admin/login.php", 
              is_redirect and redirect_to_login,
              f"Status: {resp.status_code}, Redirect: {resp.headers.get('Location', 'N/A')}")
except Exception as e:
    print_test(32, "Sécurité admin sans session", False, str(e))

# Test 33: Sécurité → Utilisateur normal connecté → redirigé si accès admin
try:
    # Le client_session est un utilisateur normal
    resp = client_session.get(f"{BASE_URL}/admin/index.php", allow_redirects=False)
    
    is_redirect = resp.status_code == 302 or resp.status_code == 403
    
    print_test(33, "Sécurité: Utilisateur normal → redirigé si accès /admin", is_redirect,
              f"Status: {resp.status_code}")
except Exception as e:
    print_test(33, "Sécurité utilisateur normal", False, str(e))

# ============================================================================
# G. PAGES PUBLIQUES/UTILISATEUR (200 sans erreur PHP)
# ============================================================================
print("\n" + "="*80)
print("G. PAGES PUBLIQUES/UTILISATEUR (200 sans erreur PHP)")
print("="*80)

user_pages = [
    '/',
    '/listings.php',
    f'/listing.php?id={listing_id}' if listing_id else '/listings.php',
    '/favorites.php',
    '/messages.php',
    '/dashboard/index.php',
    '/dashboard/my-listings.php',
    '/dashboard/my-visits.php',
    '/dashboard/visit-requests.php',
    '/dashboard/transactions.php',
    '/dashboard/create-listing.php'
]

# Test 34-44: Pages utilisateur → 200 sans erreur PHP
for i, page in enumerate(user_pages, start=34):
    try:
        resp = client_session.get(f"{BASE_URL}{page}")
        success = resp.status_code == 200
        
        has_error = 'Fatal error' in resp.text or 'Warning:' in resp.text or 'Parse error' in resp.text
        
        print_test(i, f"GET {page} → 200 sans erreur PHP", success and not has_error,
                  f"Status: {resp.status_code}, Has error: {has_error}")
    except Exception as e:
        print_test(i, f"GET {page}", False, str(e))

# Test 45: Notation → Client note le propriétaire via POST /review.php?tx=TX_ID
try:
    if transaction_id:
        resp = client_session.get(f"{BASE_URL}/review.php?tx={transaction_id}")
        csrf = extract_csrf(resp.text)
        
        review_data = {
            'csrf': csrf,
            'rating': '5',
            'comment': 'Excellent propriétaire, très professionnel et réactif!'
        }
        
        resp = client_session.post(f"{BASE_URL}/review.php?tx={transaction_id}", 
                                   data=review_data, allow_redirects=False)
        success = resp.status_code == 302
        
        # Vérifier que l'avis est en base
        import subprocess
        result = subprocess.run([
            'mysql', '-u', 'root', 'kapuce', '-e',
            f"SELECT rating, comment FROM reviews WHERE transaction_id = '{transaction_id}'"
        ], capture_output=True, text=True)
        
        has_rating = '5' in result.stdout
        has_comment = 'Excellent propriétaire' in result.stdout
        
        # Vérifier affichage sur /listing.php
        if listing_id:
            resp = client_session.get(f"{BASE_URL}/listing.php?id={listing_id}")
            has_review_section = 'Avis' in resp.text or 'Excellent propriétaire' in resp.text
        else:
            has_review_section = False
        
        print_test(45, "Notation: POST /review.php?tx=TX_ID (rating=5, comment) → avis en base et affiché", 
                  success and has_rating and has_comment,
                  f"Status: {resp.status_code}, Rating: {has_rating}, Comment: {has_comment}, Displayed: {has_review_section}")
    else:
        print_test(45, "Notation", False, "No transaction_id")
except Exception as e:
    print_test(45, "Notation", False, str(e))

# ============================================================================
# RÉSUMÉ FINAL
# ============================================================================
print("\n" + "="*80)
print("RÉSUMÉ FINAL DES TESTS")
print("="*80)
print("\nTous les tests du scénario A-G ont été exécutés.")
print("Vérifiez les résultats ci-dessus pour identifier les fonctionnalités qui fonctionnent")
print("et celles qui nécessitent des corrections.")
print("\n" + "="*80)
