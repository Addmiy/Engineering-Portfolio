import { DEFAULT_PERSONALITIES } from './lib/storage.js';

const appRoot = document.getElementById('appRoot');
const modelSelect = document.getElementById('modelSelect');
const modelMeta = document.getElementById('modelMeta');
const personalitySelect = document.getElementById('personalitySelect');
const refreshContextBtn = document.getElementById('refreshContextBtn');
const clearContextBtn = document.getElementById('clearContextBtn');
const clearChatBtn = document.getElementById('clearChatBtn');
const openFullscreenBtn = document.getElementById('openFullscreenBtn');
const pageContextMeta = document.getElementById('pageContextMeta');
const chatLog = document.getElementById('chatLog');
const chatInput = document.getElementById('chatInput');
const sendPromptBtn = document.getElementById('sendPromptBtn');
const fileInput = document.getElementById('fileInput');
const fileList = document.getElementById('fileList');
const citationsList = document.getElementById('citationsList');
const copyCitationsBtn = document.getElementById('copyCitationsBtn');
const graphCard = document.getElementById('graphCard');
const graphExpression = document.getElementById('graphExpression');
const plotGraphBtn = document.getElementById('plotGraphBtn');
const closeGraphBtn = document.getElementById('closeGraphBtn');
const expandGraphBtn = document.getElementById('expandGraphBtn');
const resetGraphBtn = document.getElementById('resetGraphBtn');
const graphCanvas = document.getElementById('graphCanvas');
const graphMeta = document.getElementById('graphMeta');
const graphFunctionsList = document.getElementById('graphFunctionsList');
const graphInterceptsList = document.getElementById('graphInterceptsList');
const graphStationaryList = document.getElementById('graphStationaryList');
const graphIntersectionsList = document.getElementById('graphIntersectionsList');
const tabButtons = Array.from(document.querySelectorAll('.tab-btn'));
const viewPanels = Array.from(document.querySelectorAll('[data-view-panel]'));

const GRAPH_COLORS = ['#7ac6ff', '#87e29b', '#ffd67a', '#ff8d8d', '#d0a8ff', '#67e8f9'];
const FULL_APP = true;
const urlParams = new URLSearchParams(location.search);
const sourceTabId = Number(urlParams.get('sourceTabId')) || null;

let settings = null;
let models = [];
let currentPageContext = null;
let sessionFiles = [];
let lastHandledActionTs = 0;
let currentView = urlParams.get('view') || 'chat';

const graphState = {
  expressionsText: '',
  functions: [],
  markers: [],
  xMin: -10,
  xMax: 10,
  yMin: -10,
  yMax: 10,
  dragging: false,
  lastX: 0,
  lastY: 0,
  mouseX: null,
  mouseY: null,
  allowWheelZoom: true,
  showCard: FULL_APP,
  panelExpanded: false,
  renderQueued: false,
  analysisTimer: null,
  lastCanvasCssWidth: 0,
  lastCanvasCssHeight: 0
};

boot().catch((error) => {
  console.error('Faraday fullscreen boot failed', error);
  showBootError(error);
});


async function boot() {
  if (document.readyState === 'loading') {
    await new Promise((resolve) => document.addEventListener('DOMContentLoaded', resolve, { once: true }));
  }
  await init();
}

function showBootError(error) {
  const host = document.getElementById('chatLog') || document.body;
  const message = (error && error.message) ? error.message : String(error || 'Unknown error');
  const card = document.createElement('div');
  card.className = 'message assistant';
  card.innerHTML = `<div class="message-content"><p>Fullscreen mode hit a startup error: ${escapeHtml(message)}.</p><p>Reload the tab after reinstalling this build.</p></div>`;
  host.innerHTML = '';
  host.appendChild(card);
}

async function init() {
  const response = await chrome.runtime.sendMessage({ type: 'GET_SETTINGS' });
  if (!response?.ok || !response.settings) {
    throw new Error(response?.error || 'Failed to load extension settings.');
  }
  settings = response.settings;
  models = response.models || [];
  sessionFiles = settings.sessionFiles || [];
  currentView = FULL_APP ? (settings.activeFullView || currentView) : (settings.activePanelView || currentView);

  renderModels();
  renderPersonalities();
  renderChat(settings.chatHistory || []);
  renderFiles();
  renderCitations(settings.citationsNotebook || []);
  setActiveView(currentView, false);
  attachGraphInteractions();
  attachEvents();
  await refreshPageContext();
  await consumePendingAction();

  if (FULL_APP) {
    graphCard.classList.remove('hidden');
    graphState.showCard = true;
    if (expandGraphBtn) expandGraphBtn.textContent = 'Already fullscreen';
  }

  if (settings.lastGraphExpressions) {
    graphExpression.value = settings.lastGraphExpressions;
    tryPlotGraph(settings.lastGraphExpressions, { autoFit: false, switchView: FULL_APP });
  }
}

function attachEvents() {
  modelSelect.addEventListener('change', async () => {
    settings = (await chrome.runtime.sendMessage({ type: 'SAVE_SETTINGS', partial: { selectedModel: modelSelect.value } })).settings;
    updateModelMeta();
  });

  personalitySelect.addEventListener('change', async () => {
    settings = (await chrome.runtime.sendMessage({ type: 'SAVE_SETTINGS', partial: { activePersonalityId: personalitySelect.value } })).settings;
  });

  refreshContextBtn?.addEventListener('click', () => refreshPageContext());

  clearContextBtn?.addEventListener('click', async () => {
    currentPageContext = null;
    pageContextMeta.textContent = 'Page context cleared.';
    settings = (await chrome.runtime.sendMessage({ type: 'SAVE_SETTINGS', partial: { lastPageContext: null } })).settings;
  });

  clearChatBtn?.addEventListener('click', async () => {
    await chrome.runtime.sendMessage({ type: 'CLEAR_CHAT_HISTORY' });
    renderChat([]);
  });

  openFullscreenBtn?.addEventListener('click', async () => {
    const response = await chrome.runtime.sendMessage({
      type: 'OPEN_FULLSCREEN_APP',
      tabId: sourceTabId || settings.lastContextTabId || null,
      initialView: currentView
    });
    if (!response?.ok) appendMessage({ role: 'assistant', text: `Could not open fullscreen tab: ${response?.error || 'Unknown error'}` });
  });

  sendPromptBtn?.addEventListener('click', submitComposer);
  chatInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      submitComposer();
    }
  });

  fileInput?.addEventListener('change', handleFileAdd);
  fileList?.addEventListener('click', handleFileRemove);
  copyCitationsBtn?.addEventListener('click', copyAllCitations);

  plotGraphBtn?.addEventListener('click', () => tryPlotGraph(graphExpression.value.trim(), { switchView: true }));
  closeGraphBtn?.addEventListener('click', clearGraph);
  expandGraphBtn?.addEventListener('click', () => {
    if (FULL_APP) return;
    graphState.panelExpanded = !graphState.panelExpanded;
    appRoot.classList.toggle('panel-graph-focus', graphState.panelExpanded);
    expandGraphBtn.textContent = graphState.panelExpanded ? 'Exit panel fullscreen' : 'Fullscreen in panel';
    setActiveView('graph');
    requestGraphRender();
  });
  resetGraphBtn?.addEventListener('click', () => resetGraphViewport(true));
  graphExpression?.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      tryPlotGraph(graphExpression.value.trim(), { switchView: true });
    }
  });

  for (const button of document.querySelectorAll('[data-quick]')) {
    button.addEventListener('click', () => handleQuickAction(button.dataset.quick));
  }

  tabButtons.forEach((button) => {
    button.addEventListener('click', () => setActiveView(button.dataset.view));
  });

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    (async () => {
      if (message.type === 'PANEL_ACTION' && message.action) {
        await handlePanelAction(message.action);
        sendResponse({ ok: true });
        return;
      }
      sendResponse({ ok: false });
    })();
    return true;
  });

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== 'local') return;
    if (changes.selectedModel && modelSelect.value !== changes.selectedModel.newValue) {
      modelSelect.value = changes.selectedModel.newValue;
      updateModelMeta();
    }
    if (changes.activePersonalityId && personalitySelect.value !== changes.activePersonalityId.newValue) {
      personalitySelect.value = changes.activePersonalityId.newValue;
    }
  });

  window.addEventListener('resize', debounce(() => {
    if (graphState.functions.length) requestGraphRender();
  }, 60));
}

