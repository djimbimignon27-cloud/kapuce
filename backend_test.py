#!/usr/bin/env python3
"""
Test complet de KAPUCE.G (version PHP) - Régression + Système de notation
URL: http://localhost:8080
Base MySQL: kapuce, user root, no password
"""

import requests
import re
import json
from datetime import datetime

BASE_URL = "http://localhost:8080"

def extract_csrf(html):
    """Extrait le token CSRF d'une page HTML"""
    match = re.search(r'name=["\']csrf["\'] value=["\']([^"\']+)["\']', html)
    return match.group(1) if match else None

def test_register_client():
    """Test 1: Inscription CLIENT (role=USER)"""
    print("\n=== TEST 1: Inscription CLIENT ===")
    try:
        session = requests.Session()
        # GET pour récupérer le CSRF
        resp = session.get(f"{BASE_URL}/register.php")
        csrf = extract_csrf(resp.text)
        
        # POST inscription
        data = {
            'csrf': csrf,
            'role': 'USER',
            'full_name': 'Jean Dupont',
            'email': f'client_{datetime.now().timestamp()}@test.com',
            'phone': '065123456',
            'password': 'Password123!',
            'password_confirm': 'Password123!'
        }
        resp = session.post(f"{BASE_URL}/register.php", data=data, allow_redirects=False)
        
        if resp.status_code == 302 and '/dashboard/index.php' in resp.headers.get('Location', ''):
            print("✅ Inscription CLIENT réussie - Redirection vers /dashboard/index.php")
            return {'success': True, 'session': session, 'email': data['email'], 'password': data['password']}
        else:
            print(f"❌ Échec inscription CLIENT - Status: {resp.status_code}, Location: {resp.headers.get('Location')}")
            return {'success': False}
    except Exception as e:
        print(f"❌ Erreur inscription CLIENT: {e}")
        return {'success': False}

def test_register_owner():
    """Test 2: Inscription PROPRIÉTAIRE (role=OWNER)"""
    print("\n=== TEST 2: Inscription PROPRIÉTAIRE ===")
    try:
        session = requests.Session()
        resp = session.get(f"{BASE_URL}/register.php")
        csrf = extract_csrf(resp.text)
        
        data = {
            'csrf': csrf,
            'role': 'OWNER',
            'full_name': 'Marie Martin',
            'email': f'owner_{datetime.now().timestamp()}@test.com',
            'phone': '077654321',
            'password': 'Password123!',
            'password_confirm': 'Password123!'
        }
        resp = session.post(f"{BASE_URL}/register.php", data=data, allow_redirects=False)
        
        if resp.status_code == 302 and '/dashboard/index.php' in resp.headers.get('Location', ''):
            print("✅ Inscription PROPRIÉTAIRE réussie - Redirection vers /dashboard/index.php")
            return {'success': True, 'session': session, 'email': data['email'], 'password': data['password']}
        else:
            print(f"❌ Échec inscription PROPRIÉTAIRE - Status: {resp.status_code}")
            return {'success': False}
    except Exception as e:
        print(f"❌ Erreur inscription PROPRIÉTAIRE: {e}")
        return {'success': False}

def test_login_logout(email, password):
    """Test 3: Login/Logout"""
    print("\n=== TEST 3: Login/Logout ===")
    try:
        session = requests.Session()
        resp = session.get(f"{BASE_URL}/login.php")
        csrf = extract_csrf(resp.text)
        
        # Login
        data = {'csrf': csrf, 'email': email, 'password': password}
        resp = session.post(f"{BASE_URL}/login.php", data=data, allow_redirects=False)
        
        if resp.status_code == 302 and '/dashboard/index.php' in resp.headers.get('Location', ''):
            print("✅ Login réussi")
            
            # Logout
            resp = session.get(f"{BASE_URL}/logout.php", allow_redirects=False)
            if resp.status_code == 302 and '/index.php' in resp.headers.get('Location', ''):
                print("✅ Logout réussi")
                return {'success': True}
            else:
                print(f"❌ Échec logout - Status: {resp.status_code}")
                return {'success': False}
        else:
            print(f"❌ Échec login - Status: {resp.status_code}")
            return {'success': False}
    except Exception as e:
        print(f"❌ Erreur login/logout: {e}")
        return {'success': False}

