(() => {
  function normalizeLine(text) {
    return String(text || '')
      .replace(/[\u200B-\u200D\uFEFF]/g, '')
      .replace(/\u00A0/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function normalizeBlock(text) {
    return String(text || '')
      .split(/\n+/)
      .map(normalizeLine)
      .filter(Boolean)
      .join('\n')
      .trim();
  }

  function fromWordNodes() {
    const lineRoots = Array.from(document.querySelectorAll('.kix-lineview'));
    const lines = lineRoots.map((line) => {
      const parts = Array.from(line.querySelectorAll('.kix-wordhtmlgenerator-word-node, .kix-lineview-text-block, .goog-inline-block'))
        .map((node) => normalizeLine(node.textContent || ''))
        .filter(Boolean);
      return parts.join(' ').replace(/\s+([,.;!?])/g, '$1').trim();
    }).filter(Boolean);
    return lines.join('\n');
  }

  function fromParagraphs() {
    const lines = Array.from(document.querySelectorAll('[role="paragraph"], .kix-paragraphrenderer, .kix-paragraphrenderer-content'))
      .map((node) => normalizeLine(node.textContent || node.innerText || ''))
      .filter(Boolean);
    return lines.join('\n');
  }

  function fromCanvasA11y() {
    const candidates = [
      '[aria-label="Document content"]',
      '[aria-label^="Editing"]',
      '.kix-appview-editor',
      '.docs-texteventtarget-iframe'
    ];
    const parts = [];
    for (const selector of candidates) {
      const el = document.querySelector(selector);
      const text = normalizeBlock(el?.innerText || el?.textContent || '');
      if (text) parts.push(text);
    }
    return parts.sort((a, b) => b.length - a.length)[0] || '';
  }

  function fromEditorText() {
    const root = document.querySelector('.kix-appview-editor, .docs-editor, #docs-editor');
    return normalizeBlock(root?.innerText || root?.textContent || '');
  }

  function fromBody() {
    return normalizeBlock(document.body?.innerText || document.body?.textContent || '');
  }

  function scoreCandidate(text) {
    const clean = normalizeBlock(text);
    if (!clean) return -Infinity;
    const chars = clean.length;
    const letters = (clean.match(/[A-Za-z]/g) || []).length;
    const digits = (clean.match(/\d/g) || []).length;
    const lines = clean.split('\n');
    const avgLineLength = chars / Math.max(lines.length, 1);
    const repeatedNumericLines = lines.filter((line) => /^\d+(?:\s+\d+){1,}$/.test(line)).length;
    const numericRatio = digits / Math.max(chars, 1);
    const alphaRatio = letters / Math.max(chars, 1);
    const uniqueWords = new Set(clean.toLowerCase().match(/[a-z]{3,}/g) || []).size;

    let score = 0;
    score += Math.min(chars, 12000) * 0.05;
    score += letters * 0.8;
    score += uniqueWords * 4;
    score += Math.min(avgLineLength, 120);
    score -= digits * 0.5;
    score -= repeatedNumericLines * 200;
    if (numericRatio > 0.22 && alphaRatio < 0.35) score -= 800;
    if (letters < 40) score -= 300;
    return score;
  }

  window.SeamlessAIDocsBridge = {
    getLikelyDocumentText() {
      const variants = [
        fromWordNodes(),
        fromParagraphs(),
        fromCanvasA11y(),
        fromEditorText(),
        fromBody()
      ]
        .map((text) => ({ text: normalizeBlock(text), score: scoreCandidate(text) }))
        .filter((item) => item.text)
        .sort((a, b) => b.score - a.score || b.text.length - a.text.length);
      return variants[0]?.text || '';
    }
  };
})();
