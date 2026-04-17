import { Router } from "express";
import { verifyToken, authorizeRoles } from "../middleware/authMiddleware.js";
import {
  createPrescription,
  getDoctorPrescriptions,
  getPrescriptionById,
  getPatientPrescriptions,
} from "../controllers/prescriptionController.js";

const router = Router();

// ─── Doctor Routes ───────────────────────────────────────────────
router.post("/", verifyToken, authorizeRoles("doctor"), createPrescription);
router.get("/", verifyToken, authorizeRoles("doctor"), getDoctorPrescriptions);
router.get("/patient/:patientId", verifyToken, authorizeRoles("doctor", "patient"), getPatientPrescriptions);
router.get("/:id", verifyToken, authorizeRoles("doctor", "patient"), getPrescriptionById);

export default router;
