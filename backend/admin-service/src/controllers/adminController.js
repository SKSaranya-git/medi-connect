/**
 * Admin controller — makes HTTP calls to other microservices
 * to manage users, verify doctors, and oversee platform operations.
 */

import Admin from "../models/Admin.js";

const PATIENT_SERVICE_URL = process.env.PATIENT_SERVICE_URL || "http://localhost:3003";
const DOCTOR_SERVICE_URL = process.env.DOCTOR_SERVICE_URL || "http://localhost:3004";
const APPOINTMENT_SERVICE_URL = process.env.APPOINTMENT_SERVICE_URL || "http://localhost:3000";
const PAYMENT_SERVICE_URL = process.env.PAYMENT_SERVICE_URL || "http://localhost:3001";

/**
 * Helper to make internal service calls with the admin's JWT.
 */
const serviceRequest = async (url, options = {}, token = null) => {
  const headers = { "Content-Type": "application/json" };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(url, { ...options, headers });
  const data = await response.json();

  if (!response.ok) {
    const error = new Error(data.error || "Service call failed");
    error.status = response.status;
    throw error;
  }

  return data;
};

// ─── Admin Profile ──────────────────────────────────────────────

/**
 * Get authenticated admin profile.
 * GET /api/admin/profile
 */
export const getProfile = async (req, res) => {
  try {
    const admin = await Admin.findById(req.user.id).select("-password");
    if (!admin) {
      return res.status(404).json({ error: "Admin not found." });
    }
    res.json(admin);
  } catch (error) {
    console.error("Get admin profile error:", error);
    res.status(500).json({ error: "Failed to fetch profile." });
  }
};

/**
 * Update authenticated admin profile.
 * PUT /api/admin/profile
 */
export const updateProfile = async (req, res) => {
  try {
    const allowedFields = ["firstName", "lastName"];
    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    const admin = await Admin.findByIdAndUpdate(
      req.user.id,
      updates,
      { new: true, runValidators: true }
    ).select("-password");

    if (!admin) {
      return res.status(404).json({ error: "Admin not found." });
    }

    res.json({ success: true, message: "Profile updated.", admin });
  } catch (error) {
    console.error("Update admin profile error:", error);
    res.status(500).json({ error: "Failed to update profile." });
  }
};

// ─── Patient Management ──────────────────────────────────────────

/**
 * Get all patients.
 * GET /api/admin/patients
 */
export const getAllPatients = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    const patients = await serviceRequest(`${PATIENT_SERVICE_URL}/api/patients`, {}, token);
    res.json(patients);
  } catch (error) {
    console.error("Get patients error:", error);
    res.status(error.status || 500).json({ error: error.message || "Failed to fetch patients." });
  }
};

/**
 * Get a patient by ID.
 * GET /api/admin/patients/:id
 */
export const getPatientById = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    const patient = await serviceRequest(`${PATIENT_SERVICE_URL}/api/patients/${req.params.id}`, {}, token);
    res.json(patient);
  } catch (error) {
    console.error("Get patient error:", error);
    res.status(error.status || 500).json({ error: error.message || "Failed to fetch patient." });
  }
};

// ─── Doctor Management ───────────────────────────────────────────

/**
 * Get all doctors (including unverified).
 * GET /api/admin/doctors
 */
export const getAllDoctors = async (req, res) => {
  try {
    const doctors = await serviceRequest(`${DOCTOR_SERVICE_URL}/api/doctors`);
    res.json(doctors);
  } catch (error) {
    console.error("Get doctors error:", error);
    res.status(error.status || 500).json({ error: error.message || "Failed to fetch doctors." });
  }
};

/**
 * Verify a doctor registration.
 * PUT /api/admin/doctors/:id/verify
 */
export const verifyDoctor = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    const result = await serviceRequest(
      `${DOCTOR_SERVICE_URL}/api/doctors/${req.params.id}/verify`,
      { method: "PUT" },
      token
    );
    res.json(result);
  } catch (error) {
    console.error("Verify doctor error:", error);
    res.status(error.status || 500).json({ error: error.message || "Failed to verify doctor." });
  }
};

/**
 * Update patient account status.
 * PUT /api/admin/patients/:id/status
 */
export const updatePatientStatus = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    const result = await serviceRequest(
      `${PATIENT_SERVICE_URL}/api/patients/${req.params.id}/status`,
      { method: "PUT", body: JSON.stringify({ status: req.body.status }) },
      token
    );
    res.json(result);
  } catch (error) {
    console.error("Update patient status error:", error);
    res.status(error.status || 500).json({ error: error.message || "Failed to update patient status." });
  }
};

/**
 * Update doctor account status.
 * PUT /api/admin/doctors/:id/status
 */
export const updateDoctorStatus = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    const result = await serviceRequest(
      `${DOCTOR_SERVICE_URL}/api/doctors/${req.params.id}/status`,
      { method: "PUT", body: JSON.stringify({ status: req.body.status }) },
      token
    );
    res.json(result);
  } catch (error) {
    console.error("Update doctor status error:", error);
    res.status(error.status || 500).json({ error: error.message || "Failed to update doctor status." });
  }
};

// ─── Appointment Overview ────────────────────────────────────────

/**
 * Get all appointments.
 * GET /api/admin/appointments
 */
export const getAllAppointments = async (req, res) => {
  try {
    const appointments = await serviceRequest(`${APPOINTMENT_SERVICE_URL}/api/appointments`);
    res.json(appointments);
  } catch (error) {
    console.error("Get appointments error:", error);
    res.status(error.status || 500).json({ error: error.message || "Failed to fetch appointments." });
  }
};

// ─── Financial Overview ──────────────────────────────────────────

/**
 * Get all payments / financial transactions.
 * GET /api/admin/payments
 */
export const getAllPayments = async (req, res) => {
  try {
    const payments = await serviceRequest(`${PAYMENT_SERVICE_URL}/api/payments`);
    res.json(payments);
  } catch (error) {
    console.error("Get payments error:", error);
    res.status(error.status || 500).json({ error: error.message || "Failed to fetch payments." });
  }
};

// ─── Dashboard Stats ─────────────────────────────────────────────

/**
 * Get platform overview statistics.
 * GET /api/admin/dashboard
 */
export const getDashboardStats = async (req, res) => {
  try {
    const [patients, doctors, appointments, payments] = await Promise.allSettled([
      serviceRequest(`${PATIENT_SERVICE_URL}/api/patients`, {}, req.headers.authorization?.split(" ")[1]),
      serviceRequest(`${DOCTOR_SERVICE_URL}/api/doctors`),
      serviceRequest(`${APPOINTMENT_SERVICE_URL}/api/appointments`),
      serviceRequest(`${PAYMENT_SERVICE_URL}/api/payments`),
    ]);

    const stats = {
      totalPatients: patients.status === "fulfilled" ? (Array.isArray(patients.value) ? patients.value.length : 0) : 0,
      totalDoctors: doctors.status === "fulfilled" ? (Array.isArray(doctors.value) ? doctors.value.length : 0) : 0,
      totalAppointments: appointments.status === "fulfilled" ? (Array.isArray(appointments.value) ? appointments.value.length : 0) : 0,
      totalPayments: payments.status === "fulfilled" ? (Array.isArray(payments.value) ? payments.value.length : 0) : 0,
      unverifiedDoctors: doctors.status === "fulfilled" && Array.isArray(doctors.value)
        ? doctors.value.filter(d => !d.isVerified).length
        : 0,
    };

    res.json(stats);
  } catch (error) {
    console.error("Dashboard stats error:", error);
    res.status(500).json({ error: "Failed to fetch dashboard statistics." });
  }
};
