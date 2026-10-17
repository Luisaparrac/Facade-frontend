import { API_BASE_URL } from '../config';

export class ApiError extends Error {
  constructor(message, status, details = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

let authToken = null;
let onUnauthorized = null;

/** Bearer token sent on every request (set by AuthContext after login). */
export function setAuthToken(token) {
  authToken = token;
}

/** Called when an authenticated request is rejected with 401 (expired/invalid session). */
export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler;
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
    // Backend ApiErrorResponse: { message, fieldErrors: { field: msg }, details: [] }
    const parts = [payload.message || payload.error || payload.detail || `Error ${status}`];
    const fieldErrors = Object.entries(payload.fieldErrors ?? {}).map(([field, msg]) => `${field}: ${msg}`);
    if (fieldErrors.length) parts.push(fieldErrors.join(' · '));
    if (Array.isArray(payload.details) && payload.details.length) parts.push(payload.details.join(' · '));
    return parts.join(' — ');
  }
  if (typeof payload === 'string' && payload.length < 300) return payload;
  return `Error ${status}`;
}

export async function request(path, { method = 'GET', body, query, signal } = {}) {
  const url = new URL(`${API_BASE_URL}${path}`);
  Object.entries(query ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, value);
  });

  const sentToken = authToken;
  let response;
  try {
    response = await fetch(url, {
      method,
      signal,
      headers: {
        Accept: 'application/json',
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...(sentToken ? { Authorization: `Bearer ${sentToken}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new ApiError('No se pudo conectar con el servidor. Verifica tu conexión e inténtalo de nuevo.', 0);
  }

  const payload = await parseBody(response);
  if (!response.ok) {
    if (response.status === 401 && sentToken) onUnauthorized?.();
    throw new ApiError(extractErrorMessage(payload, response.status), response.status, payload);
  }
  return payload;
}
