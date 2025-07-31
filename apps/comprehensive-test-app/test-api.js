#!/usr/bin/env node

const jwt = require('jsonwebtoken');
const axios = require('axios');

const API_BASE = 'http://localhost:3001/api';
const JWT_SECRET = 'your-jwt-secret-change-in-production';

// Create a test JWT token
const testUser = {
  id: 'test-user-123',
  email: 'test@example.com',
  name: 'Test User',
  role: 'admin'
};

const token = jwt.sign(testUser, JWT_SECRET, { expiresIn: '1h' });
console.log('Test JWT Token:', token);

const headers = {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
};

async function testAPI() {
  try {
    console.log('\n🧪 Testing Comprehensive Test App API');
    console.log('=====================================');

    // Test Organizations
    console.log('\n📊 Testing Organizations API...');
    
    // Create an organization
    const orgData = {
      name: 'Test Organization',
      billingEmail: 'billing@test.com',
      plan: 'professional'
    };
    
    const createOrgResponse = await axios.post(`${API_BASE}/Organizations`, orgData, { headers });
    console.log('✅ Organization created:', createOrgResponse.data.data.name);
    const orgId = createOrgResponse.data.data.id;

    // Get organizations
    const getOrgsResponse = await axios.get(`${API_BASE}/Organizations`, { headers });
    console.log('✅ Organizations list fetched:', getOrgsResponse.data.data.length, 'items');

    // Test Users
    console.log('\n👥 Testing Users API...');
    
    const userData = {
      email: 'user@example.com',
      name: 'Test User',
      role: 'user',
      organizationId: orgId
    };
    
    const createUserResponse = await axios.post(`${API_BASE}/Users`, userData, { headers });
    console.log('✅ User created:', createUserResponse.data.data.name);
    const userId = createUserResponse.data.data.id;

    // Test Projects
    console.log('\n📋 Testing Projects API...');
    
    const projectData = {
      name: 'Test Project',
      description: 'A test project for validation',
      organizationId: orgId,
      ownerId: userId,
      status: 'active',
      priority: 'high'
    };
    
    const createProjectResponse = await axios.post(`${API_BASE}/Projects`, projectData, { headers });
    console.log('✅ Project created:', createProjectResponse.data.data.name);
    const projectId = createProjectResponse.data.data.id;

    // Test Tasks
    console.log('\n✅ Testing Tasks API...');
    
    const taskData = {
      title: 'Test Task',
      description: 'A test task for validation',
      projectId: projectId,
      createdBy: userId,
      assignedTo: userId,
      status: 'todo',
      priority: 'medium'
    };
    
    const createTaskResponse = await axios.post(`${API_BASE}/Tasks`, taskData, { headers });
    console.log('✅ Task created:', createTaskResponse.data.data.title);

    // Test API endpoints with queries
    console.log('\n🔍 Testing API queries...');
    
    const usersResponse = await axios.get(`${API_BASE}/Users?page=1&limit=5`, { headers });
    console.log('✅ Users paginated query:', usersResponse.data.pagination);
    
    const projectsResponse = await axios.get(`${API_BASE}/Projects`, { headers });
    console.log('✅ Projects fetched:', projectsResponse.data.data.length, 'items');
    
    const tasksResponse = await axios.get(`${API_BASE}/Tasks`, { headers });
    console.log('✅ Tasks fetched:', tasksResponse.data.data.length, 'items');

    console.log('\n🎉 All API tests passed successfully!');
    
  } catch (error) {
    console.error('❌ API Test failed:', error.response?.data || error.message);
    process.exit(1);
  }
}

// Run the tests
testAPI().then(() => {
  console.log('\n✨ API testing completed successfully!');
  process.exit(0);
});