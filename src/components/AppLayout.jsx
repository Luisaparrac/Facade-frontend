import { useEffect, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  CalendarPlus, FileText, FlaskConical, LayoutDashboard, LogOut, Menu, PhoneCall, X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { USE_MOCK_API } from '../config';
import { getDocumentLabel } from '../constants';
import { Avatar } from './ui';
import { BrandMark } from './BrandMark';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Inicio', icon: LayoutDashboard, isActive: (path) => path.startsWith('/dashboard') },
  { to: '/appointments/new', label: 'Agendar cita', icon: CalendarPlus, isActive: (path) => path.startsWith('/appointments') },
  { to: '/history', label: 'Historia clínica', icon: FileText, isActive: (path) => path.startsWith('/history') && !path.startsWith('/history/labs') },
  { to: '/history/labs', label: 'Laboratorio', icon: FlaskConical, isActive: (path) => path.startsWith('/history/labs') },
];

export function AppLayout() {
  const { patient, logout } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
    window.scrollTo({ top: 0 });
  }, [pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="app-shell">
      <aside className={`sidebar ${menuOpen ? 'is-open' : ''}`} aria-label="Navegación principal">
        <div className="sidebar-top">
          <BrandMark inverted />
          <button type="button" className="icon-button sidebar-close" onClick={() => setMenuOpen(false)} aria-label="Cerrar menú">
            <X aria-hidden />
          </button>
        </div>

        <nav className="sidebar-nav">
          <p className="sidebar-section">Menú</p>
          {NAV_ITEMS.map(({ to, label, icon: Icon, isActive }) => {
            const active = isActive(pathname);
            return (
              <Link key={to} to={to} className={`nav-link ${active ? 'is-active' : ''}`} aria-current={active ? 'page' : undefined}>
                <Icon aria-hidden />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-help">
          <PhoneCall aria-hidden />
          <div>
            <p className="sidebar-help-title">¿Necesitas ayuda?</p>
            <p>Línea de atención 24/7<br /><strong>(601) 555 0123</strong></p>
          </div>
        </div>
      </aside>
      {menuOpen && <div className="sidebar-backdrop" onClick={() => setMenuOpen(false)} aria-hidden />}

      <div className="app-main">
        <header className="topbar">
          <button type="button" className="icon-button menu-toggle" onClick={() => setMenuOpen(true)} aria-label="Abrir menú">
            <Menu aria-hidden />
          </button>

          {USE_MOCK_API && (
            <span className="demo-pill" title="VITE_API_URL no está configurada: se usan datos simulados en el navegador.">
              <span className="demo-dot" /> Modo demo · datos simulados
            </span>
          )}

          <div className="topbar-user">
            <Avatar firstName={patient.firstName} lastName={patient.lastName} />
            <div className="topbar-user-text">
              <span className="topbar-user-name">{patient.firstName} {patient.lastName}</span>
              <span className="topbar-user-meta">{getDocumentLabel(patient)}</span>
            </div>
            <button type="button" className="icon-button" onClick={handleLogout} aria-label="Cerrar sesión" title="Cerrar sesión">
              <LogOut aria-hidden />
            </button>
          </div>
        </header>

        <main className="app-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
