import { Router } from "express";
import { verifyToken, authorizeRoles } from "../middleware/authMiddleware.js";
import {
  createSession,
  getSessionById,
  getSessionByAppointment,
  startSession,
  endSession,
  getAllSessions,
} from "../controllers/sessionController.js";

const router = Router();

// Create a video session (doctor or patient)
router.post("/", verifyToken, authorizeRoles("doctor", "patient"), createSession);

// Get all sessions (filtered by query params)
router.get("/", verifyToken, authorizeRoles("doctor", "patient", "admin"), getAllSessions);

// Get session for a specific appointment
router.get("/appointment/:appointmentId", verifyToken, authorizeRoles("doctor", "patient"), getSessionByAppointment);

// Get session by ID
router.get("/:id", verifyToken, authorizeRoles("doctor", "patient"), getSessionById);

// Start session (doctor only)
router.put("/:id/start", verifyToken, authorizeRoles("doctor"), startSession);

// End session (doctor only)
router.put("/:id/end", verifyToken, authorizeRoles("doctor"), endSession);

export default router;
