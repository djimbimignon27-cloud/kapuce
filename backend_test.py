#!/usr/bin/env python3
"""
Backend API Tests for KAPUCE.G - Messaging & Anti-Fraud System
Tests all messaging endpoints and admin fraud management features
"""

import requests
import json
import time
from datetime import datetime

# Configuration
BASE_URL = "https://digital-marketplace-186.preview.emergentagent.com/api"
ADMIN_EMAIL = "superadmin@kama.com"
ADMIN_PASSWORD = "SuperAdminPassword123!"

# Test data storage
test_data = {
    "admin_token": None,
    "user1_token": None,
    "user2_token": None,
    "user1_id": None,
    "user2_id": None,
    "conversation_id": None,
    "message_ids": [],
    "alert_ids": [],
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
# AUTHENTICATION TESTS
# ============================================================================

def test_admin_login():
    """Test admin authentication"""
    print_test_header("Admin Login")
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

def test_create_user(user_num):
    """Create a test user for messaging"""
    print_test_header(f"Create User {user_num}")
    try:
        timestamp = int(time.time())
        email = f"testuser{user_num}_{timestamp}@kapuce.test"
        
        response = requests.post(
            f"{BASE_URL}/auth/register",
            json={
                "email": email,
                "password": "TestPassword123!",
                "fullName": f"Test User {user_num}",
                "phone": f"07712345{user_num}",
                "role": "USER"
            },
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 201:
            data = response.json()
            if "accessToken" in data:
                test_data[f"user{user_num}_token"] = data["accessToken"]
                # Handle both 'id' and '_id' field names
                user_id = data["user"].get("_id") or data["user"].get("id")
                test_data[f"user{user_num}_id"] = user_id
                print_result(True, f"User {user_num} created: {email}, ID: {user_id}")
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
# MESSAGING TESTS
# ============================================================================

def test_create_conversation():
    """Test creating a conversation between two users"""
    print_test_header("Create Conversation")
    try:
        response = requests.post(
            f"{BASE_URL}/messages/conversations",
            json={
                "receiverId": test_data["user2_id"],
                "listingTitle": "Test Property Listing"
            },
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {test_data['user1_token']}"
            }
        )
        
        if response.status_code == 200:
            data = response.json()
            if data.get("success") and "conversation" in data:
                test_data["conversation_id"] = data["conversation"]["_id"]
                print_result(True, f"Conversation created: {test_data['conversation_id']}")
                print(f"Participants: {data['conversation'].get('participants')}")
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

def test_get_conversations():
    """Test getting user's conversations"""
    print_test_header("Get User Conversations")
    try:
        response = requests.get(
            f"{BASE_URL}/messages/conversations",
            headers={
                "Authorization": f"Bearer {test_data['user1_token']}"
            }
        )
        
        if response.status_code == 200:
            data = response.json()
            if data.get("success") and "conversations" in data:
                conv_count = len(data["conversations"])
                print_result(True, f"Retrieved {conv_count} conversation(s)")
                if conv_count > 0:
                    conv = data["conversations"][0]
                    print(f"First conversation: {conv.get('_id')}")
                    print(f"Other participant: {conv.get('otherParticipant', {}).get('fullName')}")
                    print(f"Unread count: {conv.get('unreadCount', 0)}")
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

def test_send_normal_message():
    """Test sending a normal message"""
    print_test_header("Send Normal Message")
    try:
        response = requests.post(
            f"{BASE_URL}/messages",
            json={
                "conversationId": test_data["conversation_id"],
                "content": "Bonjour, je suis très intéressé par cette propriété. Pouvez-vous me donner plus d'informations?"
            },
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {test_data['user1_token']}"
            }
        )
        
        if response.status_code == 200:
            data = response.json()
            if data.get("success") and "message" in data:
                test_data["message_ids"].append(data["message"]["_id"])
                is_filtered = data.get("isFiltered", False)
                warning = data.get("warning")
                print_result(True, f"Message sent successfully. Filtered: {is_filtered}")
                if warning:
                    print(f"Warning: {warning}")
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

