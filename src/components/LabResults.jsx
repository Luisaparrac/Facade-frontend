import { AlertTriangle, CheckCircle2, FlaskConical } from 'lucide-react';
import { RESULT_STATUS, getExamType } from '../constants';
import { formatDate, formatNumber } from '../utils/format';
import { getResultStatus, isOutOfRange } from '../utils/lab';
import { Badge, IconTile } from './ui';

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

/** Horizontal scale: green band = reference range, marker = patient value. */
export function RangeBar({ value, min, max, status, unit }) {
  const span = max - min || 1;
  const lower = Math.max(0, min - span * 0.6);
  const upper = max + span * 0.6;
  const toPercent = (v) => clamp(((v - lower) / (upper - lower)) * 100, 0, 100);
  const start = toPercent(min);
  const end = toPercent(max);

  return (
    <div
      className="range-bar"
      role="img"
      aria-label={`Valor ${formatNumber(value)} ${unit}, rango normal ${formatNumber(min)} a ${formatNumber(max)}`}
    >
      <div className="range-track">
        <div className="range-normal" style={{ left: `${start}%`, width: `${end - start}%` }} />
      </div>
      <span className={`range-marker status-${status.toLowerCase()}`} style={{ left: `${toPercent(value)}%` }} />
    </div>
  );
}

function LabResultRow({ result }) {
  const status = getResultStatus(result);
  const meta = RESULT_STATUS[status] ?? RESULT_STATUS.NORMAL;
  return (
    <li className="lab-row">
      <div className="lab-row-info">
        <span className="lab-param">{result.parameter}</span>
        <span className="lab-ref">
          Ref. {formatNumber(result.referenceMin)} – {formatNumber(result.referenceMax)} {result.unit}
        </span>
      </div>
      <RangeBar
        value={result.value}
        min={result.referenceMin}
        max={result.referenceMax}
        status={status}
        unit={result.unit}
      />
      <div className="lab-row-value">
        <span className={`lab-value status-${status.toLowerCase()}`}>
          {formatNumber(result.value)} <small>{result.unit}</small>
        </span>
        <Badge tone={meta.tone}>{meta.label}</Badge>
      </div>
    </li>
  );
}

export function LabOrderCard({ order }) {
  const exam = getExamType(order.examType);
  const results = order.results ?? [];
  const abnormal = results.filter(isOutOfRange).length;

  return (
    <article className="lab-card">
      <header className="lab-card-header">
        <div className="lab-card-title">
          <IconTile icon={FlaskConical} tone="violet" />
          <div>
            <h3>{exam.label}</h3>
            <p className="text-muted text-sm">{formatDate(order.requestedAt)} · Orden {order.id}</p>
          </div>
        </div>
        {results.length === 0 ? (
          <Badge tone="info">En proceso</Badge>
        ) : abnormal > 0 ? (
          <Badge tone="danger" icon={AlertTriangle}>
            {abnormal} fuera de rango
          </Badge>
        ) : (
          <Badge tone="success" icon={CheckCircle2}>Todo en rango</Badge>
        )}
      </header>
      {results.length > 0 && (
        <ul className="lab-results">
          {results.map((result) => <LabResultRow key={result.parameter} result={result} />)}
        </ul>
      )}
    </article>
  );
}

export function RangeLegend() {
  return (
    <div className="range-legend">
      <span><i className="legend-band" /> Rango de referencia</span>
      <span><i className="legend-dot status-normal" /> Normal</span>
      <span><i className="legend-dot status-high" /> Alto</span>
      <span><i className="legend-dot status-low" /> Bajo</span>
    </div>
  );
}
