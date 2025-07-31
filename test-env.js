// Test if environment variable is loaded
console.log('OPENAI_API_KEY exists:', !!process.env.OPENAI_API_KEY);
console.log('OPENAI_API_KEY length:', process.env.OPENAI_API_KEY?.length || 0);
console.log('First 10 chars:', process.env.OPENAI_API_KEY?.substring(0, 10) + '...');