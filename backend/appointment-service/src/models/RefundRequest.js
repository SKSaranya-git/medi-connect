import mongoose from "mongoose";

const refundRequestSchema = new mongoose.Schema(
  {
    appointmentId: {
      type: String,
      required: true,
      index: true,
    },
    patientId: {
      type: String,
      default: "",
    },
    patientNIC: {
      type: String,
      default: "",
    },
    patientEmail: {
      type: String,
      default: "",
    },
    patientPhone: {
      type: String,
      default: "",
    },
    amountRequested: {
      type: Number,
      default: 0,
    },
    reason: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["pending_review", "approved", "rejected"],
      default: "pending_review",
      index: true,
    },
    adminId: {
      type: String,
      default: "",
    },
    adminNote: {
      type: String,
      default: "",
    },
    reviewedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

const RefundRequest = mongoose.model("RefundRequest", refundRequestSchema);

export default RefundRequest;
