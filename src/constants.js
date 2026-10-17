import { Baby, Brain, HeartPulse, Sparkles, Stethoscope } from 'lucide-react';
import { humanizeCode } from './utils/text';

export const SPECIALTIES = {
  GENERAL_MEDICINE: {
    label: 'Medicina general',
    description: 'Valoración integral, control preventivo y seguimiento.',
    icon: Stethoscope,
    tone: 'teal',
  },
  CARDIOLOGY: {
    label: 'Cardiología',
    description: 'Salud del corazón y del sistema circulatorio.',
    icon: HeartPulse,
    tone: 'rose',
  },
  DERMATOLOGY: {
    label: 'Dermatología',
    description: 'Diagnóstico y tratamiento de piel, cabello y uñas.',
    icon: Sparkles,
    tone: 'amber',
  },
  PEDIATRICS: {
    label: 'Pediatría',
    description: 'Atención médica para niños y adolescentes.',
    icon: Baby,
    tone: 'sky',
  },
  NEUROLOGY: {
    label: 'Neurología',
    description: 'Sistema nervioso central y periférico.',
    icon: Brain,
    tone: 'violet',
  },
};

export function getSpecialty(code) {
  return SPECIALTIES[code] ?? {
    label: humanizeCode(code),
    description: '',
    icon: Stethoscope,
    tone: 'slate',
  };
}

export const EXAM_TYPES = {
  CBC: {
    label: 'Hemograma',
    description: 'Hemoglobina, hematocrito, leucocitos y plaquetas.',
  },
  GLUCOSE: {
    label: 'Glicemia',
    description: 'Nivel de glucosa en sangre en ayunas.',
  },
  LIPID_PROFILE: {
    label: 'Perfil lipídico',
    description: 'Colesterol total, HDL, LDL y triglicéridos.',
  },
};

export const getExamType = (code) =>
  EXAM_TYPES[code] ?? { label: humanizeCode(code), description: '' };

export const DOCUMENT_TYPES = {
  CITIZEN_ID: { label: 'Cédula de ciudadanía', short: 'CC' },
  IDENTITY_CARD: { label: 'Tarjeta de identidad', short: 'TI' },
  FOREIGNER_ID: { label: 'Cédula de extranjería', short: 'CE' },
  PASSPORT: { label: 'Pasaporte', short: 'PA' },
};

export const getDocumentLabel = (patient) =>
  `${DOCUMENT_TYPES[patient.documentType]?.short ?? 'Doc.'} ${patient.documentNumber}`;

export const APPOINTMENT_STATUS = {
  SCHEDULED: { label: 'Programada', tone: 'info' },
  COMPLETED: { label: 'Atendida', tone: 'success' },
  CANCELLED: { label: 'Cancelada', tone: 'neutral' },
};

export const PRESCRIPTION_STATUS = {
  ACTIVE: { label: 'Activa', tone: 'success' },
  EXPIRED: { label: 'Finalizada', tone: 'neutral' },
};

export const RESULT_STATUS = {
  NORMAL: { label: 'Normal', tone: 'success' },
  HIGH: { label: 'Alto', tone: 'danger' },
  LOW: { label: 'Bajo', tone: 'warning' },
};
