const axios = require('axios');
const cheerio = require('cheerio');

// Helper function with redirect support
const fetchAndClean = async (pageTitle) => {
  const wikipediaApiUrl = `https://en.wikipedia.org/w/api.php`;
  const response = await axios.get(wikipediaApiUrl, {
      params: {
          action: 'parse',
          page: pageTitle,
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

  return {
      title: finalTitle,
      html: $('.mw-parser-output').html()
  };
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