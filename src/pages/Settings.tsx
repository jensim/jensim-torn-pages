import React from 'react';
import PasswordInput from '../components/PasswordInput';
import { FfApiKeyTestButton } from '../components';
import { usePassword } from '../hooks/usePassword';

const Settings: React.FC = () => {
  // Get the FF-scouter API key from localStorage
  const { password: apiKey, setPassword: setApiKey, clearPassword: clearApiKey } = usePassword('ff-api-key');

  return (
    <div className="App-header">
      <h1>Settings</h1>
      <p>Configure your passwords below. They are securely stored in local storage.</p>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '2rem' }}>
        <PasswordInput 
          id="ff-api-key"
          value={apiKey}
          onChange={setApiKey}
          onClear={clearApiKey}
          label="FF-scouter API Key"
          placeholder="Enter your FF-scouter API key"
        />
      </div>

      {/* Test FF-scouter API Key */}
      <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#f0f0f0', borderRadius: '8px' }}>
        <FfApiKeyTestButton apiKey={apiKey} />
      </div>
    </div>
  );
};

export default Settings;
