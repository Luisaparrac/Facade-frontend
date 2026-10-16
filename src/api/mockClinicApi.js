/**
 * In-browser implementation of the clinic API, used while VITE_API_URL is not set.
 * It mirrors the backend contract (see README) so switching to the real API needs no UI changes.
 */
import { ApiError } from './httpClient';
import { toISODate, toLocalDateTime } from '../utils/format';
import { findAllergyConflict } from '../utils/text';

const STORAGE_KEY = 'clinic-portal-mock-db-v1';

export const DEMO_CREDENTIALS = { documentNumber: '1000000001', password: 'demo1234' };

const DOCTORS = [
  { id: 'DOC-1', fullName: 'Dra. Laura Méndez', specialty: 'GENERAL_MEDICINE', yearsOfExperience: 12 },
  { id: 'DOC-2', fullName: 'Dr. Andrés Rojas', specialty: 'GENERAL_MEDICINE', yearsOfExperience: 8 },
  { id: 'DOC-3', fullName: 'Dra. Camila Torres', specialty: 'CARDIOLOGY', yearsOfExperience: 15 },
  { id: 'DOC-4', fullName: 'Dr. Felipe Herrera', specialty: 'CARDIOLOGY', yearsOfExperience: 21 },
  { id: 'DOC-5', fullName: 'Dra. Valentina Ruiz', specialty: 'DERMATOLOGY', yearsOfExperience: 10 },
];

const SLOT_TIMES = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
];

const LAB_CATALOG = {
  HEMOGRAM: [
    { parameter: 'Hemoglobina', unit: 'g/dL', referenceMin: 12, referenceMax: 17.5 },
    { parameter: 'Hematocrito', unit: '%', referenceMin: 36, referenceMax: 52 },
    { parameter: 'Leucocitos', unit: '×10³/µL', referenceMin: 4.5, referenceMax: 11 },
    { parameter: 'Plaquetas', unit: '×10³/µL', referenceMin: 150, referenceMax: 450 },
  ],
  GLUCOSE: [
    { parameter: 'Glucosa en ayunas', unit: 'mg/dL', referenceMin: 70, referenceMax: 100 },
  ],
  LIPID_PROFILE: [
    { parameter: 'Colesterol total', unit: 'mg/dL', referenceMin: 125, referenceMax: 200 },
    { parameter: 'Colesterol HDL', unit: 'mg/dL', referenceMin: 40, referenceMax: 60 },
    { parameter: 'Colesterol LDL', unit: 'mg/dL', referenceMin: 50, referenceMax: 130 },
    { parameter: 'Triglicéridos', unit: 'mg/dL', referenceMin: 50, referenceMax: 150 },
  ],
};

// ---------- helpers ----------

const latency = () => new Promise((resolve) => setTimeout(resolve, 250 + Math.random() * 450));
const clone = (value) => JSON.parse(JSON.stringify(value));
const newId = (prefix) =>
  `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`.toUpperCase();
const round = (value) => Math.round(value * 10) / 10;
const findDoctor = (id) => DOCTORS.find((doctor) => doctor.id === id);

/** Seed date relative to today, moved off Sunday (the clinic is closed). */
function dateTimeFromToday(days, time) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  if (date.getDay() === 0) date.setDate(date.getDate() + 1);
  return `${toISODate(date)}T${time}`;
}

/** Deterministic 0..1 value so simulated occupancy stays stable between reloads. */
function pseudoRandom(seed) {
  let hash = 2166136261;
  for (const char of seed) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return ((hash >>> 0) % 1000) / 1000;
}

function evaluate(value, min, max) {
  if (value < min) return 'LOW';
  if (value > max) return 'HIGH';
  return 'NORMAL';
}

function buildResults(examType, values) {
  return LAB_CATALOG[examType].map((reference, index) => {
    const value = values[index];
    return { ...reference, value, status: evaluate(value, reference.referenceMin, reference.referenceMax) };
  });
}

