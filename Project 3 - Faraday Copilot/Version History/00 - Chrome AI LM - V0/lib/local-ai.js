function getLanguageModelApi() {
  return globalThis.LanguageModel || globalThis.ai?.languageModel || null;
}

function normaliseAvailability(value) {
  return value || 'unavailable';
}

function clampNumber(value, min, max) {
  if (typeof value !== 'number' || Number.isNaN(value)) return null;
  return Math.min(max, Math.max(min, value));
}

export async function getAiStatus() {
  const api = getLanguageModelApi();
  if (!api) {
    return {
      supported: false,
      availability: 'unavailable',
      message: 'Chrome built-in AI is not exposed in this extension context.'
    };
  }

  const availability = normaliseAvailability(await api.availability({
    expectedInputs: [{ type: 'text', languages: ['en'] }],
    expectedOutputs: [{ type: 'text', languages: ['en'] }]
  }));

  let params = null;
  if (typeof api.params === 'function') {
    try {
      params = await api.params();
    } catch {
      params = null;
    }
  }

  const messageMap = {
    available: 'Local Chrome AI is ready.',
    downloadable: 'The local model is available to download in Chrome.',
    downloading: 'Chrome is downloading the local AI model.',
    unavailable: 'This browser or device cannot use Chrome built-in AI here.'
  };

  return {
    supported: true,
    availability,
    params,
    message: messageMap[availability] || 'Chrome AI status unknown.'
  };
}

export async function promptLocalModel({ systemInstruction, conversation = [], userPrompt, temperature, topK }) {
  const api = getLanguageModelApi();
  if (!api) {
    throw new Error('Chrome built-in AI is unavailable in this context. Use Chrome 138+ and ensure the Prompt API is enabled.');
  }

  const availability = normaliseAvailability(await api.availability({
    expectedInputs: [{ type: 'text', languages: ['en'] }],
    expectedOutputs: [{ type: 'text', languages: ['en'] }]
  }));

  if (availability === 'unavailable') {
    throw new Error('Chrome built-in AI is unavailable on this browser or device.');
  }

  const createOptions = {
    initialPrompts: [
      { role: 'system', content: systemInstruction },
      ...conversation.map((item) => ({ role: item.role, content: item.text }))
    ],
    expectedInputs: [{ type: 'text', languages: ['en'] }],
    expectedOutputs: [{ type: 'text', languages: ['en'] }]
  };

  if (typeof api.params === 'function') {
    try {
      const params = await api.params();
      const safeTopK = clampNumber(topK, 1, params?.maxTopK ?? 128);
      const safeTemp = clampNumber(temperature, 0, params?.maxTemperature ?? 2);
      if (safeTopK !== null && safeTemp !== null) {
        createOptions.topK = safeTopK;
        createOptions.temperature = safeTemp;
      }
    } catch {
      // Ignore and fall back to defaults. Browser APIs, naturally, like drama.
    }
  }

  const session = await api.create(createOptions);
  try {
    const result = await session.prompt(userPrompt);
    if (!result?.trim()) {
      throw new Error('Chrome AI returned an empty response.');
    }
    return result.trim();
  } finally {
    try {
      session.destroy();
    } catch {
      // Best effort cleanup.
    }
  }
}
