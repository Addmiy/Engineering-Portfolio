import { getSettings, pushChatMessage, saveSettings } from './lib/storage.js';
import { buildSystemInstruction } from './lib/prompts.js';
import { getAiStatus, promptLocalModel } from './lib/local-ai.js';

const MENU_IDS = {
  explain: 'ai-explain-selection',
  summarise: 'ai-summarise-selection',
  cite: 'ai-cite-selection',
  askPage: 'ai-ask-about-page'
};

chrome.runtime.onInstalled.addListener(async () => {
  chrome.contextMenus.create({
    id: MENU_IDS.explain,
    title: 'Explain selection with local AI',
    contexts: ['selection']
  });
  chrome.contextMenus.create({
    id: MENU_IDS.summarise,
    title: 'Summarise selection with local AI',
    contexts: ['selection']
  });
  chrome.contextMenus.create({
    id: MENU_IDS.cite,
    title: 'Generate citation for this page',
    contexts: ['page', 'selection']
  });
  chrome.contextMenus.create({
    id: MENU_IDS.askPage,
    title: 'Open AI side panel for this page',
    contexts: ['page', 'selection']
  });

  if (chrome.sidePanel?.setPanelBehavior) {
    await chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
  }
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (!tab?.id) return;

  if (info.menuItemId === MENU_IDS.askPage) {
    await chrome.sidePanel.open({ tabId: tab.id });
    return;
  }

  await chrome.tabs.sendMessage(tab.id, {
    type: 'RUN_CONTEXT_ACTION',
    action: info.menuItemId,
    selectionText: info.selectionText || ''
  });
});

function buildAiUserPrompt(prompt, pageContext) {
  return [
    'Current page context:',
    JSON.stringify(pageContext || {}, null, 2),
    '',
    'User request:',
    prompt
  ].join('\n');
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  (async () => {
    switch (message.type) {
      case 'OPEN_SIDE_PANEL': {
        const tabId = sender.tab?.id || message.tabId;
        if (tabId) await chrome.sidePanel.open({ tabId });
        sendResponse({ ok: true });
        break;
      }

      case 'SAVE_PAGE_CONTEXT': {
        await saveSettings({ lastPageContext: message.pageContext });
        sendResponse({ ok: true });
        break;
      }

      case 'GET_AI_STATUS': {
        const status = await getAiStatus();
        await saveSettings({ lastAiStatus: status });
        sendResponse({ ok: true, status });
        break;
      }

      case 'GET_ACTIVE_PAGE_CONTEXT': {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab?.id) throw new Error('No active tab found.');
        const pageContext = await chrome.tabs.sendMessage(tab.id, { type: 'GET_PAGE_CONTEXT' });
        await saveSettings({ lastPageContext: pageContext });
        sendResponse({ ok: true, pageContext });
        break;
      }

      case 'CLEAR_CHAT': {
        await saveSettings({ chatHistory: [] });
        sendResponse({ ok: true });
        break;
      }

      case 'AI_REQUEST': {
        const settings = await getSettings();
        const pageContext = message.pageContext || settings.lastPageContext || {};
        const systemInstruction = buildSystemInstruction({
          botId: settings.activeBotId,
          personalityPreset: settings.personalityPreset,
          customPersonality: settings.customPersonality
        });

        const conversation = (settings.chatHistory || []).slice(-12);
        const output = await promptLocalModel({
          systemInstruction,
          conversation,
          userPrompt: buildAiUserPrompt(message.prompt, pageContext),
          temperature: settings.modelTemperature,
          topK: settings.modelTopK
        });

        await pushChatMessage({ role: 'user', text: message.prompt, ts: Date.now() });
        await pushChatMessage({ role: 'assistant', text: output, ts: Date.now() });

        sendResponse({ ok: true, output });
        break;
      }

      default:
        sendResponse({ ok: false, error: 'Unknown message type.' });
    }
  })().catch((error) => {
    console.error(error);
    sendResponse({ ok: false, error: error.message || 'Unknown error' });
  });

  return true;
});
