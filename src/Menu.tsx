import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Menu.css';

interface MenuProps {
  items?: Array<{ label: string; onClick: () => void }>;
}

const Menu: React.FC<MenuProps> = ({ items = [] }) => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const defaultItems = items.length > 0 ? items : [
    { label: 'Bounties', onClick: () => navigate('/') },
    { label: 'Rentals', onClick: () => navigate('/rentals') },
    { label: 'Settings', onClick: () => navigate('/settings') },
    { label: 'Help', onClick: () => navigate('/help') },
  ];

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const handleItemClick = (item: { label: string; onClick: () => void }) => {
    item.onClick();
    setIsOpen(false);
  };

  return (
    <div className="menu-container">
      <button 
        className={`menu-icon ${isOpen ? 'open' : ''}`} 
        onClick={toggleMenu}
        aria-label="Toggle menu"
      >
        <span className="menu-line"></span>
        <span className="menu-line"></span>
        <span className="menu-line"></span>
      </button>
      
      {isOpen && (
        <>
          <div className="menu-overlay" onClick={toggleMenu}></div>
          <nav className="menu-dropdown">
            <ul className="menu-list">
              {defaultItems.map((item, index) => (
                <li key={index} className="menu-item">
                  <button onClick={() => handleItemClick(item)}>
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </>
      )}
    </div>
  );
};

export default Menu;
