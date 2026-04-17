/**
 * Service Registry — Route-to-Service Mapping
 *
 * Maps gateway URL paths to Consul service names.
 * The gateway uses this to know which Consul service to query
 * when a request comes in for a given path.
 *
 * To add a new service:
 *   1. Ensure the service registers itself with Consul (using consul-service)
 *   2. Add a mapping entry below
 */

const routeMap = {
  "/api/appointments": {
    serviceName: "appointment-service",
    displayName: "Appointment Service",
    fallbackTarget: process.env.APPOINTMENT_SERVICE_URL || "http://127.0.0.1:3000",
  },
  "/api/payments": {
    serviceName: "payment-service",
    displayName: "Payment Service",
    fallbackTarget: process.env.PAYMENT_SERVICE_URL || "http://127.0.0.1:3001",
  },
  "/api/patients": {
    serviceName: "patient-service",
    displayName: "Patient Service",
    fallbackTarget: process.env.PATIENT_SERVICE_URL || "http://127.0.0.1:3003",
  },
  "/api/doctors": {
    serviceName: "doctor-service",
    displayName: "Doctor Service",
    fallbackTarget: process.env.DOCTOR_SERVICE_URL || "http://127.0.0.1:3004",
  },
  "/api/admin": {
    serviceName: "admin-service",
    displayName: "Admin Service",
    fallbackTarget: process.env.ADMIN_SERVICE_URL || "http://127.0.0.1:3008",
  },
  "/api/telemedicine": {
    serviceName: "telemedicine-service",
    displayName: "Telemedicine Service",
    fallbackTarget: process.env.TELEMEDICINE_SERVICE_URL || "http://127.0.0.1:3005",
  },
  "/api/notifications": {
    serviceName: "notification-service",
    displayName: "Notification Service",
    fallbackTarget: process.env.NOTIFICATION_SERVICE_URL || "http://127.0.0.1:3006",
  },
  "/api/symptoms": {
    serviceName: "ai-symptom-service",
    displayName: "AI Symptom Checker Service",
    fallbackTarget: process.env.AI_SYMPTOM_SERVICE_URL || "http://127.0.0.1:3007",
  },
};

export default routeMap;
