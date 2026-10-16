import { CalendarClock, Stethoscope } from 'lucide-react';
import { getSpecialty } from '../../constants';
import { formatDate, formatTime } from '../../utils/format';
import { AppointmentItem } from '../../components/AppointmentItem';
import { Badge, Card, EmptyState } from '../../components/ui';

export function ConsultationsTab({ consultations, pastAppointments }) {
  return (
    <div className="split-layout">
      <Card title="Consultas médicas" subtitle="Motivo, diagnóstico e indicaciones de cada atención">
        {consultations.length === 0 ? (
          <EmptyState
            icon={Stethoscope}
            title="Aún no tienes consultas registradas"
            description="Después de tu primera atención verás aquí el diagnóstico y las indicaciones."
          />
        ) : (
          <ol className="timeline">
            {consultations.map((consultation) => {
              const specialty = getSpecialty(consultation.specialty);
              return (
                <li key={consultation.id} className="timeline-item">
                  <span className={`timeline-dot tone-${specialty.tone}`} aria-hidden />
                  <article className="timeline-content">
                    <header className="timeline-head">
                      <div>
                        <h3>{consultation.reason}</h3>
                        <p className="text-muted text-sm">{consultation.doctorName}</p>
                      </div>
                      <div className="timeline-date">
                        <Badge tone={specialty.tone}>{specialty.label}</Badge>
                        <time dateTime={consultation.date}>
                          {formatDate(consultation.date)} · {formatTime(consultation.date)}
                        </time>
                      </div>
                    </header>
                    <dl className="detail-list">
                      <div>
                        <dt>Diagnóstico</dt>
                        <dd>{consultation.diagnosis}</dd>
                      </div>
                      {consultation.notes && (
                        <div>
                          <dt>Indicaciones</dt>
                          <dd>{consultation.notes}</dd>
                        </div>
                      )}
                    </dl>
                  </article>
                </li>
              );
            })}
          </ol>
        )}
      </Card>

      <Card title="Historial de citas" subtitle="Citas atendidas y canceladas">
        {pastAppointments.length === 0 ? (
          <EmptyState icon={CalendarClock} title="Sin citas anteriores" />
        ) : (
          <div className="stack-list">
            {pastAppointments.map((appointment) => (
              <AppointmentItem key={appointment.id} appointment={appointment} />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
