import { getSettings, saveSettings } from './lib/storage.js';

const fields = {
  personalityPreset: document.getElementById('personalityPreset'),
  customPersonality: document.getElementById('customPersonality'),
  citationStyle: document.getElementById('citationStyle'),
  docsAssistEnabled: document.getElementById('docsAssistEnabled'),
  floatingMenuEnabled: document.getElementById('floatingMenuEnabled'),
  modelTemperature: document.getElementById('modelTemperature'),
  modelTopK: document.getElementById('modelTopK')
};

const saveBtn = document.getElementById('saveBtn');
const status = document.getElementById('status');
const aiStatus = document.getElementById('aiStatus');

init();

async function init() {
  const settings = await getSettings();
  fields.personalityPreset.value = settings.personalityPreset;
  fields.customPersonality.value = settings.customPersonality;
  fields.citationStyle.value = settings.citationStyle;
  fields.docsAssistEnabled.checked = settings.docsAssistEnabled;
  fields.floatingMenuEnabled.checked = settings.floatingMenuEnabled;
  fields.modelTemperature.value = settings.modelTemperature ?? '';
  fields.modelTopK.value = settings.modelTopK ?? '';

  const response = await chrome.runtime.sendMessage({ type: 'GET_AI_STATUS' });
  if (!response.ok) {
    aiStatus.textContent = 'Could not read Chrome AI status.';
    return;
  }

  const { status: s } = response;
  const paramsText = s.params
    ? `\nParameters: defaultTopK=${s.params.defaultTopK}, maxTopK=${s.params.maxTopK}, defaultTemperature=${s.params.defaultTemperature}, maxTemperature=${s.params.maxTemperature}`
    : '';
  aiStatus.textContent = `${s.message}\nAvailability: ${s.availability}${paramsText}`;
}

saveBtn.addEventListener('click', async () => {
  const rawTemp = fields.modelTemperature.value.trim();
  const rawTopK = fields.modelTopK.value.trim();
  const modelTemperature = rawTemp === '' ? null : Number(rawTemp);
  const modelTopK = rawTopK === '' ? null : Number(rawTopK);

  const bothBlank = rawTemp === '' && rawTopK === '';
  const bothSet = rawTemp !== '' && rawTopK !== '';

  if (!bothBlank && !bothSet) {
    status.textContent = 'Set both Temperature and Top K together, or leave both blank.';
    return;
  }

  await saveSettings({
    personalityPreset: fields.personalityPreset.value,
    customPersonality: fields.customPersonality.value,
    citationStyle: fields.citationStyle.value,
    docsAssistEnabled: fields.docsAssistEnabled.checked,
    floatingMenuEnabled: fields.floatingMenuEnabled.checked,
    modelTemperature,
    modelTopK
  });

  status.textContent = 'Saved.';
  setTimeout(() => (status.textContent = ''), 2200);
});
