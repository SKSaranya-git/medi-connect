import { v4 as uuidv4 } from "uuid";
import Session from "../models/Session.js";

const JITSI_DOMAIN = process.env.JITSI_DOMAIN || "meet.jit.si";

/**
 * Create a new video session for an appointment.
 * POST /api/telemedicine/sessions
 */
export const createSession = async (req, res) => {
  try {
    const { appointmentId, doctorId, patientId, scheduledAt } = req.body;

    if (!appointmentId || !doctorId || !patientId || !scheduledAt) {
      return res.status(400).json({
        error: "appointmentId, doctorId, patientId, and scheduledAt are required.",
      });
    }

    // Check if session already exists for this appointment
    const existingSession = await Session.findOne({ appointmentId });
    if (existingSession) {
      return res.status(409).json({
        error: "A session already exists for this appointment.",
        session: existingSession,
      });
    }

    // Generate unique room name
    const roomName = `mediconnect-${uuidv4().substring(0, 8)}`;
    const jitsiUrl = `https://${JITSI_DOMAIN}/${roomName}`;

    const session = new Session({
      appointmentId,
      doctorId,
      patientId,
      roomName,
      jitsiDomain: JITSI_DOMAIN,
      jitsiUrl,
      scheduledAt: new Date(scheduledAt),
    });

    await session.save();

    res.status(201).json({ success: true, message: "Video session created.", session });
  } catch (error) {
    console.error("Create session error:", error);
    res.status(500).json({ error: "Failed to create session." });
  }
};

/**
 * Get session details by ID.
 * GET /api/telemedicine/sessions/:id
 */
export const getSessionById = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) {
      return res.status(404).json({ error: "Session not found." });
    }
    res.json(session);
  } catch (error) {
    console.error("Get session error:", error);
    res.status(500).json({ error: "Failed to fetch session." });
  }
};

/**
 * Get session for a specific appointment.
 * GET /api/telemedicine/sessions/appointment/:appointmentId
 */
export const getSessionByAppointment = async (req, res) => {
  try {
    const session = await Session.findOne({ appointmentId: req.params.appointmentId });
    if (!session) {
      return res.status(404).json({ error: "No session found for this appointment." });
    }
    res.json(session);
  } catch (error) {
    console.error("Get session by appointment error:", error);
    res.status(500).json({ error: "Failed to fetch session." });
  }
};

/**
 * Start a video session (doctor only).
 * PUT /api/telemedicine/sessions/:id/start
 */
export const startSession = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) {
      return res.status(404).json({ error: "Session not found." });
    }

    if (session.status === "active") {
      return res.status(400).json({ error: "Session is already active." });
    }

    session.status = "active";
    session.startedAt = new Date();
    await session.save();

    res.json({ success: true, message: "Session started.", session });
  } catch (error) {
    console.error("Start session error:", error);
    res.status(500).json({ error: "Failed to start session." });
  }
};

/**
 * End a video session (doctor only).
 * PUT /api/telemedicine/sessions/:id/end
 */
export const endSession = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) {
      return res.status(404).json({ error: "Session not found." });
    }

    session.status = "completed";
    session.endedAt = new Date();
    session.notes = req.body.notes || "";

    // Calculate duration in minutes
    if (session.startedAt) {
      const durationMs = session.endedAt - session.startedAt;
      session.duration = Math.round(durationMs / 60000);
    }

    await session.save();

    res.json({ success: true, message: "Session ended.", session });
  } catch (error) {
    console.error("End session error:", error);
    res.status(500).json({ error: "Failed to end session." });
  }
};

/**
 * Get all sessions (optionally filtered by doctorId or patientId).
 * GET /api/telemedicine/sessions
 */
export const getAllSessions = async (req, res) => {
  try {
    const filter = {};
    if (req.query.doctorId) filter.doctorId = req.query.doctorId;
    if (req.query.patientId) filter.patientId = req.query.patientId;

    const sessions = await Session.find(filter).sort({ scheduledAt: -1 });
    res.json(sessions);
  } catch (error) {
    console.error("Get sessions error:", error);
    res.status(500).json({ error: "Failed to fetch sessions." });
  }
};
