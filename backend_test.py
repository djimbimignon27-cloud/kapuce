#!/usr/bin/env python3
"""
Test complet de KAPUCE.G - Version PHP sur http://localhost:8080
Base MySQL 'kapuce' avec admin seedé: superadmin@kapuce.com / SuperAdminPassword123!
"""

import requests
import re
import json
from bs4 import BeautifulSoup

BASE_URL = "http://localhost:8080"

# Sessions pour maintenir les cookies
client_session = requests.Session()
owner_session = requests.Session()
admin_session = requests.Session()

def extract_csrf(html):
    """Extrait le token CSRF du HTML"""
    soup = BeautifulSoup(html, 'html.parser')
    csrf_input = soup.find('input', {'name': 'csrf'})
    if csrf_input:
        return csrf_input.get('value')
    return None

def print_test(num, desc):
    print(f"\n{'='*80}")
    print(f"TEST {num}: {desc}")
    print('='*80)

def print_success(msg):
    print(f"✅ {msg}")

def print_error(msg):
    print(f"❌ {msg}")

def print_info(msg):
    print(f"ℹ️  {msg}")

# Variables globales pour stocker les IDs
listing_id = None
transaction_id = None
conversation_id = None

try:
    # ========================================================================
    # PARTIE 1 — RÉGRESSION FLUX COMPLET (nouveaux comptes)
    # ========================================================================
    
    print_test(1, "Inscription CLIENT (role=USER)")
    try:
        # Récupérer le formulaire pour obtenir le CSRF
        resp = client_session.get(f"{BASE_URL}/register.php")
        csrf = extract_csrf(resp.text)
        
        client_data = {
            'csrf': csrf,
            'full_name': 'Jean Client',
            'email': 'jean.client@test.com',
            'phone': '077123456',
            'password': 'ClientPass123!',
            'role': 'USER'
        }
        
        resp = client_session.post(f"{BASE_URL}/register.php", data=client_data, allow_redirects=False)
        
        if resp.status_code == 302:
            print_success(f"Inscription CLIENT réussie - Redirection vers {resp.headers.get('Location')}")
        else:
            print_error(f"Échec inscription CLIENT - Status: {resp.status_code}")
            print_info(f"Response: {resp.text[:500]}")
    except Exception as e:
        print_error(f"Exception lors de l'inscription CLIENT: {e}")
    
    print_test(2, "Inscription PROPRIÉTAIRE (role=OWNER)")
    try:
        # Récupérer le formulaire pour obtenir le CSRF
        resp = owner_session.get(f"{BASE_URL}/register.php")
        csrf = extract_csrf(resp.text)
        
        owner_data = {
            'csrf': csrf,
            'full_name': 'Marie Propriétaire',
            'email': 'marie.owner@test.com',
            'phone': '077654321',
            'password': 'OwnerPass123!',
            'role': 'OWNER'
        }
        
        resp = owner_session.post(f"{BASE_URL}/register.php", data=owner_data, allow_redirects=False)
        
        if resp.status_code == 302:
            print_success(f"Inscription PROPRIÉTAIRE réussie - Redirection vers {resp.headers.get('Location')}")
        else:
            print_error(f"Échec inscription PROPRIÉTAIRE - Status: {resp.status_code}")
            print_info(f"Response: {resp.text[:500]}")
    except Exception as e:
        print_error(f"Exception lors de l'inscription PROPRIÉTAIRE: {e}")
    
    print_test(3, "Propriétaire crée annonce (PENDING)")
    try:
        # Récupérer le formulaire pour obtenir le CSRF
        resp = owner_session.get(f"{BASE_URL}/dashboard/create-listing.php")
        csrf = extract_csrf(resp.text)
        
        listing_data = {
            'csrf': csrf,
            'type': 'HOUSE',
            'category': 'SALE',
            'sub_category': 'VILLA',
            'title': 'Belle villa moderne à Libreville',
            'description': 'Magnifique villa avec 4 chambres, piscine et jardin. Quartier calme et sécurisé.',
            'price': '1000000',
            'city': 'Libreville',
            'address': '123 Avenue de la Liberté',
            'neighborhood': 'Quartier Louis',
            'bedrooms': '4',
            'bathrooms': '3',
            'area': '250',
            'features': 'Piscine, Jardin, Garage'
        }
        
        resp = owner_session.post(f"{BASE_URL}/dashboard/create-listing.php", data=listing_data, allow_redirects=False)
        
        if resp.status_code == 302:
            print_success(f"Annonce créée - Redirection vers {resp.headers.get('Location')}")
            
            # Récupérer l'ID de l'annonce depuis la base de données
            import subprocess
            result = subprocess.run(
                ['mysql', '-u', 'root', 'kapuce', '-e', 
                 "SELECT id FROM listings WHERE title='Belle villa moderne à Libreville' ORDER BY created_at DESC LIMIT 1;"],
                capture_output=True, text=True
            )
            lines = result.stdout.strip().split('\n')
            if len(lines) > 1:
                listing_id = lines[1].strip()
                print_info(f"Listing ID: {listing_id}")
        else:
            print_error(f"Échec création annonce - Status: {resp.status_code}")
            print_info(f"Response: {resp.text[:500]}")
    except Exception as e:
        print_error(f"Exception lors de la création d'annonce: {e}")
    
    print_test(4, "Admin login et approbation annonce (PENDING → ACTIVE)")
    try:
        # Admin login
        resp = admin_session.get(f"{BASE_URL}/admin/login.php")
        csrf = extract_csrf(resp.text)
        
        admin_data = {
            'csrf': csrf,
            'email': 'superadmin@kapuce.com',
            'password': 'SuperAdminPassword123!'
        }
        
        resp = admin_session.post(f"{BASE_URL}/admin/login.php", data=admin_data, allow_redirects=False)
        
        if resp.status_code == 302:
            print_success("Admin login réussi")
            
            # Approuver l'annonce
            if listing_id:
                resp = admin_session.get(f"{BASE_URL}/admin/listings.php")
                csrf = extract_csrf(resp.text)
                
                approve_data = {
                    'csrf': csrf,
                    'listing_id': listing_id,
                    'action': 'approve'
                }
                
                resp = admin_session.post(f"{BASE_URL}/admin/listings.php", data=approve_data, allow_redirects=False)
                
                if resp.status_code == 302:
                    print_success("Annonce approuvée (PENDING → ACTIVE)")
                else:
                    print_error(f"Échec approbation - Status: {resp.status_code}")
            else:
                print_error("Pas de listing_id disponible pour approbation")
        else:
            print_error(f"Échec admin login - Status: {resp.status_code}")
    except Exception as e:
        print_error(f"Exception lors de l'approbation: {e}")
    
    print_test(5, "Client demande visite (PENDING)")
    try:
        if listing_id:
            resp = client_session.get(f"{BASE_URL}/listing.php?id={listing_id}")
            csrf = extract_csrf(resp.text)
            
            visit_data = {
                'csrf': csrf,
                'action': 'request_visit',
                'message': 'Bonjour, je suis intéressé par cette villa. Pouvons-nous organiser une visite?',
                'proposed_date': '2025-06-15 14:00:00'
            }
            
            resp = client_session.post(f"{BASE_URL}/listing.php?id={listing_id}", data=visit_data, allow_redirects=False)
            
            if resp.status_code == 302:
                print_success("Demande de visite créée (PENDING)")
            else:
                print_error(f"Échec demande visite - Status: {resp.status_code}")
                print_info(f"Response: {resp.text[:500]}")
        else:
            print_error("Pas de listing_id disponible")
    except Exception as e:
        print_error(f"Exception lors de la demande de visite: {e}")
    
    print_test(6, "Propriétaire accepte visite (ACCEPTED + conversation + message)")
    try:
        # Récupérer l'ID de la demande de visite
        import subprocess
        result = subprocess.run(
            ['mysql', '-u', 'root', 'kapuce', '-e', 
             f"SELECT id FROM visit_requests WHERE listing_id='{listing_id}' ORDER BY created_at DESC LIMIT 1;"],
            capture_output=True, text=True
        )
        lines = result.stdout.strip().split('\n')
        if len(lines) > 1:
            visit_id = lines[1].strip()
            print_info(f"Visit Request ID: {visit_id}")
            
            resp = owner_session.get(f"{BASE_URL}/dashboard/visit-requests.php")
            csrf = extract_csrf(resp.text)
            
            accept_data = {
                'csrf': csrf,
                'visit_id': visit_id,
                'action': 'accept'
            }
            
            resp = owner_session.post(f"{BASE_URL}/dashboard/visit-requests.php", data=accept_data, allow_redirects=False)
            
            if resp.status_code == 302:
                print_success("Visite acceptée (ACCEPTED)")
                
                # Vérifier la conversation créée
                result = subprocess.run(
                    ['mysql', '-u', 'root', 'kapuce', '-e', 
                     f"SELECT id FROM conversations WHERE listing_id='{listing_id}' LIMIT 1;"],
                    capture_output=True, text=True
                )
                lines = result.stdout.strip().split('\n')
                if len(lines) > 1:
                    conversation_id = lines[1].strip()
                    print_success(f"Conversation créée automatiquement - ID: {conversation_id}")
                else:
                    print_error("Conversation non créée")
            else:
                print_error(f"Échec acceptation visite - Status: {resp.status_code}")
        else:
            print_error("Demande de visite non trouvée")
    except Exception as e:
        print_error(f"Exception lors de l'acceptation de visite: {e}")
    
    print_test(7, "Messagerie anti-fraude: message avec numéro → [NUMÉRO MASQUÉ] + fraud_alert")
    try:
        if conversation_id:
            # Envoyer un message avec un numéro de téléphone
            message_data = {
                'conversation_id': conversation_id,
                'content': 'Parfait! Vous pouvez me joindre au 077 55 66 77 pour plus de détails.'
            }
            
            headers = {'Content-Type': 'application/json'}
            resp = client_session.post(f"{BASE_URL}/api/messages.php", 
                                      json=message_data, 
                                      headers=headers)
            
            if resp.status_code == 200:
                data = resp.json()
                if data.get('success'):
                    message = data.get('message', {})
                    if message.get('is_filtered') == 1:
                        print_success(f"Message filtré correctement: {message.get('content')}")
                        if '[NUMÉRO MASQUÉ]' in message.get('content', ''):
                            print_success("Numéro masqué avec [NUMÉRO MASQUÉ]")
                        
                        # Vérifier l'alerte de fraude créée
                        import subprocess
                        result = subprocess.run(
                            ['mysql', '-u', 'root', 'kapuce', '-e', 
                             "SELECT COUNT(*) FROM fraud_alerts WHERE alert_type='PHONE_NUMBER';"],
                            capture_output=True, text=True
                        )
                        lines = result.stdout.strip().split('\n')
                        if len(lines) > 1 and int(lines[1].strip()) > 0:
                            print_success("Alerte de fraude créée (PHONE_NUMBER)")
                        else:
                            print_error("Alerte de fraude non créée")
                    else:
                        print_error("Message non filtré")
                else:
                    print_error(f"Échec envoi message: {data.get('error')}")
            else:
                print_error(f"Échec envoi message - Status: {resp.status_code}")
        else:
            print_error("Pas de conversation_id disponible")
    except Exception as e:
        print_error(f"Exception lors du test anti-fraude: {e}")
    
    # ========================================================================
    # PARTIE 2 — NOUVEAU FLUX DE PAIEMENT
    # ========================================================================
    
    print_test(8, "Client démarre paiement (start_payment → /pay.php?id=TX_ID)")
    try:
        if listing_id:
            resp = client_session.get(f"{BASE_URL}/listing.php?id={listing_id}")
            csrf = extract_csrf(resp.text)
            
            payment_data = {
                'csrf': csrf,
                'action': 'start_payment'
            }
            
            resp = client_session.post(f"{BASE_URL}/listing.php?id={listing_id}", 
                                      data=payment_data, 
                                      allow_redirects=False)
            
            if resp.status_code == 302:
                location = resp.headers.get('Location', '')
                print_success(f"Paiement démarré - Redirection vers {location}")
                
                # Extraire l'ID de transaction de l'URL
                match = re.search(r'id=([a-f0-9-]+)', location)
                if match:
                    transaction_id = match.group(1)
                    print_info(f"Transaction ID: {transaction_id}")
                else:
                    print_error("Transaction ID non trouvé dans l'URL")
            else:
                print_error(f"Échec démarrage paiement - Status: {resp.status_code}")
        else:
            print_error("Pas de listing_id disponible")
    except Exception as e:
        print_error(f"Exception lors du démarrage paiement: {e}")
    
    print_test(9, "GET /pay.php?id=TX_ID affiche numéros KAPUCE.G et montants")
    try:
        if transaction_id:
            resp = client_session.get(f"{BASE_URL}/pay.php?id={transaction_id}")
            
            if resp.status_code == 200:
                html = resp.text
                
                # Vérifier les numéros officiels
                if '077 347 262' in html or '077347262' in html:
                    print_success("Numéro Airtel Money (077 347 262) affiché")
                else:
                    print_error("Numéro Airtel Money non trouvé")
                
                if '065 216 069' in html or '065216069' in html:
                    print_success("Numéro Moov Money (065 216 069) affiché")
                else:
                    print_error("Numéro Moov Money non trouvé")
                
                # Vérifier les montants
                if '1000000' in html or '1 000 000' in html:
                    print_success("Prix annonce (1000000) affiché")
                else:
                    print_info("Prix annonce non trouvé dans le format attendu")
                
                if '70000' in html or '70 000' in html or '7%' in html:
                    print_success("Frais client 7% affichés")
                else:
                    print_info("Frais client non trouvés dans le format attendu")
                
                if '1070000' in html or '1 070 000' in html:
                    print_success("Total à payer (1070000) affiché")
                else:
                    print_info("Total à payer non trouvé dans le format attendu")
                
                if '930000' in html or '930 000' in html:
                    print_success("Montant propriétaire (930000) affiché")
                else:
                    print_info("Montant propriétaire non trouvé dans le format attendu")
                
                # Vérifier le champ payment_reference
                if 'payment_reference' in html:
                    print_success("Champ payment_reference présent")
                else:
                    print_error("Champ payment_reference absent")
            else:
                print_error(f"Échec GET /pay.php - Status: {resp.status_code}")
        else:
            print_error("Pas de transaction_id disponible")
    except Exception as e:
        print_error(f"Exception lors du GET /pay.php: {e}")
    
    print_test(10, "POST /pay.php avec payment_reference → PAID")
    try:
        if transaction_id:
            resp = client_session.get(f"{BASE_URL}/pay.php?id={transaction_id}")
            csrf = extract_csrf(resp.text)
            
            payment_data = {
                'csrf': csrf,
                'method': 'AIRTEL_MONEY',
                'payment_reference': 'TXN987654321',
                'comment': 'Paiement effectué via Airtel Money'
            }
            
            resp = client_session.post(f"{BASE_URL}/pay.php?id={transaction_id}", 
                                      data=payment_data, 
                                      allow_redirects=False)
            
            if resp.status_code == 302:
                print_success("Paiement confirmé - Redirection")
                
                # Vérifier en base
                import subprocess
                result = subprocess.run(
                    ['mysql', '-u', 'root', 'kapuce', '-e', 
                     f"SELECT status, payment_reference, payment_method FROM transactions WHERE id='{transaction_id}';"],
                    capture_output=True, text=True
                )
                lines = result.stdout.strip().split('\n')
                if len(lines) > 1:
                    fields = lines[1].split('\t')
                    if len(fields) >= 3:
                        status, ref, method = fields[0], fields[1], fields[2]
                        if status == 'PAID':
                            print_success(f"Transaction status: PAID")
                        else:
                            print_error(f"Transaction status incorrect: {status}")
                        
                        if ref == 'TXN987654321':
                            print_success(f"Payment reference enregistrée: {ref}")
                        else:
                            print_error(f"Payment reference incorrecte: {ref}")
                        
                        if method == 'AIRTEL_MONEY':
                            print_success(f"Payment method: {method}")
                        else:
                            print_error(f"Payment method incorrect: {method}")
            else:
                print_error(f"Échec POST /pay.php - Status: {resp.status_code}")
                print_info(f"Response: {resp.text[:500]}")
        else:
            print_error("Pas de transaction_id disponible")
    except Exception as e:
        print_error(f"Exception lors du POST /pay.php: {e}")
    
    print_test(11, "POST /pay.php sans payment_reference → refusé")
    try:
        # Créer une nouvelle transaction pour ce test
        if listing_id:
            # Créer une deuxième annonce pour éviter les conflits
            resp = owner_session.get(f"{BASE_URL}/dashboard/create-listing.php")
            csrf = extract_csrf(resp.text)
            
            listing_data = {
                'csrf': csrf,
                'type': 'APARTMENT',
                'category': 'RENT',
                'sub_category': 'STUDIO',
                'title': 'Studio moderne centre-ville',
                'description': 'Beau studio meublé en plein centre-ville, proche de toutes commodités.',
                'price': '200000',
                'city': 'Libreville',
                'address': '456 Rue du Commerce',
                'neighborhood': 'Centre-ville',
                'bedrooms': '1',
                'bathrooms': '1',
                'area': '35'
            }
            
            resp = owner_session.post(f"{BASE_URL}/dashboard/create-listing.php", data=listing_data, allow_redirects=False)
            
            if resp.status_code == 302:
                # Récupérer l'ID de la nouvelle annonce
                import subprocess
                result = subprocess.run(
                    ['mysql', '-u', 'root', 'kapuce', '-e', 
                     "SELECT id FROM listings WHERE title='Studio moderne centre-ville' ORDER BY created_at DESC LIMIT 1;"],
                    capture_output=True, text=True
                )
                lines = result.stdout.strip().split('\n')
                if len(lines) > 1:
                    listing_id_2 = lines[1].strip()
                    
                    # Approuver l'annonce
                    resp = admin_session.get(f"{BASE_URL}/admin/listings.php")
                    csrf = extract_csrf(resp.text)
                    
                    approve_data = {
                        'csrf': csrf,
                        'listing_id': listing_id_2,
                        'action': 'approve'
                    }
                    
                    resp = admin_session.post(f"{BASE_URL}/admin/listings.php", data=approve_data, allow_redirects=False)
                    
                    # Démarrer le paiement
                    resp = client_session.get(f"{BASE_URL}/listing.php?id={listing_id_2}")
                    csrf = extract_csrf(resp.text)
                    
                    payment_data = {
                        'csrf': csrf,
                        'action': 'start_payment'
                    }
                    
                    resp = client_session.post(f"{BASE_URL}/listing.php?id={listing_id_2}", 
                                              data=payment_data, 
                                              allow_redirects=False)
                    
                    if resp.status_code == 302:
                        location = resp.headers.get('Location', '')
                        match = re.search(r'id=([a-f0-9-]+)', location)
                        if match:
                            transaction_id_2 = match.group(1)
                            
                            # Essayer de payer SANS payment_reference
                            resp = client_session.get(f"{BASE_URL}/pay.php?id={transaction_id_2}")
                            csrf = extract_csrf(resp.text)
                            
                            payment_data = {
                                'csrf': csrf,
                                'method': 'MOOV_MONEY',
                                'payment_reference': '',  # Vide
                                'comment': 'Test sans référence'
                            }
                            
                            resp = client_session.post(f"{BASE_URL}/pay.php?id={transaction_id_2}", 
                                                      data=payment_data, 
                                                      allow_redirects=False)
                            
                            # Vérifier que le statut n'a PAS changé
                            import subprocess
                            result = subprocess.run(
                                ['mysql', '-u', 'root', 'kapuce', '-e', 
                                 f"SELECT status FROM transactions WHERE id='{transaction_id_2}';"],
                                capture_output=True, text=True
                            )
                            lines = result.stdout.strip().split('\n')
                            if len(lines) > 1:
                                status = lines[1].strip()
                                if status == 'PENDING_PAYMENT':
                                    print_success("Paiement sans référence refusé - Status reste PENDING_PAYMENT")
                                else:
                                    print_error(f"Paiement accepté à tort - Status: {status}")
                            
                            # Vérifier la redirection avec erreur
                            if resp.status_code == 302:
                                location = resp.headers.get('Location', '')
                                if 'error' in location.lower() or 'pay.php' in location:
                                    print_success("Redirection avec erreur détectée")
                                else:
                                    print_info(f"Redirection vers: {location}")
        
        print_info("Test sans payment_reference complété")
    except Exception as e:
        print_error(f"Exception lors du test sans payment_reference: {e}")
    
    print_test(12, "Admin valide transaction (COMPLETED + annonce SOLD)")
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
                                     data=complete_data, 
                                     allow_redirects=False)
            
            if resp.status_code == 302:
                print_success("Transaction validée par admin")
                
                # Vérifier le statut de la transaction
                import subprocess
                result = subprocess.run(
                    ['mysql', '-u', 'root', 'kapuce', '-e', 
                     f"SELECT status FROM transactions WHERE id='{transaction_id}';"],
                    capture_output=True, text=True
                )
                lines = result.stdout.strip().split('\n')
                if len(lines) > 1:
                    status = lines[1].strip()
                    if status == 'COMPLETED':
                        print_success("Transaction status: COMPLETED")
                    else:
                        print_error(f"Transaction status incorrect: {status}")
                
                # Vérifier le statut de l'annonce
                result = subprocess.run(
                    ['mysql', '-u', 'root', 'kapuce', '-e', 
                     f"SELECT status FROM listings WHERE id='{listing_id}';"],
                    capture_output=True, text=True
                )
                lines = result.stdout.strip().split('\n')
                if len(lines) > 1:
                    status = lines[1].strip()
                    if status == 'SOLD':
                        print_success("Annonce status: SOLD")
                    else:
                        print_error(f"Annonce status incorrect: {status}")
            else:
                print_error(f"Échec validation transaction - Status: {resp.status_code}")
        else:
            print_error("Pas de transaction_id disponible")
    except Exception as e:
        print_error(f"Exception lors de la validation transaction: {e}")
    
    # ========================================================================
    # PARTIE 3 — NOTIFICATIONS (NOUVEAU)
    # ========================================================================
    
    print_test(13, "GET /api/notifications.php (propriétaire) → notifications")
    try:
        headers = {'Content-Type': 'application/json'}
        resp = owner_session.get(f"{BASE_URL}/api/notifications.php", headers=headers)
        
        if resp.status_code == 200:
            data = resp.json()
            if data.get('success'):
                notifications = data.get('notifications', [])
                count = data.get('count', 0)
                
                print_success(f"Notifications récupérées - Count: {count}")
                print_info(f"Nombre de notifications: {len(notifications)}")
                
                # Vérifier les types de notifications attendues
                notif_types = [n.get('type') for n in notifications]
                
                if 'VISIT_REQUEST' in notif_types:
                    print_success("Notification VISIT_REQUEST présente")
                else:
                    print_info("Notification VISIT_REQUEST non trouvée")
                
                if 'PAYMENT' in notif_types:
                    print_success("Notification PAYMENT présente")
                else:
                    print_info("Notification PAYMENT non trouvée")
                
                if 'TX_COMPLETED' in notif_types:
                    print_success("Notification TX_COMPLETED présente")
                else:
                    print_info("Notification TX_COMPLETED non trouvée")
            else:
                print_error(f"Échec récupération notifications: {data.get('error')}")
        else:
            print_error(f"Échec GET /api/notifications.php - Status: {resp.status_code}")
    except Exception as e:
        print_error(f"Exception lors du GET notifications propriétaire: {e}")
    
    print_test(14, "GET /api/notifications.php (client) → notifications")
    try:
        headers = {'Content-Type': 'application/json'}
        resp = client_session.get(f"{BASE_URL}/api/notifications.php", headers=headers)
        
        if resp.status_code == 200:
            data = resp.json()
            if data.get('success'):
                notifications = data.get('notifications', [])
                count = data.get('count', 0)
                
                print_success(f"Notifications client récupérées - Count: {count}")
                print_info(f"Nombre de notifications: {len(notifications)}")
                
                # Vérifier les types de notifications attendues
                notif_types = [n.get('type') for n in notifications]
                
                if 'VISIT_ACCEPTED' in notif_types:
                    print_success("Notification VISIT_ACCEPTED présente")
                else:
                    print_info("Notification VISIT_ACCEPTED non trouvée")
                
                if 'PAYMENT' in notif_types:
                    print_success("Notification PAYMENT présente")
                else:
                    print_info("Notification PAYMENT non trouvée")
                
                if 'TX_COMPLETED' in notif_types:
                    print_success("Notification TX_COMPLETED présente")
                else:
                    print_info("Notification TX_COMPLETED non trouvée")
            else:
                print_error(f"Échec récupération notifications: {data.get('error')}")
        else:
            print_error(f"Échec GET /api/notifications.php - Status: {resp.status_code}")
    except Exception as e:
        print_error(f"Exception lors du GET notifications client: {e}")
    
    print_test(15, "POST /api/notifications.php mark_read → count = 0")
    try:
        headers = {'Content-Type': 'application/json'}
        mark_read_data = {'action': 'mark_read'}
        
        resp = owner_session.post(f"{BASE_URL}/api/notifications.php", 
                                 json=mark_read_data, 
                                 headers=headers)
        
        if resp.status_code == 200:
            data = resp.json()
            if data.get('success'):
                print_success("Notifications marquées comme lues")
                
                # Vérifier que le count est maintenant 0
                resp = owner_session.get(f"{BASE_URL}/api/notifications.php", headers=headers)
                if resp.status_code == 200:
                    data = resp.json()
                    count = data.get('count', -1)
                    if count == 0:
                        print_success("Count = 0 après mark_read")
                    else:
                        print_error(f"Count incorrect après mark_read: {count}")
            else:
                print_error(f"Échec mark_read: {data.get('error')}")
        else:
            print_error(f"Échec POST mark_read - Status: {resp.status_code}")
    except Exception as e:
        print_error(f"Exception lors du mark_read: {e}")
    
    print_test(16, "GET /api/notifications.php sans session → 401")
    try:
        # Créer une nouvelle session sans authentification
        no_auth_session = requests.Session()
        headers = {'Content-Type': 'application/json'}
        
        resp = no_auth_session.get(f"{BASE_URL}/api/notifications.php", headers=headers)
        
        if resp.status_code == 401:
            print_success("401 Unauthorized sans session")
        else:
            print_error(f"Status incorrect sans session: {resp.status_code}")
    except Exception as e:
        print_error(f"Exception lors du test sans session: {e}")
    
    # ========================================================================
    # PARTIE 4 — FAVORIS (NOUVEAU)
    # ========================================================================
    
    print_test(17, "POST /api/favorites.php {listing_id} → favorited: true")
    try:
        if listing_id:
            headers = {'Content-Type': 'application/json'}
            favorite_data = {'listing_id': listing_id}
            
            resp = client_session.post(f"{BASE_URL}/api/favorites.php", 
                                      json=favorite_data, 
                                      headers=headers)
            
            if resp.status_code == 200:
                data = resp.json()
                if data.get('success') and data.get('favorited') == True:
                    print_success("Favori ajouté - favorited: true")
                    
                    # Vérifier en base
                    import subprocess
                    result = subprocess.run(
                        ['mysql', '-u', 'root', 'kapuce', '-e', 
                         f"SELECT COUNT(*) FROM favorites WHERE listing_id='{listing_id}';"],
                        capture_output=True, text=True
                    )
                    lines = result.stdout.strip().split('\n')
                    if len(lines) > 1 and int(lines[1].strip()) > 0:
                        print_success("Favori enregistré en base")
                    else:
                        print_error("Favori non enregistré en base")
                else:
                    print_error(f"Réponse incorrecte: {data}")
            else:
                print_error(f"Échec POST favorites - Status: {resp.status_code}")
        else:
            print_error("Pas de listing_id disponible")
    except Exception as e:
        print_error(f"Exception lors de l'ajout favori: {e}")
    
    print_test(18, "Re-POST /api/favorites.php → favorited: false (toggle)")
    try:
        if listing_id:
            headers = {'Content-Type': 'application/json'}
            favorite_data = {'listing_id': listing_id}
            
            resp = client_session.post(f"{BASE_URL}/api/favorites.php", 
                                      json=favorite_data, 
                                      headers=headers)
            
            if resp.status_code == 200:
                data = resp.json()
                if data.get('success') and data.get('favorited') == False:
                    print_success("Favori retiré - favorited: false")
                    
                    # Vérifier en base
                    import subprocess
                    result = subprocess.run(
                        ['mysql', '-u', 'root', 'kapuce', '-e', 
                         f"SELECT COUNT(*) FROM favorites WHERE listing_id='{listing_id}';"],
                        capture_output=True, text=True
                    )
                    lines = result.stdout.strip().split('\n')
                    if len(lines) > 1 and int(lines[1].strip()) == 0:
                        print_success("Favori supprimé de la base")
                    else:
                        print_error("Favori toujours en base")
                else:
                    print_error(f"Réponse incorrecte: {data}")
            else:
                print_error(f"Échec POST favorites - Status: {resp.status_code}")
        else:
            print_error("Pas de listing_id disponible")
    except Exception as e:
        print_error(f"Exception lors du toggle favori: {e}")
    
    print_test(19, "Re-POST pour remettre favori + GET /favorites.php → titre annonce")
    try:
        if listing_id:
            # Remettre en favori
            headers = {'Content-Type': 'application/json'}
            favorite_data = {'listing_id': listing_id}
            
            resp = client_session.post(f"{BASE_URL}/api/favorites.php", 
                                      json=favorite_data, 
                                      headers=headers)
            
            if resp.status_code == 200:
                data = resp.json()
                if data.get('success') and data.get('favorited') == True:
                    print_success("Favori remis")
                    
                    # GET /favorites.php
                    resp = client_session.get(f"{BASE_URL}/favorites.php")
                    
                    if resp.status_code == 200:
                        html = resp.text
                        if 'Belle villa moderne à Libreville' in html:
                            print_success("Titre de l'annonce présent dans /favorites.php")
                        else:
                            print_error("Titre de l'annonce non trouvé dans /favorites.php")
                    else:
                        print_error(f"Échec GET /favorites.php - Status: {resp.status_code}")
                else:
                    print_error(f"Échec remise favori: {data}")
            else:
                print_error(f"Échec POST favorites - Status: {resp.status_code}")
        else:
            print_error("Pas de listing_id disponible")
    except Exception as e:
        print_error(f"Exception lors du test GET favorites: {e}")
    
    print_test(20, "POST /api/favorites.php listing_id invalide → 404")
    try:
        headers = {'Content-Type': 'application/json'}
        favorite_data = {'listing_id': 'invalid-id-12345'}
        
        resp = client_session.post(f"{BASE_URL}/api/favorites.php", 
                                  json=favorite_data, 
                                  headers=headers)
        
        if resp.status_code == 404:
            print_success("404 pour listing_id invalide")
        else:
            print_error(f"Status incorrect pour listing_id invalide: {resp.status_code}")
    except Exception as e:
        print_error(f"Exception lors du test listing_id invalide: {e}")
    
    print_test(21, "POST /api/favorites.php sans session → 401")
    try:
        no_auth_session = requests.Session()
        headers = {'Content-Type': 'application/json'}
        favorite_data = {'listing_id': listing_id}
        
        resp = no_auth_session.post(f"{BASE_URL}/api/favorites.php", 
                                   json=favorite_data, 
                                   headers=headers)
        
        if resp.status_code == 401:
            print_success("401 Unauthorized sans session")
        else:
            print_error(f"Status incorrect sans session: {resp.status_code}")
    except Exception as e:
        print_error(f"Exception lors du test sans session: {e}")
    
    # ========================================================================
    # PARTIE 5 — VÉRIFICATIONS PAGES (design refondu)
    # ========================================================================
    
    print_test(22, "Vérification pages publiques (200, pas d'erreur PHP)")
    try:
        pages = [
            ('/', 'Accueil'),
            ('/listings.php', 'Listings'),
            (f'/listing.php?id={listing_id}', 'Détail annonce'),
            ('/login.php', 'Login'),
            ('/register.php', 'Register')
        ]
        
        for path, name in pages:
            try:
                resp = requests.get(f"{BASE_URL}{path}")
                if resp.status_code == 200:
                    html = resp.text
                    if 'Fatal error' in html or 'Warning:' in html or 'Parse error' in html:
                        print_error(f"{name} ({path}): Erreur PHP détectée")
                    else:
                        print_success(f"{name} ({path}): 200 OK, pas d'erreur PHP")
                else:
                    print_error(f"{name} ({path}): Status {resp.status_code}")
            except Exception as e:
                print_error(f"{name} ({path}): Exception {e}")
    except Exception as e:
        print_error(f"Exception lors de la vérification pages publiques: {e}")
    
    print_test(23, "Vérification pages authentifiées (200, pas d'erreur PHP)")
    try:
        pages = [
            ('/favorites.php', 'Favoris', client_session),
            ('/dashboard/index.php', 'Dashboard', client_session),
            ('/messages.php', 'Messages', client_session)
        ]
        
        for path, name, session in pages:
            try:
                resp = session.get(f"{BASE_URL}{path}")
                if resp.status_code == 200:
                    html = resp.text
                    if 'Fatal error' in html or 'Warning:' in html or 'Parse error' in html:
                        print_error(f"{name} ({path}): Erreur PHP détectée")
                    else:
                        print_success(f"{name} ({path}): 200 OK, pas d'erreur PHP")
                else:
                    print_error(f"{name} ({path}): Status {resp.status_code}")
            except Exception as e:
                print_error(f"{name} ({path}): Exception {e}")
    except Exception as e:
        print_error(f"Exception lors de la vérification pages authentifiées: {e}")
    
    print_test(24, "Vérification pages admin (200, pas d'erreur PHP)")
    try:
        pages = [
            ('/admin/index.php', 'Admin Dashboard'),
            ('/admin/reviews.php', 'Admin Reviews')
        ]
        
        for path, name in pages:
            try:
                resp = admin_session.get(f"{BASE_URL}{path}")
                if resp.status_code == 200:
                    html = resp.text
                    if 'Fatal error' in html or 'Warning:' in html or 'Parse error' in html:
                        print_error(f"{name} ({path}): Erreur PHP détectée")
                    else:
                        print_success(f"{name} ({path}): 200 OK, pas d'erreur PHP")
                else:
                    print_error(f"{name} ({path}): Status {resp.status_code}")
            except Exception as e:
                print_error(f"{name} ({path}): Exception {e}")
    except Exception as e:
        print_error(f"Exception lors de la vérification pages admin: {e}")
    
    print_test(25, "Footer: vérifier numéros de contact (077347262, 065216069)")
    try:
        resp = requests.get(f"{BASE_URL}/")
        if resp.status_code == 200:
            html = resp.text
            
            if '077347262' in html or '077 347 262' in html:
                print_success("Numéro Airtel (077347262) présent dans le footer")
            else:
                print_error("Numéro Airtel non trouvé dans le footer")
            
            if '065216069' in html or '065 216 069' in html:
                print_success("Numéro Moov (065216069) présent dans le footer")
            else:
                print_error("Numéro Moov non trouvé dans le footer")
        else:
            print_error(f"Échec GET / - Status: {resp.status_code}")
    except Exception as e:
        print_error(f"Exception lors de la vérification footer: {e}")
    
    print("\n" + "="*80)
    print("TESTS TERMINÉS")
    print("="*80)

except Exception as e:
    print(f"\n❌ ERREUR GLOBALE: {e}")
    import traceback
    traceback.print_exc()
