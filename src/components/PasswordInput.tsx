import React, { useState } from 'react';
import './PasswordInput.css';

interface PasswordInputProps {
  value: string;
  onChange: (value: string) => void;
  onClear?: () => void;
  label?: string;
  placeholder?: string;
  showToggle?: boolean;
  autoComplete?: string;
  className?: string;
  id?: string;
}

/**
 * Password input component (controlled)
 * @param value - The current password value
 * @param onChange - Callback when password changes
 * @param onClear - Optional callback when clear button is clicked
 * @param label - Optional label for the input
 * @param placeholder - Optional placeholder text
 * @param showToggle - Whether to show the visibility toggle button (default: true)
 * @param autoComplete - HTML autocomplete attribute
 * @param className - Additional CSS classes
 * @param id - Optional ID for the input element
 */
const PasswordInput: React.FC<PasswordInputProps> = ({
  value,
  onChange,
  onClear,
  label,
  placeholder = 'Enter password',
  showToggle = true,
  autoComplete = 'off',
  className = '',
  id,
}) => {
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleClear = () => {
    if (onClear) {
      onClear();
    }
  };

  return (
    <div className={`password-input-container ${className}`}>
      {label && (
        <label htmlFor={id} className="password-input-label">
          {label}
        </label>
      )}
      <div className="password-input-wrapper">
        <input
          id={id}
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className="password-input-field"
        />
        <div className="password-input-actions">
          {showToggle && (
            <button
              type="button"
              onClick={togglePasswordVisibility}
              className="password-input-button"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              title={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? '👁️' : '👁️‍🗨️'}
            </button>
          )}
          {value && onClear && (
            <button
              type="button"
              onClick={handleClear}
              className="password-input-button password-input-clear"
              aria-label="Clear password"
              title="Clear password"
            >
              ✕
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PasswordInput;
