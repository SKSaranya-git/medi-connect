import Prescription from "../models/Prescription.js";

const PATIENT_SERVICE_URL = process.env.PATIENT_SERVICE_URL || "http://localhost:3003";

const normalizeMedications = (medications) => {
  if (Array.isArray(medications)) {
    return medications;
  }

  if (typeof medications === "string" && medications.trim()) {
    try {
      const parsed = JSON.parse(medications);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  return [];
};

const resolvePatient = async ({ patientId, patientEmail, patientPhone }, authHeader) => {
  const lookup = new URLSearchParams();
  const trimmedPatientId = patientId?.trim();
  const trimmedEmail = patientEmail?.trim().toLowerCase();
  const trimmedPhone = patientPhone?.trim();

  if (trimmedPatientId) {
    if (trimmedPatientId.includes("@")) {
      lookup.set("email", trimmedPatientId.toLowerCase());
    } else if (/^[0-9+\-()\s]+$/.test(trimmedPatientId) && trimmedPatientId.replace(/\D/g, "").length >= 7) {
      lookup.set("phone", trimmedPatientId);
    } else {
      lookup.set("patientId", trimmedPatientId);
    }
  } else if (trimmedEmail) {
    lookup.set("email", trimmedEmail);
  } else if (trimmedPhone) {
    lookup.set("phone", trimmedPhone);
  }

  if (!lookup.toString()) {
    return null;
  }

  const response = await fetch(`${PATIENT_SERVICE_URL}/api/patients/lookup?${lookup.toString()}`, {
    headers: authHeader ? { Authorization: authHeader } : {},
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || "Patient not found.");
  }

  return data.patient || null;
};

/**
 * Issue a new prescription.
 * POST /api/doctors/prescriptions
 */
export const createPrescription = async (req, res) => {
  try {
    const {
      patientId,
      patientEmail,
      patientPhone,
      patientName,
      appointmentId,
      diagnosis,
      medications,
      notes,
    } = req.body;

    const resolvedMedications = normalizeMedications(medications);

    if (!diagnosis || resolvedMedications.length === 0) {
      return res.status(400).json({
        error: "diagnosis and at least one medication are required.",
      });
    }

    const resolvedPatient = await resolvePatient(
      { patientId, patientEmail, patientPhone },
      req.headers.authorization
    );

    if (!resolvedPatient) {
      return res.status(400).json({
        error: "A valid patient ID, email, or phone number is required.",
      });
    }

    const resolvedPatientName = patientName || [resolvedPatient.firstName, resolvedPatient.lastName].filter(Boolean).join(" ").trim() || resolvedPatient.email || "";

    const prescription = new Prescription({
      doctorId: req.user.id,
      patientId: resolvedPatient._id,
      patientName: resolvedPatientName,
      appointmentId: appointmentId || "",
      diagnosis,
      medications: resolvedMedications,
      notes: notes || "",
    });

    await prescription.save();

    res.status(201).json({ success: true, message: "Prescription issued.", prescription });
  } catch (error) {
    console.error("Create prescription error:", error);
    res.status(500).json({ error: "Failed to issue prescription." });
  }
};

/**
 * Get prescriptions issued by the authenticated doctor.
 * GET /api/doctors/prescriptions
 */
export const getDoctorPrescriptions = async (req, res) => {
  try {
    const prescriptions = await Prescription.find({ doctorId: req.user.id })
      .sort({ issuedAt: -1 });
    res.json(prescriptions);
  } catch (error) {
    console.error("Get prescriptions error:", error);
    res.status(500).json({ error: "Failed to fetch prescriptions." });
  }
};

/**
 * Get a specific prescription by ID.
 * GET /api/doctors/prescriptions/:id
 */
export const getPrescriptionById = async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id);
    if (!prescription) {
      return res.status(404).json({ error: "Prescription not found." });
    }
    res.json(prescription);
  } catch (error) {
    console.error("Get prescription error:", error);
    res.status(500).json({ error: "Failed to fetch prescription." });
  }
};

/**
 * Get prescriptions for a specific patient.
 * GET /api/doctors/prescriptions/patient/:patientId
 */
export const getPatientPrescriptions = async (req, res) => {
  try {
    const prescriptions = await Prescription.find({ patientId: req.params.patientId })
      .sort({ issuedAt: -1 });
    res.json(prescriptions);
  } catch (error) {
    console.error("Get patient prescriptions error:", error);
    res.status(500).json({ error: "Failed to fetch prescriptions." });
  }
};
