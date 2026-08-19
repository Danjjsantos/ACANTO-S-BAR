import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const DEFAULT_SUPABASE_ORIGIN = 'https://fpmhyiaujbwxwwlvgwpm.supabase.co';
const DEFAULT_SUPABASE_KEY = 'sb_publishable_jO5fvymuJtzrK5VG-6WB4Q_QTnoAQHi';

// Helper to execute upstream fetch with 1 automatic retry on transient socket errors
async function executeUpstreamFetch(
  targetUrl: string,
  options: RequestInit,
  timeoutMs = 12000
): Promise<Response> {
  const doFetch = async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(targetUrl, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (err) {
      clearTimeout(timeoutId);
      throw err;
    }
  };

  try {
    return await doFetch();
  } catch (_firstErr) {
    // Wait 150ms and retry once for transient socket / network resets
    await new Promise((resolve) => setTimeout(resolve, 150));
    return await doFetch();
  }
}

// Proxy endpoint for Supabase to bypass browser-level adblockers, CORS and sandbox network blocks
app.post('/api/supabase/proxy', async (req, res) => {
  try {
    const { targetUrl, method = 'GET', headers = {}, body } = req.body || {};

    if (!targetUrl || typeof targetUrl !== 'string') {
      return res.status(200).json({
        status: 400,
        statusText: 'Bad Request',
        data: { message: 'Missing targetUrl parameter' },
        headers: { 'content-type': 'application/json' },
      });
    }

    // Normalize and sanitize targetUrl
    let finalUrl = targetUrl.trim();
    if (finalUrl.startsWith('/')) {
      finalUrl = `${DEFAULT_SUPABASE_ORIGIN}${finalUrl}`;
    } else if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
      finalUrl = `https://${finalUrl}`;
    }

    // Security check: Only allow requests to *.supabase.co
    if (!finalUrl.includes('supabase.co')) {
      return res.status(200).json({
        status: 403,
        statusText: 'Forbidden',
        data: { message: 'Invalid target domain. Only Supabase endpoints allowed.' },
        headers: { 'content-type': 'application/json' },
      });
    }

    // Filter out forbidden / hop-by-hop headers that can break Node fetch
    const forbiddenHeaders = new Set([
      'host',
      'connection',
      'content-length',
      'transfer-encoding',
      'origin',
      'referer',
      'sec-fetch-dest',
      'sec-fetch-mode',
      'sec-fetch-site',
      'sec-ch-ua',
      'sec-ch-ua-mobile',
      'sec-ch-ua-platform',
      'user-agent',
      'accept-encoding',
      'cookie',
    ]);

    const outgoingHeaders: Record<string, string> = {
      Accept: 'application/json',
    };

    if (headers && typeof headers === 'object') {
      for (const [k, v] of Object.entries(headers)) {
        const lowerKey = k.toLowerCase().trim();
        if (!forbiddenHeaders.has(lowerKey) && v && typeof v === 'string') {
          // Clean non-printable characters or line-breaks
          outgoingHeaders[lowerKey] = v.replace(/[\r\n]+/g, ' ').trim();
        }
      }
    }

    // Ensure API Key and Auth headers are present
    if (!outgoingHeaders['apikey']) {
      outgoingHeaders['apikey'] = DEFAULT_SUPABASE_KEY;
    }
    if (!outgoingHeaders['authorization']) {
      outgoingHeaders['authorization'] = `Bearer ${outgoingHeaders['apikey'] || DEFAULT_SUPABASE_KEY}`;
    }

    const normalizedMethod = (method || 'GET').toUpperCase();
    const fetchOptions: RequestInit = {
      method: normalizedMethod,
      headers: outgoingHeaders,
    };

    if (body !== undefined && body !== null && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(normalizedMethod)) {
      fetchOptions.body = typeof body === 'string' ? body : JSON.stringify(body);
      if (!outgoingHeaders['content-type']) {
        outgoingHeaders['content-type'] = 'application/json';
      }
    }

    try {
      const upstreamRes = await executeUpstreamFetch(finalUrl, fetchOptions, 12000);
      const contentType = upstreamRes.headers.get('content-type') || '';
      const bodyText = await upstreamRes.text();

      let responseData: any = null;
      if (contentType.includes('application/json')) {
        try {
          responseData = JSON.parse(bodyText);
        } catch {
          responseData = bodyText;
        }
      } else {
        responseData = bodyText;
      }

      const responseHeaders: Record<string, string> = {};
      upstreamRes.headers.forEach((val, key) => {
        responseHeaders[key] = val;
      });

      return res.status(200).json({
        status: upstreamRes.status,
        statusText: upstreamRes.statusText,
        data: responseData,
        rawBody: bodyText,
        headers: responseHeaders,
      });
    } catch (fetchErr: any) {
      return res.status(200).json({
        status: 503,
        statusText: 'Service Unavailable',
        data: { message: `Supabase unreachable: ${fetchErr?.message || 'Network timeout/error'}` },
        headers: { 'content-type': 'application/json' },
      });
    }
  } catch (err: any) {
    return res.status(200).json({
      status: 500,
      statusText: 'Internal Proxy Error',
      data: { message: `Internal server proxy error: ${err?.message || 'Unknown error'}` },
      headers: { 'content-type': 'application/json' },
    });
  }
});

// Dedicated Supabase Test Endpoint from Server
app.post('/api/supabase/test', async (req, res) => {
  try {
    const { url, anonKey } = req.body || {};
    const targetBase = (url || DEFAULT_SUPABASE_ORIGIN).trim().replace(/\/rest\/v1.*$/i, '').replace(/\/+$/, '');
    const key = (anonKey || DEFAULT_SUPABASE_KEY).trim();

    const startTime = Date.now();
    const testUrl = `${targetBase}/rest/v1/store_settings?select=id&limit=1`;

    try {
      const upstreamRes = await executeUpstreamFetch(
        testUrl,
        {
          method: 'GET',
          headers: {
            apikey: key,
            Authorization: `Bearer ${key}`,
            Accept: 'application/json',
          },
        },
        10000
      );

      const latencyMs = Date.now() - startTime;
      const bodyText = await upstreamRes.text();
      let bodyJson: any = null;
      try {
        bodyJson = JSON.parse(bodyText);
      } catch {
        bodyJson = null;
      }

      if (upstreamRes.ok) {
        return res.json({
          success: true,
          tablesExist: true,
          message: `Conexão estabelecida com sucesso! (${latencyMs}ms)`,
          latencyMs,
        });
      }

      // Check if error is because table doesn't exist yet (PostgREST code 42P01 or PGRST204)
      if (
        bodyJson?.code === '42P01' ||
        bodyJson?.code === 'PGRST204' ||
        bodyText.includes('does not exist') ||
        bodyText.includes('relation') ||
        upstreamRes.status === 404
      ) {
        return res.json({
          success: true,
          tablesExist: false,
          message: 'Conectado ao Supabase com sucesso! (Tabelas prontas para serem criadas via SQL)',
          latencyMs,
        });
      }

      return res.json({
        success: false,
        message: `Supabase retornou status ${upstreamRes.status}: ${bodyJson?.message || bodyText || upstreamRes.statusText}`,
        latencyMs,
      });
    } catch (netErr: any) {
      return res.json({
        success: false,
        message: `Falha ao alcançar Supabase: ${netErr?.message || 'Tempo limite esgotado'}`,
      });
    }
  } catch (err: any) {
    res.json({
      success: false,
      message: `Falha no teste: ${err?.message || 'Erro interno'}`,
    });
  }
});

// Start server with Vite middleware in dev or static files in prod
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
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Bar do Acanto Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
