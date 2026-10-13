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

// Audio Stream Proxy - forwards HTTP requests and adds CORS headers
app.get('/api/websdr-proxy', async (req, res) => {
  const targetUrl = req.query.url;

  if (!targetUrl) {
    return res.status(400).json({ error: 'Missing url parameter' });
  }

  try {
    console.log(`🎵 Proxying audio stream: ${targetUrl}`);

    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'audio/*, */*',
      }
    });

    if (!response.ok) {
      console.error(`❌ Stream returned ${response.status} ${response.statusText}`);
      throw new Error(`Stream returned ${response.status}`);
    }

    // Add CORS and streaming headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Range');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Length, Content-Range');

    // Copy important headers from source
    const contentType = response.headers.get('content-type');
    if (contentType) {
      res.setHeader('Content-Type', contentType);
    } else {
      // Default to MP3 if not specified
      res.setHeader('Content-Type', 'audio/mpeg');
    }

    const contentLength = response.headers.get('content-length');
    if (contentLength) {
      res.setHeader('Content-Length', contentLength);
    }

    // Enable streaming
    res.setHeader('Cache-Control', 'no-cache, no-store');
    res.setHeader('Connection', 'keep-alive');

    // Stream the response
    const reader = response.body.getReader();

    req.on('close', () => {
      reader.cancel();
      console.log('🔌 Client disconnected from stream');
    });

    (async () => {
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            console.log('✅ Stream ended');
            break;
          }
          if (!res.write(value)) {
            // Backpressure - wait for drain
            await new Promise(resolve => res.once('drain', resolve));
          }
        }
        res.end();
      } catch (err) {
        console.error('❌ Stream error:', err.message);
        if (!res.headersSent) {
          res.status(500).end();
        } else {
          res.end();
        }
      }
    })();

  } catch (error) {
    console.error('❌ Proxy error:', error.message);
    if (!res.headersSent) {
      res.status(502).json({ error: 'Failed to connect to stream: ' + error.message });
    }
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
