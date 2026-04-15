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
const composer = document.getElementById('composer');
const chatInput = document.getElementById('chatInput');
const fileInput = document.getElementById('fileInput');
const fileList = document.getElementById('fileList');
const citationsList = document.getElementById('citationsList');
const copyCitationsBtn = document.getElementById('copyCitationsBtn');
const graphCard = document.getElementById('graphCard');
const graphExpression = document.getElementById('graphExpression');
const plotGraphBtn = document.getElementById('plotGraphBtn');
const closeGraphBtn = document.getElementById('closeGraphBtn');
const expandGraphBtn = document.getElementById('expandGraphBtn');
const graphCanvas = document.getElementById('graphCanvas');
const graphMeta = document.getElementById('graphMeta');

let settings = null;
let models = [];
let currentPageContext = null;
let sessionFiles = [];
let lastHandledActionTs = 0;
let graphState = {
  expr: '',
  xMin: -10,
  xMax: 10,
  yMin: -10,
  yMax: 10,
  dragging: false,
  lastX: 0,
  lastY: 0,
  mouseX: null,
  mouseY: null,
  expanded: false
};

init();

async function init() {
  const response = await chrome.runtime.sendMessage({ type: 'GET_SETTINGS' });
  settings = response.settings;
  models = response.models;
  sessionFiles = settings.sessionFiles || [];

  renderModels();
  renderPersonalities();
  renderChat(settings.chatHistory || []);
  renderFiles();
  renderCitations(settings.citationsNotebook || []);
  await refreshPageContext();
  await consumePendingAction();
  attachGraphInteractions();
}

async function consumePendingAction() {
  const response = await chrome.runtime.sendMessage({ type: 'CONSUME_PENDING_PANEL_ACTION' });
  if (response?.ok && response.action) {
    await handlePanelAction(response.action);
  }
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
    chatLog.innerHTML = '<div class="message assistant"><div class="message-content"><p>No conversation yet. A blank panel, the preferred habitat of unfinished ambition.</p></div></div>';
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

  const response = await chrome.runtime.sendMessage({ type: 'GET_ACTIVE_PAGE_CONTEXT' });
  if (!response.ok) {
    pageContextMeta.textContent = response.error || 'Failed to read page context.';
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

modelSelect.addEventListener('change', async () => {
  settings = (await chrome.runtime.sendMessage({ type: 'SAVE_SETTINGS', partial: { selectedModel: modelSelect.value } })).settings;
  updateModelMeta();
});

personalitySelect.addEventListener('change', async () => {
  settings = (await chrome.runtime.sendMessage({ type: 'SAVE_SETTINGS', partial: { activePersonalityId: personalitySelect.value } })).settings;
});

refreshContextBtn.addEventListener('click', () => refreshPageContext());

clearContextBtn.addEventListener('click', async () => {
  currentPageContext = null;
  pageContextMeta.textContent = 'Page context cleared.';
  settings = (await chrome.runtime.sendMessage({ type: 'SAVE_SETTINGS', partial: { lastPageContext: null } })).settings;
});

clearChatBtn.addEventListener('click', async () => {
  await chrome.runtime.sendMessage({ type: 'CLEAR_CHAT_HISTORY' });
  renderChat([]);
});

openFullscreenBtn?.addEventListener('click', async () => {
  await chrome.runtime.sendMessage({ type: 'OPEN_FULLSCREEN_APP' });
});

composer.addEventListener('submit', async (event) => {
  event.preventDefault();
  const prompt = chatInput.value.trim();
  if (!prompt) return;

  const graphExpr = parseGraphExpression(prompt);
  if (graphExpr) {
    graphExpression.value = graphExpr;
    openGraph(graphExpr, false);
  }

  await sendPrompt(prompt);
  chatInput.value = '';
});

chatInput.addEventListener('keydown', async (event) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    composer.requestSubmit();
  }
});

