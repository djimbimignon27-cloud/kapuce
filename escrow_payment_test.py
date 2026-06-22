#!/usr/bin/env python3
"""
Backend API Tests for KAPUCE.G - Escrow Payment System
Tests the complete payment flow where KAPUCE.G receives money, takes 7% commission, and sends rest to owner
Owner receives notification in messaging system when payment is validated
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
    "owner_token": None,
    "buyer_token": None,
    "owner_id": None,
    "buyer_id": None,
    "listing_id": None,
    "transaction_id": None,
    "system_conversation_id": None,
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
# STEP 0: AUTHENTICATION
# ============================================================================

def test_admin_login():
    """Test admin authentication"""
    print_test_header("Step 0.1: Admin Login")
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

def test_create_owner():
    """Create owner user (User1)"""
    print_test_header("Step 0.2: Create Owner (User1)")
    try:
        timestamp = int(time.time())
        email = f"owner_{timestamp}@kapuce.test"
        
        response = requests.post(
            f"{BASE_URL}/auth/register",
            json={
                "email": email,
                "password": "OwnerPassword123!",
                "fullName": "Jean Propriétaire",
                "phone": "077111111",
                "role": "USER"
            },
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 201:
            data = response.json()
            if "accessToken" in data:
                test_data["owner_token"] = data["accessToken"]
                test_data["owner_id"] = data["user"].get("_id") or data["user"].get("id")
                print_result(True, f"Owner created: {email}, ID: {test_data['owner_id']}")
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

def test_create_buyer():
    """Create buyer user (User2)"""
    print_test_header("Step 0.3: Create Buyer (User2)")
    try:
        timestamp = int(time.time())
        email = f"buyer_{timestamp}@kapuce.test"
        
        response = requests.post(
            f"{BASE_URL}/auth/register",
            json={
                "email": email,
                "password": "BuyerPassword123!",
                "fullName": "Marie Acheteuse",
                "phone": "077222222",
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

# ============================================================================
# STEP 1: CREATE LISTING (Owner)
# ============================================================================

def test_create_listing():
    """Step 1: Owner creates a listing"""
    print_test_header("Step 1: Create Listing (Owner)")
    try:
        response = requests.post(
            f"{BASE_URL}/listings",
            json={
                "title": "Belle Villa à Libreville",
                "description": "Magnifique villa avec piscine et jardin",
                "type": "HOUSE",
                "category": "SALE",
                "price": 100000,
                "location": {
                    "city": "Libreville",
                    "neighborhood": "Quartier Louis",
                    "address": "123 Avenue de la Liberté"
                },
                "features": {
                    "bedrooms": 4,
                    "bathrooms": 3,
                    "area": 250
                },
                "images": ["https://example.com/image1.jpg"]
            },
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {test_data['owner_token']}"
            }
        )
        
        if response.status_code == 201:
            data = response.json()
            if "listing" in data:
                test_data["listing_id"] = data["listing"]["_id"]
                print_result(True, f"Listing created: {test_data['listing_id']}")
                print(f"Title: {data['listing']['title']}")
                print(f"Price: {data['listing']['price']} FCFA")
                print(f"Owner ID: {data['listing']['ownerId']}")
                return True
            else:
                print_result(False, "No listing in response")
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
# STEP 2: CLIENT PAYS (User2)
# ============================================================================

def test_create_transaction():
    """Step 2: Buyer creates transaction (payment)"""
    print_test_header("Step 2: Client Pays (POST /api/transactions/create)")
    try:
        response = requests.post(
            f"{BASE_URL}/transactions/create",
            json={
                "listingId": test_data["listing_id"],
                "amount": 100000,
                "paymentMethod": "AIRTEL_MONEY",
                "paymentReference": "TXN123456789"
            },
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {test_data['buyer_token']}"
            }
        )
        
        if response.status_code == 201:
            data = response.json()
            if data.get("success") and "transaction" in data:
                test_data["transaction_id"] = data["transaction"]["_id"]
                print_result(True, f"Transaction created: {test_data['transaction_id']}")
                print(f"Amount: {data['transaction']['amount']} FCFA")
                print(f"Commission: {data['transaction']['commissionAmount']} FCFA")
                print(f"Status: {data['transaction']['status']}")
                
                # Verify status is PENDING_PAYMENT
                if data['transaction']['status'] == 'PENDING_PAYMENT':
                    print_result(True, "✓ Status is PENDING_PAYMENT")
                else:
                    print_result(False, f"✗ Status is {data['transaction']['status']}, expected PENDING_PAYMENT")
                
                return True
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

def test_transaction_calculations():
    """Step 2.1: Verify commission calculations"""
    print_test_header("Step 2.1: Verify Commission Calculations")
    try:
        response = requests.get(
            f"{BASE_URL}/admin/transactions?status=PENDING_PAYMENT",
            headers={
                "Authorization": f"Bearer {test_data['admin_token']}"
            }
        )
        
        if response.status_code == 200:
            data = response.json()
            if data.get("success") and "transactions" in data:
                # Find our transaction
                transaction = None
                for tx in data["transactions"]:
                    if tx["_id"] == test_data["transaction_id"]:
                        transaction = tx
                        break
                
                if not transaction:
                    print_result(False, "Transaction not found in admin list")
                    return False
                
                # Verify calculations
                amount = transaction["amount"]
                commission_rate = transaction["commissionRate"]
                commission_amount = transaction["commissionAmount"]
                seller_receives = transaction["sellerReceives"]
                
                print(f"Amount: {amount} FCFA")
                print(f"Commission Rate: {commission_rate}%")
                print(f"Commission Amount: {commission_amount} FCFA")
                print(f"Seller Receives: {seller_receives} FCFA")
                
                # Verify commission is 7%
                if commission_rate == 7:
                    print_result(True, "✓ Commission rate is 7%")
                else:
                    print_result(False, f"✗ Commission rate is {commission_rate}%, expected 7%")
                    return False
                
                # Verify commission calculation
                expected_commission = int(amount * 0.07)
                if commission_amount == expected_commission:
                    print_result(True, f"✓ Commission calculated correctly: {commission_amount} FCFA")
                else:
                    print_result(False, f"✗ Commission is {commission_amount}, expected {expected_commission}")
                    return False
                
                # Verify seller receives
                expected_seller = amount - commission_amount
                if seller_receives == expected_seller:
                    print_result(True, f"✓ Seller receives calculated correctly: {seller_receives} FCFA")
                else:
                    print_result(False, f"✗ Seller receives is {seller_receives}, expected {expected_seller}")
                    return False
                
                # Verify buyer and seller IDs
                if transaction["buyerId"] == test_data["buyer_id"]:
                    print_result(True, f"✓ Buyer ID correct")
                else:
                    print_result(False, f"✗ Buyer ID mismatch")
                    return False
                
                if transaction["sellerId"] == test_data["owner_id"]:
                    print_result(True, f"✓ Seller ID correct")
                else:
                    print_result(False, f"✗ Seller ID mismatch")
                    return False
                
                return True
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

def test_reject_own_listing_purchase():
    """Step 2.2: Verify user cannot buy their own listing"""
    print_test_header("Step 2.2: Reject Own Listing Purchase")
    try:
        response = requests.post(
            f"{BASE_URL}/transactions/create",
            json={
                "listingId": test_data["listing_id"],
                "amount": 100000,
                "paymentMethod": "AIRTEL_MONEY",
                "paymentReference": "TXN999999999"
            },
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {test_data['owner_token']}"  # Owner trying to buy their own listing
            }
        )
        
        if response.status_code == 400:
            data = response.json()
            error_msg = data.get("error", "")
            if "propre annonce" in error_msg.lower() or "own" in error_msg.lower():
                print_result(True, f"✓ Correctly rejected: {error_msg}")
                return True
            else:
                print_result(False, f"Wrong error message: {error_msg}")
                return False
        else:
            print_result(False, f"Expected 400, got {response.status_code}")
            print_response(response)
            return False
    except Exception as e:
        print_result(False, f"Exception: {str(e)}")
        return False

# ============================================================================
# STEP 3: ADMIN VALIDATES PAYMENT
# ============================================================================

def test_admin_validate_payment():
    """Step 3: Admin validates payment"""
    print_test_header("Step 3: Admin Validates Payment (PUT /api/admin/transactions)")
    try:
        response = requests.put(
            f"{BASE_URL}/admin/transactions",
            json={
                "transactionId": test_data["transaction_id"],
                "action": "validate_payment"
            },
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {test_data['admin_token']}"
            }
        )
        
        if response.status_code == 200:
            data = response.json()
            if data.get("success"):
                print_result(True, f"Payment validated: {data.get('message')}")
                print(f"Transaction ID: {data.get('transaction', {}).get('_id')}")
                print(f"Status: {data.get('transaction', {}).get('status')}")
                print(f"Seller Receives: {data.get('transaction', {}).get('sellerReceives')} FCFA")
                
                # Verify status changed to PAID
                if data.get('transaction', {}).get('status') == 'PAID':
                    print_result(True, "✓ Status changed to PAID")
                else:
                    print_result(False, f"✗ Status is {data.get('transaction', {}).get('status')}, expected PAID")
                
                return True
            else:
                print_result(False, "Validation failed")
                print_response(response)
                return False
        else:
            print_result(False, f"Failed with status {response.status_code}")
            print_response(response)
            return False
    except Exception as e:
        print_result(False, f"Exception: {str(e)}")
        return False

def test_verify_payment_status():
    """Step 3.1: Verify payment status and paidAt timestamp"""
    print_test_header("Step 3.1: Verify Payment Status and Timestamp")
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
                # Find our transaction
                transaction = None
                for tx in data["transactions"]:
                    if tx["_id"] == test_data["transaction_id"]:
                        transaction = tx
                        break
                
                if not transaction:
                    print_result(False, "Transaction not found")
                    return False
                
                # Verify status is PAID
                if transaction["status"] == "PAID":
                    print_result(True, "✓ Status is PAID")
                else:
                    print_result(False, f"✗ Status is {transaction['status']}, expected PAID")
                    return False
                
                # Verify paidAt timestamp exists
                if transaction.get("paidAt"):
                    print_result(True, f"✓ paidAt timestamp recorded: {transaction['paidAt']}")
                else:
                    print_result(False, "✗ paidAt timestamp missing")
                    return False
                
                # Verify adminModified flag
                if transaction.get("adminModified"):
                    print_result(True, "✓ adminModified flag set to true")
                else:
                    print_result(False, "✗ adminModified flag not set")
                    return False
                
                return True
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

# ============================================================================
# STEP 4: VERIFY NOTIFICATION IN MESSAGING
# ============================================================================

def test_verify_system_conversation():
    """Step 4.1: Verify system conversation was created"""
    print_test_header("Step 4.1: Verify System Conversation Created")
    try:
        response = requests.get(
            f"{BASE_URL}/messages/conversations",
            headers={
                "Authorization": f"Bearer {test_data['owner_token']}"
            }
        )
        
        if response.status_code == 200:
            data = response.json()
            if data.get("success") and "conversations" in data:
                # Find system conversation
                system_conv = None
                for conv in data["conversations"]:
                    if conv.get("isSystemConversation"):
                        system_conv = conv
                        test_data["system_conversation_id"] = conv["_id"]
                        break
                
                if system_conv:
                    print_result(True, f"✓ System conversation found: {system_conv['_id']}")
                    print(f"isSystemConversation: {system_conv.get('isSystemConversation')}")
                    print(f"Last message: {system_conv.get('lastMessage', {}).get('content', '')[:100]}...")
                    return True
                else:
                    print_result(False, "✗ System conversation not found")
                    print(f"Total conversations: {len(data['conversations'])}")
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

def test_verify_system_message():
    """Step 4.2: Verify system message was created"""
    print_test_header("Step 4.2: Verify System Message Created")
    try:
        if not test_data.get("system_conversation_id"):
            print_result(False, "No system conversation ID available")
            return False
        
        response = requests.get(
            f"{BASE_URL}/messages?conversationId={test_data['system_conversation_id']}",
            headers={
                "Authorization": f"Bearer {test_data['owner_token']}"
            }
        )
        
        if response.status_code == 200:
            data = response.json()
            if data.get("success") and "messages" in data:
                if len(data["messages"]) > 0:
                    message = data["messages"][0]
                    
                    # Verify isSystemMessage
                    if message.get("isSystemMessage"):
                        print_result(True, "✓ isSystemMessage flag is true")
                    else:
                        print_result(False, "✗ isSystemMessage flag is false")
                        return False
                    
                    # Verify sender is SYSTEM
                    if message.get("senderId") == "SYSTEM":
                        print_result(True, "✓ Sender is SYSTEM")
                    else:
                        print_result(False, f"✗ Sender is {message.get('senderId')}, expected SYSTEM")
                        return False
                    
                    # Verify message content contains required information
                    content = message.get("content", "")
                    print(f"\nMessage content:\n{content}\n")
                    
                    checks = {
                        "amount": "100" in content or "100000" in content or "100,000" in content,
                        "commission": "7" in content or "7000" in content or "7,000" in content,
                        "seller_receives": "93" in content or "93000" in content or "93,000" in content,
                        "delay_24h": "24" in content.lower() or "24h" in content.lower(),
                    }
                    
                    for check_name, check_result in checks.items():
                        if check_result:
                            print_result(True, f"✓ Message contains {check_name}")
                        else:
                            print_result(False, f"✗ Message missing {check_name}")
                    
                    if all(checks.values()):
                        print_result(True, "✓ All required information present in message")
                        return True
                    else:
                        print_result(False, "✗ Some required information missing")
                        return False
                else:
                    print_result(False, "✗ No messages in system conversation")
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

def test_verify_conversation_last_message():
    """Step 4.3: Verify conversation lastMessage was updated"""
    print_test_header("Step 4.3: Verify Conversation lastMessage Updated")
    try:
        response = requests.get(
            f"{BASE_URL}/messages/conversations",
            headers={
                "Authorization": f"Bearer {test_data['owner_token']}"
            }
        )
        
        if response.status_code == 200:
            data = response.json()
            if data.get("success") and "conversations" in data:
                # Find system conversation
                system_conv = None
                for conv in data["conversations"]:
                    if conv.get("isSystemConversation"):
                        system_conv = conv
                        break
                
                if system_conv:
                    last_message = system_conv.get("lastMessage")
                    if last_message:
                        print_result(True, "✓ lastMessage exists")
                        print(f"Content: {last_message.get('content', '')[:100]}...")
                        print(f"Sender: {last_message.get('senderId')}")
                        
                        # Verify sender is SYSTEM
                        if last_message.get('senderId') == 'SYSTEM':
                            print_result(True, "✓ lastMessage sender is SYSTEM")
                            return True
                        else:
                            print_result(False, f"✗ lastMessage sender is {last_message.get('senderId')}")
                            return False
                    else:
                        print_result(False, "✗ lastMessage is missing")
                        return False
                else:
                    print_result(False, "✗ System conversation not found")
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

# ============================================================================
# STEP 5: ADMIN MODIFIES COMMISSION
# ============================================================================

def test_admin_modify_commission():
    """Step 5: Admin modifies commission rate"""
    print_test_header("Step 5: Admin Modifies Commission (PUT /api/admin/transactions)")
    try:
        response = requests.put(
            f"{BASE_URL}/admin/transactions",
            json={
                "transactionId": test_data["transaction_id"],
                "action": "update_commission",
                "commissionRate": 5,
                "adminNotes": "Réduction pour client fidèle"
            },
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {test_data['admin_token']}"
            }
        )
        
        if response.status_code == 200:
            data = response.json()
            if data.get("success"):
                print_result(True, f"Commission updated: {data.get('message')}")
                print(f"New commission amount: {data.get('newCommissionAmount')} FCFA")
                print(f"New seller receives: {data.get('newNetAmount')} FCFA")
                
                # Verify calculations
                expected_commission = 100000 * 0.05  # 5% of 100000
                expected_seller = 100000 - expected_commission
                
                if data.get('newCommissionAmount') == expected_commission:
                    print_result(True, f"✓ Commission recalculated correctly: {expected_commission} FCFA")
                else:
                    print_result(False, f"✗ Commission is {data.get('newCommissionAmount')}, expected {expected_commission}")
                
                if data.get('newNetAmount') == expected_seller:
                    print_result(True, f"✓ Seller receives recalculated correctly: {expected_seller} FCFA")
                else:
                    print_result(False, f"✗ Seller receives is {data.get('newNetAmount')}, expected {expected_seller}")
                
                return True
            else:
                print_result(False, "Commission update failed")
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
    """Step 5.1: Verify commission changes were persisted"""
    print_test_header("Step 5.1: Verify Commission Changes Persisted")
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
                # Find our transaction
                transaction = None
                for tx in data["transactions"]:
                    if tx["_id"] == test_data["transaction_id"]:
                        transaction = tx
                        break
                
                if not transaction:
                    print_result(False, "Transaction not found")
                    return False
                
                # Verify new commission rate
                if transaction["commissionRate"] == 5:
                    print_result(True, "✓ Commission rate updated to 5%")
                else:
                    print_result(False, f"✗ Commission rate is {transaction['commissionRate']}%, expected 5%")
                    return False
                
                # Verify new commission amount
                if transaction["commissionAmount"] == 5000:
                    print_result(True, "✓ Commission amount updated to 5000 FCFA")
                else:
                    print_result(False, f"✗ Commission amount is {transaction['commissionAmount']}, expected 5000")
                    return False
                
                # Verify new seller receives
                if transaction["sellerReceives"] == 95000:
                    print_result(True, "✓ Seller receives updated to 95000 FCFA")
                else:
                    print_result(False, f"✗ Seller receives is {transaction['sellerReceives']}, expected 95000")
                    return False
                
                # Verify admin notes
                if transaction.get("adminNotes"):
                    print_result(True, f"✓ Admin notes recorded: {transaction['adminNotes']}")
                else:
                    print_result(False, "✗ Admin notes not recorded")
                    return False
                
                return True
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

# ============================================================================
# STEP 6: SECURITY TESTS
# ============================================================================

def test_user_cannot_validate_payment():
    """Step 6.1: Verify normal user cannot validate payment"""
    print_test_header("Step 6.1: User Cannot Validate Payment (403)")
    try:
        response = requests.put(
            f"{BASE_URL}/admin/transactions",
            json={
                "transactionId": test_data["transaction_id"],
                "action": "validate_payment"
            },
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {test_data['buyer_token']}"  # Using buyer token (not admin)
            }
        )
        
        if response.status_code == 403:
            print_result(True, "✓ User correctly blocked from validating payment (403)")
            return True
        else:
            print_result(False, f"Expected 403, got {response.status_code}")
            print_response(response)
            return False
    except Exception as e:
        print_result(False, f"Exception: {str(e)}")
        return False

def test_user_cannot_modify_commission():
    """Step 6.2: Verify normal user cannot modify commission"""
    print_test_header("Step 6.2: User Cannot Modify Commission (403)")
    try:
        response = requests.put(
            f"{BASE_URL}/admin/transactions",
            json={
                "transactionId": test_data["transaction_id"],
                "action": "update_commission",
                "commissionRate": 1
            },
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {test_data['buyer_token']}"  # Using buyer token (not admin)
            }
        )
        
        if response.status_code == 403:
            print_result(True, "✓ User correctly blocked from modifying commission (403)")
            return True
        else:
            print_result(False, f"Expected 403, got {response.status_code}")
            print_response(response)
            return False
    except Exception as e:
        print_result(False, f"Exception: {str(e)}")
        return False

def test_invalid_listing_id():
    """Step 6.3: Verify transaction with invalid listing ID fails"""
    print_test_header("Step 6.3: Invalid Listing ID (404)")
    try:
        response = requests.post(
            f"{BASE_URL}/transactions/create",
            json={
                "listingId": "invalid-listing-id-12345",
                "amount": 100000,
                "paymentMethod": "AIRTEL_MONEY",
                "paymentReference": "TXN999999999"
            },
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {test_data['buyer_token']}"
            }
        )
        
        if response.status_code == 404:
            print_result(True, "✓ Invalid listing ID correctly rejected (404)")
            return True
        else:
            print_result(False, f"Expected 404, got {response.status_code}")
            print_response(response)
            return False
    except Exception as e:
        print_result(False, f"Exception: {str(e)}")
        return False

def test_missing_payment_reference():
    """Step 6.4: Verify transaction without payment reference fails"""
    print_test_header("Step 6.4: Missing Payment Reference (400)")
    try:
        response = requests.post(
            f"{BASE_URL}/transactions/create",
            json={
                "listingId": test_data["listing_id"],
                "amount": 100000,
                "paymentMethod": "AIRTEL_MONEY"
                # Missing paymentReference
            },
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {test_data['buyer_token']}"
            }
        )
        
        if response.status_code == 400:
            print_result(True, "✓ Missing payment reference correctly rejected (400)")
            return True
        else:
            print_result(False, f"Expected 400, got {response.status_code}")
            print_response(response)
            return False
    except Exception as e:
        print_result(False, f"Exception: {str(e)}")
        return False

# ============================================================================
# MAIN TEST RUNNER
# ============================================================================

def run_all_tests():
    """Run all escrow payment tests"""
    print("\n" + "="*80)
    print("KAPUCE.G - ESCROW PAYMENT SYSTEM - COMPLETE FLOW TEST")
    print("="*80)
    print(f"Base URL: {BASE_URL}")
    print(f"Start Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("="*80)
    
    results = {}
    
    # Step 0: Authentication
    results["0.1 Admin Login"] = test_admin_login()
    results["0.2 Create Owner"] = test_create_owner()
    results["0.3 Create Buyer"] = test_create_buyer()
    
    # Step 1: Create Listing
    results["1. Create Listing"] = test_create_listing()
    
    # Step 2: Client Pays
    results["2. Create Transaction"] = test_create_transaction()
    results["2.1 Verify Calculations"] = test_transaction_calculations()
    results["2.2 Reject Own Purchase"] = test_reject_own_listing_purchase()
    
    # Step 3: Admin Validates Payment
    results["3. Admin Validate Payment"] = test_admin_validate_payment()
    results["3.1 Verify Payment Status"] = test_verify_payment_status()
    
    # Step 4: Verify Notification
    results["4.1 Verify System Conversation"] = test_verify_system_conversation()
    results["4.2 Verify System Message"] = test_verify_system_message()
    results["4.3 Verify Last Message"] = test_verify_conversation_last_message()
    
    # Step 5: Admin Modifies Commission
    results["5. Admin Modify Commission"] = test_admin_modify_commission()
    results["5.1 Verify Commission Persisted"] = test_verify_commission_persisted()
    
    # Step 6: Security Tests
    results["6.1 User Cannot Validate"] = test_user_cannot_validate_payment()
    results["6.2 User Cannot Modify Commission"] = test_user_cannot_modify_commission()
    results["6.3 Invalid Listing ID"] = test_invalid_listing_id()
    results["6.4 Missing Payment Reference"] = test_missing_payment_reference()
    
    # Summary
    print("\n" + "="*80)
    print("TEST SUMMARY")
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
    
    return results

if __name__ == "__main__":
    run_all_tests()
