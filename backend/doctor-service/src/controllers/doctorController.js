import Doctor from "../models/Doctor.js";
import Availability from "../models/Availability.js";

const APPOINTMENT_SERVICE_URL = process.env.APPOINTMENT_SERVICE_URL || "http://localhost:3000";

const toMinutes = (timeString) => {
  const [hours, minutes] = String(timeString || "").split(":").map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
  return hours * 60 + minutes;
};

const normalizeDateOnly = (dateInput) => {
  const date = new Date(dateInput);
  if (Number.isNaN(date.valueOf())) return null;
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
};

const getCurrentPatientsForSlot = (slot, appointments = []) => {
  const slotStart = toMinutes(slot.startTime);
  const slotEnd = toMinutes(slot.endTime);
  if (slotStart === null || slotEnd === null) return Number(slot.currentPatients) || 0;

  const slotType = slot.sessionType || "in-person";
  const slotDate = slot.date ? normalizeDateOnly(slot.date) : null;
  const slotDay = slot.dayOfWeek;

  return appointments.filter((appointment) => {
    if (!appointment || appointment.appointmentStatus === "cancelled") return false;
    if ((appointment.appointmentType || "in-person") !== slotType) return false;

    const appointmentDate = normalizeDateOnly(appointment.appointmentDate);
    if (!appointmentDate) return false;

    if (slotDate) {
      if (appointmentDate.valueOf() !== slotDate.valueOf()) return false;
    } else {
      const appointmentDay = appointmentDate.toLocaleString("en-US", { weekday: "long" });
      if (appointmentDay !== slotDay) return false;
    }

    const appointmentMinutes = toMinutes(appointment.appointmentTime);
    if (appointmentMinutes === null) return false;

    return appointmentMinutes >= slotStart && appointmentMinutes <= slotEnd;
  }).length;
};

/**
 * Get the authenticated doctor's profile.
 * GET /api/doctors/profile
 */
export const getProfile = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.user.id).select("-password");
    if (!doctor) {
      return res.status(404).json({ error: "Doctor not found." });
    }
    res.json(doctor);
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ error: "Failed to fetch profile." });
  }
};

/**
 * Update the authenticated doctor's profile.
 * PUT /api/doctors/profile
 */
export const updateProfile = async (req, res) => {
  try {
    const allowedFields = [
      "title", "firstName", "lastName", "phone", "specialization",
      "qualifications", "experience", "hospitalAffiliation",
      "consultationFee", "gender", "profileImage", "bio", "serviceType",
    ];

    const updates = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    const doctor = await Doctor.findByIdAndUpdate(
      req.user.id,
      updates,
      { new: true, runValidators: true }
    ).select("-password");

    if (!doctor) {
      return res.status(404).json({ error: "Doctor not found." });
    }

    res.json({ success: true, message: "Profile updated.", doctor });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ error: "Failed to update profile." });
  }
};

/**
 * Get all doctors (public, with optional filters).
 * GET /api/doctors
 * Query params: specialization, name, isVerified
 */
export const getAllDoctors = async (req, res) => {
  try {
    const filter = {};
    
    if (req.query.specialization) {
      filter.specialization = { $regex: req.query.specialization, $options: "i" };
    }
    if (req.query.name) {
      const nameRegex = { $regex: req.query.name, $options: "i" };
      filter.$or = [{ firstName: nameRegex }, { lastName: nameRegex }];
    }
    if (req.query.verified !== undefined) {
      filter.isVerified = req.query.verified === "true";
    }
    if (req.query.serviceType) {
      if (req.query.serviceType === "telemedicine") {
        filter.serviceType = { $in: ["telemedicine", "both"] };
      } else if (req.query.serviceType === "in-person") {
        filter.serviceType = { $in: ["in-person", "both"] };
      }
    }

    const doctors = await Doctor.find(filter)
      .select("-password")
      .sort({ createdAt: -1 });

    res.json(doctors);
  } catch (error) {
    console.error("Get all doctors error:", error);
    res.status(500).json({ error: "Failed to fetch doctors." });
  }
};

/**
 * Get a doctor by ID (public).
 * GET /api/doctors/:id
 */
export const getDoctorById = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id).select("-password");
    if (!doctor) {
      return res.status(404).json({ error: "Doctor not found." });
    }
    res.json(doctor);
  } catch (error) {
    console.error("Get doctor error:", error);
    res.status(500).json({ error: "Failed to fetch doctor." });
  }
};

/**
 * Get available specializations (distinct values).
 * GET /api/doctors/specializations
 */
export const getSpecializations = async (req, res) => {
  try {
    const specializations = await Doctor.distinct("specialization");
    res.json(specializations);
  } catch (error) {
    console.error("Get specializations error:", error);
    res.status(500).json({ error: "Failed to fetch specializations." });
  }
};

// ─── Availability Management ─────────────────────────────────────

/**
 * Create an availability slot.
 * POST /api/doctors/availability
 */