document.querySelectorAll('[data-quick]').forEach((button) => {
  button.addEventListener('click', async () => {
    const kind = button.dataset.quick;

    if (kind === 'citation') {
      const citations = settings.citationsNotebook || [];
      if (currentPageContext?.metadata) {
        const style = settings.citationStyle || 'APA';
        const citation = buildCitationFromMetadata(style, currentPageContext.metadata);
        await navigator.clipboard.writeText(citation).catch(() => null);
        await chrome.runtime.sendMessage({
          type: 'STORE_CITATION',
          entry: { style, citation, title: currentPageContext.title, url: currentPageContext.url, ts: Date.now() }
        });
        settings = (await chrome.runtime.sendMessage({ type: 'GET_SETTINGS' })).settings;
        renderCitations(settings.citationsNotebook || citations);
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

    await sendPrompt(quickPrompts[kind]);
  });
});

fileInput.addEventListener('change', async (event) => {
  const files = Array.from(event.target.files || []);
  if (!files.length) return;
  const payloads = await Promise.all(files.map(readFilePayload));
  sessionFiles = [...sessionFiles, ...payloads].slice(-8);
  settings = (await chrome.runtime.sendMessage({ type: 'SAVE_SETTINGS', partial: { sessionFiles } })).settings;
  renderFiles();
  event.target.value = '';
});

fileList.addEventListener('click', async (event) => {
  const index = event.target.closest('[data-remove-file]')?.dataset?.removeFile;
  if (index == null) return;
  sessionFiles.splice(Number(index), 1);
  settings = (await chrome.runtime.sendMessage({ type: 'SAVE_SETTINGS', partial: { sessionFiles } })).settings;
  renderFiles();
});

copyCitationsBtn.addEventListener('click', async () => {
  const citations = (settings.citationsNotebook || []).map((item) => item.citation).join('\n\n');
  if (!citations) return;
  await navigator.clipboard.writeText(citations).catch(() => null);
});

plotGraphBtn.addEventListener('click', () => openGraph(graphExpression.value.trim(), graphState.expanded));
closeGraphBtn.addEventListener('click', closeGraph);
expandGraphBtn.addEventListener('click', () => setGraphExpanded(!graphState.expanded));

graphExpression.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    event.preventDefault();
    openGraph(graphExpression.value.trim(), graphState.expanded);
  }
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
    chatInput.value = promptMap.ask;
    chatInput.focus();
    chatInput.setSelectionRange(chatInput.value.length, chatInput.value.length);
    return;
  }

  const prompt = action.prompt || promptMap[action.kind];
  if (prompt) {
    await sendPrompt(prompt, { selectionText: selection, pageContext: currentPageContext });
  }
}

async function sendPrompt(prompt, extra = {}) {
  appendMessage({ role: 'user', text: prompt });
  const thinking = appendMessage({ role: 'assistant', text: 'Thinking… because apparently that is now a user experience feature.', pending: true });

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
  if (outputGraphExpr && !graphState.expr) {
    graphExpression.value = outputGraphExpr;
    openGraph(outputGraphExpr, false);
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
    html += `<p>${inlineFormat(paragraph.join(' '))}</p>`;
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

    closeLists();
    paragraph.push(trimmed);
  }

  flushParagraph();
  closeLists();
  if (inCode) html += '</code></pre>';
  return html;
}

