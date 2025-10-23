const express = require("express");
const router = express.Router();
const User = require("../models/User");
const multer = require("multer");

// Use memory storage for logo (we'll store as base64)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Signup
router.post("/signup", upload.single("companyLogo"), async (req, res) => {
  try {
    const { username, email, phone, company, companyAddress, option, password } = req.body;

    // Check if email or phone already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { phone }]
    });
    if (existingUser) {
      if (existingUser.email === email) {
        return res.status(400).json({ message: "Email already exists" });
      }
      if (existingUser.phone === phone) {
        return res.status(400).json({ message: "Phone number already exists" });
      }
      return res.status(400).json({ message: "Email or phone already exists" });
    }

    // For file field
    let companyLogo = null;
    if (req.file) {
      // Get MIME type from multer's file object
      const mimeType = req.file.mimetype;
      const base64Data = req.file.buffer.toString("base64");
      companyLogo = `data:${mimeType};base64,${base64Data}`;
    }

    // Generate next Employee ID
    const lastUser = await User.findOne().sort({ createdAt: -1 });
    let nextId = 1;
    if (lastUser && lastUser.employeeId) {
      const lastNum = parseInt(lastUser.employeeId.replace("CNID", ""), 10);
      if (!isNaN(lastNum)) nextId = lastNum + 1;
    }
    const employeeId = `CNID${String(nextId).padStart(4, "0")}`;

    // Save user
    const newUser = new User({
      employeeId,
      username,
      email,
      phone,
      company,
      companyAddress,
      option,
      password, // ⚠️ use hashing in production
      companyLogo,
    });

    await newUser.save();

    res.status(201).json({ message: "✅ User registered successfully", user: newUser });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "❌ Server error", error: error.message });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ message: "Please provide username/email and password" });
    }

    // Find user by email or username
    const user = await User.findOne({
      $or: [{ email: identifier }, { username: identifier }]
    });

    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    // Check password (plain text for now, use hashing in production)
    if (user.password !== password) {
      return res.status(400).json({ message: "Invalid password" });
    }

    res.status(200).json({ message: "✅ Login successful", user });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Update Password
router.post("/update-password", async (req, res) => {
  try {
    const { identifier, newPassword } = req.body;
    if (!identifier || !newPassword) {
      return res.status(400).json({ message: "Missing fields" });
    }
    // Find user by email or username
    const user = await User.findOne({
      $or: [{ email: identifier }, { username: identifier }]
    });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    user.password = newPassword; // ⚠️ Use hashing in production!
    await user.save();
    res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Check if user exists by identifier (email or username)
router.post("/check-exists", async (req, res) => {
  const { identifier } = req.body;
  if (!identifier) return res.status(400).json({ exists: false, message: "Identifier required" });

  const user = await User.findOne({
    $or: [{ email: identifier }, { username: identifier }]
  });

  if (user) {
    return res.json({ exists: true, user });
  } else {
    return res.status(404).json({ exists: false, message: "User not found" });
  }
});

module.exports = router;