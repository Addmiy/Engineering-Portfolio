const FLOATING_MENU_ID = 'faraday-floating-menu';
const TOAST_ID = 'faraday-toast';
const DOCS_BAR_ID = 'faraday-docs-bar';

let floatingMenu;
let toast;
let docsBar;

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
  const pageContext = buildPageContext();
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
  const docsText = getGoogleDocsText().slice(0, 20000);
  const pageContext = buildPageContext();

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

  showToast('Docs request sent to the side panel. Google Docs still behaves like a haunted spreadsheet, but this should help.');
}

async function sendPanelAction(action) {
  return chrome.runtime.sendMessage({ type: 'QUEUE_PANEL_ACTION', action }).catch(() => null);
}

function buildPageContext() {
  const metadata = window.FaradayCitations?.extractPageMetadata?.() || fallbackMetadata();
  const selection = window.getSelection()?.toString()?.trim() || '';
  const pageText = location.hostname.includes('docs.google.com') ? getGoogleDocsText() : extractVisibleText();
  const headings = Array.from(document.querySelectorAll('h1, h2, h3')).slice(0, 18).map((el) => el.textContent.trim()).filter(Boolean);
  const lists = Array.from(document.querySelectorAll('ul, ol')).slice(0, 8).map((el) => el.innerText.trim().slice(0, 400));
  const tables = Array.from(document.querySelectorAll('table')).slice(0, 3).map(extractTable);

  return {
    url: location.href,
    title: document.title || '',
    metadata,
    selection,
    headings,
    lists,
    tables,
    pageText: pageText.slice(0, 24000),
    isGoogleDocs: location.hostname.includes('docs.google.com')
  };
}

function extractVisibleText() {
  const article = document.querySelector('article, main');
  const root = article || document.body;
  if (!root) return '';
  return (root.innerText || '').replace(/\s{2,}/g, ' ').trim();
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

function getGoogleDocsText() {
  const bridgeText = window.SeamlessAIDocsBridge?.getLikelyDocumentText?.();
  if (bridgeText?.trim()) return bridgeText.trim();

  const accessible = document.querySelector('[aria-label="Document content"]');
  if (accessible?.innerText?.trim()) return accessible.innerText.trim();

  const editor = document.querySelector('.kix-appview-editor');
  if (editor?.innerText?.trim()) return editor.innerText.trim();

  return extractVisibleText();
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
      sendResponse(buildPageContext());
      return;
    }

    if (message.type === 'RUN_CONTEXT_ACTION') {
      const selection = message.selectionText || window.getSelection()?.toString()?.trim() || '';
      const pageContext = buildPageContext();

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
