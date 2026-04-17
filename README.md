# MediConnect 🏥

MediConnect is a modern, microservices-based healthcare platform designed to seamlessly connect patients, doctors, and medical administrators. It provides a comprehensive ecosystem for managing medical appointments, telemedicine consultations, automated notifications, secure payments, and AI-driven symptom analysis.

## Overview -> Core Capabilities

- **Intelligent Triage:** AI-powered symptom checker integrating Google Gemini to provide patients with immediate, preliminary medical triage and specialty recommendations.
- **Service Discovery & Routing:** Built on a robust API Gateway architecture backed by Consul for dynamic microservice discovery and load balancing.
- **Secure Telemedicine:** Real-time, secure virtual consultation sessions between doctors and patients.
- **Automated Workflows:** Event-driven notification system via Twilio (SMS) and SMTP (Email) for appointment updates, payment verifications, and prescription deliveries.
- **Scalable Infrastructure:** Fully containerized architecture orchestrated via Kubernetes, designed for high availability and fault tolerance.

## Tech Stack

**Frontend:**
- React (Vite)
- TailwindCSS (Styling)

**Backend Microservices:**
- Node.js & Express.js
- MongoDB & Mongoose (Database)
- HashiCorp Consul (Service Discovery)
- JWT (Authentication)

**Infrastructure & Integrations:**
- Kubernetes & Kustomize (Orchestration & Secrets mapping)
- Docker & Docker Compose (Containerization & Local Dev)
- Twilio API (SMS Notifications)
- Cloudinary (Image/Asset Management)
- Google Gemini API (Artificial Intelligence)

## Project Structure

```text
MediConnect/
├── backend/
│   ├── admin-service/         # Platform administration & analytics
│   ├── ai-symptom-service/    # Google Gemini AI integrations
│   ├── appointment-service/   # Appointment scheduling & logic
│   ├── consul-service/        # HashiCorp Consul registry service
│   ├── doctor-service/        # Doctor profiles, availability & prescriptions
│   ├── gatewayapi-service/    # Main API Gateway & Proxy router
│   ├── k8s/                   # Kubernetes deployment & secret manifests
│   ├── notification-service/  # Email & SMS dispatch worker
│   ├── patient-service/       # Patient profiles & authentication
│   ├── payment-service/       # Transaction processing
│   └── telemedicine-service/  # Virtual consultation sessions
├── frontend/                  # React Vite application
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   ├── context/           # React Context (Auth)
│   │   ├── pages/             # Role-specific dashboard pages
│   │   └── services/          # Frontend API fetch utilities
└── README.md
```

## Features by Roles

### 🧑‍⚕️ Patients
- Fast, secure registration and authentication.
- Book, view, and manage medical appointments.
- Artificial Intelligence symptom checker to find recommended specialties.
- Access digital medical prescriptions and payment histories.
- Join virtual telemedicine meetings.

### 👨‍⚕️ Doctors
- Manage availability schedules and consultation fees.
- View upcoming patient appointments.
- Write and issue digital prescriptions.
- Host secure telemedicine video sessions.

### 🛡️ Administrators
- Global dashboard with platform system statistics.
- Moderation system to verify new doctor registrations.
- Override and manage system-wide appointments and refunds.

## Authentication and Access Control

MediConnect uses **JSON Web Tokens (JWT)** for stateless authentication. 
- The `patient-service`, `doctor-service`, and `admin-service` handle JWT issuance during login.
- The `gatewayapi-service` verifies requests but frequently passes down the JWT via the `Authorization: Bearer <token>` header for downstream microservices to authorize specific role-based actions via `authMiddleware.js`.

## Backend Modules

- **API Gateway (`gatewayapi-service`)**: Routes incoming requests from the frontend (`/api/patients/*`) to the correct microservice using Consul Service Discovery.
- **Service Discovery (`consul-service`)**: Maintains a live registry of healthy instances for every microservice.
- **Worker Services (`notification-service`)**: A disconnected microservice that listens for internal triggers (like appointment confirmations) and dispatches Twilio SMS and Emails.
- **Database Architecture**: Each microservice is strictly isolated and maintains its own dedicated MongoDB Atlas connection URI to enforce domain-driven design.

