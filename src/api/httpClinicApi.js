import { request } from './httpClient';

const BASE_PATH = '/api/clinica';

/**
 * HTTP implementation of the clinic API.
 * Every call goes through the backend's ClinicaFacade endpoints.
 */
export const httpClinicApi = {
  registerPatient: (patient) =>
    request(`${BASE_PATH}/paciente`, { method: 'POST', body: patient }),

  login: (credentials) =>
    request(`${BASE_PATH}/login`, { method: 'POST', body: credentials }),

  getDoctors: (specialty) =>
    request(`${BASE_PATH}/medicos`, { query: { especialidad: specialty } }),

  getDoctorAvailability: (doctorId, date) =>
    request(`${BASE_PATH}/medicos/${encodeURIComponent(doctorId)}/disponibilidad`, { query: { fecha: date } }),

  bookAppointment: (appointment) =>
    request(`${BASE_PATH}/cita`, { method: 'POST', body: appointment }),

  cancelAppointment: (appointmentId) =>
    request(`${BASE_PATH}/cita/${encodeURIComponent(appointmentId)}`, { method: 'DELETE' }),

  getFullHistory: (patientId) =>
    request(`${BASE_PATH}/historia/${encodeURIComponent(patientId)}`),

  createPrescription: (prescription) =>
    request(`${BASE_PATH}/prescripcion`, { method: 'POST', body: prescription }),

  requestLabExams: (labRequest) =>
    request(`${BASE_PATH}/laboratorio`, { method: 'POST', body: labRequest }),
};