async function consumePendingAction() {
  const response = await chrome.runtime.sendMessage({ type: 'CONSUME_PENDING_PANEL_ACTION' });
  if (response?.ok && response.action) {
    await handlePanelAction(response.action);
  }
}

function setActiveView(view, persist = true) {
  currentView = view || 'chat';
  if (currentView !== 'graph' && graphState.panelExpanded) {
    graphState.panelExpanded = false;
    appRoot.classList.remove('panel-graph-focus');
    if (expandGraphBtn) expandGraphBtn.textContent = 'Fullscreen in panel';
  }
  tabButtons.forEach((button) => button.classList.toggle('active', button.dataset.view === currentView));
  viewPanels.forEach((panel) => panel.classList.toggle('active', panel.dataset.viewPanel === currentView));
  if (persist) {
    const partial = FULL_APP ? { activeFullView: currentView } : { activePanelView: currentView };
    chrome.runtime.sendMessage({ type: 'SAVE_SETTINGS', partial }).catch(() => null);
  }
  if (currentView === 'graph' && graphState.functions.length) requestGraphRender();
}

function renderModels() {
  modelSelect.innerHTML = models.map((model) => `<option value="${escapeHtml(model.id)}">${escapeHtml(model.label)}</option>`).join('');
  modelSelect.value = settings.selectedModel || settings.defaultModel;
  updateModelMeta();
}

function renderPersonalities() {
  const personalities = settings.personalities?.length ? settings.personalities : DEFAULT_PERSONALITIES;
  personalitySelect.innerHTML = personalities.map((item) => `<option value="${escapeHtml(item.id)}">${escapeHtml(item.label)}</option>`).join('');
  personalitySelect.value = settings.activePersonalityId || personalities[0].id;
}

function renderChat(messages) {
  chatLog.innerHTML = '';
  if (!messages.length) {
    chatLog.innerHTML = '<div class="message assistant"><div class="message-content"><p>No conversation yet. A blank panel, humanity\'s favourite place to postpone starting.</p></div></div>';
    return;
  }
  for (const message of messages) appendMessage(message, false);
  chatLog.scrollTop = chatLog.scrollHeight;
}

function renderFiles() {
  if (!sessionFiles.length) {
    fileList.className = 'pill-list empty';
    fileList.textContent = 'No files added.';
    return;
  }
  fileList.className = 'pill-list';
  fileList.innerHTML = sessionFiles.map((file, index) => `
    <div class="pill">
      ${escapeHtml(file.name)}
      <button data-remove-file="${index}" class="ghost" style="margin-left:8px;padding:4px 8px;">×</button>
    </div>
  `).join('');
}

function renderCitations(citations) {
  if (!citations.length) {
    citationsList.className = 'citations-list empty';
    citationsList.textContent = 'No saved citations yet.';
    return;
  }
  citationsList.className = 'citations-list';
  citationsList.innerHTML = citations.map((item) => `<div class="citation-item">${escapeHtml(item.style)}\n${escapeHtml(item.citation)}</div>`).join('');
}

function updateModelMeta() {
  const model = models.find((item) => item.id === modelSelect.value);
  if (!model) {
    modelMeta.textContent = '';
    return;
  }
  modelMeta.textContent = `${model.notes} • Speed: ${model.speed} • Reasoning: ${model.reasoning} • Context: ${model.context}`;
}

async function refreshPageContext(preferredPageContext = null) {
  if (preferredPageContext) {
    currentPageContext = preferredPageContext;
    await chrome.runtime.sendMessage({ type: 'SAVE_SETTINGS', partial: { lastPageContext: preferredPageContext } });
    renderPageContextMeta();
    return;
  }

  let response = null;
  if (sourceTabId) {
    response = await chrome.runtime.sendMessage({ type: 'GET_PAGE_CONTEXT_FOR_TAB', tabId: sourceTabId });
  }
  if (!response?.ok) {
    response = await chrome.runtime.sendMessage({ type: 'GET_ACTIVE_PAGE_CONTEXT' });
  }
  if (!response?.ok) {
    if (pageContextMeta) pageContextMeta.textContent = response?.error || 'Failed to read page context.';
    return;
  }
  currentPageContext = response.pageContext;
  renderPageContextMeta();
}

function renderPageContextMeta() {
  if (!currentPageContext) {
    pageContextMeta.textContent = 'No page context loaded.';
    return;
  }
  const snippet = (currentPageContext.pageText || '').slice(0, 700);
  const docsSource = currentPageContext?.docsContext?.source;
  pageContextMeta.innerHTML = `
    <div><strong>Title:</strong> ${escapeHtml(currentPageContext.title || 'Untitled')}</div>
    <div><strong>URL:</strong> ${escapeHtml(currentPageContext.url || '')}</div>
    ${docsSource ? `<div><strong>Docs source:</strong> ${escapeHtml(docsSource)}</div>` : ''}
    <div><strong>Selection:</strong> ${escapeHtml((currentPageContext.selection || 'None').slice(0, 240))}</div>
    <div><strong>Headings:</strong> ${escapeHtml((currentPageContext.headings || []).slice(0, 6).join(' • ') || 'None detected')}</div>
    <div><strong>Snippet:</strong> ${escapeHtml(snippet || 'No readable page text detected.')}</div>
  `;
}

async function submitComposer() {
  const prompt = chatInput.value.trim();
  if (!prompt) return;

  const graphExpr = parseGraphExpression(prompt);
  if (graphExpr) {
    graphExpression.value = graphExpr;
    tryPlotGraph(graphExpr, { switchView: true });
  }

  await sendPrompt(prompt);
  chatInput.value = '';
}

async function handleQuickAction(kind) {
  if (kind === 'citation') {
    if (currentPageContext?.metadata) {
      const style = settings.citationStyle || 'APA';
      const citation = buildCitationFromMetadata(style, currentPageContext.metadata);
      await navigator.clipboard.writeText(citation).catch(() => null);
      await chrome.runtime.sendMessage({
        type: 'STORE_CITATION',
        entry: { style, citation, title: currentPageContext.title, url: currentPageContext.url, ts: Date.now() }
      });
      settings = (await chrome.runtime.sendMessage({ type: 'GET_SETTINGS' })).settings;
      renderCitations(settings.citationsNotebook || []);
      setActiveView('citations');
      appendMessage({ role: 'assistant', text: `${style} citation copied to clipboard:\n\n${citation}` });
    }
    return;
  }

  const quickPrompts = {
    summarise: 'Summarise the current page into a concise overview, then list the key takeaways.',
    keypoints: 'Extract the most important key points from the current page as bullet points.',
    notes: 'Turn the current page into structured study notes. Use headings and bullet points.',
    quiz: 'Create a mixed quiz from the current page with multiple-choice, short-answer, and true/false questions. Include an answer key and explanations.',
    flashcards: 'Create 10 high-quality flashcards from the current page. Use clear front/back or Q/A formatting.',
    docs: 'If this page is a Google Doc or writing draft, provide writing assistance: clarity edits, structure issues, repetition issues, and an improved version of the most important section.'
  };
  setActiveView('chat');
  await sendPrompt(quickPrompts[kind]);
}

async function handleFileAdd(event) {
  const files = Array.from(event.target.files || []);
  if (!files.length) return;
  const payloads = await Promise.all(files.map(readFilePayload));
  sessionFiles = [...sessionFiles, ...payloads].slice(-8);
  settings = (await chrome.runtime.sendMessage({ type: 'SAVE_SETTINGS', partial: { sessionFiles } })).settings;
  renderFiles();
  setActiveView('files');
  event.target.value = '';
}

async function handleFileRemove(event) {
  const index = event.target.closest('[data-remove-file]')?.dataset?.removeFile;
  if (index == null) return;
  sessionFiles.splice(Number(index), 1);
  settings = (await chrome.runtime.sendMessage({ type: 'SAVE_SETTINGS', partial: { sessionFiles } })).settings;
  renderFiles();
}

