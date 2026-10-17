import { request } from './httpClient';

const BASE_PATH = '/api/clinic';
const DAY_MS = 86_400_000;

// ---------- response normalizers (backend DTOs -> UI models) ----------

function normalizeAppointment(appointment) {
  return { ...appointment, dateTime: appointment.dateTime?.slice(0, 16) };
}

function normalizePrescription(prescription) {
  const medications = (prescription.medications ?? []).map((item) => ({
    name: item.medication,
    dose: item.dose,
    frequency: item.frequency,
    durationDays: item.durationDays,
    instructions: item.instructions,
  }));
  const longestTreatment = Math.max(0, ...medications.map((m) => m.durationDays ?? 0));
  const endsAt = new Date(prescription.issuedAt).getTime() + longestTreatment * DAY_MS;
  return { ...prescription, medications, status: endsAt > Date.now() ? 'ACTIVE' : 'EXPIRED' };
}

/** The backend groups several exams in one order; the UI shows one card per exam. */
function normalizeLabOrder(order) {
  return (order.exams ?? []).map((exam) => ({
    id: `${order.id}-${exam.exam}`,
    orderId: order.id,
    examType: exam.exam,
    requestedAt: order.requestedAt,
    completedAt: order.completedAt,
    status: order.completedAt ? 'COMPLETED' : 'PENDING',
    results: (exam.parameters ?? []).map((parameter) => ({
      parameter: parameter.name,
      value: parameter.value,
      unit: parameter.unit,
      referenceMin: parameter.referenceMin,
      referenceMax: parameter.referenceMax,
      status: parameter.status,
    })),
  }));
}

function normalizeHistory(history) {
  return {
    patient: history.patient,
    upcomingAppointments: (history.upcomingAppointments ?? []).map(normalizeAppointment),
    pastAppointments: (history.pastAppointments ?? []).map(normalizeAppointment),
    consultations: history.consultations ?? [],
    prescriptions: (history.prescriptions ?? []).map(normalizePrescription)
      .sort((a, b) => new Date(b.issuedAt) - new Date(a.issuedAt)),
    labOrders: (history.labOrders ?? []).flatMap(normalizeLabOrder)
      .sort((a, b) => new Date(b.requestedAt) - new Date(a.requestedAt)),
  };
}

// ---------- API ----------

/**
 * HTTP implementation of the clinic API.
 * Every call goes through the backend's ClinicFacade endpoints.
 */
export const httpClinicApi = {
  registerPatient: (patient) =>
    request(`${BASE_PATH}/patient`, { method: 'POST', body: patient }),

  /** Returns { token, patient }. */
  login: async (credentials) => {
    const session = await request(`${BASE_PATH}/auth/login`, { method: 'POST', body: credentials });
    return { token: session.token, patient: session.patient };
  },

  logout: () =>
    request(`${BASE_PATH}/auth/logout`, { method: 'POST' }).catch(() => null),

  getDoctors: (specialty) =>
    request(`${BASE_PATH}/doctors`, { query: { specialty } }),

  getDoctorAvailability: async (doctorId, date) => {
    const doctors = await request(`${BASE_PATH}/doctors`, { query: { date } });
    const doctor = doctors.find((d) => String(d.id) === String(doctorId));
    return doctor?.availableSlots ?? [];
  },

  bookAppointment: async ({ patientId, specialty, doctorId, dateTime, reason }) => {
    const confirmation = await request(`${BASE_PATH}/appointment`, {
      method: 'POST',
      body: { patientId, specialty, doctorId, dateTime: `${dateTime}:00`, reason: reason || null },
    });
    return {
      ...normalizeAppointment(confirmation.appointment),
      reminders: confirmation.reminders ?? [],
    };
  },

  cancelAppointment: async (appointmentId) =>
    normalizeAppointment(await request(`${BASE_PATH}/appointment/${encodeURIComponent(appointmentId)}`, { method: 'DELETE' })),

  getFullHistory: async (patientId) =>
    normalizeHistory(await request(`${BASE_PATH}/history/${encodeURIComponent(patientId)}`)),

  createPrescription: async ({ patientId, medications, diagnosis }) =>
    normalizePrescription(await request(`${BASE_PATH}/prescription`, {
      method: 'POST',
      body: { patientId, medications, diagnosis: diagnosis || null },
    })),

  requestLabExams: async (labRequest) =>
    normalizeLabOrder(await request(`${BASE_PATH}/lab`, { method: 'POST', body: labRequest })),
};
