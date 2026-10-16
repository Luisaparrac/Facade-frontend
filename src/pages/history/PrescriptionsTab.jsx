import { useEffect, useState } from 'react';
import { AlertTriangle, Pill, Plus, Trash2 } from 'lucide-react';
import { clinicApi } from '../../api';
import { useToast } from '../../context/ToastContext';
import { PRESCRIPTION_STATUS, getSpecialty } from '../../constants';
import { formatDate } from '../../utils/format';
import { findAllergyConflict } from '../../utils/text';
import { Modal } from '../../components/Modal';
import { Alert, Badge, Button, Card, EmptyState, IconTile, SegmentedControl } from '../../components/ui';

const FILTERS = [
  { value: 'ALL', label: 'Todas' },
  { value: 'ACTIVE', label: 'Activas' },
  { value: 'EXPIRED', label: 'Finalizadas' },
];

const emptyMedication = () => ({ name: '', dose: '', durationDays: '' });

function PrescriptionCard({ prescription }) {
  const status = PRESCRIPTION_STATUS[prescription.status] ?? { label: prescription.status, tone: 'neutral' };
  const specialty = prescription.specialty ? getSpecialty(prescription.specialty) : null;
  return (
    <article className={`rx-card ${prescription.status === 'ACTIVE' ? 'is-active' : ''}`}>
      <header className="rx-card-header">
        <div className="rx-card-title">
          <IconTile icon={Pill} tone="sky" />
          <div>
            <h3>Prescripción {prescription.id}</h3>
            <p className="text-muted text-sm">
              {formatDate(prescription.issuedAt)} · {prescription.doctorName}
              {specialty && ` · ${specialty.label}`}
            </p>
          </div>
        </div>
        <Badge tone={status.tone}>{status.label}</Badge>
      </header>
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th scope="col">Medicamento</th>
              <th scope="col">Dosis</th>
              <th scope="col">Duración</th>
            </tr>
          </thead>
          <tbody>
            {prescription.medications.map((medication, index) => (
              <tr key={`${medication.name}-${index}`}>
                <td className="cell-strong">{medication.name}</td>
                <td>{medication.dose}</td>
                <td>{medication.durationDays} {Number(medication.durationDays) === 1 ? 'día' : 'días'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </article>
  );
}

function validateMedications(medications) {
  return medications.map((medication) => {
    const errors = {};
    if (!medication.name.trim()) errors.name = 'Requerido';
    if (!medication.dose.trim()) errors.dose = 'Requerido';
    const days = Number(medication.durationDays);
    if (!Number.isInteger(days) || days < 1 || days > 365) errors.durationDays = '1 a 365';
    return errors;
  });
}

function PrescriptionFormModal({ open, onClose, patient, onCreated }) {
  const toast = useToast();
  const [medications, setMedications] = useState([emptyMedication()]);
  const [rowErrors, setRowErrors] = useState([]);
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const allergies = patient.allergies ?? [];

  useEffect(() => {
    if (open) {
      setMedications([emptyMedication()]);
      setRowErrors([]);
      setServerError('');
    }
  }, [open]);

  const updateMedication = (index, field, value) => {
    setMedications((current) => current.map((m, i) => (i === index ? { ...m, [field]: value } : m)));
    setRowErrors((current) => current.map((e, i) => (i === index ? { ...e, [field]: undefined } : e)));
    setServerError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const errors = validateMedications(medications);
    setRowErrors(errors);
    if (errors.some((e) => Object.keys(e).length)) return;

    setSubmitting(true);
    try {
      await clinicApi.createPrescription({
        patientId: patient.id,
        medications: medications.map((m) => ({
          name: m.name.trim(),
          dose: m.dose.trim(),
          durationDays: Number(m.durationDays),
        })),
      });
      toast.success('Prescripción generada correctamente');
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
      size="lg"
      title="Nueva prescripción"
      description="El sistema valida automáticamente los medicamentos contra las alergias registradas del paciente."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>Cancelar</Button>
          <Button type="submit" form="prescription-form" loading={submitting}>Generar prescripción</Button>
        </>
      }
    >
      <form id="prescription-form" className="form-stack" onSubmit={handleSubmit} noValidate>
        {allergies.length > 0 && (
          <div className="allergy-banner">
            <AlertTriangle aria-hidden />
            <span>Alergias del paciente:</span>
            {allergies.map((allergy) => <Badge key={allergy} tone="danger">{allergy}</Badge>)}
          </div>
        )}
        {serverError && <Alert tone="danger" title="No se pudo generar la prescripción">{serverError}</Alert>}

        <div className="med-rows">
          <div className="med-row med-row-head" aria-hidden>
            <span>Medicamento</span><span>Dosis y frecuencia</span><span>Días</span><span />
          </div>
          {medications.map((medication, index) => {
            const errors = rowErrors[index] ?? {};
            const conflict = findAllergyConflict(medication.name, allergies);
            return (
              <div key={index} className="med-row-wrap">
                <div className="med-row">
                  <input
                    className={`input ${errors.name || conflict ? 'is-invalid' : ''}`}
                    placeholder="Ej. Amoxicilina 500 mg"
                    aria-label={`Medicamento ${index + 1}`}
                    value={medication.name}
                    onChange={(e) => updateMedication(index, 'name', e.target.value)}
                  />
                  <input
                    className={`input ${errors.dose ? 'is-invalid' : ''}`}
                    placeholder="1 tableta cada 8 horas"
                    aria-label={`Dosis ${index + 1}`}
                    value={medication.dose}
                    onChange={(e) => updateMedication(index, 'dose', e.target.value)}
                  />
                  <input
                    className={`input ${errors.durationDays ? 'is-invalid' : ''}`}
                    type="number"
                    min="1"
                    max="365"
                    placeholder="7"
                    aria-label={`Duración en días ${index + 1}`}
                    value={medication.durationDays}
                    onChange={(e) => updateMedication(index, 'durationDays', e.target.value)}
                  />
                  <button
                    type="button"
                    className="icon-button"
                    onClick={() => {
                      setMedications((current) => current.filter((_, i) => i !== index));
                      setRowErrors((current) => current.filter((_, i) => i !== index));
                    }}
                    disabled={medications.length === 1}
                    aria-label={`Quitar medicamento ${index + 1}`}
                  >
                    <Trash2 aria-hidden />
                  </button>
                </div>
                {conflict && (
                  <p className="field-warning">
                    <AlertTriangle aria-hidden /> Posible conflicto con la alergia a {conflict}.
                  </p>
                )}
                {Object.keys(errors).length > 0 && (
                  <p className="field-error">
                    {errors.durationDays && !errors.name && !errors.dose
                      ? 'La duración debe estar entre 1 y 365 días.'
                      : 'Completa los campos marcados.'}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        <Button
          variant="secondary"
          size="sm"
          icon={Plus}
          className="self-start"
          onClick={() => setMedications((current) => [...current, emptyMedication()])}
        >
          Agregar medicamento
        </Button>
      </form>
    </Modal>
  );
}

export function PrescriptionsTab({ prescriptions, patient, onChanged }) {
  const [filter, setFilter] = useState('ALL');
  const [modalOpen, setModalOpen] = useState(false);
  const visible = filter === 'ALL' ? prescriptions : prescriptions.filter((p) => p.status === filter);

  return (
    <Card
      title="Prescripciones médicas"
      subtitle="Medicamentos formulados, dosis y duración del tratamiento"
      actions={
        <>
          <SegmentedControl label="Filtrar prescripciones" options={FILTERS} value={filter} onChange={setFilter} />
          <Button size="sm" icon={Plus} onClick={() => setModalOpen(true)}>Nueva prescripción</Button>
        </>
      }
    >
      {visible.length === 0 ? (
        <EmptyState
          icon={Pill}
          title={filter === 'ALL' ? 'Sin prescripciones' : 'No hay prescripciones con este filtro'}
          description="Las prescripciones emitidas por tus médicos aparecerán aquí."
        />
      ) : (
        <div className="stack-list">
          {visible.map((prescription) => <PrescriptionCard key={prescription.id} prescription={prescription} />)}
        </div>
      )}

      <PrescriptionFormModal
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
