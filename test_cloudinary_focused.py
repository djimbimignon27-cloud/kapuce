#!/usr/bin/env python3
"""
Focused Cloudinary Upload API Test for KAMA Marketplace
"""

import requests
import json

def test_cloudinary_upload():
    """Focused test for Cloudinary upload API"""
    print("🧪 FOCUSED CLOUDINARY UPLOAD TEST")
    print("=" * 50)
    
    # Base URL
    base_url = "https://digital-marketplace-186.preview.emergentagent.com"
    
    # Test image: 1x1 pixel red PNG in base64
    test_image_base64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="
    
    results = {}
    
    # Test 1: Authentication
    print("\n🔐 Step 1: Authentication")
    try:
        login_url = f"{base_url}/api/auth/login"
        login_payload = {
            "email": "superadmin@kama.com",
            "password": "SuperAdminPassword123!"
        }
        
        response = requests.post(login_url, json=login_payload, timeout=30)
        print(f"Login Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            auth_token = data.get('accessToken')
            user_info = data.get('user', {})
            print(f"✅ Login successful")
            print(f"  User: {user_info.get('fullName')} ({user_info.get('email')})")
            print(f"  Role: {user_info.get('role')}")
            print(f"  Token: {auth_token[:20]}...")
            results['auth'] = True
        else:
            print(f"❌ Login failed: {response.text}")
            results['auth'] = False
            return results
            
    except Exception as e:
        print(f"❌ Login error: {str(e)}")
        results['auth'] = False
        return results
    
    # Test 2: Upload without authentication
    print("\n🚫 Step 2: Upload without authentication (should fail)")
    try:
        upload_url = f"{base_url}/api/upload"
        payload = {
            "file": test_image_base64,
            "type": "image"
        }
        
        response = requests.post(upload_url, json=payload, timeout=30)
        print(f"Upload Status: {response.status_code}")
        
        if response.status_code == 401:
            print("✅ Correctly rejected - 401 Unauthorized")
            results['no_auth'] = True
        else:
            print(f"❌ Expected 401, got {response.status_code}: {response.text}")
            results['no_auth'] = False
            
    except Exception as e:
        print(f"❌ Upload error: {str(e)}")
        results['no_auth'] = False
    
    # Test 3: Upload without file
    print("\n📝 Step 3: Upload without file (should fail)")
    try:
        headers = {
            'Authorization': f'Bearer {auth_token}',
            'Content-Type': 'application/json'
        }
        payload = {"type": "image"}  # Missing file
        
        response = requests.post(upload_url, json=payload, headers=headers, timeout=30)
        print(f"Upload Status: {response.status_code}")
        
        if response.status_code == 400:
            print("✅ Correctly rejected - 400 Bad Request")
            results['no_file'] = True
        else:
            print(f"❌ Expected 400, got {response.status_code}: {response.text}")
            results['no_file'] = False
            
    except Exception as e:
        print(f"❌ Upload error: {str(e)}")
        results['no_file'] = False
    
    # Test 4: Valid upload
    print("\n📤 Step 4: Valid file upload")
    try:
        headers = {
            'Authorization': f'Bearer {auth_token}',
            'Content-Type': 'application/json'
        }
        payload = {
            "file": test_image_base64,
            "type": "image",
            "folder": "kama/listings"
        }
        
        response = requests.post(upload_url, json=payload, headers=headers, timeout=30)
        print(f"Upload Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Response: {json.dumps(data, indent=2)}")
            
            if data.get('success') and 'file' in data:
                file_data = data['file']
                required_fields = ['url', 'publicId']
                
                all_fields_present = all(field in file_data for field in required_fields)
                
                if all_fields_present:
                    print("✅ Upload successful!")
                    print(f"  URL: {file_data['url']}")
                    print(f"  Public ID: {file_data['publicId']}")
                    print(f"  Format: {file_data.get('format', 'N/A')}")
                    print(f"  Size: {file_data.get('bytes', 'N/A')} bytes")
                    results['valid_upload'] = True
                else:
                    print(f"❌ Missing required fields: {[f for f in required_fields if f not in file_data]}")
                    results['valid_upload'] = False
            else:
                print("❌ Invalid response structure")
                results['valid_upload'] = False
        else:
            print(f"❌ Upload failed: {response.text}")
            results['valid_upload'] = False
            
    except Exception as e:
        print(f"❌ Upload error: {str(e)}")
        results['valid_upload'] = False
    
    # Test 5: Different file types
    print("\n🎨 Step 5: Testing different file types")
    file_types = ["image", "document", "video"]
    
    for file_type in file_types:
        try:
            headers = {
                'Authorization': f'Bearer {auth_token}',
                'Content-Type': 'application/json'
            }
            payload = {
                "file": test_image_base64,
                "type": file_type
            }
            
            response = requests.post(upload_url, json=payload, headers=headers, timeout=30)
            print(f"  {file_type.capitalize()} upload: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    print(f"    ✅ {file_type} upload successful")
                    results[f'{file_type}_upload'] = True
                else:
                    print(f"    ❌ {file_type} upload failed - response error")
                    results[f'{file_type}_upload'] = False
            else:
                print(f"    ❌ {file_type} upload failed: {response.text}")
                results[f'{file_type}_upload'] = False
                
        except Exception as e:
            print(f"    ❌ {file_type} upload error: {str(e)}")
            results[f'{file_type}_upload'] = False
    
    # Summary
    print("\n" + "=" * 50)
    print("📊 CLOUDINARY UPLOAD TEST SUMMARY")
    print("=" * 50)
    
    total_tests = len(results)
    passed_tests = sum(1 for success in results.values() if success)
    
    for test_name, success in results.items():
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{test_name:<20} {status}")
    
    print("-" * 50)
    print(f"TOTAL: {passed_tests}/{total_tests} tests passed")
    print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
    
    # Critical assessment
    critical_tests = ['auth', 'valid_upload']
    critical_passed = sum(1 for test in critical_tests if results.get(test, False))
    
    if critical_passed == len(critical_tests):
        print("\n🎉 CRITICAL FUNCTIONALITY: ALL WORKING!")
        print("✅ Authentication works")
        print("✅ File upload works") 
        print("✅ API returns proper response structure")
    else:
        print("\n⚠️  CRITICAL ISSUES DETECTED!")
    
    return results

if __name__ == "__main__":
    test_cloudinary_upload()