const axios = require('axios');
const cheerio = require('cheerio');

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

// Helper function with redirect support
const fetchAndClean = async (pageTitle) => {
  const wikipediaApiUrl = `https://en.wikipedia.org/w/api.php`;
  const response = await axios.get(wikipediaApiUrl, {
      params: {
          action: 'parse',
          page: pageTitle,
          prop: 'text|sections',
          format: 'json',
          origin: '*',
          redirects: 1
      },
      headers: { 'User-Agent': 'wiki-race-game' }
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

  // Fix image sources
  $('img').each((i, img) => {
      const src = $(img).attr('src');
      const srcset = $(img).attr('srcset');
      
      if (src && src.startsWith('//')) {
          $(img).attr('src', 'https:' + src);
      }
      if (srcset) {
          $(img).attr('srcset', srcset.replace(/\/\//g, 'https://'));
      }
      $(img).removeAttr('loading');
  });

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
              // Valid article link
          }
          // Remove special namespace links
          else {
              $(link).replaceWith($(link).text());
          }
      }
      // Remove external links
      else if (href && !href.startsWith('/wiki/') && !href.startsWith('#')) {
          $(link).replaceWith($(link).text());
      }
  });

  const articleBody = $('.mw-parser-output').html();
  const headerHtml = `<h1 id="firstHeading" class="firstHeading">${escapeHtml(finalTitle)}</h1>`;
  const tocHtml = buildTocFromSections(sections);

  return {
      title: finalTitle,
      html: `${headerHtml}${tocHtml}${articleBody || ''}`
  };
};

const fetchRandomArticleTitle = async () => {
  const wikipediaApiUrl = `https://en.wikipedia.org/w/api.php`;
  const response = await axios.get(wikipediaApiUrl, {
    params: {
      action: 'query',
      format: 'json',
      list: 'random',
      rnnamespace: 0,
      rnlimit: 1,
      origin: '*',
    },
    headers: { 'User-Agent': 'wiki-race-game' },
  });

  const title = response.data?.query?.random?.[0]?.title;
  if (!title) throw new Error('Failed to fetch random article');
  return title;
};

// Export for Socket.io
exports.fetchWikiHtml = async (pageTitle) => {
    const result = await fetchAndClean(pageTitle);
    return result.html;
};

// Export for REST API
exports.getWikiPage = async (req, res) => {
    const pageTitle = req.params.page;
    
    try {
        const result = await fetchAndClean(pageTitle);
        res.json({ 
            title: result.title,  
            content: result.html 
        });
    } catch (error) {
        console.error(error);
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
    const result = await fetchAndClean(randomTitle);
    res.json({
      title: result.title,
      content: result.html,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch random article' });
  }
};

exports.fetchRandomPageHtml = async () => {
  const randomTitle = await fetchRandomArticleTitle();
  const result = await fetchAndClean(randomTitle);
  return result.html;
};