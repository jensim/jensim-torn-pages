import React, { useState } from 'react';
import './BubbleSearch.css';

interface BubbleSearchProps {
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
}

const BubbleSearch: React.FC<BubbleSearchProps> = ({ values, onChange, placeholder = 'Type and press Enter...' }) => {
  const [input, setInput] = useState('');

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && input.trim()) {
      e.preventDefault();
      const trimmed = input.trim();
      if (!values.includes(trimmed)) {
        onChange([...values, trimmed]);
      }
      setInput('');
    }
  };

  const handleRemove = (index: number) => {
    onChange(values.filter((_, i) => i !== index));
  };

  const handleClearAll = () => {
    onChange([]);
    setInput('');
  };

  return (
    <div className="bubble-search">
      {values.map((value, index) => (
        <span key={index} className="bubble-search-tag">
          {value}
          <button
            className="bubble-search-tag-remove"
            onClick={() => handleRemove(index)}
            aria-label={`Remove ${value}`}
          >
            &times;
          </button>
        </span>
      ))}
      <input
        className="bubble-search-input"
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={values.length === 0 ? placeholder : ''}
      />
      {values.length > 0 && (
        <button
          className="bubble-search-clear"
          onClick={handleClearAll}
          aria-label="Clear all search terms"
        >
          &times;
        </button>
      )}
    </div>
  );
};

export default BubbleSearch;
