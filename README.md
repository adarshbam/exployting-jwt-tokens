# JWT Algorithm Confusion Exploitation Demo

This project is an educational demonstration of the **JWT Algorithm Confusion (RS256 → HS256) attack**. It shows how a misconfigured backend that incorrectly trusts the `alg` header while using the same public key can be compromised to leak sensitive user information.

## 🚀 Getting Started

### 1. Start the Backend Server
The backend is built with Node.js and Express. It uses a deliberately vulnerable manual verification logic to demonstrate the flaw.

1.  Open your terminal.
2.  Navigate to the `backend` directory:
    ```bash
    cd backend
    ```
3.  Install dependencies (if not already done):
    ```bash
    npm install
    ```
4.  Start the server with live reload:
    ```bash
    node --watch server.js
    ```
    *The backend will run on `http://localhost:3001`.*

### 2. Open the Frontend
The frontend provides a step-by-step interface to execute the attack.

1.  Open the `frontend` folder.
2.  Open `break-assymetric-keys.html` in your browser.
    *   **Recommendation**: Use the "Live Server" extension in VS Code to serve it on `http://localhost:5500` to avoid CORS issues if they arise, or simply open the file as a local HTML.

---

## 🛡️ How to Use the Demo

Follow the interactive steps on the page:

1.  **Step 1 — Login**: Click "Login as adarsh" to get a legitimate regular user token.
2.  **Step 2 — Fetch Public Key**: Download the server's public key (this is public information).
3.  **Step 3 — Generate Attack Token**: Click "Generate Malicious HS256 Token". This creates a new JWT with `alg: "HS256"` and signs it using the **Public Key string** as an HMAC secret.
4.  **Step 4 — Exploit**: Click **"Access Vulnerable Dashboard"**.
    - **Success**: The server will accept the fake admin token!
    - **Impact**: The UI table will reveal **all user passwords** in red, and the full data will be logged to the developer console (`F12`).
5.  **Verify Security**: Click "Access Secure Dashboard" to see how explicitly specifying `algorithms: ["RS256"]` prevents the attack.

## ⚠️ Disclaimer
This is for **educational purposes only**. Never use these techniques on systems you do not have permission to test.
