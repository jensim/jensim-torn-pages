import React, { useState } from 'react';
import { usePassword } from '../hooks/usePassword';
import './PasswordInput.css';

interface PasswordInputProps {
  name: string;
  label?: string;
  placeholder?: string;
  showToggle?: boolean;
  autoComplete?: string;
  className?: string;
}

/**
 * Password input component with local storage backing
 * @param name - The unique name/key for this password
 * @param label - Optional label for the input
 * @param placeholder - Optional placeholder text
 * @param showToggle - Whether to show the visibility toggle button (default: true)
 * @param autoComplete - HTML autocomplete attribute
 * @param className - Additional CSS classes
 */
const PasswordInput: React.FC<PasswordInputProps> = ({
  name,
  label,
  placeholder = 'Enter password',
  showToggle = true,
  autoComplete = 'off',
  className = '',
}) => {
  const { password, setPassword, clearPassword } = usePassword(name);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleClear = () => {
    clearPassword();
  };

  return (
    <div className={`password-input-container ${className}`}>
      {label && (
        <label htmlFor={`password-${name}`} className="password-input-label">
          {label}
        </label>
      )}
      <div className="password-input-wrapper">
        <input
          id={`password-${name}`}
          type={showPassword ? 'text' : 'password'}
          value={password}
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
          {password && (
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