def test_send_message_with_phone():
    """Test sending message with phone number (should trigger fraud alert)"""
    print_test_header("Send Message with Phone Number (Anti-Fraud Test)")
    try:
        response = requests.post(
            f"{BASE_URL}/messages",
            json={
                "conversationId": test_data["conversation_id"],
                "content": "Appelez-moi directement au 077 12 34 56 pour discuter"
            },
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {test_data['user1_token']}"
            }
        )
        
        if response.status_code == 200:
            data = response.json()
            if data.get("success"):
                is_filtered = data.get("isFiltered", False)
                warning = data.get("warning")
                message_content = data.get("message", {}).get("content", "")
                
                if is_filtered and "[NUMÉRO MASQUÉ]" in message_content:
                    print_result(True, "Phone number detected and filtered correctly")
                    print(f"Filtered content: {message_content}")
                    print(f"Warning: {warning}")
                    return True
                else:
                    print_result(False, f"Phone number NOT filtered. Filtered: {is_filtered}, Content: {message_content}")
                    return False
            else:
                print_result(False, "Message sending failed")
                print_response(response)
                return False
        else:
            print_result(False, f"Failed with status {response.status_code}")
            print_response(response)
            return False
    except Exception as e:
        print_result(False, f"Exception: {str(e)}")
        return False

def test_send_message_with_email():
    """Test sending message with email (should trigger fraud alert)"""
    print_test_header("Send Message with Email (Anti-Fraud Test)")
    try:
        response = requests.post(
            f"{BASE_URL}/messages",
            json={
                "conversationId": test_data["conversation_id"],
                "content": "Contactez-moi sur mon email personnel: contact@example.com"
            },
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {test_data['user1_token']}"
            }
        )
        
        if response.status_code == 200:
            data = response.json()
            if data.get("success"):
                is_filtered = data.get("isFiltered", False)
                message_content = data.get("message", {}).get("content", "")
                
                if is_filtered and "[EMAIL MASQUÉ]" in message_content:
                    print_result(True, "Email detected and filtered correctly")
                    print(f"Filtered content: {message_content}")
                    return True
                else:
                    print_result(False, f"Email NOT filtered. Filtered: {is_filtered}")
                    return False
            else:
                print_result(False, "Message sending failed")
                print_response(response)
                return False
        else:
            print_result(False, f"Failed with status {response.status_code}")
            print_response(response)
            return False
    except Exception as e:
        print_result(False, f"Exception: {str(e)}")
        return False

def test_send_message_with_whatsapp():
    """Test sending message with WhatsApp mention (should trigger fraud alert)"""
    print_test_header("Send Message with WhatsApp (Anti-Fraud Test)")
    try:
        response = requests.post(
            f"{BASE_URL}/messages",
            json={
                "conversationId": test_data["conversation_id"],
                "content": "Ajoutez-moi sur WhatsApp pour continuer la discussion"
            },
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {test_data['user1_token']}"
            }
        )
        
        if response.status_code == 200:
            data = response.json()
            if data.get("success"):
                is_filtered = data.get("isFiltered", False)
                warning = data.get("warning")
                
                if is_filtered:
                    print_result(True, "WhatsApp mention detected and flagged")
                    print(f"Warning: {warning}")
                    return True
                else:
                    print_result(False, "WhatsApp mention NOT detected")
                    return False
            else:
                print_result(False, "Message sending failed")
                print_response(response)
                return False
        else:
            print_result(False, f"Failed with status {response.status_code}")
            print_response(response)
            return False
    except Exception as e:
        print_result(False, f"Exception: {str(e)}")
        return False

def test_send_message_with_external_payment():
    """Test sending message with external payment mention (CRITICAL - should trigger fraud alert)"""
    print_test_header("Send Message with External Payment (Anti-Fraud CRITICAL Test)")
    try:
        response = requests.post(
            f"{BASE_URL}/messages",
            json={
                "conversationId": test_data["conversation_id"],
                "content": "On peut faire le paiement directement en Airtel Money, c'est plus simple"
            },
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {test_data['user1_token']}"
            }
        )
        
        if response.status_code == 200:
            data = response.json()
            if data.get("success"):
                is_filtered = data.get("isFiltered", False)
                warning = data.get("warning")
                
                if is_filtered:
                    print_result(True, "External payment detected and flagged as CRITICAL")
                    print(f"Warning: {warning}")
                    return True
                else:
                    print_result(False, "External payment mention NOT detected")
                    return False
            else:
                print_result(False, "Message sending failed")
                print_response(response)
                return False
        else:
            print_result(False, f"Failed with status {response.status_code}")
            print_response(response)
            return False
    except Exception as e:
        print_result(False, f"Exception: {str(e)}")
        return False

