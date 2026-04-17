import { Router } from "express";
import { verifyToken, requireAdmin } from "../middleware/authMiddleware.js";
import {
  getProfile,
  updateProfile,
  getAllPatients,
  getPatientById,
  updatePatientStatus,
  getAllDoctors,
  verifyDoctor,
  updateDoctorStatus,
  getAllAppointments,
  getAllPayments,
  getDashboardStats,
} from "../controllers/adminController.js";

const router = Router();

// All admin routes require authentication + admin role
router.use(verifyToken, requireAdmin);

// Dashboard
router.get("/dashboard", getDashboardStats);

// Admin profile
router.get("/profile", getProfile);
router.put("/profile", updateProfile);

// Patient management
router.get("/patients", getAllPatients);
router.get("/patients/:id", getPatientById);
router.put("/patients/:id/status", updatePatientStatus);

// Doctor management
router.get("/doctors", getAllDoctors);
router.put("/doctors/:id/verify", verifyDoctor);
router.put("/doctors/:id/status", updateDoctorStatus);

// Appointment overview
router.get("/appointments", getAllAppointments);

// Financial overview
router.get("/payments", getAllPayments);

export default router;
