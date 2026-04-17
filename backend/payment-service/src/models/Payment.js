import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    appointment_id: {
      type: String,
      required: true,
    },
    patient_id: {
      type: String,
      default: "",
    },
    order_id: {
      type: String,
      default: "",
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: "LKR",
    },
    status: {
      type: String,
      enum: ["completed", "failed", "refunded"],
      default: "failed",
    },
    payment_method: {
      type: String,
      default: "",
    },
    payhere_payment_id: {
      type: String,
      default: "",
    },
    payer_name: {
      type: String,
      default: "",
    },
    payer_email: {
      type: String,
      default: "",
    },
    payer_phone: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    versionKey: false,
    toJSON: {
      virtuals: false,
      transform: (_doc, ret) => {
        if (ret.status === "pending") {
          ret.status = "failed";
        }
        ret.id = ret._id.toString();
        delete ret._id;
        return ret;
      },
    },
  }
);

const Payment = mongoose.model("Payment", paymentSchema);

// Create a new payment
export const createPayment = async (data) => {
  const {
    appointmentId, patientId, orderId, amount, currency,
    status, paymentMethod, payerName, payerEmail, payerPhone,
  } = data;

  const payment = await Payment.create({
    appointment_id: appointmentId,
    patient_id: patientId || "",
    order_id: orderId || "",
    amount,
    currency: currency || "LKR",
    status: status || "failed",
    payment_method: paymentMethod || "",
    payer_name: payerName || "",
    payer_email: payerEmail || "",
    payer_phone: payerPhone || "",
  });

  return payment.toJSON();
};

// Get all payments
export const findAllPayments = async () => {
  const payments = await Payment.find().sort({ created_at: -1 });
  return payments.map((payment) => payment.toJSON());
};

// Get payment by ID
export const findPaymentById = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return null;
  }

  const payment = await Payment.findById(id);
  return payment ? payment.toJSON() : null;
};

// Get payment by order ID
export const findPaymentByOrderId = async (orderId) => {
  const payment = await Payment.findOne({ order_id: orderId });
  return payment ? payment.toJSON() : null;
};

// Get payments by patient ID
export const findPaymentsByPatient = async (patientId) => {
  const payments = await Payment.find({ patient_id: patientId }).sort({ created_at: -1 });
  return payments.map((payment) => payment.toJSON());
};

// Get payments by appointment ID
export const findPaymentsByAppointment = async (appointmentId) => {
  const payments = await Payment.find({ appointment_id: appointmentId }).sort({ created_at: -1 });
  return payments.map((payment) => payment.toJSON());
};

// Update payment status
export const updatePaymentStatus = async (id, status) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return null;
  }

  const payment = await Payment.findByIdAndUpdate(
    id,
    { status, updated_at: new Date() },
    { new: true }
  );
  return payment ? payment.toJSON() : null;
};

// Update payment by order ID (for PayHere webhook)
export const updatePaymentByOrderId = async (orderId, updates) => {
  const { status, payherePaymentId, paymentMethod } = updates;

  const payment = await Payment.findOneAndUpdate(
    { order_id: orderId },
    {
      status,
      payhere_payment_id: payherePaymentId || "",
      payment_method: paymentMethod || "",
      updated_at: new Date(),
    },
    { new: true }
  );
  return payment ? payment.toJSON() : null;
};