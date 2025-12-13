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

app.get('/api/wiki/:page', async (req, res) => {
  const pageTitle = req.params.page;
  
  try {
    // URL for fetching raw HTML from Wikipedia
    const wikipediaApiUrl = `https://en.wikipedia.org/w/api.php`;
    
    // We use the 'parse' action to get the HTML content
    const response = await axios.get(wikipediaApiUrl, {
      headers: {
        'User-Agent': 'Wiki-Race'
      },
      params: {
        action: 'parse',
        page: pageTitle,
        format: 'json',
        origin: '*' 
      }
    });

    const data = response.data;
    
    if (data.error) {
      return res.status(404).json({ error: 'Page not found' });
    }

    const rawHtml = data.parse.text['*'];
    
    res.json({ title: data.parse.title, content: rawHtml });

  } catch (error) {
    console.error('Wiki Fetch Error:', error);
    res.status(500).json({ error: 'Failed to fetch article' });
  }
});

// Start the Server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});