#!/usr/bin/env python3
"""
Test de modification des commissions par transaction - KAPUCE.G
Tests pour la nouvelle fonctionnalité admin de modification de commission
"""

import requests
import json
import time
from datetime import datetime

# Configuration
BASE_URL = "https://digital-marketplace-186.preview.emergentagent.com/api"
ADMIN_EMAIL = "superadmin@kapuce.com"
ADMIN_PASSWORD = "SuperAdminPassword123!"

# Test data storage
test_data = {
    "admin_token": None,
    "buyer_token": None,
    "seller_token": None,
    "buyer_id": None,
    "seller_id": None,
    "listing_id": None,
    "transaction_id": None,
}

def print_test_header(test_name):
    """Print formatted test header"""
    print(f"\n{'='*80}")
    print(f"TEST: {test_name}")
    print(f"{'='*80}")

def print_result(success, message):
    """Print test result"""
    status = "✅ PASS" if success else "❌ FAIL"
    print(f"{status}: {message}")

def print_response(response):
    """Print response details for debugging"""
    print(f"Status: {response.status_code}")
    try:
        print(f"Response: {json.dumps(response.json(), indent=2)}")
    except:
        print(f"Response Text: {response.text[:500]}")

# ============================================================================
# SETUP TESTS
# ============================================================================

