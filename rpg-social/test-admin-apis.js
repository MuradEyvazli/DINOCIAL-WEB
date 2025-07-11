// test-admin-apis.js - Test script for admin APIs
// Run with: node test-admin-apis.js

const BASE_URL = 'http://localhost:3000';

// Mock nexus token (replace with real token when testing)
const NEXUS_TOKEN = 'your-nexus-token-here';

async function testAPI(endpoint, description) {
  try {
    console.log(`\n🧪 Testing: ${description}`);
    console.log(`📡 Endpoint: ${endpoint}`);
    
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${NEXUS_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Success:', data.success);
      if (data.users) console.log(`👥 Users found: ${data.users.length}`);
      if (data.totalPosts) console.log(`📝 Total posts: ${data.totalPosts}`);
      if (data.conversations) console.log(`💬 Conversations: ${data.conversations.length}`);
      if (data.relationships) console.log(`🤝 Relationships: ${data.relationships.length}`);
      if (data.logs) console.log(`📋 Logs: ${data.logs.length}`);
      if (data.alerts) console.log(`🚨 Security alerts: ${data.alerts.length}`);
    } else {
      console.log('❌ Error:', data.message);
    }
  } catch (error) {
    console.log('🔥 Network error:', error.message);
  }
}

async function runTests() {
  console.log('🚀 Testing Admin Panel APIs');
  console.log('============================');
  
  await testAPI('/api/nexus/dashboard', 'Dashboard Data');
  await testAPI('/api/nexus/users', 'User Management');
  await testAPI('/api/nexus/content', 'Content Analytics');
  await testAPI('/api/nexus/conversations', 'Message Monitoring');
  await testAPI('/api/nexus/friends', 'Friends/Relationships');
  await testAPI('/api/nexus/logs', 'System Logs');
  await testAPI('/api/nexus/security', 'Security Management');
  await testAPI('/api/nexus/realtime', 'Real-time Data');
  
  console.log('\n🎉 Test completed!');
  console.log('\nNote: Replace NEXUS_TOKEN with a real admin token to test properly.');
}

// Run the tests
runTests().catch(console.error);