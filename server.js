/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// WebSDR Proxy - forwards HTTP requests and adds CORS headers
app.get('/api/websdr-proxy', async (req, res) => {
  const targetUrl = req.query.url;

  if (!targetUrl) {
    return res.status(400).json({ error: 'Missing url parameter' });
  }

  try {
    console.log(`🌐 Proxying WebSDR: ${targetUrl}`);

    const response = await fetch(targetUrl);

    if (!response.ok) {
      throw new Error(`WebSDR returned ${response.status}`);
    }

    // Add CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Copy content type from the WebSDR
    const contentType = response.headers.get('content-type');
    if (contentType) {
      res.setHeader('Content-Type', contentType);
    }

    // Convert Web Streams API to Node.js stream
    const reader = response.body.getReader();

    // Pipe the stream to response
    (async () => {
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          res.write(value);
        }
        res.end();
      } catch (err) {
        console.error('❌ Stream error:', err.message);
        res.end();
      }
    })();

  } catch (error) {
    console.error('❌ WebSDR proxy error:', error.message);
    res.status(500).json({ error: 'Failed to connect to WebSDR' });
  }
});

// Serve static files from the dist directory
app.use(express.static(path.join(__dirname, 'dist')));

// Handle client-side routing - serve index.html for all routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`✅ Ham Radio Blog server running on http://localhost:${PORT}`);
  console.log(`📡 Ready to serve your SDR adventures!`);
});
