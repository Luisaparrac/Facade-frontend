import { Clock, UserRound } from 'lucide-react';
import { APPOINTMENT_STATUS, getSpecialty } from '../constants';
import { formatMonthShort, formatRelativeDay, formatTime, formatWeekdayShort, toDate } from '../utils/format';
import { Badge, Button } from './ui';

export function AppointmentItem({ appointment, onCancel }) {
  const specialty = getSpecialty(appointment.specialty);
  const status = APPOINTMENT_STATUS[appointment.status] ?? { label: appointment.status, tone: 'neutral' };
  const date = toDate(appointment.dateTime);
  const isScheduled = appointment.status === 'SCHEDULED';

  return (
    <article className={`appt-item ${appointment.status === 'CANCELLED' ? 'is-cancelled' : ''}`}>
      <div className={`date-chip tone-${specialty.tone}`}>
        <span className="date-chip-month">{formatMonthShort(date)}</span>
        <span className="date-chip-day">{date.getDate()}</span>
      </div>
      <div className="appt-body">
        <div className="appt-title">
          <h3>{specialty.label}</h3>
          <Badge tone={status.tone}>{status.label}</Badge>
        </div>
        <p className="appt-meta"><UserRound aria-hidden /> {appointment.doctorName}</p>
        <p className="appt-meta">
          <Clock aria-hidden /> {formatWeekdayShort(date)} · {formatTime(date)}
          {isScheduled && <span className="appt-relative">{formatRelativeDay(date)}</span>}
        </p>
      </div>
      {onCancel && isScheduled && (
        <Button variant="ghost-danger" size="sm" onClick={() => onCancel(appointment)}>
          Cancelar
        </Button>
      )}
    </article>
  );
}
