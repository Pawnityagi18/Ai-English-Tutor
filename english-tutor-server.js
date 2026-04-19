
const express = require('express');
const fetch = require('node-fetch').default;
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.get('/test', (req, res) => {
  res.json({ message: "API working" });
});

// ✅ API FIRST
app.post('/api/english-assist', async (req, res) => {
  const { message, level } = req.body;

  console.log("API HIT:", message); // 🔥 debug

  if (!message || !message.trim()) {
    return res.status(400).json({ error: 'Please provide a sentence to analyze.' });
  }

  const llmPrompt = `
You are an English language tutor. User level: ${level || 'intermediate'}.
User sentence: "${message}"

Respond ONLY in valid JSON.
Do NOT write anything outside JSON.

{
  "corrected": "...",
  "paraphrase": "...",
  "explanation": "...",
  "suggestion": "...",
  "nextPractice": "..."
}
`;

  try {
    const result = await fetch('http://127.0.0.1:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'mistral',
        prompt: llmPrompt,
        stream: false,
        temperature: 0.6
      })
    });

    const data = await result.json();
    const text = data?.response || '';

    console.log("MODEL OUTPUT:", text); // 🔥 debug

    let output;
    try {
      output = JSON.parse(text);
    } catch {
      output = {
        corrected: text,
        paraphrase: 'Could not parse response.',
        explanation: 'Invalid JSON from model',
        suggestion: 'Try again',
        nextPractice: 'Enter another sentence'
      };
    }

    res.json(output);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ STATIC AFTER API
app.use(express.static(path.join(__dirname)));

app.listen(PORT, () => {
  console.log(`English tutor server running at http://localhost:${PORT}`);
});