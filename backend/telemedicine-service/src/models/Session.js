import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema({
  appointmentId: {
    type: String,
    required: true,
  },
  doctorId: {
    type: String,
    required: true,
  },
  patientId: {
    type: String,
    required: true,
  },
  roomName: {
    type: String,
    required: true,
    unique: true,
  },
  jitsiDomain: {
    type: String,
    default: "meet.jit.si",
  },
  jitsiUrl: {
    type: String,
    default: "",
  },
  status: {
    type: String,
    enum: ["scheduled", "active", "completed", "cancelled"],
    default: "scheduled",
  },
  scheduledAt: {
    type: Date,
    required: true,
  },
  startedAt: {
    type: Date,
  },
  endedAt: {
    type: Date,
  },
  duration: {
    type: Number, // in minutes
    default: 0,
  },
  notes: {
    type: String,
    default: "",
  },
}, {
  timestamps: true,
});

const Session = mongoose.model("Session", sessionSchema);

export default Session;