function simulateValues(examType) {
  return LAB_CATALOG[examType].map(({ referenceMin, referenceMax }) => {
    const span = referenceMax - referenceMin;
    const outOfRange = Math.random() < 0.25;
    if (!outOfRange) return round(referenceMin + span * (0.15 + Math.random() * 0.7));
    const deviation = span * (0.05 + Math.random() * 0.25);
    const value = Math.random() < 0.5 ? referenceMin - deviation : referenceMax + deviation;
    return Math.max(0, round(value));
  });
}

// ---------- persistence ----------

function seedDatabase() {
  const patientId = 'PAT-DEMO';
  return {
    patients: [
      {
        id: patientId,
        documentNumber: DEMO_CREDENTIALS.documentNumber,
        firstName: 'María',
        lastName: 'González',
        email: 'maria.gonzalez@example.com',
        phone: '3001234567',
        birthDate: '1990-04-12',
        allergies: ['Penicilina', 'Ibuprofeno'],
      },
    ],
    credentials: { [patientId]: DEMO_CREDENTIALS.password },
    appointments: [
      { id: 'APT-1001', patientId, doctorId: 'DOC-3', dateTime: dateTimeFromToday(2, '09:30'), status: 'SCHEDULED' },
      { id: 'APT-1002', patientId, doctorId: 'DOC-1', dateTime: dateTimeFromToday(9, '14:00'), status: 'SCHEDULED' },
      { id: 'APT-0998', patientId, doctorId: 'DOC-1', dateTime: dateTimeFromToday(-30, '10:00'), status: 'COMPLETED' },
      { id: 'APT-0971', patientId, doctorId: 'DOC-5', dateTime: dateTimeFromToday(-75, '15:30'), status: 'COMPLETED' },
    ],
    consultations: [
      {
        id: 'CON-2001',
        patientId,
        doctorId: 'DOC-1',
        date: dateTimeFromToday(-30, '10:00'),
        reason: 'Control médico anual',
        diagnosis: 'Paciente en buen estado general. Dislipidemia leve en seguimiento.',
        notes: 'Se solicitan perfil lipídico, hemograma y glicemia. Dieta baja en grasas saturadas y actividad física de 150 min/semana.',
      },
      {
        id: 'CON-1987',
        patientId,
        doctorId: 'DOC-5',
        date: dateTimeFromToday(-75, '15:30'),
        reason: 'Lesión eritematosa en antebrazo',
        diagnosis: 'Dermatitis de contacto irritativa.',
        notes: 'Evitar contacto directo con detergentes. Uso de guantes en labores domésticas.',
      },
    ],
    prescriptions: [
      {
        id: 'RX-3001',
        patientId,
        doctorId: 'DOC-1',
        issuedAt: dateTimeFromToday(-30, '10:20'),
        medications: [
          { name: 'Atorvastatina', dose: '20 mg cada noche', durationDays: 90 },
          { name: 'Omega 3', dose: '1 g cada 12 horas', durationDays: 90 },
        ],
      },
      {
        id: 'RX-2950',
        patientId,
        doctorId: 'DOC-5',
        issuedAt: dateTimeFromToday(-75, '15:50'),
        medications: [
          { name: 'Hidrocortisona crema 1%', dose: 'Aplicar 2 veces al día', durationDays: 10 },
          { name: 'Loratadina', dose: '10 mg cada 24 horas', durationDays: 7 },
        ],
      },
    ],
    labOrders: [
      { id: 'LAB-4003', patientId, examType: 'LIPID_PROFILE', requestedAt: dateTimeFromToday(-28, '07:10'), status: 'COMPLETED', results: buildResults('LIPID_PROFILE', [212, 48, 141, 138]) },
      { id: 'LAB-4002', patientId, examType: 'GLUCOSE', requestedAt: dateTimeFromToday(-28, '07:05'), status: 'COMPLETED', results: buildResults('GLUCOSE', [94]) },
      { id: 'LAB-4001', patientId, examType: 'HEMOGRAM', requestedAt: dateTimeFromToday(-28, '07:00'), status: 'COMPLETED', results: buildResults('HEMOGRAM', [13.8, 41.2, 7.1, 265]) },
    ],
  };
}

