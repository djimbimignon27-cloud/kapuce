#!/usr/bin/env python3
"""
KAPUCE.G Backend API Testing - Review Request
Tests specific endpoints requested in the review.
"""

import requests
import json
import time
from datetime import datetime

class KAPUCEBackendTester:
    def __init__(self):
        self.base_url = "https://digital-marketplace-186.preview.emergentagent.com/api"
        self.headers = {"Content-Type": "application/json"}
        self.user_token = None
        self.admin_token = None
        self.test_user_email = None
        self.test_listing_id = None
        self.test_results = []
        
    def log_test(self, test_name, success, details="", response_data=None):
        """Log test results"""
        result = {
            "test": test_name,
            "success": success,
            "details": details,
            "response_data": response_data,
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}")
        if details:
            print(f"   Details: {details}")
        if response_data and not success:
            print(f"   Response: {json.dumps(response_data, indent=2)}")
        
    def test_1_register_user(self):
        """Test 1: POST /api/auth/register - Créer un utilisateur de test"""
        print("\n=== TEST 1: Inscription d'un nouvel utilisateur ===")
        
        # Generate unique email with timestamp
        timestamp = int(time.time())
        self.test_user_email = f"proprietaire.gabon.{timestamp}@kapuce.com"
        
        register_data = {
            "fullName": "Marie Ondimba",
            "email": self.test_user_email,
            "phone": "+241077456789",
            "password": "MarieKapuce2024!",
            "role": "OWNER"
        }
        
        try:
            response = requests.post(
                f"{self.base_url}/auth/register", 
                json=register_data, 
                headers=self.headers, 
                timeout=15
            )
            
            if response.status_code == 201:
                data = response.json()
                if 'accessToken' in data and 'user' in data:
                    self.user_token = data['accessToken']
                    self.log_test(
                        "POST /api/auth/register", 
                        True, 
                        f"Utilisateur créé: {data['user'].get('email')} (role: {data['user'].get('role')})",
                        {"user_id": data['user'].get('id'), "email": data['user'].get('email')}
                    )
                    return True
                else:
                    self.log_test(
                        "POST /api/auth/register", 
                        False, 
                        "Réponse invalide - accessToken ou user manquant",
                        data
                    )
                    return False
            else:
                self.log_test(
                    "POST /api/auth/register", 
                    False, 
                    f"Status code: {response.status_code}",
                    response.json() if response.text else None
                )
                return False
                
        except Exception as e:
            self.log_test("POST /api/auth/register", False, f"Erreur: {str(e)}")
            return False
    
    def test_2_login_user(self):
        """Test 2: POST /api/auth/login - Se connecter et récupérer le token"""
        print("\n=== TEST 2: Connexion utilisateur ===")
        
        if not self.test_user_email:
            self.log_test("POST /api/auth/login", False, "Email de test non disponible")
            return False
        
        login_data = {
            "email": self.test_user_email,
            "password": "MarieKapuce2024!"
        }
        
        try:
            response = requests.post(
                f"{self.base_url}/auth/login", 
                json=login_data, 
                headers=self.headers, 
                timeout=15
            )
            
            if response.status_code == 200:
                data = response.json()
                if 'accessToken' in data:
                    self.user_token = data['accessToken']
                    self.log_test(
                        "POST /api/auth/login", 
                        True, 
                        f"Connexion réussie - Token JWT reçu",
                        {"user": data.get('user', {}).get('email')}
                    )
                    return True
                else:
                    self.log_test(
                        "POST /api/auth/login", 
                        False, 
                        "accessToken manquant dans la réponse",
                        data
                    )
                    return False
            else:
                self.log_test(
                    "POST /api/auth/login", 
                    False, 
                    f"Status code: {response.status_code}",
                    response.json() if response.text else None
                )
                return False
                
        except Exception as e:
            self.log_test("POST /api/auth/login", False, f"Erreur: {str(e)}")
            return False
    
    def test_3_get_listings(self):
        """Test 3: GET /api/listings - Liste des annonces"""
        print("\n=== TEST 3: Récupération de la liste des annonces ===")
        
        try:
            response = requests.get(
                f"{self.base_url}/listings", 
                timeout=15
            )
            
            if response.status_code == 200:
                data = response.json()
                if 'listings' in data:
                    listings = data['listings']
                    self.log_test(
                        "GET /api/listings", 
                        True, 
                        f"Liste récupérée: {len(listings)} annonces trouvées",
                        {"count": len(listings), "pagination": data.get('pagination')}
                    )
                    return True
                else:
                    self.log_test(
                        "GET /api/listings", 
                        False, 
                        "Format de réponse invalide - 'listings' manquant",
                        data
                    )
                    return False
            else:
                self.log_test(
                    "GET /api/listings", 
                    False, 
                    f"Status code: {response.status_code}",
                    response.json() if response.text else None
                )
                return False
                
        except Exception as e:
            self.log_test("GET /api/listings", False, f"Erreur: {str(e)}")
            return False
    
    def test_4_create_listing(self):
        """Test 4: POST /api/listings - Créer une annonce avec token"""
        print("\n=== TEST 4: Création d'une annonce (authentifié) ===")
        
        if not self.user_token:
            self.log_test("POST /api/listings", False, "Token d'authentification manquant")
            return False
        
        auth_headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.user_token}"
        }
        
        listing_data = {
            "title": "Villa Moderne à Libreville - Quartier Batterie IV",
            "description": "Superbe villa de 5 pièces avec piscine, jardin tropical et vue sur l'océan. Située dans un quartier résidentiel calme et sécurisé de Libreville. Idéale pour famille expatriée ou cadre supérieur.",
            "type": "HOUSE",
            "category": "SALE",
            "subCategory": "VILLA",
            "price": 125000000,  # 125M FCFA
            "city": "Libreville",
            "address": "Batterie IV, Boulevard Triomphal",
            "neighborhood": "Batterie IV",
            "propertyDetails": {
                "surface": 250,
                "bedrooms": 5,
                "bathrooms": 3,
                "floors": 2,
                "yearBuilt": 2020,
                "condition": "EXCELLENT",
                "furnished": "SEMI_FURNISHED",
                "parking": 2,
                "amenities": ["piscine", "jardin", "climatisation", "cuisine_equipee", "securite_24h"]
            }
        }
        
        try:
            response = requests.post(
                f"{self.base_url}/listings", 
                json=listing_data, 
                headers=auth_headers, 
                timeout=15
            )
            
            if response.status_code == 201:
                data = response.json()
                if 'listing' in data:
                    listing = data['listing']
                    self.test_listing_id = listing.get('_id')
                    self.log_test(
                        "POST /api/listings", 
                        True, 
                        f"Annonce créée avec succès - ID: {self.test_listing_id}",
                        {
                            "listing_id": self.test_listing_id,
                            "title": listing.get('title'),
                            "status": listing.get('status'),
                            "price": listing.get('price')
                        }
                    )
                    return True
                else:
                    self.log_test(
                        "POST /api/listings", 
                        False, 
                        "Format de réponse invalide - 'listing' manquant",
                        data
                    )
                    return False
            else:
                self.log_test(
                    "POST /api/listings", 
                    False, 
                    f"Status code: {response.status_code}",
                    response.json() if response.text else None
                )
                return False
                
        except Exception as e:
            self.log_test("POST /api/listings", False, f"Erreur: {str(e)}")
            return False
    
    def test_5_get_my_listings(self):
        """Test 5: GET /api/listings/my-listings - Mes annonces (authentifié)"""
        print("\n=== TEST 5: Récupération de mes annonces ===")
        
        if not self.user_token:
            self.log_test("GET /api/listings/my-listings", False, "Token d'authentification manquant")
            return False
        
        auth_headers = {
            "Authorization": f"Bearer {self.user_token}"
        }
        
        try:
            response = requests.get(
                f"{self.base_url}/listings/my-listings", 
                headers=auth_headers, 
                timeout=15
            )
            
            if response.status_code == 200:
                data = response.json()
                if 'listings' in data:
                    listings = data['listings']
                    # Check if our created listing is in the list
                    found_listing = False
                    if self.test_listing_id:
                        found_listing = any(l.get('_id') == self.test_listing_id for l in listings)
                    
                    self.log_test(
                        "GET /api/listings/my-listings", 
                        True, 
                        f"Mes annonces récupérées: {len(listings)} annonce(s) - Annonce créée trouvée: {found_listing}",
                        {"count": data.get('count'), "listings_found": len(listings)}
                    )
                    return True
                else:
                    self.log_test(
                        "GET /api/listings/my-listings", 
                        False, 
                        "Format de réponse invalide - 'listings' manquant",
                        data
                    )
                    return False
            else:
                self.log_test(
                    "GET /api/listings/my-listings", 
                    False, 
                    f"Status code: {response.status_code}",
                    response.json() if response.text else None
                )
                return False
                
        except Exception as e:
            self.log_test("GET /api/listings/my-listings", False, f"Erreur: {str(e)}")
            return False
    
    def test_6_admin_login(self):
        """Test 6: POST /api/admin/auth/login - Connexion admin"""
        print("\n=== TEST 6: Connexion administrateur ===")
        
        admin_login_data = {
            "email": "superadmin@kama.com",
            "password": "SuperAdminPassword123!"
        }
        
        try:
            # Try the correct endpoint first
            response = requests.post(
                f"{self.base_url}/admin/auth/login", 
                json=admin_login_data, 
                headers=self.headers, 
                timeout=15
            )
            
            if response.status_code == 200:
                data = response.json()
                if 'accessToken' in data:
                    self.admin_token = data['accessToken']
                    self.log_test(
                        "POST /api/admin/auth/login", 
                        True, 
                        f"Connexion admin réussie - Role: {data.get('user', {}).get('role')}",
                        {"admin_email": data.get('user', {}).get('email')}
                    )
                    return True
                else:
                    self.log_test(
                        "POST /api/admin/auth/login", 
                        False, 
                        "accessToken manquant dans la réponse",
                        data
                    )
                    return False
            else:
                self.log_test(
                    "POST /api/admin/auth/login", 
                    False, 
                    f"Status code: {response.status_code}",
                    response.json() if response.text else None
                )
                return False
                
        except Exception as e:
            self.log_test("POST /api/admin/auth/login", False, f"Erreur: {str(e)}")
            return False
    
    def test_7_admin_stats(self):
        """Test 7: GET /api/admin/dashboard-stats - Statistiques admin"""
        print("\n=== TEST 7: Récupération des statistiques admin ===")
        
        if not self.admin_token:
            self.log_test("GET /api/admin/dashboard-stats", False, "Token admin manquant")
            return False
        
        admin_headers = {
            "Authorization": f"Bearer {self.admin_token}"
        }
        
        try:
            response = requests.get(
                f"{self.base_url}/admin/dashboard-stats", 
                headers=admin_headers, 
                timeout=15
            )
            
            if response.status_code == 200:
                data = response.json()
                # Check for expected stats structure
                has_users = 'users' in data
                has_listings = 'listings' in data
                has_transactions = 'transactions' in data
                has_revenue = 'revenue' in data
                
                if has_users and has_listings:
                    self.log_test(
                        "GET /api/admin/dashboard-stats", 
                        True, 
                        f"Statistiques récupérées - Users: {data.get('users', {}).get('total', 0)}, Listings: {data.get('listings', {}).get('total', 0)}",
                        {
                            "users_total": data.get('users', {}).get('total'),
                            "listings_total": data.get('listings', {}).get('total'),
                            "transactions_total": data.get('transactions', {}).get('total'),
                            "revenue_commission": data.get('revenue', {}).get('totalCommission')
                        }
                    )
                    return True
                else:
                    self.log_test(
                        "GET /api/admin/dashboard-stats", 
                        False, 
                        "Format de réponse invalide - sections manquantes",
                        data
                    )
                    return False
            else:
                self.log_test(
                    "GET /api/admin/dashboard-stats", 
                    False, 
                    f"Status code: {response.status_code}",
                    response.json() if response.text else None
                )
                return False
                
        except Exception as e:
            self.log_test("GET /api/admin/dashboard-stats", False, f"Erreur: {str(e)}")
            return False
    
    def run_all_tests(self):
        """Run all tests in sequence"""
        print("=" * 80)
        print("🚀 KAPUCE.G Backend API Testing - Review Request")
        print(f"Base URL: {self.base_url}")
        print("=" * 80)
        
        # Run tests in order
        test_1_success = self.test_1_register_user()
        test_2_success = self.test_2_login_user()
        test_3_success = self.test_3_get_listings()
        test_4_success = self.test_4_create_listing()
        test_5_success = self.test_5_get_my_listings()
        test_6_success = self.test_6_admin_login()
        test_7_success = self.test_7_admin_stats()
        
        # Print summary
        self.print_summary()
        
        return all([test_1_success, test_2_success, test_3_success, 
                   test_4_success, test_5_success, test_6_success, test_7_success])
    
    def print_summary(self):
        """Print test results summary"""
        print("\n" + "=" * 80)
        print("📊 RÉSUMÉ DES TESTS")
        print("=" * 80)
        
        total_tests = len(self.test_results)
        passed_tests = len([t for t in self.test_results if t['success']])
        failed_tests = total_tests - passed_tests
        
        print(f"\nTotal des tests: {total_tests}")
        print(f"✅ Réussis: {passed_tests}")
        print(f"❌ Échoués: {failed_tests}")
        print(f"Taux de réussite: {(passed_tests/total_tests)*100:.1f}%")
        
        if failed_tests > 0:
            print("\n🚨 TESTS ÉCHOUÉS:")
            for result in self.test_results:
                if not result['success']:
                    print(f"  • {result['test']}: {result['details']}")
        
        # Save detailed results
        try:
            with open('/app/test_reports/backend_review_results.json', 'w') as f:
                json.dump(self.test_results, f, indent=2, ensure_ascii=False)
            print(f"\n📄 Résultats détaillés sauvegardés: /app/test_reports/backend_review_results.json")
        except Exception as e:
            print(f"\n⚠️  Impossible de sauvegarder les résultats: {str(e)}")

if __name__ == "__main__":
    tester = KAPUCEBackendTester()
    success = tester.run_all_tests()
    exit(0 if success else 1)
