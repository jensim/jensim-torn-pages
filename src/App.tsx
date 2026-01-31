import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import './App.css';
import Menu from './Menu';
import Home from './pages/Home';
import About from './pages/About';
import Settings from './pages/Settings';
import Help from './pages/Help';

function App() {
  return (
    <HashRouter>
      <div className="App">
        <Menu />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/help" element={<Help />} />
        </Routes>
      </div>
    </HashRouter>
  );
}

export default App;
