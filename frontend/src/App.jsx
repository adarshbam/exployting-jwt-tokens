import React from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import DecodeDemo from './pages/DecodeDemo';

function App() {
  const location = useLocation();

  return (
    <div className="app-container">
      <nav className="glass-nav">
        <div className="nav-brand">
          <span className="logo-icon">🔒</span>
          <h2>JWT VULNS</h2>
        </div>
        <div className="nav-links">
          <Link 
            to="/" 
            className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
          >
            Decode Vulnerability
          </Link>
        </div>
      </nav>

      <main className="main-content">
        <Routes>
          <Route path="/" element={<DecodeDemo />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
