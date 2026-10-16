import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Calendar, CreditCard, Mail, Phone, UserRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { usePageTitle } from '../hooks/usePageTitle';
import { calculateAge, toISODate } from '../utils/format';
import { AuthLayout } from '../components/AuthLayout';
import { PasswordField, TagInput, TextField } from '../components/FormFields';
import { Alert, Button } from '../components/ui';

const INITIAL_FORM = {
  firstName: '',
  lastName: '',
  documentNumber: '',
  birthDate: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
};

function validate(form) {
  const errors = {};
  if (form.firstName.trim().length < 2) errors.firstName = 'Ingresa tus nombres';
  if (form.lastName.trim().length < 2) errors.lastName = 'Ingresa tus apellidos';
  if (!/^\d{6,12}$/.test(form.documentNumber.trim())) errors.documentNumber = 'Debe tener entre 6 y 12 dígitos';

  if (!form.birthDate) errors.birthDate = 'Selecciona tu fecha de nacimiento';
  else {
    const age = calculateAge(form.birthDate);
    if (age < 0 || age > 120) errors.birthDate = 'Fecha de nacimiento no válida';
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) errors.email = 'Ingresa un correo válido';
  if (!/^\d{7,15}$/.test(form.phone.replace(/[\s-]/g, ''))) errors.phone = 'Ingresa un teléfono válido (7 a 15 dígitos)';

  if (form.password.length < 8) errors.password = 'Mínimo 8 caracteres';
  else if (!/\d/.test(form.password) || !/[a-zA-Z]/.test(form.password)) {
    errors.password = 'Debe combinar letras y números';
  }
  if (form.confirmPassword !== form.password) errors.confirmPassword = 'Las contraseñas no coinciden';
  return errors;
}

export default function RegisterPage() {
  usePageTitle('Crear cuenta');
  const { register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState(INITIAL_FORM);
  const [allergies, setAllergies] = useState([]);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
    setServerError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validationErrors = validate(form);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length) return;

    setSubmitting(true);
    try {
      const patient = await register({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        documentNumber: form.documentNumber.trim(),
        birthDate: form.birthDate,
        email: form.email.trim().toLowerCase(),
        phone: form.phone.replace(/[\s-]/g, ''),
        password: form.password,
        allergies,
      });
      toast.success(`Cuenta creada. ¡Bienvenido, ${patient.firstName}!`);
      navigate('/dashboard', { replace: true });
    } catch (error) {
      setServerError(error.message);
      setSubmitting(false);
    }
  };

  const fieldProps = (name) => ({ name, value: form[name], onChange: handleChange, error: errors[name] });

  return (
    <AuthLayout>
      <div className="auth-card auth-card-wide">
        <header className="auth-card-header">
          <h2>Crea tu cuenta</h2>
          <p>Regístrate para agendar citas y consultar tu información médica.</p>
        </header>

        {serverError && <Alert tone="danger" title={serverError} />}

        <form className="form-stack" onSubmit={handleSubmit} noValidate>
          <fieldset className="form-section">
            <legend>Datos personales</legend>
            <div className="form-grid">
              <TextField label="Nombres" icon={UserRound} autoComplete="given-name" placeholder="María Fernanda" {...fieldProps('firstName')} />
              <TextField label="Apellidos" autoComplete="family-name" placeholder="González Pérez" {...fieldProps('lastName')} />
              <TextField
                label="Número de documento"
                icon={CreditCard}
                inputMode="numeric"
                placeholder="1023456789"
                hint="Será tu usuario para iniciar sesión"
                {...fieldProps('documentNumber')}
              />
              <TextField
                label="Fecha de nacimiento"
                type="date"
                icon={Calendar}
                max={toISODate(new Date())}
                {...fieldProps('birthDate')}
              />
              <TextField label="Correo electrónico" type="email" icon={Mail} autoComplete="email" placeholder="tu@correo.com" {...fieldProps('email')} />
              <TextField label="Teléfono" type="tel" icon={Phone} autoComplete="tel" placeholder="300 123 4567" {...fieldProps('phone')} />
            </div>
          </fieldset>

          <fieldset className="form-section">
            <legend>Información médica</legend>
            <TagInput
              id="allergies"
              label="Alergias conocidas"
              value={allergies}
              onChange={setAllergies}
              placeholder="Ej. Penicilina — presiona Enter para agregar"
              hint="Se usan para validar tus prescripciones. Déjalo vacío si no tienes alergias."
            />
          </fieldset>

          <fieldset className="form-section">
            <legend>Seguridad</legend>
            <div className="form-grid">
              <PasswordField label="Contraseña" autoComplete="new-password" hint="Mínimo 8 caracteres, letras y números" {...fieldProps('password')} />
              <PasswordField label="Confirmar contraseña" autoComplete="new-password" {...fieldProps('confirmPassword')} />
            </div>
          </fieldset>

          <Button type="submit" size="lg" loading={submitting} iconRight={ArrowRight} className="btn-block">
            Crear cuenta
          </Button>
        </form>

        <p className="auth-switch">
          ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
        </p>
      </div>
    </AuthLayout>
  );
}
