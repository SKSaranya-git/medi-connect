import mongoose from "mongoose";

const medicationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  dosage: { type: String, required: true },
  frequency: { type: String, required: true },
  duration: { type: String, required: true },
  instructions: { type: String, default: "" },
}, { _id: false });

const prescriptionSchema = new mongoose.Schema({
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Doctor",
    required: true,
  },
  patientId: {
    type: String,
    required: true,
  },
  patientName: {
    type: String,
    required: true,
  },
  appointmentId: {
    type: String,
    default: "",
  },
  diagnosis: {
    type: String,
    required: true,
  },
  medications: {
    type: [medicationSchema],
    required: true,
  },
  notes: {
    type: String,
    default: "",
  },
  issuedAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

const Prescription = mongoose.model("Prescription", prescriptionSchema);

export default Prescription;
