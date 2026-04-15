import { buildSystemPrompt, buildUserPayload } from './prompts.js';

const API_URL = 'https://openrouter.ai/api/v1/chat/completions';

export async function callOpenRouter({
  apiKey,
  model,
  personality,
  customSystemPrompt,
  responseLength,
  writingPreferences,
  prompt,
  pageContext,
  selectionText,
  filePayloads,
  includeReasoning = false,
  chatHistory = []
}) {
  if (!apiKey) {
    throw new Error('Missing OpenRouter API key. Add it in Settings first. Because apparently secret keys do not materialise out of vibes.');
  }

  const priorMessages = (chatHistory || [])
    .slice(-12)
    .filter((item) => item?.text && (item.role === 'user' || item.role === 'assistant'))
    .map((item) => ({
      role: item.role,
      content: item.text
    }));

  const messages = [
    {
      role: 'system',
      content: buildSystemPrompt({ personality, customSystemPrompt, responseLength, writingPreferences })
    },
    ...priorMessages,
    {
      role: 'user',
      content: buildUserPayload({ prompt, pageContext, selectionText, filePayloads })
    }
  ];

  const body = {
    model,
    messages,
    temperature: 0.3,
    top_p: 0.9,
    include_reasoning: includeReasoning,
    provider: {
      allow_fallbacks: true
    }
  };

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://chrome.google.com',
      'X-Title': 'Faraday Copilot'
    },
    body: JSON.stringify(body)
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const message = data?.error?.message || data?.message || JSON.stringify(data) || `HTTP ${res.status}`;
    throw new Error(`OpenRouter error: ${message}`);
  }

  const choice = data?.choices?.[0];
  const text = choice?.message?.content?.trim();
  if (!text) {
    throw new Error('The model returned an empty response. Magnificent.');
  }

  return {
    text,
    usage: data?.usage || null,
    model: data?.model || model,
    id: data?.id || null
  };
}
