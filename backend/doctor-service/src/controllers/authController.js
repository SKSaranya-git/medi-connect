import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Doctor from "../models/Doctor.js";
import { uploadToCloudinary } from "../config/cloudinary.js";

/**
 * Register a new doctor.
 * POST /api/doctors/auth/register
 */
export const register = async (req, res) => {
  try {
    const {
      title, firstName, lastName, email, password, phone,
      specialization, qualifications, experience,
      hospitalAffiliation, consultationFee, gender, bio, serviceType,
    } = req.body;

    // Check if doctor already exists
    const existingDoctor = await Doctor.findOne({ email });
    if (existingDoctor) {
      return res.status(409).json({ error: "A doctor with this email already exists." });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    let governmentIdUrl = "";
    let governmentIdPublicId = "";
    if (req.file) {
      const uploadResult = await uploadToCloudinary(req.file.buffer, "mediconnect/doctor-ids");
      governmentIdUrl = uploadResult.url;
      governmentIdPublicId = uploadResult.publicId;
    }

    // Create doctor (unverified by default — admin must verify)
    const doctor = new Doctor({
      title: title || "Dr",
      firstName,
      lastName,
      email,
      password: hashedPassword,
      phone,
      specialization,
      qualifications: qualifications || [],
      experience: experience || 0,
      hospitalAffiliation: hospitalAffiliation || "",
      consultationFee: consultationFee || 0,
      gender,
      bio: bio || "",
      serviceType: serviceType || "both",
      isVerified: false,
      governmentIdUrl,
      governmentIdPublicId,
    });

    await doctor.save();

    const doctorResponse = doctor.toObject();
    delete doctorResponse.password;

    res.status(201).json({
      success: true,
      message: "Doctor registered successfully. Awaiting admin verification.",
      doctor: doctorResponse,
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "Registration failed. Please try again." });
  }
};

/**
 * Login a doctor.
 * POST /api/doctors/auth/login
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const doctor = await Doctor.findOne({ email });
    if (!doctor) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    if (doctor.accountStatus === "suspended") {
      return res.status(403).json({ error: "Your account has been suspended. Please contact support." });
    }

    if (!doctor.isVerified) {
      return res.status(403).json({ error: "Your account is pending verification by an administrator." });
    }

    const isMatch = await bcrypt.compare(password, doctor.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const token = jwt.sign(
      { id: doctor._id, email: doctor.email, role: doctor.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
    );

    const doctorResponse = doctor.toObject();
    delete doctorResponse.password;

    res.json({
      success: true,
      message: "Login successful.",
      token,
      doctor: doctorResponse,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Login failed. Please try again." });
  }
};
