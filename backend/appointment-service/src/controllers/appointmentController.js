import Appointment from "../models/Appointment.js";
import RefundRequest from "../models/RefundRequest.js";
import {
    sendAppointmentBookedNotification,
    sendAppointmentCancelledNotification,
    sendRefundStatusNotification,
} from "../services/notificationClient.js";

const DOCTOR_SERVICE_URL = process.env.DOCTOR_SERVICE_URL || "http://localhost:3004";
const PAYMENT_SERVICE_URL = process.env.PAYMENT_SERVICE_URL || "http://localhost:3001";

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

const findMatchingSlot = (slots, appointmentDate, appointmentTime, appointmentType) => {
    const requestedDate = normalizeDateOnly(appointmentDate);
    const requestedMinutes = toMinutes(appointmentTime);
    if (!requestedDate || requestedMinutes === null) return null;

    const dayOfWeek = requestedDate.toLocaleString("en-US", { weekday: "long" });

    return slots.find((slot) => {
        if (!slot || slot.isActive === false) return false;
        if (slot.dayOfWeek !== dayOfWeek) return false;
        if ((slot.sessionType || "in-person") !== (appointmentType || "in-person")) return false;

        if (slot.date) {
            const slotDate = normalizeDateOnly(slot.date);
            if (!slotDate || slotDate.valueOf() !== requestedDate.valueOf()) return false;
        }

        const slotStart = toMinutes(slot.startTime);
        const slotEnd = toMinutes(slot.endTime);
        if (slotStart === null || slotEnd === null) return false;

        return requestedMinutes >= slotStart && requestedMinutes <= slotEnd;
    }) || null;
};

