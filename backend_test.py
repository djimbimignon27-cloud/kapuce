#!/usr/bin/env python3
"""
KAMA Marketplace Backend API Testing Suite
Tests all critical backend endpoints for the Gabon marketplace application.
"""

import requests
import json
import time
from datetime import datetime

class KAMABackendTester:
    def __init__(self):
        self.base_url = "https://kama-preview.preview.emergentagent.com/api"
        self.headers = {"Content-Type": "application/json"}
        self.auth_token = None
        self.admin_token = None
        self.test_user_id = None
        self.test_listing_id = None
        self.test_results = []
        
    def log_test(self, test_name, success, details="", critical=False):
        """Log test results"""
        result = {
            "test": test_name,
            "success": success,
            "critical": critical,
            "details": details,
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        priority = " [CRITICAL]" if critical else ""
        print(f"{status}{priority} {test_name}: {details}")
        
    def test_root_endpoint(self):
        """Test basic connectivity"""
        try:
            response = requests.get(f"{self.base_url}/", timeout=10)
            if response.status_code == 200:
                self.log_test("Root Endpoint", True, "Basic connectivity works")
                return True
            else:
                self.log_test("Root Endpoint", False, f"Status: {response.status_code}", True)
                return False
        except Exception as e:
            self.log_test("Root Endpoint", False, f"Connection error: {str(e)}", True)
            return False
    
    def test_auth_endpoints(self):
        """Test all authentication endpoints"""
        print("\n=== TESTING AUTHENTICATION ENDPOINTS ===")
        
        # Test user registration
        register_data = {
            "fullName": "Jean Mbang",
            "email": "jean.mbang@kama-gabon.com",
            "phone": "+241068234567",
            "password": "JeanKama2024!",
            "role": "USER"
        }
        
        try:
            response = requests.post(f"{self.base_url}/auth/register", 
                                   json=register_data, headers=self.headers, timeout=10)
            if response.status_code == 201:
                self.log_test("User Registration", True, "User registered successfully")
                data = response.json()
                self.test_user_id = data.get('user', {}).get('id')
                # Also capture token from registration
                if not self.auth_token:
                    self.auth_token = data.get('accessToken')
                    if self.auth_token:
                        self.headers["Authorization"] = f"Bearer {self.auth_token}"
                print(f"Debug - User ID captured: {self.test_user_id}")
            else:
                self.log_test("User Registration", False, 
                            f"Status: {response.status_code}, Response: {response.text}", True)
        except Exception as e:
            self.log_test("User Registration", False, f"Error: {str(e)}", True)
        
        # Test user login
        login_data = {
            "email": "jean.mbang@kama-gabon.com",
            "password": "JeanKama2024!"
        }
        
        try:
            response = requests.post(f"{self.base_url}/auth/login", 
                                   json=login_data, headers=self.headers, timeout=10)
            if response.status_code == 200:
                self.log_test("User Login", True, "Login successful")
                data = response.json()
                self.auth_token = data.get('accessToken')
                if self.auth_token:
                    self.headers["Authorization"] = f"Bearer {self.auth_token}"
            else:
                self.log_test("User Login", False, 
                            f"Status: {response.status_code}, Response: {response.text}", True)
        except Exception as e:
            self.log_test("User Login", False, f"Error: {str(e)}", True)
        
        # Test admin registration and login
        admin_data = {
            "fullName": "Admin KAMA",
            "email": "admin@kama-gabon.com", 
            "phone": "+241077123456",
            "password": "AdminKama2024!",
            "role": "ADMIN"
        }
        
        try:
            response = requests.post(f"{self.base_url}/auth/register", 
                                   json=admin_data, headers=self.headers, timeout=10)
            if response.status_code == 201:
                self.log_test("Admin Registration", True, "Admin registered successfully")
            else:
                self.log_test("Admin Registration", False, 
                            f"Status: {response.status_code}, Response: {response.text}")
        except Exception as e:
            self.log_test("Admin Registration", False, f"Error: {str(e)}")
        
        # Login as admin
        admin_login_data = {
            "email": "admin@kama-gabon.com",
            "password": "AdminKama2024!"
        }
        
        try:
            response = requests.post(f"{self.base_url}/auth/login", 
                                   json=admin_login_data, headers=self.headers, timeout=10)
            if response.status_code == 200:
                self.log_test("Admin Login", True, "Admin login successful")
                data = response.json()
                self.admin_token = data.get('accessToken')
            else:
                self.log_test("Admin Login", False, 
                            f"Status: {response.status_code}, Response: {response.text}")
        except Exception as e:
            self.log_test("Admin Login", False, f"Error: {str(e)}")
        
        # Test email verification (mocked)
        if self.test_user_id:
            try:
                verify_data = {"token": "mock_verification_token"}
                response = requests.post(f"{self.base_url}/auth/verify-email", 
                                       json=verify_data, headers=self.headers, timeout=10)
                if response.status_code == 200:
                    self.log_test("Email Verification", True, "Email verification works (mocked)")
                else:
                    self.log_test("Email Verification", False, 
                                f"Status: {response.status_code}, Response: {response.text}")
            except Exception as e:
                self.log_test("Email Verification", False, f"Error: {str(e)}")
    
    def test_listings_endpoints(self):
        """Test all listing endpoints"""
        print("\n=== TESTING LISTINGS ENDPOINTS ===")
        
        if not self.auth_token:
            self.log_test("Listings Tests Skipped", False, "No auth token available", True)
            return
        
        # Test create listing
        listing_data = {
            "title": "Belle Maison à Libreville Centre",
            "description": "Magnifique maison de 4 chambres avec jardin, proche du centre-ville de Libreville. Parfait pour une famille.",
            "price": 85000000,  # 85M FCFA
            "type": "HOUSE",
            "category": "SALE",
            "city": "Libreville", 
            "address": "Quartier Louis, Libreville",
            "bedrooms": 4,
            "bathrooms": 3,
            "surface": 150
        }
        
        try:
            response = requests.post(f"{self.base_url}/listings", 
                                   json=listing_data, headers=self.headers, timeout=10)
            if response.status_code == 201:
                self.log_test("Create Listing", True, "Listing created successfully", True)
                data = response.json()
                self.test_listing_id = data.get('listing', {}).get('_id')
                print(f"Debug - Listing ID captured: {self.test_listing_id}")
            else:
                self.log_test("Create Listing", False, 
                            f"Status: {response.status_code}, Response: {response.text}", True)
        except Exception as e:
            self.log_test("Create Listing", False, f"Error: {str(e)}", True)
        
        # Test get all listings
        try:
            response = requests.get(f"{self.base_url}/listings", timeout=10)
            if response.status_code == 200:
                listings = response.json()
                self.log_test("Get All Listings", True, 
                            f"Retrieved {len(listings)} listings", True)
            else:
                self.log_test("Get All Listings", False, 
                            f"Status: {response.status_code}, Response: {response.text}", True)
        except Exception as e:
            self.log_test("Get All Listings", False, f"Error: {str(e)}", True)
        
        # Test get specific listing
        if self.test_listing_id:
            try:
                response = requests.get(f"{self.base_url}/listings/{self.test_listing_id}", timeout=10)
                if response.status_code == 200:
                    self.log_test("Get Listing by ID", True, "Retrieved listing details")
                else:
                    self.log_test("Get Listing by ID", False, 
                                f"Status: {response.status_code}, Response: {response.text}")
            except Exception as e:
                self.log_test("Get Listing by ID", False, f"Error: {str(e)}")
        
        # Test search listings
        search_params = {
            "type": "HOUSE",
            "category": "SALE", 
            "city": "Libreville",
            "minPrice": 50000000,
            "maxPrice": 100000000
        }
        
        try:
            response = requests.get(f"{self.base_url}/listings/search", 
                                  params=search_params, timeout=10)
            if response.status_code == 200:
                results = response.json()
                self.log_test("Search Listings", True, 
                            f"Search returned {len(results)} results", True)
            else:
                self.log_test("Search Listings", False, 
                            f"Status: {response.status_code}, Response: {response.text}", True)
        except Exception as e:
            self.log_test("Search Listings", False, f"Error: {str(e)}", True)
    
    def test_transactions_endpoints(self):
        """Test transaction endpoints"""
        print("\n=== TESTING TRANSACTIONS ENDPOINTS ===")
        
        if not self.auth_token or not self.test_listing_id:
            self.log_test("Transactions Tests Skipped", False, "Missing auth token or listing ID")
            return
        
        # Test create transaction
        transaction_data = {
            "listingId": self.test_listing_id,
            "amount": 85000000,
            "paymentMethod": "bank_transfer"
        }
        
        try:
            response = requests.post(f"{self.base_url}/transactions", 
                                   json=transaction_data, headers=self.headers, timeout=10)
            if response.status_code == 201:
                transaction = response.json()
                commission = transaction.get('commissionAmount', 0)
                expected_commission = 85000000 * 0.07
                self.log_test("Create Transaction", True, 
                            f"Transaction created with 7% commission: {commission} FCFA")
                # Verify commission calculation
                if abs(commission - expected_commission) < 1:
                    self.log_test("Commission Calculation", True, "7% commission calculated correctly")
                else:
                    self.log_test("Commission Calculation", False, 
                                f"Expected: {expected_commission}, Got: {commission}")
            else:
                self.log_test("Create Transaction", False, 
                            f"Status: {response.status_code}, Response: {response.text}")
        except Exception as e:
            self.log_test("Create Transaction", False, f"Error: {str(e)}")
        
        # Test get my transactions
        try:
            response = requests.get(f"{self.base_url}/transactions", headers=self.headers, timeout=10)
            if response.status_code == 200:
                transactions = response.json()
                self.log_test("Get My Transactions", True, 
                            f"Retrieved {len(transactions)} transactions")
            else:
                self.log_test("Get My Transactions", False, 
                            f"Status: {response.status_code}, Response: {response.text}")
        except Exception as e:
            self.log_test("Get My Transactions", False, f"Error: {str(e)}")
    
    def test_reviews_endpoints(self):
        """Test review endpoints"""
        print("\n=== TESTING REVIEWS ENDPOINTS ===")
        
        if not self.auth_token or not self.test_user_id:
            self.log_test("Reviews Tests Skipped", False, "Missing auth token or user ID")
            return
        
        # Test create review
        review_data = {
            "userId": self.test_user_id,
            "rating": 5,
            "comment": "Excellent vendeur, très professionnel et réactif!"
        }
        
        try:
            response = requests.post(f"{self.base_url}/reviews", 
                                   json=review_data, headers=self.headers, timeout=10)
            if response.status_code == 201:
                self.log_test("Create Review", True, "Review created successfully")
            else:
                self.log_test("Create Review", False, 
                            f"Status: {response.status_code}, Response: {response.text}")
        except Exception as e:
            self.log_test("Create Review", False, f"Error: {str(e)}")
        
        # Test get reviews for user
        try:
            response = requests.get(f"{self.base_url}/reviews?userId={self.test_user_id}", timeout=10)
            if response.status_code == 200:
                reviews = response.json()
                self.log_test("Get User Reviews", True, 
                            f"Retrieved {len(reviews)} reviews")
            else:
                self.log_test("Get User Reviews", False, 
                            f"Status: {response.status_code}, Response: {response.text}")
        except Exception as e:
            self.log_test("Get User Reviews", False, f"Error: {str(e)}")
    
    def test_favorites_endpoints(self):
        """Test favorites endpoints"""
        print("\n=== TESTING FAVORITES ENDPOINTS ===")
        
        if not self.auth_token or not self.test_listing_id:
            self.log_test("Favorites Tests Skipped", False, "Missing auth token or listing ID")
            return
        
        # Test add to favorites
        favorite_data = {"listingId": self.test_listing_id}
        
        try:
            response = requests.post(f"{self.base_url}/favorites", 
                                   json=favorite_data, headers=self.headers, timeout=10)
            if response.status_code == 201:
                self.log_test("Add to Favorites", True, "Added to favorites successfully")
            else:
                self.log_test("Add to Favorites", False, 
                            f"Status: {response.status_code}, Response: {response.text}")
        except Exception as e:
            self.log_test("Add to Favorites", False, f"Error: {str(e)}")
        
        # Test get my favorites
        try:
            response = requests.get(f"{self.base_url}/favorites", headers=self.headers, timeout=10)
            if response.status_code == 200:
                favorites = response.json()
                self.log_test("Get My Favorites", True, 
                            f"Retrieved {len(favorites)} favorites")
            else:
                self.log_test("Get My Favorites", False, 
                            f"Status: {response.status_code}, Response: {response.text}")
        except Exception as e:
            self.log_test("Get My Favorites", False, f"Error: {str(e)}")
    
    def test_admin_endpoints(self):
        """Test admin endpoints"""
        print("\n=== TESTING ADMIN ENDPOINTS ===")
        
        if not self.admin_token:
            self.log_test("Admin Tests Skipped", False, "No admin token available")
            return
        
        admin_headers = {"Content-Type": "application/json", 
                        "Authorization": f"Bearer {self.admin_token}"}
        
        # Test admin dashboard
        try:
            response = requests.get(f"{self.base_url}/admin/dashboard", 
                                  headers=admin_headers, timeout=10)
            if response.status_code == 200:
                stats = response.json()
                self.log_test("Admin Dashboard", True, "Dashboard data retrieved successfully")
            else:
                self.log_test("Admin Dashboard", False, 
                            f"Status: {response.status_code}, Response: {response.text}")
        except Exception as e:
            self.log_test("Admin Dashboard", False, f"Error: {str(e)}")
        
        # Test approve listing (if we have a listing)
        if self.test_listing_id:
            try:
                approve_data = {"status": "ACTIVE"}
                response = requests.put(f"{self.base_url}/admin/listings/{self.test_listing_id}", 
                                      json=approve_data, headers=admin_headers, timeout=10)
                if response.status_code == 200:
                    self.log_test("Approve Listing", True, "Listing approved successfully")
                else:
                    self.log_test("Approve Listing", False, 
                                f"Status: {response.status_code}, Response: {response.text}")
            except Exception as e:
                self.log_test("Approve Listing", False, f"Error: {str(e)}")
    
    def run_all_tests(self):
        """Run all backend tests"""
        print("🚀 Starting KAMA Marketplace Backend API Tests...")
        print(f"Testing against: {self.base_url}")
        print("=" * 60)
        
        # Test basic connectivity first
        if not self.test_root_endpoint():
            print("\n❌ CRITICAL: Cannot connect to backend - stopping tests")
            return False
        
        # Run all test suites
        self.test_auth_endpoints()
        self.test_listings_endpoints()
        self.test_transactions_endpoints()  
        self.test_reviews_endpoints()
        self.test_favorites_endpoints()
        self.test_admin_endpoints()
        
        # Print summary
        self.print_summary()
        return True
    
    def print_summary(self):
        """Print test results summary"""
        print("\n" + "=" * 60)
        print("📊 TEST RESULTS SUMMARY")
        print("=" * 60)
        
        total_tests = len(self.test_results)
        passed_tests = len([t for t in self.test_results if t['success']])
        critical_failures = [t for t in self.test_results if not t['success'] and t['critical']]
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests}")
        print(f"Failed: {total_tests - passed_tests}")
        print(f"Critical Failures: {len(critical_failures)}")
        
        if critical_failures:
            print("\n🚨 CRITICAL FAILURES:")
            for failure in critical_failures:
                print(f"  • {failure['test']}: {failure['details']}")
        
        print(f"\nSuccess Rate: {(passed_tests/total_tests)*100:.1f}%")
        
        # Save detailed results
        with open('/app/test_reports/backend_test_results.json', 'w') as f:
            json.dump(self.test_results, f, indent=2)
        
        print(f"Detailed results saved to: /app/test_reports/backend_test_results.json")

if __name__ == "__main__":
    tester = KAMABackendTester()
    success = tester.run_all_tests()
    exit(0 if success else 1)