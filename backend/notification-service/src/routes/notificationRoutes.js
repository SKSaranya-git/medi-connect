import { Router } from "express";
import {
  sendNotification,
  sendAppointmentBooked,
  sendAppointmentCancelled,
  sendConsultationCompleted,
  sendPaymentConfirmed,
  getAllNotifications,
  getNotificationById,
  testService,
} from "../controllers/notificationController.js";

const router = Router();

// Template-based notifications (typically called by other services)
router.post("/", sendNotification);
router.post("/send", sendNotification);
router.post("/appointment-booked", sendAppointmentBooked);
router.post("/appointment-cancelled", sendAppointmentCancelled);
router.post("/consultation-completed", sendConsultationCompleted);
router.post("/payment-confirmed", sendPaymentConfirmed);
router.get("/test", testService);

// Admin / query routes
router.get("/", getAllNotifications);
router.get("/:id", getNotificationById);

export default router;
