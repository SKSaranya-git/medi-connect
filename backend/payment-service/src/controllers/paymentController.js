import {
  createPayment,
  findAllPayments,
  findPaymentById,
  findPaymentsByPatient,
  findPaymentsByAppointment,
  updatePaymentStatus,
  updatePaymentByOrderId,
} from "../models/Payment.js";
import { confirmAppointmentPayment, sendPaymentConfirmedNotification } from "../services/notificationClient.js";

// Process a new payment
export const processPayment = async (req, res) => {
  const {
    appointment_id, patient_id, order_id, amount, currency,
    payment_method, payer_name, payer_email, payer_phone,
  } = req.body;

  try {
    const payment = await createPayment({
      appointmentId: appointment_id,
      patientId: patient_id,
      orderId: order_id,
      amount,
      currency,
      status: "failed",
      paymentMethod: payment_method,
      payerName: payer_name,
      payerEmail: payer_email,
      payerPhone: payer_phone,
    });
    res.status(201).json({ success: true, payment });
  } catch (error) {
    console.error("Payment processing error:", error);
    res.status(500).json({ error: "Payment processing failed" });
  }
};

// Get all payments
export const getPayments = async (req, res) => {
  try {
    const payments = await findAllPayments();
    res.json(payments);
  } catch (error) {
    console.error("Fetch payments error:", error);
    res.status(500).json({ error: "Failed to fetch payments" });
  }
};

// Get payment by ID
export const getPaymentById = async (req, res) => {
  try {
    const payment = await findPaymentById(req.params.id);
    if (!payment) {
      return res.status(404).json({ error: "Payment not found" });
    }
    res.json(payment);
  } catch (error) {
    console.error("Fetch payment error:", error);
    res.status(500).json({ error: "Failed to fetch payment" });
  }
};

// Get payments by patient
export const getPaymentsByPatient = async (req, res) => {
  try {
    const payments = await findPaymentsByPatient(req.params.patientId);
    res.json(payments);
  } catch (error) {
    console.error("Fetch patient payments error:", error);
    res.status(500).json({ error: "Failed to fetch payments" });
  }
};

// Get payments by appointment
export const getPaymentsByAppointment = async (req, res) => {
  try {
    const payments = await findPaymentsByAppointment(req.params.appointmentId);
    res.json(payments);
  } catch (error) {
    console.error("Fetch appointment payments error:", error);
    res.status(500).json({ error: "Failed to fetch payments" });
  }
};

// Update payment status
export const updatePayment = async (req, res) => {
  const { status } = req.body;
  try {
    const payment = await updatePaymentStatus(req.params.id, status);
    if (!payment) {
      return res.status(404).json({ error: "Payment not found" });
    }
    res.json({ success: true, payment });
  } catch (error) {
    console.error("Update payment error:", error);
    res.status(500).json({ error: "Failed to update payment" });
  }
};

// Update payment status by order ID
export const updatePaymentByOrder = async (req, res) => {
  const { status } = req.body;

  if (!["completed", "failed", "refunded"].includes(status)) {
    return res.status(400).json({ error: "Invalid payment status." });
  }

  try {
    const payment = await updatePaymentByOrderId(req.params.orderId, { status });
    if (!payment) {
      return res.status(404).json({ error: "Payment not found" });
    }
    res.json({ success: true, payment });
  } catch (error) {
    console.error("Update payment by order error:", error);
    res.status(500).json({ error: "Failed to update payment" });
  }
};

/**
 * PayHere IPN (Instant Payment Notification) webhook handler.
 * POST /api/payments/notify
 *
 * PayHere sends a POST with payment status updates.
 * See: https://support.payhere.lk/api-&-mobile-sdk/payhere-checkout
 */
export const handlePayHereNotify = async (req, res) => {
  try {
    const {
      merchant_id,
      order_id,
      payment_id,
      payhere_amount,
      payhere_currency,
      status_code,
      method,
    } = req.body;

    console.log(`[PayHere IPN] Order: ${order_id}, Status: ${status_code}, Payment: ${payment_id}`);

    // Map PayHere status codes
    let status = "failed";
    if (status_code === "2") status = "completed";
    else if (status_code === "-1") status = "failed";
    else if (status_code === "-3") status = "refunded";

    // Update payment record by order ID
    const payment = await updatePaymentByOrderId(order_id, {
      status,
      payherePaymentId: payment_id,
      paymentMethod: method || "",
    });

    if (payment) {
      console.log(`[PayHere IPN] Payment ${order_id} updated to ${status}`);

      if (status === "completed") {
        try {
          await confirmAppointmentPayment(payment.appointment_id);
        } catch (appointmentError) {
          console.warn("Payment completed, but appointment confirmation failed:", appointmentError.message);
        }

        try {
          await sendPaymentConfirmedNotification(payment);
        } catch (notificationError) {
          console.warn("Payment completed, but notification failed:", notificationError.message);
        }
      }
    } else {
      console.warn(`[PayHere IPN] Payment not found for order: ${order_id}`);
    }

    // PayHere expects a 200 response
    res.sendStatus(200);
  } catch (error) {
    console.error("PayHere IPN error:", error);
    res.sendStatus(200); // Still return 200 to prevent retries
  }
};
