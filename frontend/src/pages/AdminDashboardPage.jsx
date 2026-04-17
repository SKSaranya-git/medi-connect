import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { adminApi } from '../services/api';
import { LayoutDashboard, Stethoscope, Users, CalendarDays, CreditCard, RotateCcw, UserCog, ShieldCheck } from 'lucide-react';

const AdminDashboardPage = () => {
  const { user, logout, updateUser } = useAuth();
  const [tab, setTab] = useState('dashboard');
  const [currentPage, setCurrentPage] = useState(1);
  const [stats, setStats] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [payments, setPayments] = useState([]);
  const [refundRequests, setRefundRequests] = useState([]);
  const [dashboardRange, setDashboardRange] = useState('6m');
  const [doctorFilters, setDoctorFilters] = useState({ search: '', verification: 'all', status: 'all', specialization: '' });
  const [patientFilters, setPatientFilters] = useState({ search: '', status: 'all' });
  const [appointmentFilters, setAppointmentFilters] = useState({ search: '', status: 'all', type: 'all' });
  const [paymentFilters, setPaymentFilters] = useState({ search: '', status: 'all' });
  const [profileForm, setProfileForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); setCurrentPage(1); }, [tab]);
  useEffect(() => { setCurrentPage(1); }, [doctorFilters, patientFilters, appointmentFilters, paymentFilters, dashboardRange]);

  const renderPagination = (totalItems) => {
    const totalPages = Math.ceil(totalItems / 10);
    if (totalPages <= 1) return null;
    return (
      <div className="flex justify-between items-center mt-4 pt-4 border-t border-white/5">
        <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))} className="px-4 py-2 bg-white/5 text-gray-300 rounded-lg border border-white/10 cursor-pointer text-[13px] hover:bg-white/10 disabled:opacity-50 transition-all">Previous</button>
        <span className="text-[13px] text-gray-400">Page {currentPage} of {totalPages}</span>
        <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} className="px-4 py-2 bg-white/5 text-gray-300 rounded-lg border border-white/10 cursor-pointer text-[13px] hover:bg-white/10 disabled:opacity-50 transition-all">Next</button>
      </div>
    );
  };

  const loadData = async () => {
    setLoading(true);
    try {
      if (tab === 'dashboard') {
        const [s, d, p, a, pay, rr] = await Promise.allSettled([
          adminApi.getDashboard(),
          adminApi.getDoctors(),
          adminApi.getPatients(),
          adminApi.getAppointments(),
          adminApi.getPayments(),
          adminApi.getRefundRequests(),
        ]);

        setStats(s.status === 'fulfilled' ? s.value : null);
        setDoctors(d.status === 'fulfilled' && Array.isArray(d.value) ? d.value : []);
        setPatients(p.status === 'fulfilled' && Array.isArray(p.value) ? p.value : []);
        setAppointments(a.status === 'fulfilled' && Array.isArray(a.value) ? a.value : []);
        setPayments(pay.status === 'fulfilled' && Array.isArray(pay.value) ? pay.value : []);
        setRefundRequests(rr.status === 'fulfilled' && Array.isArray(rr.value) ? rr.value : []);
      }
      if (tab === 'doctors') { const d = await adminApi.getDoctors(); setDoctors(Array.isArray(d) ? d : []); }
      if (tab === 'patients') { const p = await adminApi.getPatients(); setPatients(Array.isArray(p) ? p : []); }
      if (tab === 'appointments') { const a = await adminApi.getAppointments(); setAppointments(Array.isArray(a) ? a : []); }
      if (tab === 'payments') { const p = await adminApi.getPayments(); setPayments(Array.isArray(p) ? p : []); }
      if (tab === 'refunds') { const rr = await adminApi.getRefundRequests(); setRefundRequests(Array.isArray(rr) ? rr : []); }
      if (tab === 'profile') {
        const profile = await adminApi.getProfile();
        setProfileForm({
          firstName: profile?.firstName || '',
          lastName: profile?.lastName || '',
          email: profile?.email || user?.email || '',
        });
      }
    } catch { /* */ }
    finally { setLoading(false); }
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMessage('');
    try {
      const res = await adminApi.updateProfile({
        firstName: profileForm.firstName,
        lastName: profileForm.lastName,
      });
      const updatedAdmin = res?.admin;
      if (updatedAdmin) {
        updateUser(updatedAdmin);
        setProfileForm({
          firstName: updatedAdmin.firstName || '',
          lastName: updatedAdmin.lastName || '',
          email: updatedAdmin.email || '',
        });
      }
      setProfileMessage('Profile updated successfully.');
    } catch (error) {
      setProfileMessage(error?.message || 'Failed to update profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  const verifyDoc = async (id) => {
    try { await adminApi.verifyDoctor(id); loadData(); } catch { /* */ }
  };

  const setDoctorStatus = async (id, status) => {
    try { await adminApi.updateDoctorStatus(id, status); loadData(); } catch { /* */ }
  };

  const setPatientStatus = async (id, status) => {
    try { await adminApi.updatePatientStatus(id, status); loadData(); } catch { /* */ }
  };

  const approveRefund = async (id) => {
    if (!id) return;
    try {
      await adminApi.approveRefundRequest(id, { adminId: user?._id || '' });
      loadData();
    } catch {
      // no-op
    }
  };

  const rejectRefund = async (id) => {
    if (!id) return;
    const adminNote = window.prompt('Optional rejection reason:') || '';
    try {
      await adminApi.rejectRefundRequest(id, { adminId: user?._id || '', adminNote });
      loadData();
    } catch {
      // no-op
    }
  };

  const clearDashboardFilters = () => setDashboardRange('6m');
  const clearDoctorFilters = () => setDoctorFilters({ search: '', verification: 'all', status: 'all', specialization: '' });
  const clearPatientFilters = () => setPatientFilters({ search: '', status: 'all' });
  const clearAppointmentFilters = () => setAppointmentFilters({ search: '', status: 'all', type: 'all' });
  const clearPaymentFilters = () => setPaymentFilters({ search: '', status: 'all' });

  const getStatusCount = (items, pickStatus, matcher) => items.reduce((count, item) => {
    const status = String(pickStatus(item) || '').toLowerCase();
    return count + (matcher(status) ? 1 : 0);
  }, 0);

  const buildMonthlySeries = (items, pickDate, months = 6) => {
    const now = new Date();
    const bucketCount = months;
    const buckets = Array.from({ length: bucketCount }, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - (bucketCount - 1 - index), 1);
      return {
        key: `${date.getFullYear()}-${date.getMonth()}`,
        label: date.toLocaleString('en-US', { month: 'short' }),
        count: 0,
      };
    });

    items.forEach((item) => {
      const rawDate = pickDate(item);
      if (!rawDate) return;
      const date = new Date(rawDate);
      if (Number.isNaN(date.valueOf())) return;
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      const bucket = buckets.find((entry) => entry.key === key);
      if (bucket) bucket.count += 1;
    });

    return buckets;
  };

  const dashboardMonthCount = dashboardRange === '3m' ? 3 : dashboardRange === '12m' ? 12 : dashboardRange === 'all' ? 24 : 6;
  const appointmentSeries = buildMonthlySeries(appointments, (item) => item.createdAt || item.appointmentDate, dashboardMonthCount);
  const paymentSeries = buildMonthlySeries(payments, (item) => item.createdAt || item.created_at, dashboardMonthCount);

  const appointmentStatusCards = [
    { label: 'Pending', value: getStatusCount(appointments, (item) => item.appointmentStatus, (status) => status === 'pending'), color: '#f59e0b' },
    { label: 'Confirmed', value: getStatusCount(appointments, (item) => item.appointmentStatus, (status) => status === 'confirmed'), color: '#3b82f6' },
    { label: 'Completed', value: getStatusCount(appointments, (item) => item.appointmentStatus, (status) => status === 'completed'), color: '#10b981' },
    { label: 'Cancelled', value: getStatusCount(appointments, (item) => item.appointmentStatus, (status) => status === 'cancelled'), color: '#ef4444' },
  ];

  const doctorStatusCards = [
    { label: 'Verified', value: getStatusCount(doctors, (item) => item.isVerified, (status) => status === 'true'), color: '#10b981' },
    { label: 'Unverified', value: getStatusCount(doctors, (item) => item.isVerified, (status) => status !== 'true'), color: '#f59e0b' },
  ];

  const paymentStatusCards = [
    { label: 'Completed', value: getStatusCount(payments, (item) => item.status, (status) => status === 'completed'), color: '#10b981' },
    { label: 'Refunded', value: getStatusCount(payments, (item) => item.status, (status) => status === 'refunded'), color: '#38bdf8' },
    { label: 'Failed', value: getStatusCount(payments, (item) => item.status, (status) => status === 'failed'), color: '#ef4444' },
  ];

  const filteredDoctors = doctors.filter((doctor) => {
    const fullName = `${doctor.firstName || ''} ${doctor.lastName || ''}`.toLowerCase();
    const searchTerm = doctorFilters.search.trim().toLowerCase();
    const matchesSearch = !searchTerm || fullName.includes(searchTerm) || (doctor.email || '').toLowerCase().includes(searchTerm) || (doctor.specialization || '').toLowerCase().includes(searchTerm);
    const matchesVerification = doctorFilters.verification === 'all' || String(doctor.isVerified) === doctorFilters.verification;
    const matchesStatus = doctorFilters.status === 'all' || (doctor.accountStatus || 'active') === doctorFilters.status;
    const matchesSpecialization = !doctorFilters.specialization || (doctor.specialization || '').toLowerCase().includes(doctorFilters.specialization.toLowerCase());
    return matchesSearch && matchesVerification && matchesStatus && matchesSpecialization;
  });

  const filteredPatients = patients.filter((patient) => {
    const searchTerm = patientFilters.search.trim().toLowerCase();
    const fullName = `${patient.title || ''} ${patient.firstName || ''} ${patient.lastName || ''}`.toLowerCase();
    const matchesSearch = !searchTerm || fullName.includes(searchTerm) || (patient.email || '').toLowerCase().includes(searchTerm) || (patient.phone || '').toLowerCase().includes(searchTerm) || (patient.nic || '').toLowerCase().includes(searchTerm);
    const matchesStatus = patientFilters.status === 'all' || (patient.accountStatus || 'active') === patientFilters.status;
    return matchesSearch && matchesStatus;
  });

  const filteredAppointments = appointments.filter((appointment) => {
    const searchTerm = appointmentFilters.search.trim().toLowerCase();
    const matchesSearch = !searchTerm || [appointment.patientName, appointment.doctorName, appointment.appointmentType, appointment.appointmentStatus]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(searchTerm));
    const matchesStatus = appointmentFilters.status === 'all' || (appointment.appointmentStatus || '').toLowerCase() === appointmentFilters.status;
    const matchesType = appointmentFilters.type === 'all' || (appointment.appointmentType || '').toLowerCase() === appointmentFilters.type;
    return matchesSearch && matchesStatus && matchesType;
  });

  const filteredPayments = payments.filter((payment) => {
    const searchTerm = paymentFilters.search.trim().toLowerCase();
    const matchesSearch = !searchTerm || [payment.order_id, payment.payer_name, payment.payer_email, payment.payer_phone, payment.status]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(searchTerm));
    const matchesStatus = paymentFilters.status === 'all' || (payment.status || '').toLowerCase() === paymentFilters.status;
    return matchesSearch && matchesStatus;
  });

  const renderBarChart = (items, maxHeight = 160) => {
    const max = Math.max(...items.map((item) => item.value), 1);
    return (
      <div className="space-y-3">
        {items.map((item) => {
          const width = `${Math.max((item.value / max) * 100, item.value > 0 ? 8 : 0)}%`;
          return (
            <div key={item.label}>
              <div className="flex items-center justify-between text-[12px] text-gray-400 mb-1">
                <span>{item.label}</span>
                <span>{item.value}</span>
              </div>
              <div className="h-3 rounded-full bg-white/5 overflow-hidden">
                <div className="h-full rounded-full" style={{ width, background: item.color, maxHeight }} />
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderLineChart = (appointmentsPoints, paymentsPoints) => {
    const width = 640;
    const height = 220;
    const padding = 28;
    const labels = appointmentsPoints.map((entry) => entry.label);
    const maxValue = Math.max(...appointmentsPoints.map((entry) => entry.count), ...paymentsPoints.map((entry) => entry.count), 1);
    const stepX = (width - padding * 2) / Math.max(labels.length - 1, 1);

    const buildPath = (points) => points.map((entry, index) => {
      const x = padding + index * stepX;
      const y = height - padding - ((entry.count / maxValue) * (height - padding * 2));
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');

    const pointDots = (points, color) => points.map((entry, index) => {
      const x = padding + index * stepX;
      const y = height - padding - ((entry.count / maxValue) * (height - padding * 2));
      return <circle key={`${color}-${entry.label}`} cx={x} cy={y} r="4" fill={color} />;
    });

    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-[220px]">
        {[0, 1, 2, 3].map((index) => {
          const y = padding + (index * (height - padding * 2)) / 3;
          return <line key={index} x1={padding} y1={y} x2={width - padding} y2={y} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />;
        })}

        <path d={buildPath(appointmentsPoints)} fill="none" stroke="#f59e0b" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
        <path d={buildPath(paymentsPoints)} fill="none" stroke="#38bdf8" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />

        {pointDots(appointmentsPoints, '#f59e0b')}
        {pointDots(paymentsPoints, '#38bdf8')}

        {labels.map((label, index) => {
          const x = padding + index * stepX;
          return (
            <text key={label} x={x} y={height - 8} textAnchor="middle" fill="rgba(156,163,175,0.9)" fontSize="11">
              {label}
            </text>
          );
        })}
      </svg>
    );
  };

  const tabs = [
    { key: 'dashboard', icon: <LayoutDashboard size={14} />, label: 'Dashboard' },
    { key: 'doctors', icon: <Stethoscope size={14} />, label: 'Doctors' },
    { key: 'patients', icon: <Users size={14} />, label: 'Patients' },
    { key: 'appointments', icon: <CalendarDays size={14} />, label: 'Appointments' },
    { key: 'payments', icon: <CreditCard size={14} />, label: 'Payments' },
    { key: 'refunds', icon: <RotateCcw size={14} />, label: 'Refund Requests' },
    { key: 'profile', icon: <UserCog size={14} />, label: 'Profile' },
  ];

  return (
    <div className="flex-1 bg-[#0f172a] text-white min-h-screen">
      <div className="bg-gradient-to-r from-[#1e293b] to-[#334155] py-6 px-6 border-b border-white/5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2"><ShieldCheck size={20} /> Admin Panel</h1>
            <p className="text-gray-400 text-[13px] mt-0.5">{user?.email}</p>
          </div>
          <button onClick={logout} className="px-4 py-2 bg-white/5 text-gray-300 rounded-lg border border-white/10 cursor-pointer text-[13px] hover:bg-white/10 transition-all">Logout</button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex gap-1 bg-[#1e293b] rounded-xl p-1 mb-6 overflow-x-auto">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex-1 py-2.5 rounded-lg text-[13px] font-medium border-none cursor-pointer transition-all whitespace-nowrap px-3 flex items-center justify-center gap-1.5 ${tab === t.key ? 'bg-[#f59e0b] text-[#1e293b]' : 'bg-transparent text-gray-400 hover:text-white'}`}>
              {t.icon}{t.label}
            </button>
          ))}
        </div>

        {loading ? <div className="text-center py-16"><div className="w-8 h-8 border-3 border-[#f59e0b] border-t-transparent rounded-full animate-spin mx-auto" /></div> : (
          <>
            {tab === 'dashboard' && stats && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                  {[
                    { v: stats.totalPatients, l: 'Patients', c: 'from-[#3b82f6] to-[#2563eb]' },
                    { v: stats.totalDoctors, l: 'Doctors', c: 'from-[#10b981] to-[#059669]' },
                    { v: stats.unverifiedDoctors, l: 'Unverified Doctors', c: 'from-[#f59e0b] to-[#d97706]' },
                    { v: stats.totalAppointments, l: 'Appointments', c: 'from-[#8b5cf6] to-[#7c3aed]' },
                    { v: stats.totalPayments, l: 'Payments', c: 'from-[#ec4899] to-[#db2777]' },
                  ].map(s => (
                    <div key={s.l} className={`bg-gradient-to-br ${s.c} rounded-2xl p-6`}>
                      <p className="text-3xl font-extrabold">{s.v}</p>
                      <p className="text-white/80 text-[13px] mt-1">{s.l}</p>
                    </div>
                  ))}
                </div>

                <div className="bg-[#1e293b] rounded-2xl p-4 border border-white/5 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-[14px] font-semibold text-white">Analytics Range</h3>
                    <p className="text-[12px] text-gray-400 mt-1">Adjust the chart window without leaving the dashboard.</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <select
                      value={dashboardRange}
                      onChange={(e) => setDashboardRange(e.target.value)}
                      className="h-10 px-3 rounded-lg border border-white/10 bg-[#0f172a] text-white text-[13px] outline-none cursor-pointer"
                    >
                      <option value="3m">Last 3 months</option>
                      <option value="6m">Last 6 months</option>
                      <option value="12m">Last 12 months</option>
                      <option value="all">All available</option>
                    </select>
                    <button onClick={clearDashboardFilters} className="h-10 px-4 rounded-lg border border-white/10 bg-white/5 text-gray-200 text-[13px] cursor-pointer hover:bg-white/10">
                      Reset
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                  <div className="bg-[#1e293b] rounded-2xl p-6 border border-white/5">
                    <div className="flex items-center justify-between mb-5">
                      <div>
                        <h3 className="text-[15px] font-bold text-white">Appointment Status</h3>
                        <p className="text-[12px] text-gray-400 mt-1">Current appointment lifecycle distribution</p>
                      </div>
                      <span className="text-[12px] text-gray-400">{appointments.length} total</span>
                    </div>
                    {renderBarChart(appointmentStatusCards)}
                  </div>

                  <div className="bg-[#1e293b] rounded-2xl p-6 border border-white/5">
                    <div className="flex items-center justify-between mb-5">
                      <div>
                        <h3 className="text-[15px] font-bold text-white">Doctor Verification</h3>
                        <p className="text-[12px] text-gray-400 mt-1">Verified vs unverified doctor accounts</p>
                      </div>
                      <span className="text-[12px] text-gray-400">{doctors.length} total</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-5 items-center">
                      <div className="relative mx-auto w-[220px] h-[220px] rounded-full" style={{ background: `conic-gradient(${doctorStatusCards[0].color} 0 ${doctors.length ? (doctorStatusCards[0].value / doctors.length) * 360 : 0}deg, ${doctorStatusCards[1].color} 0 360deg)` }}>
                        <div className="absolute inset-[26px] rounded-full bg-[#0f172a] border border-white/5 flex items-center justify-center text-center">
                          <div>
                            <div className="text-3xl font-extrabold text-white">{doctors.length}</div>
                            <div className="text-[12px] text-gray-400 mt-1">Doctors</div>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-3">
                        {doctorStatusCards.map((item) => (
                          <div key={item.label} className="flex items-center justify-between gap-4 text-[13px]">
                            <div className="flex items-center gap-3">
                              <span className="w-3 h-3 rounded-full" style={{ background: item.color }} />
                              <span className="text-gray-300">{item.label}</span>
                            </div>
                            <span className="text-white font-semibold">{item.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-[1.3fr_0.7fr] gap-4">
                  <div className="bg-[#1e293b] rounded-2xl p-6 border border-white/5">
                    <div className="flex items-center justify-between mb-5">
                      <div>
                        <h3 className="text-[15px] font-bold text-white">Monthly Activity</h3>
                        <p className="text-[12px] text-gray-400 mt-1">Appointments vs payments over the last 6 months</p>
                      </div>
                      <div className="flex items-center gap-4 text-[12px] text-gray-400">
                        <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]" />Appointments</span>
                        <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-[#38bdf8]" />Payments</span>
                      </div>
                    </div>
                    {renderLineChart(appointmentSeries, paymentSeries)}
                  </div>

                  <div className="space-y-4">
                    <div className="bg-[#1e293b] rounded-2xl p-6 border border-white/5">
                      <h3 className="text-[15px] font-bold text-white mb-4">Payment Status</h3>
                      {renderBarChart(paymentStatusCards)}
                    </div>

                    <div className="bg-[#1e293b] rounded-2xl p-6 border border-white/5">
                      <h3 className="text-[15px] font-bold text-white mb-4">Quick Ratios</h3>
                      <div className="space-y-3 text-[13px]">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400">Doctor verification rate</span>
                          <span className="text-white font-semibold">{doctors.length ? Math.round((doctorStatusCards[0].value / doctors.length) * 100) : 0}%</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400">Completed appointment rate</span>
                          <span className="text-white font-semibold">{appointments.length ? Math.round((appointmentStatusCards[2].value / appointments.length) * 100) : 0}%</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400">Successful payment rate</span>
                          <span className="text-white font-semibold">{payments.length ? Math.round((paymentStatusCards[0].value / payments.length) * 100) : 0}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {tab === 'doctors' && (
              <div className="space-y-3">
                <div className="bg-[#1e293b] rounded-2xl p-4 border border-white/5 flex flex-wrap items-end gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[12px] text-gray-400">Search</label>
                    <input
                      type="text"
                      value={doctorFilters.search}
                      onChange={(e) => setDoctorFilters({ ...doctorFilters, search: e.target.value })}
                      placeholder="Name, email, specialization"
                      className="h-10 px-3 rounded-lg border border-white/10 bg-[#0f172a] text-white text-[13px] outline-none focus:border-[#f59e0b] min-w-[220px]"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[12px] text-gray-400">Verification</label>
                    <select value={doctorFilters.verification} onChange={(e) => setDoctorFilters({ ...doctorFilters, verification: e.target.value })} className="h-10 px-3 rounded-lg border border-white/10 bg-[#0f172a] text-white text-[13px] outline-none cursor-pointer">
                      <option value="all">All</option>
                      <option value="true">Verified</option>
                      <option value="false">Unverified</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[12px] text-gray-400">Account Status</label>
                    <select value={doctorFilters.status} onChange={(e) => setDoctorFilters({ ...doctorFilters, status: e.target.value })} className="h-10 px-3 rounded-lg border border-white/10 bg-[#0f172a] text-white text-[13px] outline-none cursor-pointer">
                      <option value="all">All</option>
                      <option value="active">Active</option>
                      <option value="suspended">Suspended</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[12px] text-gray-400">Specialization</label>
                    <input
                      type="text"
                      value={doctorFilters.specialization}
                      onChange={(e) => setDoctorFilters({ ...doctorFilters, specialization: e.target.value })}
                      placeholder="Filter specialization"
                      className="h-10 px-3 rounded-lg border border-white/10 bg-[#0f172a] text-white text-[13px] outline-none focus:border-[#f59e0b] min-w-[180px]"
                    />
                  </div>
                  <button onClick={clearDoctorFilters} className="h-10 px-4 rounded-lg border border-white/10 bg-white/5 text-gray-200 text-[13px] cursor-pointer hover:bg-white/10">
                    Clear
                  </button>
                </div>
                <div className="text-[12px] text-gray-400">Showing {filteredDoctors.length} of {doctors.length} doctors</div>
                {filteredDoctors.map(d => (
                  <div key={d._id} className="bg-[#1e293b] rounded-xl p-5 border border-white/5 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-[14px]">Dr. {d.firstName} {d.lastName}</div>
                      <div className="text-[12.5px] text-gray-400 mt-1">{d.specialization} • {d.email}</div>
                      <div className="text-[12px] text-gray-500 mt-1">Account: {d.accountStatus || 'active'}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      {d.isVerified ? (
                        <span className="px-3 py-1 bg-green-900/30 text-green-400 rounded-full text-[12px] font-medium">✓ Verified</span>
                      ) : (
                        <>
                          {d.governmentIdUrl && (<a href={d.governmentIdUrl} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 bg-sky-900/30 text-sky-400 rounded-lg text-[12px] font-semibold border border-sky-800/60 no-underline hover:bg-sky-900/50 transition-all flex items-center pr-2 mr-2"><svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>View ID</a>)}
                          <button onClick={() => verifyDoc(d._id)} className="px-4 py-1.5 bg-[#f59e0b] text-[#1e293b] rounded-lg text-[12px] font-semibold border-none cursor-pointer hover:bg-[#fbbf24] transition-all">Verify</button>
                        </>
                      )}
                      {(d.accountStatus || 'active') === 'active' ? (
                        <button onClick={() => setDoctorStatus(d._id, 'suspended')} className="px-4 py-1.5 bg-red-900/40 text-red-300 rounded-lg text-[12px] font-semibold border border-red-800/60 cursor-pointer hover:bg-red-900/60 transition-all">Suspend</button>
                      ) : (
                        <button onClick={() => setDoctorStatus(d._id, 'active')} className="px-4 py-1.5 bg-green-900/30 text-green-300 rounded-lg text-[12px] font-semibold border border-green-800/60 cursor-pointer hover:bg-green-900/50 transition-all">Activate</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {tab === 'patients' && (
              <div className="space-y-3">
                <div className="bg-[#1e293b] rounded-2xl p-4 border border-white/5 flex flex-wrap items-end gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[12px] text-gray-400">Search</label>
                    <input
                      type="text"
                      value={patientFilters.search}
                      onChange={(e) => setPatientFilters({ ...patientFilters, search: e.target.value })}
                      placeholder="Name, email, phone, NIC"
                      className="h-10 px-3 rounded-lg border border-white/10 bg-[#0f172a] text-white text-[13px] outline-none focus:border-[#f59e0b] min-w-[240px]"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[12px] text-gray-400">Account Status</label>
                    <select value={patientFilters.status} onChange={(e) => setPatientFilters({ ...patientFilters, status: e.target.value })} className="h-10 px-3 rounded-lg border border-white/10 bg-[#0f172a] text-white text-[13px] outline-none cursor-pointer">
                      <option value="all">All</option>
                      <option value="active">Active</option>
                      <option value="suspended">Suspended</option>
                    </select>
                  </div>
                  <button onClick={clearPatientFilters} className="h-10 px-4 rounded-lg border border-white/10 bg-white/5 text-gray-200 text-[13px] cursor-pointer hover:bg-white/10">
                    Clear
                  </button>
                </div>
                <div className="text-[12px] text-gray-400">Showing {filteredPatients.length} of {patients.length} patients</div>
                {filteredPatients.map(p => (
                  <div key={p._id} className="bg-[#1e293b] rounded-xl p-5 border border-white/5">
                    <div className="font-semibold text-[14px]">{p.title} {p.firstName} {p.lastName}</div>
                    <div className="text-[12.5px] text-gray-400 mt-1">{p.email} • {p.phone} • {p.nic}</div>
                    <div className="text-[12px] text-gray-500 mt-1">Account: {p.accountStatus || 'active'}</div>
                    <div className="mt-3">
                      {(p.accountStatus || 'active') === 'active' ? (
                        <button onClick={() => setPatientStatus(p._id, 'suspended')} className="px-4 py-1.5 bg-red-900/40 text-red-300 rounded-lg text-[12px] font-semibold border border-red-800/60 cursor-pointer hover:bg-red-900/60 transition-all">Suspend</button>
                      ) : (
                        <button onClick={() => setPatientStatus(p._id, 'active')} className="px-4 py-1.5 bg-green-900/30 text-green-300 rounded-lg text-[12px] font-semibold border border-green-800/60 cursor-pointer hover:bg-green-900/50 transition-all">Activate</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {tab === 'appointments' && (
              <div className="space-y-3">
                <div className="bg-[#1e293b] rounded-2xl p-4 border border-white/5 flex flex-wrap items-end gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[12px] text-gray-400">Search</label>
                    <input
                      type="text"
                      value={appointmentFilters.search}
                      onChange={(e) => setAppointmentFilters({ ...appointmentFilters, search: e.target.value })}
                      placeholder="Patient, doctor, status"
                      className="h-10 px-3 rounded-lg border border-white/10 bg-[#0f172a] text-white text-[13px] outline-none focus:border-[#f59e0b] min-w-[240px]"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[12px] text-gray-400">Status</label>
                    <select value={appointmentFilters.status} onChange={(e) => setAppointmentFilters({ ...appointmentFilters, status: e.target.value })} className="h-10 px-3 rounded-lg border border-white/10 bg-[#0f172a] text-white text-[13px] outline-none cursor-pointer">
                      <option value="all">All</option>
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[12px] text-gray-400">Type</label>
                    <select value={appointmentFilters.type} onChange={(e) => setAppointmentFilters({ ...appointmentFilters, type: e.target.value })} className="h-10 px-3 rounded-lg border border-white/10 bg-[#0f172a] text-white text-[13px] outline-none cursor-pointer">
                      <option value="all">All</option>
                      <option value="in-person">In-Person</option>
                      <option value="telemedicine">Telemedicine</option>
                    </select>
                  </div>
                  <button onClick={clearAppointmentFilters} className="h-10 px-4 rounded-lg border border-white/10 bg-white/5 text-gray-200 text-[13px] cursor-pointer hover:bg-white/10">
                    Clear
                  </button>
                </div>
                <div className="text-[12px] text-gray-400">Showing {filteredAppointments.length} of {appointments.length} appointments</div>
                {filteredAppointments.map(a => (
                  <div key={a._id} className="bg-[#1e293b] rounded-xl p-5 border border-white/5 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-[14px]">{a.patientName} → {a.doctorName || 'Doctor'}</div>
                      <div className="text-[12.5px] text-gray-400 mt-1">{new Date(a.appointmentDate).toLocaleDateString()} • {a.appointmentTime} • Rs {a.totalFee}</div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-[12px] font-medium ${a.appointmentStatus === 'completed' ? 'bg-green-900/30 text-green-400' : a.appointmentStatus === 'cancelled' ? 'bg-red-900/30 text-red-400' : 'bg-yellow-900/30 text-yellow-400'}`}>{a.appointmentStatus}</span>
                  </div>
                ))}
              </div>
            )}

            {tab === 'payments' && (
              <div className="space-y-3">
                <div className="bg-[#1e293b] rounded-2xl p-4 border border-white/5 flex flex-wrap items-end gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[12px] text-gray-400">Search</label>
                    <input
                      type="text"
                      value={paymentFilters.search}
                      onChange={(e) => setPaymentFilters({ ...paymentFilters, search: e.target.value })}
                      placeholder="Order, payer, email, phone"
                      className="h-10 px-3 rounded-lg border border-white/10 bg-[#0f172a] text-white text-[13px] outline-none focus:border-[#f59e0b] min-w-[260px]"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[12px] text-gray-400">Status</label>
                    <select value={paymentFilters.status} onChange={(e) => setPaymentFilters({ ...paymentFilters, status: e.target.value })} className="h-10 px-3 rounded-lg border border-white/10 bg-[#0f172a] text-white text-[13px] outline-none cursor-pointer">
                      <option value="all">All</option>
                      <option value="completed">Completed</option>
                      <option value="failed">Failed</option>
                      <option value="refunded">Refunded</option>
                    </select>
                  </div>
                  <button onClick={clearPaymentFilters} className="h-10 px-4 rounded-lg border border-white/10 bg-white/5 text-gray-200 text-[13px] cursor-pointer hover:bg-white/10">
                    Clear
                  </button>
                </div>
                <div className="text-[12px] text-gray-400">Showing {filteredPayments.length} of {payments.length} payments</div>
                {filteredPayments.map(p => (
                  <div key={p.id} className="bg-[#1e293b] rounded-xl p-5 border border-white/5 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-[14px]">Rs {p.amount} — {p.payer_name || 'Patient'}</div>
                      <div className="text-[12.5px] text-gray-400 mt-1">Order: {p.order_id || 'N/A'} • {new Date(p.created_at).toLocaleDateString()}</div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-[12px] font-medium ${p.status === 'completed' ? 'bg-green-900/30 text-green-400' : p.status === 'failed' ? 'bg-red-900/30 text-red-400' : p.status === 'refunded' ? 'bg-sky-900/30 text-sky-300' : 'bg-yellow-900/30 text-yellow-400'}`}>{p.status}</span>
                  </div>
                ))}
              </div>
            )}

            {tab === 'refunds' && (
              <div className="space-y-3">
                <div className="text-[12px] text-gray-400">Showing {refundRequests.length} refund request(s)</div>
                {refundRequests.length === 0 ? (
                  <div className="bg-[#1e293b] rounded-xl p-5 border border-white/5 text-gray-400">No refund requests found.</div>
                ) : refundRequests.map((request) => (
                  <div key={request._id} className="bg-[#1e293b] rounded-xl p-5 border border-white/5 flex items-center justify-between gap-4">
                    <div>
                      <div className="font-semibold text-[14px]">Appointment: {request.appointmentId}</div>
                      <div className="text-[12.5px] text-gray-400 mt-1">NIC: {request.patientNIC || 'N/A'} • {request.patientEmail || 'N/A'} • {request.patientPhone || 'N/A'}</div>
                      <div className="text-[12.5px] text-gray-400 mt-1">Requested: Rs {request.amountRequested || 0} • {new Date(request.createdAt).toLocaleString()}</div>
                      {request.reason ? <div className="text-[12px] text-gray-500 mt-1">Reason: {request.reason}</div> : null}
                      {request.adminNote ? <div className="text-[12px] text-gray-500 mt-1">Admin note: {request.adminNote}</div> : null}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-[12px] font-medium ${request.status === 'approved' ? 'bg-green-900/30 text-green-400' : request.status === 'rejected' ? 'bg-red-900/30 text-red-400' : 'bg-yellow-900/30 text-yellow-400'}`}>{request.status}</span>
                      {request.status === 'pending_review' ? (
                        <>
                          <button onClick={() => approveRefund(request._id)} className="px-4 py-1.5 bg-[#10b981] text-[#0f172a] rounded-lg text-[12px] font-semibold border-none cursor-pointer hover:bg-[#34d399] transition-all">Approve</button>
                          <button onClick={() => rejectRefund(request._id)} className="px-4 py-1.5 bg-red-900/40 text-red-300 rounded-lg text-[12px] font-semibold border border-red-800/60 cursor-pointer hover:bg-red-900/60 transition-all">Reject</button>
                        </>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {tab === 'profile' && (
              <div className="bg-[#1e293b] rounded-xl p-6 border border-white/5 max-w-2xl">
                <h3 className="text-[15px] font-bold text-white mb-4">Edit Profile</h3>
                <form onSubmit={saveProfile} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                      <label className="text-[12px] text-gray-400">First Name</label>
                      <input
                        type="text"
                        value={profileForm.firstName}
                        onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
                        className="h-10 px-3 rounded-lg border border-white/10 bg-[#0f172a] text-white text-[13.5px] outline-none focus:border-[#f59e0b]"
                        required
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[12px] text-gray-400">Last Name</label>
                      <input
                        type="text"
                        value={profileForm.lastName}
                        onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
                        className="h-10 px-3 rounded-lg border border-white/10 bg-[#0f172a] text-white text-[13.5px] outline-none focus:border-[#f59e0b]"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[12px] text-gray-400">Email</label>
                    <input
                      type="email"
                      value={profileForm.email}
                      disabled
                      className="h-10 px-3 rounded-lg border border-white/10 bg-[#0b1220] text-gray-400 text-[13.5px] cursor-not-allowed"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <p className={`text-[13px] ${profileMessage.includes('successfully') ? 'text-green-400' : 'text-red-400'}`}>{profileMessage}</p>
                    <button
                      type="submit"
                      disabled={savingProfile}
                      className="h-10 px-5 bg-[#f59e0b] text-[#1e293b] rounded-lg border-none cursor-pointer text-[13px] font-semibold disabled:opacity-60"
                    >
                      {savingProfile ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminDashboardPage;
