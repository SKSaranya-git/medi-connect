import mongoose from "mongoose";

const patientSchema = new mongoose.Schema({
  title: {
    type: String,
    enum: ["Mr", "Mrs", "Ms", "Dr"],
    default: "Mr",
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
  nic: {
    type: String,
    required: true,
    unique: true,
  },
  area: {
    type: String,
    default: "",
  },
  dateOfBirth: {
    type: Date,
  },
  gender: {
    type: String,
    enum: ["Male", "Female", "Other"],
  },
  bloodGroup: {
    type: String,
    enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", ""],
    default: "",
  },
  allergies: {
    type: [String],
    default: [],
  },
  role: {
    type: String,
    enum: ["patient", "admin"],
    default: "patient",
  },
  accountStatus: {
    type: String,
    enum: ["active", "suspended"],
    default: "active",
  },
  profileImage: {
    type: String,
    default: "",
  },
}, {
  timestamps: true,
});

const Patient = mongoose.model("Patient", patientSchema);

export default Patient;
