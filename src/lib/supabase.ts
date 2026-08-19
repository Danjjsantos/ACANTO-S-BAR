import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Pre-configured project credentials
export const DEFAULT_SUPABASE_URL = 'https://fpmhyiaujbwxwwlvgwpm.supabase.co';
export const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_jO5fvymuJtzrK5VG-6WB4Q_QTnoAQHi';

export function normalizeSupabaseUrl(rawUrl: string): string {
  if (!rawUrl) return '';
  let cleaned = rawUrl.trim();
  try {
    const urlObj = new URL(cleaned.startsWith('http') ? cleaned : `https://${cleaned}`);
    // Always use just the origin (e.g. https://fpmhyiaujbwxwwlvgwpm.supabase.co)
    return urlObj.origin;
  } catch {
    cleaned = cleaned.replace(/\/rest\/v1.*$/i, '');
    cleaned = cleaned.replace(/\/+$/, '');
    return cleaned;
  }
}

export function getSupabaseConfig(): { url: string; anonKey: string } {
  try {
    const localUrl = localStorage.getItem('fzp_supabase_url');
    const localKey = localStorage.getItem('fzp_supabase_key');

    // Auto-normalize if dirty in localStorage
    if (localUrl && (localUrl.includes('/rest/v1') || localUrl.endsWith('/'))) {
      const sanitized = normalizeSupabaseUrl(localUrl);
      localStorage.setItem('fzp_supabase_url', sanitized);
    }

    const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL;
    const envKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY;

    const url = normalizeSupabaseUrl(localUrl || envUrl || DEFAULT_SUPABASE_URL);
    const anonKey = (localKey || envKey || DEFAULT_SUPABASE_ANON_KEY || '').trim();

    return { url, anonKey };
  } catch {
    return {
      url: DEFAULT_SUPABASE_URL,
      anonKey: DEFAULT_SUPABASE_ANON_KEY,
    };
  }
}

export function saveSupabaseConfig(url: string, anonKey: string): void {
  const cleanUrl = normalizeSupabaseUrl(url);
  try {
    localStorage.setItem('fzp_supabase_url', cleanUrl);
    localStorage.setItem('fzp_supabase_key', anonKey.trim());
  } catch (e) {
    console.error('Failed to save to localStorage:', e);
  }
  // Reset cached client instance
  cachedClient = null;
  cachedClientKey = '';
}

/**
 * Resilient custom fetch implementation for Supabase client:
 * 1. Tries standard direct browser fetch first.
 * 2. If direct fetch fails (Adblocker, CORS, Brave Shields, or browser sandbox restrictions),
 *    automatically forwards the request to the backend server proxy (/api/supabase/proxy).
 */
async function resilientSupabaseFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  let urlStr = '';
  let method = 'GET';
  const headersObj: Record<string, string> = {};
  let bodyData: any = undefined;

  if (typeof input === 'string') {
    urlStr = input;
  } else if (input instanceof URL) {
    urlStr = input.toString();
  } else if (input && typeof input === 'object' && 'url' in input) {
    urlStr = input.url;
    method = input.method || 'GET';
    if (input.headers) {
      if (input.headers instanceof Headers) {
        input.headers.forEach((v, k) => {
          headersObj[k.toLowerCase()] = v;
        });
      } else if (typeof input.headers === 'object') {
        Object.entries(input.headers).forEach(([k, v]) => {
          if (typeof v === 'string') headersObj[k.toLowerCase()] = v;
        });
      }
    }
  }

  if (init?.method) {
    method = init.method;
  }

  if (init?.headers) {
    if (init.headers instanceof Headers) {
      init.headers.forEach((v, k) => {
        headersObj[k.toLowerCase()] = v;
      });
    } else if (Array.isArray(init.headers)) {
      init.headers.forEach(([k, v]) => {
        headersObj[k.toLowerCase()] = v;
      });
    } else if (typeof init.headers === 'object') {
      for (const [k, v] of Object.entries(init.headers)) {
        if (v && typeof v === 'string') {
          headersObj[k.toLowerCase()] = v;
        }
      }
    }
  }

  const { anonKey } = getSupabaseConfig();
  if (anonKey) {
    if (!headersObj['apikey']) headersObj['apikey'] = anonKey;
    if (!headersObj['authorization']) headersObj['authorization'] = `Bearer ${anonKey}`;
  }

  if (init?.body) {
    if (typeof init.body === 'string') {
      bodyData = init.body;
    } else {
      try {
        bodyData = JSON.stringify(init.body);
      } catch {
        bodyData = undefined;
      }
    }
  }

  try {
    const res = await fetch(input, init);
    return res;
  } catch (_directErr: any) {
    // If direct browser fetch threw "TypeError: Failed to fetch", try via server proxy
    try {
      const proxyRes = await fetch('/api/supabase/proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          targetUrl: urlStr,
          method,
          headers: headersObj,
          body: bodyData,
        }),
      });

      const responseText = await proxyRes.text();
      let proxyPayload: any = null;

      try {
        proxyPayload = JSON.parse(responseText);
      } catch {
        // If response is HTML or unparseable, return a standard JSON error response
        return new Response(JSON.stringify({ message: 'Conexão com Supabase indisponível no momento' }), {
          status: 503,
          statusText: 'Service Unavailable',
          headers: { 'Content-Type': 'application/json; charset=utf-8' },
        });
      }

      const payloadData = typeof proxyPayload?.data === 'string' 
        ? proxyPayload.data 
        : JSON.stringify(proxyPayload?.data ?? {});

      const responseHeaders = new Headers();
      if (proxyPayload?.headers && typeof proxyPayload.headers === 'object') {
        Object.entries(proxyPayload.headers).forEach(([k, v]) => {
          if (typeof v === 'string') {
            responseHeaders.set(k, v);
          }
        });
      }
      if (!responseHeaders.has('content-type')) {
        responseHeaders.set('content-type', 'application/json; charset=utf-8');
      }

      return new Response(payloadData, {
        status: proxyPayload?.status || 200,
        statusText: proxyPayload?.statusText || 'OK',
        headers: responseHeaders,
      });
    } catch (_proxyErr) {
      // Return a graceful non-crashing Response object for supabase-js
      return new Response(JSON.stringify({ message: 'Erro de comunicação de rede' }), {
        status: 503,
        statusText: 'Network Error',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
      });
    }
  }
}

let cachedClient: SupabaseClient | null = null;
let cachedClientKey = '';

export function getSupabase(): SupabaseClient | null {
  const { url, anonKey } = getSupabaseConfig();
  if (!url || !anonKey) return null;

  const keySignature = `${url}:::${anonKey}`;
  if (cachedClient && cachedClientKey === keySignature) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
      global: {
        fetch: resilientSupabaseFetch,
      },
    });
    cachedClientKey = keySignature;
    return cachedClient;
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err);
    return null;
  }
}

export function isSupabaseConfigured(): boolean {
  const { url, anonKey } = getSupabaseConfig();
  return Boolean(url && anonKey && url.includes('supabase.co'));
}
