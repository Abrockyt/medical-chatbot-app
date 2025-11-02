// This is your UPDATED backend server - server.js
console.log('--- Server.js script starting ---');

const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { GoogleGenerativeAI } = require('@google/generative-ai');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const app = express();
const port = 3001;

// Setup CORS
app.use(cors({
  origin: 'http://localhost:3000' // Your React app's port
}));
app.use(express.json());

// API Key Check
if (!GEMINI_API_KEY) {
  console.error('\n\n--- [FATAL ERROR] ---');
  console.error('GEMINI_API_KEY is not set in your .env file.');
  console.error('Please check your .env file in the root folder.');
  console.error('-----------------------\n\n');
} else {
  console.log('[OK] GEMINI_API_KEY is loaded from .env file.');
}

let genAI;
try {
  genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  console.log('[OK] GoogleGenerativeAI client initialized.');
} catch (error) {
  console.error('\n\n--- [FATAL ERROR] ---');
  console.error('Error during GoogleGenerativeAI initialization:');
  console.error(error.message);
  console.error('-----------------------\n\n');
}

// This is your API endpoint that the React app will call
app.post('/api/chat', async (req, res) => {
  console.log('---');
  console.log(`[${new Date().toLocaleTimeString()}] Received request for /api/chat`);
  
  if (!genAI) {
    console.error('Request failed because genAI client is not initialized.');
    return res.status(500).json({ response: "Server Error: AI client not initialized. Check server logs." });
  }

  try {
    const { message } = req.body;
    console.log('User message:', message);
    
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    console.log('Sending prompt to Gemini...');
    const result = await model.generateContent(message);

    const response = await result.response;
    console.log('Gemini response received.');

    // Check for safety blocks
    if (response.promptFeedback && response.promptFeedback.blockReason) {
      console.warn(`[SAFETY] Request blocked for reason: ${response.promptFeedback.blockReason}`);
      return res.json({ response: "I'm sorry, I am not able to respond to that topic." });
    }

    if (response.candidates && response.candidates.length > 0) {
      const text = response.text();
      res.json({ response: text });
    } else {
      console.warn("[WARN] No candidate response from AI.");
      res.status(500).json({ response: "I'm sorry, I couldn't generate a response for that." });
    }
  
  } catch (chatError) {
    console.error("--- CHAT ERROR ---");
    console.error(chatError.message); 
    console.error("------------------");
    res.status(500).json({ response: `Server Error: ${chatError.message}` });
  }
});

app.listen(port, () => {
  console.log(`\n--- Server is running on http://localhost:${port} ---`);
  console.log('Waiting for requests...\n');
});