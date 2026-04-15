export function buildSystemPrompt({ personality, customSystemPrompt, responseLength, writingPreferences }) {
  const lengthInstruction = {
    concise: 'Prefer concise outputs. Keep sections tight and avoid unnecessary filler.',
    balanced: 'Balance completeness and brevity.',
    detailed: 'Be thorough and structured when the task benefits from detail.'
  }[responseLength || 'balanced'];

  const writing = writingPreferences
    ? [
        `Preferred tone: ${writingPreferences.preferredTone || 'Clear and helpful'}`,
        `English dialect: ${writingPreferences.englishDialect || 'Australian English'}`,
        writingPreferences.styleGuidePreferences ? `Style guide preferences: ${writingPreferences.styleGuidePreferences}` : '',
        writingPreferences.customDictionary ? `Custom dictionary / allowed terms: ${writingPreferences.customDictionary}` : ''
      ].filter(Boolean).join('\n')
    : '';

  return [
    personality?.system || 'Be helpful, structured, and honest about uncertainty.',
    'Always use clear headings for complex responses. Use bullet points when useful. Use tables only when they genuinely improve readability.',
    'When answering questions tied to page context, rely on the provided page context and clearly say when information is incomplete.',
    'For study tools, produce high-quality, accurate material with answer keys and explanations when relevant.',
    'For writing help, preserve the author\'s meaning and avoid making unsupported factual claims.',
    lengthInstruction,
    writing,
    customSystemPrompt?.trim() ? `Additional user instructions:\n${customSystemPrompt.trim()}` : ''
  ].filter(Boolean).join('\n\n');
}

export function buildUserPayload({ prompt, pageContext, selectionText, filePayloads }) {
  const parts = [];
  if (pageContext) {
    parts.push('CURRENT PAGE CONTEXT');
    parts.push(JSON.stringify(pageContext, null, 2));
  }
  if (selectionText) {
    parts.push('CURRENT SELECTION');
    parts.push(selectionText);
  }
  if (filePayloads?.length) {
    parts.push('ATTACHED FILE EXTRACTS');
    parts.push(JSON.stringify(filePayloads, null, 2));
  }
  parts.push('USER REQUEST');
  parts.push(prompt);
  return parts.join('\n\n');
}
