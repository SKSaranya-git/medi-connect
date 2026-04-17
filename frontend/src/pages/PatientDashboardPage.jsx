import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { patientApi, appointmentApi, telemedicineApi } from '../services/api';
import { LayoutDashboard, CalendarDays, Pill, ClipboardList, FileText, UserCog } from 'lucide-react';

const PatientDashboardPage = () => {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('overview');
  const [currentPage, setCurrentPage] = useState(1);
  const [appointments, setAppointments] = useState([]);
  const [telemedicineSessions, setTelemedicineSessions] = useState({});
  const [reports, setReports] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState('');
  const [uploadMessage, setUploadMessage] = useState('');
  const [appointmentMessage, setAppointmentMessage] = useState('');
  const [cancellingAppointmentId, setCancellingAppointmentId] = useState('');
  const [appointmentFilters, setAppointmentFilters] = useState({ search: '', status: 'all', payment: 'all' });
  const [prescriptionSearch, setPrescriptionSearch] = useState('');
  const [historyFilters, setHistoryFilters] = useState({ search: '', type: 'all' });
  const [reportSearch, setReportSearch] = useState('');
  const [uploadForm, setUploadForm] = useState({ title: '', description: '', file: null });
  const [profileForm, setProfileForm] = useState({
    title: user?.title || 'Mr',
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phone: user?.phone || '',
    area: user?.area || '',
    gender: user?.gender || '',
    bloodGroup: user?.bloodGroup || '',
    profileImage: user?.profileImage || '',
  });
  const [uploading, setUploading] = useState(false);

  useEffect(() => { loadData(); }, []);
  useEffect(() => { setCurrentPage(1); }, [tab, appointmentFilters, prescriptionSearch, historyFilters, reportSearch]);

  const renderPagination = (totalItems) => {
    const totalPages = Math.ceil(totalItems / 10);
    if (totalPages <= 1) return null;
    return (
      <div className="flex justify-between items-center mt-4 pt-4 border-t border-[#e8edf2]">
        <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))} className="px-4 py-2 bg-white text-[#4a5568] rounded-lg border border-[#d0d8e0] cursor-pointer text-[13px] hover:bg-[#f8fbfd] disabled:opacity-50 transition-all">Previous</button>
        <span className="text-[13px] text-[#6b7b8d]">Page {currentPage} of {totalPages}</span>
        <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} className="px-4 py-2 bg-white text-[#4a5568] rounded-lg border border-[#d0d8e0] cursor-pointer text-[13px] hover:bg-[#f8fbfd] disabled:opacity-50 transition-all">Next</button>
      </div>
    );
  };
  useEffect(() => {
    if (!user?._id) return;
    const intervalId = setInterval(() => {
      loadData();
    }, 15000);
    return () => clearInterval(intervalId);
  }, [user?._id]);

  const loadData = async () => {
    try {
      const [appts, reps, rxs, profileRes] = await Promise.allSettled([
        appointmentApi.getByPatient(`patientId=${user?._id}`),
        patientApi.getReports(),
        patientApi.getPrescriptions(user?._id),
        patientApi.getProfile(),
      ]);
      const appointmentList = appts.status === 'fulfilled' && Array.isArray(appts.value) ? appts.value : [];
      setAppointments(appointmentList);

      const sessionCandidates = appointmentList.filter((appt) => appt?._id && appt.appointmentStatus !== 'cancelled' && appt.appointmentType === 'telemedicine');
      if (sessionCandidates.length > 0) {
        const sessionResults = await Promise.allSettled(
          sessionCandidates.map(async (appt) => {
            const session = await telemedicineApi.getByAppointment(appt._id);
            return { appointmentId: appt._id, session };
          })
        );

        const sessionMap = {};
        sessionResults.forEach((result) => {
          if (result.status === 'fulfilled' && result.value?.session?._id) {
            sessionMap[result.value.appointmentId] = result.value.session;
          }
        });
        setTelemedicineSessions(sessionMap);
      } else {
        setTelemedicineSessions({});
      }

      setReports(reps.status === 'fulfilled' && Array.isArray(reps.value) ? reps.value : []);
      setPrescriptions(rxs.status === 'fulfilled' && Array.isArray(rxs.value) ? rxs.value : []);
      if (profileRes.status === 'fulfilled' && profileRes.value) {
        const profile = profileRes.value;
        setProfileForm({
          title: profile.title || 'Mr',
          firstName: profile.firstName || '',
          lastName: profile.lastName || '',
          phone: profile.phone || '',
          area: profile.area || '',
          gender: profile.gender || '',
          bloodGroup: profile.bloodGroup || '',
          profileImage: profile.profileImage || '',
        });
      }
    } catch { /* */ }
    finally { setLoading(false); }
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMessage('');
    try {
      const res = await patientApi.updateProfile(profileForm);
      const updatedPatient = res?.patient;
      if (updatedPatient) {
        updateUser(updatedPatient);
        setProfileForm({
          title: updatedPatient.title || 'Mr',
          firstName: updatedPatient.firstName || '',
          lastName: updatedPatient.lastName || '',
          phone: updatedPatient.phone || '',
          area: updatedPatient.area || '',
          gender: updatedPatient.gender || '',
          bloodGroup: updatedPatient.bloodGroup || '',
          profileImage: updatedPatient.profileImage || '',
        });
      }
      setProfileMessage('Profile updated successfully.');
    } catch (error) {
      setProfileMessage(error?.message || 'Failed to update profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!uploadForm.file || !uploadForm.title) return;
    setUploading(true);
    setUploadMessage('');
    try {
      const fd = new FormData();
      fd.append('file', uploadForm.file);
      fd.append('title', uploadForm.title);
      fd.append('description', uploadForm.description);
      await patientApi.uploadReport(fd);
      setUploadMessage('Report uploaded successfully.');
      setUploadForm({ title: '', description: '', file: null });
      loadData();
    } catch (error) {
      setUploadMessage(error?.message || 'Failed to upload report.');
    }
    finally { setUploading(false); }
  };

  const cancelAppointment = async (appointmentId) => {
    if (!appointmentId) return;
    const confirmed = window.confirm('Cancel this appointment? If payment was completed, a refund request will be sent to admin for review.');
    if (!confirmed) return;

    setAppointmentMessage('');
    setCancellingAppointmentId(appointmentId);
    try {
      const result = await appointmentApi.cancel(appointmentId);
      await loadData();
      setAppointmentMessage(result?.refundRequested
        ? 'Appointment cancelled. Refund request sent to admin for review.'
        : 'Appointment cancelled successfully.');
    } catch (error) {
      setAppointmentMessage(error?.message || 'Failed to cancel appointment.');
    } finally {
      setCancellingAppointmentId('');
    }
  };

  const payForAppointment = (appointment) => {
    if (!appointment?._id) return;

    const [firstName, ...restNames] = `${appointment.patientName || user?.firstName || 'Patient'}`.trim().split(' ').filter(Boolean);
    const lastName = restNames.join(' ');
    const totalFee = Number(appointment.totalFee) || 0;

    const qs = new URLSearchParams({
      appointmentId: appointment._id,
      doctorId: appointment.doctorId || '',
      patientId: appointment.patientId || user?._id || '',
      doctorName: appointment.doctorName || '',
      appointmentDate: appointment.appointmentDate || '',
      appointmentTime: appointment.appointmentTime || '',
      appointmentType: appointment.appointmentType || 'in-person',
      totalFee: String(totalFee),
      doctorFee: String(Number(appointment.doctorFee) || 0),
      hospitalFee: String(Number(appointment.hospitalFee) || 0),
      eChannellingFee: String(Number(appointment.eChannellingFee) || 399),
    }).toString();

    navigate(`/payments/checkout?${qs}`, {
      state: {
        appointment,
        bookingNotice: 'Complete payment to confirm this pending appointment.',
        customerInfo: {
          firstName: firstName || 'Patient',
          lastName: lastName || '',
          email: appointment.patientEmail || user?.email || '',
          phone: appointment.patientPhone || user?.phone || '',
          address: appointment.patientArea || 'N/A',
          city: appointment.patientArea || 'N/A',
          country: 'Sri Lanka',
        },
      },
    });
  };

  const tabs = [
    { key: 'overview', icon: <LayoutDashboard size={14} />, label: 'Overview' },
    { key: 'appointments', icon: <CalendarDays size={14} />, label: 'Appointments' },
    { key: 'prescriptions', icon: <Pill size={14} />, label: 'Prescriptions' },
    { key: 'history', icon: <ClipboardList size={14} />, label: 'Medical History' },
    { key: 'reports', icon: <FileText size={14} />, label: 'Medical Reports' },
    { key: 'profile', icon: <UserCog size={14} />, label: 'Edit Profile' },
  ];

  const historyItems = [
    ...appointments.map((a) => ({
      id: `appt-${a._id}`,
      date: a.updatedAt || a.createdAt || a.appointmentDate,
      type: 'Appointment',
      title: `${a.doctorName || 'Doctor'} (${a.appointmentStatus})`,
      details: `${new Date(a.appointmentDate).toLocaleDateString()} • ${a.appointmentTime}`,
    })),
    ...reports.map((r) => ({
      id: `report-${r._id}`,
      date: r.uploadedAt || r.createdAt,
      type: 'Report',
      title: r.title,
      details: `${r.fileType?.toUpperCase() || 'FILE'} uploaded`,
    })),
    ...prescriptions.map((p) => ({
      id: `rx-${p._id}`,
      date: p.issuedAt || p.createdAt,
      type: 'Prescription',
      title: p.diagnosis || 'Prescription',
      details: `${p.medications?.length || 0} medication(s)`,
    })),
  ].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

  const statusColors = { pending: 'bg-yellow-50 text-yellow-700', confirmed: 'bg-blue-50 text-blue-700', completed: 'bg-green-50 text-green-700', cancelled: 'bg-red-50 text-red-700' };

  const filteredAppointments = appointments.filter((appointment) => {
    const searchTerm = appointmentFilters.search.trim().toLowerCase();
    const matchesSearch = !searchTerm || [
      appointment.doctorName,
      appointment.hospitalName,
      appointment.appointmentTime,
      appointment.appointmentType,
      appointment.appointmentStatus,
    ]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(searchTerm));

    const matchesStatus = appointmentFilters.status === 'all' || (appointment.appointmentStatus || '').toLowerCase() === appointmentFilters.status;
    const matchesPayment = appointmentFilters.payment === 'all' || (appointment.paymentStatus || 'pending').toLowerCase() === appointmentFilters.payment;

    return matchesSearch && matchesStatus && matchesPayment;
  });

  const filteredPrescriptions = prescriptions.filter((prescription) => {
    const searchTerm = prescriptionSearch.trim().toLowerCase();
    if (!searchTerm) return true;

    return [
      prescription.diagnosis,
      prescription.notes,
      ...(Array.isArray(prescription.medications)
        ? prescription.medications.map((m) => `${m?.name || ''} ${m?.dosage || ''} ${m?.frequency || ''}`)
        : []),
    ]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(searchTerm));
  });

  const filteredHistoryItems = historyItems.filter((item) => {
    const searchTerm = historyFilters.search.trim().toLowerCase();
    const matchesSearch = !searchTerm || [item.type, item.title, item.details].filter(Boolean).some((value) => String(value).toLowerCase().includes(searchTerm));
    const matchesType = historyFilters.type === 'all' || String(item.type || '').toLowerCase() === historyFilters.type;
    return matchesSearch && matchesType;
  });

  const filteredReports = reports.filter((report) => {
    const searchTerm = reportSearch.trim().toLowerCase();
    if (!searchTerm) return true;

    return [report.title, report.description, report.fileType]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(searchTerm));
  });

  return (
    <div className="flex-1 bg-[#f0f4f8]">
      <div className="bg-gradient-to-r from-[#1a6fa0] to-[#3a8fc2] text-white py-8 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Welcome, {user?.firstName || 'Patient'}</h1>
            <p className="text-white/70 text-[14px] mt-1">{user?.email}</p>
          </div>
          <button onClick={logout} className="px-5 py-2 bg-white/10 text-white rounded-xl border border-white/20 cursor-pointer text-[13.5px] font-medium hover:bg-white/20 transition-all">Logout</button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6">
        {/* Tabs */}
        <div className="flex gap-1 bg-white rounded-xl p-1 shadow-sm border border-[#e8edf2] mb-6">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex-1 py-2.5 rounded-lg text-[13.5px] font-medium border-none cursor-pointer transition-all flex items-center justify-center gap-1.5 ${tab === t.key ? 'bg-[#1a6fa0] text-white shadow-sm' : 'bg-transparent text-[#6b7b8d] hover:text-[#1e2a3a]'}`}>
              {t.icon}{t.label}
            </button>
          ))}
        </div>

        {loading ? <div className="text-center py-12"><div className="w-8 h-8 border-3 border-[#1a6fa0] border-t-transparent rounded-full animate-spin mx-auto" /></div> : (
          <>
            {/* Overview */}
            {tab === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-white rounded-2xl p-6 border border-[#e8edf2] shadow-sm"><p className="text-3xl font-bold text-[#1a6fa0]">{appointments.length}</p><p className="text-[13px] text-[#6b7b8d] mt-1">Total Appointments</p></div>
                  <div className="bg-white rounded-2xl p-6 border border-[#e8edf2] shadow-sm"><p className="text-3xl font-bold text-[#1a9960]">{appointments.filter(a => a.appointmentStatus === 'confirmed').length}</p><p className="text-[13px] text-[#6b7b8d] mt-1">Confirmed</p></div>
                  <div className="bg-white rounded-2xl p-6 border border-[#e8edf2] shadow-sm"><p className="text-3xl font-bold text-[#6c3fa0]">{reports.length}</p><p className="text-[13px] text-[#6b7b8d] mt-1">Medical Reports</p></div>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Link to="/symptom-checker" className="px-6 py-3 bg-gradient-to-r from-[#6c3fa0] to-[#9b59b6] text-white rounded-xl no-underline font-medium text-[14px] hover:shadow-lg transition-all">Check Symptoms</Link>
                  <Link to="/doctors" className="px-6 py-3 bg-white text-[#1e2a3a] rounded-xl no-underline font-medium text-[14px] border border-[#d0d8e0] hover:shadow-md transition-all">Find Doctors</Link>
                </div>
              </div>
            )}

            {/* Appointments */}
            {tab === 'appointments' && (
              <div className="space-y-3">
                {appointmentMessage && (
                  <div className={`p-4 rounded-lg border text-[13px] ${appointmentMessage.toLowerCase().includes('failed') ? 'bg-red-50 border-red-200 text-red-700' : 'bg-green-50 border-green-200 text-green-700'}`}>
                    {appointmentMessage}
                  </div>
                )}
                <div className="bg-white rounded-xl p-4 border border-[#e8edf2] flex flex-wrap items-end gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[12px] text-[#6b7b8d]">Search</label>
                    <input
                      type="text"
                      value={appointmentFilters.search}
                      onChange={(e) => setAppointmentFilters({ ...appointmentFilters, search: e.target.value })}
                      placeholder="Doctor, hospital, type"
                      className="h-10 px-3 rounded-lg border border-[#d0d8e0] text-[13px] outline-none focus:border-[#1a6fa0] min-w-[220px]"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[12px] text-[#6b7b8d]">Status</label>
                    <select
                      value={appointmentFilters.status}
                      onChange={(e) => setAppointmentFilters({ ...appointmentFilters, status: e.target.value })}
                      className="h-10 px-3 rounded-lg border border-[#d0d8e0] text-[13px] outline-none focus:border-[#1a6fa0]"
                    >
                      <option value="all">All</option>
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[12px] text-[#6b7b8d]">Payment</label>
                    <select
                      value={appointmentFilters.payment}
                      onChange={(e) => setAppointmentFilters({ ...appointmentFilters, payment: e.target.value })}
                      className="h-10 px-3 rounded-lg border border-[#d0d8e0] text-[13px] outline-none focus:border-[#1a6fa0]"
                    >
                      <option value="all">All</option>
                      <option value="pending">Pending</option>
                      <option value="paid">Paid</option>
                      <option value="refunded">Refunded</option>
                    </select>
                  </div>
                  <button
                    onClick={() => setAppointmentFilters({ search: '', status: 'all', payment: 'all' })}
                    className="h-10 px-4 rounded-lg border border-[#d0d8e0] bg-white text-[#4a5568] text-[13px] cursor-pointer hover:bg-[#f8fbfd]"
                  >
                    Clear
                  </button>
                </div>
                <div className="text-[12px] text-[#6b7b8d]">Showing {filteredAppointments.length} of {appointments.length} appointments</div>
                {appointments.length === 0 ? <div className="bg-white rounded-2xl p-12 text-center border border-[#e8edf2]"><p className="text-[#6b7b8d]">No appointments yet. <Link to="/appointments" className="text-[#1a6fa0] no-underline">Book one now</Link></p></div> :
                  filteredAppointments.map(a => (
                    <div key={a._id} className="bg-white rounded-xl p-5 border border-[#e8edf2] shadow-sm">
                      <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
                        <div className="flex-1 min-w-0">
                        <div className="font-semibold text-[14px] text-[#1e2a3a]">{a.doctorName || 'Doctor'}</div>
                        <div className="text-[12.5px] text-[#6b7b8d] mt-1">{a.hospitalName || 'Hospital'} • {new Date(a.appointmentDate).toLocaleDateString()} • {a.appointmentTime}</div>
                        {a.appointmentNo > 0 && <div className="text-[12px] text-[#5a9ec4] mt-1">Appointment #{a.appointmentNo}</div>}
                        <div className="text-[12px] text-[#6b7b8d] mt-1">Payment: {a.paymentStatus || 'pending'}</div>
                        </div>

                        <div className="md:w-[120px] flex md:justify-center">
                          <span className={`px-3 py-1 rounded-full text-[12px] font-medium ${statusColors[a.appointmentStatus] || ''}`}>{a.appointmentStatus}</span>
                        </div>

                        <div className="md:w-[340px] flex flex-wrap md:justify-end gap-2">
                          {a.appointmentStatus === 'pending' && a.paymentStatus !== 'paid' && (
                            <button
                              onClick={() => payForAppointment(a)}
                              className="px-3 py-1.5 bg-[#1a6fa0] text-white border border-[#1a6fa0] rounded-lg text-[12px] font-medium cursor-pointer hover:bg-[#155f8a]"
                            >
                              Pay Now & Confirm
                            </button>
                          )}
                          {telemedicineSessions[a._id]?._id && a.appointmentType === 'telemedicine' && a.appointmentStatus === 'confirmed' && (
                            <Link
                              to={`/telemedicine/${telemedicineSessions[a._id]._id}`}
                              className="inline-flex items-center px-3 py-1.5 bg-[#1a6fa0] text-white rounded-lg no-underline text-[12px] font-medium hover:bg-[#155f8a] transition-colors"
                            >
                              Join Telemedicine
                            </Link>
                          )}
                          {['pending', 'confirmed'].includes(a.appointmentStatus) && (
                            <button
                              onClick={() => cancelAppointment(a._id)}
                              disabled={cancellingAppointmentId === a._id}
                              className="px-3 py-1.5 bg-red-50 text-red-700 border border-red-200 rounded-lg text-[12px] font-medium cursor-pointer hover:bg-red-100 disabled:opacity-60"
                            >
                              {cancellingAppointmentId === a._id ? 'Cancelling...' : 'Cancel & Refund'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                }
              </div>
            )}

            {tab === 'prescriptions' && (
              <div className="space-y-3">
                <div className="bg-white rounded-xl p-4 border border-[#e8edf2] flex flex-wrap items-end gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[12px] text-[#6b7b8d]">Search</label>
                    <input
                      type="text"
                      value={prescriptionSearch}
                      onChange={(e) => setPrescriptionSearch(e.target.value)}
                      placeholder="Diagnosis, medicine, notes"
                      className="h-10 px-3 rounded-lg border border-[#d0d8e0] text-[13px] outline-none focus:border-[#1a6fa0] min-w-[240px]"
                    />
                  </div>
                  <button
                    onClick={() => setPrescriptionSearch('')}
                    className="h-10 px-4 rounded-lg border border-[#d0d8e0] bg-white text-[#4a5568] text-[13px] cursor-pointer hover:bg-[#f8fbfd]"
                  >
                    Clear
                  </button>
                </div>
                <div className="text-[12px] text-[#6b7b8d]">Showing {filteredPrescriptions.length} of {prescriptions.length} prescriptions</div>
                {prescriptions.length === 0 ? (
                  <div className="bg-white rounded-2xl p-12 text-center border border-[#e8edf2]">
                    <p className="text-[#6b7b8d]">No prescriptions available yet.</p>
                  </div>
                ) : filteredPrescriptions.map((rx) => (
                  <div key={rx._id} className="bg-white rounded-xl p-5 border border-[#e8edf2] shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="font-semibold text-[14px] text-[#1e2a3a]">{rx.diagnosis}</div>
                      <span className="text-[12px] text-[#8a9bae]">{new Date(rx.issuedAt).toLocaleDateString()}</span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {rx.medications?.map((m, i) => (
                        <span key={`${rx._id}-${i}`} className="px-3 py-1 bg-[#f0f7fc] text-[#1a6fa0] rounded-full text-[12px]">
                          {m.name} • {m.dosage} • {m.frequency}
                        </span>
                      ))}
                    </div>
                    {rx.notes && <p className="text-[12.5px] text-[#6b7b8d] mt-2">{rx.notes}</p>}
                  </div>
                ))}
              </div>
            )}

            {tab === 'history' && (
              <div className="bg-white rounded-2xl p-6 border border-[#e8edf2] shadow-sm">
                <div className="mb-4 flex flex-wrap items-end gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[12px] text-[#6b7b8d]">Search</label>
                    <input
                      type="text"
                      value={historyFilters.search}
                      onChange={(e) => setHistoryFilters({ ...historyFilters, search: e.target.value })}
                      placeholder="Type, title, details"
                      className="h-10 px-3 rounded-lg border border-[#d0d8e0] text-[13px] outline-none focus:border-[#1a6fa0] min-w-[220px]"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[12px] text-[#6b7b8d]">Type</label>
                    <select
                      value={historyFilters.type}
                      onChange={(e) => setHistoryFilters({ ...historyFilters, type: e.target.value })}
                      className="h-10 px-3 rounded-lg border border-[#d0d8e0] text-[13px] outline-none focus:border-[#1a6fa0]"
                    >
                      <option value="all">All</option>
                      <option value="appointment">Appointment</option>
                      <option value="report">Report</option>
                      <option value="prescription">Prescription</option>
                    </select>
                  </div>
                  <button
                    onClick={() => setHistoryFilters({ search: '', type: 'all' })}
                    className="h-10 px-4 rounded-lg border border-[#d0d8e0] bg-white text-[#4a5568] text-[13px] cursor-pointer hover:bg-[#f8fbfd]"
                  >
                    Clear
                  </button>
                </div>
                <div className="mb-4 text-[12px] text-[#6b7b8d]">Showing {filteredHistoryItems.length} of {historyItems.length} history items</div>
                {historyItems.length === 0 ? (
                  <p className="text-[#6b7b8d] text-center py-6">No medical history records yet.</p>
                ) : (
                  <div className="space-y-4">
                    {filteredHistoryItems.map((item) => (
                      <div key={item.id} className="border-l-2 border-[#1a6fa0] pl-4">
                        <div className="text-[12px] text-[#8a9bae]">{item.date ? new Date(item.date).toLocaleString() : 'N/A'}</div>
                        <div className="text-[13px] text-[#1a6fa0] font-semibold">{item.type}</div>
                        <div className="text-[14px] text-[#1e2a3a] font-medium">{item.title}</div>
                        <div className="text-[12.5px] text-[#6b7b8d]">{item.details}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Reports */}
            {tab === 'reports' && (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl p-6 border border-[#e8edf2] shadow-sm">
                  <h3 className="text-[15px] font-bold text-[#1e2a3a] mb-4">Upload Report</h3>
                  <form onSubmit={handleUpload} className="flex flex-wrap gap-3 items-end">
                    <input type="text" placeholder="Report title" value={uploadForm.title} onChange={e => setUploadForm({...uploadForm, title: e.target.value})} required
                      className="h-10 px-3 rounded-lg border border-[#d0d8e0] text-[13.5px] outline-none focus:border-[#1a6fa0] flex-1 min-w-[160px]" />
                    <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e => setUploadForm({...uploadForm, file: e.target.files[0]})} required
                      className="text-[13px] text-[#6b7b8d]" />
                    <button type="submit" disabled={uploading} className="h-10 px-5 bg-[#1a6fa0] text-white rounded-lg border-none cursor-pointer text-[13px] font-medium disabled:opacity-60">
                      {uploading ? 'Uploading...' : 'Upload'}
                    </button>
                  </form>
                  {uploadMessage && (
                    <p className={`mt-3 text-[12.5px] ${uploadMessage.includes('successfully') ? 'text-green-600' : 'text-red-600'}`}>
                      {uploadMessage}
                    </p>
                  )}
                </div>
                <div className="bg-white rounded-xl p-4 border border-[#e8edf2] flex flex-wrap items-end gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[12px] text-[#6b7b8d]">Search Reports</label>
                    <input
                      type="text"
                      value={reportSearch}
                      onChange={(e) => setReportSearch(e.target.value)}
                      placeholder="Title, file type"
                      className="h-10 px-3 rounded-lg border border-[#d0d8e0] text-[13px] outline-none focus:border-[#1a6fa0] min-w-[220px]"
                    />
                  </div>
                  <button
                    onClick={() => setReportSearch('')}
                    className="h-10 px-4 rounded-lg border border-[#d0d8e0] bg-white text-[#4a5568] text-[13px] cursor-pointer hover:bg-[#f8fbfd]"
                  >
                    Clear
                  </button>
                </div>
                <div className="text-[12px] text-[#6b7b8d]">Showing {filteredReports.length} of {reports.length} reports</div>
                <div className="space-y-3">
                  {reports.length === 0 ? <p className="text-center text-[#6b7b8d] py-8">No reports uploaded yet.</p> :
                    filteredReports.map(r => (
                      <div key={r._id} className="bg-white rounded-xl p-4 border border-[#e8edf2] flex items-center justify-between shadow-sm">
                        <div>
                          <div className="font-semibold text-[14px] text-[#1e2a3a]">{r.title}</div>
                          <div className="text-[12.5px] text-[#6b7b8d] mt-0.5">{r.fileType} • {new Date(r.uploadedAt).toLocaleDateString()}</div>
                        </div>
                        <a href={r.fileUrl} target="_blank" rel="noreferrer" className="px-4 py-1.5 bg-[#f0f7fc] text-[#1a6fa0] rounded-lg text-[13px] font-medium no-underline hover:bg-[#1a6fa0] hover:text-white transition-all">View</a>
                      </div>
                    ))
                  }
                </div>
              </div>
            )}

            {tab === 'profile' && (
              <div className="bg-white rounded-2xl p-6 border border-[#e8edf2] shadow-sm">
                <h3 className="text-[15px] font-bold text-[#1e2a3a] mb-4">Edit Profile</h3>
                <form onSubmit={handleProfileSave} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-[12px] font-medium text-[#4a5568]">Title</label>
                    <select value={profileForm.title} onChange={(e) => setProfileForm({ ...profileForm, title: e.target.value })}
                      className="h-10 px-3 rounded-lg border border-[#d0d8e0] text-[13.5px] outline-none focus:border-[#1a6fa0]">
                      {['Mr', 'Mrs', 'Ms', 'Dr'].map((item) => <option key={item} value={item}>{item}</option>)}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[12px] font-medium text-[#4a5568]">Phone</label>
                    <input type="text" value={profileForm.phone} onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                      className="h-10 px-3 rounded-lg border border-[#d0d8e0] text-[13.5px] outline-none focus:border-[#1a6fa0]" required />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[12px] font-medium text-[#4a5568]">First Name</label>
                    <input type="text" value={profileForm.firstName} onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
                      className="h-10 px-3 rounded-lg border border-[#d0d8e0] text-[13.5px] outline-none focus:border-[#1a6fa0]" required />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[12px] font-medium text-[#4a5568]">Last Name</label>
                    <input type="text" value={profileForm.lastName} onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
                      className="h-10 px-3 rounded-lg border border-[#d0d8e0] text-[13.5px] outline-none focus:border-[#1a6fa0]" required />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[12px] font-medium text-[#4a5568]">Area</label>
                    <input type="text" value={profileForm.area} onChange={(e) => setProfileForm({ ...profileForm, area: e.target.value })}
                      className="h-10 px-3 rounded-lg border border-[#d0d8e0] text-[13.5px] outline-none focus:border-[#1a6fa0]" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[12px] font-medium text-[#4a5568]">Gender</label>
                    <select value={profileForm.gender} onChange={(e) => setProfileForm({ ...profileForm, gender: e.target.value })}
                      className="h-10 px-3 rounded-lg border border-[#d0d8e0] text-[13.5px] outline-none focus:border-[#1a6fa0]">
                      <option value="">Select</option>
                      {['Male', 'Female', 'Other'].map((item) => <option key={item} value={item}>{item}</option>)}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[12px] font-medium text-[#4a5568]">Blood Group</label>
                    <select value={profileForm.bloodGroup} onChange={(e) => setProfileForm({ ...profileForm, bloodGroup: e.target.value })}
                      className="h-10 px-3 rounded-lg border border-[#d0d8e0] text-[13.5px] outline-none focus:border-[#1a6fa0]">
                      {['', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((item) => <option key={item} value={item}>{item || 'Select'}</option>)}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[12px] font-medium text-[#4a5568]">Profile Image URL</label>
                    <input type="url" value={profileForm.profileImage} onChange={(e) => setProfileForm({ ...profileForm, profileImage: e.target.value })}
                      className="h-10 px-3 rounded-lg border border-[#d0d8e0] text-[13.5px] outline-none focus:border-[#1a6fa0]" placeholder="https://..." />
                  </div>
                  <div className="md:col-span-2 flex items-center justify-between mt-1">
                    <p className={`text-[13px] ${profileMessage.includes('successfully') ? 'text-green-600' : 'text-red-500'}`}>{profileMessage}</p>
                    <button type="submit" disabled={savingProfile}
                      className="h-10 px-5 bg-[#1a6fa0] text-white rounded-lg border-none cursor-pointer text-[13px] font-medium disabled:opacity-60">
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

export default PatientDashboardPage;
