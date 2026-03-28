import React, { useState, useEffect } from 'react';

const API = 'http://localhost:3000';

const DEFAULT_USERS = [
  { id: 1, username: 'rahul', role: 'admin', email: 'rahul@company.com', password: 'admin@123' },
  { id: 2, username: 'priya', role: 'admin', email: 'priya@company.com', password: 'priya@admin' },
  { id: 3, username: 'adarsh', role: 'user', email: 'adarsh@gmail.com', password: 'pass123' },
  { id: 4, username: 'sneha', role: 'user', email: 'sneha@gmail.com', password: 'sneha456' },
  { id: 5, username: 'vikram', role: 'user', email: 'vikram@gmail.com', password: 'vik789' },
  { id: 6, username: 'ananya', role: 'user', email: 'ananya@gmail.com', password: 'ana321' },
  { id: 7, username: 'karan', role: 'user', email: 'karan@yahoo.com', password: 'karan111' },
  { id: 8, username: 'meera', role: 'user', email: 'meera@yahoo.com', password: 'meera222' },
  { id: 9, username: 'arjun', role: 'user', email: 'arjun@outlook.com', password: 'arjun333' },
  { id: 10, username: 'divya', role: 'user', email: 'divya@outlook.com', password: 'divya444' }
];

export default function DecodeDemo() {
  const [token, setToken] = useState(() => localStorage.getItem('jwt_token') || '');
  const [tamperedToken, setTamperedToken] = useState(() => localStorage.getItem('jwt_tampered') || '');
  const [tableState, setTableState] = useState(() => localStorage.getItem('jwt_tableState') || 'default');
  const [serverUsers, setServerUsers] = useState(null);
  const [output, setOutput] = useState('Click the buttons in order (Step 1 → 4) to see the vulnerability.');

  // Save state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('jwt_token', token);
    localStorage.setItem('jwt_tampered', tamperedToken);
    localStorage.setItem('jwt_tableState', tableState);
  }, [token, tamperedToken, tableState]);

  // Sync token from cookies (if user pastes manually)
  useEffect(() => {
    const syncCookie = () => {
      const match = document.cookie.match(/(^| )token=([^;]+)/);
      if (match && match[2] !== token && match[2] !== tamperedToken) {
        setToken(match[2]);
        setTamperedToken(match[2]);
      }
    };
    const interval = setInterval(syncCookie, 1000);
    return () => clearInterval(interval);
  }, [token, tamperedToken]);

  const getDecodedToken = (t) => {
    if (!t) return null;
    try {
      return JSON.parse(atob(t.split('.')[1]));
    } catch {
      return null;
    }
  };

  const decodedUser = getDecodedToken(token);
  const isAdmin = decodedUser?.role === 'admin';
  const loggedInUsername = decodedUser?.user;

  const displayUsers = serverUsers || DEFAULT_USERS;

  const handleLogin = async () => {
    try {
      const res = await fetch(`${API}/login`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'adarsh', password: 'pass123' })
      });
      const data = await res.json();
      setToken(data.token);
      setTamperedToken('');
      setTableState('logged_in');
      setServerUsers(null);
      setOutput(JSON.stringify(data, null, 2));
    } catch (err) {
      setOutput(JSON.stringify({ error: err.message }, null, 2));
    }
  };

  const handleLogout = () => {
    document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    setToken('');
    setTamperedToken('');
    setTableState('default');
    setServerUsers(null);
    setOutput(JSON.stringify({ message: "Logged out. Clear local storage and cookies completed." }, null, 2));
  };

  const handleDash = async (secure) => {
    if (!token) return setOutput(JSON.stringify({ error: "Login first!" }, null, 2));
    try {
      const endpoint = secure ? 'dashboard-secure' : 'dashboard';
      const res = await fetch(`${API}/${endpoint}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.all_users) setServerUsers(data.all_users);
      setOutput(JSON.stringify(data, null, 2));
    } catch (err) {
      setOutput(JSON.stringify({ error: err.message }, null, 2));
    }
  };

  const handleTamper = () => {
    if (!token) return setOutput(JSON.stringify({ error: "Login first!" }, null, 2));
    try {
      const parts = token.split('.');
      const payload = JSON.parse(atob(parts[1]));
      const original = { ...payload };
      
      payload.role = 'admin';
      
      const tamperedPayload = btoa(JSON.stringify(payload)).replace(/=/g, '');
      const newToken = parts[0] + '.' + tamperedPayload + '.' + parts[2];
      setTamperedToken(newToken);
      
      setOutput(JSON.stringify({
        step: "Token tampered!",
        original_payload: original,
        tampered_payload: payload,
        note: "Changed role to 'admin' WITHOUT the secret key. Signature is now invalid but jwt.decode() won't check it..."
      }, null, 2));
    } catch (err) {
      setOutput(JSON.stringify({ error: err.message }, null, 2));
    }
  };

  const handleTamperDash = async (secure) => {
    if (!tamperedToken) return setOutput(JSON.stringify({ error: "Tamper the token first (Step 3)!" }, null, 2));
    try {
      const endpoint = secure ? 'dashboard-secure' : 'dashboard';
      const res = await fetch(`${API}/${endpoint}`, {
        headers: { Authorization: `Bearer ${tamperedToken}` }
      });
      const data = await res.json();
      
      if (!secure && data.all_users) {
        setServerUsers(data.all_users);
        setTableState('admin_leaked');
        setOutput(JSON.stringify({
          route: "/dashboard (VULNERABLE — jwt.decode)",
          result: "🔓 ATTACK SUCCEEDED! adarsh sees ALL users' emails, phones, salaries, and PASSWORDS!",
          response: data
        }, null, 2));
      } else {
        setOutput(JSON.stringify({
          route: "/dashboard-secure (SAFE — jwt.verify)",
          result: "✅ ATTACK BLOCKED — tampered token rejected!",
          response: data
        }, null, 2));
      }
    } catch (err) {
      setOutput(JSON.stringify({ error: err.message }, null, 2));
    }
  };

  const copyToken = (t) => {
    if (!t) return alert("No token to copy!");
    navigator.clipboard.writeText(t).then(() => alert("Copied!")).catch(() => alert("Failed to copy"));
  };

  return (
    <div className="animation-fade-in">
      <div className="page-header">
        <h1>🔓 JWT Decoding Vulnerability</h1>
        <p>Shows why <code>jwt.decode()</code> instead of <code>jwt.verify()</code> causes <strong>serious data breaches</strong>.</p>
        <div style={{ marginTop: '12px', padding: '12px', backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '8px', color: '#34d399' }}>
          <strong>✅ Vulnerability Fixed:</strong> Make sure your <code>jsonwebtoken</code> version is <strong>above 9.0.0</strong> where all these functionalities have been completely fixed! The <code>"none"</code> algorithm signing vulnerability was specifically fixed back in version <strong>4.2.2 (2015)</strong>.
        </div>
      </div>

      <div className="glass-card">
        <h3>Users in the system</h3>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Username</th>
                <th>Role</th>
                <th>Email</th>
                <th>Password</th>
              </tr>
            </thead>
            <tbody>
              {displayUsers.map(u => {
                let pwdDisplay = '••••••••';
                let rowClass = '';
                let pwdClass = 'pwd-hidden';
                
                if (tableState === 'admin_leaked') {
                  pwdDisplay = u.password;
                  pwdClass = 'pwd-leaked';
                  rowClass = 'highlight-leaked';
                } else if (tableState === 'logged_in') {
                  if (isAdmin) {
                    pwdDisplay = u.password;
                    pwdClass = 'pwd-visible';
                  } else if (u.username === loggedInUsername) {
                    pwdDisplay = u.password;
                    pwdClass = 'pwd-own';
                    rowClass = 'highlight-current';
                  }
                }

                return (
                  <tr key={u.id} className={rowClass}>
                    <td>{u.id}</td>
                    <td>{u.username === loggedInUsername ? <strong>{u.username}</strong> : u.username}</td>
                    <td><span className={`role-tag role-${u.role}`}>{u.role}</span></td>
                    <td>{u.email}</td>
                    <td className={pwdClass}>{pwdDisplay}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <div className="glass-card">
          <h3>Step 1 — Login</h3>
          <p>Login as regular user (adarsh / pass123)</p>
          <div className="btn-group">
            <button className="btn-primary" onClick={handleLogin}>Login</button>
            <button className="btn-danger" onClick={handleLogout}>Logout</button>
          </div>
        </div>

        <div className="glass-card">
          <h3>Step 2 — View Dashboard (Legit Token)</h3>
          <p>adarsh can only view his own information.</p>
          <div className="btn-group">
            <button className="btn-danger" onClick={() => handleDash(false)}>Vulnerable Route</button>
            <button className="btn-success" onClick={() => handleDash(true)}>Secure Route</button>
          </div>
        </div>

        <div className="glass-card" style={{ gridColumn: '1 / -1' }}>
          <h3>Step 3 — ⚠️ Tamper the Token</h3>
          <p>Change <code>"role":"user"</code> → <code>"role":"admin"</code> in Base64 without the secret key.</p>
          <div className="btn-group">
            <button className="btn-danger" onClick={handleTamper}>🛑 Tamper Token → Become Admin</button>
          </div>
        </div>

        <div className="glass-card" style={{ gridColumn: '1 / -1' }}>
          <h3>Step 4 — View Dashboard with Tampered Token</h3>
          <p>See the difference: the vulnerable route leaks ALL users' private data!</p>
          <div className="btn-group">
            <button className="btn-danger" onClick={() => handleTamperDash(false)}>Vulnerable Dashboard (jwt.decode) 🔓</button>
            <button className="btn-success" onClick={() => handleTamperDash(true)}>Secure Dashboard (jwt.verify) ✅</button>
          </div>
        </div>
      </div>

      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3>Current Token</h3>
          <button className="btn-secondary" onClick={() => copyToken(tamperedToken || token)}>📋 Copy Active Token</button>
        </div>
        {tableState === 'admin_leaked' ? (
          <div className="token-display-box" style={{ color: '#ef4444' }}>
            [⚠️ TAMPERED — adarsh pretending to be admin]<br/>{tamperedToken}
          </div>
        ) : token ? (
          <div className="token-display-box" style={{ color: '#10b981' }}>
            [LEGIT — adarsh]<br/>{token}
          </div>
        ) : (
          <div className="token-display-box" style={{ color: '#9ba1a6' }}>None</div>
        )}
      </div>

      <h3>Console Output</h3>
      <pre className="console-output">{output}</pre>
    </div>
  );
}
