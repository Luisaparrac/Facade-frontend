import { APP_NAME } from '../config';

export function BrandMark({ subtitle = 'Portal del paciente', inverted = false }) {
  return (
    <div className={`brand ${inverted ? 'brand-inverted' : ''}`}>
      <svg className="brand-logo" viewBox="0 0 64 64" aria-hidden>
        <defs>
          <linearGradient id="brand-gradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#2dd4bf" />
            <stop offset="1" stopColor="#0f766e" />
          </linearGradient>
        </defs>
        <rect width="64" height="64" rx="16" fill="url(#brand-gradient)" />
        <path
          d="M10 34h11l5-12 8 22 6-14 3 4h11"
          fill="none"
          stroke="#fff"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <div className="brand-text">
        <span className="brand-name">{APP_NAME}</span>
        {subtitle && <span className="brand-subtitle">{subtitle}</span>}
      </div>
    </div>
  );
}
