// FREE & FAST Backend server with Groq API - server.js
console.log('--- Server.js starting with Groq AI ---');

const express = require('express');
const cors = require('cors');
require('dotenv').config();

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const app = express();
const port = 3001;

app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());

// Check API Key
if (!GROQ_API_KEY) {
  console.error('\n❌ GROQ_API_KEY not found in .env file!');
  console.error('📝 Get your FREE key from: https://console.groq.com\n');
} else {
  console.log('✅ GROQ_API_KEY loaded successfully');
}

// Main chat endpoint
app.post('/api/chat', async (req, res) => {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`\n[${timestamp}] 📨 New chat request received`);
  
  if (!GROQ_API_KEY) {
    return res.status(500).json({ 
      response: "⚠️ Server Error: GROQ_API_KEY not configured. Please check server logs." 
    });
  }

  try {
    const { message } = req.body;
    console.log('💬 User message:', message);
    
    console.log('🤖 Calling Groq AI...');
    
    // Call Groq API
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile', // Fast & Smart model
        messages: [
          {
            role: 'system',
            content: 'You are a helpful medical assistant chatbot. Provide accurate, empathetic medical information and general health advice. Keep responses concise, clear, and easy to understand. Always remind users to consult healthcare professionals for serious medical concerns. Be friendly and supportive.'
          },
          {
            role: 'user',
            content: message
          }
        ],
        temperature: 0.7,
        max_tokens: 1024,
        top_p: 0.9,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Groq API returned status ${response.status}: ${errorData}`);
    }

    const data = await response.json();
    console.log('✅ Response received from Groq');

    // Extract AI response
    if (data.choices && data.choices.length > 0) {
      const aiResponse = data.choices[0].message.content;
      
      // Log token usage (helpful for monitoring)
      if (data.usage) {
        console.log(`📊 Tokens used: ${data.usage.total_tokens} (prompt: ${data.usage.prompt_tokens}, completion: ${data.usage.completion_tokens})`);
      }
      
      res.json({ response: aiResponse });
    } else {
      console.warn('⚠️ No response choices from Groq');
      res.json({ 
        response: "I apologize, I couldn't generate a proper response. Please try rephrasing your question." 
      });
    }
  
  } catch (error) {
    console.error('\n❌ CHAT ERROR:');
    console.error(error.message);
    
    // Handle specific error types
    if (error.message.includes('429')) {
      console.error('⚠️ Rate limit exceeded');
      res.status(429).json({ 
        response: "I'm receiving too many requests right now. Please wait a few seconds and try again." 
      });
    } else if (error.message.includes('401') || error.message.includes('403')) {
      console.error('🔑 Authentication error - check your API key');
      res.status(500).json({ 
        response: "Server configuration error. Please check the API key." 
      });
    } else if (error.message.includes('ENOTFOUND') || error.message.includes('ECONNREFUSED')) {
      console.error('🌐 Network error');
      res.status(500).json({ 
        response: "Network error. Please check your internet connection and try again." 
      });
    } else {
      res.status(500).json({ 
        response: `An error occurred: ${error.message}. Please try again.` 
      });
    }
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok',
    ai_provider: 'Groq',
    model: 'Llama 3.3 70B Versatile',
    api_key_configured: !!GROQ_API_KEY,
    free_tier: true,
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(port, () => {
  console.log('\n🚀 ================================');
  console.log(`✅ Server running on http://localhost:${port}`);
  console.log('🤖 AI Provider: Groq (FREE & FAST)');
  console.log('🧠 Model: Llama 3.3 70B Versatile');
  console.log('📡 Endpoints:');
  console.log(`   - POST /api/chat (Main chat endpoint)`);
  console.log(`   - GET  /api/health (Health check)`);
  console.log('🎯 Ready to receive requests!');
  console.log('================================\n');
});