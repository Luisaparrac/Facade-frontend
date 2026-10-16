# Clínica Aurora — Portal del Paciente (Frontend)

Frontend del taller **Sistema de Gestión Médica (patrón Facade)**.
React 18 + Vite + React Router, en JavaScript.

## Funcionalidades

| Requisito del taller | Dónde está |
|---|---|
| Registro e inicio de sesión | `/register`, `/login` |
| Dashboard con próximas citas y últimos resultados | `/dashboard` |
| Agendar cita (especialidad → médico → horario) | `/appointments/new` |
| Historia clínica con pestañas | `/history`, `/history/prescriptions`, `/history/labs` |
| Resultados de laboratorio con indicador de rango | Pestaña Laboratorios y Dashboard |

También permite cancelar citas, generar prescripciones (con validación de alergias) y solicitar exámenes.

## Ejecutar en local

```bash
npm install
cp .env.example .env     # en Windows: copy .env.example .env
npm run dev              # http://localhost:5173
```

### Variable de entorno (pendiente)

| Variable | Descripción |
|---|---|
| `VITE_API_URL` | URL base del backend Spring Boot, **sin `/` final**. Ej: `https://clinica-api.up.railway.app` |
| `VITE_USE_MOCK` | `true` fuerza datos simulados aunque exista `VITE_API_URL` |

Mientras `VITE_API_URL` esté vacía, la app funciona en **modo demo** con datos simulados en el navegador
(se muestra la etiqueta "Modo demo" en la barra superior).
Cuenta demo: documento `1000000001`, contraseña `demo1234`.

## Despliegue en Vercel

1. Importar el repositorio en Vercel (framework: **Vite**; build `npm run build`; output `dist`).
2. En *Settings → Environment Variables* agregar `VITE_API_URL` con la URL del backend.
3. Volver a desplegar (las variables `VITE_*` se incrustan en tiempo de build).

`vercel.json` ya incluye el rewrite para que las rutas del SPA funcionen al recargar.

> En el backend, habilitar CORS para el dominio de Vercel (ej. `https://<proyecto>.vercel.app`).

## Arquitectura

```
src/
├── api/
│   ├── index.js            # clinicApi: punto único de acceso (fachada del lado cliente)
│   ├── httpClient.js       # fetch + manejo de errores (ApiError)
│   ├── httpClinicApi.js    # endpoints reales /api/clinica/*
│   └── mockClinicApi.js    # implementación simulada con el mismo contrato
├── components/             # UI reutilizable (layout, modales, formularios, laboratorio…)
├── context/                # AuthContext (sesión) y ToastContext (notificaciones)
├── hooks/                  # useAsync, usePatientHistory, usePageTitle
├── pages/                  # Login, Register, Dashboard, BookAppointment, history/*
├── styles/global.css       # design tokens + estilos
└── utils/                  # formato de fechas, laboratorio, texto
```

Los componentes nunca llaman a `fetch` directamente: todo pasa por `clinicApi`, igual que en el backend
los controladores solo hablan con `ClinicaFacade`.

## Contrato de la API esperado

Base: `${VITE_API_URL}/api/clinica`. JSON en `camelCase`. Los errores deben responder con
`{ "message": "..." }` y el código HTTP adecuado (400, 401, 404, 409, 422). El frontend muestra ese `message`.

| Método | Ruta | Fachada | Body / Query | Respuesta |
|---|---|---|---|---|
| POST | `/paciente` | `registrarPaciente` | `RegisterPatient` | `Patient` |
| POST | `/login` *(extra)* | — | `{ documentNumber, password }` | `Patient` (401 si falla) |
| GET | `/medicos?especialidad=CARDIOLOGY` | — | `especialidad` opcional | `Doctor[]` |
| GET | `/medicos/{id}/disponibilidad?fecha=YYYY-MM-DD` *(extra)* | — | — | `["08:00","08:30",…]` |
| POST | `/cita` | `agendarCita` | `{ patientId, specialty, doctorId, dateTime: "YYYY-MM-DDTHH:mm" }` | `Appointment` (409 si el horario está ocupado) |
| DELETE | `/cita/{id}` *(extra)* | — | — | `Appointment` |
| GET | `/historia/{patientId}` | `verHistoriaCompleta` | — | `FullHistory` |
| POST | `/prescripcion` | `generarPrescripcion` | `{ patientId, medications: [{ name, dose, durationDays }] }` | `Prescription` (422 si hay alergia) |
| POST | `/laboratorio` | `solicitarExamenes` | `{ patientId, exams: ["HEMOGRAM","GLUCOSE","LIPID_PROFILE"] }` | `LabOrder[]` |

### Modelos

```jsonc
// Patient (nunca incluir password en la respuesta)
{ "id": "PAT-1", "documentNumber": "1000000001", "firstName": "María", "lastName": "González",
  "email": "maria@example.com", "phone": "3001234567", "birthDate": "1990-04-12",
  "allergies": ["Penicilina"] }

// RegisterPatient = Patient sin id + "password"

// Doctor  — specialty: GENERAL_MEDICINE | CARDIOLOGY | DERMATOLOGY | PEDIATRICS | NEUROLOGY
{ "id": "DOC-1", "fullName": "Dra. Laura Méndez", "specialty": "GENERAL_MEDICINE", "yearsOfExperience": 12 }

// Appointment — status: SCHEDULED | COMPLETED | CANCELLED
{ "id": "APT-1", "patientId": "PAT-1", "doctorId": "DOC-3", "doctorName": "Dra. Camila Torres",
  "specialty": "CARDIOLOGY", "dateTime": "2026-10-20T09:30", "status": "SCHEDULED",
  "reminder": "Recuerda llegar 15 minutos antes…" }

// Prescription — status: ACTIVE | EXPIRED
{ "id": "RX-1", "patientId": "PAT-1", "doctorName": "Dra. Laura Méndez", "specialty": "GENERAL_MEDICINE",
  "issuedAt": "2026-09-16T10:20", "status": "ACTIVE",
  "medications": [{ "name": "Atorvastatina", "dose": "20 mg cada noche", "durationDays": 90 }] }

// LabOrder — examType: HEMOGRAM | GLUCOSE | LIPID_PROFILE ; result status: NORMAL | HIGH | LOW
{ "id": "LAB-1", "patientId": "PAT-1", "examType": "GLUCOSE", "requestedAt": "2026-09-18T07:05",
  "status": "COMPLETED",
  "results": [{ "parameter": "Glucosa en ayunas", "value": 94, "unit": "mg/dL",
                "referenceMin": 70, "referenceMax": 100, "status": "NORMAL" }] }

// FullHistory (respuesta de verHistoriaCompleta)
{ "patient": Patient,
  "upcomingAppointments": Appointment[],   // ascendente por fecha
  "pastAppointments": Appointment[],       // descendente
  "consultations": [{ "id", "date", "doctorName", "specialty", "reason", "diagnosis", "notes" }],
  "prescriptions": Prescription[],
  "labOrders": LabOrder[] }
```

En Java, usar `LocalDate`/`LocalDateTime` (Jackson los serializa como `"2026-10-20"` y `"2026-10-20T09:30:00"`,
ambos compatibles).