async function copyAllCitations() {
  const citations = (settings.citationsNotebook || []).map((item) => item.citation).join('\n\n');
  if (!citations) return;
  await navigator.clipboard.writeText(citations).catch(() => null);
}

async function handlePanelAction(action) {
  if (!action || !action.ts || action.ts <= lastHandledActionTs) return;
  lastHandledActionTs = action.ts;

  if (action.pageContext) {
    currentPageContext = action.pageContext;
    renderPageContextMeta();
    await chrome.runtime.sendMessage({ type: 'SAVE_SETTINGS', partial: { lastPageContext: action.pageContext } });
  } else {
    await refreshPageContext();
  }

  const selection = action.selectionText || currentPageContext?.selection || '';
  const promptMap = {
    explain: `Explain the selected text simply and clearly. Break it into short sections and use examples if useful.\n\nSelected text:\n${selection}`,
    summarise: `Summarise the selected text into concise bullet points, then add a one-sentence takeaway.\n\nSelected text:\n${selection}`,
    rewrite: `Rewrite the selected text for clarity and flow. Then briefly explain the changes.\n\nSelected text:\n${selection}`,
    flashcards: `Create 6 high-quality flashcards from this selection. Use clear Q/A formatting.\n\nSelected text:\n${selection}`,
    notes: `Turn this selection into structured study notes with headings and bullet points.\n\nSelected text:\n${selection}`,
    ask: `Use this selected text as context for my next question:\n\n${selection}\n\nMy question is:`
  };

  if (action.kind === 'ask') {
    setActiveView('chat');
    chatInput.value = promptMap.ask;
    chatInput.focus();
    chatInput.setSelectionRange(chatInput.value.length, chatInput.value.length);
    return;
  }

  const prompt = action.prompt || promptMap[action.kind];
  if (prompt) {
    setActiveView('chat');
    await sendPrompt(prompt, { selectionText: selection, pageContext: currentPageContext });
  }
}

async function sendPrompt(prompt, extra = {}) {
  appendMessage({ role: 'user', text: prompt });
  const thinking = appendMessage({ role: 'assistant', text: 'Thinking… ', pending: true });

  const response = await chrome.runtime.sendMessage({
    type: 'AI_REQUEST',
    prompt,
    pageContext: extra.pageContext || currentPageContext,
    selectionText: extra.selectionText || currentPageContext?.selection || '',
    model: modelSelect.value,
    personalityId: personalitySelect.value,
    filePayloads: sessionFiles
  });

  thinking.remove();

  if (!response.ok) {
    appendMessage({ role: 'assistant', text: `Error: ${response.error || 'Unknown error'}` });
    return;
  }

  appendMessage({ role: 'assistant', text: response.output, model: response.model, usage: response.usage || null });
  settings = (await chrome.runtime.sendMessage({ type: 'GET_SETTINGS' })).settings;

  const outputGraphExpr = parseGraphExpression(response.output);
  if (outputGraphExpr && !graphState.functions.length) {
    graphExpression.value = outputGraphExpr;
    tryPlotGraph(outputGraphExpr, { switchView: false });
  }
}

function appendMessage(message, scroll = true) {
  const el = document.createElement('div');
  el.className = `message ${message.role}${message.pending ? ' pending' : ''}`;
  const metaBits = [];
  if (message.model) metaBits.push(message.model);
  if (message.usage?.total_tokens) metaBits.push(`${message.usage.total_tokens} tokens`);

  const meta = metaBits.length ? `<span class="meta">${escapeHtml(metaBits.join(' • '))}</span>` : '';
  el.innerHTML = `${meta}<div class="message-content">${renderRichText(message.text || '')}</div>`;
  const expr = parseGraphExpression(message.text || '');
  if (expr) {
    el.querySelector('.message-content').appendChild(createInlineGraphPreview(expr));
  }
  chatLog.appendChild(el);
  if (scroll) chatLog.scrollTop = chatLog.scrollHeight;
  return el;
}

function renderRichText(text) {
  const lines = String(text || '').replace(/\r/g, '').split('\n');
  let html = '';
  let inUl = false;
  let inOl = false;
  let inCode = false;
  let paragraph = [];

  const flushParagraph = () => {
    if (!paragraph.length) return;
    const joined = paragraph.join(' ').trim();
    if (isDisplayMathLine(joined)) {
      html += renderDisplayMath(joined);
    } else {
      html += `<p>${inlineFormat(joined)}</p>`;
    }
    paragraph = [];
  };

  const closeLists = () => {
    if (inUl) html += '</ul>';
    if (inOl) html += '</ol>';
    inUl = false;
    inOl = false;
  };

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    const trimmed = line.trim();

    if (trimmed.startsWith('```')) {
      flushParagraph();
      closeLists();
      if (!inCode) {
        html += '<pre><code>';
        inCode = true;
      } else {
        html += '</code></pre>';
        inCode = false;
      }
      continue;
    }

    if (inCode) {
      html += `${escapeHtml(rawLine)}\n`;
      continue;
    }

    if (!trimmed) {
      flushParagraph();
      closeLists();
      continue;
    }

    const headingMatch = trimmed.match(/^(#{1,4})\s+(.*)$/);
    if (headingMatch) {
      flushParagraph();
      closeLists();
      const level = headingMatch[1].length;
      html += `<h${level}>${inlineFormat(headingMatch[2])}</h${level}>`;
      continue;
    }

    if (/^[-*•]\s+/.test(trimmed)) {
      flushParagraph();
      if (inOl) {
        html += '</ol>';
        inOl = false;
      }
      if (!inUl) {
        html += '<ul>';
        inUl = true;
      }
      html += `<li>${inlineFormat(trimmed.replace(/^[-*•]\s+/, ''))}</li>`;
      continue;
    }

    if (/^\d+[.)]\s+/.test(trimmed)) {
      flushParagraph();
      if (inUl) {
        html += '</ul>';
        inUl = false;
      }
      if (!inOl) {
        html += '<ol>';
        inOl = true;
      }
      html += `<li>${inlineFormat(trimmed.replace(/^\d+[.)]\s+/, ''))}</li>`;
      continue;
    }

    if (trimmed.startsWith('>')) {
      flushParagraph();
      closeLists();
      html += `<blockquote>${inlineFormat(trimmed.replace(/^>\s?/, ''))}</blockquote>`;
      continue;
    }

    if (isDisplayMathLine(trimmed)) {
      flushParagraph();
      closeLists();
      html += renderDisplayMath(trimmed);
      continue;
    }

    closeLists();
    paragraph.push(trimmed);
  }

  flushParagraph();
  closeLists();
  if (inCode) html += '</code></pre>';
  return html;
}

function inlineFormat(text) {
  const raw = String(text || '');
  const tokenRegex = /\\\((?:[\s\S]+?)\\\)|\\\[(?:[\s\S]+?)\\\]|\$\$(?:[\s\S]+?)\$\$|\$(?:\\.|[^$\\])+\$/g;
  let html = '';
  let lastIndex = 0;

  for (const match of raw.matchAll(tokenRegex)) {
    const index = match.index || 0;
    html += formatInlineText(raw.slice(lastIndex, index));
    const token = match[0];
    const display = token.startsWith('$$') || token.startsWith('\\[');
    html += renderMathToken(token, display);
    lastIndex = index + token.length;
  }

  html += formatInlineText(raw.slice(lastIndex));
  return html;
}

