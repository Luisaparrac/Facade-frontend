import { CalendarCheck2, FlaskConical, ShieldCheck } from 'lucide-react';
import { BrandMark } from './BrandMark';

const FEATURES = [
  { icon: CalendarCheck2, title: 'Agenda en minutos', text: 'Elige especialidad, médico y horario disponible.' },
  { icon: ShieldCheck, title: 'Historia clínica segura', text: 'Consultas, diagnósticos y prescripciones en un solo lugar.' },
  { icon: FlaskConical, title: 'Resultados claros', text: 'Identifica de un vistazo qué valores están fuera de rango.' },
];

export function AuthLayout({ children }) {
  return (
    <div className="auth-shell">
      <aside className="auth-aside">
        <BrandMark inverted />
        <div className="auth-aside-content">
          <h1>Tu salud, organizada en un solo lugar.</h1>
          <p>Gestiona tus citas, revisa tu historia clínica y consulta tus resultados de laboratorio desde cualquier dispositivo.</p>
          <ul className="auth-features">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <li key={title}>
                <span className="auth-feature-icon"><Icon aria-hidden /></span>
                <div>
                  <strong>{title}</strong>
                  <span>{text}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <p className="auth-aside-footer">© {new Date().getFullYear()} Clínica Aurora · Atención de calidad, cerca de ti.</p>
      </aside>
      <main className="auth-main">
        <div className="auth-mobile-brand"><BrandMark /></div>
        {children}
      </main>
    </div>
  );
}