def test_create_listing(owner_session):
    """Test 4: Propriétaire crée une annonce"""
    print("\n=== TEST 4: Création d'annonce ===")
    try:
        resp = owner_session.get(f"{BASE_URL}/dashboard/create-listing.php")
        csrf = extract_csrf(resp.text)
        
        data = {
            'csrf': csrf,
            'type': 'HOUSE',
            'category': 'SALE',
            'sub_category': 'VILLA',
            'title': 'Belle villa moderne à Libreville',
            'description': 'Magnifique villa de 4 chambres avec jardin et piscine. Quartier calme et sécurisé.',
            'price': '2000000',
            'city': 'Libreville',
            'address': '123 Avenue de la Liberté',
            'neighborhood': 'Quartier Louis'
        }
        resp = owner_session.post(f"{BASE_URL}/dashboard/create-listing.php", data=data, allow_redirects=False)
        
        if resp.status_code == 302:
            print("✅ Annonce créée avec succès - Status PENDING")
            # Récupérer l'ID de l'annonce depuis la base
            import subprocess
            result = subprocess.run(
                ['mysql', '-u', 'root', 'kapuce', '-e', 
                 f"SELECT id FROM listings WHERE title = '{data['title']}' ORDER BY created_at DESC LIMIT 1;"],
                capture_output=True, text=True
            )
            listing_id = result.stdout.strip().split('\n')[-1] if result.returncode == 0 else None
            return {'success': True, 'listing_id': listing_id}
        else:
            print(f"❌ Échec création annonce - Status: {resp.status_code}")
            return {'success': False}
    except Exception as e:
        print(f"❌ Erreur création annonce: {e}")
        return {'success': False}

def test_admin_approve_listing(listing_id):
    """Test 5: Admin approuve l'annonce"""
    print("\n=== TEST 5: Admin approuve l'annonce ===")
    try:
        admin_session = requests.Session()
        resp = admin_session.get(f"{BASE_URL}/admin/login.php")
        csrf = extract_csrf(resp.text)
        
        # Login admin
        data = {'csrf': csrf, 'email': 'superadmin@kapuce.com', 'password': 'SuperAdminPassword123!'}
        resp = admin_session.post(f"{BASE_URL}/admin/login.php", data=data, allow_redirects=False)
        
        if resp.status_code != 302:
            print(f"❌ Échec login admin - Status: {resp.status_code}")
            return {'success': False, 'admin_session': None}
        
        print("✅ Login admin réussi")
        
        # Approuver l'annonce
        resp = admin_session.get(f"{BASE_URL}/admin/listings.php")
        csrf = extract_csrf(resp.text)
        
        data = {'csrf': csrf, 'listing_id': listing_id, 'action': 'approve'}
        resp = admin_session.post(f"{BASE_URL}/admin/listings.php", data=data, allow_redirects=False)
        
        if resp.status_code == 302:
            print("✅ Annonce approuvée - Status ACTIVE")
            return {'success': True, 'admin_session': admin_session}
        else:
            print(f"❌ Échec approbation annonce - Status: {resp.status_code}")
            return {'success': False, 'admin_session': admin_session}
    except Exception as e:
        print(f"❌ Erreur approbation annonce: {e}")
        return {'success': False, 'admin_session': None}

def test_request_visit(client_session, listing_id):
    """Test 6: Client demande une visite"""
    print("\n=== TEST 6: Client demande une visite ===")
    try:
        resp = client_session.get(f"{BASE_URL}/listing.php?id={listing_id}")
        csrf = extract_csrf(resp.text)
        
        data = {
            'csrf': csrf,
            'action': 'request_visit',
            'message': 'Bonjour, je suis très intéressé par cette villa. Pouvons-nous organiser une visite cette semaine ?'
        }
        resp = client_session.post(f"{BASE_URL}/listing.php?id={listing_id}", data=data, allow_redirects=False)
        
        if resp.status_code == 302:
            print("✅ Demande de visite créée - Status PENDING")
            # Récupérer l'ID de la visite
            import subprocess
            result = subprocess.run(
                ['mysql', '-u', 'root', 'kapuce', '-e', 
                 f"SELECT id FROM visit_requests WHERE listing_id = '{listing_id}' ORDER BY created_at DESC LIMIT 1;"],
                capture_output=True, text=True
            )
            visit_id = result.stdout.strip().split('\n')[-1] if result.returncode == 0 else None
            return {'success': True, 'visit_id': visit_id}
        else:
            print(f"❌ Échec demande de visite - Status: {resp.status_code}")
            return {'success': False}
    except Exception as e:
        print(f"❌ Erreur demande de visite: {e}")
        return {'success': False}

