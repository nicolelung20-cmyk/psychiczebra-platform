const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'psychiczebra-platform' });
});

// Root - simple landing page
app.get('/', (req, res) => {
  res.status(200).send(
    '<h1>PsychicZebra Platform</h1>' +
    '<p>All-in-one AI platform: SaaS, API, B2B white-label, and enterprise solutions powered by OpenRouter.</p>' +
    '<p>See <code>/health</code> for status and <code>/api/chat</code> for the chat API.</p>'
  );
});

// Basic chat/API endpoint powered by OpenRouter
app.post('/api/chat', async (req, res) => {
  const { message, model } = req.body || {};

  if (!message) {
    return res.status(400).json({ error: 'Missing "message" in request body' });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'OPENROUTER_API_KEY is not configured' });
  }

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model || 'openai/gpt-3.5-turbo',
        messages: [{ role: 'user', content: message }],
      }),
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    console.error('OpenRouter request failed:', err);
    res.status(502).json({ error: 'Failed to reach OpenRouter API' });
  }
});

app.listen(PORT, () => {
  console.log(`PsychicZebra Platform server listening on port ${PORT}`);
});
