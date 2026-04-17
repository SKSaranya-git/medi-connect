import { Router } from "express";
import { verifyToken, authorizeRoles } from "../middleware/authMiddleware.js";
import {
  getProfile,
  updateProfile,
  getAllDoctors,
  getDoctorById,
  getSpecializations,
  createAvailability,
  getAvailability,
  updateAvailability,
  deleteAvailability,
  verifyDoctor,
  updateDoctorStatus,
} from "../controllers/doctorController.js";

const router = Router();

// ─── Public Routes ───────────────────────────────────────────────
router.get("/specializations", getSpecializations);
router.get("/", getAllDoctors);
router.get("/:id/availability", getAvailability);
router.get("/:id", getDoctorById);

// ─── Protected Doctor Routes ─────────────────────────────────────
router.get("/me/profile", verifyToken, authorizeRoles("doctor"), getProfile);
router.put("/profile", verifyToken, authorizeRoles("doctor"), updateProfile);

// Availability
router.post("/availability", verifyToken, authorizeRoles("doctor"), createAvailability);
router.put("/availability/:id", verifyToken, authorizeRoles("doctor"), updateAvailability);
router.delete("/availability/:id", verifyToken, authorizeRoles("doctor"), deleteAvailability);

// ─── Admin Route ─────────────────────────────────────────────────
router.put("/:id/verify", verifyToken, authorizeRoles("admin"), verifyDoctor);
router.put("/:id/status", verifyToken, authorizeRoles("admin"), updateDoctorStatus);

export default router;
