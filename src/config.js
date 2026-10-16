const rawApiUrl = (import.meta.env.VITE_API_URL ?? '').trim();

export const APP_NAME = 'Clínica Aurora';

/** Base URL of the Spring Boot backend (pending: configure VITE_API_URL). */
export const API_BASE_URL = rawApiUrl.replace(/\/+$/, '');

/** Falls back to simulated data while the backend URL is not configured. */
export const USE_MOCK_API = import.meta.env.VITE_USE_MOCK === 'true' || API_BASE_URL === '';
