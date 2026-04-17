/**
 * MediConnect API Service Layer
 * All requests go through the Vite proxy → Gateway → Microservices
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

const getAuthHeaders = () => {
  const token = localStorage.getItem("mediconnect_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    "Content-Type": "application/json",
    ...getAuthHeaders(),
    ...options.headers,
  };

  // Remove Content-Type for FormData (multipart)
  if (options.body instanceof FormData) {
    delete headers["Content-Type"];
  }

  const response = await fetch(url, { ...options, headers });
  const raw = await response.text();
  let data;

  try {
    data = raw ? JSON.parse(raw) : {};
  } catch {
    data = { message: raw || "Request failed" };
  }

  if (!response.ok) {
    const error = new Error(data.error || data.message || "Request failed");
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
};

// ─── Patient Auth ────────────────────────────────────────────────
export const patientApi = {
  register: (data) => apiRequest("/api/patients/auth/register", { method: "POST", body: JSON.stringify(data) }),
  login: (data) => apiRequest("/api/patients/auth/login", { method: "POST", body: JSON.stringify(data) }),
  getProfile: () => apiRequest("/api/patients/profile"),
  updateProfile: (data) => apiRequest("/api/patients/profile", { method: "PUT", body: JSON.stringify(data) }),
  uploadReport: (formData) => apiRequest("/api/patients/reports", { method: "POST", body: formData }),
  getReports: () => apiRequest("/api/patients/reports"),
  getPrescriptions: (patientId) => apiRequest(`/api/doctors/prescriptions/patient/${patientId}`),
  deleteReport: (id) => apiRequest(`/api/patients/reports/${id}`, { method: "DELETE" }),
};

// ─── Doctor ──────────────────────────────────────────────────────
export const doctorApi = {
  register: (formData) => apiRequest("/api/doctors/auth/register", { method: "POST", body: formData }),
  login: (data) => apiRequest("/api/doctors/auth/login", { method: "POST", body: JSON.stringify(data) }),
  getAll: (params = "") => {
    const searchParams = new URLSearchParams(params);
    if (!searchParams.has("verified")) {
      searchParams.set("verified", "true");
    }
    const query = searchParams.toString();
    return apiRequest(`/api/doctors${query ? "?" + query : ""}`);
  },
  getById: (id) => apiRequest(`/api/doctors/${id}`),
  getProfile: () => apiRequest("/api/doctors/me/profile"),
  updateProfile: (data) => apiRequest("/api/doctors/profile", { method: "PUT", body: JSON.stringify(data) }),
  getSpecializations: () => apiRequest("/api/doctors/specializations"),
  createAvailability: (data) => apiRequest("/api/doctors/availability", { method: "POST", body: JSON.stringify(data) }),
  getAvailability: (doctorId) => apiRequest(`/api/doctors/${doctorId}/availability`),
  updateAvailability: (id, data) => apiRequest(`/api/doctors/availability/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteAvailability: (id) => apiRequest(`/api/doctors/availability/${id}`, { method: "DELETE" }),
  createPrescription: (data) => apiRequest("/api/doctors/prescriptions", { method: "POST", body: JSON.stringify(data) }),
  getPrescriptions: () => apiRequest("/api/doctors/prescriptions"),
  getPatientPrescriptions: (patientId) => apiRequest(`/api/doctors/prescriptions/patient/${patientId}`),
  getPatientReports: (patientId) => apiRequest(`/api/patients/${patientId}/reports`),
  lookupPatientReports: (params) => apiRequest(`/api/patients/reports/lookup?${params}`),
};

// ─── Appointments ────────────────────────────────────────────────
export const appointmentApi = {
  create: (data) => apiRequest("/api/appointments", { method: "POST", body: JSON.stringify(data) }),
  getAll: () => apiRequest("/api/appointments"),
  getById: (id) => apiRequest(`/api/appointments/${id}`),
  getByPatient: (params) => apiRequest(`/api/appointments/patient?${params}`),
  getByDoctor: (doctorId) => apiRequest(`/api/appointments/doctor/${doctorId}`),
  update: (id, data) => apiRequest(`/api/appointments/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  confirm: (id) => apiRequest(`/api/appointments/${id}/confirm`, { method: "PUT" }),
  cancel: (id, data = {}) => apiRequest(`/api/appointments/${id}/cancel`, { method: "PUT", body: JSON.stringify(data) }),
  respond: (id, data) => apiRequest(`/api/appointments/${id}/respond`, { method: "PUT", body: JSON.stringify(data) }),
  getRefundRequests: (status = "") => apiRequest(`/api/appointments/refund-requests${status ? `?status=${encodeURIComponent(status)}` : ""}`),
  approveRefundRequest: (id, data = {}) => apiRequest(`/api/appointments/refund-requests/${id}/approve`, { method: "PUT", body: JSON.stringify(data) }),
  rejectRefundRequest: (id, data = {}) => apiRequest(`/api/appointments/refund-requests/${id}/reject`, { method: "PUT", body: JSON.stringify(data) }),
};

// ─── Payments ────────────────────────────────────────────────────
export const paymentApi = {
  process: (data) => apiRequest("/api/payments", { method: "POST", body: JSON.stringify(data) }),
  getAll: () => apiRequest("/api/payments"),
  getById: (id) => apiRequest(`/api/payments/${id}`),
  getByPatient: (patientId) => apiRequest(`/api/payments/patient/${patientId}`),
  updateByOrder: (orderId, status) => apiRequest(`/api/payments/order/${orderId}/status`, { method: "PUT", body: JSON.stringify({ status }) }),
};

// ─── Telemedicine ────────────────────────────────────────────────
export const telemedicineApi = {
  createSession: (data) => apiRequest("/api/telemedicine/sessions", { method: "POST", body: JSON.stringify(data) }),
  getSession: (id) => apiRequest(`/api/telemedicine/sessions/${id}`),
  getByAppointment: (appointmentId) => apiRequest(`/api/telemedicine/sessions/appointment/${appointmentId}`),
  startSession: (id) => apiRequest(`/api/telemedicine/sessions/${id}/start`, { method: "PUT" }),
  endSession: (id, notes) => apiRequest(`/api/telemedicine/sessions/${id}/end`, { method: "PUT", body: JSON.stringify({ notes }) }),
};

// ─── Notifications ───────────────────────────────────────────────
export const notificationApi = {
  send: (data) => apiRequest("/api/notifications/send", { method: "POST", body: JSON.stringify(data) }),
  appointmentBooked: (data) => apiRequest("/api/notifications/appointment-booked", { method: "POST", body: JSON.stringify(data) }),
  getAll: () => apiRequest("/api/notifications"),
};

// ─── AI Symptom Checker ──────────────────────────────────────────
export const symptomApi = {
  check: (data) => apiRequest("/api/symptoms/check", { method: "POST", body: JSON.stringify(data) }),
  getSpecializations: () => apiRequest("/api/symptoms/specializations"),
};

// ─── Admin ───────────────────────────────────────────────────────
export const adminApi = {
  register: (data) => apiRequest("/api/admin/auth/register", { method: "POST", body: JSON.stringify(data) }),
  login: (data) => apiRequest("/api/admin/auth/login", { method: "POST", body: JSON.stringify(data) }),
  getProfile: () => apiRequest("/api/admin/profile"),
  updateProfile: (data) => apiRequest("/api/admin/profile", { method: "PUT", body: JSON.stringify(data) }),
  getDashboard: () => apiRequest("/api/admin/dashboard"),
  getPatients: () => apiRequest("/api/admin/patients"),
  getDoctors: () => apiRequest("/api/admin/doctors"),
  verifyDoctor: (id) => apiRequest(`/api/admin/doctors/${id}/verify`, { method: "PUT" }),
  updateDoctorStatus: (id, status) => apiRequest(`/api/admin/doctors/${id}/status`, { method: "PUT", body: JSON.stringify({ status }) }),
  updatePatientStatus: (id, status) => apiRequest(`/api/admin/patients/${id}/status`, { method: "PUT", body: JSON.stringify({ status }) }),
  getAppointments: () => apiRequest("/api/admin/appointments"),
  getPayments: () => apiRequest("/api/admin/payments"),
  getRefundRequests: (status = "") => apiRequest(`/api/appointments/refund-requests${status ? `?status=${encodeURIComponent(status)}` : ""}`),
  approveRefundRequest: (id, data = {}) => apiRequest(`/api/appointments/refund-requests/${id}/approve`, { method: "PUT", body: JSON.stringify(data) }),
  rejectRefundRequest: (id, data = {}) => apiRequest(`/api/appointments/refund-requests/${id}/reject`, { method: "PUT", body: JSON.stringify(data) }),
};
