const FLOATING_MENU_ID = 'faraday-floating-menu';
const TOAST_ID = 'faraday-toast';
const DOCS_BAR_ID = 'faraday-docs-bar';

let floatingMenu;
let toast;
let docsBar;
let docsContextCache = { ts: 0, value: null };

init();

async function init() {
  createToast();
  const settings = await getSettingsSafe();
  if (settings.floatingMenuEnabled) createFloatingMenu();
  if (settings.docsAssistEnabled) maybeInitGoogleDocsBar();

  document.addEventListener('mouseup', debounce(handleSelectionChange, 30));
  document.addEventListener('keyup', debounce(handleSelectionChange, 30));
  window.addEventListener('scroll', () => hideFloatingMenu(), true);
}

function createFloatingMenu() {
  if (floatingMenu) return;
  floatingMenu = document.createElement('div');
  floatingMenu.id = FLOATING_MENU_ID;
  floatingMenu.innerHTML = `
    <button class="primary" data-action="explain">Explain</button>
    <button data-action="ask">Ask AI</button>
    <button data-action="cite">Cite</button>
    <button data-action="summarise">Summarise</button>
    <button data-action="rewrite">Rewrite</button>
    <button data-action="flashcards">Flashcards</button>
    <button data-action="save-notes">Save notes</button>
  `;
  floatingMenu.addEventListener('click', onFloatingMenuClick);
  document.documentElement.appendChild(floatingMenu);
}

function createToast() {
  toast = document.createElement('div');
  toast.id = TOAST_ID;
  document.documentElement.appendChild(toast);
}

function maybeInitGoogleDocsBar() {
  if (!location.hostname.includes('docs.google.com')) return;
  docsBar = document.createElement('div');
  docsBar.id = DOCS_BAR_ID;
  docsBar.innerHTML = `
    <span class="label">Faraday Docs</span>
    <button class="primary" data-docs-action="improve">Improve</button>
    <button data-docs-action="grammar">Grammar</button>
    <button data-docs-action="summary">Summarise</button>
    <button data-docs-action="citations">Citations</button>
  `;
  docsBar.addEventListener('click', onDocsBarClick);
  document.documentElement.appendChild(docsBar);

  const script = document.createElement('script');
  script.src = chrome.runtime.getURL('google-docs-bridge.js');
  script.async = false;
  document.documentElement.appendChild(script);
  script.remove();
}

function handleSelectionChange() {
  if (!floatingMenu) return;
  const selection = window.getSelection();
  const text = selection?.toString()?.trim();
  if (!text || text.length < 2) {
    hideFloatingMenu();
    return;
  }

  const range = selection.rangeCount ? selection.getRangeAt(0) : null;
  if (!range) return;
  const rect = range.getBoundingClientRect();
  floatingMenu.style.top = `${window.scrollY + rect.top - 46}px`;
  floatingMenu.style.left = `${Math.max(10, window.scrollX + rect.left)}px`;
  floatingMenu.style.display = 'flex';
}

function hideFloatingMenu() {
  if (floatingMenu) floatingMenu.style.display = 'none';
}

async function onFloatingMenuClick(event) {
  const action = event.target.closest('button')?.dataset?.action;
  if (!action) return;

  const selection = window.getSelection()?.toString()?.trim() || '';
  const pageContext = await buildPageContext();
  hideFloatingMenu();

  if (action === 'cite') {
    await createAndStoreCitation(pageContext);
    return;
  }

  if (action === 'ask') {
    await sendPanelAction({ kind: 'ask', selectionText: selection, pageContext });
    showToast('Selection sent to the side panel for follow-up questions. Miracles in motion.');
    return;
  }

  const kindMap = {
    explain: 'explain',
    summarise: 'summarise',
    rewrite: 'rewrite',
    flashcards: 'flashcards',
    'save-notes': 'notes'
  };

  await sendPanelAction({ kind: kindMap[action], selectionText: selection, pageContext });
  showToast('Opening Faraday with your selection. Humanity has finally weaponised highlighting.');
}

async function onDocsBarClick(event) {
  const action = event.target.closest('button')?.dataset?.docsAction;
  if (!action) return;
  const docsContext = await getGoogleDocsContext({ forceRefresh: true });
  const docsText = docsContext.text.slice(0, 20000);
  const pageContext = await buildPageContext(docsContext);

  if (action === 'citations') {
    await createAndStoreCitation(pageContext);
    return;
  }

  const promptMap = {
    improve: 'Improve this Google Docs draft for clarity, flow, structure, and tone. Return: 1) a revised version, 2) a bullet list of key edits.',
    grammar: 'Proofread this Google Docs draft. Return: 1) a corrected version, 2) a concise explanation of recurring issues.',
    summary: 'Summarise this Google Docs draft into a clean outline with headings and bullet points.'
  };

  await sendPanelAction({
    kind: 'custom',
    pageContext,
    selectionText: docsText,
    prompt: `${promptMap[action]}\n\nDocument text:\n${docsText}`
  });

  showToast(`Docs request sent using ${docsContext.source}. Less haunted than raw DOM scraping, which is not a high bar.`);
}

