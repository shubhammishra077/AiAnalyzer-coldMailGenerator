const axios = require('axios');

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'openai/gpt-oss-120b';

// Calls Groq in JSON mode and returns the raw message content (a string).
// Throws the underlying axios error so callers can map status codes (e.g. 429).
exports.chatJson = async (messages, { maxTokens = 1200, temperature = 0.7 } = {}) => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY is not set');

  const response = await axios.post(
    GROQ_URL,
    
{
    model: MODEL,
    messages,
    temperature,
    max_completion_tokens: maxTokens,
    reasoning_format: 'hidden',
    reasoning_effort: 'low',
    response_format: { type: 'json_object' }
}
,
    {
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      timeout: 45000
    }
  );

  const content = response.data?.choices?.[0]?.message?.content;
  if (!content) throw new Error('Invalid response from Groq API');
  return content;
};

// Extracts a JSON object from model output, tolerating stray text around it.
exports.parseJsonLoose = (text) => {
  try {
    return JSON.parse(text);
  } catch {
    const match = String(text).match(/\{[\s\S]*\}/);
    if (!match) return null;
    try { return JSON.parse(match[0]); } catch { return null; }
  }
};
