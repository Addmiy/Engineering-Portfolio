const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

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

export function extractPageMetadata() {
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

export function generateCitation(style = 'APA', metadata = extractPageMetadata()) {
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
