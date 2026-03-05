import React from 'react';

interface PageSelectorProps {
  selectedPages: number[];
  onChange: (pages: number[]) => void;
  maxPages?: number;
}

export const PageSelector: React.FC<PageSelectorProps> = ({
  selectedPages,
  onChange,
  maxPages = 20,
}) => {
  const pages = Array.from({ length: maxPages }, (_, i) => i + 1);

  const togglePage = (page: number) => {
    if (selectedPages.includes(page)) {
      onChange(selectedPages.filter((p) => p !== page));
    } else {
      onChange([...selectedPages, page].sort((a, b) => a - b));
    }
  };

  return (
    <div className="page-selector" style={{ margin: '10px 0' }}>
      <label>Select Pages: </label>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
        {pages.map((page) => (
          <label key={page} style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={selectedPages.includes(page)}
              onChange={() => togglePage(page)}
            />
            {page}
          </label>
        ))}
      </div>
    </div>
  );
};
