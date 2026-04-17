import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Patient from "../models/Patient.js";

/**
 * Register a new patient.
 * POST /api/patients/auth/register
 */
export const register = async (req, res) => {
  try {
    const { title, firstName, lastName, email, password, phone, nic, area, dateOfBirth, gender } = req.body;

    // Check if patient already exists
    const existingPatient = await Patient.findOne({
      $or: [{ email }, { nic }],
    });

    if (existingPatient) {
      const field = existingPatient.email === email ? "email" : "NIC";
      return res.status(409).json({ error: `A patient with this ${field} already exists.` });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create patient
    const patient = new Patient({
      title,
      firstName,
      lastName,
      email,
      password: hashedPassword,
      phone,
      nic,
      area,
      dateOfBirth,
      gender,
    });

    await patient.save();

    // Generate JWT
    const token = jwt.sign(
      { id: patient._id, email: patient.email, role: patient.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
    );

    // Return patient without password
    const patientResponse = patient.toObject();
    delete patientResponse.password;

    res.status(201).json({
      success: true,
      message: "Patient registered successfully.",
      token,
      patient: patientResponse,
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "Registration failed. Please try again." });
  }
};

/**
 * Login a patient.
 * POST /api/patients/auth/login
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find patient
    const patient = await Patient.findOne({ email });
    if (!patient) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    if (patient.accountStatus === "suspended") {
      return res.status(403).json({ error: "Your account has been suspended. Please contact support." });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, patient.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: patient._id, email: patient.email, role: patient.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
    );

    // Return patient without password
    const patientResponse = patient.toObject();
    delete patientResponse.password;

    res.json({
      success: true,
      message: "Login successful.",
      token,
      patient: patientResponse,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Login failed. Please try again." });
  }
};