## Notable Backend Endpoints

*(Note: All endpoints are prefixed by `/api` when accessed through the Gateway)*

- `POST /patients/auth/login` - Authenticate a patient.
- `GET /doctors/:id/availability` - Fetch a specific doctor's available calendar slots.
- `POST /appointments/` - Book a new appointment and queue payment verification.
- `PUT /admin/doctors/:id/verify` - Admin endpoint to approve a doctor's account.
- `POST /ai-symptom/analyze` - Analyze user symptoms using Google Gemini.

## Frontend Routing

The frontend utilizes React Router with protected routes based on the AuthContext roles:
- `/` - Public landing page
- `/login`, `/register` - Patient auth flows
- `/doctor/login`, `/admin/login` - Staff auth flows
- `/patient/dashboard` - Patient portal (Protected)
- `/doctor/dashboard` - Doctor calendar & appointments (Protected)
- `/admin/dashboard` - Admin analytics (Protected)
- `/telemedicine` - Virtual consultation interface (Protected)

## API Endpoint Documentation by Features

### 🌍 Public / General (No Auth Required)
| Method | Endpoint | Auth | Request | Response |
|--------|----------|------|---------|----------|
| POST | `/api/patients/auth/login` | None | `{ email, password }` | `{ token, user }` |
| POST | `/api/patients/auth/register` | None | `{ firstName, lastName, email, password }` | `{ token, user }` |
| POST | `/api/doctors/auth/login` | None | `{ email, password }` | `{ token, user }` |
| POST | `/api/doctors/auth/register` | None | `{ firstName, lastName, ... }` | `{ token, user }` |
| POST | `/api/admin/auth/login` | None | `{ email, password }` | `{ token, admin }` |
| GET | `/api/doctors` | None | - | `List of verified doctors` |
| GET | `/api/doctors/specializations` | None | - | `List of specialties` |
| POST | `/api/ai-symptom/check` | None | `{ symptoms, age, gender }` | `AI suggested specialties` |

### 🧑‍⚕️ Patient Role
| Method | Endpoint | Auth | Request | Response |
|--------|----------|------|---------|----------|
| GET | `/api/patients/profile` | Patient | - | `Patient Profile` |
| PUT | `/api/patients/profile` | Patient | `{ updates }` | `Updated Profile` |
| POST | `/api/patients/reports` | Patient | `FormData (PDFs/Images)` | `Report added` |
| GET | `/api/appointments/patient/:id` | Patient | - | `Patient's appointments` |
| POST | `/api/appointments` | Patient | `{ doctorId, date, time }` | `Appointment record` |
| POST | `/api/payments` | Patient | `{ appointmentId, amount }` | `Payment gateway intent` |
| GET | `/api/telemedicine/:id` | Patient/Doctor | - | `Telemedicine session details` |

### 👨‍⚕️ Doctor Role
| Method | Endpoint | Auth | Request | Response |
|--------|----------|------|---------|----------|
| GET | `/api/doctors/me/profile` | Doctor | - | `Doctor Profile` |
| PUT | `/api/doctors/profile` | Doctor | `{ updates }` | `Updated Profile` |
| POST | `/api/doctors/availability` | Doctor | `{ date, slots }` | `Availability Created` |
| GET | `/api/appointments/doctor/:id` | Doctor | - | `Doctor's appointments` |
| POST | `/api/prescriptions` | Doctor | `{ patientId, medicines }` | `Prescription created` |
| PUT | `/api/telemedicine/:id/start` | Doctor | - | `Session started successfully` |

