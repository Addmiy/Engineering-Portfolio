import {
  addCitation,
  clearChatHistory,
  consumePanelAction,
  getAllModels,
  getSettings,
  pushChatMessage,
  queuePanelAction,
  saveSettings
} from './lib/storage.js';
import { callOpenRouter } from './lib/openrouter.js';

const MENU_IDS = {
  explain: 'faraday-explain-selection in simple terms',
  summarise: 'faraday-summarise-selection concisely',
  cite: 'faraday-cite-selection',
  askAI: 'faraday-ask-ai',
  flashcards: 'faraday-generate-flashcards',
  notes: 'faraday-save-notes'
};

chrome.runtime.onInstalled.addListener(async () => {
  chrome.contextMenus.create({
    id: MENU_IDS.explain,
    title: 'Faraday: Explain selection',
    contexts: ['selection']
  });
  chrome.contextMenus.create({
    id: MENU_IDS.summarise,
    title: 'Faraday: Summarise selection',
    contexts: ['selection']
  });
  chrome.contextMenus.create({
    id: MENU_IDS.cite,
    title: 'Faraday: Cite this page/selection',
    contexts: ['page', 'selection']
  });
  chrome.contextMenus.create({
    id: MENU_IDS.askAI,
    title: 'Faraday: Ask AI about this',
    contexts: ['page', 'selection']
  });
  chrome.contextMenus.create({
    id: MENU_IDS.flashcards,
    title: 'Faraday: Generate flashcards from selection',
    contexts: ['selection']
  });
  chrome.contextMenus.create({
    id: MENU_IDS.notes,
    title: 'Faraday: Turn selection into notes',
    contexts: ['selection']
  });

  if (chrome.sidePanel?.setPanelBehavior) {
    await chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
  }

  const settings = await getSettings();
  if (!settings.selectedModel) {
    await saveSettings({ selectedModel: settings.defaultModel || 'openrouter/hunter-alpha' });
  }
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (!tab?.id) return;
  await chrome.tabs.sendMessage(tab.id, {
    type: 'RUN_CONTEXT_ACTION',
    action: info.menuItemId,
    selectionText: info.selectionText || ''
  }).catch(() => null);
});

async function openAndDispatchPanelAction(action, senderTabId) {
  const tabId = senderTabId || action?.tabId;
  await queuePanelAction(action);
  if (tabId) {
    await chrome.sidePanel.open({ tabId }).catch(() => null);
  }
  await chrome.runtime.sendMessage({ type: 'PANEL_ACTION', action }).catch(() => null);
}

async function getPageContextForTab(tabId) {
  if (!tabId) throw new Error('Missing tab id.');
  const pageContext = await chrome.tabs.sendMessage(tabId, { type: 'GET_PAGE_CONTEXT' });
  await saveSettings({ lastPageContext: pageContext, lastContextTabId: tabId });
  return pageContext;
}

async function getResolvablePageContext() {
  const settings = await getSettings();
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const isExtensionPage = !tab?.id || (tab.url || '').startsWith(`chrome-extension://${chrome.runtime.id}/`);

  if (!isExtensionPage) {
    return getPageContextForTab(tab.id);
  }

  if (settings.lastPageContext) {
    return settings.lastPageContext;
  }

  throw new Error('No active web page context found. Open a normal tab first, because extension pages are narcissistic little islands.');
}


