import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DoctorLoginPage from './pages/DoctorLoginPage';
import DoctorRegisterPage from './pages/DoctorRegisterPage';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminRegisterPage from './pages/AdminRegisterPage';
import DoctorsPage from './pages/DoctorsPage';
import DoctorProfilePage from './pages/DoctorProfilePage';
import AppointmentPage from './pages/AppointmentPage';
import PaymentCheckoutPage from './pages/PaymentCheckoutPage';
import SymptomCheckerPage from './pages/SymptomCheckerPage';
import PatientDashboardPage from './pages/PatientDashboardPage';
import DoctorDashboardPage from './pages/DoctorDashboardPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import TelemedicinePage from './pages/TelemedicinePage';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen flex flex-col bg-[#f8fafc]">
          <Navbar />
          <Routes>
            {/* Public pages */}
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/doctor/login" element={<DoctorLoginPage />} />
            <Route path="/doctor/register" element={<DoctorRegisterPage />} />
            <Route path="/admin/login" element={<AdminLoginPage />} />
            <Route path="/admin/register" element={<AdminRegisterPage />} />
            <Route path="/doctors" element={<DoctorsPage />} />
            <Route path="/doctors/:id" element={<DoctorProfilePage />} />
            <Route path="/appointments" element={<AppointmentPage />} />
            <Route path="/payments/checkout" element={<PaymentCheckoutPage />} />
            <Route path="/symptom-checker" element={<SymptomCheckerPage />} />

            {/* Patient protected */}
            <Route path="/patient/dashboard" element={
              <ProtectedRoute roles={['patient']}><PatientDashboardPage /></ProtectedRoute>
            } />

            {/* Doctor protected */}
            <Route path="/doctor/dashboard" element={
              <ProtectedRoute roles={['doctor']}><DoctorDashboardPage /></ProtectedRoute>
            } />

            {/* Admin protected */}
            <Route path="/admin/dashboard" element={
              <ProtectedRoute roles={['admin', 'superadmin']}><AdminDashboardPage /></ProtectedRoute>
            } />

            {/* Telemedicine (auth required) */}
            <Route path="/telemedicine" element={
              <ProtectedRoute roles={['doctor', 'patient']}><TelemedicinePage /></ProtectedRoute>
            } />
            <Route path="/telemedicine/:sessionId" element={
              <ProtectedRoute roles={['doctor', 'patient']}><TelemedicinePage /></ProtectedRoute>
            } />
          </Routes>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;