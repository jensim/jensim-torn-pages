import React from 'react';
import PasswordInput from '../components/PasswordInput';
import { usePassword } from '../hooks/usePassword';

const Settings: React.FC = () => {
  // Example of accessing password directly with the hook
  const { password: apiKeyPassword } = usePassword('api-key');

  return (
    <div className="App-header">
      <h1>Settings</h1>
      <p>Configure your passwords below. They are securely stored in local storage.</p>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '2rem' }}>
        <PasswordInput 
          name="api-key" 
          label="API Key"
          placeholder="Enter your API key"
        />
        
        <PasswordInput 
          name="database-password" 
          label="Database Password"
          placeholder="Enter database password"
        />
        
        <PasswordInput 
          name="admin-password" 
          label="Admin Password"
          placeholder="Enter admin password"
        />
      </div>

      {/* Example of accessing password value directly */}
      {apiKeyPassword && (
        <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#f0f0f0', borderRadius: '8px' }}>
          <p><strong>Example:</strong> API Key is set (length: {apiKeyPassword.length})</p>
          <p style={{ fontSize: '0.9rem', color: '#666' }}>
            You can access password values anywhere using the usePassword hook!
          </p>
        </div>
      )}
    </div>
  );
};

export default Settings;
