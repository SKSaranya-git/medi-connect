import { Router } from "express";
import { register, login } from "../controllers/authController.js";
import { upload } from "../config/cloudinary.js";

const router = Router();

router.post(
  "/register",
  (req, res, next) => {
    upload.single("governmentId")(req, res, (err) => {
      if (err) {
        return res.status(400).json({ error: err.message || "File upload failed." });
      }
      next();
    });
  },
  register
);
router.post("/login", login);

export default router;
