(() => {
  const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  function text(el) {
    return el?.textContent?.trim() || '';
  }

  function firstMeta(selectors) {
    for (const selector of selectors) {
      const el = document.querySelector(selector);
      const content = el?.getAttribute?.('content')?.trim();
      if (content) return content;
    }
    return '';
  }

  function parseDate(raw) {
    if (!raw) return null;
    const date = new Date(raw);
    return Number.isNaN(date.getTime()) ? null : date;
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
    const parts = cleaned.split(/\s+/).filter(Boolean);
    const last = parts.at(-1) || '';
    const initials = parts.slice(0, -1).map((part) => `${part[0] || ''}.`).join(' ');
    return { full: cleaned, last, initials };
  }

  function extractPageMetadata() {
    const title = document.title?.trim() || 'Untitled page';
    const url = location.href;
    const siteName =
      firstMeta([
        'meta[property="og:site_name"]',
        'meta[name="application-name"]',
        'meta[property="og:site"]',
        'meta[name="twitter:site"]'
      ]) || location.hostname.replace(/^www\./, '');

    const author =
      firstMeta([
        'meta[name="author"]',
        'meta[property="article:author"]',
        'meta[name="citation_author"]'
      ]) ||
      text(document.querySelector('[rel="author"]')) ||
      '';

    const publishedAt =
      firstMeta([
        'meta[property="article:published_time"]',
        'meta[name="date"]',
        'meta[name="citation_publication_date"]',
        'meta[property="og:updated_time"]'
      ]) ||
      '';

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
    const url = metadata.url || location.href;

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

  window.FaradayCitations = { extractPageMetadata, generateCitation };
})();