function formatInlineText(text) {
  let safe = escapeHtml(text);
  safe = safe.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  safe = safe.replace(/`([^`]+)`/g, '<code>$1</code>');
  return safe;
}

function isDisplayMathLine(text) {
  const trimmed = String(text || '').trim();
  return /^\\\[[\s\S]+\\\]$/.test(trimmed) || /^\$\$[\s\S]+\$\$$/.test(trimmed);
}

function renderDisplayMath(text) {
  return `<div class="math-display-wrap">${renderMathToken(text, true)}</div>`;
}

function renderMathToken(token, forceDisplay = false) {
  let expr = String(token || '').trim();
  let display = forceDisplay;

  if ((expr.startsWith('\\(') && expr.endsWith('\\)')) || (expr.startsWith('\\[') && expr.endsWith('\\]'))) {
    display = display || expr.startsWith('\\[');
    expr = expr.slice(2, -2);
  } else if ((expr.startsWith('$$') && expr.endsWith('$$')) || (expr.startsWith('$') && expr.endsWith('$'))) {
    display = display || expr.startsWith('$$');
    expr = expr.slice(expr.startsWith('$$') ? 2 : 1, expr.endsWith('$$') ? -2 : -1);
  }

  return `<span class="math-render ${display ? 'math-display' : 'math-inline'}">${renderMathExpression(expr)}</span>`;
}

function renderMathExpression(expr) {
  let value = String(expr || '').trim();
  value = value.replace(/\\left|\\right/g, '');
  value = value.replace(/\\,/g, ' ');
  value = value.replace(/\\;/g, ' ');
  value = value.replace(/\\!/g, '');
  value = value.replace(/\\quad|\\qquad/g, '  ');
  value = value.replace(/\\text\{([^{}]*)\}/g, '$1');
  value = value.replace(/\\operatorname\{([^{}]*)\}/g, '$1');

  const fragments = [];
  const stash = (html) => `@@MATH${fragments.push(html) - 1}@@`;

  for (let i = 0; i < 12; i += 1) {
    const next = value
      .replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, (_, a, b) => stash(`<span class="math-frac"><span class="math-frac-top">${renderMathExpression(a)}</span><span class="math-frac-bottom">${renderMathExpression(b)}</span></span>`))
      .replace(/\\sqrt\{([^{}]+)\}/g, (_, inner) => stash(`<span class="math-sqrt">√<span class="math-sqrt-body">${renderMathExpression(inner)}</span></span>`));
    if (next === value) break;
    value = next;
  }

  const commandMap = {
    '\\pi': 'π', '\\theta': 'θ', '\\alpha': 'α', '\\beta': 'β', '\\gamma': 'γ', '\\Delta': 'Δ',
    '\\delta': 'δ', '\\lambda': 'λ', '\\mu': 'μ', '\\sigma': 'σ', '\\phi': 'φ', '\\omega': 'ω',
    '\\infty': '∞', '\\pm': '±', '\\mp': '∓', '\\cdot': '·', '\\times': '×', '\\div': '÷',
    '\\leq': '≤', '\\geq': '≥', '\\neq': '≠', '\\approx': '≈', '\\to': '→', '\\rightarrow': '→',
    '\\in': '∈', '\\notin': '∉', '\\subset': '⊂', '\\subseteq': '⊆', '\\cup': '∪', '\\cap': '∩',
    '\\sin': 'sin', '\\cos': 'cos', '\\tan': 'tan', '\\cot': 'cot', '\\sec': 'sec', '\\csc': 'csc',
    '\\arcsin': 'arcsin', '\\arccos': 'arccos', '\\arctan': 'arctan', '\\ln': 'ln', '\\log': 'log',
    '\\mathbb{R}': 'ℝ', '\\mathbb{Z}': 'ℤ', '\\mathbb{N}': 'ℕ', '\\mathbb{Q}': 'ℚ',
    '\\lvert': '|', '\\rvert': '|', '\\cdots': '⋯'
  };

  for (const [key, mapped] of Object.entries(commandMap)) {
    value = value.split(key).join(mapped);
  }

  value = escapeHtml(value);
  value = value.replace(/([A-Za-z0-9)\]πθαβγΔδλμσφω∞ℝℤℕℚ|])\^\{([^{}]+)\}/g, (_, base, sup) => `${base}<sup>${escapeHtml(sup)}</sup>`);
  value = value.replace(/([A-Za-z0-9)\]πθαβγΔδλμσφω∞ℝℤℕℚ|])\^([A-Za-z0-9+\-]+)/g, (_, base, sup) => `${base}<sup>${escapeHtml(sup)}</sup>`);
  value = value.replace(/([A-Za-z0-9)\]πθαβγΔδλμσφω∞ℝℤℕℚ|])_\{([^{}]+)\}/g, (_, base, sub) => `${base}<sub>${escapeHtml(sub)}</sub>`);
  value = value.replace(/([A-Za-z0-9)\]πθαβγΔδλμσφω∞ℝℤℕℚ|])_([A-Za-z0-9+\-]+)/g, (_, base, sub) => `${base}<sub>${escapeHtml(sub)}</sub>`);
  value = value.replace(/[{}]/g, '');
  value = value.replace(/\\,/g, ' ');
  value = value.replace(/\\/g, '');
  value = value.replace(/@@MATH(\d+)@@/g, (_, index) => fragments[Number(index)] || '');
  value = value.replace(/\s{3,}/g, '  ');
  return value;
}

function buildCitationFromMetadata(style, metadata) {
  const date = metadata?.publishedAt ? new Date(metadata.publishedAt) : null;
  const year = date && !Number.isNaN(date.getTime()) ? String(date.getFullYear()) : 'n.d.';
  const title = metadata?.title || 'Untitled page';
  const site = metadata?.siteName || 'Website';
  const url = metadata?.url || '';
  const author = (metadata?.author || '').replace(/^By\s+/i, '').trim();
  switch ((style || 'APA').toUpperCase()) {
    case 'MLA':
      return author ? `${author}. "${title}." ${site}, ${year}, ${url}.` : `"${title}." ${site}, ${year}, ${url}.`;
    case 'HARVARD':
      return author ? `${author} ${year}, '${title}', ${site}, viewed ${new Date().toLocaleDateString()}, <${url}>.` : `${site} ${year}, '${title}', viewed ${new Date().toLocaleDateString()}, <${url}>.`;
    case 'CHICAGO':
      return author ? `${author}. "${title}." ${site}. ${url}.` : `${site}. "${title}." ${url}.`;
    case 'IEEE':
      return author ? `${author}, "${title}," ${site}. [Online]. Available: ${url}.` : `"${title}," ${site}. [Online]. Available: ${url}.`;
    case 'APA':
    default:
      return author ? `${author} (${year}). ${title}. ${site}. ${url}` : `${site}. (${year}). ${title}. ${url}`;
  }
}

async function readFilePayload(file) {
  const isText = file.type.startsWith('text/') || /json|javascript|typescript|html|css|markdown|xml|csv/.test(file.type) || /\.(txt|md|js|ts|json|html|css|csv|py|java|c|cpp|h|xml)$/i.test(file.name);
  const content = isText ? await file.text() : `[Binary file attached: ${file.name}, type ${file.type || 'unknown'}, size ${file.size} bytes]`;
  return {
    name: file.name,
    type: file.type || 'application/octet-stream',
    size: file.size,
    content: content.slice(0, 24000)
  };
}

function tryPlotGraph(expressionsText, { autoFit = true, switchView = true } = {}) {
  const parsed = parseGraphExpressions(expressionsText);
  if (!parsed.length) {
    if (!FULL_APP) {
      clearGraph();
    }
    graphMeta.textContent = 'Enter at least one valid expression first.';
    return;
  }

  graphState.expressionsText = expressionsText;
  graphState.functions = parsed;
  graphState.showCard = true;
  graphCard.classList.remove('hidden');
  graphExpression.value = expressionsText;
  chrome.runtime.sendMessage({ type: 'SAVE_SETTINGS', partial: { lastGraphExpressions: expressionsText } }).catch(() => null);

  if (autoFit || !hasFiniteViewport()) resetGraphViewport(false);
  const analysis = analyseFunctions(parsed, { xMin: graphState.xMin, xMax: graphState.xMax });
  graphState.markers = analysis.markers;
  renderGraphAnalysis(analysis);
  if (switchView) setActiveView('graph');
  requestGraphRender();
}

function clearGraph() {
  graphState.expressionsText = '';
  graphState.functions = [];
  graphState.markers = [];
  graphExpression.value = '';
  graphMeta.textContent = 'Graph cleared.';
  chrome.runtime.sendMessage({ type: 'SAVE_SETTINGS', partial: { lastGraphExpressions: '' } }).catch(() => null);
  renderGraphAnalysis({ functions: [], intercepts: [], stationary: [], intersections: [], markers: [] });
  if (!FULL_APP) {
    graphState.showCard = false;
    graphCard.classList.add('hidden');
  }
  const ctx = graphCanvas?.getContext('2d');
  if (ctx) ctx.clearRect(0, 0, graphCanvas.width, graphCanvas.height);
}

function resetGraphViewport(renderNow = true) {
  if (!graphState.functions.length) {
    graphState.xMin = -10;
    graphState.xMax = 10;
    graphState.yMin = -10;
    graphState.yMax = 10;
    if (renderNow) requestGraphRender();
    return;
  }

  const bounds = estimateViewport(graphState.functions);
  graphState.xMin = bounds.xMin;
  graphState.xMax = bounds.xMax;
  graphState.yMin = bounds.yMin;
  graphState.yMax = bounds.yMax;

  const analysis = analyseFunctions(graphState.functions, { xMin: graphState.xMin, xMax: graphState.xMax });
  graphState.markers = analysis.markers;
  renderGraphAnalysis(analysis);
  if (renderNow) requestGraphRender();
}

function getCanvasDisplaySize() {
  const bounds = graphCanvas?.getBoundingClientRect?.() || { width: graphState.lastCanvasCssWidth || 1, height: graphState.lastCanvasCssHeight || 1, left: 0, top: 0, right: graphState.lastCanvasCssWidth || 1, bottom: graphState.lastCanvasCssHeight || 1 };
  const width = Math.max(320, Math.floor(bounds.width || graphCanvas.clientWidth || 320));
  const defaultHeight = FULL_APP ? 560 : (graphState.panelExpanded ? 620 : 360);
  const height = Math.max(defaultHeight, Math.floor(bounds.height || graphCanvas.clientHeight || defaultHeight));
  return { width, height };
}

function requestGraphRender() {
  if (graphState.renderQueued) return;
  graphState.renderQueued = true;
  requestAnimationFrame(() => {
    graphState.renderQueued = false;
    renderGraph();
  });
}

function scheduleGraphAnalysis(delay = 120) {
  window.clearTimeout(graphState.analysisTimer);
  graphState.analysisTimer = window.setTimeout(() => {
    rerunGraphAnalysis();
  }, delay);
}

function attachGraphInteractions() {
  graphCanvas?.addEventListener('wheel', (event) => {
    if (!graphState.functions.length || !graphState.allowWheelZoom) return;
    event.preventDefault();
    const zoom = event.deltaY < 0 ? 0.9 : 1.1;
    const bounds = graphCanvas?.getBoundingClientRect?.() || { width: graphState.lastCanvasCssWidth || 1, height: graphState.lastCanvasCssHeight || 1, left: 0, top: 0, right: graphState.lastCanvasCssWidth || 1, bottom: graphState.lastCanvasCssHeight || 1 };
    const px = event.clientX - bounds.left;
    const py = event.clientY - bounds.top;
    const x = canvasToMathX(px, bounds.width || graphState.lastCanvasCssWidth || 1);
    const y = canvasToMathY(py, bounds.height || graphState.lastCanvasCssHeight || 1);

    graphState.xMin = x + (graphState.xMin - x) * zoom;
    graphState.xMax = x + (graphState.xMax - x) * zoom;
    graphState.yMin = y + (graphState.yMin - y) * zoom;
    graphState.yMax = y + (graphState.yMax - y) * zoom;
    scheduleGraphAnalysis(90);
    requestGraphRender();
  }, { passive: false });

  graphCanvas?.addEventListener('mousedown', (event) => {
    graphState.dragging = true;
    graphState.lastX = event.clientX;
    graphState.lastY = event.clientY;
  });

  window.addEventListener('mouseup', () => {
    graphState.dragging = false;
  });

  window.addEventListener('mousemove', (event) => {
    const bounds = graphCanvas?.getBoundingClientRect?.() || { width: graphState.lastCanvasCssWidth || 1, height: graphState.lastCanvasCssHeight || 1, left: 0, top: 0, right: graphState.lastCanvasCssWidth || 1, bottom: graphState.lastCanvasCssHeight || 1 };
    graphState.mouseX = event.clientX >= bounds.left && event.clientX <= bounds.right ? event.clientX - bounds.left : null;
    graphState.mouseY = event.clientY >= bounds.top && event.clientY <= bounds.bottom ? event.clientY - bounds.top : null;

    if (graphState.dragging && graphState.functions.length) {
      const dx = event.clientX - graphState.lastX;
      const dy = event.clientY - graphState.lastY;
      const xRange = graphState.xMax - graphState.xMin;
      const yRange = graphState.yMax - graphState.yMin;
      const width = bounds.width || graphState.lastCanvasCssWidth || 1;
      const height = bounds.height || graphState.lastCanvasCssHeight || 1;
      const xShift = -(dx / width) * xRange;
      const yShift = (dy / height) * yRange;
      graphState.xMin += xShift;
      graphState.xMax += xShift;
      graphState.yMin += yShift;
      graphState.yMax += yShift;
      graphState.lastX = event.clientX;
      graphState.lastY = event.clientY;
      scheduleGraphAnalysis(90);
      requestGraphRender();
      return;
    }

    if (graphState.functions.length && currentView === 'graph') {
      requestGraphRender();
    }
  });
}

function renderGraph() {
  if (!graphState.showCard && !FULL_APP) return;
  if (currentView !== 'graph' && !FULL_APP) return;

  const { width: cssWidth, height: cssHeight } = getCanvasDisplaySize();
  const dpr = Math.max(1, window.devicePixelRatio || 1);
  const pixelWidth = Math.max(1, Math.floor(cssWidth * dpr));
  const pixelHeight = Math.max(1, Math.floor(cssHeight * dpr));

  if (graphCanvas.width !== pixelWidth) graphCanvas.width = pixelWidth;
  if (graphCanvas.height !== pixelHeight) graphCanvas.height = pixelHeight;
  graphState.lastCanvasCssWidth = cssWidth;
  graphState.lastCanvasCssHeight = cssHeight;

  const ctx = graphCanvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, cssWidth, cssHeight);
  ctx.fillStyle = '#07101d';
  ctx.fillRect(0, 0, cssWidth, cssHeight);
  ctx.imageSmoothingEnabled = true;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const { xMin, xMax, yMin, yMax } = graphState;
  const toX = (x) => ((x - xMin) / (xMax - xMin)) * cssWidth;
  const toY = (y) => cssHeight - ((y - yMin) / (yMax - yMin)) * cssHeight;

  drawGrid(ctx, cssWidth, cssHeight, xMin, xMax, yMin, yMax, toX, toY);
  drawAxes(ctx, cssWidth, cssHeight, toX, toY, xMin, xMax, yMin, yMax);

  for (const fnInfo of graphState.functions) {
    drawFunction(ctx, cssWidth, cssHeight, fnInfo, toX, toY, xMin, xMax, yMin, yMax);
  }

  drawMarkers(ctx, toX, toY, graphState.markers);

  if (graphState.mouseX != null && graphState.mouseY != null && graphState.functions.length) {
    const hoverText = drawHoverInfo(ctx, toX, toY, cssWidth, xMin, xMax);
    if (hoverText) {
      graphMeta.textContent = hoverText;
      return;
    }
  }

  graphMeta.textContent = `${graphState.functions.map((item) => item.label).join(' • ')} • x:[${xMin.toFixed(2)}, ${xMax.toFixed(2)}] • y:[${yMin.toFixed(2)}, ${yMax.toFixed(2)}] • drag to pan • wheel zoom enabled`;
}

function drawAxes(ctx, width, height, toX, toY, xMin, xMax, yMin, yMax) {
  ctx.strokeStyle = '#6e90bf';
  ctx.lineWidth = 1.8;
  if (xMin <= 0 && xMax >= 0) {
    ctx.beginPath();
    ctx.moveTo(toX(0), 0);
    ctx.lineTo(toX(0), height);
    ctx.stroke();
  }
  if (yMin <= 0 && yMax >= 0) {
    ctx.beginPath();
    ctx.moveTo(0, toY(0));
    ctx.lineTo(width, toY(0));
    ctx.stroke();
  }
}

function drawFunction(ctx, width, height, fnInfo, toX, toY, xMin, xMax, yMin, yMax) {
  ctx.strokeStyle = fnInfo.color;
  ctx.lineWidth = 2.3;
  let drawing = false;
  let previousY = null;
  const step = Math.max(1, Math.floor(width / 800));

  for (let px = 0; px <= width; px += step) {
    const x = xMin + (px / width) * (xMax - xMin);
    let y;
    try {
      y = fnInfo.fn(x);
    } catch {
      if (drawing) ctx.stroke();
      drawing = false;
      previousY = null;
      continue;
    }
    if (!Number.isFinite(y) || Math.abs(y) > 1e6) {
      if (drawing) ctx.stroke();
      drawing = false;
      previousY = null;
      continue;
    }
    const py = toY(y);
    const verticalJump = previousY != null && Math.abs(py - previousY) > height * 0.42;
    if (!drawing || verticalJump) {
      if (drawing) ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(px, py);
      drawing = true;
    } else {
      ctx.lineTo(px, py);
    }
    previousY = py;
  }

  if (drawing) ctx.stroke();
}

function drawMarkers(ctx, toX, toY, markers) {
  for (const marker of markers) {
    const px = toX(marker.x);
    const py = toY(marker.y);
    if (!Number.isFinite(px) || !Number.isFinite(py)) continue;
    ctx.fillStyle = marker.color || '#ffffff';
    ctx.strokeStyle = '#08101b';
    ctx.lineWidth = 1.25;
    ctx.beginPath();
    ctx.arc(px, py, marker.kind === 'stationary' ? 5.8 : 4.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
}

function drawHoverInfo(ctx, toX, toY, width, xMin, xMax) {
  const mouseMathX = canvasToMathX(graphState.mouseX, width);
  const parts = [];
  let drawn = false;
  for (const fnInfo of graphState.functions.slice(0, 4)) {
    try {
      const mouseMathY = fnInfo.fn(mouseMathX);
      if (!Number.isFinite(mouseMathY) || Math.abs(mouseMathY) > 1e6) continue;
      const px = toX(mouseMathX);
      const py = toY(mouseMathY);
      ctx.fillStyle = fnInfo.color;
      ctx.beginPath();
      ctx.arc(px, py, 5, 0, Math.PI * 2);
      ctx.fill();
      parts.push(`${fnInfo.label}: (${formatNumber(mouseMathX)}, ${formatNumber(mouseMathY)})`);
      drawn = true;
    } catch {
      // nothing
    }
  }
  if (!drawn) return '';
  return `${parts.join(' • ')} • ${graphState.allowWheelZoom ? 'wheel zoom enabled' : 'zoom locked in side panel'}`;
}

function drawGrid(ctx, width, height, xMin, xMax, yMin, yMax, toX, toY) {
  const xStep = niceStep((xMax - xMin) / 8);
  const yStep = niceStep((yMax - yMin) / 8);
  ctx.font = `${Math.max(11, Math.floor(width * 0.013))}px Inter, Arial, sans-serif`;
  ctx.fillStyle = '#7d95bc';
  ctx.strokeStyle = 'rgba(43, 74, 117, 0.65)';
  ctx.lineWidth = 1;

  for (let x = Math.ceil(xMin / xStep) * xStep; x <= xMax; x += xStep) {
    const px = toX(x);
    ctx.beginPath();
    ctx.moveTo(px, 0);
    ctx.lineTo(px, height);
    ctx.stroke();
    if (Math.abs(x) > 1e-9) ctx.fillText(formatNumber(x), px + 4, Math.min(height - 8, toY(0) - 6));
  }
  for (let y = Math.ceil(yMin / yStep) * yStep; y <= yMax; y += yStep) {
    const py = toY(y);
    ctx.beginPath();
    ctx.moveTo(0, py);
    ctx.lineTo(width, py);
    ctx.stroke();
    if (Math.abs(y) > 1e-9) ctx.fillText(formatNumber(y), 6, py - 6);
  }
}

function rerunGraphAnalysis() {
  if (!graphState.functions.length) return;
  const analysis = analyseFunctions(graphState.functions, { xMin: graphState.xMin, xMax: graphState.xMax });
  graphState.markers = analysis.markers;
  renderGraphAnalysis(analysis);
}

function renderGraphAnalysis(analysis) {
  renderAnalysisList(graphFunctionsList, analysis.functions.map((item) => `<strong style="color:${item.color}">${escapeHtml(item.label)}</strong> <code>${escapeHtml(item.expr)}</code>`), 'No functions plotted.');
  renderAnalysisList(graphInterceptsList, analysis.intercepts.map((item) => `${escapeHtml(item.label)}: ${escapeHtml(item.description)}`), 'Nothing yet.');
  renderAnalysisList(graphStationaryList, analysis.stationary.map((item) => `${escapeHtml(item.label)}: ${escapeHtml(item.description)}`), 'Nothing yet.');
  renderAnalysisList(graphIntersectionsList, analysis.intersections.map((item) => escapeHtml(item.description)), 'Nothing yet.');
}

function renderAnalysisList(container, items, emptyText) {
  if (!items.length) {
    container.className = 'analysis-list empty';
    container.textContent = emptyText;
    return;
  }
  container.className = 'analysis-list';
  container.innerHTML = items.map((item) => `<div class="analysis-item">${item}</div>`).join('');
}

function parseGraphExpressions(text) {
  const cleaned = String(text || '').trim();
  if (!cleaned) return [];
  const parts = splitExpressions(cleaned);
  const parsed = [];

  for (let i = 0; i < parts.length; i += 1) {
    const expr = parts[i].trim();
    if (!expr) continue;
    try {
      const fn = compileExpression(expr);
      parsed.push({
        expr,
        label: normaliseLabel(expr, i),
        color: GRAPH_COLORS[i % GRAPH_COLORS.length],
        fn,
        index: i
      });
    } catch (error) {
      appendMessage({ role: 'assistant', text: `Graph parser skipped \`${expr}\`: ${error.message}` });
    }
  }

  return parsed;
}

