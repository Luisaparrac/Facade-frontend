import { useState } from 'react';
import { Eye, EyeOff, Lock, X } from 'lucide-react';

export function TextField({ label, error, hint, icon: Icon, id, name, trailing, className = '', ...inputProps }) {
  const fieldId = id ?? name;
  const messageId = `${fieldId}-message`;
  return (
    <div className={`field ${error ? 'has-error' : ''} ${className}`}>
      {label && <label htmlFor={fieldId} className="field-label">{label}</label>}
      <div className="input-wrap">
        {Icon && <Icon className="input-icon" aria-hidden />}
        <input
          id={fieldId}
          name={name}
          className={`input ${Icon ? 'has-icon' : ''} ${trailing ? 'has-trailing' : ''}`}
          aria-invalid={Boolean(error)}
          aria-describedby={error || hint ? messageId : undefined}
          {...inputProps}
        />
        {trailing && <div className="input-trailing">{trailing}</div>}
      </div>
      {error
        ? <p id={messageId} className="field-error">{error}</p>
        : hint && <p id={messageId} className="field-hint">{hint}</p>}
    </div>
  );
}

export function PasswordField(props) {
  const [visible, setVisible] = useState(false);
  return (
    <TextField
      icon={Lock}
      type={visible ? 'text' : 'password'}
      trailing={
        <button
          type="button"
          className="icon-button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        >
          {visible ? <EyeOff aria-hidden /> : <Eye aria-hidden />}
        </button>
      }
      {...props}
    />
  );
}

export function TagInput({ label, value, onChange, placeholder, hint, id = 'tag-input' }) {
  const [draft, setDraft] = useState('');

  const addTag = () => {
    const tag = draft.trim().replace(/,$/, '');
    if (tag && !value.some((existing) => existing.toLowerCase() === tag.toLowerCase())) {
      onChange([...value, tag]);
    }
    setDraft('');
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      addTag();
    } else if (event.key === 'Backspace' && !draft && value.length) {
      onChange(value.slice(0, -1));
    }
  };

  return (
    <div className="field">
      {label && <label htmlFor={id} className="field-label">{label}</label>}
      <div className="tag-input">
        {value.map((tag) => (
          <span key={tag} className="tag">
            {tag}
            <button type="button" onClick={() => onChange(value.filter((t) => t !== tag))} aria-label={`Quitar ${tag}`}>
              <X aria-hidden />
            </button>
          </span>
        ))}
        <input
          id={id}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={addTag}
          placeholder={value.length ? '' : placeholder}
        />
      </div>
      {hint && <p className="field-hint">{hint}</p>}
    </div>
  );
}
