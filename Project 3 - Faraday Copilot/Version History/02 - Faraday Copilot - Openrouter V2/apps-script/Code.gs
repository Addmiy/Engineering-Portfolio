function doGet(e) {
  try {
    const action = String(e.parameter.action || 'snapshot');
    const documentId = String(e.parameter.documentId || '').trim();
    if (!documentId) return jsonOut({ ok: false, error: 'Missing documentId' });
    if (action !== 'snapshot') return jsonOut({ ok: false, error: 'Unsupported action' });
    return jsonOut({ ok: true, ...buildSnapshot(documentId) });
  } catch (error) {
    return jsonOut({ ok: false, error: error.message || String(error) });
  }
}

function buildSnapshot(documentId) {
  const doc = DocumentApp.openById(documentId);
  const body = doc.getBody();
  const paragraphs = body.getParagraphs();
  const listItems = body.getListItems();
  const text = body.getText();
  const headings = [];
  for (let i = 0; i < paragraphs.length; i += 1) {
    const p = paragraphs[i];
    const t = String(p.getText() || '').trim();
    if (!t) continue;
    if (String(p.getHeading()) !== 'NORMAL') headings.push(t);
  }
  const lists = listItems.map((item) => item.getText()).filter(Boolean).slice(0, 200);
  const tables = [];
  const numChildren = body.getNumChildren();
  for (let i = 0; i < numChildren; i += 1) {
    const child = body.getChild(i);
    if (child.getType() !== DocumentApp.ElementType.TABLE) continue;
    const table = child.asTable();
    const rows = [];
    for (let r = 0; r < Math.min(table.getNumRows(), 30); r += 1) {
      const row = table.getRow(r);
      const cells = [];
      for (let c = 0; c < Math.min(row.getNumCells(), 12); c += 1) cells.push(row.getCell(c).getText());
      rows.push(cells);
    }
    tables.push(rows);
  }
  return { title: doc.getName(), text, headings: headings.slice(0, 300), lists, tables, exportedAt: new Date().toISOString() };
}

function jsonOut(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
