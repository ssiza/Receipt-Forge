import { serializeError } from './serializeError';

const originalFetch = globalThis.fetch;

export function wrapFetch() {
  globalThis.fetch = async function wrappedFetch(input: RequestInfo | URL, init?: RequestInit) {
    const startTime = Date.now();
    const method = init?.method || 'GET';
    const url = typeof input === 'string' ? input : input.toString();
    
    try {
      console.log(`🌐 [FETCH] ${method} ${url} - Starting request`);
      
      const response = await originalFetch(input, init);
      const duration = Date.now() - startTime;
      
      // Clone response to read body without consuming it
      const responseClone = response.clone();
      let bodyPreview = '';
      
      try {
        const text = await responseClone.text();
        bodyPreview = text.length > 200 ? text.substring(0, 200) + '...' : text;
      } catch (e) {
        bodyPreview = '[Unable to read response body]';
      }
      
      if (response.ok) {
        console.log(`✅ [FETCH] ${method} ${url} - ${response.status} (${duration}ms) - Body: ${bodyPreview}`);
      } else {
        console.error(`❌ [FETCH] ${method} ${url} - ${response.status} ${response.statusText} (${duration}ms) - Body: ${bodyPreview}`);
      }
      
      return response;
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`💥 [FETCH] ${method} ${url} - Network error (${duration}ms):`, serializeError(error));
      throw error;
    }
  };
}

export function unwrapFetch() {
  globalThis.fetch = originalFetch;
} 