const refundCompletedPaymentsForAppointment = async (appointmentId) => {
    const paymentsResponse = await fetch(`${PAYMENT_SERVICE_URL}/api/payments/appointment/${appointmentId}`);
    if (!paymentsResponse.ok) {
        throw new Error("Failed to fetch appointment payments for refund.");
    }

    const payments = await paymentsResponse.json();
    if (!Array.isArray(payments) || payments.length === 0) {
        return 0;
    }

    let refundedCount = 0;
    for (const payment of payments) {
        if (!payment?.id || payment.status !== "completed") {
            continue;
        }

        const updateResponse = await fetch(`${PAYMENT_SERVICE_URL}/api/payments/${payment.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "refunded" }),
        });

        if (updateResponse.ok) {
            refundedCount += 1;
        }
    }

    return refundedCount;
};

// Create Appointment
export const createAppointment = async (req, res) => {
    try {
        const {
            patientId, patientTitle, patientName, patientEmail, patientPhone,
            patientNIC, patientArea, doctorId, doctorName, specialization,
            hospitalName, hospitalLocation, appointmentDate, appointmentTime,
            doctorFee, hospitalFee, eChannellingFee, appointmentType,
        } = req.body;

        if (!doctorId || !appointmentDate || !appointmentTime) {
            return res.status(400).json({ message: "doctorId, appointmentDate, and appointmentTime are required." });
        }

        // Enforce doctor-defined schedule patient limit.
        const availabilityResponse = await fetch(`${DOCTOR_SERVICE_URL}/api/doctors/${doctorId}/availability`);
        if (!availabilityResponse.ok) {
            return res.status(502).json({ message: "Failed to verify doctor availability. Please try again." });
        }

        const slots = await availabilityResponse.json();
        const matchingSlot = findMatchingSlot(
            Array.isArray(slots) ? slots : [],
            appointmentDate,
            appointmentTime,
            appointmentType || "in-person"
        );

        if (!matchingSlot) {
            return res.status(400).json({ message: "Selected schedule slot is not available for this doctor." });
        }

        const requestedDate = normalizeDateOnly(appointmentDate);
        const slotStart = matchingSlot.startTime;
        const slotEnd = matchingSlot.endTime;

        const bookedCount = await Appointment.countDocuments({
            doctorId,
            appointmentDate: requestedDate,
            appointmentType: matchingSlot.sessionType || "in-person",
            appointmentTime: { $gte: slotStart, $lte: slotEnd },
            appointmentStatus: { $ne: "cancelled" },
        });

        const slotLimit = Number(matchingSlot.maxPatients) || 20;
        if (bookedCount >= slotLimit) {
            return res.status(409).json({ message: `This schedule is full (${slotLimit} patients). Please choose a different time.` });
        }

        // Auto-generate appointment number (count for same doctor + date + 1)
        const existingCount = await Appointment.countDocuments({
            doctorId,
            appointmentDate: requestedDate,
        });
        const appointmentNo = existingCount + 1;

        // Calculate estimated time (base time + 10 min per patient ahead)
        const [hours, minutes] = appointmentTime.split(":").map(Number);
        const baseMinutes = hours * 60 + (minutes || 0);
        const estimatedMinutes = baseMinutes + (appointmentNo - 1) * 10;
        const estHours = Math.floor(estimatedMinutes / 60);
        const estMins = estimatedMinutes % 60;
        const period = estHours >= 12 ? "PM" : "AM";
        const displayHours = estHours > 12 ? estHours - 12 : estHours || 12;
        const estimatedTime = `${displayHours}:${estMins.toString().padStart(2, "0")} ${period}`;

        // Calculate total fee
        const totalFee = (doctorFee || 0) + (hospitalFee || 0) + (eChannellingFee || 399);

        const appointment = new Appointment({
            patientId: patientId || "",
            patientTitle: patientTitle || "Mr",
            patientName,
            patientEmail: patientEmail || "",
            patientPhone,
            patientNIC,
            patientArea: patientArea || "",
            doctorId,
            doctorName: doctorName || "",
            specialization: specialization || "",
            hospitalName: hospitalName || "",
            hospitalLocation: hospitalLocation || "",
            appointmentDate: requestedDate,
            appointmentTime,
            appointmentNo,
            estimatedTime,
            doctorFee: doctorFee || 0,
            hospitalFee: hospitalFee || 0,
            eChannellingFee: eChannellingFee || 399,
            totalFee,
            appointmentType: appointmentType || "in-person",
        });

        await appointment.save();

        res.status(201).json(appointment);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Confirm Appointment after successful payment
export const confirmAppointment = async (req, res) => {
    try {
        const appointment = await Appointment.findById(req.params.id);

        if (!appointment) {
            return res.status(404).json({ message: "Appointment not found" });
        }

        if (appointment.appointmentStatus === "confirmed" && appointment.paymentStatus === "paid") {
            return res.status(200).json(appointment);
        }

        appointment.appointmentStatus = "confirmed";
        appointment.paymentStatus = "paid";
        await appointment.save();

        let doctorInfo = null;
        try {
            const doctorResponse = await fetch(`${DOCTOR_SERVICE_URL}/api/doctors/${appointment.doctorId}`);
            if (doctorResponse.ok) {
                doctorInfo = await doctorResponse.json();
            }
        } catch (err) {
            console.warn("Failed to fetch doctor details for notification:", err.message);
        }

        try {
            await sendAppointmentBookedNotification(appointment, doctorInfo);
        } catch (notificationError) {
            console.warn("Appointment confirmed, but notification failed:", notificationError.message);
        }

        res.status(200).json(appointment);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get All Appointments
export const getAllAppointments = async (req, res) => {
    try {
        const appointments = await Appointment.find().sort({ createdAt: -1 });
        res.status(200).json(appointments);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get Appointment by ID
export const getAppointmentById = async (req, res) => {
    try {
        const appointment = await Appointment.findById(req.params.id);
        if (!appointment) {
            return res.status(404).json({ message: "Appointment not found" });
        }
        res.status(200).json(appointment);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get Appointments by Patient (by patientId or NIC)
export const getAppointmentsByPatient = async (req, res) => {
    try {
        const { patientId, nic } = req.query;
        const filter = {};
        if (patientId) filter.patientId = patientId;
        if (nic) filter.patientNIC = nic;

        const appointments = await Appointment.find(filter).sort({ appointmentDate: -1 });
        res.status(200).json(appointments);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get Appointments by Doctor
export const getAppointmentsByDoctor = async (req, res) => {
    try {
        const appointments = await Appointment.find({
            doctorId: req.params.doctorId,
        }).sort({ appointmentDate: -1 });
        res.status(200).json(appointments);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update Appointment
export const updateAppointment = async (req, res) => {
    try {
        const appointment = await Appointment.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        if (!appointment) {
            return res.status(404).json({ message: "Appointment not found" });
        }
        res.status(200).json(appointment);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Cancel Appointment
export const cancelAppointment = async (req, res) => {
    try {
        const appointment = await Appointment.findById(req.params.id);
        if (!appointment) {
            return res.status(404).json({ message: "Appointment not found" });
        }

        if (appointment.appointmentStatus === "cancelled") {
            const existingRequest = await RefundRequest.findOne({
                appointmentId: String(appointment._id),
                status: "pending_review",
            });
            return res.status(200).json({
                message: "Appointment already cancelled",
                appointment,
                refundProcessed: appointment.paymentStatus === "refunded",
                refundRequested: !!existingRequest,
                refundRequest: existingRequest || null,
            });
        }

        appointment.appointmentStatus = "cancelled";
        let refundRequested = false;
        let refundRequest = null;
        if (appointment.paymentStatus === "paid") {
            refundRequest = await RefundRequest.findOne({
                appointmentId: String(appointment._id),
                status: "pending_review",
            });

            if (!refundRequest) {
                refundRequest = await RefundRequest.create({
                    appointmentId: String(appointment._id),
                    patientId: appointment.patientId || "",
                    patientNIC: appointment.patientNIC || "",
                    patientEmail: appointment.patientEmail || "",
                    patientPhone: appointment.patientPhone || "",
                    amountRequested: appointment.totalFee || 0,
                    reason: req.body?.reason || "",
                });
            }

            refundRequested = true;
        }

        await appointment.save();

        let doctorInfo = null;
        try {
            const doctorResponse = await fetch(`${DOCTOR_SERVICE_URL}/api/doctors/${appointment.doctorId}`);
            if (doctorResponse.ok) {
                doctorInfo = await doctorResponse.json();
            }
        } catch (err) {
            console.warn("Failed to fetch doctor details for cancellation notification:", err.message);
        }

        try {
            await sendAppointmentCancelledNotification(appointment, doctorInfo);
        } catch (notificationError) {
            console.warn("Appointment cancelled, but notification failed:", notificationError.message);
        }

        res.status(200).json({
            message: refundRequested
                ? "Appointment cancelled. Refund request submitted for admin review."
                : "Appointment cancelled successfully",
            appointment,
            refundRequested,
            refundRequest,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getRefundRequests = async (req, res) => {
    try {
        const { status } = req.query;
        const filter = {};
        if (status) filter.status = status;

        const requests = await RefundRequest.find(filter).sort({ createdAt: -1 });
        res.status(200).json(requests);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const approveRefundRequest = async (req, res) => {
    try {
        const refundRequest = await RefundRequest.findById(req.params.id);
        if (!refundRequest) {
            return res.status(404).json({ message: "Refund request not found" });
        }

        if (refundRequest.status !== "pending_review") {
            return res.status(400).json({ message: "Refund request already reviewed" });
        }

        const appointment = await Appointment.findById(refundRequest.appointmentId);
        if (!appointment) {
            return res.status(404).json({ message: "Appointment not found" });
        }

        const refundedCount = await refundCompletedPaymentsForAppointment(appointment._id);
        if (refundedCount <= 0) {
            return res.status(400).json({ message: "No completed payment found to refund" });
        }

        appointment.paymentStatus = "refunded";
        await appointment.save();

        refundRequest.status = "approved";
        refundRequest.adminId = req.body?.adminId || "";
        refundRequest.adminNote = req.body?.adminNote || "";
        refundRequest.reviewedAt = new Date();
        await refundRequest.save();

        try {
            await sendRefundStatusNotification({
                appointment,
                status: "approved",
                adminNote: refundRequest.adminNote,
            });
        } catch (notificationError) {
            console.warn("Refund approved, but notification failed:", notificationError.message);
        }

        res.status(200).json({
            message: "Refund approved and processed successfully",
            refundRequest,
            appointment,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const rejectRefundRequest = async (req, res) => {
    try {
        const refundRequest = await RefundRequest.findById(req.params.id);
        if (!refundRequest) {
            return res.status(404).json({ message: "Refund request not found" });
        }

        if (refundRequest.status !== "pending_review") {
            return res.status(400).json({ message: "Refund request already reviewed" });
        }

        refundRequest.status = "rejected";
        refundRequest.adminId = req.body?.adminId || "";
        refundRequest.adminNote = req.body?.adminNote || "";
        refundRequest.reviewedAt = new Date();
        await refundRequest.save();

        const appointment = await Appointment.findById(refundRequest.appointmentId);
        if (appointment) {
            try {
                await sendRefundStatusNotification({
                    appointment,
                    status: "rejected",
                    adminNote: refundRequest.adminNote,
                });
            } catch (notificationError) {
                console.warn("Refund rejected, but notification failed:", notificationError.message);
            }
        }

        res.status(200).json({
            message: "Refund request rejected",
            refundRequest,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Doctor respond to appointment request (accept/reject)
export const respondToAppointment = async (req, res) => {
    try {
        const { doctorId, action } = req.body;

        if (!doctorId || !["accept", "reject"].includes(action)) {
            return res.status(400).json({ message: "doctorId and action (accept|reject) are required" });
        }

        const appointment = await Appointment.findById(req.params.id);
        if (!appointment) {
            return res.status(404).json({ message: "Appointment not found" });
        }

        if (appointment.doctorId !== doctorId) {
            return res.status(403).json({ message: "Only the assigned doctor can respond to this appointment" });
        }

        if (appointment.appointmentStatus === "cancelled" || appointment.appointmentStatus === "completed") {
            return res.status(400).json({ message: "This appointment can no longer be updated" });
        }

        if (action === "accept") {
            appointment.appointmentStatus = "confirmed";
        } else {
            appointment.appointmentStatus = "cancelled";
            
            let doctorInfo = null;
            try {
                const doctorResponse = await fetch(`${DOCTOR_SERVICE_URL}/api/doctors/${appointment.doctorId}`);
                if (doctorResponse.ok) {
                    doctorInfo = await doctorResponse.json();
                }
            } catch (err) {
                console.warn("Failed to fetch doctor details for cancellation notification:", err.message);
            }

            try {
                await sendAppointmentCancelledNotification(appointment, doctorInfo);
            } catch (notificationError) {
                console.warn("Appointment rejected, but notification failed:", notificationError.message);
            }
        }

        await appointment.save();

        res.status(200).json({ message: `Appointment ${action}ed successfully`, appointment });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Delete Appointment
export const deleteAppointment = async (req, res) => {
    try {
        const appointment = await Appointment.findByIdAndDelete(req.params.id);
        if (!appointment) {
            return res.status(404).json({ message: "Appointment not found" });
        }
        res.status(200).json({ message: "Appointment deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};