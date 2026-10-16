import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, ArrowRight, BellRing, CalendarDays, Check, CheckCircle2, Clock, Moon, Stethoscope, Sun, UserRound,
} from 'lucide-react';
import { clinicApi } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useAsync } from '../hooks/useAsync';
import { usePageTitle } from '../hooks/usePageTitle';
import { getSpecialty } from '../constants';
import {
  formatLongDate, formatMonthShort, formatSlot, formatWeekdayShort, getInitials, toDate, toISODate,
} from '../utils/format';
import { Alert, Button, Card, EmptyState, ErrorState, IconTile, PageHeader, Skeleton } from '../components/ui';

const STEPS = ['Especialidad', 'Médico', 'Fecha y hora', 'Confirmación'];
const BOOKING_WINDOW_DAYS = 14;

function buildBookableDates() {
  const dates = [];
  const cursor = new Date();
  while (dates.length < BOOKING_WINDOW_DAYS) {
    if (cursor.getDay() !== 0) dates.push(toISODate(cursor)); // no Sunday service
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates;
}

function Stepper({ current, onStepClick }) {
  return (
    <ol className="stepper">
      {STEPS.map((label, index) => {
        const state = index < current ? 'is-done' : index === current ? 'is-active' : '';
        return (
          <li key={label} className={`step ${state}`}>
            <button type="button" onClick={() => onStepClick(index)} disabled={index >= current}>
              <span className="step-index">{index < current ? <Check aria-hidden /> : index + 1}</span>
              <span className="step-label">{label}</span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}

function OptionSkeletons({ count = 3, height = 120 }) {
  return (
    <div className="option-grid">
      {Array.from({ length: count }, (_, i) => <Skeleton key={i} height={height} radius={14} />)}
    </div>
  );
}

function SpecialtyStep({ doctorsRequest, selected, onSelect }) {
  const specialties = useMemo(() => {
    const counts = new Map();
    (doctorsRequest.data ?? []).forEach((doctor) => {
      counts.set(doctor.specialty, (counts.get(doctor.specialty) ?? 0) + 1);
    });
    return [...counts.entries()].map(([code, doctorCount]) => ({ code, doctorCount, ...getSpecialty(code) }));
  }, [doctorsRequest.data]);

  if (doctorsRequest.loading) return <OptionSkeletons />;
  if (doctorsRequest.error) return <ErrorState message={doctorsRequest.error.message} onRetry={doctorsRequest.reload} />;

  return (
    <div className="option-grid">
      {specialties.map(({ code, label, description, icon, tone, doctorCount }) => (
        <button
          key={code}
          type="button"
          className={`option-card ${selected === code ? 'is-selected' : ''}`}
          onClick={() => onSelect(code)}
        >
          <IconTile icon={icon} tone={tone} size="lg" />
          <span className="option-title">{label}</span>
          <span className="option-description">{description}</span>
          <span className="option-footer">{doctorCount} {doctorCount === 1 ? 'médico disponible' : 'médicos disponibles'}</span>
        </button>
      ))}
    </div>
  );
}

function DoctorStep({ doctorsRequest, selected, onSelect }) {
  if (doctorsRequest.loading) return <OptionSkeletons count={2} height={96} />;
  if (doctorsRequest.error) return <ErrorState message={doctorsRequest.error.message} onRetry={doctorsRequest.reload} />;
  const doctors = doctorsRequest.data ?? [];
  if (!doctors.length) {
    return <EmptyState icon={UserRound} title="Sin médicos disponibles" description="Prueba con otra especialidad." />;
  }

  return (
    <div className="option-grid option-grid-doctors">
      {doctors.map((doctor) => {
        const [firstName, ...rest] = doctor.fullName.replace(/^Dra?\.\s*/, '').split(' ');
        return (
          <button
            key={doctor.id}
            type="button"
            className={`doctor-card ${selected?.id === doctor.id ? 'is-selected' : ''}`}
            onClick={() => onSelect(doctor)}
          >
            <span className="avatar avatar-lg" aria-hidden>{getInitials(firstName, rest.at(-1))}</span>
            <span className="doctor-info">
              <span className="option-title">{doctor.fullName}</span>
              <span className="option-description">{getSpecialty(doctor.specialty).label}</span>
              {doctor.yearsOfExperience != null && (
                <span className="doctor-exp">{doctor.yearsOfExperience} años de experiencia</span>
              )}
            </span>
            <span className="doctor-check" aria-hidden><Check /></span>
          </button>
        );
      })}
    </div>
  );
}

function SlotGroup({ title, icon: Icon, slots, selected, onSelect }) {
  if (!slots.length) return null;
  return (
    <div className="slot-group">
      <p className="slot-group-title"><Icon aria-hidden /> {title}</p>
      <div className="slot-grid">
        {slots.map((time) => (
          <button
            key={time}
            type="button"
            className={`slot ${selected === time ? 'is-selected' : ''}`}
            onClick={() => onSelect(time)}
            aria-pressed={selected === time}
          >
            {formatSlot(time)}
          </button>
        ))}
      </div>
    </div>
  );
}

function DateTimeStep({ dates, selectedDate, selectedTime, availability, onSelectDate, onSelectTime }) {
  const slots = availability.data ?? [];
  const morning = slots.filter((time) => time < '12:00');
  const afternoon = slots.filter((time) => time >= '12:00');

  return (
    <div className="datetime-step">
      <div className="date-strip" role="listbox" aria-label="Fechas disponibles">
        {dates.map((iso) => {
          const date = toDate(iso);
          return (
            <button
              key={iso}
              type="button"
              role="option"
              aria-selected={selectedDate === iso}
              className={`date-option ${selectedDate === iso ? 'is-selected' : ''}`}
              onClick={() => onSelectDate(iso)}
            >
              <span className="date-option-weekday">{formatWeekdayShort(date)}</span>
              <span className="date-option-day">{date.getDate()}</span>
              <span className="date-option-month">{formatMonthShort(date)}</span>
            </button>
          );
        })}
      </div>

      <div className="slots-panel">
        <p className="slots-heading">{formatLongDate(selectedDate)}</p>
        {availability.loading ? (
          <div className="slot-grid">
            {Array.from({ length: 8 }, (_, i) => <Skeleton key={i} height={42} radius={10} />)}
          </div>
        ) : availability.error ? (
          <ErrorState message={availability.error.message} onRetry={availability.reload} />
        ) : slots.length === 0 ? (
          <EmptyState icon={CalendarDays} title="Sin horarios disponibles" description="Selecciona otra fecha para ver más opciones." />
        ) : (
          <>
            <SlotGroup title="Mañana" icon={Sun} slots={morning} selected={selectedTime} onSelect={onSelectTime} />
            <SlotGroup title="Tarde" icon={Moon} slots={afternoon} selected={selectedTime} onSelect={onSelectTime} />
          </>
        )}
      </div>
    </div>
  );
}

function SummaryPanel({ selection }) {
  const specialty = selection.specialty ? getSpecialty(selection.specialty) : null;
  const rows = [
    { icon: Stethoscope, label: 'Especialidad', value: specialty?.label },
    { icon: UserRound, label: 'Médico', value: selection.doctor?.fullName },
    { icon: CalendarDays, label: 'Fecha', value: selection.date && formatLongDate(selection.date) },
    { icon: Clock, label: 'Hora', value: selection.time && formatSlot(selection.time) },
  ];
  return (
    <Card title="Resumen de la cita" className="summary-card">
      <ul className="summary-list">
        {rows.map(({ icon: Icon, label, value }) => (
          <li key={label} className={value ? 'is-filled' : ''}>
            <Icon aria-hidden />
            <div>
              <span className="summary-label">{label}</span>
              <span className="summary-value">{value ?? 'Sin seleccionar'}</span>
            </div>
          </li>
        ))}
      </ul>
      <p className="summary-note">Puedes cancelar tu cita desde el inicio hasta antes de la hora programada.</p>
    </Card>
  );
}

function BookingSuccess({ appointment, onBookAnother }) {
  const specialty = getSpecialty(appointment.specialty);
  return (
    <div className="page">
      <div className="success-card">
        <span className="success-icon"><CheckCircle2 aria-hidden /></span>
        <h1>¡Tu cita quedó agendada!</h1>
        <p className="text-muted">Te esperamos. Este es el detalle de tu cita:</p>
        <dl className="success-details">
          <div><dt>Especialidad</dt><dd>{specialty.label}</dd></div>
          <div><dt>Médico</dt><dd>{appointment.doctorName}</dd></div>
          <div><dt>Fecha</dt><dd>{formatLongDate(appointment.dateTime)}</dd></div>
          <div><dt>Hora</dt><dd>{formatSlot(appointment.dateTime.slice(11, 16))}</dd></div>
          <div><dt>Código</dt><dd>{appointment.id}</dd></div>
        </dl>
        {appointment.reminder && (
          <Alert tone="info" title="Recordatorio">
            <span className="alert-inline"><BellRing aria-hidden /> {appointment.reminder}</span>
          </Alert>
        )}
        <div className="success-actions">
          <Button variant="secondary" onClick={onBookAnother}>Agendar otra cita</Button>
          <Link to="/dashboard" className="btn btn-primary btn-md"><span>Ir al inicio</span></Link>
        </div>
      </div>
    </div>
  );
}

const EMPTY_SELECTION = { specialty: null, doctor: null, date: null, time: null };

export default function BookAppointmentPage() {
  usePageTitle('Agendar cita');
  const { patient } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const dates = useMemo(buildBookableDates, []);

  const [step, setStep] = useState(0);
  const [selection, setSelection] = useState(EMPTY_SELECTION);
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState(null);

  const allDoctors = useAsync(() => clinicApi.getDoctors(), []);
  const specialtyDoctors = useAsync(
    () => (selection.specialty ? clinicApi.getDoctors(selection.specialty) : null),
    [selection.specialty],
  );
  const availability = useAsync(
    () => (selection.doctor && selection.date ? clinicApi.getDoctorAvailability(selection.doctor.id, selection.date) : null),
    [selection.doctor?.id, selection.date],
  );

  const select = (patch, nextStep) => {
    setSelection((current) => ({ ...current, ...patch }));
    if (nextStep !== undefined) setStep(nextStep);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const appointment = await clinicApi.bookAppointment({
        patientId: patient.id,
        specialty: selection.specialty,
        doctorId: selection.doctor.id,
        dateTime: `${selection.date}T${selection.time}`,
      });
      setConfirmed(appointment);
      toast.success('Cita agendada correctamente');
    } catch (error) {
      toast.error(error.message);
      if (error.status === 409) {
        select({ time: null }, 2);
        availability.reload();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const resetFlow = () => {
    setConfirmed(null);
    setSelection(EMPTY_SELECTION);
    setStep(0);
  };

  if (confirmed) return <BookingSuccess appointment={confirmed} onBookAnother={resetFlow} />;

  const stepContent = [
    {
      title: '¿Qué especialidad necesitas?',
      subtitle: 'Selecciona el área médica para tu consulta.',
      body: (
        <SpecialtyStep
          doctorsRequest={allDoctors}
          selected={selection.specialty}
          onSelect={(specialty) => select({ specialty, doctor: null, time: null }, 1)}
        />
      ),
    },
    {
      title: 'Elige a tu médico',
      subtitle: `Profesionales de ${selection.specialty ? getSpecialty(selection.specialty).label.toLowerCase() : ''} disponibles.`,
      body: (
        <DoctorStep
          doctorsRequest={specialtyDoctors}
          selected={selection.doctor}
          onSelect={(doctor) => select({ doctor, date: selection.date ?? dates[0], time: null }, 2)}
        />
      ),
    },
    {
      title: 'Selecciona fecha y hora',
      subtitle: `Agenda disponible para los próximos ${BOOKING_WINDOW_DAYS} días hábiles.`,
      body: selection.date && (
        <DateTimeStep
          dates={dates}
          selectedDate={selection.date}
          selectedTime={selection.time}
          availability={availability}
          onSelectDate={(date) => select({ date, time: null })}
          onSelectTime={(time) => select({ time })}
        />
      ),
    },
    {
      title: 'Confirma tu cita',
      subtitle: 'Revisa los datos antes de confirmar.',
      body: (
        <div className="confirm-step">
          <Alert tone="info" title="Antes de confirmar">
            Llega 15 minutos antes, con tu documento de identidad. Si no puedes asistir, cancela la cita con anticipación
            para liberar el espacio a otro paciente.
          </Alert>
          <dl className="success-details">
            <div><dt>Paciente</dt><dd>{patient.firstName} {patient.lastName}</dd></div>
            <div><dt>Documento</dt><dd>{patient.documentNumber}</dd></div>
            <div><dt>Especialidad</dt><dd>{selection.specialty && getSpecialty(selection.specialty).label}</dd></div>
            <div><dt>Médico</dt><dd>{selection.doctor?.fullName}</dd></div>
            <div><dt>Fecha</dt><dd>{selection.date && formatLongDate(selection.date)}</dd></div>
            <div><dt>Hora</dt><dd>{selection.time && formatSlot(selection.time)}</dd></div>
          </dl>
        </div>
      ),
    },
  ][step];

  const goBack = () => (step === 0 ? navigate(-1) : setStep(step - 1));

  return (
    <div className="page">
      <PageHeader title="Agendar nueva cita" subtitle="Reserva tu consulta en cuatro pasos." />
      <Stepper current={step} onStepClick={setStep} />

      <div className="booking-layout">
        <Card title={stepContent.title} subtitle={stepContent.subtitle} className="booking-card">
          {stepContent.body}
          <div className="booking-actions">
            <Button variant="ghost" icon={ArrowLeft} onClick={goBack} disabled={submitting}>
              {step === 0 ? 'Volver' : 'Anterior'}
            </Button>
            {step === 2 && (
              <Button iconRight={ArrowRight} disabled={!selection.time} onClick={() => setStep(3)}>
                Continuar
              </Button>
            )}
            {step === 3 && (
              <Button icon={Check} loading={submitting} onClick={handleSubmit}>
                Confirmar cita
              </Button>
            )}
          </div>
        </Card>
        <SummaryPanel selection={selection} />
      </div>
    </div>
  );
}
