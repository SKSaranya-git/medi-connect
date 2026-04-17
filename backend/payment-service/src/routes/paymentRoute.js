import { Router } from "express";
import {
  processPayment,
  getPayments,
  getPaymentById,
  getPaymentsByPatient,
  getPaymentsByAppointment,
  updatePayment,
  updatePaymentByOrder,
  handlePayHereNotify,
} from "../controllers/paymentController.js";

const router = Router();

router.post("/", processPayment);
router.post("/notify", handlePayHereNotify);
router.get("/", getPayments);
router.get("/patient/:patientId", getPaymentsByPatient);
router.get("/appointment/:appointmentId", getPaymentsByAppointment);
router.get("/:id", getPaymentById);
router.put("/:id", updatePayment);
router.put("/order/:orderId/status", updatePaymentByOrder);

export default router;