export const createAvailability = async (req, res) => {
  try {
    const { dayOfWeek, date, startTime, endTime, sessionType, hospital, hospitalLocation, maxPatients } = req.body;

    const doctor = await Doctor.findById(req.user.id).select("serviceType");
    if (!doctor) {
      return res.status(404).json({ error: "Doctor not found." });
    }

    const requestedSessionType = sessionType || "in-person";
    if (doctor.serviceType === "in-person" && requestedSessionType === "telemedicine") {
      return res.status(400).json({ error: "This doctor is configured for in-person service only." });
    }
    if (doctor.serviceType === "telemedicine" && requestedSessionType === "in-person") {
      return res.status(400).json({ error: "This doctor is configured for telemedicine service only." });
    }

    const normalizedMaxPatients = Number.isFinite(Number(maxPatients))
      ? Math.max(1, Math.floor(Number(maxPatients)))
      : 20;

    const availability = new Availability({
      doctorId: req.user.id,
      dayOfWeek,
      date,
      startTime,
      endTime,
      sessionType: requestedSessionType,
      hospital: hospital || "",
      hospitalLocation: hospitalLocation || "",
      maxPatients: normalizedMaxPatients,
    });

    await availability.save();
    res.status(201).json({ success: true, message: "Availability slot created.", availability });
  } catch (error) {
    console.error("Create availability error:", error);
    res.status(500).json({ error: "Failed to create availability." });
  }
};

/**
 * Get a doctor's availability slots.
 * GET /api/doctors/:id/availability
 */
export const getAvailability = async (req, res) => {
  try {
    const slots = await Availability.find({
      doctorId: req.params.id,
      isActive: true,
    }).sort({ dayOfWeek: 1, startTime: 1 });

    let appointments = [];
    try {
      const appointmentsResponse = await fetch(`${APPOINTMENT_SERVICE_URL}/api/appointments/doctor/${req.params.id}`);
      if (appointmentsResponse.ok) {
        const appointmentData = await appointmentsResponse.json();
        if (Array.isArray(appointmentData)) {
          appointments = appointmentData;
        }
      }
    } catch {
      appointments = [];
    }

    const slotsWithCounts = slots.map((slot) => ({
      ...slot.toObject(),
      currentPatients: getCurrentPatientsForSlot(slot, appointments),
    }));

    res.json(slotsWithCounts);
  } catch (error) {
    console.error("Get availability error:", error);
    res.status(500).json({ error: "Failed to fetch availability." });
  }
};

/**
 * Update an availability slot.
 * PUT /api/doctors/availability/:id
 */
export const updateAvailability = async (req, res) => {
  try {
    const slot = await Availability.findOne({
      _id: req.params.id,
      doctorId: req.user.id,
    });

    if (!slot) {
      return res.status(404).json({ error: "Availability slot not found." });
    }

    const doctor = await Doctor.findById(req.user.id).select("serviceType");
    if (!doctor) {
      return res.status(404).json({ error: "Doctor not found." });
    }

    const allowedFields = ["dayOfWeek", "date", "startTime", "endTime", "sessionType", "hospital", "hospitalLocation", "maxPatients", "isActive"];
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        if (field === "maxPatients") {
          const parsedMax = Number(req.body.maxPatients);
          if (!Number.isFinite(parsedMax) || parsedMax < 1) {
            return res.status(400).json({ error: "maxPatients must be a number greater than 0." });
          }
          slot.maxPatients = Math.floor(parsedMax);
        } else {
          slot[field] = req.body[field];
        }
      }
    }

    if (doctor.serviceType === "in-person" && slot.sessionType === "telemedicine") {
      return res.status(400).json({ error: "This doctor is configured for in-person service only." });
    }
    if (doctor.serviceType === "telemedicine" && slot.sessionType === "in-person") {
      return res.status(400).json({ error: "This doctor is configured for telemedicine service only." });
    }

    await slot.save();
    res.json({ success: true, message: "Availability updated.", availability: slot });
  } catch (error) {
    console.error("Update availability error:", error);
    res.status(500).json({ error: "Failed to update availability." });
  }
};

/**
 * Delete an availability slot.
 * DELETE /api/doctors/availability/:id
 */
export const deleteAvailability = async (req, res) => {
  try {
    const slot = await Availability.findOneAndDelete({
      _id: req.params.id,
      doctorId: req.user.id,
    });

    if (!slot) {
      return res.status(404).json({ error: "Availability slot not found." });
    }

    res.json({ success: true, message: "Availability slot deleted." });
  } catch (error) {
    console.error("Delete availability error:", error);
    res.status(500).json({ error: "Failed to delete availability." });
  }
};

/**
 * Verify a doctor (admin only).
 * PUT /api/doctors/:id/verify
 */
export const verifyDoctor = async (req, res) => {
  try {
    const doctor = await Doctor.findByIdAndUpdate(
      req.params.id,
      { isVerified: true },
      { new: true }
    ).select("-password");

    if (!doctor) {
      return res.status(404).json({ error: "Doctor not found." });
    }

    res.json({ success: true, message: "Doctor verified successfully.", doctor });
  } catch (error) {
    console.error("Verify doctor error:", error);
    res.status(500).json({ error: "Failed to verify doctor." });
  }
};

/**
 * Update doctor account status (admin only).
 * PUT /api/doctors/:id/status
 */
export const updateDoctorStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!["active", "suspended"].includes(status)) {
      return res.status(400).json({ error: "Invalid status. Use active or suspended." });
    }

    const doctor = await Doctor.findByIdAndUpdate(
      req.params.id,
      { accountStatus: status },
      { new: true, runValidators: true }
    ).select("-password");

    if (!doctor) {
      return res.status(404).json({ error: "Doctor not found." });
    }

    res.json({ success: true, message: `Doctor account ${status}.`, doctor });
  } catch (error) {
    console.error("Update doctor status error:", error);
    res.status(500).json({ error: "Failed to update doctor status." });
  }
};
