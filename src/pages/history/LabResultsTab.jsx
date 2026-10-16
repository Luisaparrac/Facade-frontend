import { useEffect, useState } from 'react';
import { Check, FlaskConical, Plus } from 'lucide-react';
import { clinicApi } from '../../api';
import { useToast } from '../../context/ToastContext';
import { EXAM_TYPES } from '../../constants';
import { isOutOfRange } from '../../utils/lab';
import { LabOrderCard, RangeLegend } from '../../components/LabResults';
import { Modal } from '../../components/Modal';
import { Alert, Button, Card, EmptyState, Switch } from '../../components/ui';

function LabRequestModal({ open, onClose, patient, onCreated }) {
  const toast = useToast();
  const [selected, setSelected] = useState([]);
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setSelected([]);
      setServerError('');
    }
  }, [open]);

  const toggle = (code) => {
    setSelected((current) => (current.includes(code) ? current.filter((c) => c !== code) : [...current, code]));
    setServerError('');
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const orders = await clinicApi.requestLabExams({ patientId: patient.id, exams: selected });
      const total = Array.isArray(orders) ? orders.length : selected.length;
      toast.success(total === 1 ? 'Examen solicitado. Resultado disponible.' : `${total} exámenes solicitados. Resultados disponibles.`);
      onCreated();
    } catch (error) {
      setServerError(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={submitting ? () => {} : onClose}
      title="Solicitar exámenes de laboratorio"
      description="Selecciona uno o varios exámenes. Los resultados se generan con sus valores de referencia."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={!selected.length} loading={submitting}>
            Solicitar {selected.length > 0 && `(${selected.length})`}
          </Button>
        </>
      }
    >
      {serverError && <Alert tone="danger" title={serverError} />}
      <div className="check-cards">
        {Object.entries(EXAM_TYPES).map(([code, exam]) => {
          const checked = selected.includes(code);
          return (
            <label key={code} className={`check-card ${checked ? 'is-selected' : ''}`}>
              <input type="checkbox" checked={checked} onChange={() => toggle(code)} />
              <span className="check-box" aria-hidden><Check /></span>
              <span>
                <span className="option-title">{exam.label}</span>
                <span className="option-description">{exam.description}</span>
              </span>
            </label>
          );
        })}
      </div>
    </Modal>
  );
}

export function LabResultsTab({ labOrders, patient, onChanged }) {
  const [onlyAbnormal, setOnlyAbnormal] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const visible = onlyAbnormal
    ? labOrders.filter((order) => (order.results ?? []).some(isOutOfRange))
    : labOrders;

  return (
    <Card
      title="Resultados de laboratorio"
      subtitle="Cada valor se compara con su rango de referencia"
      actions={
        <>
          <Switch checked={onlyAbnormal} onChange={setOnlyAbnormal} label="Solo fuera de rango" />
          <Button size="sm" icon={Plus} onClick={() => setModalOpen(true)}>Solicitar exámenes</Button>
        </>
      }
    >
      <RangeLegend />
      {visible.length === 0 ? (
        <EmptyState
          icon={FlaskConical}
          title={onlyAbnormal ? '¡Todo en orden!' : 'Sin resultados de laboratorio'}
          description={onlyAbnormal
            ? 'Ninguno de tus resultados está fuera del rango de referencia.'
            : 'Solicita un hemograma, glicemia o perfil lipídico para ver tus resultados aquí.'}
        />
      ) : (
        <div className="stack-list">
          {visible.map((order) => <LabOrderCard key={order.id} order={order} />)}
        </div>
      )}

      <LabRequestModal
        open={modalOpen}
        patient={patient}
        onClose={() => setModalOpen(false)}
        onCreated={() => {
          setModalOpen(false);
          onChanged();
        }}
      />
    </Card>
  );
}
