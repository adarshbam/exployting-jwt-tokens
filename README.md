# 🔓 JWT Exploitation & Security Demo

This repository contains a two-part educational demonstration of common JWT (JSON Web Token) security vulnerabilities. It illustrates why proper signature verification and algorithm restriction are critical for securing web applications.

---

## 🛠️ Project Structure

The project is divided into two distinct parts, each with its own backend and frontend:

### **Part 1: Signature Bypass & Insecure Cookies**
-   **Vulnerability**: Demonstrates the danger of using `jwt.decode()` (which skips signature checks) and the lack of `httpOnly` flags on cookies.
-   **Backend**: `backend/app.js` (Port 3000)
-   **Frontend**: `frontend/index.html`

### **Part 2: Algorithm Confusion (RS256 → HS256)**
-   **Vulnerability**: Demonstrates how an asymmetric public key can be misused as a symmetric HMAC secret if the backend does not restrict allowed algorithms.
-   **Backend**: `backend/server.js` (Port 3001)
-   **Frontend**: `frontend/break-assymetric-keys.html`

---

## 🚀 Getting Started

### 1. Install Dependencies
Navigate to the `backend` folder and install the necessary Node.js packages:
```bash
cd backend
npm install
```

### 2. Run the Backend Servers
You should run **both** servers to explore the full project. Open two separate terminals:

#### **Terminal 1 (Part 1)**
```bash
cd backend
node --watch app.js
```
_Backend running on `http://localhost:3000`_

#### **Terminal 2 (Part 2)**
```bash
cd backend
node --watch server.js
```
_Backend running on `http://localhost:3001`_

### 3. Open the Frontend
Open the `frontend` folder and use **Live Server** (recommended) to serve the HTML files:
-   **`index.html`**: The main entry point for the Part 1 demo.
-   **`break-assymetric-keys.html`**: The entry point for the Part 2 (Algorithm Confusion) demo.

---

## 🛡️ How to Use

### **Demo 1: Signature Bypass (Symmetric)**
1.  **Login**: Click "Login as adarsh" (regular user).
2.  **Tamper**: Click "Tamper Token". Notice how it changes your role to `admin` in the payload.
3.  **Exploit**: Click "Vulnerable Dashboard (jwt.decode)". The server will accept the tampered token because it doesn't check the signature!
4.  **Impact**: All 10 users' private data (including passwords) is revealed.

### **Demo 2: Algorithm Confusion (Asymmetric)**
1.  **Login**: Login as a regular user to get an RS256 token.
2.  **Fetch Key**: Download the server's public key string.
3.  **Attack**: Generate a malicious HS256 token signed with that public key string.
4.  **Exploit**: Click "Access Vulnerable Dashboard". The server incorrectly uses the public key as an HMAC secret and grants admin access!
5.  **Impact**: All user passwords are leaked and highlighted in red in the table.

---

## 🔒 Security Best Practices
-   **Always use `jwt.verify()`**: Never rely on `jwt.decode()` for authorization.
-   **Specify Algorithms**: Always pass the `algorithms` array (e.g., `['RS256']`) to `jwt.verify()` to prevent algorithm confusion.
-   **Secure Cookies**: Use `httpOnly` and `Secure` flags to prevent client-side JS from reading tokens.
-   **Secret Management**: Keep symmetric secrets long, complex, and hidden.

## ⚠️ Disclaimer
This is for **educational purposes only**. Never use these techniques on systems you do not have permission to test.