async function sendPanelAction(action) {
  return chrome.runtime.sendMessage({ type: 'QUEUE_PANEL_ACTION', action }).catch(() => null);
}

async function buildPageContext(preloadedDocsContext = null) {
  const metadata = window.FaradayCitations?.extractPageMetadata?.() || fallbackMetadata();
  const selection = window.getSelection()?.toString()?.trim() || '';
  const isGoogleDocs = location.hostname.includes('docs.google.com');
  const docsContext = isGoogleDocs ? (preloadedDocsContext || await getGoogleDocsContext()) : null;
  const pageText = isGoogleDocs ? docsContext.text : extractVisibleText();
  const headings = isGoogleDocs
    ? (docsContext.headings || [])
    : Array.from(document.querySelectorAll('h1, h2, h3')).slice(0, 18).map((el) => el.textContent.trim()).filter(Boolean);
  const lists = isGoogleDocs
    ? (docsContext.lists || [])
    : Array.from(document.querySelectorAll('ul, ol')).slice(0, 8).map((el) => el.innerText.trim().slice(0, 400));
  const tables = isGoogleDocs ? (docsContext.tables || []) : Array.from(document.querySelectorAll('table')).slice(0, 3).map(extractTable);

  return {
    url: location.href,
    title: docsContext?.title || document.title || '',
    metadata: {
      ...metadata,
      title: docsContext?.title || metadata.title,
      googleDocId: docsContext?.documentId || metadata.googleDocId || ''
    },
    selection: selection || docsContext?.selection || '',
    headings,
    lists,
    tables,
    pageText: pageText.slice(0, 24000),
    isGoogleDocs,
    docsContext: docsContext
      ? {
          source: docsContext.source,
          documentId: docsContext.documentId,
          exportedAt: docsContext.exportedAt,
          title: docsContext.title
        }
      : null
  };
}

