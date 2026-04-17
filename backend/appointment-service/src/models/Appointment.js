import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema({
    // ─── Patient Info ────────────────────────────────────────────
    patientId: {
        type: String,
        default: "",
    },
    patientTitle: {
        type: String,
        enum: ["Mr", "Mrs", "Ms", "Dr"],
        default: "Mr",
    },
    patientName: {
        type: String,
        required: true,
    },
    patientEmail: {
        type: String,
        default: "",
    },
    patientPhone: {
        type: String,
        required: true,
    },
    patientNIC: {
        type: String,
        required: true,
    },
    patientArea: {
        type: String,
        default: "",
    },

    // ─── Doctor & Hospital Info ──────────────────────────────────
    doctorId: {
        type: String,
        required: true,
    },
    doctorName: {
        type: String,
        default: "",
    },
    specialization: {
        type: String,
        default: "",
    },
    hospitalName: {
        type: String,
        default: "",
    },
    hospitalLocation: {
        type: String,
        default: "",
    },

    // ─── Schedule ────────────────────────────────────────────────
    appointmentDate: {
        type: Date,
        required: true,
    },
    appointmentTime: {
        type: String,
        required: true,
    },
    appointmentNo: {
        type: Number,
        default: 0,
    },
    estimatedTime: {
        type: String,
        default: "",
    },

    // ─── Fees ────────────────────────────────────────────────────
    doctorFee: {
        type: Number,
        default: 0,
    },
    hospitalFee: {
        type: Number,
        default: 0,
    },
    eChannellingFee: {
        type: Number,
        default: 399,
    },
    totalFee: {
        type: Number,
        default: 0,
    },

    // ─── Status ──────────────────────────────────────────────────
    appointmentStatus: {
        type: String,
        enum: ["pending", "confirmed", "cancelled", "completed"],
        default: "pending",
    },
    paymentStatus: {
        type: String,
        enum: ["pending", "paid", "refunded"],
        default: "pending",
    },

    // ─── Appointment Type ────────────────────────────────────────
    appointmentType: {
        type: String,
        enum: ["in-person", "telemedicine"],
        default: "in-person",
    },
}, {
    timestamps: true,
});

const Appointment = mongoose.model("Appointment", appointmentSchema);

export default Appointment;