function inlineFormat(text) {
  let safe = escapeHtml(text);
  safe = safe.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  safe = safe.replace(/`([^`]+)`/g, '<code>$1</code>');
  return safe;
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

function openGraph(expr, expanded = false) {
  if (!expr) return;
  graphState.expr = expr;
  graphExpression.value = expr;
  graphCard.classList.remove('hidden');
  setGraphExpanded(expanded);
  renderGraph();
}

function closeGraph() {
  graphCard.classList.add('hidden');
  setGraphExpanded(false);
  graphState.expr = '';
}

function setGraphExpanded(expanded) {
  graphState.expanded = Boolean(expanded);
  document.body.classList.toggle('graph-expanded', graphState.expanded);
  graphCard.classList.toggle('expanded', graphState.expanded);
  expandGraphBtn.textContent = graphState.expanded ? 'Collapse' : 'Expand';
  requestAnimationFrame(renderGraph);
}

function attachGraphInteractions() {
  graphCanvas.addEventListener('wheel', (event) => {
    if (graphCard.classList.contains('hidden')) return;
    event.preventDefault();
    const zoom = event.deltaY < 0 ? 0.88 : 1.12;
    const bounds = graphCanvas.getBoundingClientRect();
    const px = event.clientX - bounds.left;
    const py = event.clientY - bounds.top;
    const x = canvasToMathX(px, graphCanvas.width);
    const y = canvasToMathY(py, graphCanvas.height);

    graphState.xMin = x + (graphState.xMin - x) * zoom;
    graphState.xMax = x + (graphState.xMax - x) * zoom;
    graphState.yMin = y + (graphState.yMin - y) * zoom;
    graphState.yMax = y + (graphState.yMax - y) * zoom;
    renderGraph();
  }, { passive: false });

  graphCanvas.addEventListener('mousedown', (event) => {
    graphState.dragging = true;
    graphState.lastX = event.clientX;
    graphState.lastY = event.clientY;
  });

  window.addEventListener('mouseup', () => {
    graphState.dragging = false;
  });

  window.addEventListener('mousemove', (event) => {
    if (graphCard.classList.contains('hidden')) return;
    const bounds = graphCanvas.getBoundingClientRect();
    graphState.mouseX = event.clientX >= bounds.left && event.clientX <= bounds.right ? event.clientX - bounds.left : null;
    graphState.mouseY = event.clientY >= bounds.top && event.clientY <= bounds.bottom ? event.clientY - bounds.top : null;

    if (graphState.dragging) {
      const dx = event.clientX - graphState.lastX;
      const dy = event.clientY - graphState.lastY;
      const xRange = graphState.xMax - graphState.xMin;
      const yRange = graphState.yMax - graphState.yMin;
      const xShift = -(dx / graphCanvas.width) * xRange;
      const yShift = (dy / graphCanvas.height) * yRange;
      graphState.xMin += xShift;
      graphState.xMax += xShift;
      graphState.yMin += yShift;
      graphState.yMax += yShift;
      graphState.lastX = event.clientX;
      graphState.lastY = event.clientY;
    }
    renderGraph();
  });
}

function renderGraph() {
  if (graphCard.classList.contains('hidden')) return;
  const bounds = graphCanvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  graphCanvas.width = Math.max(700, Math.floor(bounds.width * dpr));
  graphCanvas.height = Math.max(420, Math.floor(bounds.height * dpr));

  const ctx = graphCanvas.getContext('2d');
  const width = graphCanvas.width;
  const height = graphCanvas.height;
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = '#07101d';
  ctx.fillRect(0, 0, width, height);

  const { xMin, xMax, yMin, yMax } = graphState;
  const toX = (x) => ((x - xMin) / (xMax - xMin)) * width;
  const toY = (y) => height - ((y - yMin) / (yMax - yMin)) * height;

  ctx.strokeStyle = '#173154';
  ctx.lineWidth = 1;
  drawGrid(ctx, width, height, xMin, xMax, yMin, yMax, toX, toY);

  ctx.strokeStyle = '#6e90bf';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(toX(0), 0);
  ctx.lineTo(toX(0), height);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0, toY(0));
  ctx.lineTo(width, toY(0));
  ctx.stroke();

  let fn;
  try {
    fn = compileExpression(graphState.expr);
  } catch (error) {
    graphMeta.textContent = error.message;
    return;
  }

  ctx.strokeStyle = '#7ac6ff';
  ctx.lineWidth = 2.3;
  let started = false;
  for (let px = 0; px < width; px++) {
    const x = xMin + (px / width) * (xMax - xMin);
    let y;
    try {
      y = fn(x);
    } catch {
      started = false;
      continue;
    }
    if (!Number.isFinite(y) || Math.abs(y) > 1e6) {
      started = false;
      continue;
    }
    const py = toY(y);
    if (!started) {
      ctx.beginPath();
      ctx.moveTo(px, py);
      started = true;
    } else {
      ctx.lineTo(px, py);
    }
  }
  ctx.stroke();

  if (graphState.mouseX != null && graphState.mouseY != null) {
    const mouseMathX = canvasToMathX(graphState.mouseX, width);
    try {
      const mouseMathY = fn(mouseMathX);
      if (Number.isFinite(mouseMathY) && Math.abs(mouseMathY) < 1e6) {
        const px = toX(mouseMathX);
        const py = toY(mouseMathY);
        ctx.fillStyle = '#87e29b';
        ctx.beginPath();
        ctx.arc(px, py, 6, 0, Math.PI * 2);
        ctx.fill();
        graphMeta.textContent = `${graphState.expr} • x ≈ ${mouseMathX.toFixed(3)} • y ≈ ${mouseMathY.toFixed(3)} • drag to pan • scroll to zoom`;
        return;
      }
    } catch {
      // ignore hover failures
    }
  }

  graphMeta.textContent = `${graphState.expr} • x:[${xMin.toFixed(2)}, ${xMax.toFixed(2)}] • y:[${yMin.toFixed(2)}, ${yMax.toFixed(2)}]`;
}

function drawGrid(ctx, width, height, xMin, xMax, yMin, yMax, toX, toY) {
  const xStep = niceStep((xMax - xMin) / 8);
  const yStep = niceStep((yMax - yMin) / 8);

  for (let x = Math.ceil(xMin / xStep) * xStep; x <= xMax; x += xStep) {
    ctx.beginPath();
    ctx.moveTo(toX(x), 0);
    ctx.lineTo(toX(x), height);
    ctx.stroke();
  }
  for (let y = Math.ceil(yMin / yStep) * yStep; y <= yMax; y += yStep) {
    ctx.beginPath();
    ctx.moveTo(0, toY(y));
    ctx.lineTo(width, toY(y));
    ctx.stroke();
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

  function parseExpression() {
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
      const arg = parseExpression();
      consume('rparen');
      return { type: 'func', name: fnName, arg };
    }
    if (token.type === 'lparen') {
      consume('lparen');
      const node = parseExpression();
      consume('rparen');
      return node;
    }
    throw new Error('Unsupported graph expression. Keep it to standard maths functions and one variable.');
  }

  const ast = parseExpression();
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
        case 'log': return Math.log(value);
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
  wrap.innerHTML = `<div class="inline-graph-head"><span>Detected graph: <code>${escapeHtml(expr)}</code></span><button type="button" class="inline-graph-btn">Open interactive graph</button></div>`;
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 380;
  wrap.appendChild(canvas);
  wrap.querySelector('button').addEventListener('click', () => {
    graphExpression.value = expr;
    openGraph(expr, false);
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
  ctx.strokeStyle = '#6e90bf';
  ctx.beginPath();
  ctx.moveTo(toX(0), 0);
  ctx.lineTo(toX(0), height);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0, toY(0));
  ctx.lineTo(width, toY(0));
  ctx.stroke();

  let fn;
  try {
    fn = compileExpression(expr);
  } catch {
    return;
  }

  ctx.strokeStyle = '#7ac6ff';
  ctx.lineWidth = 2.2;
  let drawing = false;
  for (let px = 0; px < width; px += 1) {
    const x = xMin + (px / width) * (xMax - xMin);
    let y;
    try {
      y = fn(x);
    } catch {
      drawing = false;
      continue;
    }
    if (!Number.isFinite(y) || Math.abs(y) > 1e6) {
      drawing = false;
      continue;
    }
    const py = toY(y);
    if (!drawing) {
      ctx.beginPath();
      ctx.moveTo(px, py);
      drawing = true;
    } else {
      ctx.lineTo(px, py);
    }
  }
  ctx.stroke();
}

function parseGraphExpression(text) {
  const str = String(text || '').trim();
  if (!str) return '';
  const direct = str.match(/^\/graph\s+(.+)$/i);
  if (direct) return direct[1].trim();
  const graphIntent = str.match(/(?:graph|plot)\s+(?:the\s+function\s+)?(.+)/i);
  if (graphIntent && /x/.test(graphIntent[1])) {
    return graphIntent[1].trim().replace(/[.?!]\s*$/, '');
  }
  const yEq = str.match(/\by\s*=\s*([^\n]+)/i);
  if (yEq && /x/.test(yEq[1])) {
    return yEq[0].trim();
  }
  return '';
}

function escapeHtml(str) {
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
