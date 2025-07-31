#!/usr/bin/env node

// Test OpenAI integration directly
const OpenAI = require('openai');
require('dotenv').config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function testOpenAIConnection() {
  console.log('🧪 Testing OpenAI Connection...\n');
  
  try {
    console.log('1️⃣ Testing basic OpenAI API call...');
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a helpful business analyst."
        },
        {
          role: "user",
          content: "Briefly analyze the following business: A local pizza restaurant that offers delivery and takeout. Return analysis in JSON format with businessType, industry, and 3 keyInsights."
        }
      ],
      temperature: 0.3,
      max_tokens: 500,
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(response.choices[0].message.content);
    
    console.log('✅ OpenAI API connection successful!');
    console.log('🤖 Sample AI Analysis:');
    console.log(JSON.stringify(result, null, 2));
    
    console.log('\n🎉 OpenAI integration is working correctly!');
    console.log('✅ The AI endpoints in the app should work properly');
    
  } catch (error) {
    console.error('❌ OpenAI test failed:', error.message);
    
    if (error.message.includes('API key')) {
      console.log('\n💡 Possible fixes:');
      console.log('1. Check if OPENAI_API_KEY is set in .env file');
      console.log('2. Verify the API key is valid and has credit');
      console.log('3. Make sure .env file is in the project root');
    }
    
    process.exit(1);
  }
}

testOpenAIConnection();