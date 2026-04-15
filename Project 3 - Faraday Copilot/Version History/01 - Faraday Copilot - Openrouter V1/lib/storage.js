export const DEFAULT_MODELS = [
  {
    id: 'openrouter/hunter-alpha',
    label: 'Hunter Alpha',
    notes: 'Free, long-context, strong reasoning',
    speed: 'Medium',
    context: '1M',
    reasoning: 'High'
  },
  {
    id: 'openrouter/auto',
    label: 'OpenRouter Auto',
    notes: 'Automatic routing',
    speed: 'Mixed',
    context: 'Provider-dependent',
    reasoning: 'Mixed'
  },
  {
    id: 'openrouter/healer-alpha',
    label: 'Healer Alpha',
    notes: 'Multimodal free model',
    speed: 'Medium',
    context: '262K',
    reasoning: 'High'
  },
  {
    id: 'z-ai/glm-4.5-air:free',
    label: 'GLM 4.5 Air (free)',
    notes: 'Fast free general model',
    speed: 'Fast',
    context: '131K',
    reasoning: 'Medium'
  },
  {
    id: 'nvidia/nemotron-3-super:free',
    label: 'Nemotron 3 Super (free)',
    notes: 'Long-context free model',
    speed: 'Medium',
    context: '262K',
    reasoning: 'High'
  }
];

export const DEFAULT_PERSONALITIES = [
  {
    id: 'tutor',
    label: 'Tutor',
    system: 'Explain clearly, step by step, with examples and simple wording.'
  },
  {
    id: 'researcher',
    label: 'Researcher',
    system: 'Prioritise accuracy, synthesis, caveats, and evidence-aware reasoning.'
  },
  {
    id: 'analyst',
    label: 'Analyst',
    system: 'Be concise, structured, and comparison-driven. Use headings and bullets.'
  },
  {
    id: 'study-coach',
    label: 'Study Coach',
    system: 'Turn content into active recall tools, memory hooks, and exam-focused summaries.'
  },
  {
    id: 'writing-assistant',
    label: 'Writing Assistant',
    system: 'Improve clarity, flow, tone, grammar, and concision while preserving meaning.'
  },
  {
    id: 'coding-assistant',
    label: 'Coding Assistant',
    system: 'Be precise with code, debugging, architecture, and step-by-step implementation guidance.'
  }
];

export const DEFAULT_SETTINGS = {
  openRouterApiKey: '',
  defaultModel: 'openrouter/hunter-alpha',
  selectedModel: 'openrouter/hunter-alpha',
  citationStyle: 'APA',
  responseLength: 'balanced',
  theme: 'dark',
  keyboardShortcutHint: 'Ctrl/Cmd + Shift + Y',
  englishDialect: 'Australian English',
  preferredTone: 'Clear and helpful',
  styleGuidePreferences: '',
  customDictionary: '',
  docsAssistEnabled: true,
  floatingMenuEnabled: true,
  personalities: DEFAULT_PERSONALITIES,
  activePersonalityId: 'researcher',
  customSystemPrompt: '',
  customModels: [],
  chatHistory: [],
  citationsNotebook: [],
  lastPageContext: null,
  sessionFiles: [],
  pendingPanelAction: null
};

export async function getSettings() {
  const data = await chrome.storage.local.get(DEFAULT_SETTINGS);
  const merged = { ...DEFAULT_SETTINGS, ...data };
  if (!Array.isArray(merged.personalities) || !merged.personalities.length) {
    merged.personalities = DEFAULT_PERSONALITIES;
  }
  if (!Array.isArray(merged.customModels)) merged.customModels = [];
  if (!Array.isArray(merged.chatHistory)) merged.chatHistory = [];
  if (!Array.isArray(merged.citationsNotebook)) merged.citationsNotebook = [];
  if (!Array.isArray(merged.sessionFiles)) merged.sessionFiles = [];
  return merged;
}

export async function saveSettings(partial) {
  await chrome.storage.local.set(partial);
  return getSettings();
}

export async function clearChatHistory() {
  await chrome.storage.local.set({ chatHistory: [] });
}

export async function pushChatMessage(message) {
  const { chatHistory = [] } = await chrome.storage.local.get('chatHistory');
  const next = [...chatHistory, message].slice(-80);
  await chrome.storage.local.set({ chatHistory: next });
  return next;
}

export async function addCitation(entry) {
  const { citationsNotebook = [] } = await chrome.storage.local.get('citationsNotebook');
  const next = [entry, ...citationsNotebook].slice(0, 100);
  await chrome.storage.local.set({ citationsNotebook: next });
  return next;
}

export async function queuePanelAction(action) {
  await chrome.storage.local.set({ pendingPanelAction: action });
  return action;
}

export async function consumePanelAction() {
  const { pendingPanelAction = null } = await chrome.storage.local.get('pendingPanelAction');
  await chrome.storage.local.set({ pendingPanelAction: null });
  return pendingPanelAction;
}

export function getAllModels(settings) {
  const custom = (settings?.customModels || []).filter((item) => item?.id && item?.label);
  const merged = [...DEFAULT_MODELS, ...custom];
  const seen = new Set();
  return merged.filter((model) => {
    if (seen.has(model.id)) return false;
    seen.add(model.id);
    return true;
  });
}