def test_get_messages():
    """Test retrieving messages from a conversation"""
    print_test_header("Get Messages from Conversation")
    try:
        response = requests.get(
            f"{BASE_URL}/messages?conversationId={test_data['conversation_id']}",
            headers={
                "Authorization": f"Bearer {test_data['user1_token']}"
            }
        )
        
        if response.status_code == 200:
            data = response.json()
            if data.get("success") and "messages" in data:
                msg_count = len(data["messages"])
                print_result(True, f"Retrieved {msg_count} message(s)")
                
                # Check for filtered messages
                filtered_count = sum(1 for msg in data["messages"] if msg.get("isFiltered"))
                print(f"Filtered messages: {filtered_count}/{msg_count}")
                
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
# ADMIN - FRAUD ALERTS TESTS
# ============================================================================

def test_admin_get_alerts():
    """Test admin getting fraud alerts"""
    print_test_header("Admin - Get Fraud Alerts")
    try:
        response = requests.get(
            f"{BASE_URL}/admin/alerts?status=PENDING",
            headers={
                "Authorization": f"Bearer {test_data['admin_token']}"
            }
        )
        
        if response.status_code == 200:
            data = response.json()
            if data.get("success") and "alerts" in data:
                alert_count = len(data["alerts"])
                stats = data.get("stats", {})
                print_result(True, f"Retrieved {alert_count} alert(s)")
                print(f"Stats: {stats}")
                
                # Store alert IDs for later tests
                if alert_count > 0:
                    test_data["alert_ids"] = [alert["_id"] for alert in data["alerts"]]
                    print(f"First alert type: {data['alerts'][0].get('type')}")
                    print(f"First alert severity: {data['alerts'][0].get('severity')}")
                    print(f"User: {data['alerts'][0].get('user', {}).get('fullName')}")
                
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

def test_admin_review_alert():
    """Test admin reviewing an alert"""
    print_test_header("Admin - Review Alert")
    try:
        if not test_data["alert_ids"]:
            print_result(False, "No alerts available to review")
            return False
        
        alert_id = test_data["alert_ids"][0]
        
        response = requests.put(
            f"{BASE_URL}/admin/alerts",
            json={
                "alertId": alert_id,
                "action": "review",
                "adminNotes": "Alert reviewed - monitoring user activity"
            },
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {test_data['admin_token']}"
            }
        )
        
        if response.status_code == 200:
            data = response.json()
            if data.get("success"):
                print_result(True, "Alert reviewed successfully")
                return True
            else:
                print_result(False, "Review failed")
                print_response(response)
                return False
        else:
            print_result(False, f"Failed with status {response.status_code}")
            print_response(response)
            return False
    except Exception as e:
        print_result(False, f"Exception: {str(e)}")
        return False

def test_admin_dismiss_alert():
    """Test admin dismissing an alert"""
    print_test_header("Admin - Dismiss Alert")
    try:
        if len(test_data["alert_ids"]) < 2:
            print_result(False, "Not enough alerts to test dismiss")
            return False
        
        alert_id = test_data["alert_ids"][1]
        
        response = requests.put(
            f"{BASE_URL}/admin/alerts",
            json={
                "alertId": alert_id,
                "action": "dismiss",
                "adminNotes": "False positive - legitimate message"
            },
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {test_data['admin_token']}"
            }
        )
        
        if response.status_code == 200:
            data = response.json()
            if data.get("success"):
                print_result(True, "Alert dismissed successfully")
                return True
            else:
                print_result(False, "Dismiss failed")
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
# ADMIN - MESSAGE SUPERVISION TESTS
# ============================================================================

