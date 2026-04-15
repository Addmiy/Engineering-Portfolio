const FLOATING_MENU_ID = 'seamless-ai-floating-menu';
const TOAST_ID = 'seamless-ai-toast';
const DOCS_BAR_ID = 'seamless-ai-docs-bar';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

let floatingMenu;
let toast;
let docsBar;
let lastSelectionText = '';
let lastSelectionRect = null;
let settingsCache = null;

init();

async function init() {
  settingsCache = await chrome.storage.local.get({
    floatingMenuEnabled: true,
    docsAssistEnabled: true
  });

  createFloatingMenu();
  createToast();

  if (settingsCache.docsAssistEnabled) {
    maybeInitGoogleDocsBar();
  }

  document.addEventListener('selectionchange', debounce(handleSelectionChange, 50));
  document.addEventListener('mouseup', debounce(handleSelectionChange, 30));
  document.addEventListener('keyup', debounce(handleSelectionChange, 30));
  window.addEventListener('scroll', () => hideFloatingMenu(), true);
  window.addEventListener('load', persistLatestPageContext, { once: true });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') persistLatestPageContext();
  });

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local') return;
    if (changes.floatingMenuEnabled) {
      settingsCache.floatingMenuEnabled = changes.floatingMenuEnabled.newValue;
      if (!settingsCache.floatingMenuEnabled) hideFloatingMenu();
    }
    if (changes.docsAssistEnabled) {
      settingsCache.docsAssistEnabled = changes.docsAssistEnabled.newValue;
      if (docsBar) docsBar.style.display = settingsCache.docsAssistEnabled ? 'flex' : 'none';
    }
  });

  persistLatestPageContext();
}