function splitExpressions(text) {
  const parts = [];
  let current = '';
  let depth = 0;
  for (const ch of text) {
    if (ch === '(') depth += 1;
    if (ch === ')') depth = Math.max(0, depth - 1);
    if ((ch === '\n' || ch === ';' || ch === ',') && depth === 0) {
      if (current.trim()) parts.push(current.trim());
      current = '';
      continue;
    }
    current += ch;
  }
  if (current.trim()) parts.push(current.trim());
  return parts;
}

function normaliseLabel(expr, index) {
  const trimmed = String(expr).trim();
  if (/^y\s*=/.test(trimmed)) return trimmed;
  return `y = ${trimmed}`;
}

function estimateViewport(functions) {
  let xMin = -10;
  let xMax = 10;
  const sampleXMin = -10;
  const sampleXMax = 10;
  const yValues = [];

  for (const fnInfo of functions) {
    for (let i = 0; i <= 600; i += 1) {
      const x = sampleXMin + (i / 600) * (sampleXMax - sampleXMin);
      try {
        const y = fnInfo.fn(x);
        if (Number.isFinite(y) && Math.abs(y) < 1e4) yValues.push(y);
      } catch {
        // skip
      }
    }
  }

  if (!yValues.length) {
    return { xMin, xMax, yMin: -10, yMax: 10 };
  }

  const minY = percentile(yValues, 0.05);
  const maxY = percentile(yValues, 0.95);
  const yPadding = Math.max(1.5, (maxY - minY) * 0.18 || 3);
  let yMin = minY - yPadding;
  let yMax = maxY + yPadding;

  if (Math.abs(yMax - yMin) < 2) {
    yMin -= 2;
    yMax += 2;
  }

  return { xMin, xMax, yMin, yMax };
}