def test_admin_login():
    """Test admin authentication"""
    print_test_header("1. Admin Login")
    try:
        response = requests.post(
            f"{BASE_URL}/admin/auth/login",
            json={
                "email": ADMIN_EMAIL,
                "password": ADMIN_PASSWORD
            },
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 200:
            data = response.json()
            if "accessToken" in data:
                test_data["admin_token"] = data["accessToken"]
                print_result(True, f"Admin logged in successfully. Role: {data.get('user', {}).get('role')}")
                return True
            else:
                print_result(False, "No access token in response")
                print_response(response)
                return False
        else:
            print_result(False, f"Login failed with status {response.status_code}")
            print_response(response)
            return False
    except Exception as e:
        print_result(False, f"Exception: {str(e)}")
        return False

def test_create_buyer():
    """Create a test buyer"""
    print_test_header("2. Create Buyer User")
    try:
        timestamp = int(time.time())
        email = f"buyer_{timestamp}@kapuce.test"
        
        response = requests.post(
            f"{BASE_URL}/auth/register",
            json={
                "email": email,
                "password": "BuyerPassword123!",
                "fullName": "Acheteur Test",
                "phone": "0771234567",
                "role": "USER"
            },
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 201:
            data = response.json()
            if "accessToken" in data:
                test_data["buyer_token"] = data["accessToken"]
                test_data["buyer_id"] = data["user"].get("_id") or data["user"].get("id")
                print_result(True, f"Buyer created: {email}, ID: {test_data['buyer_id']}")
                return True
            else:
                print_result(False, "No access token in response")
                print_response(response)
                return False
        else:
            print_result(False, f"Registration failed with status {response.status_code}")
            print_response(response)
            return False
    except Exception as e:
        print_result(False, f"Exception: {str(e)}")
        return False

def test_create_seller():
    """Create a test seller"""
    print_test_header("3. Create Seller User")
    try:
        timestamp = int(time.time())
        email = f"seller_{timestamp}@kapuce.test"
        
        response = requests.post(
            f"{BASE_URL}/auth/register",
            json={
                "email": email,
                "password": "SellerPassword123!",
                "fullName": "Vendeur Test",
                "phone": "0771234568",
                "role": "USER"
            },
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 201:
            data = response.json()
            if "accessToken" in data:
                test_data["seller_token"] = data["accessToken"]
                test_data["seller_id"] = data["user"].get("_id") or data["user"].get("id")
                print_result(True, f"Seller created: {email}, ID: {test_data['seller_id']}")
                return True
            else:
                print_result(False, "No access token in response")
                print_response(response)
                return False
        else:
            print_result(False, f"Registration failed with status {response.status_code}")
            print_response(response)
            return False
    except Exception as e:
        print_result(False, f"Exception: {str(e)}")
        return False

def test_create_listing():
    """Create a test listing"""
    print_test_header("4. Create Test Listing")
    try:
        response = requests.post(
            f"{BASE_URL}/listings",
            json={
                "title": "Appartement Test Commission",
                "description": "Appartement pour tester la modification de commission",
                "type": "HOUSE",
                "category": "RENT",
                "subCategory": "APARTMENT",
                "price": 100000,
                "city": "Libreville",
                "neighborhood": "Centre-ville",
                "address": "Test Address",
                "propertyDetails": {
                    "bedrooms": 2,
                    "bathrooms": 1,
                    "surface": 50
                }
            },
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {test_data['seller_token']}"
            }
        )
        
        if response.status_code in [200, 201]:
            data = response.json()
            listing = data.get("listing") or data
            test_data["listing_id"] = listing.get("_id") or listing.get("id")
            print_result(True, f"Listing created: {test_data['listing_id']}")
            return True
        else:
            print_result(False, f"Failed with status {response.status_code}")
            print_response(response)
            return False
    except Exception as e:
        print_result(False, f"Exception: {str(e)}")
        return False

def test_create_transaction():
    """Create a test transaction via regular transactions endpoint"""
    print_test_header("5. Create Test Transaction (POST /api/transactions)")
    try:
        # Manually activate the listing using MongoDB
        import subprocess
        activate_cmd = f"""
cd /app && node -e "
const mongoose = require('mongoose');
const Listing = require('./lib/models/Listing').default;
mongoose.connect(process.env.MONGO_URL || 'mongodb://localhost:27017', {{
  dbName: process.env.DB_NAME || 'kapuce_marketplace'
}}).then(async () => {{
  await Listing.findByIdAndUpdate('{test_data["listing_id"]}', {{ status: 'ACTIVE' }});
  console.log('Listing activated');
  process.exit(0);
}}).catch(err => {{
  console.error('Error:', err.message);
  process.exit(1);
}});
"
"""
        subprocess.run(activate_cmd, shell=True, capture_output=True, timeout=10)
        
        # Now create the transaction using regular endpoint
        response = requests.post(
            f"{BASE_URL}/transactions",
            json={
                "listingId": test_data["listing_id"],
                "paymentMethod": "AIRTEL_MONEY"
            },
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {test_data['buyer_token']}"
            }
        )
        
        if response.status_code in [200, 201]:
            data = response.json()
            if data.get("success"):
                transaction = data.get("transaction", {})
                test_data["transaction_id"] = transaction.get("_id") or transaction.get("id")
                
                # Vérifier les valeurs initiales
                initial_rate = transaction.get("commissionRate", 0)
                initial_commission = transaction.get("commissionAmount", 0)
                initial_seller_receives = transaction.get("sellerReceives", 0)
                
                print_result(True, f"Transaction created: {test_data['transaction_id']}")
                print(f"  Montant: {transaction.get('amount')} FCFA")
                print(f"  Commission initiale: {initial_rate}% = {initial_commission} FCFA")
                print(f"  Vendeur reçoit: {initial_seller_receives} FCFA")
                return True
            else:
                print_result(False, "No success flag in response")
                print_response(response)
                return False
        else:
            print_result(False, f"Failed with status {response.status_code}")
            print_response(response)
            return False
    except Exception as e:
        print_result(False, f"Exception: {str(e)}")
        return False

# ============================================================================
# COMMISSION MODIFICATION TESTS
# ============================================================================

def test_get_transactions_list():
    """Test GET /api/admin/transactions - Verify transaction appears in list"""
    print_test_header("6. Get Transactions List (GET /api/admin/transactions)")
    try:
        response = requests.get(
            f"{BASE_URL}/admin/transactions",
            headers={
                "Authorization": f"Bearer {test_data['admin_token']}"
            }
        )
        
        if response.status_code == 200:
            data = response.json()
            if data.get("success") and "transactions" in data:
                transactions = data["transactions"]
                print_result(True, f"Retrieved {len(transactions)} transaction(s)")
                
                # Vérifier que notre transaction est dans la liste
                our_tx = next((tx for tx in transactions if tx.get("_id") == test_data["transaction_id"]), None)
                if our_tx:
                    print(f"  Notre transaction trouvée:")
                    print(f"    ID: {our_tx.get('_id')}")
                    print(f"    Montant: {our_tx.get('amount')} FCFA")
                    print(f"    Commission: {our_tx.get('commissionRate')}% = {our_tx.get('commissionAmount')} FCFA")
                    return True
                else:
                    print_result(False, "Notre transaction n'est pas dans la liste")
                    return False
            else:
                print_result(False, "Invalid response structure")
                print_response(response)
                return False
        else:
            print_result(False, f"Failed with status {response.status_code}")
            print_response(response)
            return False
    except Exception as e:
        print_result(False, f"Exception: {str(e)}")
        return False

def test_modify_commission_valid():
    """Test PUT /api/admin/transactions - Modify commission from 7% to 5%"""
    print_test_header("7. Modify Commission (7% → 5%) - Valid Rate")
    try:
        response = requests.put(
            f"{BASE_URL}/admin/transactions",
            json={
                "transactionId": test_data["transaction_id"],
                "action": "update_commission",
                "commissionRate": 5,
                "adminNotes": "Promotion client fidèle"
            },
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {test_data['admin_token']}"
            }
        )
        
        if response.status_code == 200:
            data = response.json()
            if data.get("success"):
                new_commission = data.get("newCommissionAmount")
                new_net = data.get("newNetAmount")
                
                # Vérifier le calcul
                # Montant: 100000 FCFA
                # Commission 5%: 5000 FCFA
                # Vendeur reçoit: 95000 FCFA
                expected_commission = 5000
                expected_net = 95000
                
                if new_commission == expected_commission and new_net == expected_net:
                    print_result(True, "Commission modifiée correctement")
                    print(f"  Nouvelle commission: 5% = {new_commission} FCFA")
                    print(f"  Vendeur reçoit: {new_net} FCFA")
                    print(f"  Notes admin: Promotion client fidèle")
                    return True
                else:
                    print_result(False, f"Calcul incorrect. Attendu: {expected_commission}/{expected_net}, Reçu: {new_commission}/{new_net}")
                    return False
            else:
                print_result(False, "No success flag in response")
                print_response(response)
                return False
        else:
            print_result(False, f"Failed with status {response.status_code}")
            print_response(response)
            return False
    except Exception as e:
        print_result(False, f"Exception: {str(e)}")
        return False

