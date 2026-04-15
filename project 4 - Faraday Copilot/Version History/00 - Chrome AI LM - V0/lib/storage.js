export const DEFAULT_SETTINGS = {
  citationStyle: 'APA',
  personalityPreset: 'formal-academic',
  customPersonality: '',
  activeBotId: 'research-assistant',
  chatHistory: [],
  docsAssistEnabled: true,
  floatingMenuEnabled: true,
  modelTemperature: null,
  modelTopK: null,
  lastPageContext: null,
  lastAiStatus: null
};

export async function getSettings() {
  const data = await chrome.storage.local.get(DEFAULT_SETTINGS);
  return { ...DEFAULT_SETTINGS, ...data };
}

export async function saveSettings(partial) {
  await chrome.storage.local.set(partial);
  return getSettings();
}

export async function pushChatMessage(message) {
  const { chatHistory = [] } = await chrome.storage.local.get('chatHistory');
  const next = [...chatHistory, message].slice(-80);
  await chrome.storage.local.set({ chatHistory: next });
  return next;
}

export async function clearChatHistory() {
  await chrome.storage.local.set({ chatHistory: [] });
}