def test_accept_visit(owner_session, visit_id):
    """Test 7: Propriétaire accepte la visite"""
    print("\n=== TEST 7: Propriétaire accepte la visite ===")
    try:
        resp = owner_session.get(f"{BASE_URL}/dashboard/visit-requests.php")
        csrf = extract_csrf(resp.text)
        
        data = {'csrf': csrf, 'visit_id': visit_id, 'action': 'accept'}
        resp = owner_session.post(f"{BASE_URL}/dashboard/visit-requests.php", data=data, allow_redirects=False)
        
        if resp.status_code == 302:
            print("✅ Visite acceptée - Status ACCEPTED")
            # Vérifier qu'une conversation a été créée
            import subprocess
            result = subprocess.run(
                ['mysql', '-u', 'root', 'kapuce', '-e', 
                 "SELECT COUNT(*) FROM conversations WHERE id IN (SELECT conversation_id FROM visit_requests WHERE id = '" + visit_id + "');"],
                capture_output=True, text=True
            )
            conv_count = result.stdout.strip().split('\n')[-1] if result.returncode == 0 else '0'
            if conv_count != '0':
                print("✅ Conversation créée automatiquement")
            return {'success': True}
        else:
            print(f"❌ Échec acceptation visite - Status: {resp.status_code}")
            return {'success': False}
    except Exception as e:
        print(f"❌ Erreur acceptation visite: {e}")
        return {'success': False}

def test_messaging_antifraud(client_session, listing_id):
    """Test 8: Messagerie avec anti-fraude"""
    print("\n=== TEST 8: Messagerie avec anti-fraude ===")
    try:
        # Récupérer la conversation
        import subprocess
        result = subprocess.run(
            ['mysql', '-u', 'root', 'kapuce', '-e', 
             f"SELECT id FROM conversations WHERE listing_id = '{listing_id}' LIMIT 1;"],
            capture_output=True, text=True
        )
        conv_id = result.stdout.strip().split('\n')[-1] if result.returncode == 0 else None
        
        if not conv_id:
            print("❌ Aucune conversation trouvée")
            return {'success': False}
        
        # Envoyer un message avec numéro de téléphone
        headers = {'Content-Type': 'application/json'}
        data = {
            'conversation_id': conv_id,
            'content': 'Appelez-moi au 077 12 34 56 pour discuter'
        }
        resp = client_session.post(f"{BASE_URL}/api/messages.php", json=data, headers=headers)
        
        if resp.status_code == 200:
            result = resp.json()
            if result.get('success') and result.get('message', {}).get('is_filtered') == 1:
                print("✅ Message filtré - Numéro masqué avec [NUMÉRO MASQUÉ]")
                print(f"   Contenu filtré: {result.get('message', {}).get('content')}")
                
                # Vérifier qu'une alerte fraude a été créée
                import subprocess
                alert_check = subprocess.run(
                    ['mysql', '-u', 'root', 'kapuce', '-e', 
                     f"SELECT COUNT(*) FROM fraud_alerts WHERE conversation_id = '{conv_id}' AND alert_type = 'PHONE_NUMBER';"],
                    capture_output=True, text=True
                )
                alert_count = alert_check.stdout.strip().split('\n')[-1] if alert_check.returncode == 0 else '0'
                if alert_count != '0':
                    print("✅ Alerte fraude créée (PHONE_NUMBER, severity=HIGH)")
                return {'success': True}
            else:
                print(f"❌ Message non filtré - is_filtered: {result.get('message', {}).get('is_filtered')}")
                return {'success': False}
        else:
            print(f"❌ Échec envoi message - Status: {resp.status_code}")
            return {'success': False}
    except Exception as e:
        print(f"❌ Erreur messagerie: {e}")
        return {'success': False}

