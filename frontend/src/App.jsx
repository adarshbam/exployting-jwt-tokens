import React from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import DecodeDemo from './pages/DecodeDemo';
import AlgoConfusionDemo from './pages/AlgoConfusionDemo';

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
          <Link 
            to="/algo" 
            className={`nav-link ${location.pathname === '/algo' ? 'active' : ''}`}
          >
            Algorithm Confusion
          </Link>
        </div>
      </nav>

      <main className="main-content">
        <Routes>
          <Route path="/" element={<DecodeDemo />} />
          <Route path="/algo" element={<AlgoConfusionDemo />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
