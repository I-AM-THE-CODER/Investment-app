import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// In-memory rate limiting map: key -> timestamp (ms)
const rateLimitMap = new Map<string, number>();
const COOLDOWN_MS = 30 * 1000; // 30 seconds cooldown per URL/client

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Endpoint: Check Valuation from Website URL
app.post('/api/check-valuation', async (req, res) => {
  try {
    const { url, ticker, currency, strikePrice } = req.body;

    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: 'A valid website URL is required.' });
    }

    // Validate URL format
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url.startsWith('http') ? url : `https://${url}`);
    } catch {
      return res.status(400).json({ error: 'Invalid URL format. Please provide a full URL like https://example.com' });
    }

    // Rate Limiting Check to prevent API key and server overwhelm
    const clientKey = `${req.ip || 'client'}_${parsedUrl.hostname}`;
    const lastRequest = rateLimitMap.get(clientKey);
    const now = Date.now();

    if (lastRequest && now - lastRequest < COOLDOWN_MS) {
      const waitSeconds = Math.ceil((COOLDOWN_MS - (now - lastRequest)) / 1000);
      return res.status(429).json({
        error: `Rate limit active to protect API quota. Please wait ${waitSeconds}s before checking this website again.`,
        retryAfterSeconds: waitSeconds,
      });
    }

    rateLimitMap.set(clientKey, now);

    // Clean up stale rate limits periodically
    if (rateLimitMap.size > 200) {
      for (const [k, time] of rateLimitMap.entries()) {
        if (now - time > COOLDOWN_MS * 2) {
          rateLimitMap.delete(k);
        }
      }
    }

    // Fetch the webpage content with a 10s timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    let html = '';
    try {
      const response = await fetch(parsedUrl.toString(), {
        signal: controller.signal,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
        },
      });

      clearTimeout(timeout);

      if (!response.ok) {
        return res.status(502).json({
          error: `Website responded with HTTP status ${response.status}: ${response.statusText}`,
        });
      }

      html = await response.text();
    } catch (fetchErr: any) {
      clearTimeout(timeout);
      if (fetchErr.name === 'AbortError') {
        return res.status(504).json({ error: 'Request to website timed out after 10 seconds.' });
      }
      return res.status(502).json({
        error: `Failed to connect to website: ${fetchErr.message || 'Network error'}`,
      });
    }

    // Sanitize HTML to extract visible text
    const cleanText = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 12000); // Send first 12k chars

    if (!cleanText || cleanText.length < 20) {
      return res.status(422).json({
        error: 'Website returned empty or non-readable content (may require JavaScript rendering or login).',
      });
    }

    // Use Gemini to extract valuation and price data
    const apiKey = process.env.GEMINI_API_KEY;

    if (apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const prompt = `You are a financial data parser. You are analyzing text extracted from a financial website/portal: ${parsedUrl.toString()}
Context:
- Underlying asset / ticker: "${ticker || 'Equity / Index'}"
- Initial strike price reference: ${strikePrice ? strikePrice : 'N/A'}
- Preferred currency: "${currency || 'USD'}"

Text extracted from webpage:
"""
${cleanText}
"""

Task:
Find the most current market price, spot price, NAV, or valuation for this asset from the page text.
Return strictly valid JSON with this format:
{
  "price": number or null,
  "currency": string (e.g. "USD", "EUR", "GBP"),
  "asOfDate": string or null (e.g. "2026-09-19", "Today", or time from page),
  "confidence": "high" | "medium" | "low",
  "notes": "Short 1-sentence note of what was found"
}`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
          },
        });

        const rawText = response.text || '{}';
        const parsedResult = JSON.parse(rawText);

        return res.json({
          success: true,
          price: typeof parsedResult.price === 'number' ? parsedResult.price : null,
          currency: parsedResult.currency || currency || 'USD',
          asOfDate: parsedResult.asOfDate || new Date().toLocaleDateString(),
          confidence: parsedResult.confidence || 'medium',
          notes: parsedResult.notes || `Data extracted from ${parsedUrl.hostname}`,
          sourceUrl: parsedUrl.toString(),
          checkedAt: new Date().toISOString(),
        });
      } catch (aiErr: any) {
        console.error('Gemini extraction error:', aiErr);
        // Fallback to heuristic parser
      }
    }

    // Heuristic Fallback if Gemini key is missing or errored
    const numberMatches = cleanText.match(/(?:[$€£¥]\s*|\b(?:USD|EUR|GBP|AUD|CAD)\s*)?([0-9]{1,6}(?:,[0-9]{3})*(?:\.[0-9]{1,4}))/g);
    let fallbackPrice: number | null = null;
    if (numberMatches && numberMatches.length > 0) {
      const cleanNum = numberMatches[0].replace(/[^0-9.]/g, '');
      const num = parseFloat(cleanNum);
      if (!isNaN(num) && num > 0) {
        fallbackPrice = num;
      }
    }

    return res.json({
      success: true,
      price: fallbackPrice,
      currency: currency || 'USD',
      asOfDate: new Date().toLocaleDateString(),
      confidence: 'low',
      notes: `Extracted from ${parsedUrl.hostname} via pattern matcher.`,
      sourceUrl: parsedUrl.toString(),
      checkedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('Check valuation error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

// Vite & Static Asset Handling
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
