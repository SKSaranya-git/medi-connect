import Notification from "../models/Notification.js";
import { sendEmail } from "../services/emailService.js";
import { sendSMS } from "../services/smsService.js";

// ─── Email Templates ─────────────────────────────────────────────

const templates = {

  appointment_booked: (data) => {
    const formattedDate = new Date(data.appointmentDate).toISOString().split('T')[0];
    return {
      subject: `Appointment Confirmed - #${data.appointmentNo}`,
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 650px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
          <div style="background-color: #0f172a; padding: 24px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">MediConnect</h1>
          </div>
          <div style="padding: 32px;">
            <h2 style="color: #334155; margin-top: 0; font-size: 20px;">Appointment Confirmed</h2>
            <p style="color: #475569; font-size: 16px; line-height: 1.6;">Dear <strong>${data.patientName}</strong>,</p>
            <p style="color: #475569; font-size: 16px; line-height: 1.6;">Your appointment has been successfully booked and confirmed. Here are the details of your upcoming visit:</p>
            <div style="background-color: #f8fafc; border-left: 4px solid #3b82f6; padding: 20px; border-radius: 4px; margin: 24px 0;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr><td style="padding: 8px 0; color: #64748b; font-size: 14px; width: 40%;">Appointment No</td><td style="padding: 8px 0; color: #0f172a; font-size: 16px; font-weight: 600;">#${data.appointmentNo}</td></tr>
                <tr><td style="padding: 8px 0; color: #64748b; font-size: 14px; border-top: 1px solid #e2e8f0;">Doctor</td><td style="padding: 8px 0; color: #0f172a; font-size: 16px; font-weight: 600; border-top: 1px solid #e2e8f0;">${data.doctorName || 'N/A'}</td></tr>
                <tr><td style="padding: 8px 0; color: #64748b; font-size: 14px; border-top: 1px solid #e2e8f0;">Hospital</td><td style="padding: 8px 0; color: #0f172a; font-size: 16px; font-weight: 600; border-top: 1px solid #e2e8f0;">${data.hospitalName || 'N/A'}</td></tr>
                <tr><td style="padding: 8px 0; color: #64748b; font-size: 14px; border-top: 1px solid #e2e8f0;">Date</td><td style="padding: 8px 0; color: #0f172a; font-size: 16px; font-weight: 600; border-top: 1px solid #e2e8f0;">${formattedDate}</td></tr>
                <tr><td style="padding: 8px 0; color: #64748b; font-size: 14px; border-top: 1px solid #e2e8f0;">Time</td><td style="padding: 8px 0; color: #0f172a; font-size: 16px; font-weight: 600; border-top: 1px solid #e2e8f0;">${data.appointmentTime}</td></tr>
              </table>
            </div>
            <p style="color: #475569; font-size: 15px; margin-bottom: 0;">Please arrive 15 minutes before your scheduled time.</p>
          </div>
          <div style="background-color: #f1f5f9; padding: 16px; text-align: center; border-top: 1px solid #e2e8f0;">
            <p style="color: #64748b; font-size: 13px; margin: 0;">Thank you for choosing MediConnect for your healthcare needs.</p>
            <p style="color: #94a3b8; font-size: 12px; margin: 4px 0 0;">&copy; ${new Date().getFullYear()} MediConnect. All rights reserved.</p>
          </div>
        </div>
      `,
      sms: `MediConnect: Hi ${data.patientName}, your appointment #${data.appointmentNo} with ${data.doctorName || 'your doctor'} on ${formattedDate} at ${data.appointmentTime} is confirmed. Please arrive 15 mins early.`,
    };
  },

  doctor_appointment_booked: (data) => {
    const formattedDate = new Date(data.appointmentDate).toISOString().split('T')[0];
    const docName = data.doctorName ? data.doctorName.replace(/^dr\.?\s*/i, '') : 'Doctor';
    return {
      subject: `New Appointment Scheduled - #${data.appointmentNo}`,
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 650px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
          <div style="background-color: #0f172a; padding: 24px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">MediConnect Portal</h1>
          </div>
          <div style="padding: 32px;">
            <h2 style="color: #334155; margin-top: 0; font-size: 20px;">New Appointment Scheduled</h2>
            <p style="color: #475569; font-size: 16px; line-height: 1.6;">Dear <strong>Dr. ${docName}</strong>,</p>
            <p style="color: #475569; font-size: 16px; line-height: 1.6;">A new appointment has been scheduled and confirmed in your calendar. Please review the details below:</p>
            <div style="background-color: #f8fafc; border-left: 4px solid #10b981; padding: 20px; border-radius: 4px; margin: 24px 0;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr><td style="padding: 8px 0; color: #64748b; font-size: 14px; width: 40%;">Patient Name</td><td style="padding: 8px 0; color: #0f172a; font-size: 16px; font-weight: 600;">${data.patientName}</td></tr>
                <tr><td style="padding: 8px 0; color: #64748b; font-size: 14px; border-top: 1px solid #e2e8f0;">Appointment No</td><td style="padding: 8px 0; color: #0f172a; font-size: 16px; font-weight: 600; border-top: 1px solid #e2e8f0;">#${data.appointmentNo}</td></tr>
                <tr><td style="padding: 8px 0; color: #64748b; font-size: 14px; border-top: 1px solid #e2e8f0;">Date</td><td style="padding: 8px 0; color: #0f172a; font-size: 16px; font-weight: 600; border-top: 1px solid #e2e8f0;">${formattedDate}</td></tr>
                <tr><td style="padding: 8px 0; color: #64748b; font-size: 14px; border-top: 1px solid #e2e8f0;">Time</td><td style="padding: 8px 0; color: #0f172a; font-size: 16px; font-weight: 600; border-top: 1px solid #e2e8f0;">${data.appointmentTime}</td></tr>
              </table>
            </div>
            <p style="color: #475569; font-size: 15px; margin-bottom: 0;">You can view more details regarding this appointment in your MediConnect Doctor Dashboard.</p>
          </div>
          <div style="background-color: #f1f5f9; padding: 16px; text-align: center; border-top: 1px solid #e2e8f0;">
            <p style="color: #64748b; font-size: 13px; margin: 0;">MediConnect Physician Services</p>
          </div>
        </div>
      `,
      sms: `MediConnect Portal: Dr. ${docName}, new appointment #${data.appointmentNo} scheduled with patient ${data.patientName} on ${formattedDate} at ${data.appointmentTime}.`,
    };
  },

  appointment_cancelled: (data) => {
    return {
      subject: `Appointment Cancelled - #${data.appointmentNo || ''}`,
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 650px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
          <div style="background-color: #0f172a; padding: 24px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">MediConnect</h1>
          </div>
          <div style="padding: 32px;">
            <h2 style="color: #dc2626; margin-top: 0; font-size: 20px;">Appointment Cancelled</h2>
            <p style="color: #475569; font-size: 16px; line-height: 1.6;">Dear <strong>${data.patientName}</strong>,</p>
            <p style="color: #475569; font-size: 16px; line-height: 1.6;">Your appointment #${data.appointmentNo || ''} has been successfully cancelled. If you have already paid for this appointment, our administrative team will review the cancellation and process your refund accordingly.</p>
            <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 20px; border-radius: 4px; margin: 24px 0;">
              <p style="color: #b91c1c; font-size: 15px; margin: 0;">If you did not request this cancellation, please contact MediConnect Support immediately.</p>
            </div>
          </div>
          <div style="background-color: #f1f5f9; padding: 16px; text-align: center; border-top: 1px solid #e2e8f0;">
            <p style="color: #64748b; font-size: 13px; margin: 0;">Thank you for using MediConnect.</p>
          </div>
        </div>
      `,
      sms: `MediConnect: Hi ${data.patientName}, your appointment #${data.appointmentNo} has been cancelled. Contact support if this was unexpected.`,
    };
  },

  doctor_appointment_cancelled: (data) => {
    const docName = data.doctorName ? data.doctorName.replace(/^dr\.?\s*/i, '') : 'Doctor';
    const dateStr = data.appointmentDate ? new Date(data.appointmentDate).toISOString().split('T')[0] : 'N/A';
    return {
      subject: `Appointment Cancellation Notice - #${data.appointmentNo || ''}`,
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 650px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
          <div style="background-color: #0f172a; padding: 24px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">MediConnect Portal</h1>
          </div>
          <div style="padding: 32px;">
            <h2 style="color: #dc2626; margin-top: 0; font-size: 20px;">Appointment Cancelled</h2>
            <p style="color: #475569; font-size: 16px; line-height: 1.6;">Dear <strong>Dr. ${docName}</strong>,</p>
            <p style="color: #475569; font-size: 16px; line-height: 1.6;">Please be advised that the following appointment has been cancelled and removed from your active schedule:</p>
            <div style="background-color: #f8fafc; border-left: 4px solid #ef4444; padding: 20px; border-radius: 4px; margin: 24px 0;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr><td style="padding: 8px 0; color: #64748b; font-size: 14px; width: 40%;">Patient Name</td><td style="padding: 8px 0; color: #0f172a; font-size: 16px; font-weight: 600;">${data.patientName}</td></tr>
                <tr><td style="padding: 8px 0; color: #64748b; font-size: 14px; border-top: 1px solid #e2e8f0;">Appointment No</td><td style="padding: 8px 0; color: #0f172a; font-size: 16px; font-weight: 600; border-top: 1px solid #e2e8f0;">#${data.appointmentNo}</td></tr>
                <tr><td style="padding: 8px 0; color: #64748b; font-size: 14px; border-top: 1px solid #e2e8f0;">Date</td><td style="padding: 8px 0; color: #0f172a; font-size: 16px; font-weight: 600; border-top: 1px solid #e2e8f0;">${dateStr}</td></tr>
                <tr><td style="padding: 8px 0; color: #64748b; font-size: 14px; border-top: 1px solid #e2e8f0;">Time</td><td style="padding: 8px 0; color: #0f172a; font-size: 16px; font-weight: 600; border-top: 1px solid #e2e8f0;">${data.appointmentTime || 'N/A'}</td></tr>
              </table>
            </div>
            <p style="color: #475569; font-size: 15px; margin-bottom: 0;">This time slot is now available for other patients to book.</p>
          </div>
          <div style="background-color: #f1f5f9; padding: 16px; text-align: center; border-top: 1px solid #e2e8f0;">
            <p style="color: #64748b; font-size: 13px; margin: 0;">MediConnect Physician Services</p>
          </div>
        </div>
      `,
      sms: `MediConnect Portal: Dr. ${docName}, the appointment #${data.appointmentNo} with patient ${data.patientName} on ${dateStr} has been cancelled.`,
    };
  },

  consultation_completed: (data) => ({
    subject: `Consultation Completed`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #1a6fa0;">MediConnect - Consultation Summary</h2>
        <p>Dear ${data.patientName},</p>
        <p>Your consultation with ${data.doctorName || 'your doctor'} has been completed.</p>
        <p>Duration: ${data.duration || 'N/A'} minutes</p>
        <p>You can view your prescription and medical records in the MediConnect app.</p>
        <p style="color: #888; font-size: 12px;">Thank you for choosing MediConnect.</p>
      </div>
    `,
    sms: `MediConnect: Your consultation with ${data.doctorName || 'the doctor'} is completed. Check the app for details.`,
  }),

  payment_confirmed: (data) => ({
    subject: `Payment Confirmed - Rs ${data.amount}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #1a6fa0;">MediConnect - Payment Confirmed</h2>
        <p>Dear ${data.patientName},</p>
        <p>Your appointment payment has been successfully confirmed.</p>
        <h3 style="margin-top: 20px; color: #0f172a;">Appointment Details</h3>
        <table style="width: 100%; border-collapse: collapse; margin: 12px 0 20px;">
          <tr><td style="padding: 8px; color: #666;">Doctor</td><td style="padding: 8px; font-weight: bold;">${data.doctorName || 'N/A'}</td></tr>
          <tr><td style="padding: 8px; color: #666;">Hospital</td><td style="padding: 8px; font-weight: bold;">${data.hospitalName || 'N/A'}</td></tr>
          <tr><td style="padding: 8px; color: #666;">Date</td><td style="padding: 8px; font-weight: bold;">${data.appointmentDate || 'N/A'}</td></tr>
          <tr><td style="padding: 8px; color: #666;">Time</td><td style="padding: 8px; font-weight: bold;">${data.appointmentTime || 'N/A'}</td></tr>
          <tr><td style="padding: 8px; color: #666;">Appointment No</td><td style="padding: 8px; font-weight: bold;">#${data.appointmentNo || 'N/A'}</td></tr>
        </table>
        <h3 style="margin-top: 8px; color: #0f172a;">Payment Details</h3>
        <table style="width: 100%; border-collapse: collapse; margin: 12px 0;">
          <tr><td style="padding: 8px; color: #666;">Amount</td><td style="padding: 8px; font-weight: bold;">Rs ${data.amount}</td></tr>
          <tr><td style="padding: 8px; color: #666;">Order ID</td><td style="padding: 8px; font-weight: bold;">${data.orderId || 'N/A'}</td></tr>
        </table>
        <p style="color: #888; font-size: 12px;">Thank you for your payment.</p>
      </div>
    `,
    sms: `MediConnect: Payment of Rs ${data.amount} confirmed. Order: ${data.orderId || 'N/A'}.`,
  }),
};

// todo: delete
export const testService = async (req, res) => {
  try {
    return res.json({ success: true, message: "Notification service is working!" });
  } catch (error) {
    console.error("Test service error:", error);
    return res.status(500).json({ success: false, error: "Notification service test failed." });
  }
};

// ─── Controller Methods ──────────────────────────────────────────

/**
 * Send a notification (generic).
 * POST /api/notifications/send
 */
export const sendNotification = async (req, res) => {
  try {
    const { recipientId, recipientType, type, channel, to, subject, message } = req.body;

    if (!to || !message || !type) {
      return res.status(400).json({ error: "to, message, and type are required." });
    }

    // Create notification record
    const notification = new Notification({
      recipientId: recipientId || "",
      recipientType: recipientType || "patient",
      type,
      channel: channel || "general",
      to,
      subject: subject || "",
      message,
    });

    // Send via appropriate channel
    let result;
    if (type === "email") {
      result = await sendEmail(to, subject || "MediConnect Notification", message);
    } else if (type === "sms") {
      result = await sendSMS(to, message);
    }

    if (result?.success) {
      notification.status = "sent";
      notification.sentAt = new Date();
    } else {
      notification.status = "failed";
      notification.error = result?.error || "Unknown error";
    }

    await notification.save();

    res.status(201).json({ success: result?.success, notification });
  } catch (error) {
    console.error("Send notification error:", error);
    res.status(500).json({ error: "Failed to send notification." });
  }
};

/**
 * Send templated notification for appointment booking.
 * POST /api/notifications/appointment-booked
 */
export const sendAppointmentBooked = async (req, res) => {
  try {
    const data = req.body;
    const patientTemplate = templates.appointment_booked(data);
    const results = [];

    // --- PATIENT NOTIFICATIONS ---
    if (data.email) {
      const emailResult = await sendEmail(data.email, patientTemplate.subject, patientTemplate.html);
      const notification = new Notification({
        recipientId: data.patientId || "",
        recipientType: "patient",
        type: "email",
        channel: "appointment_booked",
        to: data.email,
        subject: patientTemplate.subject,
        message: patientTemplate.html,
        status: emailResult.success ? "sent" : "failed",
        sentAt: emailResult.success ? new Date() : undefined,
        error: emailResult.error || "",
      });
      await notification.save();
      results.push({ recipient: "patient", type: "email", success: emailResult.success, error: emailResult.error || "" });
    }

    if (data.phone) {
      const smsResult = await sendSMS(data.phone, patientTemplate.sms);
      const smsNotification = new Notification({
        recipientId: data.patientId || "",
        recipientType: "patient",
        type: "sms",
        channel: "appointment_booked",
        to: data.phone,
        message: patientTemplate.sms,
        status: smsResult.success ? "sent" : "failed",
        sentAt: smsResult.success ? new Date() : undefined,
        error: smsResult.error || "",
      });
      await smsNotification.save();
      results.push({ recipient: "patient", type: "sms", success: smsResult.success, error: smsResult.error || "" });
    }

    // --- DOCTOR NOTIFICATIONS ---
    if (data.doctorEmail || data.doctorPhone) {
      const doctorTemplate = templates.doctor_appointment_booked(data);
      
      if (data.doctorEmail) {
        const docEmailResult = await sendEmail(data.doctorEmail, doctorTemplate.subject, doctorTemplate.html);
        const docNotification = new Notification({
          recipientId: data.doctorId || "doctor-id",
          recipientType: "doctor",
          type: "email",
          channel: "appointment_booked",
          to: data.doctorEmail,
          subject: doctorTemplate.subject,
          message: doctorTemplate.html,
          status: docEmailResult.success ? "sent" : "failed",
          sentAt: docEmailResult.success ? new Date() : undefined,
          error: docEmailResult.error || "",
        });
        await docNotification.save();
        results.push({ recipient: "doctor", type: "email", success: docEmailResult.success, error: docEmailResult.error || "" });
      }

      if (data.doctorPhone) {
        const docSmsResult = await sendSMS(data.doctorPhone, doctorTemplate.sms);
        const docSmsNotification = new Notification({
          recipientId: data.doctorId || "doctor-id",
          recipientType: "doctor",
          type: "sms",
          channel: "appointment_booked",
          to: data.doctorPhone,
          message: doctorTemplate.sms,
          status: docSmsResult.success ? "sent" : "failed",
          sentAt: docSmsResult.success ? new Date() : undefined,
          error: docSmsResult.error || "",
        });
        await docSmsNotification.save();
        results.push({ recipient: "doctor", type: "sms", success: docSmsResult.success, error: docSmsResult.error || "" });
      }
    }

    const success = results.length > 0 && results.every((item) => item.success);
    res.status(201).json({ success, results });
  } catch (error) {
    console.error("Appointment booked notification error:", error);
    res.status(500).json({ error: "Failed to send notification." });
  }
};

/**
 * Send templated notification for appointment cancellation.
 * POST /api/notifications/appointment-cancelled
 */
export const sendAppointmentCancelled = async (req, res) => {
  try {
    const data = req.body;
    const patientTemplate = templates.appointment_cancelled(data);
    const results = [];

    // --- PATIENT NOTIFICATIONS ---
    if (data.email) {
      const emailResult = await sendEmail(data.email, patientTemplate.subject, patientTemplate.html);
      const notification = new Notification({
        recipientId: data.patientId || "",
        recipientType: "patient",
        type: "email",
        channel: "appointment_cancelled",
        to: data.email,
        subject: patientTemplate.subject,
        message: patientTemplate.html,
        status: emailResult.success ? "sent" : "failed",
        sentAt: emailResult.success ? new Date() : undefined,
        error: emailResult.error || "",
      });
      await notification.save();
      results.push({ recipient: "patient", type: "email", success: emailResult.success, error: emailResult.error || "" });
    }

    if (data.phone) {
      const smsResult = await sendSMS(data.phone, patientTemplate.sms);
      const smsNotification = new Notification({
        recipientId: data.patientId || "",
        recipientType: "patient",
        type: "sms",
        channel: "appointment_cancelled",
        to: data.phone,
        message: patientTemplate.sms,
        status: smsResult.success ? "sent" : "failed",
        sentAt: smsResult.success ? new Date() : undefined,
        error: smsResult.error || "",
      });
      await smsNotification.save();
      results.push({ recipient: "patient", type: "sms", success: smsResult.success, error: smsResult.error || "" });
    }

    // --- DOCTOR NOTIFICATIONS ---
    if (data.doctorEmail || data.doctorPhone) {
      const doctorTemplate = templates.doctor_appointment_cancelled(data);
      
      if (data.doctorEmail) {
        const docEmailResult = await sendEmail(data.doctorEmail, doctorTemplate.subject, doctorTemplate.html);
        const docNotification = new Notification({
          recipientId: data.doctorId || "doctor-id",
          recipientType: "doctor",
          type: "email",
          channel: "appointment_cancelled",
          to: data.doctorEmail,
          subject: doctorTemplate.subject,
          message: doctorTemplate.html,
          status: docEmailResult.success ? "sent" : "failed",
          sentAt: docEmailResult.success ? new Date() : undefined,
          error: docEmailResult.error || "",
        });
        await docNotification.save();
        results.push({ recipient: "doctor", type: "email", success: docEmailResult.success, error: docEmailResult.error || "" });
      }

      if (data.doctorPhone) {
        const docSmsResult = await sendSMS(data.doctorPhone, doctorTemplate.sms);
        const docSmsNotification = new Notification({
          recipientId: data.doctorId || "doctor-id",
          recipientType: "doctor",
          type: "sms",
          channel: "appointment_cancelled",
          to: data.doctorPhone,
          message: doctorTemplate.sms,
          status: docSmsResult.success ? "sent" : "failed",
          sentAt: docSmsResult.success ? new Date() : undefined,
          error: docSmsResult.error || "",
        });
        await docSmsNotification.save();
        results.push({ recipient: "doctor", type: "sms", success: docSmsResult.success, error: docSmsResult.error || "" });
      }
    }

    const success = results.length > 0 && results.every((item) => item.success);
    res.status(201).json({ success, results });
  } catch (error) {
    console.error("Appointment cancelled notification error:", error);
    res.status(500).json({ error: "Failed to send notification." });
  }
};

/**
 * Send templated notification for consultation completion.
 * POST /api/notifications/consultation-completed
 */
export const sendConsultationCompleted = async (req, res) => {
  try {
    const data = req.body;
    const template = templates.consultation_completed(data);
    const results = [];

    if (data.email) {
      const emailResult = await sendEmail(data.email, template.subject, template.html);
      const notification = new Notification({
        recipientId: data.patientId || "",
        recipientType: "patient",
        type: "email",
        channel: "consultation_completed",
        to: data.email,
        subject: template.subject,
        message: template.html,
        status: emailResult.success ? "sent" : "failed",
        sentAt: emailResult.success ? new Date() : undefined,
        error: emailResult.error || "",
      });
      await notification.save();
      results.push({ type: "email", success: emailResult.success, error: emailResult.error || "" });
    }

    if (data.phone) {
      const smsResult = await sendSMS(data.phone, template.sms);
      const notification = new Notification({
        recipientId: data.patientId || "",
        recipientType: "patient",
        type: "sms",
        channel: "consultation_completed",
        to: data.phone,
        message: template.sms,
        status: smsResult.success ? "sent" : "failed",
        sentAt: smsResult.success ? new Date() : undefined,
        error: smsResult.error || "",
      });
      await notification.save();
      results.push({ type: "sms", success: smsResult.success, error: smsResult.error || "" });
    }

    const success = results.length > 0 && results.every((item) => item.success);
    res.status(201).json({ success, results });
  } catch (error) {
    console.error("Consultation completed notification error:", error);
    res.status(500).json({ error: "Failed to send notification." });
  }
};

/**
 * Send templated notification for payment confirmation.
 * POST /api/notifications/payment-confirmed
 */
export const sendPaymentConfirmed = async (req, res) => {
  try {
    const data = req.body;
    const template = templates.payment_confirmed(data);
    const results = [];

    if (data.email) {
      const emailResult = await sendEmail(data.email, template.subject, template.html);
      const notification = new Notification({
        recipientId: data.patientId || "",
        recipientType: "patient",
        type: "email",
        channel: "payment_confirmed",
        to: data.email,
        subject: template.subject,
        message: template.html,
        status: emailResult.success ? "sent" : "failed",
        sentAt: emailResult.success ? new Date() : undefined,
        error: emailResult.error || "",
      });
      await notification.save();
      results.push({ type: "email", success: emailResult.success, error: emailResult.error || "" });
    }

    if (data.phone) {
      const smsResult = await sendSMS(data.phone, template.sms);
      const notification = new Notification({
        recipientId: data.patientId || "",
        recipientType: "patient",
        type: "sms",
        channel: "payment_confirmed",
        to: data.phone,
        message: template.sms,
        status: smsResult.success ? "sent" : "failed",
        sentAt: smsResult.success ? new Date() : undefined,
        error: smsResult.error || "",
      });
      await notification.save();
      results.push({ type: "sms", success: smsResult.success, error: smsResult.error || "" });
    }

    const success = results.length > 0 && results.every((item) => item.success);
    res.status(201).json({ success, results });
  } catch (error) {
    console.error("Payment confirmed notification error:", error);
    res.status(500).json({ error: "Failed to send notification." });
  }
};

/**
 * Get all notifications (admin).
 * GET /api/notifications
 */
export const getAllNotifications = async (req, res) => {
  try {
    const filter = {};
    if (req.query.type) filter.type = req.query.type;
    if (req.query.channel) filter.channel = req.query.channel;
    if (req.query.status) filter.status = req.query.status;

    const notifications = await Notification.find(filter).sort({ createdAt: -1 }).limit(100);
    res.json(notifications);
  } catch (error) {
    console.error("Get notifications error:", error);
    res.status(500).json({ error: "Failed to fetch notifications." });
  }
};

/**
 * Get notification by ID.
 * GET /api/notifications/:id
 */
export const getNotificationById = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      return res.status(404).json({ error: "Notification not found." });
    }
    res.json(notification);
  } catch (error) {
    console.error("Get notification error:", error);
    res.status(500).json({ error: "Failed to fetch notification." });
  }
};