function extractVisibleText() {
  const article = document.querySelector('article, main');
  const root = article || document.body;
  if (!root) return '';
  return (root.innerText || '')
    .replace(/\u0000/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

function extractTable(table) {
  try {
    const rows = Array.from(table.querySelectorAll('tr')).slice(0, 8).map((row) =>
      Array.from(row.querySelectorAll('th, td')).slice(0, 6).map((cell) => cell.innerText.trim())
    );
    return rows;
  } catch {
    return [];
  }
}

function extractGoogleDocId() {
  const match = location.href.match(/\/document\/d\/([a-zA-Z0-9_-]+)/);
  return match?.[1] || '';
}

function cleanDocsText(text) {
  return String(text || '')
    .replace(/\r/g, '')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/\u00A0/g, ' ')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function scoreDocsText(text) {
  const clean = cleanDocsText(text);
  if (!clean) return -Infinity;
  const chars = clean.length;
  const alpha = (clean.match(/[A-Za-z]/g) || []).length;
  const digits = (clean.match(/\d/g) || []).length;
  const words = clean.match(/[A-Za-z][A-Za-z'-]{1,}/g) || [];
  const lines = clean.split('\n').filter(Boolean);
  const weirdNumeric = lines.filter((line) => /^\d+(?:\s+\d+){1,}$/.test(line)).length;
  let score = chars + alpha * 3 + new Set(words.map((w) => w.toLowerCase())).size * 5;
  score -= digits * 2 + weirdNumeric * 250;
  if (alpha < 50) score -= 500;
  return score;
}

async function fetchGoogleDocsExportText(documentId) {
  if (!documentId) return '';
  const url = `${location.origin}/document/d/${documentId}/export?format=txt`;
  const res = await fetch(url, {
    method: 'GET',
    credentials: 'include',
    cache: 'no-store'
  });
  if (!res.ok) throw new Error(`Docs export failed (${res.status})`);
  return cleanDocsText(await res.text());
}

async function fetchCompanionDocSnapshot(documentId, settings) {
  const endpoint = (settings?.docsCompanionUrl || '').trim();
  if (!endpoint || !documentId) return null;

  try {
    const response = await chrome.runtime.sendMessage({
      type: 'FETCH_DOCS_COMPANION',
      endpoint,
      documentId
    });

    if (!response?.ok || !response?.data) {
      throw new Error(response?.error || 'Background companion fetch failed.');
    }

    const data = response.data;
    const usableText = cleanDocsText(data?.text || '');
    if (!usableText) {
      throw new Error('Companion returned no readable text.');
    }

    return {
      text: usableText,
      title: data.title || '',
      headings: Array.isArray(data.headings) ? data.headings : [],
      lists: Array.isArray(data.lists) ? data.lists : [],
      tables: Array.isArray(data.tables) ? data.tables : [],
      source: 'Apps Script companion',
      exportedAt: data.exportedAt || new Date().toISOString(),
      selection: cleanDocsText(data.selection || ''),
      diagnostics: response.diagnostics || null
    };
  } catch (error) {
    throw new Error(error?.message || 'Failed to fetch the Google Docs companion.');
  }
}

async function getGoogleDocsContext({ forceRefresh = false } = {}) {
  const now = Date.now();
  if (!forceRefresh && docsContextCache.value && now - docsContextCache.ts < 2500) {
    return docsContextCache.value;
  }

  const settings = await getSettingsSafe();
  const documentId = extractGoogleDocId();
  const bridgeSelection = cleanDocsText(window.SeamlessAIDocsBridge?.getSelectedText?.() || window.getSelection()?.toString() || '');
  const bridgeTitle = cleanDocsText(window.SeamlessAIDocsBridge?.getDocumentTitle?.() || document.title.replace(/\s*-\s*Google Docs\s*$/i, ''));

  if (!documentId) {
    throw new Error('Could not detect a Google Doc ID from the current URL.');
  }

  if (!(settings?.docsCompanionUrl || '').trim()) {
    throw new Error('Google Docs companion URL is not configured. Open Faraday Settings and paste your Apps Script web app URL.');
  }

  const companion = await fetchCompanionDocSnapshot(documentId, settings);
  const cleanText = cleanDocsText(companion?.text || '');
  if (!cleanText) {
    throw new Error('The Google Docs companion returned no readable text. Check the web app deployment and permissions.');
  }

  const value = {
    documentId,
    text: cleanText,
    title: companion.title || bridgeTitle,
    headings: companion.headings || [],
    lists: companion.lists || [],
    tables: companion.tables || [],
    source: 'Apps Script companion',
    exportedAt: companion.exportedAt || new Date().toISOString(),
    selection: companion.selection || bridgeSelection
  };

  docsContextCache = { ts: now, value };
  return value;
}

function fallbackMetadata() {
  return {
    title: document.title?.trim() || 'Untitled page',
    url: location.href,
    siteName: location.hostname.replace(/^www\./, ''),
    author: '',
    publishedAt: '',
    accessedAt: new Date().toISOString()
  };
}

async function createAndStoreCitation(pageContext) {
  const settings = await getSettingsSafe();
  const style = settings.citationStyle || 'APA';
  const citation = window.FaradayCitations?.generateCitation?.(style, pageContext.metadata) || `${pageContext.title} - ${pageContext.url}`;
  await navigator.clipboard.writeText(citation).catch(() => null);
  await chrome.runtime.sendMessage({
    type: 'STORE_CITATION',
    entry: {
      style,
      citation,
      url: pageContext.url,
      title: pageContext.title,
      ts: Date.now()
    }
  }).catch(() => null);
  showToast(`${style} citation copied and saved.`);
}

function showToast(message) {
  if (!toast) return;
  toast.textContent = message;
  toast.style.display = 'block';
  window.clearTimeout(showToast._timer);
  showToast._timer = window.setTimeout(() => {
    toast.style.display = 'none';
  }, 2600);
}

async function getSettingsSafe() {
  try {
    const response = await chrome.runtime.sendMessage({ type: 'GET_SETTINGS' });
    return response?.settings || {};
  } catch {
    return {};
  }
}

function debounce(fn, wait) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  (async () => {
    if (message.type === 'GET_PAGE_CONTEXT') {
      sendResponse(await buildPageContext());
      return;
    }

    if (message.type === 'RUN_CONTEXT_ACTION') {
      const selection = message.selectionText || window.getSelection()?.toString()?.trim() || '';
      const pageContext = await buildPageContext();

      if (message.action === 'faraday-cite-selection') {
        await createAndStoreCitation(pageContext);
        sendResponse({ ok: true });
        return;
      }

      const actionMap = {
        'faraday-ask-ai': 'ask',
        'faraday-explain-selection': 'explain',
        'faraday-summarise-selection': 'summarise',
        'faraday-generate-flashcards': 'flashcards',
        'faraday-save-notes': 'notes'
      };

      await sendPanelAction({ kind: actionMap[message.action], selectionText: selection, pageContext });
      showToast('Selection sent to Faraday. The panel should now do its job, which is rare and beautiful.');
      sendResponse({ ok: true });
    }
  })().catch((error) => {
    sendResponse({ ok: false, error: error?.message || 'Unknown error' });
  });

  return true;
});