def test_admin_get_all_conversations():
    """Test admin getting all conversations"""
    print_test_header("Admin - Get All Conversations")
    try:
        response = requests.get(
            f"{BASE_URL}/admin/messages?filter=ALL",
            headers={
                "Authorization": f"Bearer {test_data['admin_token']}"
            }
        )
        
        if response.status_code == 200:
            data = response.json()
            if data.get("success") and "conversations" in data:
                conv_count = len(data["conversations"])
                stats = data.get("stats", {})
                print_result(True, f"Retrieved {conv_count} conversation(s)")
                print(f"Stats: Total messages: {stats.get('totalMessages')}, Filtered: {stats.get('filteredMessages')}")
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

def test_admin_get_flagged_conversations():
    """Test admin getting flagged conversations"""
    print_test_header("Admin - Get Flagged Conversations")
    try:
        response = requests.get(
            f"{BASE_URL}/admin/messages?filter=FLAGGED",
            headers={
                "Authorization": f"Bearer {test_data['admin_token']}"
            }
        )
        
        if response.status_code == 200:
            data = response.json()
            if data.get("success") and "conversations" in data:
                conv_count = len(data["conversations"])
                print_result(True, f"Retrieved {conv_count} flagged conversation(s)")
                
                if conv_count > 0:
                    conv = data["conversations"][0]
                    print(f"Filtered messages count: {conv.get('filteredMessagesCount')}")
                
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

def test_admin_get_conversation_messages():
    """Test admin viewing messages of a specific conversation"""
    print_test_header("Admin - Get Conversation Messages")
    try:
        if not test_data["conversation_id"]:
            print_result(False, "No conversation ID available")
            return False
        
        response = requests.get(
            f"{BASE_URL}/admin/messages/{test_data['conversation_id']}",
            headers={
                "Authorization": f"Bearer {test_data['admin_token']}"
            }
        )
        
        if response.status_code == 200:
            data = response.json()
            if data.get("success") and "messages" in data:
                msg_count = len(data["messages"])
                print_result(True, f"Retrieved {msg_count} message(s)")
                
                # Check if admin can see both filtered and original content
                filtered_msgs = [msg for msg in data["messages"] if msg.get("isFiltered")]
                if filtered_msgs:
                    print(f"Filtered messages: {len(filtered_msgs)}")
                    print(f"Example - Original: {filtered_msgs[0].get('originalContent', 'N/A')[:50]}")
                    print(f"Example - Filtered: {filtered_msgs[0].get('content', 'N/A')[:50]}")
                
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
# ADMIN - USER MANAGEMENT TESTS
# ============================================================================

def test_admin_block_user():
    """Test admin blocking a user"""
    print_test_header("Admin - Block User")
    try:
        response = requests.put(
            f"{BASE_URL}/admin/users",
            json={
                "userId": test_data["user1_id"],
                "action": "block",
                "reason": "Multiple fraud attempts detected"
            },
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {test_data['admin_token']}"
            }
        )
        
        if response.status_code == 200:
            data = response.json()
            if data.get("success"):
                print_result(True, f"User blocked: {data.get('message')}")
                return True
            else:
                print_result(False, "Block failed")
                print_response(response)
                return False
        else:
            print_result(False, f"Failed with status {response.status_code}")
            print_response(response)
            return False
    except Exception as e:
        print_result(False, f"Exception: {str(e)}")
        return False

def test_blocked_user_cannot_send_message():
    """Test that blocked user cannot send messages"""
    print_test_header("Blocked User Cannot Send Message")
    try:
        response = requests.post(
            f"{BASE_URL}/messages",
            json={
                "conversationId": test_data["conversation_id"],
                "content": "Test message from blocked user"
            },
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {test_data['user1_token']}"
            }
        )
        
        if response.status_code == 403:
            data = response.json()
            error_msg = data.get("error", "")
            if "bloqué" in error_msg.lower() or "blocked" in error_msg.lower():
                print_result(True, f"Blocked user correctly prevented from sending: {error_msg}")
                return True
            else:
                print_result(False, f"Wrong error message: {error_msg}")
                return False
        else:
            print_result(False, f"Expected 403, got {response.status_code}")
            print_response(response)
            return False
    except Exception as e:
        print_result(False, f"Exception: {str(e)}")
        return False

