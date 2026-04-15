import { getSettings, saveSettings } from './lib/storage.js';

const openSidePanelBtn = document.getElementById('openSidePanel');
const citationStyleSelect = document.getElementById('quickCitationStyle');
const openOptionsBtn = document.getElementById('openOptions');
const aiStatus = document.getElementById('aiStatus');

init();

async function init() {
  const settings = await getSettings();
  citationStyleSelect.value = settings.citationStyle;

  const response = await chrome.runtime.sendMessage({ type: 'GET_AI_STATUS' });
  aiStatus.textContent = response.ok ? response.status.message : 'Could not read Chrome AI status.';
}

openSidePanelBtn.addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab?.id) {
    await chrome.sidePanel.open({ tabId: tab.id });
    window.close();
  }
});

citationStyleSelect.addEventListener('change', async (event) => {
  await saveSettings({ citationStyle: event.target.value });
});

openOptionsBtn.addEventListener('click', () => chrome.runtime.openOptionsPage());
