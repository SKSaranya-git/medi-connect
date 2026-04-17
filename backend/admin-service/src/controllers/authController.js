import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Admin from "../models/Admin.js";

/**
 * Register a new admin.
 * POST /api/admin/auth/register
 */
export const register = async (req, res) => {
  try {
    const { firstName, lastName, email, password, inviteCode } = req.body;

    // ── Invite code gate ─────────────────────────────────────────
    const serverCode = process.env.ADMIN_INVITE_CODE;
    if (!serverCode) {
      // Env var not set — block all registrations to fail safely
      return res.status(403).json({ error: "Admin registration is currently disabled." });
    }
    if (!inviteCode || inviteCode.trim() !== serverCode.trim()) {
      return res.status(403).json({ error: "Invalid invite code. Contact the system owner." });
    }

    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(409).json({ error: "An admin with this email already exists." });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const admin = new Admin({
      firstName,
      lastName,
      email,
      password: hashedPassword,
    });

    await admin.save();

    const token = jwt.sign(
      { id: admin._id, email: admin.email, role: admin.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
    );

    const adminResponse = admin.toObject();
    delete adminResponse.password;

    res.status(201).json({
      success: true,
      message: "Admin registered successfully.",
      token,
      admin: adminResponse,
    });
  } catch (error) {
    console.error("Admin registration error:", error);
    res.status(500).json({ error: "Registration failed." });
  }
};

/**
 * Login an admin.
 * POST /api/admin/auth/login
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const token = jwt.sign(
      { id: admin._id, email: admin.email, role: admin.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
    );

    const adminResponse = admin.toObject();
    delete adminResponse.password;

    res.json({
      success: true,
      message: "Login successful.",
      token,
      admin: adminResponse,
    });
  } catch (error) {
    console.error("Admin login error:", error);
    res.status(500).json({ error: "Login failed." });
  }
};