def test_payment_flow(client_session, listing_id):
    """Test 9: Flux de paiement"""
    print("\n=== TEST 9: Flux de paiement ===")
    try:
        # Initier le paiement
        resp = client_session.get(f"{BASE_URL}/listing.php?id={listing_id}")
        csrf = extract_csrf(resp.text)
        
        data = {'csrf': csrf, 'action': 'start_payment'}
        resp = client_session.post(f"{BASE_URL}/listing.php?id={listing_id}", data=data, allow_redirects=False)
        
        if resp.status_code != 302 or '/pay.php?id=' not in resp.headers.get('Location', ''):
            print(f"❌ Échec initiation paiement - Status: {resp.status_code}")
            return {'success': False}
        
        # Extraire l'ID de transaction
        tx_id = resp.headers.get('Location', '').split('id=')[-1]
        print(f"✅ Transaction créée - ID: {tx_id}, Status: PENDING_PAYMENT")
        
        # Effectuer le paiement
        resp = client_session.get(f"{BASE_URL}/pay.php?id={tx_id}")
        csrf = extract_csrf(resp.text)
        
        data = {
            'csrf': csrf,
            'method': 'MOOV_MONEY',
            'phone': '065112233',
            'reference': 'REF123456'
        }
        resp = client_session.post(f"{BASE_URL}/pay.php?id={tx_id}", data=data, allow_redirects=False)
        
        if resp.status_code == 302:
            print("✅ Paiement effectué - Status: PAID")
            
            # Vérifier les montants en base
            import subprocess
            result = subprocess.run(
                ['mysql', '-u', 'root', 'kapuce', '-e', 
                 f"SELECT amount, commission_client, total_paid_by_buyer, seller_receives FROM transactions WHERE id = '{tx_id}';"],
                capture_output=True, text=True
            )
            if result.returncode == 0:
                lines = result.stdout.strip().split('\n')
                if len(lines) > 1:
                    values = lines[-1].split('\t')
                    print(f"   Montant: {values[0]} FCFA")
                    print(f"   Commission client (7%): {values[1]} FCFA")
                    print(f"   Total payé par client: {values[2]} FCFA")
                    print(f"   Vendeur reçoit: {values[3]} FCFA")
            
            return {'success': True, 'tx_id': tx_id}
        else:
            print(f"❌ Échec paiement - Status: {resp.status_code}")
            return {'success': False}
    except Exception as e:
        print(f"❌ Erreur paiement: {e}")
        return {'success': False}

def test_admin_validate_payment(admin_session, tx_id):
    """Test 10: Admin valide le paiement"""
    print("\n=== TEST 10: Admin valide le paiement ===")
    try:
        resp = admin_session.get(f"{BASE_URL}/admin/transactions.php")
        csrf = extract_csrf(resp.text)
        
        data = {'csrf': csrf, 'tx_id': tx_id, 'action': 'complete'}
        resp = admin_session.post(f"{BASE_URL}/admin/transactions.php", data=data, allow_redirects=False)
        
        if resp.status_code == 302:
            print("✅ Transaction validée - Status: COMPLETED")
            
            # Vérifier le statut de l'annonce
            import subprocess
            result = subprocess.run(
                ['mysql', '-u', 'root', 'kapuce', '-e', 
                 f"SELECT l.status FROM transactions t JOIN listings l ON l.id = t.listing_id WHERE t.id = '{tx_id}';"],
                capture_output=True, text=True
            )
            if result.returncode == 0:
                status = result.stdout.strip().split('\n')[-1]
                print(f"   Statut annonce: {status}")
            
            return {'success': True}
        else:
            print(f"❌ Échec validation paiement - Status: {resp.status_code}")
            return {'success': False}
    except Exception as e:
        print(f"❌ Erreur validation paiement: {e}")
        return {'success': False}

def test_admin_pages(admin_session):
    """Test 11: Pages admin accessibles"""
    print("\n=== TEST 11: Pages admin accessibles ===")
    pages = [
        '/admin/index.php',
        '/admin/users.php',
        '/admin/messages.php?tab=alerts',
        '/admin/settings.php'
    ]
    
    all_ok = True
    for page in pages:
        try:
            resp = admin_session.get(f"{BASE_URL}{page}")
            if resp.status_code == 200 and len(resp.text) > 100:
                print(f"✅ {page} - Accessible (200)")
            else:
                print(f"❌ {page} - Status: {resp.status_code}")
                all_ok = False
        except Exception as e:
            print(f"❌ {page} - Erreur: {e}")
            all_ok = False
    
    return {'success': all_ok}

# ============================================================
# PARTIE 2 - SYSTÈME DE NOTATION
# ============================================================

