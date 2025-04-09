import express from "express";
import { connectDb } from "../lib/db.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();
const router = express.Router();

// Register Route
router.post("/register", async (req, res) => {
  const { Name, Email, Password, role } = req.body;

  if (!Name || !Email || !Password || !role) {
    return res.status(400).json({ message: "All fields are required." });
  }

  try {
    const db = await connectDb();
    const [rows] = await db.query("SELECT * FROM users WHERE Email = ?", [Email]);

    if (rows.length > 0) {
      return res.status(409).json({ message: "User already exists." });
    }

    const hashPassword = await bcrypt.hash(Password, 10);

    await db.query(
      "INSERT INTO users (Name, Email, Password,role) VALUES (?, ?, ?, ?)",
      [Name, Email, hashPassword, role]
    );

    res.status(201).json({ message: "User created successfully." });
  } catch (error) {
    res.status(500).json({ message: "Cannot register user.", error: error.message });
  }
});

// Login Route
router.post("/login", async (req, res) => {
  const { Email, Password, role } = req.body;

  if (!Email || !Password || !role) {
    return res.status(400).json({ message: "All fields are required." });
  }

  try {
    const db = await connectDb();
    const [rows] = await db.query("SELECT * FROM users WHERE Email = ? AND role = ?", [Email, role]);

    if (rows.length === 0) {
      return res.status(404).json({ message: "User does not exist or role mismatch." });
    }

    const isMatch = await bcrypt.compare(Password, rows[0].Password);
    if (!isMatch) {
      return res.status(401).json({ message: "Incorrect password." });
    }

    // Include role in JWT for better access control
    const token = jwt.sign(
      { Email: rows[0].Email, role: rows[0].role },
      process.env.JWT_KEY,
      { expiresIn: "3h" }
    );

    res.status(200).json({ 
      token, 
      Email: rows[0].Email, 
      role: rows[0].role,
      id: rows[0].id // Return user ID
    });
  } catch (error) {
    res.status(500).json({ message: "An error occurred.", error: error.message });
  }
});

// Middleware
const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    if (!authHeader) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Invalid token format." });
    }
    const decoded = jwt.verify(token, process.env.JWT_KEY);
    
    req.Email = decoded.Email;
    req.role = decoded.role; // Store role for authorization

    next();
  } catch (error) {
    return res.status(403).json({ message: "Invalid or expired token" });
  }
};
const verifyRole = (role) => {
  return (req, res, next) => {
    if (req.role.toLowerCase() !== role.toLowerCase()) {
      return res.status(403).json({ message: "Access denied. Insufficient permissions." });
    }
    next();
  };
};
// User Dashboard Route
router.get("/user-dashboard", verifyToken, verifyRole("User"), (req, res) => {
  res.json({ message: "Welcome to the User Dashboard!" });
});

// Cinema Owner Dashboard Route
router.get("/cinema-dashboard", verifyToken, verifyRole("Cinema Owner"), (req, res) => {
  res.json({ message: "Welcome to the Cinema Owner Dashboard!" });
});

// Protected Home Route
router.get("/home", verifyToken, async (req, res) => {
  try {
    const db = connectDb();
    const [rows] = await db.execute("SELECT * FROM users WHERE Email = ?", [req.Email]);
    
    if (rows.length === 0) {
      return res.status(404).json({ message: "User does not exist" });
    }

    return res.status(200).json({ user: rows[0] });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get user profile by ID
router.get("/user/:userId", verifyToken, async (req, res) => {
  try {
    const db = await connectDb();
    const [rows] = await db.query(
      "SELECT id, Name, Email, role, created_at FROM users WHERE id = ?", 
      [req.params.userId]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ message: "Error fetching user profile", error: error.message });
  }
});

// Update user profile
router.put("/user/:userId", verifyToken, async (req, res) => {
  try {
    const { Name } = req.body;
    const db = await connectDb();
    
    await db.query(
      "UPDATE users SET Name = ? WHERE id = ?", 
      [Name, req.params.userId]
    );
    
    res.json({ message: "Profile updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error updating profile", error: error.message });
  }
});

// Get user's tickets with movie details
router.get("/tickets/user/:userId", verifyToken, async (req, res) => {
  try {
    const db = await connectDb();
    const [tickets] = await db.query(`
      SELECT 
        t.*,
        m.title as movie_title,
        m.year as movie_year,
        u.Name as user_name,
        u.Email as user_email
      FROM tickets t
      LEFT JOIN movies m ON t.movie = m.title
      JOIN users u ON t.user_id = u.id
      WHERE t.user_id = ?
      ORDER BY t.created_at DESC
    `, [req.params.userId]);
    
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ message: "Error fetching ticket history", error: error.message });
  }
});

export default router;