import { USE_MOCK_API } from '../config';
import { httpClinicApi } from './httpClinicApi';
import { mockClinicApi } from './mockClinicApi';

/**
 * Single entry point for the UI — a client-side facade over the backend.
 * Components never know whether data comes from the real API or the mock.
 */
export const clinicApi = USE_MOCK_API ? mockClinicApi : httpClinicApi;

export { ApiError } from './httpClient';
export { DEMO_CREDENTIALS } from './mockClinicApi';
