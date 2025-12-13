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
      '.mw-parser-output .infobox', // The box on the right with stats
      '.mw-parser-output .reflist', // Reference list at bottom
      '.mw-parser-output .navbox', // Bottom navigation
      '.mw-editsection',           // [Edit] buttons
      'table',                     // Tables often break mobile layout
      '.reference',                // Tiny numbers [1][2]
      'style',                     // Wikipedia's internal CSS
      'script',                    // Wikipedia's internal JS
      '.mw-empty-elt'              // Empty elements
    ];
    
    // Loop through and remove them
    selectorsToRemove.forEach((selector) => {
      $(selector).remove();
    });

    // We want to make sure users can ONLY click links to other wiki articles.
    // Wikipedia links look like: <a href="/wiki/Batman">
    $('a').each((i, link) => {
      const href = $(link).attr('href');
      
      // If it's not a wiki link (e.g., external link, citation), remove the link tag but keep text
      if (!href || !href.startsWith('/wiki/') || href.includes(':')) { 
        // href.includes(':') catches "File:", "Help:", "Category:" special pages
        $(link).replaceWith($(link).text()); 
      }
    });

    // Extract the clean HTML of the body content
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