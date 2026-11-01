const jwt = require("jsonwebtoken");
const User = require("../models/User");

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};

// @route  POST /api/auth/register
// @access Public
const registerUser = async (req, res) => {
  try {
    const { name, email, password, role, organizationName, location } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email and password are required" });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: "An account with this email already exists" });
    }

    // Public sign-up may only create these roles. Admin accounts are created by seeding
    // or by an existing admin, never through this endpoint.
    const ALLOWED_SIGNUP_ROLES = ["provider", "ngo", "student"];
    const safeRole = ALLOWED_SIGNUP_ROLES.includes(role) ? role : "provider";

    const user = await User.create({
      name,
      email,
      password,
      role: safeRole,
      organizationName,
      location,
    });

    return res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      organizationName: user.organizationName,
      token: generateToken(user._id),
    });
  } catch (error) {
    return res.status(500).json({ message: "Registration failed", error: error.message });
  }
};

// @route  POST /api/auth/login
// @access Public
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select("+password");

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: "This account has been deactivated. Contact an admin." });
    }

    return res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      organizationName: user.organizationName,
      token: generateToken(user._id),
    });
  } catch (error) {
    return res.status(500).json({ message: "Login failed", error: error.message });
  }
};

// @route  GET /api/auth/me
// @access Private
const getMe = async (req, res) => {
  return res.status(200).json(req.user);
};

// @route  PATCH /api/auth/me
// @access Private
const updateMe = async (req, res) => {
  try {
    const { name, organizationName, location } = req.body;
    const user = req.user;

    if (name) user.name = name;
    if (organizationName !== undefined) user.organizationName = organizationName;
    if (location !== undefined) user.location = location;

    await user.save();
    return res.status(200).json(user);
  } catch (error) {
    return res.status(500).json({ message: "Could not update profile", error: error.message });
  }
};

module.exports = { registerUser, loginUser, getMe, updateMe };
