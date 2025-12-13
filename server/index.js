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
});

// Start the Server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});