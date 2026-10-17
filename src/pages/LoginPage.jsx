import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, CreditCard, Sparkles } from 'lucide-react';
import { DEMO_CREDENTIALS } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { usePageTitle } from '../hooks/usePageTitle';
import { AuthLayout } from '../components/AuthLayout';
import { PasswordField, TextField } from '../components/FormFields';
import { Alert, Button } from '../components/ui';

function validate({ documentNumber, password }) {
  const errors = {};
  if (!documentNumber.trim()) errors.documentNumber = 'Ingresa tu número de documento';
  else if (!/^[A-Za-z0-9]{5,15}$/.test(documentNumber.trim())) errors.documentNumber = 'Entre 5 y 15 letras o dígitos';
  if (!password) errors.password = 'Ingresa tu contraseña';
  return errors;
}

export default function LoginPage() {
  usePageTitle('Iniciar sesión');
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({ documentNumber: '', password: '' });
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
      const patient = await login({ documentNumber: form.documentNumber.trim(), password: form.password });
      toast.success(`¡Bienvenido de nuevo, ${patient.firstName}!`);
      navigate(location.state?.from ?? '/dashboard', { replace: true });
    } catch (error) {
      setServerError(error.message);
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      <div className="auth-card">
        <header className="auth-card-header">
          <h2>Inicia sesión</h2>
          <p>Accede a tu portal con tu número de documento.</p>
        </header>

        <div className="demo-hint">
          <Sparkles aria-hidden />
          <div>
            <strong>Cuenta de demostración</strong>
            <span>Documento {DEMO_CREDENTIALS.documentNumber} · Contraseña {DEMO_CREDENTIALS.password}</span>
          </div>
          <button type="button" className="link-button" onClick={() => setForm({ ...DEMO_CREDENTIALS })}>
            Usar
          </button>
        </div>

        {serverError && <Alert tone="danger" title={serverError} />}

        <form className="form-stack" onSubmit={handleSubmit} noValidate>
          <TextField
            label="Número de documento"
            name="documentNumber"
            icon={CreditCard}
            autoComplete="username"
            placeholder="Ej. 1023456789"
            value={form.documentNumber}
            onChange={handleChange}
            error={errors.documentNumber}
            autoFocus
          />
          <PasswordField
            label="Contraseña"
            name="password"
            autoComplete="current-password"
            placeholder="••••••••"
            value={form.password}
            onChange={handleChange}
            error={errors.password}
          />
          <Button type="submit" size="lg" loading={submitting} iconRight={ArrowRight} className="btn-block">
            Ingresar
          </Button>
        </form>

        <p className="auth-switch">
          ¿Aún no tienes cuenta? <Link to="/register">Regístrate como paciente</Link>
        </p>
      </div>
    </AuthLayout>
  );
}
