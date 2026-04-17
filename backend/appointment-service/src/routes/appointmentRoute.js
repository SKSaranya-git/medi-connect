import express from "express";
import {
    createAppointment,
    getAllAppointments,
    getAppointmentById,
    getAppointmentsByPatient,
    getAppointmentsByDoctor,
    updateAppointment,
    confirmAppointment,
    cancelAppointment,
    respondToAppointment,
    deleteAppointment,
    getRefundRequests,
    approveRefundRequest,
    rejectRefundRequest,
} from "../controllers/appointmentController.js";

const router = express.Router();

router.post("/", createAppointment);
router.get("/", getAllAppointments);
router.get("/refund-requests", getRefundRequests);
router.get("/patient", getAppointmentsByPatient);
router.get("/doctor/:doctorId", getAppointmentsByDoctor);
router.put("/refund-requests/:id/approve", approveRefundRequest);
router.put("/refund-requests/:id/reject", rejectRefundRequest);
router.get("/:id", getAppointmentById);
router.put("/:id", updateAppointment);
router.put("/:id/confirm", confirmAppointment);
router.put("/:id/cancel", cancelAppointment);
router.put("/:id/respond", respondToAppointment);
router.delete("/:id", deleteAppointment);

export default router;