function createFloatingMenu() {
  floatingMenu = document.createElement('div');
  floatingMenu.id = FLOATING_MENU_ID;
  floatingMenu.innerHTML = `
    <button class="primary" data-action="explain">Explain</button>
    <button class="secondary" data-action="summarise">Summarise</button>
    <button class="secondary" data-action="cite">Cite</button>
    <button class="secondary" data-action="chat">Ask AI</button>
  `;
  const preserveSelection = (event) => event.preventDefault();
  floatingMenu.addEventListener('mousedown', preserveSelection);
  floatingMenu.addEventListener('pointerdown', preserveSelection);
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
    <button class="primary" data-docs-action="improve">Improve writing</button>
    <button class="secondary" data-docs-action="summarise">Summarise notes</button>
    <button class="secondary" data-docs-action="cite">Suggest citations</button>
  `;
  docsBar.addEventListener('click', onDocsBarClick);
  document.documentElement.appendChild(docsBar);
  docsBar.style.display = 'flex';

  injectDocsBridge();
}

function injectDocsBridge() {
  const script = document.createElement('script');
  script.src = chrome.runtime.getURL('google-docs-bridge.js');
  script.async = false;
  document.documentElement.appendChild(script);
  script.remove();
}

function handleSelectionChange() {
  if (!settingsCache?.floatingMenuEnabled) {
    hideFloatingMenu();
    return;
  }

  const selection = window.getSelection();
  const text = selection?.toString()?.trim();

  if (!text || text.length < 2 || selection.rangeCount === 0) {
    hideFloatingMenu();
    return;
  }

  const range = selection.getRangeAt(0);
  const rect = range.getBoundingClientRect();
  if (!rect || (!rect.width && !rect.height)) {
    hideFloatingMenu();
    return;
  }

  lastSelectionText = text;
  lastSelectionRect = rect;

  floatingMenu.style.top = `${window.scrollY + rect.top - 44}px`;
  floatingMenu.style.left = `${window.scrollX + rect.left}px`;
  floatingMenu.style.display = 'flex';
}

function hideFloatingMenu() {
  if (floatingMenu) floatingMenu.style.display = 'none';
}

async function onFloatingMenuClick(event) {
  const action = event.target.closest('button')?.dataset?.action;
  if (!action) return;

  const selection = lastSelectionText || window.getSelection()?.toString()?.trim() || '';
  const pageContext = buildPageContext();
  hideFloatingMenu();

  if (action === 'cite') {
    const citation = generateCitation('APA', pageContext.metadata);
    await navigator.clipboard.writeText(citation);
    showToast('APA citation copied to clipboard. Bureaucracy wins again.');
    return;
  }

  if (action === 'chat') {
    await chrome.runtime.sendMessage({ type: 'OPEN_SIDE_PANEL' });
    showToast('Side panel opened. Industrial-grade convenience achieved.');
    return;
  }

  const prompts = {
    explain: `Explain this selected text clearly:\n\n${selection}`,
    summarise: `Summarise this selected text into key points:\n\n${selection}`
  };

  const response = await chrome.runtime.sendMessage({
    type: 'AI_REQUEST',
    prompt: prompts[action],
    pageContext
  });

  if (!response?.ok) {
    showToast(response?.error || 'Something broke. Software remains software.');
    return;
  }

  await navigator.clipboard.writeText(response.output);
  showToast('Local AI response copied to clipboard.');
}

async function onDocsBarClick(event) {
  const action = event.target.closest('button')?.dataset?.docsAction;
  if (!action) return;

  const docsText = getGoogleDocsText().slice(0, 12000);
  const prompts = {
    improve: `Improve the clarity, structure, and tone of this Google Docs content. Return a polished revision and then a short list of key edits:\n\n${docsText}`,
    summarise: `Summarise these notes into a well-structured outline with headings and bullet points:\n\n${docsText}`,
    cite: `Based on this Google Docs content, suggest where citations are likely needed and what kinds of sources should support those claims:\n\n${docsText}`
  };

  const pageContext = buildPageContext();
  pageContext.googleDocText = docsText;

  const response = await chrome.runtime.sendMessage({
    type: 'AI_REQUEST',
    prompt: prompts[action],
    pageContext
  });

  if (!response?.ok) {
    showToast(response?.error || 'Docs assist failed. A classic.');
    return;
  }

  await navigator.clipboard.writeText(response.output);
  showToast('Google Docs assistance copied to clipboard.');
}

function buildPageContext() {
  const metadata = extractPageMetadata();
  const selection = lastSelectionText || window.getSelection()?.toString()?.trim() || '';
  const mainText = extractVisibleText();

  return {
    url: location.href,
    title: document.title,
    metadata,
    selection,
    pageText: mainText,
    isGoogleDocs: location.hostname.includes('docs.google.com')
  };
}

function extractVisibleText() {
  const root = document.querySelector('article, main, [role="main"]') || document.body;
  if (!root) return '';
  return (root.innerText || '')
    .replace(/\s{2,}/g, ' ')
    .trim()
    .slice(0, 12000);
}

function getGoogleDocsText() {
  const accessibleCanvas = document.querySelector('[aria-label="Document content"]');
  if (accessibleCanvas?.innerText?.trim()) return accessibleCanvas.innerText.trim();

  const editor = document.querySelector('.kix-appview-editor');
  if (editor?.innerText?.trim()) return editor.innerText.trim();

  if (window.SeamlessAIDocsBridge?.getLikelyDocumentText) {
    const bridged = window.SeamlessAIDocsBridge.getLikelyDocumentText();
    if (bridged?.trim()) return bridged.trim();
  }

  return extractVisibleText();
}

function text(el) {
  return el?.textContent?.trim() || '';
}

function firstContent(selectors) {
  for (const selector of selectors) {
    const el = document.querySelector(selector);
    const value = el?.getAttribute?.('content')?.trim();
    if (value) return value;
  }
  return '';
}

function parseDate(raw) {
  if (!raw) return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatDateParts(date) {
  if (!date) return { year: 'n.d.', month: '', day: '' };
  return {
    year: String(date.getFullYear()),
    month: MONTHS[date.getMonth()],
    day: String(date.getDate())
  };
}

function splitAuthor(authorRaw) {
  if (!authorRaw) return { full: '', last: '', initials: '' };
  const cleaned = authorRaw.replace(/^By\s+/i, '').trim();
  const parts = cleaned.split(/\s+/);
  const last = parts.at(-1) || '';
  const initials = parts.slice(0, -1).map((p) => `${p[0] || ''}.`).join(' ');
  return { full: cleaned, last, initials };
}

function extractPageMetadata() {
  const title = document.title?.trim() || 'Untitled page';
  const url = location.href;
  const siteName =
    firstContent([
      'meta[property="og:site_name"]',
      'meta[name="application-name"]'
    ]) || location.hostname.replace(/^www\./, '');

  const author =
    firstContent([
      'meta[name="author"]',
      'meta[property="article:author"]'
    ]) ||
    text(document.querySelector("[rel='author']")) ||
    '';

  const publishedAt =
    firstContent([
      'meta[property="article:published_time"]',
      'meta[name="date"]',
      'meta[name="citation_publication_date"]',
      'meta[property="og:updated_time"]'
    ]) || '';

  return {
    title,
    url,
    siteName,
    author,
    publishedAt,
    accessedAt: new Date().toISOString()
  };
}

function generateCitation(style = 'APA', metadata = extractPageMetadata()) {
  const publicationDate = parseDate(metadata.publishedAt);
  const accessDate = parseDate(metadata.accessedAt);
  const pub = formatDateParts(publicationDate);
  const acc = formatDateParts(accessDate);
  const author = splitAuthor(metadata.author);
  const title = metadata.title || 'Untitled page';
  const site = metadata.siteName || 'Website';
  const url = metadata.url;

  switch (String(style).toUpperCase()) {
    case 'MLA':
      return author.full
        ? `${author.last}, ${author.full.replace(author.last, '').trim()}. "${title}." ${site}, ${pub.day} ${pub.month} ${pub.year}, ${url}. Accessed ${acc.day} ${acc.month} ${acc.year}.`
        : `"${title}." ${site}, ${pub.day} ${pub.month} ${pub.year}, ${url}. Accessed ${acc.day} ${acc.month} ${acc.year}.`;
    case 'HARVARD':
      return author.full
        ? `${author.full} ${pub.year}, '${title}', ${site}, viewed ${acc.day} ${acc.month} ${acc.year}, <${url}>.`
        : `${site} ${pub.year}, '${title}', ${site}, viewed ${acc.day} ${acc.month} ${acc.year}, <${url}>.`;
    case 'CHICAGO':
      return author.full
        ? `${author.full}. "${title}." ${site}. Last modified ${pub.month} ${pub.day}, ${pub.year}. ${url}.`
        : `${site}. "${title}." Last modified ${pub.month} ${pub.day}, ${pub.year}. ${url}.`;
    case 'IEEE':
      return author.full
        ? `${author.full}, "${title}," ${site}. [Online]. Available: ${url}. [Accessed: ${acc.day}-${acc.month}-${acc.year}].`
        : `"${title}," ${site}. [Online]. Available: ${url}. [Accessed: ${acc.day}-${acc.month}-${acc.year}].`;
    case 'APA':
    default:
      return author.full
        ? `${author.last}, ${author.initials} (${pub.year}). ${title}. ${site}. ${url}`
        : `${site}. (${pub.year}). ${title}. ${url}`;
  }
}

async function persistLatestPageContext() {
  try {
    await chrome.runtime.sendMessage({
      type: 'SAVE_PAGE_CONTEXT',
      pageContext: buildPageContext()
    });
  } catch {
    // Ignore best-effort context caching.
  }
}

function showToast(message) {
  toast.textContent = message;
  toast.style.display = 'block';
  window.clearTimeout(showToast._timer);
  showToast._timer = window.setTimeout(() => {
    toast.style.display = 'none';
  }, 3000);
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
      const pageContext = buildPageContext();
      sendResponse(pageContext);
      return;
    }

    if (message.type === 'RUN_CONTEXT_ACTION') {
      const selection = message.selectionText || lastSelectionText || window.getSelection()?.toString()?.trim() || '';
      const pageContext = buildPageContext();

      if (message.action === 'ai-cite-selection') {
        const citation = generateCitation('APA', pageContext.metadata);
        await navigator.clipboard.writeText(citation);
        showToast('APA citation copied to clipboard.');
        sendResponse({ ok: true });
        return;
      }

      const promptMap = {
        'ai-explain-selection': `Explain this selected text in plain language:\n\n${selection}`,
        'ai-summarise-selection': `Summarise this selected text into short key points:\n\n${selection}`
      };

      const prompt = promptMap[message.action];
      if (!prompt) {
        sendResponse({ ok: false, error: 'Unknown context action.' });
        return;
      }

      const result = await chrome.runtime.sendMessage({
        type: 'AI_REQUEST',
        prompt,
        pageContext
      });

      if (result?.ok) {
        await navigator.clipboard.writeText(result.output);
        showToast('Local AI response copied to clipboard.');
      } else {
        showToast(result?.error || 'Request failed.');
      }

      sendResponse(result);
      return;
    }
  })().catch((error) => {
    console.error(error);
    sendResponse({ ok: false, error: error.message || 'Unknown error' });
  });

  return true;
});
