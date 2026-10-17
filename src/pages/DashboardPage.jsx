import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle, ArrowRight, BellRing, CalendarClock, CalendarPlus, Clock, FlaskConical, Pill, ShieldAlert, UserRound,
} from 'lucide-react';
import { clinicApi } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { usePageTitle } from '../hooks/usePageTitle';
import { usePatientHistory } from '../hooks/usePatientHistory';
import { getSpecialty } from '../constants';
import { formatLongDate, formatRelativeDay, formatTime, greetingForNow } from '../utils/format';
import { countOutOfRange, latestOrderPerExam } from '../utils/lab';
import { AppointmentItem } from '../components/AppointmentItem';
import { LabOrderCard } from '../components/LabResults';
import { ConfirmDialog } from '../components/Modal';
import { Card, EmptyState, ErrorState, IconTile, PageHeader, Skeleton } from '../components/ui';

function StatCard({ icon, tone, label, value, hint }) {
  return (
    <div className="stat-card">
      <IconTile icon={icon} tone={tone} />
      <div>
        <p className="stat-label">{label}</p>
        <p className="stat-value">{value}</p>
        {hint && <p className="stat-hint">{hint}</p>}
      </div>
    </div>
  );
}

function NextAppointmentHero({ appointment }) {
  if (!appointment) {
    return (
      <div className="hero-card hero-card-empty">
        <div>
          <p className="hero-eyebrow">Próxima cita</p>
          <h2>No tienes citas programadas</h2>
          <p>Agenda una cita con nuestros especialistas en menos de un minuto.</p>
        </div>
        <Link to="/appointments/new" className="btn btn-light btn-md">
          <CalendarPlus className="icon" aria-hidden /> <span>Agendar cita</span>
        </Link>
      </div>
    );
  }

  const specialty = getSpecialty(appointment.specialty);
  const SpecialtyIcon = specialty.icon;
  return (
    <div className="hero-card">
      <div className="hero-main">
        <p className="hero-eyebrow">Tu próxima cita · {formatRelativeDay(appointment.dateTime)}</p>
        <h2>{formatLongDate(appointment.dateTime)}</h2>
        <div className="hero-meta">
          <span><Clock aria-hidden /> {formatTime(appointment.dateTime)}</span>
          <span><SpecialtyIcon aria-hidden /> {specialty.label}</span>
          <span><UserRound aria-hidden /> {appointment.doctorName}</span>
        </div>
      </div>
      <div className="hero-reminder">
        <BellRing aria-hidden />
        <p>{appointment.reminder ?? 'Recuerda llegar 15 minutos antes y traer tu documento de identidad. Si no puedes asistir, cancela con anticipación.'}</p>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="page" aria-busy="true">
      <Skeleton height={34} width="40%" />
      <Skeleton height={150} radius={20} />
      <div className="stats-grid">
        {Array.from({ length: 4 }, (_, i) => <Skeleton key={i} height={96} radius={16} />)}
      </div>
      <div className="dashboard-grid">
        <Skeleton height={320} radius={16} />
        <Skeleton height={320} radius={16} />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  usePageTitle('Inicio');
  const { patient } = useAuth();
  const toast = useToast();
  const { data, loading, error, reload } = usePatientHistory();
  const [appointmentToCancel, setAppointmentToCancel] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  if (loading && !data) return <DashboardSkeleton />;
  if (error && !data) return <ErrorState message={error.message} onRetry={reload} />;

  const { upcomingAppointments = [], prescriptions = [], labOrders = [] } = data;
  const profile = data.patient ?? patient;
  const activePrescriptions = prescriptions.filter((p) => p.status === 'ACTIVE');
  const latestOrders = latestOrderPerExam(labOrders);
  const outOfRange = countOutOfRange(latestOrders);
  const allergies = profile.allergies ?? [];

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await clinicApi.cancelAppointment(appointmentToCancel.id);
      toast.success('La cita fue cancelada');
      setAppointmentToCancel(null);
      reload();
    } catch (cancelError) {
      toast.error(cancelError.message);
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="page">
      <PageHeader
        eyebrow={formatLongDate(new Date())}
        title={`${greetingForNow()}, ${profile.firstName}`}
        subtitle="Este es el resumen de tu salud y tus próximas actividades."
        actions={
          <Link to="/appointments/new" className="btn btn-primary btn-md">
            <CalendarPlus className="icon" aria-hidden /> <span>Agendar cita</span>
          </Link>
        }
      />

      <NextAppointmentHero appointment={upcomingAppointments[0]} />

      <div className="stats-grid">
        <StatCard
          icon={CalendarClock}
          tone="teal"
          label="Próximas citas"
          value={upcomingAppointments.length}
          hint={upcomingAppointments[0] ? `La siguiente: ${formatRelativeDay(upcomingAppointments[0].dateTime).toLowerCase()}` : 'Sin citas pendientes'}
        />
        <StatCard
          icon={Pill}
          tone="sky"
          label="Prescripciones activas"
          value={activePrescriptions.length}
          hint={`${prescriptions.length} en total`}
        />
        <StatCard
          icon={outOfRange ? AlertTriangle : FlaskConical}
          tone={outOfRange ? 'rose' : 'violet'}
          label="Valores fuera de rango"
          value={outOfRange}
          hint={latestOrders.length ? 'En tus últimos exámenes' : 'Sin exámenes registrados'}
        />
        <StatCard
          icon={ShieldAlert}
          tone="amber"
          label="Alergias registradas"
          value={allergies.length}
          hint={allergies.length ? allergies.join(', ') : 'Ninguna registrada'}
        />
      </div>

      <div className="dashboard-grid">
        <Card
          title="Próximas citas"
          subtitle="Tus citas programadas"
          actions={<Link to="/appointments/new" className="link-arrow">Nueva <ArrowRight aria-hidden /></Link>}
        >
          {upcomingAppointments.length === 0 ? (
            <EmptyState
              icon={CalendarClock}
              title="Sin citas programadas"
              description="Cuando agendes una cita aparecerá aquí."
            />
          ) : (
            <div className="stack-list">
              {upcomingAppointments.map((appointment) => (
                <AppointmentItem key={appointment.id} appointment={appointment} onCancel={setAppointmentToCancel} />
              ))}
            </div>
          )}
        </Card>

        <Card
          title="Últimos resultados"
          subtitle="Resultado más reciente de cada examen"
          actions={<Link to="/history/labs" className="link-arrow">Ver todos <ArrowRight aria-hidden /></Link>}
        >
          {latestOrders.length === 0 ? (
            <EmptyState
              icon={FlaskConical}
              title="Sin resultados de laboratorio"
              description="Solicita exámenes desde tu historia clínica."
            />
          ) : (
            <div className="stack-list">
              {latestOrders.slice(0, 2).map((order) => <LabOrderCard key={order.id} order={order} />)}
            </div>
          )}
        </Card>
      </div>

      <ConfirmDialog
        open={Boolean(appointmentToCancel)}
        title="Cancelar cita"
        message={appointmentToCancel
          ? `¿Seguro que deseas cancelar tu cita de ${getSpecialty(appointmentToCancel.specialty).label} con ${appointmentToCancel.doctorName} el ${formatLongDate(appointmentToCancel.dateTime).toLowerCase()} a las ${formatTime(appointmentToCancel.dateTime)}?`
          : ''}
        confirmLabel="Sí, cancelar cita"
        loading={cancelling}
        onConfirm={handleCancel}
        onClose={() => setAppointmentToCancel(null)}
      />
    </div>
  );
}
