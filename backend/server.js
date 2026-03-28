import express from "express";
import jwt from "jsonwebtoken";
import cors from "cors";
import fs from "fs";
import crypto from "crypto";

const app = express();
app.use(express.json());
app.use(cors({ origin: true, credentials: true }));

// Load the generated keys (Normalize line endings for the demo to match across environments)
const privateKey = fs.readFileSync("private.pem", "utf8");
const publicKey = fs.readFileSync("public.pem", "utf8").replace(/\r\n/g, "\n");

const users = [
  { id: 1, username: "rahul", role: "admin", password: "admin@123" },
  { id: 2, username: "adarsh", role: "user", password: "pass123" },
  { id: 3, username: "sneha", role: "user", password: "sneha456" },
];

app.post("/login", (req, res) => {
  const { username, password } = req.body;
  const user = users.find(
    (u) => u.username === username && u.password === password,
  );

  if (!user)
    return res.status(401).json({ error: "Invalid username or password" });

  // Sign using RS256 (Asymmetric) with the Private Key
  const token = jwt.sign(
    { id: user.id, user: user.username, role: user.role },
    privateKey,
    { algorithm: "RS256" },
  );

  res.json({ message: `Logged in as ${user.username} (${user.role})!`, token });
});

app.get("/public-key", (req, res) => {
  // The public key is public! Attackers can download it to verify tokens.
  res.send(publicKey);
});

function getToken(req) {
  return req.headers.authorization?.split(" ")[1];
}

// ⚠️ VULNERABLE: Deliberately flawed manual verification to bypass v9 library safety
// and demonstrate the ROOT of the algorithm confusion flaw.
app.get("/dashboard", (req, res) => {
  const token = getToken(req);
  if (!token) return res.status(401).json({ error: "No token provided" });

  try {
    // ⚠️ ALGORITHM CONFUSION VULNERABILITY:
    // We manually simulate what happens when a developer "re-invents" verification
    // and incorrectly trusts the 'alg' header while using the same 'publicKey'.
    const parts = token.split(".");
    if (parts.length !== 3) throw new Error("Invalid token format");
    const [headerB64, payloadB64, signatureB64] = parts;

    const header = JSON.parse(Buffer.from(headerB64, "base64url").toString());
    const payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString());

    let isVerified = false;
    if (header.alg === "HS256") {
      // ❌ VULNERABILITY: Treating Public Key text as the HMAC secret!
      const expectedSignature = crypto
        .createHmac("sha256", publicKey)
        .update(`${headerB64}.${payloadB64}`)
        .digest("base64url");
      isVerified = signatureB64 === expectedSignature;
    } else if (header.alg === "RS256") {
      // ✅ CORRECT USE: Verifying with RSA public key signature
      isVerified = crypto
        .createVerify("RSA-SHA256")
        .update(`${headerB64}.${payloadB64}`)
        .verify(publicKey, signatureB64, "base64url");
    }

    if (!isVerified) throw new Error("Invalid signature");

    if (payload.role === "admin") {
      return res.json({
        message: "🔓 Admin Dashboard — Full Access",
        your_profile: payload,
        all_users: users.map((u) => ({
          id: u.id,
          username: u.username,
          email: u.email || `${u.username}@company.com`,
          role: u.role,
          password: u.password,
        })),
      });
    }

    const me = users.find((u) => u.username === payload.user);
    return res.json({
      message: "User Dashboard — Your Info Only",
      your_profile: me || payload,
    });
  } catch (err) {
    res.status(401).json({ error: "Invalid token", details: err.message });
  }
});

// ✅ SECURE: explicitly enforce algorithms
app.get("/dashboard-secure", (req, res) => {
  const token = getToken(req);
  if (!token) return res.status(401).json({ error: "No token provided" });

  try {
    // ✅ GOOD: By passing algorithms: ['RS256'], we force jwt.verify to ONLY accept RS256.
    // If an attacker sends an HS256 token, jwt.verify will reject it immediately,
    // even if it was signed with our valid public key string as an HMAC secret!
    const decoded = jwt.verify(token, publicKey, { algorithms: ["RS256"] });

    if (decoded.role === "admin") {
      return res.json({
        message: "✅ Admin Dashboard (Secure)",
        all_users: users,
      });
    }

    const me = users.find((u) => u.username === decoded.user);
    return res.json({
      message: "User Dashboard (Secure)",
      your_profile: me || decoded,
    });
  } catch (err) {
    res.status(401).json({
      error: "❌ Invalid or tampered token rejected (Algorithm Mismatch)!",
    });
  }
});

app.listen(3001, () => console.log("Asymmetric backend running on port 3001"));
