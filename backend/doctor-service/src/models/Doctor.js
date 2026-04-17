import mongoose from "mongoose";

const doctorSchema = new mongoose.Schema({
  title: {
    type: String,
    default: "Dr",
  },
  firstName: {
    type: String,
    required: true,
    trim: true,
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
  },
  phone: {
    type: String,
    required: true,
  },
  specialization: {
    type: String,
    required: true,
  },
  qualifications: {
    type: [String],
    default: [],
  },
  experience: {
    type: Number,
    default: 0,
  },
  hospitalAffiliation: {
    type: String,
    default: "",
  },
  consultationFee: {
    type: Number,
    default: 0,
  },
  gender: {
    type: String,
    enum: ["Male", "Female", "Other"],
  },
  profileImage: {
    type: String,
    default: "",
  },
  governmentIdUrl: {
    type: String,
    default: "",
  },
  governmentIdPublicId: {
    type: String,
    default: "",
  },
  bio: {
    type: String,
    default: "",
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  serviceType: {
    type: String,
    enum: ["in-person", "telemedicine", "both"],
    default: "both",
  },
  accountStatus: {
    type: String,
    enum: ["active", "suspended"],
    default: "active",
  },
  role: {
    type: String,
    enum: ["doctor"],
    default: "doctor",
  },
}, {
  timestamps: true,
});

const Doctor = mongoose.model("Doctor", doctorSchema);

export default Doctor;
