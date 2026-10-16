import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { CalendarDays, FileText, FlaskConical, Mail, Phone, Pill, ShieldAlert } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { usePageTitle } from '../../hooks/usePageTitle';
import { usePatientHistory } from '../../hooks/usePatientHistory';
import { calculateAge, formatDate } from '../../utils/format';
import { Avatar, Badge, ErrorState, PageHeader, Skeleton } from '../../components/ui';
import { ConsultationsTab } from './ConsultationsTab';
import { PrescriptionsTab } from './PrescriptionsTab';
import { LabResultsTab } from './LabResultsTab';

const TABS = [
  { key: 'consultations', path: '/history', label: 'Consultas', icon: FileText },
  { key: 'prescriptions', path: '/history/prescriptions', label: 'Prescripciones', icon: Pill },
  { key: 'labs', path: '/history/labs', label: 'Laboratorios', icon: FlaskConical },
];

function PatientSummary({ patient }) {
  const age = calculateAge(patient.birthDate);
  const allergies = patient.allergies ?? [];
  return (
    <section className="patient-summary">
      <div className="patient-identity">
        <Avatar firstName={patient.firstName} lastName={patient.lastName} size="xl" />
        <div>
          <h2>{patient.firstName} {patient.lastName}</h2>
          <p className="text-muted">
            CC {patient.documentNumber}
            {age != null && ` · ${age} años`}
          </p>
        </div>
      </div>
      <dl className="patient-facts">
        <div><dt><CalendarDays aria-hidden /> Nacimiento</dt><dd>{patient.birthDate ? formatDate(patient.birthDate) : '—'}</dd></div>
        <div><dt><Mail aria-hidden /> Correo</dt><dd>{patient.email ?? '—'}</dd></div>
        <div><dt><Phone aria-hidden /> Teléfono</dt><dd>{patient.phone ?? '—'}</dd></div>
        <div>
          <dt><ShieldAlert aria-hidden /> Alergias</dt>
          <dd className="chip-row">
            {allergies.length
              ? allergies.map((allergy) => <Badge key={allergy} tone="danger">{allergy}</Badge>)
              : <span className="text-muted">Ninguna registrada</span>}
          </dd>
        </div>
      </dl>
    </section>
  );
}

function HistorySkeleton() {
  return (
    <div className="page" aria-busy="true">
      <Skeleton height={34} width="35%" />
      <Skeleton height={140} radius={16} />
      <Skeleton height={48} width="60%" radius={12} />
      <Skeleton height={360} radius={16} />
    </div>
  );
}

export default function MedicalHistoryPage() {
  const { tab = 'consultations' } = useParams();
  const navigate = useNavigate();
  const { patient } = useAuth();
  const { data, loading, error, reload } = usePatientHistory();
  const activeTab = TABS.find((t) => t.key === tab);
  usePageTitle(activeTab ? `Historia clínica · ${activeTab.label}` : 'Historia clínica');

  if (!activeTab) return <Navigate to="/history" replace />;
  if (loading && !data) return <HistorySkeleton />;
  if (error && !data) return <ErrorState message={error.message} onRetry={reload} />;

  const profile = data.patient ?? patient;
  const counts = {
    consultations: data.consultations?.length ?? 0,
    prescriptions: data.prescriptions?.length ?? 0,
    labs: data.labOrders?.length ?? 0,
  };

  return (
    <div className="page">
      <PageHeader
        title="Historia clínica"
        subtitle="Información consolidada de tus consultas, prescripciones y exámenes."
      />
      <PatientSummary patient={profile} />

      <nav className="tabs" role="tablist" aria-label="Secciones de la historia clínica">
        {TABS.map(({ key, path, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={key === activeTab.key}
            className={`tab ${key === activeTab.key ? 'is-active' : ''}`}
            onClick={() => navigate(path)}
          >
            <Icon aria-hidden />
            <span>{label}</span>
            <span className="tab-count">{counts[key]}</span>
          </button>
        ))}
      </nav>

      <div role="tabpanel" className="tab-panel" key={activeTab.key}>
        {activeTab.key === 'consultations' && (
          <ConsultationsTab consultations={data.consultations ?? []} pastAppointments={data.pastAppointments ?? []} />
        )}
        {activeTab.key === 'prescriptions' && (
          <PrescriptionsTab prescriptions={data.prescriptions ?? []} patient={profile} onChanged={reload} />
        )}
        {activeTab.key === 'labs' && (
          <LabResultsTab labOrders={data.labOrders ?? []} patient={profile} onChanged={reload} />
        )}
      </div>
    </div>
  );
}