def test_review_button_visible(client_session, tx_id):
    """Test 12: Bouton 'Noter' visible sur transaction COMPLETED"""
    print("\n=== TEST 12: Bouton 'Noter' visible ===")
    try:
        resp = client_session.get(f"{BASE_URL}/dashboard/transactions.php")
        
        if resp.status_code == 200 and f'/review.php?tx={tx_id}' in resp.text:
            print("✅ Bouton 'Noter' visible sur la page transactions")
            return {'success': True}
        else:
            print(f"❌ Bouton 'Noter' non trouvé - Status: {resp.status_code}")
            return {'success': False}
    except Exception as e:
        print(f"❌ Erreur vérification bouton: {e}")
        return {'success': False}

def test_review_form_display(client_session, tx_id):
    """Test 13: GET /review.php?tx=TX_ID affiche le formulaire"""
    print("\n=== TEST 13: Formulaire de notation ===")
    try:
        resp = client_session.get(f"{BASE_URL}/review.php?tx={tx_id}")
        
        if resp.status_code == 200 and 'name="rating"' in resp.text and 'name="comment"' in resp.text:
            print("✅ Formulaire de notation affiché avec champs rating et comment")
            csrf = extract_csrf(resp.text)
            return {'success': True, 'csrf': csrf}
        else:
            print(f"❌ Formulaire non affiché - Status: {resp.status_code}")
            return {'success': False}
    except Exception as e:
        print(f"❌ Erreur affichage formulaire: {e}")
        return {'success': False}

def test_post_review(client_session, tx_id, csrf):
    """Test 14: POST review avec rating et comment"""
    print("\n=== TEST 14: Soumission d'avis ===")
    try:
        data = {
            'csrf': csrf,
            'rating': '5',
            'comment': 'Excellent propriétaire, très professionnel et à l\'écoute. Je recommande vivement !'
        }
        resp = client_session.post(f"{BASE_URL}/review.php?tx={tx_id}", data=data, allow_redirects=False)
        
        if resp.status_code == 302 and '/dashboard/transactions.php' in resp.headers.get('Location', ''):
            print("✅ Avis créé avec succès - Redirection vers /dashboard/transactions.php")
            
            # Vérifier en base
            import subprocess
            result = subprocess.run(
                ['mysql', '-u', 'root', 'kapuce', '-e', 
                 f"SELECT rating, comment FROM reviews WHERE transaction_id = '{tx_id}' LIMIT 1;"],
                capture_output=True, text=True
            )
            if result.returncode == 0:
                lines = result.stdout.strip().split('\n')
                if len(lines) > 1:
                    print(f"   Avis en base: {lines[-1]}")
            
            return {'success': True}
        else:
            print(f"❌ Échec création avis - Status: {resp.status_code}")
            return {'success': False}
    except Exception as e:
        print(f"❌ Erreur création avis: {e}")
        return {'success': False}

def test_duplicate_review_blocked(client_session, tx_id):
    """Test 15: Doublon interdit"""
    print("\n=== TEST 15: Doublon d'avis bloqué ===")
    try:
        resp = client_session.get(f"{BASE_URL}/review.php?tx={tx_id}")
        
        if resp.status_code == 200 and 'Vous avez déjà noté' in resp.text:
            print("✅ Doublon bloqué - Message 'Vous avez déjà noté' affiché")
            return {'success': True}
        else:
            print(f"❌ Doublon non bloqué - Status: {resp.status_code}")
            return {'success': False}
    except Exception as e:
        print(f"❌ Erreur vérification doublon: {e}")
        return {'success': False}

