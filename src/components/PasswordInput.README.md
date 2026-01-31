# PasswordInput Component & usePassword Hook

A React password input component with local storage backing and a custom hook for easy password management.

## Features

- 🔐 Secure local storage persistence
- 👁️ Toggle password visibility
- ✕ Clear password button
- 🔄 Sync across browser tabs/windows
- 🎨 Dark mode support
- ♿ Accessible with ARIA labels
- 📱 Responsive design

## Usage

### Basic Component Usage

```tsx
import PasswordInput from '../components/PasswordInput';

function MyComponent() {
  return (
    <PasswordInput 
      name="my-password" 
      label="Password"
      placeholder="Enter your password"
    />
  );
}
```

### Using the Hook to Access Passwords

```tsx
import { usePassword } from '../hooks/usePassword';

function AnotherComponent() {
  const { password, setPassword, clearPassword } = usePassword('my-password');

  const handleSubmit = () => {
    // Access the password value directly
    console.log('Password:', password);
    
    // Make API call with the password
    fetch('/api/login', {
      method: 'POST',
      body: JSON.stringify({ password })
    });
  };

  return (
    <div>
      <button onClick={handleSubmit}>Submit</button>
      <button onClick={clearPassword}>Clear</button>
    </div>
  );
}
```

### Multiple Passwords

```tsx
function MultiPasswordForm() {
  const { password: apiKey } = usePassword('api-key');
  const { password: dbPassword } = usePassword('database-password');
  const { password: adminPassword } = usePassword('admin-password');

  const handleDeploy = () => {
    // All passwords are accessible by their name
    deployApp({ apiKey, dbPassword, adminPassword });
  };

  return (
    <>
      <PasswordInput name="api-key" label="API Key" />
      <PasswordInput name="database-password" label="Database Password" />
      <PasswordInput name="admin-password" label="Admin Password" />
      <button onClick={handleDeploy}>Deploy</button>
    </>
  );
}
```

## API Reference

### PasswordInput Component Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `name` | `string` | required | Unique identifier for the password |
| `label` | `string` | optional | Label text displayed above input |
| `placeholder` | `string` | `'Enter password'` | Placeholder text |
| `showToggle` | `boolean` | `true` | Show/hide password visibility toggle |
| `autoComplete` | `string` | `'off'` | HTML autocomplete attribute |
| `className` | `string` | `''` | Additional CSS classes |

### usePassword Hook

Returns an object with:

- `password` (string): The current password value
- `setPassword` (function): Function to update the password
- `clearPassword` (function): Function to clear the password

```tsx
const { password, setPassword, clearPassword } = usePassword(name);
```

## Storage

Passwords are stored in localStorage with the prefix `password_`. For example:
- `name="api-key"` → stored as `password_api-key`
- `name="database-password"` → stored as `password_database-password`

## Security Note

⚠️ **Important:** This component stores passwords in browser localStorage, which is not encrypted. This is suitable for:
- Development environments
- Non-sensitive credentials
- User preferences
- API keys for public APIs

For production applications handling sensitive data, consider:
- Server-side session management
- Encrypted storage solutions
- Secure credential managers
- Environment variables for backend services

## Browser Compatibility

Works in all modern browsers that support:
- localStorage
- React 16.8+ (Hooks)
- ES6+
