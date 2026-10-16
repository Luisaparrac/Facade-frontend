import { API_BASE_URL } from '../config';

export class ApiError extends Error {
  constructor(message, status, details = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

async function parseBody(response) {
  if (response.status === 204) return null;
  const contentType = response.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    return response.json().catch(() => null);
  }
  const text = await response.text();
  return text || null;
}

function extractErrorMessage(payload, status) {
  if (payload && typeof payload === 'object') {
    // Supports Spring's default error body and custom { message } bodies.
    return payload.message || payload.error || payload.detail || `Error ${status}`;
  }
  if (typeof payload === 'string' && payload.length < 300) return payload;
  return `Error ${status}`;
}

export async function request(path, { method = 'GET', body, query, signal } = {}) {
  const url = new URL(`${API_BASE_URL}${path}`);
  Object.entries(query ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, value);
  });

  let response;
  try {
    response = await fetch(url, {
      method,
      signal,
      headers: { Accept: 'application/json', ...(body ? { 'Content-Type': 'application/json' } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new ApiError('No se pudo conectar con el servidor. Verifica tu conexión e inténtalo de nuevo.', 0);
  }

  const payload = await parseBody(response);
  if (!response.ok) {
    throw new ApiError(extractErrorMessage(payload, response.status), response.status, payload);
  }
  return payload;
}
