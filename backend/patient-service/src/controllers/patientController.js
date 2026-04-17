import Patient from "../models/Patient.js";
import MedicalReport from "../models/MedicalReport.js";
import { cloudinary, uploadToCloudinary } from "../config/cloudinary.js";

/**
 * Get the authenticated patient's profile.
 * GET /api/patients/profile
 */
export const getProfile = async (req, res) => {
  try {
    const patient = await Patient.findById(req.user.id).select("-password");
    if (!patient) {
      return res.status(404).json({ error: "Patient not found." });
    }
    res.json(patient);
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ error: "Failed to fetch profile." });
  }
};

/**
 * Update the authenticated patient's profile.
 * PUT /api/patients/profile
 */
export const updateProfile = async (req, res) => {
  try {
    const allowedFields = [
      "title", "firstName", "lastName", "phone", "area",
      "dateOfBirth", "gender", "bloodGroup", "allergies", "profileImage",
    ];

    const updates = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    const patient = await Patient.findByIdAndUpdate(
      req.user.id,
      updates,
      { new: true, runValidators: true }
    ).select("-password");

    if (!patient) {
      return res.status(404).json({ error: "Patient not found." });
    }

    res.json({ success: true, message: "Profile updated.", patient });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ error: "Failed to update profile." });
  }
};

/**
 * Upload a medical report (file stored on Cloudinary).
 * POST /api/patients/reports
 */
export const uploadReport = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded." });
    }

    const { title, description } = req.body;

    if (!title) {
      return res.status(400).json({ error: "Report title is required." });
    }

    // Upload buffer to Cloudinary
    const { url, publicId } = await uploadToCloudinary(req.file.buffer);

    // Determine file type from mimetype
    const fileType = req.file.mimetype.startsWith("image") ? "image" : "pdf";

    const report = new MedicalReport({
      patientId: req.user.id,
      title,
      description: description || "",
      fileUrl: url,
      cloudinaryPublicId: publicId,
      fileType,
    });

    await report.save();

    res.status(201).json({ success: true, message: "Report uploaded.", report });
  } catch (error) {
    console.error("Upload report error:", error);
    res.status(500).json({ error: error.message || "Failed to upload report." });
  }
};

/**
 * Get the authenticated patient's medical reports.
 * GET /api/patients/reports
 */
export const getReports = async (req, res) => {
  try {
    const reports = await MedicalReport.find({ patientId: req.user.id })
      .sort({ uploadedAt: -1 });
    res.json(reports);
  } catch (error) {
    console.error("Get reports error:", error);
    res.status(500).json({ error: "Failed to fetch reports." });
  }
};

/**
 * Get reports for a specific patient (doctor/admin use).
 * GET /api/patients/:id/reports
 */
export const getReportsByPatientId = async (req, res) => {
  try {
    const reports = await MedicalReport.find({ patientId: req.params.id })
      .sort({ uploadedAt: -1 });
    res.json(reports);
  } catch (error) {
    console.error("Get reports by patient error:", error);
    res.status(500).json({ error: "Failed to fetch reports." });
  }
};

/**
 * Get reports for a patient by patient ID, email, or phone.
 * GET /api/patients/reports/lookup?patientId=&email=&phone=
 */
export const getReportsByLookup = async (req, res) => {
  try {
    const { patientId, email, phone } = req.query;

    let patient = null;
    if (patientId) {
      patient = await Patient.findById(patientId).select("_id");
    } else if (email) {
      patient = await Patient.findOne({ email: email.trim().toLowerCase() }).select("_id");
    } else if (phone) {
      patient = await Patient.findOne({ phone: phone.trim() }).select("_id");
    }

    if (!patient) {
      return res.status(404).json({ error: "Patient not found." });
    }

    const reports = await MedicalReport.find({ patientId: patient._id })
      .sort({ uploadedAt: -1 });

    res.json({
      patientId: patient._id,
      reports,
    });
  } catch (error) {
    console.error("Get reports by lookup error:", error);
    res.status(500).json({ error: "Failed to fetch reports." });
  }
};

/**
 * Lookup a patient by patient ID, email, or phone.
 * GET /api/patients/lookup?patientId=&email=&phone=
 */
export const getPatientByLookup = async (req, res) => {
  try {
    const { patientId, email, phone } = req.query;

    let patient = null;
    if (patientId) {
      patient = await Patient.findById(patientId).select("-password");
    } else if (email) {
      patient = await Patient.findOne({ email: email.trim().toLowerCase() }).select("-password");
    } else if (phone) {
      patient = await Patient.findOne({ phone: phone.trim() }).select("-password");
    }

    if (!patient) {
      return res.status(404).json({ error: "Patient not found." });
    }

    res.json({ success: true, patient });
  } catch (error) {
    console.error("Get patient by lookup error:", error);
    res.status(500).json({ error: "Failed to fetch patient." });
  }
};

/**
 * Delete a medical report.
 * DELETE /api/patients/reports/:id
 */
export const deleteReport = async (req, res) => {
  try {
    const report = await MedicalReport.findOne({
      _id: req.params.id,
      patientId: req.user.id,
    });

    if (!report) {
      return res.status(404).json({ error: "Report not found." });
    }

    // Delete from Cloudinary
    if (report.cloudinaryPublicId) {
      await cloudinary.uploader.destroy(report.cloudinaryPublicId);
    }

    await MedicalReport.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: "Report deleted." });
  } catch (error) {
    console.error("Delete report error:", error);
    res.status(500).json({ error: "Failed to delete report." });
  }
};

/**
 * Get all patients (for admin/internal use).
 * GET /api/patients
 */
export const getAllPatients = async (req, res) => {
  try {
    const patients = await Patient.find().select("-password").sort({ createdAt: -1 });
    res.json(patients);
  } catch (error) {
    console.error("Get all patients error:", error);
    res.status(500).json({ error: "Failed to fetch patients." });
  }
};

/**
 * Get a patient by ID (for admin/internal use).
 * GET /api/patients/:id
 */
export const getPatientById = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id).select("-password");
    if (!patient) {
      return res.status(404).json({ error: "Patient not found." });
    }
    res.json(patient);
  } catch (error) {
    console.error("Get patient error:", error);
    res.status(500).json({ error: "Failed to fetch patient." });
  }
};

/**
 * Update patient account status (admin use).
 * PUT /api/patients/:id/status
 */
export const updatePatientStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!["active", "suspended"].includes(status)) {
      return res.status(400).json({ error: "Invalid status. Use active or suspended." });
    }

    const patient = await Patient.findByIdAndUpdate(
      req.params.id,
      { accountStatus: status },
      { new: true, runValidators: true }
    ).select("-password");

    if (!patient) {
      return res.status(404).json({ error: "Patient not found." });
    }

    res.json({ success: true, message: `Patient account ${status}.`, patient });
  } catch (error) {
    console.error("Update patient status error:", error);
    res.status(500).json({ error: "Failed to update patient status." });
  }
};