def test_admin_unblock_user():
    """Test admin unblocking a user"""
    print_test_header("Admin - Unblock User")
    try:
        response = requests.put(
            f"{BASE_URL}/admin/users",
            json={
                "userId": test_data["user1_id"],
                "action": "unblock"
            },
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {test_data['admin_token']}"
            }
        )
        
        if response.status_code == 200:
            data = response.json()
            if data.get("success"):
                print_result(True, f"User unblocked: {data.get('message')}")
                return True
            else:
                print_result(False, "Unblock failed")
                print_response(response)
                return False
        else:
            print_result(False, f"Failed with status {response.status_code}")
            print_response(response)
            return False
    except Exception as e:
        print_result(False, f"Exception: {str(e)}")
        return False

def test_unblocked_user_can_send_message():
    """Test that unblocked user can send messages again"""
    print_test_header("Unblocked User Can Send Message")
    try:
        response = requests.post(
            f"{BASE_URL}/messages",
            json={
                "conversationId": test_data["conversation_id"],
                "content": "Message après déblocage - tout est en ordre maintenant"
            },
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {test_data['user1_token']}"
            }
        )
        
        if response.status_code == 200:
            data = response.json()
            if data.get("success"):
                print_result(True, "Unblocked user can send messages again")
                return True
            else:
                print_result(False, "Message sending failed")
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
# ADMIN - DASHBOARD STATS TEST
# ============================================================================

def test_admin_dashboard_stats():
    """Test admin dashboard stats include fraud alerts"""
    print_test_header("Admin - Dashboard Stats with Fraud Alerts")
    try:
        response = requests.get(
            f"{BASE_URL}/admin/dashboard-stats",
            headers={
                "Authorization": f"Bearer {test_data['admin_token']}"
            }
        )
        
        if response.status_code == 200:
            data = response.json()
            if "fraudAlerts" in data:
                fraud_alerts = data["fraudAlerts"]
                print_result(True, f"Dashboard stats include fraud alerts")
                print(f"Pending alerts: {fraud_alerts.get('pending')}")
                print(f"Total alerts: {fraud_alerts.get('total')}")
                return True
            else:
                print_result(False, "fraudAlerts field missing from dashboard stats")
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
# MAIN TEST RUNNER
# ============================================================================

def run_all_tests():
    """Run all backend tests"""
    print("\n" + "="*80)
    print("KAPUCE.G - BACKEND TESTING - MESSAGING & ANTI-FRAUD SYSTEM")
    print("="*80)
    print(f"Base URL: {BASE_URL}")
    print(f"Start Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("="*80)
    
    results = {}
    
    # Authentication
    results["Admin Login"] = test_admin_login()
    results["Create User 1"] = test_create_user(1)
    results["Create User 2"] = test_create_user(2)
    
    # Messaging
    results["Create Conversation"] = test_create_conversation()
    results["Get Conversations"] = test_get_conversations()
    results["Send Normal Message"] = test_send_normal_message()
    results["Send Message with Phone"] = test_send_message_with_phone()
    results["Send Message with Email"] = test_send_message_with_email()
    results["Send Message with WhatsApp"] = test_send_message_with_whatsapp()
    results["Send Message with External Payment"] = test_send_message_with_external_payment()
    results["Get Messages"] = test_get_messages()
    
    # Admin - Fraud Alerts
    results["Admin Get Alerts"] = test_admin_get_alerts()
    results["Admin Review Alert"] = test_admin_review_alert()
    results["Admin Dismiss Alert"] = test_admin_dismiss_alert()
    
    # Admin - Message Supervision
    results["Admin Get All Conversations"] = test_admin_get_all_conversations()
    results["Admin Get Flagged Conversations"] = test_admin_get_flagged_conversations()
    results["Admin Get Conversation Messages"] = test_admin_get_conversation_messages()
    
    # Admin - User Management
    results["Admin Block User"] = test_admin_block_user()
    results["Blocked User Cannot Send"] = test_blocked_user_cannot_send_message()
    results["Admin Unblock User"] = test_admin_unblock_user()
    results["Unblocked User Can Send"] = test_unblocked_user_can_send_message()
    
    # Admin - Dashboard Stats
    results["Admin Dashboard Stats"] = test_admin_dashboard_stats()
    
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