### 🛡️ Administrator Role
| Method | Endpoint | Auth | Request | Response |
|--------|----------|------|---------|----------|
| GET | `/api/admin/dashboard` | Admin | - | `System metrics (counts)` |
| GET | `/api/admin/doctors` | Admin | - | `List of all doctors` |
| GET | `/api/admin/patients` | Admin | - | `List of all patients` |
| PUT | `/api/admin/doctors/:id/verify` | Admin | `{ status }` | `Verification status updated` |
| PUT | `/api/admin/patients/:id/status`| Admin | `{ status }` | `Patient status updated` |
| GET | `/api/admin/appointments` | Admin | - | `List of all appointments` |
| GET | `/api/admin/payments` | Admin | - | `List of all payments` |

## API Usage Notes

- Ensure the `Content-Type: application/json` header is strictly set.
- All protected endpoints must include the `Authorization: Bearer <JWT>` header.
- Cross-Origin Resource Sharing (CORS) is handled dynamically by the API Gateway node.

## Prerequisites

- Node.js (v20+ recommended)
- Docker Desktop & Kubernetes activated
- MongoDB Atlas Accounts (or local instances)
- Twilio Account (for SMS)
- Cloudinary Account (for image assets)
- Google Gemini API Key

## Installation & Setup Instructions

1. Clone the repository:
   ```bash
   git clone https://github.com/Kalana-JY/MediConnect.git
   cd MediConnect
   ```
2. Install frontend dependencies:
   ```bash
   cd frontend
   npm install
   ```
3. Install backend components (if testing locally without Docker):
   ```bash
   # Example for API gateway
   cd backend/gatewayapi-service
   npm install
   # Repeat for other services
   ```

## Environment Variables

MediConnect uses centralized Kubernetes secrets. Create a file named `.env.secret` in the `backend/k8s/` directory. **Do not use carriage returns (`\r\n`), use strict LF (`\n`).**

Example `backend/k8s/.env.secret`:
```
JWT_SECRET=your_super_secret_jwt_hash
JWT_EXPIRES_IN=7d
MONGODB_URI_PATIENT=mongodb+srv://...
MONGODB_URI_DOCTOR=mongodb+srv://...
MONGODB_URI_ADMIN=mongodb+srv://...
MONGODB_URI_APPOINTMENT=mongodb+srv://...
MONGODB_URI_PAYMENT=mongodb+srv://...
MONGODB_URI_NOTIFICATION=mongodb+srv://...
CLOUDINARY_URL=cloudinary://...
GEMINI_API_KEY=AIzaSy...
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=...
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

## Running the Project

The project is natively orchestrated using Kubernetes.

1. **Deploy the cluster components:**
   ```bash
   cd backend/k8s
   kubectl apply -k .
   ```
2. **Verify pods are running:**
   ```bash
   kubectl get pods -n mediconnect
   ```
3. **Start the Frontend Application:**
   ```bash
   cd frontend
   npm run dev
   ```

*Note: The frontend proxy specifically targets K8s exposed services on `localhost:3002`.*

## Available Scripts

In the `frontend/` directory:
- `npm run dev`: Starts the Vite development server.
- `npm run build`: Bundles the React application for production.
- `npm run preview`: Previews the production build locally.

## Authentication Flow

1. User (Patient/Doctor/Admin) submits credentials to their respective `authController.js` login endpoint.
2. The domain service validates the password via bcrypt and signs a payload (`{ id, role, email }`) with `process.env.JWT_SECRET`.
3. The token is returned to the frontend and persisted.
4. Subsequent requests attach the token in the headers. 
5. The `gatewayapi-service` explicitly ignores token validation, blindly routing the headers to the destination service.
6. The destination service invokes `authMiddleware.js` to cryptographically verify the JWT and inject `req.user`.

## Development Notes

- **Warning:** Do not run `docker-compose up` simultaneously with `kubectl apply -k .` as it will create overlapping network ports on `localhost` for the Gateway API, leading to orphaned database configurations.
- Inter-service communication inside K8s relies on cluster internal DNS (e.g. `http://notification-service:3006`).

## License

This project is licensed under the MIT License - see the LICENSE file for details.
