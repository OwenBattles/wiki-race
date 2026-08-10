const axios = require('axios');
const cheerio = require('cheerio');

const WIKIPEDIA_API_URL = 'https://en.wikipedia.org/w/api.php';

// Every outbound call goes through this client so none of them can hang forever. An
// unbounded request would stall the socket handler that awaited it, and a rejection with
// no timeout attached is what used to surface as an unhandled rejection.
const wikipedia = axios.create({
  baseURL: WIKIPEDIA_API_URL,
  timeout: 10000,
  headers: { 'User-Agent': 'wiki-race-game (https://github.com/owenbattles/wiki-race)' },
});

// Wikipedia titles differ only in first-letter case and underscore-vs-space, so anything
// comparing titles has to compare a normalised form.
const normalizeTitle = (title) =>
  String(title || '').replace(/_/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase();

// "/wiki/Domestic_cat#Behaviour" -> "Domestic cat"
const titleFromHref = (href) => {
  const withoutPrefix = String(href).replace(/^\/wiki\//, '');
  const withoutFragment = withoutPrefix.split('#')[0].split('?')[0];
  if (!withoutFragment) return '';
  try {
    return decodeURIComponent(withoutFragment).replace(/_/g, ' ');
  } catch {
    // Malformed percent-encoding — fall back to the raw form rather than throwing.
    return withoutFragment.replace(/_/g, ' ');
  }
};

// Small bounded caches. Articles are the memory-heavy ones (roughly half a megabyte of
// HTML each), so they get a tight cap; canonical-title lookups are just short strings.
//
// Both are plain insertion-ordered Maps used as LRUs: re-reading an entry moves it to the
// end, and an insert past the cap evicts the oldest.
const ARTICLE_CACHE_MAX = 40;
const ARTICLE_CACHE_TTL_MS = 10 * 60 * 1000;
const TITLE_CACHE_MAX = 500;
const TITLE_CACHE_TTL_MS = 60 * 60 * 1000;

const makeCache = (max, ttlMs) => {
  const entries = new Map();

  return {
    get(key) {
      const hit = entries.get(key);
      if (!hit) return undefined;
      if (hit.expiresAt < Date.now()) {
        entries.delete(key);
        return undefined;
      }
      // Refresh recency.
      entries.delete(key);
      entries.set(key, hit);
      return hit.value;
    },
    set(key, value) {
      if (entries.has(key)) entries.delete(key);
      entries.set(key, { value, expiresAt: Date.now() + ttlMs });
      while (entries.size > max) {
        entries.delete(entries.keys().next().value);
      }
    },
    get size() {
      return entries.size;
    },
  };
};

const articleCache = makeCache(ARTICLE_CACHE_MAX, ARTICLE_CACHE_TTL_MS);
const titleCache = makeCache(TITLE_CACHE_MAX, TITLE_CACHE_TTL_MS);

const escapeHtml = (s) =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

function buildTocFromSections(sections) {
  if (!Array.isArray(sections) || sections.length === 0) return '';

  // Filter out the lead section and any empty anchors.
  const tocSections = sections
    .filter((s) => s && s.index !== '0' && s.anchor && s.line)
    .map((s) => ({
      anchor: s.anchor,
      line: s.line,
      level: Number(s.toclevel || 1),
      number: s.number,
    }));

  if (tocSections.length === 0) return '';

  // Build nested <ul> based on toclevel.
  let html = `<div id="toc" class="toc" role="navigation" aria-label="Contents">`;
  html += `<div class="toctitle"><h2>Contents</h2></div>`;

  let currentLevel = tocSections[0].level;
  html += `<ul>`;
  for (const sec of tocSections) {
    while (sec.level > currentLevel) {
      html += `<ul>`;
      currentLevel += 1;
    }
    while (sec.level < currentLevel) {
      html += `</ul>`;
      currentLevel -= 1;
    }

    const num = sec.number ? `<span class="tocnumber">${escapeHtml(sec.number)}</span> ` : '';
    html += `<li class="toclevel-${sec.level}">`;
    html += `<a href="#${encodeURIComponent(sec.anchor)}">`;
    html += `<span class="toctext">${num}${escapeHtml(sec.line)}</span>`;
    html += `</a>`;
    html += `</li>`;
  }

  while (currentLevel > tocSections[0].level) {
    html += `</ul>`;
    currentLevel -= 1;
  }

  html += `</ul></div>`;
  return html;
}

// Cached wrapper around fetchAndClean.
//
// Keyed on the requested title *and* stored again under the canonical one, so
// "Cats", "cat" and "Cat" all collapse onto a single fetch. This matters because every
// player in a room loads the same start page at the same instant, and the move validator
// re-reads the page a player is standing on.
const fetchArticle = async (pageTitle) => {
  const requestedKey = normalizeTitle(pageTitle);

  const cached = articleCache.get(requestedKey);
  if (cached) return cached;

  const article = await fetchAndClean(pageTitle);

  articleCache.set(requestedKey, article);
  articleCache.set(normalizeTitle(article.title), article);
  titleCache.set(requestedKey, article.title);

  return article;
};

// Helper function with redirect support
const fetchAndClean = async (pageTitle) => {
  const response = await wikipedia.get('', {
      params: {
          action: 'parse',
          page: pageTitle,
          prop: 'text|sections',
          format: 'json',
          origin: '*',
          redirects: 1
      }
  });

  const data = response.data;
  if (data.error) throw new Error('Page not found');

  const rawHtml = data.parse.text['*'];
  const finalTitle = data.parse.title;
  const sections = data.parse.sections || [];
  const $ = cheerio.load(rawHtml);

  // Remove gameplay-hindering elements (but keep TOC!)
  const selectorsToRemove = [
      '.mw-parser-output .navbox',
      '.mw-editsection',           // Keep this - removes [edit] buttons
      '.reference',
      '.reflist',
      '.mw-empty-elt',
      '.noprint',
      '.hatnote',
      '.ambox',
      '.metadata',
      '.sistersitebox',
      // '#toc',                   // ❌ DON'T REMOVE - this is Table of Contents
      '.thumbcaption .magnify',
      'style',
      'script',
      'link'
  ];

  selectorsToRemove.forEach((s) => $(s).remove());

  // This markup is handed to dangerouslySetInnerHTML, so strip anything executable.
  // MediaWiki's parse output should not contain inline handlers, but "should not" is not a
  // guarantee worth betting the client on.
  $('*').each((i, el) => {
      for (const name of Object.keys(el.attribs || {})) {
          if (/^on/i.test(name)) $(el).removeAttr(name);
      }
  });

  // Pin media URLs to https. MediaWiki emits protocol-relative "//upload.wikimedia.org/..."
  // on images and on the <source> elements inside its audio/video players, so this has to
  // cover more than <img>.
  const absolutize = (url) => (url && url.startsWith('//') ? `https:${url}` : url);

  $('img, source, video, audio').each((i, el) => {
      const $el = $(el);

      for (const attr of ['src', 'poster']) {
          const value = $el.attr(attr);
          if (value) $el.attr(attr, absolutize(value));
      }

      const srcset = $el.attr('srcset');
      if (srcset) {
          // Per candidate, not a blanket replace: a global //->https:// rewrite also
          // mangles any URL that is already absolute.
          $el.attr(
              'srcset',
              srcset
                  .split(',')
                  .map((candidate) => absolutize(candidate.trim()))
                  .join(', ')
          );
      }

      $el.removeAttr('loading');
  });

  // Every article link that survives this pass is one the player can actually click, so
  // collecting them here gives the move validator an exact allow-list rather than an
  // approximation.
  const links = new Set();

  // Clean up links
  $('a').each((i, link) => {
      const href = $(link).attr('href');

      // Remove file links
      if (href && href.startsWith('/wiki/File:')) {
          $(link).removeAttr('href');
          $(link).css('pointer-events', 'none');
      }
      // Keep valid article links AND anchor links (for TOC)
      else if (href && (href.startsWith('/wiki/') || href.startsWith('#'))) {
          // Keep TOC anchor links working
          if (href.startsWith('#')) {
              // These are internal page anchors - keep them
          }
          // Keep wiki links that aren't special pages
          else if (!href.includes(':')) {
              const linkTitle = titleFromHref(href);
              if (linkTitle) links.add(normalizeTitle(linkTitle));
          }
          // Remove special namespace links
          else {
              $(link).replaceWith($(link).text());
          }
      }
      // Remove external links, including anything with a javascript: target
      else if (href && !href.startsWith('/wiki/') && !href.startsWith('#')) {
          $(link).replaceWith($(link).text());
      }
  });

  const articleBody = $('.mw-parser-output').html();
  const headerHtml = `<h1 id="firstHeading" class="firstHeading">${escapeHtml(finalTitle)}</h1>`;
  const tocHtml = buildTocFromSections(sections);
  const layoutHtml = `<div class="wiki-article-layout">` +
    `<aside class="wiki-article-toc">${tocHtml}</aside>` +
    `<div class="wiki-article-content">${articleBody || ''}</div>` +
    `</div>`;

  return {
      title: finalTitle,
      html: `${headerHtml}${layoutHtml}`,
      links,
  };
};

const fetchRandomArticleTitle = async () => {
  const response = await wikipedia.get('', {
    params: {
      action: 'query',
      format: 'json',
      list: 'random',
      rnnamespace: 0,
      rnlimit: 1,
      origin: '*',
    },
  });

  const title = response.data?.query?.random?.[0]?.title;
  if (!title) throw new Error('Failed to fetch random article');
  return title;
};

// Resolve a title to its canonical form, following redirects, without parsing the whole
// article. Used to pin down the target page once at the start of a round so the win check
// compares like with like — "America" and "United States" must not read as different
// pages just because the host typed one and the player arrived at the other.
const resolveTitle = async (title) => {
  const key = normalizeTitle(title);
  if (!key) throw new Error('Page not found');

  const cached = titleCache.get(key);
  if (cached) return cached;

  const response = await wikipedia.get('', {
    params: {
      action: 'query',
      format: 'json',
      titles: title,
      redirects: 1,
      origin: '*',
    },
  });

  const pages = response.data?.query?.pages;
  if (!pages) throw new Error('Page not found');

  const page = Object.values(pages)[0];
  if (!page || page.missing !== undefined) throw new Error('Page not found');

  titleCache.set(key, page.title);
  return page.title;
};

// Export for Socket.io
exports.fetchWikiHtml = async (pageTitle) => {
    const result = await fetchArticle(pageTitle);
    return result.html;
};

// Export for Socket.io — canonical title plus html, for callers that need both.
exports.fetchWikiPage = fetchArticle;

// Export for Socket.io — the set of article titles a player can legitimately click from
// the given page, normalised. Backs server-side move validation.
exports.fetchWikiLinks = async (pageTitle) => {
    const result = await fetchArticle(pageTitle);
    return result.links;
};

exports.resolveTitle = resolveTitle;
exports.normalizeTitle = normalizeTitle;

// Export for REST API
exports.getWikiPage = async (req, res) => {
    const pageTitle = req.params.page;

    try {
        const result = await fetchArticle(pageTitle);
        res.json({
            title: result.title,
            content: result.html
        });
    } catch (error) {
        console.error('getWikiPage failed:', error.message);
        if (error.message === 'Page not found') {
            res.status(404).json({ error: 'Page not found' });
        } else {
            res.status(500).json({ error: 'Failed to fetch article' });
        }
    }
};

// Export for REST API - Random page
exports.getRandomPage = async (req, res) => {
  try {
    const randomTitle = await fetchRandomArticleTitle();
    const result = await fetchArticle(randomTitle);
    res.json({
      title: result.title,
      content: result.html,
    });
  } catch (error) {
    console.error('getRandomPage failed:', error.message);
    res.status(500).json({ error: 'Failed to fetch random article' });
  }
};

// Export for Socket.io (random page with canonical title + html)
exports.fetchRandomPage = async () => {
  const randomTitle = await fetchRandomArticleTitle();
  return await fetchArticle(randomTitle);
};
