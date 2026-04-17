const CANDIDATE_BASE_URLS = [
  process.env.NOTIFICATION_SERVICE_URL,
  process.env.GATEWAY_URL,
  "http://localhost:3002",
  "http://localhost:3006",
].filter(Boolean);

const postNotification = async (path, payload) => {
  let lastError = null;

  for (const baseUrl of CANDIDATE_BASE_URLS) {
    try {
      const response = await fetch(`${baseUrl}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Notification request failed (${response.status}) via ${baseUrl}: ${text}`);
      }

      return;
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error("Notification request failed for all configured URLs.");
};

const sendGenericNotification = async ({ recipientId, to, type, subject, message, channel }) => {
  if (!to) return;

  await postNotification("/api/notifications/send", {
    recipientId: recipientId || "",
    recipientType: "patient",
    type,
    channel,
    to,
    subject: subject || "",
    message,
  });
};

export const sendAppointmentBookedNotification = async (appointment, doctorInfo = null) => {
  const payload = {
    patientId: appointment.patientId || "",
    patientName: appointment.patientName || "Patient",
    email: appointment.patientEmail || "",
    phone: appointment.patientPhone || "",
    doctorName: appointment.doctorName || "",
    hospitalName: appointment.hospitalName || "",
    appointmentDate: appointment.appointmentDate,
    appointmentTime: appointment.appointmentTime,
    appointmentNo: appointment.appointmentNo,
    doctorId: appointment.doctorId || "",
    doctorEmail: doctorInfo?.email || "",
    doctorPhone: doctorInfo?.phone || "",
  };

  await postNotification("/api/notifications/appointment-booked", payload);
};

export const sendAppointmentCancelledNotification = async (appointment, doctorInfo = null) => {
  const payload = {
    patientId: appointment.patientId || "",
    patientName: appointment.patientName || "Patient",
    email: appointment.patientEmail || "",
    phone: appointment.patientPhone || "",
    appointmentNo: appointment.appointmentNo,
    appointmentDate: appointment.appointmentDate,
    appointmentTime: appointment.appointmentTime,
    doctorName: appointment.doctorName || "",
    hospitalName: appointment.hospitalName || "",
    doctorId: appointment.doctorId || "",
    doctorEmail: doctorInfo?.email || "",
    doctorPhone: doctorInfo?.phone || "",
  };

  try {
    await postNotification("/api/notifications/appointment-cancelled", payload);
  } catch {
    const subject = `Appointment Cancelled - #${appointment.appointmentNo || ""}`;
    const emailMessage = `Dear ${appointment.patientName || "Patient"}, your appointment has been cancelled.`;
    const smsMessage = `MediConnect: Your appointment${appointment.appointmentNo ? ` #${appointment.appointmentNo}` : ""} has been cancelled.`;

    await sendGenericNotification({
      recipientId: appointment.patientId,
      to: appointment.patientEmail,
      type: "email",
      channel: "appointment_cancelled",
      subject,
      message: emailMessage,
    });

    await sendGenericNotification({
      recipientId: appointment.patientId,
      to: appointment.patientPhone,
      type: "sms",
      channel: "appointment_cancelled",
      message: smsMessage,
    });
  }
};

export const sendRefundStatusNotification = async ({
  appointment,
  status,
  adminNote = "",
}) => {
  const patientName = appointment?.patientName || "Patient";
  const appointmentNo = appointment?.appointmentNo ? ` #${appointment.appointmentNo}` : "";
  const approved = status === "approved";

  const subject = approved
    ? `Refund Approved - Appointment${appointmentNo}`
    : `Refund Request Rejected - Appointment${appointmentNo}`;

  const emailMessage = approved
    ? `Dear ${patientName}, your refund request for appointment${appointmentNo} has been approved.${adminNote ? ` Note: ${adminNote}` : ""}`
    : `Dear ${patientName}, your refund request for appointment${appointmentNo} has been rejected.${adminNote ? ` Reason: ${adminNote}` : ""}`;

  const smsMessage = approved
    ? `MediConnect: Refund approved for appointment${appointmentNo}.${adminNote ? ` Note: ${adminNote}` : ""}`
    : `MediConnect: Refund request rejected for appointment${appointmentNo}.${adminNote ? ` Reason: ${adminNote}` : ""}`;

  await sendGenericNotification({
    recipientId: appointment?.patientId,
    to: appointment?.patientEmail,
    type: "email",
    channel: "general",
    subject,
    message: emailMessage,
  });

  await sendGenericNotification({
    recipientId: appointment?.patientId,
    to: appointment?.patientPhone,
    type: "sms",
    channel: "general",
    message: smsMessage,
  });
};
