#!/usr/bin/env python3
"""
Quick debug test to see API responses
"""

import requests
import json

base_url = "https://trusted-transactions.preview.emergentagent.com/api"
headers = {"Content-Type": "application/json"}

# Test registration and see response
print("=== Testing Registration ===")
register_data = {
    "fullName": "Test Dubois",
    "email": "test.dubois@kama-gabon.com",
    "phone": "+241068999888",
    "password": "TestKama2024!",
    "role": "USER"
}

try:
    response = requests.post(f"{base_url}/auth/register", json=register_data, headers=headers, timeout=10)
    print(f"Registration Status: {response.status_code}")
    print(f"Registration Response: {response.text}")
    
    if response.status_code == 201:
        data = response.json()
        print(f"Response JSON keys: {list(data.keys())}")
        
        # Test login to get token
        print("\n=== Testing Login ===")
        login_data = {
            "email": "test.dubois@kama-gabon.com",
            "password": "TestKama2024!"
        }
        
        login_response = requests.post(f"{base_url}/auth/login", json=login_data, headers=headers, timeout=10)
        print(f"Login Status: {login_response.status_code}")
        print(f"Login Response: {login_response.text}")
        
        if login_response.status_code == 200:
            login_data = login_response.json()
            token = login_data.get('accessToken')
            user_id = login_data.get('user', {}).get('_id')
            print(f"Token: {token[:20]}..." if token else "No token")
            print(f"User ID: {user_id}")
            
            if token:
                auth_headers = {"Content-Type": "application/json", "Authorization": f"Bearer {token}"}
                
                # Test create listing
                print("\n=== Testing Create Listing ===")
                listing_data = {
                    "title": "Test Maison Libreville",
                    "description": "Test maison pour vérification API",
                    "price": 50000000,
                    "type": "HOUSE",
                    "category": "SALE",
                    "city": "Libreville",
                    "address": "Test Address, Libreville",
                    "bedrooms": 3,
                    "bathrooms": 2,
                    "surface": 120
                }
                
                listing_response = requests.post(f"{base_url}/listings", json=listing_data, headers=auth_headers, timeout=10)
                print(f"Listing Status: {listing_response.status_code}")
                print(f"Listing Response: {listing_response.text}")
                
                if listing_response.status_code == 201:
                    listing_data = listing_response.json()
                    listing_id = listing_data.get('_id') or listing_data.get('id')
                    print(f"Listing ID: {listing_id}")
                    print(f"Response JSON keys: {list(listing_data.keys())}")

except Exception as e:
    print(f"Error: {e}")