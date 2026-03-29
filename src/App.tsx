import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';
import Menu from './Menu';
import Settings from './pages/Settings';
import Help from './pages/Help';
import Rentals from './pages/Rentals';
import Elimination from './pages/Elimination';
import AuctionHouse from './pages/AuctionHouse';
import Companies from './pages/Companies';
import CompanyEmployees from './pages/CompanyEmployees';
import { BountiesList } from './components';

function App() {
  return (
    <HashRouter>
      <div className="App">
        <Menu />
        <Routes>
          <Route path="/" element={<BountiesList />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/help" element={<Help />} />
          <Route path="/rentals" element={<Rentals />} />
          <Route path="/elimination" element={<Elimination />} />
          <Route path="/auctionhouse" element={<AuctionHouse />} />
          <Route path="/companies" element={<Companies />} />
          <Route path="/companies/:companyId/employees" element={<CompanyEmployees />} />
        </Routes>
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
      </div>
    </HashRouter>
  );
}

export default App;