def test_verify_commission_persisted():
    """Verify the commission change was persisted in database"""
    print_test_header("8. Verify Commission Persisted in Database")
    try:
        response = requests.get(
            f"{BASE_URL}/admin/transactions",
            headers={
                "Authorization": f"Bearer {test_data['admin_token']}"
            }
        )
        
        if response.status_code == 200:
            data = response.json()
            transactions = data.get("transactions", [])
            our_tx = next((tx for tx in transactions if tx.get("_id") == test_data["transaction_id"]), None)
            
            if our_tx:
                rate = our_tx.get("commissionRate")
                commission = our_tx.get("commissionAmount")
                
                if rate == 5 and commission == 5000:
                    print_result(True, "Commission correctement enregistrée en base")
                    print(f"  Taux: {rate}%")
                    print(f"  Montant: {commission} FCFA")
                    return True
                else:
                    print_result(False, f"Commission non mise à jour. Rate: {rate}, Amount: {commission}")
                    return False
            else:
                print_result(False, "Transaction non trouvée")
                return False
        else:
            print_result(False, f"Failed with status {response.status_code}")
            print_response(response)
            return False
    except Exception as e:
        print_result(False, f"Exception: {str(e)}")
        return False

def test_modify_commission_negative():
    """Test PUT /api/admin/transactions - Invalid negative rate (should return 400)"""
    print_test_header("9. Modify Commission - Invalid Negative Rate (should fail)")
    try:
        response = requests.put(
            f"{BASE_URL}/admin/transactions",
            json={
                "transactionId": test_data["transaction_id"],
                "action": "update_commission",
                "commissionRate": -5,
                "adminNotes": "Test taux négatif"
            },
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {test_data['admin_token']}"
            }
        )
        
        if response.status_code == 400:
            data = response.json()
            error_msg = data.get("error", "")
            if "invalide" in error_msg.lower() or "0-100" in error_msg:
                print_result(True, f"Taux négatif correctement rejeté: {error_msg}")
                return True
            else:
                print_result(False, f"Mauvais message d'erreur: {error_msg}")
                return False
        else:
            print_result(False, f"Expected 400, got {response.status_code}")
            print_response(response)
            return False
    except Exception as e:
        print_result(False, f"Exception: {str(e)}")
        return False

