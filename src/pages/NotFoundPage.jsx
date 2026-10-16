import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { usePageTitle } from '../hooks/usePageTitle';

export default function NotFoundPage() {
  usePageTitle('Página no encontrada');
  return (
    <div className="not-found">
      <span className="empty-state-icon"><Compass aria-hidden /></span>
      <p className="not-found-code">404</p>
      <h1>Página no encontrada</h1>
      <p>La dirección que buscas no existe o fue movida.</p>
      <Link to="/dashboard" className="btn btn-primary btn-md">Volver al inicio</Link>
    </div>
  );
}
