import express from "express";
import jwt from "jsonwebtoken";
import cors from "cors";

const app = express();
app.use(express.json());
app.use(cors({ origin: true, credentials: true }));

const SECRET = "supersecret";

// Dummy user database — 10 users, 2 admins and 8 regular users
const users = [
  {
    id: 1,
    username: "rahul",
    password: "admin@123",
    role: "admin",
    email: "rahul@company.com",
    phone: "9876543210",
    salary: "₹2,50,000",
  },
  {
    id: 2,
    username: "priya",
    password: "priya@admin",
    role: "admin",
    email: "priya@company.com",
    phone: "9876543211",
    salary: "₹2,40,000",
  },
  {
    id: 3,
    username: "adarsh",
    password: "pass123",
    role: "user",
    email: "adarsh@gmail.com",
    phone: "9123456780",
    salary: "₹85,000",
  },
  {
    id: 4,
    username: "sneha",
    password: "sneha456",
    role: "user",
    email: "sneha@gmail.com",
    phone: "9123456781",
    salary: "₹90,000",
  },
  {
    id: 5,
    username: "vikram",
    password: "vik789",
    role: "user",
    email: "vikram@gmail.com",
    phone: "9123456782",
    salary: "₹78,000",
  },
  {
    id: 6,
    username: "ananya",
    password: "ana321",
    role: "user",
    email: "ananya@gmail.com",
    phone: "9123456783",
    salary: "₹95,000",
  },
  {
    id: 7,
    username: "karan",
    password: "karan111",
    role: "user",
    email: "karan@yahoo.com",
    phone: "9123456784",
    salary: "₹72,000",
  },
  {
    id: 8,
    username: "meera",
    password: "meera222",
    role: "user",
    email: "meera@yahoo.com",
    phone: "9123456785",
    salary: "₹88,000",
  },
  {
    id: 9,
    username: "arjun",
    password: "arjun333",
    role: "user",
    email: "arjun@outlook.com",
    phone: "9123456786",
    salary: "₹92,000",
  },
  {
    id: 10,
    username: "divya",
    password: "divya444",
    role: "user",
    email: "divya@outlook.com",
    phone: "9123456787",
    salary: "₹81,000",
  },
];

// Login
app.post("/login", (req, res) => {
  const { username, password } = req.body;

  const user = users.find(
    (u) => u.username === username && u.password === password,
  );

  if (!user) {
    return res.status(401).json({ error: "Invalid username or password" });
  }

  const token = jwt.sign(
    { id: user.id, user: user.username, role: user.role },
    SECRET,
    { algorithm: "HS256" },
  );

  // ❌ BAD: No httpOnly flag — JS can read the cookie
  res.setHeader("Set-Cookie", `token=${token}; Path=/; SameSite=None; Secure`);

  res.json({ message: `Logged in as ${user.username} (${user.role})!`, token });
});

// Helper: extract token from cookie or auth header
function getToken(req) {
  const cookieHeader = req.headers.cookie || "";
  const cookieToken = cookieHeader
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith("token="));

  return cookieToken
    ? cookieToken.split("=")[1]
    : req.headers.authorization?.split(" ")[1];
}

// ❌ VULNERABLE: Dashboard — uses jwt.decode() (no signature check)
app.get("/dashboard", (req, res) => {
  const token = getToken(req);
  if (!token) return res.status(401).json({ error: "No token provided" });

  try {
    // ❌ BAD: jwt.decode() does NOT verify the signature!
    const decoded = jwt.decode(token);

    if (decoded.role === "admin") {
      // Admin sees EVERYTHING — all users with sensitive data
      return res.json({
        message: "🔓 Admin Dashboard — Full Access",
        your_profile: decoded,
        all_users: users.map((u) => ({
          id: u.id,
          username: u.username,
          email: u.email,
          phone: u.phone,
          salary: u.salary,
          password: u.password,
          role: u.role,
        })),
      });
    }

    // Regular user sees only their own info
    const me = users.find((u) => u.username === decoded.user);
    return res.json({
      message: "User Dashboard — Your Info Only",
      your_profile: me
        ? {
            id: me.id,
            username: me.username,
            email: me.email,
            phone: me.phone,
            salary: me.salary,
            role: me.role,
          }
        : decoded,
    });
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
});

// ✅ SECURE: Dashboard — uses jwt.verify() (signature check)
app.get("/dashboard-secure", (req, res) => {
  const token = getToken(req);
  if (!token) return res.status(401).json({ error: "No token provided" });

  try {
    // ✅ GOOD: jwt.verify() checks the signature!
    const decoded = jwt.verify(token, SECRET);

    if (decoded.role === "admin") {
      return res.json({
        message: "✅ Admin Dashboard (Secure)",
        your_profile: decoded,
        all_users: users.map((u) => ({
          id: u.id,
          username: u.username,
          email: u.email,
          phone: u.phone,
          salary: u.salary,
          password: u.password,
          role: u.role,
        })),
      });
    }

    const me = users.find((u) => u.username === decoded.user);
    return res.json({
      message: "User Dashboard (Secure)",
      your_profile: me
        ? {
            id: me.id,
            username: me.username,
            email: me.email,
            phone: me.phone,
            salary: me.salary,
            role: me.role,
          }
        : decoded,
    });
  } catch (err) {
    res.status(401).json({ error: "❌ Invalid or tampered token rejected!" });
  }
});

app.listen(3000, () => console.log("Server running on port 3000"));