let database = null;

function db() {
  if (database) return database;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) database = JSON.parse(raw);
  } catch {
    database = null;
  }
  if (!database) {
    database = seedDatabase();
    persist();
  }
  return database;
}

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(database));
  } catch {
    // Storage unavailable (private mode): data lives in memory only.
  }
}

// ---------- mappers ----------

function requirePatient(patientId) {
  const patient = db().patients.find((p) => p.id === patientId);
  if (!patient) throw new ApiError('Paciente no encontrado', 404);
  return patient;
}

function toAppointmentDto(appointment) {
  const doctor = findDoctor(appointment.doctorId);
  return {
    ...appointment,
    doctorName: doctor?.fullName ?? 'Médico asignado',
    specialty: doctor?.specialty,
    reminder: appointment.status === 'SCHEDULED'
      ? `Recuerda llegar 15 minutos antes de tu cita con ${doctor?.fullName}. Trae tu documento de identidad y tus exámenes recientes.`
      : null,
  };
}

function toPrescriptionDto(prescription) {
  const doctor = findDoctor(prescription.doctorId);
  const longestTreatment = Math.max(...prescription.medications.map((m) => Number(m.durationDays) || 0));
  const endsAt = new Date(prescription.issuedAt);
  endsAt.setDate(endsAt.getDate() + longestTreatment);
  return {
    ...prescription,
    doctorName: doctor?.fullName ?? 'Médico tratante',
    specialty: doctor?.specialty,
    status: endsAt > new Date() ? 'ACTIVE' : 'EXPIRED',
  };
}

function availableSlots(doctorId, date) {
  const booked = new Set(
    db().appointments
      .filter((a) => a.doctorId === doctorId && a.status === 'SCHEDULED' && a.dateTime.startsWith(date))
      .map((a) => a.dateTime.slice(11, 16)),
  );
  const now = new Date();
  return SLOT_TIMES.filter((time) =>
    !booked.has(time) &&
    new Date(`${date}T${time}`) > now &&
    pseudoRandom(`${doctorId}|${date}|${time}`) > 0.3, // simulates other patients' bookings
  );
}

const byDateDesc = (field) => (a, b) => new Date(b[field]) - new Date(a[field]);

// ---------- public API (same contract as httpClinicApi) ----------