def test_modify_commission_over_100():
    """Test PUT /api/admin/transactions - Invalid rate > 100 (should return 400)"""
    print_test_header("10. Modify Commission - Invalid Rate > 100 (should fail)")
    try:
        response = requests.put(
            f"{BASE_URL}/admin/transactions",
            json={
                "transactionId": test_data["transaction_id"],
                "action": "update_commission",
                "commissionRate": 150,
                "adminNotes": "Test taux > 100"
            },
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {test_data['admin_token']}"
            }
        )
        
        if response.status_code == 400:
            data = response.json()
            error_msg = data.get("error", "")
            if "invalide" in error_msg.lower() or "0-100" in error_msg:
                print_result(True, f"Taux > 100 correctement rejeté: {error_msg}")
                return True
            else:
                print_result(False, f"Mauvais message d'erreur: {error_msg}")
                return False
        else:
            print_result(False, f"Expected 400, got {response.status_code}")
            print_response(response)
            return False
    except Exception as e:
        print_result(False, f"Exception: {str(e)}")
        return False

def test_non_admin_cannot_modify():
    """Test that non-admin users cannot modify commissions"""
    print_test_header("11. Non-Admin Cannot Modify Commission (should fail)")
    try:
        response = requests.put(
            f"{BASE_URL}/admin/transactions",
            json={
                "transactionId": test_data["transaction_id"],
                "action": "update_commission",
                "commissionRate": 3,
                "adminNotes": "Tentative non-admin"
            },
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {test_data['buyer_token']}"
            }
        )
        
        if response.status_code in [401, 403]:
            data = response.json()
            error_msg = data.get("error", "")
            print_result(True, f"Non-admin correctement bloqué: {error_msg}")
            return True
        else:
            print_result(False, f"Expected 401/403, got {response.status_code}")
            print_response(response)
            return False
    except Exception as e:
        print_result(False, f"Exception: {str(e)}")
        return False

# ============================================================================
# MAIN TEST RUNNER
# ============================================================================

def run_all_tests():
    """Run all commission modification tests"""
    print("\n" + "="*80)
    print("KAPUCE.G - TEST MODIFICATION DES COMMISSIONS PAR TRANSACTION")
    print("="*80)
    print(f"Base URL: {BASE_URL}")
    print(f"Admin: {ADMIN_EMAIL}")
    print(f"Start Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("="*80)
    
    results = {}
    
    # Setup
    results["1. Admin Login"] = test_admin_login()
    if not results["1. Admin Login"]:
        print("\n❌ ERREUR CRITIQUE: Impossible de se connecter en tant qu'admin")
        return results
    
    results["2. Create Buyer"] = test_create_buyer()
    results["3. Create Seller"] = test_create_seller()
    results["4. Create Listing"] = test_create_listing()
    results["5. Create Transaction"] = test_create_transaction()
    
    # Main tests
    results["6. Get Transactions List"] = test_get_transactions_list()
    results["7. Modify Commission (7% → 5%)"] = test_modify_commission_valid()
    results["8. Verify Commission Persisted"] = test_verify_commission_persisted()
    results["9. Invalid Negative Rate"] = test_modify_commission_negative()
    results["10. Invalid Rate > 100"] = test_modify_commission_over_100()
    results["11. Non-Admin Cannot Modify"] = test_non_admin_cannot_modify()
    
    # Summary
    print("\n" + "="*80)
    print("RÉSUMÉ DES TESTS")
    print("="*80)
    
    passed = sum(1 for v in results.values() if v)
    total = len(results)
    
    for test_name, result in results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status}: {test_name}")
    
    print("="*80)
    print(f"TOTAL: {passed}/{total} tests passed ({(passed/total*100):.1f}%)")
    print(f"End Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("="*80)
    
    # Detailed results
    print("\n" + "="*80)
    print("RÉSULTATS DÉTAILLÉS")
    print("="*80)
    print(f"✅ Tests réussis: {passed}")
    print(f"❌ Tests échoués: {total - passed}")
    
    if passed == total:
        print("\n🎉 TOUS LES TESTS SONT PASSÉS!")
        print("✅ La fonctionnalité de modification de commission fonctionne correctement")
    else:
        print("\n⚠️ CERTAINS TESTS ONT ÉCHOUÉ")
        failed_tests = [name for name, result in results.items() if not result]
        print("Tests échoués:")
        for test in failed_tests:
            print(f"  - {test}")
    
    print("="*80)
    
    return results

if __name__ == "__main__":
    run_all_tests()
