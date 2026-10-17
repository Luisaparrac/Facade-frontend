**🌐 Despliegue (PROD): https://facade-frontend-three.vercel.app**

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
Cuenta demo: documento `1000000001`, contraseña `Demo1234!`.

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

## Backend

Repositorio: https://github.com/Luisaparrac/Facade-backend (Spring Boot 3.5, Java 17).

Base: `${VITE_API_URL}/api/clinic`. Autenticación con **Bearer token** (lo devuelve el login).
La traducción entre los DTOs del backend y los modelos de la UI está en `src/api/httpClinicApi.js`.

| Método | Ruta | Uso en el frontend |
|---|---|---|
| POST | `/patient` | Registro (luego hace login automático) |
| POST | `/auth/login` | Inicio de sesión → `{ token, patient }` |
| POST | `/auth/logout` | Cerrar sesión |
| GET | `/doctors?specialty=&date=` | Médicos por especialidad y horarios disponibles (`availableSlots`) |
| POST | `/appointment` | Agendar cita → `{ appointment, reminders[] }` |
| DELETE | `/appointment/{id}` | Cancelar cita |
| GET | `/history/{patientId}` | Historia completa (dashboard e historia clínica) |
| POST | `/prescription` | Generar prescripción (409 si hay conflicto con alergias) |
| POST | `/lab` | Solicitar exámenes `CBC`, `GLUCOSE`, `LIPID_PROFILE` |

### Probar todo en local

```bash
# Backend (requiere Java 17 y Maven)
cd Facade-backend
mvn spring-boot:run          # http://localhost:8080  (Swagger: /swagger-ui.html)

# Frontend
echo VITE_API_URL=http://localhost:8080 > .env
npm run dev                  # http://localhost:5173
```

Cuenta demo sembrada por el backend: documento `1000000001`, contraseña `Demo1234!`.

### CORS en producción

El backend lee los orígenes permitidos de la variable `FRONTEND_URL` (separados por coma, admite patrones):

```
FRONTEND_URL=https://<proyecto>.vercel.app,http://localhost:5173
```