export const mockClinicApi = {
  async registerPatient({ password, ...profile }) {
    await latency();
    const store = db();
    if (!/^\d{6,12}$/.test(profile.documentNumber ?? '')) {
      throw new ApiError('El número de documento no es válido', 400);
    }
    if (store.patients.some((p) => p.documentNumber === profile.documentNumber)) {
      throw new ApiError('Ya existe un paciente registrado con este número de documento', 409);
    }
    const patient = { id: newId('PAT'), ...profile, allergies: profile.allergies ?? [] };
    store.patients.push(patient);
    store.credentials[patient.id] = password;
    persist();
    return clone(patient);
  },

  async login({ documentNumber, password }) {
    await latency();
    const store = db();
    const patient = store.patients.find((p) => p.documentNumber === documentNumber);
    if (!patient || store.credentials[patient.id] !== password) {
      throw new ApiError('Número de documento o contraseña incorrectos', 401);
    }
    return clone(patient);
  },

  async getDoctors(specialty) {
    await latency();
    return clone(specialty ? DOCTORS.filter((d) => d.specialty === specialty) : DOCTORS);
  },

  async getDoctorAvailability(doctorId, date) {
    await latency();
    if (!findDoctor(doctorId)) throw new ApiError('Médico no encontrado', 404);
    return availableSlots(doctorId, date);
  },

  async bookAppointment({ patientId, specialty, doctorId, dateTime }) {
    await latency();
    requirePatient(patientId);
    const doctor = doctorId
      ? findDoctor(doctorId)
      : DOCTORS.find((d) => d.specialty === specialty);
    if (!doctor || (specialty && doctor.specialty !== specialty)) {
      throw new ApiError('No hay médicos disponibles para la especialidad seleccionada', 422);
    }
    const [date, rawTime = ''] = dateTime.split('T');
    const time = rawTime.slice(0, 5);
    if (new Date(`${date}T${time}`) <= new Date()) {
      throw new ApiError('La fecha de la cita debe ser posterior al momento actual', 400);
    }
    if (!availableSlots(doctor.id, date).includes(time)) {
      throw new ApiError('El horario seleccionado ya no está disponible. Elige otro.', 409);
    }
    const appointment = {
      id: newId('APT'),
      patientId,
      doctorId: doctor.id,
      dateTime: `${date}T${time}`,
      status: 'SCHEDULED',
    };
    db().appointments.push(appointment);
    persist();
    return toAppointmentDto(appointment);
  },

  async cancelAppointment(appointmentId) {
    await latency();
    const appointment = db().appointments.find((a) => a.id === appointmentId);
    if (!appointment) throw new ApiError('Cita no encontrada', 404);
    if (appointment.status !== 'SCHEDULED') {
      throw new ApiError('Solo se pueden cancelar citas programadas', 409);
    }
    appointment.status = 'CANCELLED';
    persist();
    return toAppointmentDto(appointment);
  },

  async getFullHistory(patientId) {
    await latency();
    const store = db();
    const patient = requirePatient(patientId);
    const now = new Date();
    const appointments = store.appointments
      .filter((a) => a.patientId === patientId)
      .map(toAppointmentDto);
    const isUpcoming = (a) => a.status === 'SCHEDULED' && new Date(a.dateTime) > now;

    return clone({
      patient,
      upcomingAppointments: appointments.filter(isUpcoming)
        .sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime)),
      pastAppointments: appointments.filter((a) => !isUpcoming(a)).sort(byDateDesc('dateTime')),
      consultations: store.consultations
        .filter((c) => c.patientId === patientId)
        .map((c) => {
          const doctor = findDoctor(c.doctorId);
          return { ...c, doctorName: doctor?.fullName, specialty: doctor?.specialty };
        })
        .sort(byDateDesc('date')),
      prescriptions: store.prescriptions
        .filter((p) => p.patientId === patientId)
        .map(toPrescriptionDto)
        .sort(byDateDesc('issuedAt')),
      labOrders: store.labOrders
        .filter((o) => o.patientId === patientId)
        .sort(byDateDesc('requestedAt')),
    });
  },

  async createPrescription({ patientId, medications }) {
    await latency();
    const patient = requirePatient(patientId);
    if (!medications?.length) {
      throw new ApiError('La prescripción debe incluir al menos un medicamento', 400);
    }
    for (const medication of medications) {
      const allergy = findAllergyConflict(medication.name, patient.allergies);
      if (allergy) {
        throw new ApiError(
          `No se puede prescribir "${medication.name}": el paciente es alérgico a ${allergy}.`,
          422,
        );
      }
    }
    const prescription = {
      id: newId('RX'),
      patientId,
      doctorId: 'DOC-1',
      issuedAt: toLocalDateTime(new Date()),
      medications,
    };
    db().prescriptions.push(prescription);
    persist();
    return toPrescriptionDto(prescription);
  },

  async requestLabExams({ patientId, exams }) {
    await latency();
    requirePatient(patientId);
    if (!exams?.length) throw new ApiError('Selecciona al menos un examen', 400);
    const unsupported = exams.find((exam) => !LAB_CATALOG[exam]);
    if (unsupported) throw new ApiError(`Examen no soportado: ${unsupported}`, 400);

    const requestedAt = toLocalDateTime(new Date());
    const orders = exams.map((examType) => ({
      id: newId('LAB'),
      patientId,
      examType,
      requestedAt,
      status: 'COMPLETED',
      results: buildResults(examType, simulateValues(examType)),
    }));
    db().labOrders.push(...orders);
    persist();
    return clone(orders);
  },
};
