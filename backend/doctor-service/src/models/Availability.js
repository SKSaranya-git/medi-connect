import mongoose from "mongoose";

const availabilitySchema = new mongoose.Schema({
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Doctor",
    required: true,
  },
  dayOfWeek: {
    type: String,
    enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
    required: true,
  },
  date: {
    type: Date,
  },
  startTime: {
    type: String,
    required: true,
  },
  endTime: {
    type: String,
    required: true,
  },
  sessionType: {
    type: String,
    enum: ["in-person", "telemedicine"],
    default: "in-person",
  },
  hospital: {
    type: String,
    default: "",
  },
  hospitalLocation: {
    type: String,
    default: "",
  },
  maxPatients: {
    type: Number,
    min: 1,
    default: 20,
  },
  currentPatients: {
    type: Number,
    default: 0,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

const Availability = mongoose.model("Availability", availabilitySchema);

export default Availability;
