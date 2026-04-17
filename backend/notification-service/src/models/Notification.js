import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  recipientId: {
    type: String,
    default: "",
  },
  recipientType: {
    type: String,
    enum: ["patient", "doctor", "admin"],
    required: true,
  },
  type: {
    type: String,
    enum: ["email", "sms"],
    required: true,
  },
  channel: {
    type: String,
    enum: [
      "appointment_booked",
      "appointment_cancelled",
      "appointment_confirmed",
      "consultation_completed",
      "payment_confirmed",
      "doctor_verified",
      "general",
    ],
    default: "general",
  },
  to: {
    type: String,
    required: true,
  },
  subject: {
    type: String,
    default: "",
  },
  message: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "sent", "failed"],
    default: "pending",
  },
  sentAt: {
    type: Date,
  },
  error: {
    type: String,
    default: "",
  },
}, {
  timestamps: true,
});

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;
