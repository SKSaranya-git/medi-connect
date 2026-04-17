import { Router } from "express";
import { verifyToken, authorizeRoles } from "../middleware/authMiddleware.js";
import {
  getProfile,
  updateProfile,
  uploadReport,
  getReports,
  getReportsByPatientId,
  getReportsByLookup,
  getPatientByLookup,
  deleteReport,
  getAllPatients,
  getPatientById,
  updatePatientStatus,
} from "../controllers/patientController.js";
import { upload } from "../config/cloudinary.js";

const router = Router();

// ─── Protected Patient Routes ────────────────────────────────────
router.get("/profile", verifyToken, authorizeRoles("patient"), getProfile);
router.put("/profile", verifyToken, authorizeRoles("patient"), updateProfile);

// Medical reports (Cloudinary upload)
router.post(
  "/reports",
  verifyToken,
  authorizeRoles("patient"),
  (req, res, next) => {
    upload.single("file")(req, res, (err) => {
      if (err) {
        return res.status(400).json({ error: err.message || "File upload failed." });
      }
      next();
    });
  },
  uploadReport
);
router.get("/reports", verifyToken, authorizeRoles("patient"), getReports);
router.delete("/reports/:id", verifyToken, authorizeRoles("patient"), deleteReport);

// ─── Admin / Internal Routes ─────────────────────────────────────
router.get("/", verifyToken, authorizeRoles("admin"), getAllPatients);
router.get("/reports/lookup", verifyToken, authorizeRoles("admin", "doctor"), getReportsByLookup);
router.get("/lookup", verifyToken, authorizeRoles("admin", "doctor"), getPatientByLookup);
router.get("/:id/reports", verifyToken, authorizeRoles("admin", "doctor"), getReportsByPatientId);
router.put("/:id/status", verifyToken, authorizeRoles("admin"), updatePatientStatus);
router.get("/:id", verifyToken, authorizeRoles("admin", "patient"), getPatientById);

export default router;
