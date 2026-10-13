/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer } from 'http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Create HTTP server for both Express and WebSocket
const server = createServer(app);

// WebSocket proxy for SDR connections
const wss = new WebSocketServer({ server, path: '/sdr-ws' });

wss.on('connection', (clientWs, req) => {
  const targetUrl = new URL(req.url, `http://${req.headers.host}`).searchParams.get('target');

  if (!targetUrl) {
    console.error('❌ No target URL provided');
    clientWs.close(1008, 'No target URL');
    return;
  }

  console.log('🔌 Proxying WebSocket to:', targetUrl);

  try {
    // Connect to the actual SDR server with redirect following
    const sdrWs = new WebSocket(targetUrl, {
      followRedirects: true,
      maxRedirects: 3
    });
    sdrWs.binaryType = 'arraybuffer';

    // Forward messages: client -> SDR
    clientWs.on('message', (data) => {
      const isText = typeof data === 'string';
      const msg = isText ? data : `BINARY ${data.length} bytes`;
      console.log(`📤 Client→SDR: ${msg}`);

      if (sdrWs.readyState === WebSocket.OPEN) {
        sdrWs.send(data);
      }
    });

    // Forward messages: SDR -> client
    sdrWs.on('message', (data) => {
      const isText = typeof data === 'string';
      const isBinary = data instanceof Buffer;
      console.log(`📨 SDR→Client: ${isText ? 'TEXT' : isBinary ? 'BINARY' : 'OTHER'} ${isText ? data.length : isBinary ? data.length : 0} bytes`);

      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(data);
      }
    });

    // Handle SDR connection open
    sdrWs.on('open', () => {
      console.log('✅ Connected to SDR server');
    });

    // Handle SDR errors
    sdrWs.on('error', (err) => {
      console.error('❌ SDR connection error:', err.message);
      clientWs.close(1011, 'SDR connection error');
    });

    // Handle SDR close
    sdrWs.on('close', (code, reason) => {
      console.log('🔌 SDR connection closed:', code, reason.toString());
      clientWs.close(code, reason);
    });

    // Handle client disconnect
    clientWs.on('close', () => {
      console.log('🔌 Client disconnected');
      sdrWs.close();
    });

  } catch (err) {
    console.error('❌ Proxy error:', err);
    clientWs.close(1011, 'Proxy error');
  }
});

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

server.listen(PORT, () => {
  console.log(`✅ Ham Radio Blog server running on http://localhost:${PORT}`);
  console.log(`📡 Ready to serve your SDR adventures!`);
  console.log(`🔌 WebSocket proxy available at ws://localhost:${PORT}/sdr-ws`);
});