async function fetchDocsCompanionFromBackground({ endpoint, documentId }) {
  if (!endpoint || !documentId) {
    throw new Error('Missing companion endpoint or document ID.');
  }

  const attempts = [
    { action: 'snapshot', documentId },
    { docId: documentId },
    { documentId },
    { action: 'snapshot', docId: documentId }
  ];

  let lastError = null;

  for (const params of attempts) {
    try {
      const url = new URL(endpoint);
      for (const [key, value] of Object.entries(params)) {
        url.searchParams.set(key, value);
      }

      const res = await fetch(url.toString(), {
        method: 'GET',
        credentials: 'include',
        redirect: 'follow',
        cache: 'no-store'
      });

      const finalUrl = res.url || url.toString();
      const text = await res.text();
      const contentType = res.headers.get('content-type') || '';
      const loginRedirect = /accounts\.google\.com\/ServiceLogin/i.test(finalUrl) || /accounts\.google\.com\/ServiceLogin/i.test(text);
      if (loginRedirect) {
        throw new Error('Companion web app is redirecting to Google sign-in. Redeploy it as a Web app with Execute as: Me and Who has access: Anyone, then paste the /exec URL into Faraday settings.');
      }
      if (!res.ok) {
        throw new Error(`Companion endpoint failed (${res.status}).`);
      }

      let data = null;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(`Companion endpoint did not return JSON. Final URL: ${finalUrl}. Content-Type: ${contentType || 'unknown'}.`);
      }

      const usableText = String(data?.text || '').trim();
      const looksSuccessful = data?.ok === true || Boolean(usableText);
      if (!looksSuccessful) {
        throw new Error(data?.error || 'Companion endpoint returned an invalid payload.');
      }

      return {
        ok: true,
        data,
        diagnostics: {
          attemptedUrl: url.toString(),
          finalUrl,
          contentType
        }
      };
    } catch (error) {
      lastError = error;
    }
  }

  throw new Error(lastError?.message || 'Companion endpoint did not return a usable document payload.');
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  (async () => {
    switch (message.type) {
      case 'OPEN_SIDE_PANEL': {
        const tabId = sender.tab?.id || message.tabId;
        if (tabId) await chrome.sidePanel.open({ tabId });
        sendResponse({ ok: true });
        return;
      }
      case 'OPEN_FULLSCREEN_APP': {
        const targetTabId = sender.tab?.id || message.tabId || null;
        const url = new URL(chrome.runtime.getURL('app.html'));
        if (targetTabId) url.searchParams.set('sourceTabId', String(targetTabId));
        if (message.initialView) url.searchParams.set('view', String(message.initialView));
        const created = await chrome.tabs.create({ url: url.toString() });
        sendResponse({ ok: true, tabId: created?.id || null });
        return;
      }
      case 'QUEUE_PANEL_ACTION': {
        const action = {
          ...message.action,
          ts: Date.now(),
          tabId: sender.tab?.id || message.action?.tabId || null
        };
        await openAndDispatchPanelAction(action, sender.tab?.id);
        sendResponse({ ok: true, action });
        return;
      }
      case 'CONSUME_PENDING_PANEL_ACTION': {
        const action = await consumePanelAction();
        sendResponse({ ok: true, action });
        return;
      }
      case 'GET_SETTINGS': {
        const settings = await getSettings();
        sendResponse({ ok: true, settings, models: getAllModels(settings) });
        return;
      }
      case 'SAVE_SETTINGS': {
        const settings = await saveSettings(message.partial || {});
        sendResponse({ ok: true, settings, models: getAllModels(settings) });
        return;
      }
      case 'CLEAR_CHAT_HISTORY': {
        await clearChatHistory();
        sendResponse({ ok: true });
        return;
      }
      case 'GET_ACTIVE_PAGE_CONTEXT': {
        const pageContext = await getResolvablePageContext();
        sendResponse({ ok: true, pageContext });
        return;
      }
      case 'GET_PAGE_CONTEXT_FOR_TAB': {
        const pageContext = await getPageContextForTab(message.tabId);
        sendResponse({ ok: true, pageContext });
        return;
      }
      case 'STORE_CITATION': {
        const list = await addCitation(message.entry);
        sendResponse({ ok: true, list });
        return;
      }
      case 'FETCH_DOCS_COMPANION': {
        const result = await fetchDocsCompanionFromBackground({
          endpoint: message.endpoint,
          documentId: message.documentId
        });
        sendResponse(result);
        return;
      }
      case 'AI_REQUEST': {
        const settings = await getSettings();
        const models = getAllModels(settings);
        const modelId = message.model || settings.selectedModel || settings.defaultModel || 'openrouter/hunter-alpha';
        const personality = (settings.personalities || []).find((item) => item.id === (message.personalityId || settings.activePersonalityId)) || settings.personalities?.[0];
        const pageContext = message.pageContext || settings.lastPageContext || null;

        const result = await callOpenRouter({
          apiKey: settings.openRouterApiKey,
          model: modelId,
          personality,
          customSystemPrompt: settings.customSystemPrompt,
          responseLength: settings.responseLength,
          writingPreferences: {
            preferredTone: settings.preferredTone,
            englishDialect: settings.englishDialect,
            styleGuidePreferences: settings.styleGuidePreferences,
            customDictionary: settings.customDictionary
          },
          prompt: message.prompt,
          pageContext,
          selectionText: message.selectionText || pageContext?.selection || '',
          filePayloads: message.filePayloads || settings.sessionFiles || [],
          includeReasoning: Boolean(message.includeReasoning),
          chatHistory: settings.chatHistory || []
        });

        await pushChatMessage({ role: 'user', text: message.prompt, ts: Date.now(), model: modelId });
        await pushChatMessage({ role: 'assistant', text: result.text, ts: Date.now(), model: result.model || modelId, usage: result.usage || null });
        await saveSettings({ selectedModel: modelId });

        sendResponse({ ok: true, output: result.text, model: result.model || modelId, usage: result.usage || null, models });
        return;
      }
      default:
        sendResponse({ ok: false, error: 'Unknown message type.' });
    }
  })().catch((error) => {
    console.error(error);
    sendResponse({ ok: false, error: error?.message || 'Unknown error' });
  });

  return true;
});
