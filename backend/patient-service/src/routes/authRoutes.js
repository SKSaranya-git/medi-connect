import { Router } from "express";
import { register, login } from "../controllers/authController.js";

const router = Router();

// POST /api/patients/auth/register
router.post("/register", register);

// POST /api/patients/auth/login
router.post("/login", login);

export default router;
