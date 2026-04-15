const openSidePanelBtn = document.getElementById('openSidePanel');
const citationStyleSelect = document.getElementById('quickCitationStyle');
const openOptionsBtn = document.getElementById('openOptions');

init();

async function init() {
  const response = await chrome.runtime.sendMessage({ type: 'GET_SETTINGS' });
  citationStyleSelect.value = response.settings.citationStyle || 'APA';
}

openSidePanelBtn.addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab?.id) {
    await chrome.sidePanel.open({ tabId: tab.id });
    window.close();
  }
});

citationStyleSelect.addEventListener('change', async () => {
  await chrome.runtime.sendMessage({ type: 'SAVE_SETTINGS', partial: { citationStyle: citationStyleSelect.value } });
});

openOptionsBtn.addEventListener('click', () => chrome.runtime.openOptionsPage());
