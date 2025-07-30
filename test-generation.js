const fs = require('fs');
const path = require('path');

// Remove existing directory
const appPath = path.join(__dirname, 'apps', 'line-properties-saas');
try {
  if (fs.existsSync(appPath)) {
    fs.rmSync(appPath, { recursive: true, force: true });
    console.log('✅ Removed existing application');
  }
} catch (error) {
  console.log('No existing application to remove');
}

console.log('🚀 Generation test completed');