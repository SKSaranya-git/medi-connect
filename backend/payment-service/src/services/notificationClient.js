const CANDIDATE_BASE_URLS = [
  process.env.NOTIFICATION_SERVICE_URL,
  process.env.GATEWAY_URL,
  "http://localhost:3002",
  "http://localhost:3006",
].filter(Boolean);

const APPOINTMENT_CANDIDATE_BASE_URLS = [
  process.env.APPOINTMENT_SERVICE_URL,
  process.env.GATEWAY_URL,
  "http://localhost:3000",
  "http://localhost:3002",
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

const fetchAppointmentDetails = async (appointmentId) => {
  if (!appointmentId) return null;

  for (const baseUrl of APPOINTMENT_CANDIDATE_BASE_URLS) {
    try {
      const response = await fetch(`${baseUrl}/api/appointments/${appointmentId}`);
      if (!response.ok) {
        continue;
      }

      const appointment = await response.json();
      return appointment;
    } catch {
      // Try the next candidate URL.
    }
  }

  return null;
};

const createTelemedicineSession = async (appointment) => {
  if (!appointment?._id || !appointment?.doctorId || !appointment?.patientId || !appointment?.appointmentDate || !appointment?.appointmentTime) {
    return null;
  }

  const scheduledAt = new Date(`${appointment.appointmentDate}T${appointment.appointmentTime}:00`).toISOString();

  for (const baseUrl of APPOINTMENT_CANDIDATE_BASE_URLS) {
    try {
      const response = await fetch(`${baseUrl.replace(/\/$/, "")}/api/telemedicine/sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointmentId: appointment._id,
          doctorId: appointment.doctorId,
          patientId: appointment.patientId,
          scheduledAt,
        }),
      });

      if (response.ok) {
        return await response.json();
      }

      if (response.status === 409) {
        return await response.json();
      }
    } catch {
      // Try the next candidate URL.
    }
  }

  return null;
};

const confirmAppointmentAfterPayment = async (appointmentId) => {
  if (!appointmentId) return null;

  for (const baseUrl of APPOINTMENT_CANDIDATE_BASE_URLS) {
    try {
      const response = await fetch(`${baseUrl}/api/appointments/${appointmentId}/confirm`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Appointment confirm request failed (${response.status}) via ${baseUrl}: ${text}`);
      }

      return await response.json();
    } catch {
      // Try the next candidate URL.
    }
  }

  return null;
};

export const sendPaymentConfirmedNotification = async (payment) => {
  const appointment = await fetchAppointmentDetails(payment.appointment_id);

  const payload = {
    patientId: payment.patient_id || "",
    patientName: payment.payer_name || appointment?.patientName || "Patient",
    email: payment.payer_email || "",
    phone: payment.payer_phone || "",
    amount: payment.amount || 0,
    orderId: payment.order_id || "",
    appointmentNo: appointment?.appointmentNo || "",
    appointmentDate: appointment?.appointmentDate || "",
    appointmentTime: appointment?.appointmentTime || "",
    doctorName: appointment?.doctorName || "",
    hospitalName: appointment?.hospitalName || "",
  };

  try {
    await postNotification("/api/notifications/payment-confirmed", payload);
  } catch {
    const subject = `Payment Confirmed - Rs ${payment.amount || 0}`;
    const emailMessage = `Dear ${payload.patientName || "Patient"}, your payment of Rs ${payment.amount || 0} was confirmed for appointment #${payload.appointmentNo || "N/A"} on ${payload.appointmentDate || "N/A"} at ${payload.appointmentTime || "N/A"}. Order ID: ${payment.order_id || "N/A"}.`;
    const smsMessage = `MediConnect: Payment of Rs ${payment.amount || 0} confirmed. Order: ${payment.order_id || "N/A"}.`;

    await sendGenericNotification({
      recipientId: payment.patient_id,
      to: payment.payer_email,
      type: "email",
      channel: "payment_confirmed",
      subject,
      message: emailMessage,
    });

    await sendGenericNotification({
      recipientId: payment.patient_id,
      to: payment.payer_phone,
      type: "sms",
      channel: "payment_confirmed",
      message: smsMessage,
    });
  }
};

export const confirmAppointmentPayment = async (appointmentId) => {
  const confirmedAppointment = await confirmAppointmentAfterPayment(appointmentId);

  if (confirmedAppointment?.appointmentType === "telemedicine") {
    await createTelemedicineSession(confirmedAppointment);
  }

  return confirmedAppointment;
};