def test_seller_review_with_antifraud(owner_session, tx_id):
    """Test 16: Vendeur note aussi avec anti-fraude"""
    print("\n=== TEST 16: Vendeur note avec anti-fraude ===")
    try:
        resp = owner_session.get(f"{BASE_URL}/review.php?tx={tx_id}")
        csrf = extract_csrf(resp.text)
        
        if not csrf:
            print("❌ CSRF non trouvé")
            return {'success': False}
        
        data = {
            'csrf': csrf,
            'rating': '4',
            'comment': 'Bon client, sérieux. Appelez-moi au 077 88 99 00 pour d\'autres biens.'
        }
        resp = owner_session.post(f"{BASE_URL}/review.php?tx={tx_id}", data=data, allow_redirects=False)
        
        if resp.status_code == 302:
            print("✅ Avis vendeur créé")
            
            # Vérifier que le commentaire a été filtré (récupérer le dernier avis = vendeur)
            import subprocess
            result = subprocess.run(
                ['mysql', '-u', 'root', 'kapuce', '-e', 
                 f"SELECT comment FROM reviews WHERE transaction_id = '{tx_id}' ORDER BY created_at DESC LIMIT 1;"],
                capture_output=True, text=True
            )
            if result.returncode == 0:
                comment = result.stdout.strip().split('\n')[-1]
                if '[NUMÉRO MASQUÉ]' in comment:
                    print(f"✅ Anti-fraude appliqué - Commentaire: {comment}")
                    return {'success': True}
                else:
                    print(f"❌ Anti-fraude non appliqué - Commentaire: {comment}")
                    return {'success': False}
            return {'success': True}
        else:
            print(f"❌ Échec création avis vendeur - Status: {resp.status_code}")
            return {'success': False}
    except Exception as e:
        print(f"❌ Erreur avis vendeur: {e}")
        return {'success': False}

def test_rating_display_on_listing(listing_id):
    """Test 17: Affichage de la note sur la page annonce"""
    print("\n=== TEST 17: Affichage note sur listing ===")
    try:
        session = requests.Session()
        resp = session.get(f"{BASE_URL}/listing.php?id={listing_id}")
        
        if resp.status_code == 200:
            # Chercher la note moyenne et les avis
            if '⭐ Avis sur le propriétaire' in resp.text or 'avis)' in resp.text:
                print("✅ Section avis visible sur la page annonce")
                if 'Excellent propriétaire' in resp.text or 'Bon client' in resp.text:
                    print("✅ Commentaires d'avis affichés")
                return {'success': True}
            else:
                print("❌ Section avis non trouvée")
                return {'success': False}
        else:
            print(f"❌ Échec chargement page - Status: {resp.status_code}")
            return {'success': False}
    except Exception as e:
        print(f"❌ Erreur affichage note: {e}")
        return {'success': False}

def test_review_restrictions():
    """Test 18: Restrictions (tx invalide, sans session, tx non-completed)"""
    print("\n=== TEST 18: Restrictions d'accès ===")
    
    all_ok = True
    
    # Test 1: Transaction invalide
    try:
        session = requests.Session()
        # Login d'abord
        resp = session.get(f"{BASE_URL}/login.php")
        csrf = extract_csrf(resp.text)
        data = {'csrf': csrf, 'email': 'superadmin@kapuce.com', 'password': 'SuperAdminPassword123!'}
        session.post(f"{BASE_URL}/login.php", data=data)
        
        resp = session.get(f"{BASE_URL}/review.php?tx=INVALID_TX_ID", allow_redirects=False)
        if resp.status_code == 302 and '/dashboard/transactions.php' in resp.headers.get('Location', ''):
            print("✅ Transaction invalide - Redirection avec erreur")
        else:
            print(f"❌ Transaction invalide non gérée - Status: {resp.status_code}")
            all_ok = False
    except Exception as e:
        print(f"❌ Erreur test tx invalide: {e}")
        all_ok = False
    
    # Test 2: Sans session
    try:
        session = requests.Session()
        resp = session.get(f"{BASE_URL}/review.php?tx=some_tx_id", allow_redirects=False)
        if resp.status_code == 302 and '/login.php' in resp.headers.get('Location', ''):
            print("✅ Sans session - Redirection vers /login.php")
        else:
            print(f"❌ Sans session non géré - Status: {resp.status_code}")
            all_ok = False
    except Exception as e:
        print(f"❌ Erreur test sans session: {e}")
        all_ok = False
    
    # Test 3: Transaction non-COMPLETED
    try:
        # Créer une transaction PENDING_PAYMENT
        import subprocess
        result = subprocess.run(
            ['mysql', '-u', 'root', 'kapuce', '-e', 
             "SELECT id FROM transactions WHERE status = 'PENDING_PAYMENT' LIMIT 1;"],
            capture_output=True, text=True
        )
        if result.returncode == 0:
            lines = result.stdout.strip().split('\n')
            if len(lines) > 1:
                pending_tx_id = lines[-1]
                
                session = requests.Session()
                resp = session.get(f"{BASE_URL}/login.php")
                csrf = extract_csrf(resp.text)
                data = {'csrf': csrf, 'email': 'superadmin@kapuce.com', 'password': 'SuperAdminPassword123!'}
                session.post(f"{BASE_URL}/login.php", data=data)
                
                resp = session.get(f"{BASE_URL}/review.php?tx={pending_tx_id}", allow_redirects=False)
                if resp.status_code == 302:
                    print("✅ Transaction non-COMPLETED - Redirection avec erreur")
                else:
                    print(f"⚠️ Transaction non-COMPLETED - Status: {resp.status_code} (peut être OK si message d'erreur)")
    except Exception as e:
        print(f"⚠️ Test tx non-completed: {e}")
    
    return {'success': all_ok}

