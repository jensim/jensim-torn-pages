import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import PasswordInput from './PasswordInput';
import { usePassword } from '../hooks/usePassword';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('PasswordInput Component', () => {
  const mockOnChange = jest.fn();
  const mockOnClear = jest.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
    mockOnClear.mockClear();
  });

  test('renders password input with label', () => {
    render(
      <PasswordInput 
        value="" 
        onChange={mockOnChange} 
        label="Test Password" 
        id="test-password"
      />
    );
    expect(screen.getByLabelText('Test Password')).toBeInTheDocument();
  });

  test('toggles password visibility', () => {
    render(
      <PasswordInput 
        value="" 
        onChange={mockOnChange} 
        id="test-password"
      />
    );
    const input = screen.getByPlaceholderText('Enter password') as HTMLInputElement;
    const toggleButton = screen.getByTitle('Show password');

    expect(input.type).toBe('password');
    
    fireEvent.click(toggleButton);
    expect(input.type).toBe('text');
    
    fireEvent.click(toggleButton);
    expect(input.type).toBe('password');
  });

  test('calls onChange when input value changes', () => {
    render(
      <PasswordInput 
        value="" 
        onChange={mockOnChange} 
        id="test-password"
      />
    );
    const input = screen.getByPlaceholderText('Enter password') as HTMLInputElement;

    fireEvent.change(input, { target: { value: 'mySecretPassword' } });
    expect(mockOnChange).toHaveBeenCalledWith('mySecretPassword');
  });

  test('displays the provided value', () => {
    render(
      <PasswordInput 
        value="existingPassword" 
        onChange={mockOnChange} 
        id="test-password"
      />
    );
    const input = screen.getByPlaceholderText('Enter password') as HTMLInputElement;

    expect(input.value).toBe('existingPassword');
  });

  test('calls onClear when clear button is clicked', () => {
    render(
      <PasswordInput 
        value="mySecretPassword" 
        onChange={mockOnChange} 
        onClear={mockOnClear}
        id="test-password"
      />
    );

    const clearButton = screen.getByTitle('Clear password');
    fireEvent.click(clearButton);
    
    expect(mockOnClear).toHaveBeenCalled();
  });

  test('does not show clear button when no onClear callback is provided', () => {
    render(
      <PasswordInput 
        value="mySecretPassword" 
        onChange={mockOnChange} 
        id="test-password"
      />
    );

    expect(screen.queryByTitle('Clear password')).not.toBeInTheDocument();
  });
});

// Test the hook separately
describe('usePassword Hook', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  const TestComponent: React.FC<{ name: string }> = ({ name }) => {
    const { password, setPassword, clearPassword } = usePassword(name);

    return (
      <div>
        <span data-testid="password-value">{password}</span>
        <button onClick={() => setPassword('newPassword')}>Set Password</button>
        <button onClick={clearPassword}>Clear Password</button>
      </div>
    );
  };

  test('initializes with empty password', () => {
    render(<TestComponent name="test-hook" />);
    expect(screen.getByTestId('password-value')).toHaveTextContent('');
  });

  test('sets password', () => {
    render(<TestComponent name="test-hook" />);
    
    fireEvent.click(screen.getByText('Set Password'));
    expect(screen.getByTestId('password-value')).toHaveTextContent('newPassword');
    expect(localStorageMock.getItem('password_test-hook')).toBe('newPassword');
  });

  test('clears password', () => {
    localStorageMock.setItem('password_test-hook', 'existingPassword');
    render(<TestComponent name="test-hook" />);
    
    expect(screen.getByTestId('password-value')).toHaveTextContent('existingPassword');
    
    fireEvent.click(screen.getByText('Clear Password'));
    expect(screen.getByTestId('password-value')).toHaveTextContent('');
    expect(localStorageMock.getItem('password_test-hook')).toBeNull();
  });
});
