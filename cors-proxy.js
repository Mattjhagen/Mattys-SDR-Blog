import express from 'express';
import fetch from 'node-fetch';

const app = express();
const PORT = 8002;

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Proxy endpoint for scanner feeds
app.get('/proxy', async (req, res) => {
  const targetUrl = req.query.url;
  
  if (!targetUrl) {
    return res.status(400).send('Missing url parameter');
  }

  console.log('[CORS Proxy] Streaming:', targetUrl);

  try {
    const response = await fetch(targetUrl);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    // Copy headers
    const contentType = response.headers.get('content-type');
    if (contentType) {
      res.setHeader('Content-Type', contentType);
    }

    // Stream the response
    response.body.pipe(res);
    
  } catch (error) {
    console.error('[CORS Proxy] Error:', error.message);
    res.status(500).send('Proxy error: ' + error.message);
  }
});

app.listen(PORT, () => {
  console.log(`✅ CORS Proxy running on http://localhost:${PORT}`);
  console.log(`📡 Scanner feeds will be proxied to avoid CORS issues`);
});