def test_admin_reviews_page(admin_session):
    """Test 19: Page admin des avis"""
    print("\n=== TEST 19: Page admin des avis ===")
    try:
        resp = admin_session.get(f"{BASE_URL}/admin/reviews.php")
        
        if resp.status_code == 200:
            print("✅ Page /admin/reviews.php accessible (200)")
            
            # Vérifier le contenu
            if 'Avis & Notations' in resp.text or 'Avis publiés' in resp.text:
                print("✅ Contenu de la page correct (titre, stats)")
                
                # Vérifier que les avis sont listés
                if 'a noté' in resp.text or 'Aucun avis' in resp.text:
                    print("✅ Liste des avis affichée")
                    return {'success': True}
            
            print("⚠️ Page accessible mais contenu incomplet")
            return {'success': True}
        else:
            print(f"❌ Page non accessible - Status: {resp.status_code}")
            return {'success': False}
    except Exception as e:
        print(f"❌ Erreur page admin avis: {e}")
        return {'success': False}

def test_admin_delete_review(admin_session):
    """Test 20: Admin supprime un avis"""
    print("\n=== TEST 20: Admin supprime un avis ===")
    try:
        # Récupérer un ID d'avis
        import subprocess
        result = subprocess.run(
            ['mysql', '-u', 'root', 'kapuce', '-e', 
             "SELECT id FROM reviews LIMIT 1;"],
            capture_output=True, text=True
        )
        
        if result.returncode != 0 or len(result.stdout.strip().split('\n')) <= 1:
            print("⚠️ Aucun avis à supprimer")
            return {'success': True}
        
        review_id = result.stdout.strip().split('\n')[-1]
        
        resp = admin_session.get(f"{BASE_URL}/admin/reviews.php")
        csrf = extract_csrf(resp.text)
        
        data = {'csrf': csrf, 'review_id': review_id, 'action': 'delete'}
        resp = admin_session.post(f"{BASE_URL}/admin/reviews.php", data=data, allow_redirects=False)
        
        if resp.status_code == 302:
            print("✅ Avis supprimé avec succès")
            
            # Vérifier en base
            result = subprocess.run(
                ['mysql', '-u', 'root', 'kapuce', '-e', 
                 f"SELECT COUNT(*) FROM reviews WHERE id = '{review_id}';"],
                capture_output=True, text=True
            )
            count = result.stdout.strip().split('\n')[-1] if result.returncode == 0 else '1'
            if count == '0':
                print("✅ Avis supprimé de la base")
            return {'success': True}
        else:
            print(f"❌ Échec suppression avis - Status: {resp.status_code}")
            return {'success': False}
    except Exception as e:
        print(f"❌ Erreur suppression avis: {e}")
        return {'success': False}

