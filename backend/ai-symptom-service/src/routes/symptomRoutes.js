import { Router } from "express";
import { checkSymptoms, getSpecializations } from "../controllers/symptomController.js";

const router = Router();

// POST - Analyze symptoms
router.post("/check", checkSymptoms);

// GET - List medical specializations
router.get("/specializations", getSpecializations);

export default router;
