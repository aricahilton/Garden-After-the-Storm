#!/usr/bin/env python3
"""
Backend API Tests for Garden After the Storm
Tests all backend endpoints including the critical file upload functionality.
"""

import requests
import json
import tempfile
import os
from datetime import datetime
from pathlib import Path

class GardenStormAPITester:
    def __init__(self, base_url="https://helper-upload-issue.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_base = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.session_id = f"test_session_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        
        print(f"🧪 Garden After the Storm Backend API Tester")
        print(f"🌐 Testing endpoint: {self.api_base}")
        print(f"🆔 Session ID: {self.session_id}")
        print("=" * 60)

    def run_test(self, test_name, method, endpoint, expected_status=200, data=None, files=None, timeout=30):
        """Run a single API test"""
        url = f"{self.api_base}{endpoint}"
        self.tests_run += 1
        
        print(f"\n🔍 [{self.tests_run}] Testing: {test_name}")
        print(f"📍 {method} {url}")
        
        try:
            headers = {}
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=timeout)
            elif method == 'POST':
                if files:
                    # For file uploads, don't set Content-Type header
                    response = requests.post(url, data=data, files=files, timeout=timeout)
                else:
                    headers['Content-Type'] = 'application/json'
                    response = requests.post(url, json=data, headers=headers, timeout=timeout)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=timeout)
            
            # Check status code
            if response.status_code == expected_status:
                self.tests_passed += 1
                print(f"✅ Status: {response.status_code} (Expected: {expected_status})")
                
                # Try to parse response
                try:
                    response_data = response.json()
                    print(f"📄 Response: {json.dumps(response_data, indent=2)[:200]}...")
                    return True, response_data
                except:
                    print(f"📄 Response: {response.text[:200]}...")
                    return True, response.text
            else:
                print(f"❌ Status: {response.status_code} (Expected: {expected_status})")
                print(f"📄 Error Response: {response.text[:300]}...")
                return False, {}
                
        except requests.exceptions.Timeout:
            print(f"⏰ Test timed out after {timeout} seconds")
            return False, {}
        except Exception as e:
            print(f"❌ Exception: {str(e)}")
            return False, {}

    def test_root_endpoint(self):
        """Test the root API endpoint"""
        return self.run_test("Root API endpoint", "GET", "/")

    def test_file_upload(self):
        """Test file upload functionality - CRITICAL TEST"""
        print(f"\n🎯 CRITICAL TEST: File Upload (Main Bug Fix)")
        
        # Test with a small text file
        test_content = "This is a test file for Garden After the Storm chat upload testing."
        
        with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False) as f:
            f.write(test_content)
            temp_file_path = f.name
        
        try:
            with open(temp_file_path, 'rb') as file:
                files = {'file': ('test_upload.txt', file, 'text/plain')}
                success, response = self.run_test(
                    "File Upload - Text File", 
                    "POST", 
                    "/upload", 
                    expected_status=200,
                    files=files,
                    timeout=60
                )
                
                if success and 'url' in response:
                    file_url = response['url']
                    print(f"📁 Uploaded file URL: {file_url}")
                    
                    # Test accessing the uploaded file
                    file_access_success, _ = self.run_test(
                        "Access Uploaded File",
                        "GET",
                        file_url,
                        expected_status=200
                    )
                    
                    return success and file_access_success, response
                else:
                    return False, response
                    
        finally:
            # Clean up temp file
            try:
                os.unlink(temp_file_path)
            except:
                pass

    def test_large_file_upload(self):
        """Test large file upload to ensure chunked processing works"""
        print(f"\n🎯 CRITICAL TEST: Large File Upload (Chunk Processing)")
        
        # Create a 2MB test file to test chunked upload
        large_content = "A" * (2 * 1024 * 1024)  # 2MB of 'A's
        
        with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False) as f:
            f.write(large_content)
            temp_file_path = f.name
        
        try:
            with open(temp_file_path, 'rb') as file:
                files = {'file': ('large_test.txt', file, 'text/plain')}
                success, response = self.run_test(
                    "Large File Upload (2MB)", 
                    "POST", 
                    "/upload", 
                    expected_status=200,
                    files=files,
                    timeout=120  # Longer timeout for large file
                )
                return success, response
                
        finally:
            # Clean up temp file
            try:
                os.unlink(temp_file_path)
            except:
                pass

    def test_chat_without_file(self):
        """Test basic chat functionality"""
        chat_data = {
            "session_id": self.session_id,
            "message": "Hello! Tell me about Garden After the Storm album."
        }
        
        return self.run_test(
            "Chat - Text Only",
            "POST",
            "/chat",
            expected_status=200,
            data=chat_data,
            timeout=60  # AI response may take time
        )

    def test_chat_history(self):
        """Test chat history retrieval"""
        return self.run_test(
            "Get Chat History",
            "GET",
            f"/chat/history/{self.session_id}"
        )

    def test_subscribe(self):
        """Test email subscription"""
        subscribe_data = {
            "email": f"test_{datetime.now().strftime('%H%M%S')}@example.com"
        }
        
        return self.run_test(
            "Email Subscription",
            "POST",
            "/subscribe",
            expected_status=200,
            data=subscribe_data
        )

    def test_chat_with_file(self, file_url=None):
        """Test chat with file attachment"""
        if not file_url:
            print("⚠️ Skipping chat with file test - no uploaded file URL available")
            return True, {}
            
        chat_data = {
            "session_id": self.session_id,
            "message": "I've attached a file. Can you tell me about it?",
            "file_url": file_url,
            "file_type": "document",
            "file_name": "test_upload.txt"
        }
        
        return self.run_test(
            "Chat - With File Attachment",
            "POST",
            "/chat",
            expected_status=200,
            data=chat_data,
            timeout=60
        )

    def run_all_tests(self):
        """Run all backend API tests"""
        print("🚀 Starting comprehensive backend API testing...\n")
        
        # Test 1: Root endpoint
        self.test_root_endpoint()
        
        # Test 2: File upload (CRITICAL)
        file_upload_success, file_response = self.test_file_upload()
        uploaded_file_url = file_response.get('url') if file_upload_success else None
        
        # Test 3: Large file upload (CRITICAL)
        self.test_large_file_upload()
        
        # Test 4: Basic chat
        self.test_chat_without_file()
        
        # Test 5: Chat history
        self.test_chat_history()
        
        # Test 6: Chat with file (if upload worked)
        if uploaded_file_url:
            self.test_chat_with_file(uploaded_file_url)
        
        # Test 7: Subscribe
        self.test_subscribe()
        
        # Summary
        print("\n" + "=" * 60)
        print(f"🏁 TESTING COMPLETE")
        print(f"📊 Results: {self.tests_passed}/{self.tests_run} tests passed")
        
        success_rate = (self.tests_passed / self.tests_run) * 100 if self.tests_run > 0 else 0
        print(f"📈 Success Rate: {success_rate:.1f}%")
        
        if success_rate >= 80:
            print("✅ Backend is functioning well!")
        elif success_rate >= 60:
            print("⚠️ Backend has some issues but core functionality works")
        else:
            print("❌ Backend has significant issues")
        
        print("=" * 60)
        
        return success_rate >= 60  # Consider 60%+ as acceptable

def main():
    """Main test execution"""
    tester = GardenStormAPITester()
    
    try:
        success = tester.run_all_tests()
        return 0 if success else 1
    except KeyboardInterrupt:
        print("\n\n⏹️ Testing interrupted by user")
        return 1
    except Exception as e:
        print(f"\n\n💥 Unexpected error during testing: {str(e)}")
        return 1

if __name__ == "__main__":
    import sys
    sys.exit(main())