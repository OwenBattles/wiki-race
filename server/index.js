const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors()); 
app.use(express.json());

// Health Check Endpoint 
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend is running' });
});

const cheerio = require('cheerio'); // Add this at the top if not already there

app.get('/api/wiki/:page', async (req, res) => {
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
        'User-Agent': 'Velocipedia/1.0 (your_email@example.com)' 
      }
    });

    const data = response.data;
    if (data.error) return res.status(404).json({ error: 'Page not found' });

    const rawHtml = data.parse.text['*'];

    const $ = cheerio.load(rawHtml);

    // 1. UPDATE: Remove ONLY the truly useless stuff.
    // notice we REMOVED '.thumb', 'img', and '.infobox' from this list
    const selectorsToRemove = [
      '.mw-parser-output .navbox', 
      '.mw-editsection',           
      '.reference',                
      '.reflist',                  
      '.mw-empty-elt',
      '.noprint',
      'style', 
      'script',
      'link' // Remove external CSS links
    ];
    
    selectorsToRemove.forEach((selector) => {
      $(selector).remove();
    });

    // 2. FIX IMAGE URLs (Critical Step)
    // Wikipedia images often start with "//upload.wikimedia.org"
    // We need to prepend "https:" to make them load
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
      
      // Optional: Disable lazy loading attributes that might break
      $(img).removeAttr('loading'); 
    });

    // 3. FIX LINKS (Same as before)
    $('a').each((i, link) => {
      const href = $(link).attr('href');
      
      // If it's a file link (clicking an image), disable it or make it unclickable
      if (href && href.startsWith('/wiki/File:')) {
        $(link).removeAttr('href'); // Make the image unclickable (purely visual)
        $(link).css('pointer-events', 'none');
      } 
      // Standard wiki links
      else if (href && href.startsWith('/wiki/') && !href.includes(':')) {
         // keep it as is, or rewrite if you handle it differently
      } 
      // External links/Red links
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
});

// Start the Server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});