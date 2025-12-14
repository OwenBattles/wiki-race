const axios = require('axios');
const cheerio = require('cheerio');

// This just takes a string title and returns the cleaned HTML string
const fetchAndClean = async (pageTitle) => {
  const wikipediaApiUrl = `https://en.wikipedia.org/w/api.php`;
  
  const response = await axios.get(wikipediaApiUrl, {
      params: {
          action: 'parse',
          page: pageTitle,
          format: 'json',
          origin: '*' 
      },
      headers: { 'User-Agent': 'wiki-race-game' }
  });

  const data = response.data;
  if (data.error) throw new Error('Page not found');

  const rawHtml = data.parse.text['*'];
  const $ = cheerio.load(rawHtml);

  // --- YOUR EXISTING CLEANING LOGIC ---
  const selectorsToRemove = ['.mw-parser-output .navbox', '.mw-editsection', '.reference', '.reflist', '.mw-empty-elt', '.noprint', 'style', 'script', 'link'];
  selectorsToRemove.forEach((s) => $(s).remove());

  $('img').each((i, img) => {
      const src = $(img).attr('src');
      if (src && src.startsWith('//')) $(img).attr('src', 'https:' + src);
      $(img).removeAttr('loading'); 
  });

  $('a').each((i, link) => {
      const href = $(link).attr('href');
      if (href && href.startsWith('/wiki/File:')) {
          $(link).removeAttr('href'); 
          $(link).css('pointer-events', 'none');
      } else if (href && href.startsWith('/wiki/') && !href.includes(':')) {
          // keep valid links
      } else {
          $(link).replaceWith($(link).text()); 
      }
  });

  // RETURN the string directly
  return $('.mw-parser-output').html();
};

// 2. EXPORT THE HELPER (For Socket.io)
exports.fetchWikiHtml = fetchAndClean;

exports.getWikiPage = async (req, res) => {
    const pageTitle = req.params.page;

    try {
        const wikipediaApiUrl = `https://en.wikipedia.org/w/api.php`;
        
        const response = await axios.get(wikipediaApiUrl, {
          params: {
            action: 'parse',
            page: pageTitle,
            format: 'json',
            origin: '*' 
          },
          headers: {
            'User-Agent': 'wiki-race' 
          }
        });
    
        const data = response.data;
        if (data.error) return res.status(404).json({ error: 'Page not found' });
    
        const rawHtml = data.parse.text['*'];
    
        const $ = cheerio.load(rawHtml);
    
        const selectorsToRemove = [
          '.mw-parser-output .navbox', 
          '.mw-editsection',           
          '.reference',                
          '.reflist',                  
          '.mw-empty-elt',
          '.noprint',
          'style', 
          'script',
          'link' 
        ];
        
        selectorsToRemove.forEach((selector) => {
          $(selector).remove();
        });
    
        $('img').each((i, img) => {
          const src = $(img).attr('src');
          const srcset = $(img).attr('srcset');
    
          if (src && src.startsWith('//')) {
            $(img).attr('src', 'https:' + src);
          }
          
          // Also fix 'srcset' (used for high-res displays) if it exists
          if (srcset) {
            const newSrcset = srcset.replace(/\/\//g, 'https://');
            $(img).attr('srcset', newSrcset);
          }
          
          $(img).removeAttr('loading'); 
        });
    
        $('a').each((i, link) => {
          const href = $(link).attr('href');
          
          if (href && href.startsWith('/wiki/File:')) {
            $(link).removeAttr('href'); 
            $(link).css('pointer-events', 'none');
          } 
    
          else if (href && href.startsWith('/wiki/') && !href.includes(':')) {
          } 
          else {
            $(link).replaceWith($(link).text()); 
          }
        });
    
        const cleanHtml = $('.mw-parser-output').html();
    
        res.json({ title: data.parse.title, content: cleanHtml });
    
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch article' });
      }
}