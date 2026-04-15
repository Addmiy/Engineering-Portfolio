import { DEFAULT_MODELS, DEFAULT_PERSONALITIES } from './lib/storage.js';

const fields = {
  openRouterApiKey: document.getElementById('openRouterApiKey'),
  defaultModel: document.getElementById('defaultModel'),
  activePersonalityId: document.getElementById('activePersonalityId'),
  customSystemPrompt: document.getElementById('customSystemPrompt'),
  responseLength: document.getElementById('responseLength'),
  citationStyle: document.getElementById('citationStyle'),
  preferredTone: document.getElementById('preferredTone'),
  englishDialect: document.getElementById('englishDialect'),
  styleGuidePreferences: document.getElementById('styleGuidePreferences'),
  customDictionary: document.getElementById('customDictionary'),
  docsAssistEnabled: document.getElementById('docsAssistEnabled'),
  floatingMenuEnabled: document.getElementById('floatingMenuEnabled')
};

const saveBtn = document.getElementById('saveBtn');
const status = document.getElementById('status');
const customModelId = document.getElementById('customModelId');
const customModelLabel = document.getElementById('customModelLabel');
const addCustomModelBtn = document.getElementById('addCustomModelBtn');
const customModelsList = document.getElementById('customModelsList');
const newPersonalityLabel = document.getElementById('newPersonalityLabel');
const newPersonalitySystem = document.getElementById('newPersonalitySystem');
const addPersonalityBtn = document.getElementById('addPersonalityBtn');
const personalityList = document.getElementById('personalityList');

let settings;

init();

async function init() {
  const response = await chrome.runtime.sendMessage({ type: 'GET_SETTINGS' });
  settings = response.settings;
  renderModelOptions(response.models || DEFAULT_MODELS);
  renderPersonalityOptions(settings.personalities || DEFAULT_PERSONALITIES);
  hydrateFields();
}

function hydrateFields() {
  fields.openRouterApiKey.value = settings.openRouterApiKey || '';
  fields.defaultModel.value = settings.defaultModel || 'openrouter/hunter-alpha';
  fields.activePersonalityId.value = settings.activePersonalityId || 'researcher';
  fields.customSystemPrompt.value = settings.customSystemPrompt || '';
  fields.responseLength.value = settings.responseLength || 'balanced';
  fields.citationStyle.value = settings.citationStyle || 'APA';
  fields.preferredTone.value = settings.preferredTone || '';
  fields.englishDialect.value = settings.englishDialect || '';
  fields.styleGuidePreferences.value = settings.styleGuidePreferences || '';
  fields.customDictionary.value = settings.customDictionary || '';
  fields.docsAssistEnabled.checked = Boolean(settings.docsAssistEnabled);
  fields.floatingMenuEnabled.checked = Boolean(settings.floatingMenuEnabled);
  renderCustomModels();
  renderPersonalityList();
}

function renderModelOptions(models) {
  fields.defaultModel.innerHTML = models.map((model) => `<option value="${escapeHtml(model.id)}">${escapeHtml(model.label)} (${escapeHtml(model.notes || '')})</option>`).join('');
}

function renderPersonalityOptions(personalities) {
  fields.activePersonalityId.innerHTML = personalities.map((item) => `<option value="${escapeHtml(item.id)}">${escapeHtml(item.label)}</option>`).join('');
}

function renderCustomModels() {
  const custom = settings.customModels || [];
  if (!custom.length) {
    customModelsList.innerHTML = '<div class="list-item">No custom models added.</div>';
    return;
  }
  customModelsList.innerHTML = custom.map((model, index) => `
    <div class="list-item">
      <strong>${escapeHtml(model.label)}</strong><br>
      <code>${escapeHtml(model.id)}</code>
      <div style="margin-top:10px;"><button data-remove-model="${index}" type="button">Remove</button></div>
    </div>
  `).join('');
}

function renderPersonalityList() {
  const personalities = settings.personalities || DEFAULT_PERSONALITIES;
  personalityList.innerHTML = personalities.map((item, index) => `
    <div class="list-item">
      <strong>${escapeHtml(item.label)}</strong><br>
      <div style="margin-top:8px; white-space: pre-wrap; color:#c9d8ef;">${escapeHtml(item.system)}</div>
      ${DEFAULT_PERSONALITIES.some((p) => p.id === item.id) ? '' : `<div style="margin-top:10px;"><button data-remove-personality="${index}" type="button">Remove</button></div>`}
    </div>
  `).join('');
}

addCustomModelBtn.addEventListener('click', async () => {
  const id = customModelId.value.trim();
  const label = customModelLabel.value.trim() || id;
  if (!id) return;
  settings.customModels = [...(settings.customModels || []), { id, label, notes: 'Custom model', speed: 'Unknown', context: 'Unknown', reasoning: 'Unknown' }];
  await persist();
  customModelId.value = '';
  customModelLabel.value = '';
});

customModelsList.addEventListener('click', async (event) => {
  const index = event.target.closest('[data-remove-model]')?.dataset?.removeModel;
  if (index == null) return;
  settings.customModels.splice(Number(index), 1);
  await persist();
});

addPersonalityBtn.addEventListener('click', async () => {
  const label = newPersonalityLabel.value.trim();
  const system = newPersonalitySystem.value.trim();
  if (!label || !system) return;
  const id = label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  settings.personalities = [...(settings.personalities || DEFAULT_PERSONALITIES), { id, label, system }];
  await persist();
  newPersonalityLabel.value = '';
  newPersonalitySystem.value = '';
});

personalityList.addEventListener('click', async (event) => {
  const index = event.target.closest('[data-remove-personality]')?.dataset?.removePersonality;
  if (index == null) return;
  const personalities = settings.personalities || [];
  personalities.splice(Number(index), 1);
  settings.personalities = personalities;
  if (!personalities.some((item) => item.id === fields.activePersonalityId.value)) {
    settings.activePersonalityId = DEFAULT_PERSONALITIES[0].id;
  }
  await persist();
});

saveBtn.addEventListener('click', persist);

async function persist() {
  const partial = {
    openRouterApiKey: fields.openRouterApiKey.value.trim(),
    defaultModel: fields.defaultModel.value,
    selectedModel: fields.defaultModel.value,
    activePersonalityId: fields.activePersonalityId.value,
    customSystemPrompt: fields.customSystemPrompt.value,
    responseLength: fields.responseLength.value,
    citationStyle: fields.citationStyle.value,
    preferredTone: fields.preferredTone.value,
    englishDialect: fields.englishDialect.value,
    styleGuidePreferences: fields.styleGuidePreferences.value,
    customDictionary: fields.customDictionary.value,
    docsAssistEnabled: fields.docsAssistEnabled.checked,
    floatingMenuEnabled: fields.floatingMenuEnabled.checked,
    customModels: settings.customModels || [],
    personalities: settings.personalities || DEFAULT_PERSONALITIES
  };
  const response = await chrome.runtime.sendMessage({ type: 'SAVE_SETTINGS', partial });
  settings = response.settings;
  renderModelOptions(response.models || DEFAULT_MODELS);
  renderPersonalityOptions(settings.personalities || DEFAULT_PERSONALITIES);
  hydrateFields();
  status.textContent = 'Saved.';
  setTimeout(() => (status.textContent = ''), 2200);
}

function escapeHtml(str) {
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