function analyseFunctions(functions, range) {
  const markers = [];
  const functionSummaries = functions.map((fnInfo) => ({ color: fnInfo.color, label: fnInfo.label, expr: fnInfo.expr }));
  const intercepts = [];
  const stationary = [];
  const intersections = [];

  for (const fnInfo of functions) {
    const yIntY = safeEval(fnInfo.fn, 0);
    if (Number.isFinite(yIntY)) {
      markers.push({ kind: 'y-intercept', x: 0, y: yIntY, label: `${fnInfo.label} y-int`, color: fnInfo.color });
      intercepts.push({ label: fnInfo.label, description: `y-intercept at ${formatPoint(0, yIntY)}` });
    }

    const xRoots = findRoots(fnInfo.fn, range.xMin, range.xMax, 1400);
    if (xRoots.length) {
      for (const x of xRoots) {
        markers.push({ kind: 'x-intercept', x, y: 0, label: `${fnInfo.label} x-int`, color: fnInfo.color });
      }
      intercepts.push({ label: fnInfo.label, description: `x-intercepts at ${xRoots.map((x) => formatPoint(x, 0)).join(', ')}` });
    } else {
      intercepts.push({ label: fnInfo.label, description: 'No x-intercepts found in the current view.' });
    }

    const stationaryXs = findDerivativeZeros(fnInfo.fn, range.xMin, range.xMax, 1000);
    if (stationaryXs.length) {
      for (const x of stationaryXs) {
        const y = safeEval(fnInfo.fn, x);
        if (!Number.isFinite(y)) continue;
        const nature = classifyStationary(fnInfo.fn, x);
        markers.push({ kind: 'stationary', x, y, label: `${fnInfo.label} stationary`, color: fnInfo.color });
        stationary.push({ label: fnInfo.label, description: `${nature} at ${formatPoint(x, y)}` });
      }
    } else {
      stationary.push({ label: fnInfo.label, description: 'No stationary points detected in the current view.' });
    }
  }

  for (let i = 0; i < functions.length; i += 1) {
    for (let j = i + 1; j < functions.length; j += 1) {
      const f1 = functions[i];
      const f2 = functions[j];
      const xs = findRoots((x) => safeEval(f1.fn, x) - safeEval(f2.fn, x), range.xMin, range.xMax, 1400);
      for (const x of xs) {
        const y = safeEval(f1.fn, x);
        if (!Number.isFinite(y)) continue;
        markers.push({ kind: 'intersection', x, y, label: `${f1.label} ∩ ${f2.label}`, color: '#ffffff' });
        intersections.push({ description: `${f1.label} and ${f2.label} intersect at ${formatPoint(x, y)}` });
      }
    }
  }

  return {
    functions: functionSummaries,
    intercepts,
    stationary,
    intersections,
    markers: dedupeMarkers(markers)
  };
}

