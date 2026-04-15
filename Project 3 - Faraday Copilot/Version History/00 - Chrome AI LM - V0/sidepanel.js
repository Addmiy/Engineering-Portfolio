import { BOT_PRESETS } from './lib/prompts.js';
import { getSettings, saveSettings } from './lib/storage.js';
import { generateCitation } from './lib/citations.js';

const botSelect = document.getElementById('botSelect');
const personalitySelect = document.getElementById('personalitySelect');
const refreshContextBtn = document.getElementById('refreshContextBtn');
const refreshAiStatusBtn = document.getElementById('refreshAiStatusBtn');
const clearChatBtn = document.getElementById('clearChatBtn');
const aiStatus = document.getElementById('aiStatus');
const pageContextMeta = document.getElementById('pageContextMeta');
const chatLog = document.getElementById('chatLog');
const composer = document.getElementById('composer');
const chatInput = document.getElementById('chatInput');

let settings;
let currentPageContext = null;

init();

async function init() {
  settings = await getSettings();
  renderBotOptions();
  botSelect.value = settings.activeBotId;
  personalitySelect.value = settings.personalityPreset;
  renderChat(settings.chatHistory || []);
  await Promise.all([refreshAiStatus(), refreshPageContext()]);
}

function renderBotOptions() {
  botSelect.innerHTML = BOT_PRESETS.map((bot) => `<option value="${bot.id}">${bot.label}</option>`).join('');
}

function renderChat(messages) {
  chatLog.innerHTML = '';

  if (!messages.length) {
    chatLog.innerHTML = '<div class="message assistant">No conversation yet. A pristine interface, moments before somebody asks it to summarise 4,000 words of chaos.</div>';
    return;
  }

  for (const message of messages) {
    appendMessage(message, false);
  }

  chatLog.scrollTop = chatLog.scrollHeight;
}

function renderPageContextMeta() {
  if (!currentPageContext) {
    pageContextMeta.textContent = 'No page context loaded.';
    return;
  }

  const pageTextPreview = (currentPageContext.pageText || 'None').slice(0, 220);

  pageContextMeta.innerHTML = `
    <div class="meta-kv"><strong>Title:</strong> ${escapeHtml(currentPageContext.title || 'Untitled')}</div>
    <div class="meta-kv"><strong>URL:</strong> ${escapeHtml(currentPageContext.url || '')}</div>
    <div class="meta-kv"><strong>Selection:</strong> ${escapeHtml((currentPageContext.selection || 'None').slice(0, 260))}</div>
    <div class="meta-kv"><strong>Page text preview:</strong> ${escapeHtml(pageTextPreview)}</div>
  `;
}

async function refreshAiStatus() {
  const response = await chrome.runtime.sendMessage({ type: 'GET_AI_STATUS' });
  if (!response.ok) {
    aiStatus.textContent = response.error || 'Failed to read AI status.';
    return;
  }

  const { status } = response;
  const paramLine = status.params
    ? ` Defaults: topK ${status.params.defaultTopK}, temperature ${status.params.defaultTemperature}.`
    : '';
  aiStatus.textContent = `${status.message}${paramLine}`;
}

async function refreshPageContext() {
  const response = await chrome.runtime.sendMessage({ type: 'GET_ACTIVE_PAGE_CONTEXT' });
  if (!response.ok) {
    pageContextMeta.textContent = response.error || 'Failed to read page context.';
    return false;
  }
  currentPageContext = response.pageContext;
  renderPageContextMeta();
  return true;
}

refreshContextBtn.addEventListener('click', refreshPageContext);
refreshAiStatusBtn.addEventListener('click', refreshAiStatus);

clearChatBtn.addEventListener('click', async () => {
  await chrome.runtime.sendMessage({ type: 'CLEAR_CHAT' });
  chatLog.innerHTML = '';
  renderChat([]);
});

botSelect.addEventListener('change', async () => {
  settings = await saveSettings({ activeBotId: botSelect.value });
});

personalitySelect.addEventListener('change', async () => {
  settings = await saveSettings({ personalityPreset: personalitySelect.value });
});

composer.addEventListener('submit', async (event) => {
  event.preventDefault();
  const prompt = chatInput.value.trim();
  if (!prompt) return;

  await sendPrompt(prompt, true);
  chatInput.value = '';
});

document.querySelectorAll('[data-quick]').forEach((button) => {
  button.addEventListener('click', async () => {
    const kind = button.dataset.quick;

    if (kind === 'citation') {
      await refreshPageContext();
      if (!currentPageContext?.metadata) {
        appendMessage({ role: 'assistant', text: 'Could not read the current page metadata for a citation.' });
        return;
      }
      const citation = generateCitation(settings.citationStyle, currentPageContext.metadata);
      await navigator.clipboard.writeText(citation);
      appendMessage({ role: 'assistant', text: `${settings.citationStyle} citation copied to clipboard:\n\n${citation}` });
      return;
    }

    const quickPrompts = {
      summarise: 'Summarise the current page into a concise overview and key takeaways.',
      keypoints: 'Extract the most important key points from the current page as bullet points.',
      docs: 'If this is a Google Doc or draft-like page, provide writing help: improve clarity, structure, and identify where citations may be needed.'
    };

    await sendPrompt(quickPrompts[kind], true);
  });
});

async function sendPrompt(prompt, refreshContextFirst = false) {
  appendMessage({ role: 'user', text: prompt });

  if (refreshContextFirst) {
    await refreshPageContext();
  }

  const response = await chrome.runtime.sendMessage({
    type: 'AI_REQUEST',
    prompt,
    pageContext: currentPageContext
  });

  if (!response.ok) {
    appendMessage({ role: 'assistant', text: `Error: ${response.error || 'Unknown error'}` });
    return;
  }

  appendMessage({ role: 'assistant', text: response.output });
}

function appendMessage(message, autoscroll = true) {
  const el = document.createElement('div');
  el.className = `message ${message.role}`;
  el.textContent = message.text;
  chatLog.appendChild(el);
  if (autoscroll) chatLog.scrollTop = chatLog.scrollHeight;
}

function escapeHtml(str) {
  return str
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

window.addEventListener('keydown', async (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault();
    await chrome.runtime.sendMessage({ type: 'CLEAR_CHAT' });
    renderChat([]);
  }
});