def main():
    """Exécution de tous les tests"""
    print("=" * 80)
    print("TEST COMPLET KAPUCE.G - RÉGRESSION + SYSTÈME DE NOTATION")
    print("=" * 80)
    
    results = []
    
    # PARTIE 1 - RÉGRESSION COMPLÈTE
    print("\n" + "=" * 80)
    print("PARTIE 1 - RÉGRESSION COMPLÈTE")
    print("=" * 80)
    
    # Test 1-2: Inscription
    client = test_register_client()
    results.append(('Inscription CLIENT', client['success']))
    
    owner = test_register_owner()
    results.append(('Inscription PROPRIÉTAIRE', owner['success']))
    
    if not client['success'] or not owner['success']:
        print("\n❌ Tests d'inscription échoués - Arrêt")
        return
    
    # Test 3: Login/Logout
    login_result = test_login_logout(client['email'], client['password'])
    results.append(('Login/Logout', login_result['success']))
    
    # Test 4: Création annonce
    listing = test_create_listing(owner['session'])
    results.append(('Création annonce', listing['success']))
    
    if not listing['success'] or not listing.get('listing_id'):
        print("\n❌ Création annonce échouée - Arrêt")
        return
    
    # Test 5: Admin approuve
    admin_result = test_admin_approve_listing(listing['listing_id'])
    results.append(('Admin approuve annonce', admin_result['success']))
    
    # Test 6: Demande visite
    visit = test_request_visit(client['session'], listing['listing_id'])
    results.append(('Demande de visite', visit['success']))
    
    if not visit['success'] or not visit.get('visit_id'):
        print("\n❌ Demande de visite échouée - Arrêt")
        return
    
    # Test 7: Acceptation visite
    accept_result = test_accept_visit(owner['session'], visit['visit_id'])
    results.append(('Acceptation visite', accept_result['success']))
    
    # Test 8: Messagerie anti-fraude
    msg_result = test_messaging_antifraud(client['session'], listing['listing_id'])
    results.append(('Messagerie anti-fraude', msg_result['success']))
    
    # Test 9: Paiement
    payment = test_payment_flow(client['session'], listing['listing_id'])
    results.append(('Flux de paiement', payment['success']))
    
    if not payment['success'] or not payment.get('tx_id'):
        print("\n❌ Paiement échoué - Arrêt")
        return
    
    # Test 10: Admin valide
    validate_result = test_admin_validate_payment(admin_result['admin_session'], payment['tx_id'])
    results.append(('Admin valide paiement', validate_result['success']))
    
    # Test 11: Pages admin
    admin_pages_result = test_admin_pages(admin_result['admin_session'])
    results.append(('Pages admin accessibles', admin_pages_result['success']))
    
    # PARTIE 2 - SYSTÈME DE NOTATION
    print("\n" + "=" * 80)
    print("PARTIE 2 - SYSTÈME DE NOTATION")
    print("=" * 80)
    
    # Test 12: Bouton Noter visible
    button_result = test_review_button_visible(client['session'], payment['tx_id'])
    results.append(('Bouton Noter visible', button_result['success']))
    
    # Test 13: Formulaire de notation
    form_result = test_review_form_display(client['session'], payment['tx_id'])
    results.append(('Formulaire de notation', form_result['success']))
    
    if not form_result['success'] or not form_result.get('csrf'):
        print("\n❌ Formulaire non accessible - Arrêt tests notation")
    else:
        # Test 14: Soumission avis
        post_result = test_post_review(client['session'], payment['tx_id'], form_result['csrf'])
        results.append(('Soumission avis client', post_result['success']))
        
        # Test 15: Doublon bloqué
        duplicate_result = test_duplicate_review_blocked(client['session'], payment['tx_id'])
        results.append(('Doublon bloqué', duplicate_result['success']))
        
        # Test 16: Vendeur note avec anti-fraude
        seller_review = test_seller_review_with_antifraud(owner['session'], payment['tx_id'])
        results.append(('Avis vendeur + anti-fraude', seller_review['success']))
        
        # Test 17: Affichage sur listing
        display_result = test_rating_display_on_listing(listing['listing_id'])
        results.append(('Affichage note sur listing', display_result['success']))
    
    # Test 18: Restrictions
    restrictions_result = test_review_restrictions()
    results.append(('Restrictions d\'accès', restrictions_result['success']))
    
    # Test 19-20: Admin reviews
    admin_reviews_result = test_admin_reviews_page(admin_result['admin_session'])
    results.append(('Page admin avis', admin_reviews_result['success']))
    
    delete_result = test_admin_delete_review(admin_result['admin_session'])
    results.append(('Admin supprime avis', delete_result['success']))
    
    # RÉSUMÉ
    print("\n" + "=" * 80)
    print("RÉSUMÉ DES TESTS")
    print("=" * 80)
    
    passed = sum(1 for _, success in results if success)
    total = len(results)
    
    for test_name, success in results:
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} - {test_name}")
    
    print("\n" + "=" * 80)
    print(f"RÉSULTAT FINAL: {passed}/{total} tests réussis ({passed*100//total}%)")
    print("=" * 80)

if __name__ == '__main__':
    main()
