// Test script for levels API
const axios = require('axios');

async function testLevelsAPI() {
  try {
    console.log('🧪 Testing Levels API...');
    
    // Test 1: Get all levels
    console.log('\n1. Testing GET /api/levels');
    const levelsResponse = await axios.get('http://localhost:3000/api/levels?page=1&limit=5');
    console.log('✅ Levels API working, found', levelsResponse.data.data.levels.length, 'levels');
    console.log('First level:', levelsResponse.data.data.levels[0]?.title);
    
    // Test 2: Test specific level
    console.log('\n2. Testing specific level');
    const specificLevel = await axios.get('http://localhost:3000/api/levels?level=1');
    console.log('✅ Level 1:', specificLevel.data.data.level?.title);
    console.log('XP Required:', specificLevel.data.data.level?.xpRequired);
    console.log('Quote:', specificLevel.data.data.level?.quote);
    
    // Test 3: Test level 100
    console.log('\n3. Testing level 100');
    const level100 = await axios.get('http://localhost:3000/api/levels?level=100');
    console.log('✅ Level 100:', level100.data.data.level?.title);
    console.log('XP Required:', level100.data.data.level?.xpRequired);
    console.log('Quote:', level100.data.data.level?.quote);
    
    console.log('\n🎉 All tests passed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testLevelsAPI();