function dedupeMarkers(markers) {
  const seen = new Set();
  return markers.filter((marker) => {
    const key = `${marker.kind}:${roundForKey(marker.x)}:${roundForKey(marker.y)}:${marker.label}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function findRoots(fn, start, end, steps = 1000) {
  const roots = [];
  let prevX = start;
  let prevY = safeEval(fn, prevX);
  for (let i = 1; i <= steps; i += 1) {
    const x = start + (i / steps) * (end - start);
    const y = safeEval(fn, x);
    if (!Number.isFinite(prevY) || !Number.isFinite(y)) {
      prevX = x;
      prevY = y;
      continue;
    }
    if (Math.abs(y) < 1e-7) roots.push(x);
    if (prevY === 0 || y === 0 || Math.sign(prevY) !== Math.sign(y)) {
      const root = bisectRoot(fn, prevX, x);
      if (Number.isFinite(root)) roots.push(root);
    }
    prevX = x;
    prevY = y;
  }
  return dedupeNumbers(roots, 1e-3).filter((x) => x >= start - 1e-6 && x <= end + 1e-6);
}

function bisectRoot(fn, a, b) {
  let fa = safeEval(fn, a);
  let fb = safeEval(fn, b);
  if (!Number.isFinite(fa) || !Number.isFinite(fb)) return NaN;
  if (Math.abs(fa) < 1e-9) return a;
  if (Math.abs(fb) < 1e-9) return b;
  for (let i = 0; i < 60; i += 1) {
    const mid = (a + b) / 2;
    const fm = safeEval(fn, mid);
    if (!Number.isFinite(fm)) return NaN;
    if (Math.abs(fm) < 1e-9) return mid;
    if (Math.sign(fa) === Math.sign(fm)) {
      a = mid;
      fa = fm;
    } else {
      b = mid;
      fb = fm;
    }
  }
  return (a + b) / 2;
}

function findDerivativeZeros(fn, start, end, steps = 800) {
  return findRoots((x) => numericDerivative(fn, x), start, end, steps);
}

function classifyStationary(fn, x) {
  const second = numericSecondDerivative(fn, x);
  if (!Number.isFinite(second)) return 'Stationary point';
  if (second > 1e-3) return 'Local minimum';
  if (second < -1e-3) return 'Local maximum';
  return 'Stationary inflection';
}

function numericDerivative(fn, x) {
  const h = Math.max(1e-4, Math.abs(x) * 1e-4);
  const y1 = safeEval(fn, x + h);
  const y0 = safeEval(fn, x - h);
  if (!Number.isFinite(y1) || !Number.isFinite(y0)) return NaN;
  return (y1 - y0) / (2 * h);
}

function numericSecondDerivative(fn, x) {
  const h = Math.max(1e-3, Math.abs(x) * 1e-3);
  const yp = safeEval(fn, x + h);
  const y0 = safeEval(fn, x);
  const ym = safeEval(fn, x - h);
  if (!Number.isFinite(yp) || !Number.isFinite(y0) || !Number.isFinite(ym)) return NaN;
  return (yp - 2 * y0 + ym) / (h * h);
}

function safeEval(fn, x) {
  try {
    const value = fn(x);
    return Number.isFinite(value) ? value : NaN;
  } catch {
    return NaN;
  }
}

function niceStep(raw) {
  const power = Math.pow(10, Math.floor(Math.log10(raw || 1)));
  const scaled = raw / power;
  if (scaled < 1.5) return 1 * power;
  if (scaled < 3) return 2 * power;
  if (scaled < 7) return 5 * power;
  return 10 * power;
}

function canvasToMathX(px, width) {
  return graphState.xMin + (px / width) * (graphState.xMax - graphState.xMin);
}

function canvasToMathY(py, height) {
  return graphState.yMax - (py / height) * (graphState.yMax - graphState.yMin);
}

function hasFiniteViewport() {
  return [graphState.xMin, graphState.xMax, graphState.yMin, graphState.yMax].every(Number.isFinite);
}

function compileExpression(expr) {
  const ast = parseMathExpression(expr);
  return (x) => evaluateAst(ast, x);
}

function parseMathExpression(expr) {
  const rawTokens = tokenizeExpression(expr);
  const tokens = insertImplicitMultiplication(rawTokens);
  let index = 0;

  function peek() {
    return tokens[index] || null;
  }

  function consume(expectedType, expectedValue = null) {
    const token = tokens[index];
    if (!token || token.type !== expectedType || (expectedValue !== null && token.value !== expectedValue)) {
      throw new Error('Invalid graph expression. Manifest V3 murdered eval, so now we do this properly.');
    }
    index += 1;
    return token;
  }

  function parseExpressionInner() {
    let node = parseTerm();
    while (true) {
      const token = peek();
      if (!token || token.type !== 'op' || (token.value !== '+' && token.value !== '-')) break;
      consume('op');
      node = { type: 'binary', op: token.value, left: node, right: parseTerm() };
    }
    return node;
  }

  function parseTerm() {
    let node = parsePower();
    while (true) {
      const token = peek();
      if (!token || token.type !== 'op' || (token.value !== '*' && token.value !== '/')) break;
      consume('op');
      node = { type: 'binary', op: token.value, left: node, right: parsePower() };
    }
    return node;
  }

  function parsePower() {
    let node = parseUnary();
    const token = peek();
    if (token && token.type === 'op' && token.value === '^') {
      consume('op', '^');
      node = { type: 'binary', op: '^', left: node, right: parsePower() };
    }
    return node;
  }

  function parseUnary() {
    const token = peek();
    if (token && token.type === 'op' && (token.value === '+' || token.value === '-')) {
      consume('op');
      return { type: 'unary', op: token.value, value: parseUnary() };
    }
    return parsePrimary();
  }

  function parsePrimary() {
    const token = peek();
    if (!token) throw new Error('Expression ended unexpectedly. Tragic.');

    if (token.type === 'number') {
      consume('number');
      return { type: 'number', value: token.value };
    }
    if (token.type === 'variable') {
      consume('variable');
      return { type: 'variable' };
    }
    if (token.type === 'constant') {
      consume('constant');
      return { type: 'number', value: token.value };
    }
    if (token.type === 'func') {
      const fnName = consume('func').value;
      consume('lparen');
      const arg = parseExpressionInner();
      consume('rparen');
      return { type: 'func', name: fnName, arg };
    }
    if (token.type === 'lparen') {
      consume('lparen');
      const node = parseExpressionInner();
      consume('rparen');
      return node;
    }
    throw new Error('Unsupported graph expression. Keep it to standard maths functions and one variable.');
  }

  const ast = parseExpressionInner();
  if (index !== tokens.length) {
    throw new Error('Could not parse the whole expression. Something in there is behaving like a raccoon in a server room.');
  }
  return ast;
}

function tokenizeExpression(expr) {
  const source = String(expr || '')
    .trim()
    .replace(/^y\s*=\s*/i, '')
    .replace(/\s+/g, '');

  if (!source) throw new Error('Enter an expression first.');
  const tokens = [];
  let i = 0;

  while (i < source.length) {
    const ch = source[i];
    if (/\d|\./.test(ch)) {
      let j = i + 1;
      while (j < source.length && /[\d.]/.test(source[j])) j += 1;
      const num = Number(source.slice(i, j));
      if (!Number.isFinite(num)) throw new Error('Invalid number in graph expression.');
      tokens.push({ type: 'number', value: num });
      i = j;
      continue;
    }
    if (/[A-Za-z]/.test(ch)) {
      let j = i + 1;
      while (j < source.length && /[A-Za-z]/.test(source[j])) j += 1;
      const word = source.slice(i, j).toLowerCase();
      if (word === 'x') tokens.push({ type: 'variable' });
      else if (word === 'pi') tokens.push({ type: 'constant', value: Math.PI });
      else if (word === 'e') tokens.push({ type: 'constant', value: Math.E });
      else if (['sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'sqrt', 'abs', 'log', 'ln', 'exp', 'sec', 'csc', 'cot'].includes(word)) tokens.push({ type: 'func', value: word });
      else throw new Error(`Unsupported token: ${word}`);
      i = j;
      continue;
    }
    if ('+-*/^'.includes(ch)) {
      tokens.push({ type: 'op', value: ch });
      i += 1;
      continue;
    }
    if (ch === '(') {
      tokens.push({ type: 'lparen' });
      i += 1;
      continue;
    }
    if (ch === ')') {
      tokens.push({ type: 'rparen' });
      i += 1;
      continue;
    }
    throw new Error(`Unsupported character: ${ch}`);
  }

  return tokens;
}

function insertImplicitMultiplication(tokens) {
  const out = [];
  for (let i = 0; i < tokens.length; i += 1) {
    const current = tokens[i];
    const previous = out[out.length - 1];
    if (previous && needsImplicitMultiply(previous, current)) {
      out.push({ type: 'op', value: '*' });
    }
    out.push(current);
  }
  return out;
}

function needsImplicitMultiply(left, right) {
  const leftValue = ['number', 'variable', 'constant', 'rparen'].includes(left.type);
  const rightValue = ['number', 'variable', 'constant', 'func', 'lparen'].includes(right.type);
  if (left.type === 'func') return false;
  return leftValue && rightValue;
}

function evaluateAst(node, x) {
  switch (node.type) {
    case 'number':
      return node.value;
    case 'variable':
      return x;
    case 'unary': {
      const value = evaluateAst(node.value, x);
      return node.op === '-' ? -value : value;
    }
    case 'binary': {
      const left = evaluateAst(node.left, x);
      const right = evaluateAst(node.right, x);
      switch (node.op) {
        case '+': return left + right;
        case '-': return left - right;
        case '*': return left * right;
        case '/': return left / right;
        case '^': return Math.pow(left, right);
        default: throw new Error('Unsupported operator.');
      }
    }
    case 'func': {
      const value = evaluateAst(node.arg, x);
      switch (node.name) {
        case 'sin': return Math.sin(value);
        case 'cos': return Math.cos(value);
        case 'tan': return Math.tan(value);
        case 'asin': return Math.asin(value);
        case 'acos': return Math.acos(value);
        case 'atan': return Math.atan(value);
        case 'sqrt': return Math.sqrt(value);
        case 'abs': return Math.abs(value);
        case 'log': return Math.log10 ? Math.log10(value) : Math.log(value) / Math.LN10;
        case 'ln': return Math.log(value);
        case 'exp': return Math.exp(value);
        case 'sec': return 1 / Math.cos(value);
        case 'csc': return 1 / Math.sin(value);
        case 'cot': return 1 / Math.tan(value);
        default: throw new Error('Unsupported function.');
      }
    }
    default:
      throw new Error('Bad AST node.');
  }
}

function createInlineGraphPreview(expr) {
  const wrap = document.createElement('div');
  wrap.className = 'inline-graph-preview';
  wrap.innerHTML = `<div class="inline-graph-head"><span>Detected graph: <code>${escapeHtml(expr)}</code></span><button type="button" class="inline-graph-btn">Open graph studio</button></div>`;
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 380;
  wrap.appendChild(canvas);
  wrap.querySelector('button').addEventListener('click', () => {
    graphExpression.value = expr;
    tryPlotGraph(expr, { switchView: true });
  });
  renderInlineGraph(canvas, expr);
  return wrap;
}

function renderInlineGraph(canvas, expr) {
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;
  const xMin = -10;
  const xMax = 10;
  const yMin = -10;
  const yMax = 10;
  const toX = (x) => ((x - xMin) / (xMax - xMin)) * width;
  const toY = (y) => height - ((y - yMin) / (yMax - yMin)) * height;

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = '#07101d';
  ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = '#173154';
  ctx.lineWidth = 1;
  drawGrid(ctx, width, height, xMin, xMax, yMin, yMax, toX, toY);
  drawAxes(ctx, width, height, toX, toY, xMin, xMax, yMin, yMax);

  let fn;
  try {
    fn = compileExpression(expr);
  } catch {
    return;
  }

  drawFunction(ctx, width, height, { fn, color: '#7ac6ff', label: expr }, toX, toY, xMin, xMax, yMin, yMax);
}

function parseGraphExpression(text) {
  const str = String(text || '').trim();
  if (!str) return '';
  const direct = str.match(/^\/graph\s+(.+)$/is);
  if (direct) return direct[1].trim();
  const graphIntent = str.match(/(?:graph|plot)\s+(?:the\s+function\s+)?(.+)/is);
  if (graphIntent && /x/.test(graphIntent[1])) {
    return graphIntent[1].trim().replace(/[.?!]\s*$/, '');
  }
  const yLines = str.split(/\n+/).filter((line) => /\by\s*=\s*.+x/i.test(line));
  if (yLines.length) return yLines.join('\n');
  return '';
}

function percentile(values, p) {
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.max(0, Math.floor(p * sorted.length)));
  return sorted[index];
}

function formatPoint(x, y) {
  return `(${formatNumber(x)}, ${formatNumber(y)})`;
}

function formatNumber(value) {
  if (!Number.isFinite(value)) return 'undefined';
  if (Math.abs(value) < 1e-8) return '0';
  const rounded = Math.abs(value) >= 1000 ? value.toFixed(2) : value.toFixed(4);
  return String(Number(rounded));
}

function dedupeNumbers(values, tolerance = 1e-4) {
  const sorted = [...values].sort((a, b) => a - b);
  const out = [];
  for (const value of sorted) {
    if (!out.length || Math.abs(out[out.length - 1] - value) > tolerance) out.push(value);
  }
  return out;
}

function roundForKey(value) {
  return Number.isFinite(value) ? value.toFixed(3) : 'nan';
}

function debounce(fn, wait) {
  let timeout = null;
  return (...args) => {
    window.clearTimeout(timeout);
    timeout = window.setTimeout(() => fn(...args), wait);
  };
}

function escapeHtml(str) {
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
