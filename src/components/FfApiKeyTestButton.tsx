import React, { useState } from 'react';
import { toast } from 'react-toastify';
import './FfApiKeyTestButton.css';

interface FfApiKeyTestButtonProps {
  apiKey: string;
}

interface FfApiKeyResponse {
  key: string;
  is_registered: boolean;
  registered_at: number;
  last_used: number;
}

const FfApiKeyTestButton: React.FC<FfApiKeyTestButtonProps> = ({ apiKey }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleTestApiKey = async () => {
    if (!apiKey || apiKey.trim() === '') {
      toast.error('Please enter an API key first');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(
        `https://ffscouter.com/api/v1/check-key?key=${encodeURIComponent(apiKey)}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: FfApiKeyResponse = await response.json();

      if (data.is_registered) {
        const lastUsedDate = new Date(data.last_used * 1000).toLocaleString();
        toast.success(
          `✓ API Key is valid and registered!\nLast used: ${lastUsedDate}`,
          { autoClose: 5000 }
        );
      } else {
        toast.error('API Key is not registered');
      }
    } catch (error) {
      if (error instanceof Error) {
        toast.error(`Failed to verify API key: ${error.message}`);
      } else {
        toast.error('Failed to verify API key: Unknown error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="ff-api-key-test-container">
      <h3>Test FF-Scouter API Key</h3>
      <p className="test-description">
        Click the button below to verify your FF-Scouter API key is valid and registered.
      </p>
      <button
        className="test-button"
        onClick={handleTestApiKey}
        disabled={isLoading || !apiKey}
      >
        {isLoading ? 'Testing...' : 'Test API Key'}
      </button>
    </div>
  );
};

export default FfApiKeyTestButton;
