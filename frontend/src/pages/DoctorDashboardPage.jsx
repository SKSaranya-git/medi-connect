import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { doctorApi, appointmentApi, telemedicineApi } from '../services/api';
import { LayoutDashboard, CalendarDays, FileText, Clock, Pill, UserCog } from 'lucide-react';

const DoctorDashboardPage = () => {
  const { user, logout, updateUser } = useAuth();
  const [tab, setTab] = useState('overview');
  const [currentPage, setCurrentPage] = useState(1);
  const [appointments, setAppointments] = useState([]);
  const [telemedicineSessions, setTelemedicineSessions] = useState({});
  const [availability, setAvailability] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [patientReports, setPatientReports] = useState([]);
  const [selectedPatientLookup, setSelectedPatientLookup] = useState('');
  const [loadingReports, setLoadingReports] = useState(false);
  const [loading, setLoading] = useState(true);
  const [appointmentFilters, setAppointmentFilters] = useState({ search: '', status: 'all', type: 'all' });
  const [patientReportSearch, setPatientReportSearch] = useState('');
  const [availabilityFilters, setAvailabilityFilters] = useState({ search: '', day: 'all', sessionType: 'all' });
  const [prescriptionSearch, setPrescriptionSearch] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState('');
  const [profileForm, setProfileForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phone: user?.phone || '',
    specialization: user?.specialization || '',
    hospitalAffiliation: user?.hospitalAffiliation || '',
    consultationFee: user?.consultationFee || 0,
    serviceType: user?.serviceType || 'both',
    bio: user?.bio || '',
    profileImage: user?.profileImage || '',
  });
  const [slotForm, setSlotForm] = useState({ dayOfWeek: 'Monday', startTime: '09:00', endTime: '17:00', sessionType: 'in-person', hospital: '', maxPatients: 20 });
  const [editingSlotId, setEditingSlotId] = useState('');
  const [rxForm, setRxForm] = useState({ patientId: '', patientName: '', diagnosis: '', medName: '', medDosage: '', medFrequency: '', medDuration: '', notes: '' });

  useEffect(() => { loadData(); }, []);
  useEffect(() => { setCurrentPage(1); }, [tab, appointmentFilters, availabilityFilters, prescriptionSearch, patientReportSearch]);

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
      const [appts, slots, rxs, profileRes] = await Promise.allSettled([
        appointmentApi.getByDoctor(user?._id),
        doctorApi.getAvailability(user?._id),
        doctorApi.getPrescriptions(),
        doctorApi.getProfile(),
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

      setAvailability(slots.status === 'fulfilled' && Array.isArray(slots.value) ? slots.value : []);
      setPrescriptions(rxs.status === 'fulfilled' && Array.isArray(rxs.value) ? rxs.value : []);
      if (profileRes.status === 'fulfilled' && profileRes.value) {
        const profile = profileRes.value;
        setProfileForm({
          firstName: profile.firstName || '',
          lastName: profile.lastName || '',
          phone: profile.phone || '',
          specialization: profile.specialization || '',
          hospitalAffiliation: profile.hospitalAffiliation || '',
          consultationFee: profile.consultationFee || 0,
          serviceType: profile.serviceType || 'both',
          bio: profile.bio || '',
          profileImage: profile.profileImage || '',
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
      const payload = {
        ...profileForm,
        consultationFee: Number(profileForm.consultationFee) || 0,
      };
      const res = await doctorApi.updateProfile(payload);
      const updatedDoctor = res?.doctor;
      if (updatedDoctor) {
        updateUser(updatedDoctor);
        setProfileForm({
          firstName: updatedDoctor.firstName || '',
          lastName: updatedDoctor.lastName || '',
          phone: updatedDoctor.phone || '',
          specialization: updatedDoctor.specialization || '',
          hospitalAffiliation: updatedDoctor.hospitalAffiliation || '',
          consultationFee: updatedDoctor.consultationFee || 0,
          serviceType: updatedDoctor.serviceType || 'both',
          bio: updatedDoctor.bio || '',
          profileImage: updatedDoctor.profileImage || '',
        });
      }
      setProfileMessage('Profile updated successfully.');
    } catch (error) {
      setProfileMessage(error?.message || 'Failed to update profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  const addSlot = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...slotForm,
        sessionType: profileForm.serviceType === 'both' ? slotForm.sessionType : profileForm.serviceType,
      };
      if (editingSlotId) {
        await doctorApi.updateAvailability(editingSlotId, payload);
      } else {
        await doctorApi.createAvailability(payload);
      }
      loadData();
      setEditingSlotId('');
      setSlotForm({ dayOfWeek: 'Monday', startTime: '09:00', endTime: '17:00', sessionType: profileForm.serviceType === 'telemedicine' ? 'telemedicine' : 'in-person', hospital: '', maxPatients: 20 });
    } catch { /* */ }
  };

  const startEditSlot = (slot) => {
    if (!slot?._id) return;
    setEditingSlotId(slot._id);
    setSlotForm({
      dayOfWeek: slot.dayOfWeek || 'Monday',
      startTime: slot.startTime || '09:00',
      endTime: slot.endTime || '17:00',
      sessionType: slot.sessionType || 'in-person',
      hospital: slot.hospital || '',
      maxPatients: Number(slot.maxPatients) || 20,
    });
  };

  const cancelEditSlot = () => {
    setEditingSlotId('');
    setSlotForm({
      dayOfWeek: 'Monday',
      startTime: '09:00',
      endTime: '17:00',
      sessionType: profileForm.serviceType === 'telemedicine' ? 'telemedicine' : 'in-person',
      hospital: '',
      maxPatients: 20,
    });
  };

  const deleteSlot = async (id) => {
    try { await doctorApi.deleteAvailability(id); loadData(); } catch { /* */ }
  };

  const issueRx = async (e) => {
    e.preventDefault();
    try {
      await doctorApi.createPrescription({
        patientId: rxForm.patientId.trim(),
        patientName: rxForm.patientName.trim(),
        diagnosis: rxForm.diagnosis.trim(),
        notes: rxForm.notes.trim(),
        medications: [{ name: rxForm.medName.trim(), dosage: rxForm.medDosage.trim(), frequency: rxForm.medFrequency.trim(), duration: rxForm.medDuration.trim() }],
      });
      loadData();
      setRxForm({ patientId: '', patientName: '', diagnosis: '', medName: '', medDosage: '', medFrequency: '', medDuration: '', notes: '' });
    } catch { /* */ }
  };

  const loadPatientReports = async (lookupValue) => {
    if (!lookupValue) return;
    setLoadingReports(true);
    try {
      const trimmedValue = lookupValue.trim();
      const params = new URLSearchParams();
      if (trimmedValue.includes('@')) {
        params.set('email', trimmedValue);
      } else if (/^[0-9+\-()\s]+$/.test(trimmedValue) && trimmedValue.replace(/\D/g, '').length >= 7) {
        params.set('phone', trimmedValue);
      } else {
        params.set('patientId', trimmedValue);
      }

      const result = await doctorApi.lookupPatientReports(params.toString());
      setPatientReports(Array.isArray(result?.reports) ? result.reports : []);
      setSelectedPatientLookup(trimmedValue);
      setTab('patientReports');
    } catch {
      setPatientReports([]);
      setSelectedPatientLookup(lookupValue);
      setTab('patientReports');
    } finally {
      setLoadingReports(false);
    }
  };

  const respondToAppointment = async (appointmentId, action) => {
    try {
      await appointmentApi.respond(appointmentId, { doctorId: user?._id, action });
      loadData();
    } catch {
      // no-op
    }
  };

  const tabs = [
    { key: 'overview', icon: <LayoutDashboard size={14} />, label: 'Overview' },
    { key: 'appointments', icon: <CalendarDays size={14} />, label: 'Appointments' },
    { key: 'patientReports', icon: <FileText size={14} />, label: 'Patient Reports' },
    { key: 'availability', icon: <Clock size={14} />, label: 'Availability' },
    { key: 'prescriptions', icon: <Pill size={14} />, label: 'Prescriptions' },
    { key: 'profile', icon: <UserCog size={14} />, label: 'Edit Profile' },
  ];

  const statusColors = { pending: 'bg-yellow-50 text-yellow-700', confirmed: 'bg-blue-50 text-blue-700', completed: 'bg-green-50 text-green-700', cancelled: 'bg-red-50 text-red-700' };
  const inputCls = "h-10 px-3 rounded-lg border border-[#d0d8e0] text-[13.5px] outline-none focus:border-[#0d5f3a] w-full";
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const filteredAppointments = appointments.filter((appointment) => {
    const searchTerm = appointmentFilters.search.trim().toLowerCase();
    const matchesSearch = !searchTerm || [
      appointment.patientName,
      appointment.patientEmail,
      appointment.patientPhone,
      appointment.appointmentTime,
      appointment.appointmentType,
      appointment.appointmentStatus,
    ]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(searchTerm));

    const matchesStatus = appointmentFilters.status === 'all' || (appointment.appointmentStatus || '').toLowerCase() === appointmentFilters.status;
    const matchesType = appointmentFilters.type === 'all' || (appointment.appointmentType || '').toLowerCase() === appointmentFilters.type;
    return matchesSearch && matchesStatus && matchesType;
  });

  const filteredPatientReports = patientReports.filter((report) => {
    const searchTerm = patientReportSearch.trim().toLowerCase();
    if (!searchTerm) return true;

    return [report.title, report.fileType, report.description]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(searchTerm));
  });

  const filteredAvailability = availability.filter((slot) => {
    const searchTerm = availabilityFilters.search.trim().toLowerCase();
    const matchesSearch = !searchTerm || [slot.hospital, slot.dayOfWeek, slot.startTime, slot.endTime]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(searchTerm));
    const matchesDay = availabilityFilters.day === 'all' || (slot.dayOfWeek || '') === availabilityFilters.day;
    const matchesType = availabilityFilters.sessionType === 'all' || (slot.sessionType || 'in-person') === availabilityFilters.sessionType;
    return matchesSearch && matchesDay && matchesType;
  });

  const filteredPrescriptions = prescriptions.filter((prescription) => {
    const searchTerm = prescriptionSearch.trim().toLowerCase();
    if (!searchTerm) return true;

    return [
      prescription.patientName,
      prescription.patientId,
      prescription.diagnosis,
      prescription.notes,
      ...(Array.isArray(prescription.medications)
        ? prescription.medications.map((m) => `${m?.name || ''} ${m?.dosage || ''}`)
        : []),
    ]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(searchTerm));
  });

  return (
    <div className="flex-1 bg-[#f0f4f8]">
      <div className="bg-gradient-to-r from-[#0d5f3a] to-[#1a9960] text-white py-8 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Dr. {user?.firstName || 'Doctor'} {user?.lastName || ''}</h1>
            <p className="text-white/70 text-[14px] mt-1">{user?.specialization || 'Specialist'} • {user?.email}</p>
          </div>
          <button onClick={logout} className="px-5 py-2 bg-white/10 text-white rounded-xl border border-white/20 cursor-pointer text-[13.5px] font-medium hover:bg-white/20 transition-all">Logout</button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6">
        <div className="flex gap-1 bg-white rounded-xl p-1 shadow-sm border border-[#e8edf2] mb-6 overflow-x-auto">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex-1 py-2.5 rounded-lg text-[13.5px] font-medium border-none cursor-pointer transition-all whitespace-nowrap px-3 flex items-center justify-center gap-1.5 ${tab === t.key ? 'bg-[#0d5f3a] text-white shadow-sm' : 'bg-transparent text-[#6b7b8d] hover:text-[#1e2a3a]'}`}>
              {t.icon}{t.label}
            </button>
          ))}
        </div>

        {loading ? <div className="text-center py-12"><div className="w-8 h-8 border-3 border-[#0d5f3a] border-t-transparent rounded-full animate-spin mx-auto" /></div> : (
          <>
            {tab === 'overview' && (
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl p-6 border border-[#e8edf2] shadow-sm"><p className="text-3xl font-bold text-[#1a6fa0]">{appointments.length}</p><p className="text-[13px] text-[#6b7b8d] mt-1">Total Appointments</p></div>
                <div className="bg-white rounded-2xl p-6 border border-[#e8edf2] shadow-sm"><p className="text-3xl font-bold text-[#f59e0b]">{appointments.filter(a => a.appointmentStatus === 'pending').length}</p><p className="text-[13px] text-[#6b7b8d] mt-1">Pending</p></div>
                <div className="bg-white rounded-2xl p-6 border border-[#e8edf2] shadow-sm"><p className="text-3xl font-bold text-[#0d5f3a]">{availability.length}</p><p className="text-[13px] text-[#6b7b8d] mt-1">Available Slots</p></div>
                <div className="bg-white rounded-2xl p-6 border border-[#e8edf2] shadow-sm"><p className="text-3xl font-bold text-[#6c3fa0]">{prescriptions.length}</p><p className="text-[13px] text-[#6b7b8d] mt-1">Prescriptions Issued</p></div>
              </div>
            )}

            {tab === 'appointments' && (
              <div className="space-y-3">
                <div className="bg-white rounded-xl p-4 border border-[#e8edf2] flex flex-wrap items-end gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[12px] text-[#6b7b8d]">Search</label>
                    <input
                      type="text"
                      value={appointmentFilters.search}
                      onChange={(e) => setAppointmentFilters({ ...appointmentFilters, search: e.target.value })}
                      placeholder="Patient, contact, type"
                      className="h-10 px-3 rounded-lg border border-[#d0d8e0] text-[13px] outline-none focus:border-[#0d5f3a] min-w-[220px]"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[12px] text-[#6b7b8d]">Status</label>
                    <select value={appointmentFilters.status} onChange={(e) => setAppointmentFilters({ ...appointmentFilters, status: e.target.value })} className="h-10 px-3 rounded-lg border border-[#d0d8e0] text-[13px] outline-none focus:border-[#0d5f3a]">
                      <option value="all">All</option>
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[12px] text-[#6b7b8d]">Type</label>
                    <select value={appointmentFilters.type} onChange={(e) => setAppointmentFilters({ ...appointmentFilters, type: e.target.value })} className="h-10 px-3 rounded-lg border border-[#d0d8e0] text-[13px] outline-none focus:border-[#0d5f3a]">
                      <option value="all">All</option>
                      <option value="in-person">In-Person</option>
                      <option value="telemedicine">Telemedicine</option>
                    </select>
                  </div>
                  <button onClick={() => setAppointmentFilters({ search: '', status: 'all', type: 'all' })} className="h-10 px-4 rounded-lg border border-[#d0d8e0] bg-white text-[#4a5568] text-[13px] cursor-pointer hover:bg-[#f8fbfd]">
                    Clear
                  </button>
                </div>
                <div className="text-[12px] text-[#6b7b8d]">Showing {filteredAppointments.length} of {appointments.length} appointments</div>
                {appointments.length === 0 ? <div className="bg-white rounded-2xl p-12 text-center border border-[#e8edf2]"><p className="text-[#6b7b8d]">No appointments yet.</p></div> :
                  filteredAppointments.map(a => (
                    <div key={a._id} className="bg-white rounded-xl p-5 border border-[#e8edf2] flex items-center justify-between gap-4 shadow-sm">
                      <div className="flex-1">
                        <div className="font-semibold text-[14px] text-[#1e2a3a]">{a.patientName}</div>
                        <div className="text-[12.5px] text-[#6b7b8d] mt-1">{new Date(a.appointmentDate).toLocaleDateString()} • {a.appointmentTime} • #{a.appointmentNo}</div>
                        <div className="text-[12px] text-[#5a9ec4] mt-0.5">{a.patientPhone} • {a.patientEmail}</div>
                        {telemedicineSessions[a._id]?._id && a.appointmentType === 'telemedicine' && a.appointmentStatus === 'confirmed' && (
                          <div className="mt-2">
                            <Link
                              to={`/telemedicine/${telemedicineSessions[a._id]._id}`}
                              className="inline-flex items-center px-3 py-1.5 bg-[#0d5f3a] text-white rounded-lg no-underline text-[12px] font-medium hover:bg-[#0b4f31] transition-colors"
                            >
                              Join Telemedicine
                            </Link>
                          </div>
                        )}
                        <div className="mt-2 flex flex-wrap gap-2">
                          {a.appointmentStatus === 'pending' && (
                            <>
                              <button onClick={() => respondToAppointment(a._id, 'accept')} className="px-3 py-1.5 bg-[#0d5f3a] text-white rounded-lg border-none cursor-pointer text-[12px] font-medium">Accept</button>
                              <button onClick={() => respondToAppointment(a._id, 'reject')} className="px-3 py-1.5 bg-[#dc2626] text-white rounded-lg border-none cursor-pointer text-[12px] font-medium">Reject</button>
                            </>
                          )}
                          {a.patientId && (
                            <button onClick={() => loadPatientReports(a.patientId)} className="px-3 py-1.5 bg-[#f0f7fc] text-[#1a6fa0] rounded-lg border border-[#c4dced] cursor-pointer text-[12px] font-medium">
                              View Patient Reports
                            </button>
                          )}
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-[12px] font-medium ${statusColors[a.appointmentStatus] || ''}`}>{a.appointmentStatus}</span>
                    </div>
                  ))
                }
              </div>
            )}

            {tab === 'patientReports' && (
              <div className="space-y-4">
                <div className="bg-white rounded-2xl p-6 border border-[#e8edf2] shadow-sm">
                  <h3 className="text-[15px] font-bold text-[#1e2a3a] mb-3">Patient Uploaded Reports</h3>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      loadPatientReports(selectedPatientLookup);
                    }}
                    className="flex flex-wrap gap-3 items-end"
                  >
                    <input
                      type="text"
                      value={selectedPatientLookup}
                      onChange={(e) => setSelectedPatientLookup(e.target.value)}
                      placeholder="Enter patient ID, email, or phone"
                      className={`${inputCls} max-w-sm`}
                    />
                    <button type="submit" className="h-10 px-5 bg-[#1a6fa0] text-white rounded-lg border-none cursor-pointer text-[13px] font-medium">
                      Fetch Reports
                    </button>
                  </form>
                </div>

                <div className="space-y-3">
                  <div className="bg-white rounded-xl p-4 border border-[#e8edf2] flex flex-wrap items-end gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-[12px] text-[#6b7b8d]">Search Reports</label>
                      <input
                        type="text"
                        value={patientReportSearch}
                        onChange={(e) => setPatientReportSearch(e.target.value)}
                        placeholder="Title, type"
                        className="h-10 px-3 rounded-lg border border-[#d0d8e0] text-[13px] outline-none focus:border-[#0d5f3a] min-w-[220px]"
                      />
                    </div>
                    <button onClick={() => setPatientReportSearch('')} className="h-10 px-4 rounded-lg border border-[#d0d8e0] bg-white text-[#4a5568] text-[13px] cursor-pointer hover:bg-[#f8fbfd]">
                      Clear
                    </button>
                  </div>
                  <div className="text-[12px] text-[#6b7b8d]">Showing {filteredPatientReports.length} of {patientReports.length} reports</div>
                  {loadingReports ? (
                    <div className="text-center py-8 text-[#6b7b8d]">Loading reports...</div>
                  ) : patientReports.length === 0 ? (
                    <div className="bg-white rounded-xl p-5 border border-[#e8edf2] text-[#6b7b8d]">No reports found for this patient.</div>
                  ) : filteredPatientReports.map((report) => (
                    <div key={report._id} className="bg-white rounded-xl p-5 border border-[#e8edf2] shadow-sm flex items-center justify-between gap-4">
                      <div>
                        <div className="font-semibold text-[14px] text-[#1e2a3a]">{report.title}</div>
                        <div className="text-[12.5px] text-[#6b7b8d] mt-1">{report.fileType} • {new Date(report.uploadedAt).toLocaleDateString()}</div>
                      </div>
                      <a href={report.fileUrl} target="_blank" rel="noreferrer" className="px-4 py-1.5 bg-[#f0f7fc] text-[#1a6fa0] rounded-lg text-[13px] font-medium no-underline hover:bg-[#1a6fa0] hover:text-white transition-all">
                        View
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tab === 'availability' && (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl p-6 border border-[#e8edf2] shadow-sm">
                  <h3 className="text-[15px] font-bold text-[#1e2a3a] mb-4">{editingSlotId ? 'Edit Availability Slot' : 'Add Availability Slot'}</h3>
                  <form onSubmit={addSlot} className="grid grid-cols-2 md:grid-cols-6 gap-3 items-end">
                    <div className="flex flex-col gap-1"><label className="text-[11.5px] font-medium text-[#4a5568]">Day</label><select value={slotForm.dayOfWeek} onChange={e => setSlotForm({...slotForm, dayOfWeek: e.target.value})} className={inputCls}>{days.map(d => <option key={d}>{d}</option>)}</select></div>
                    <div className="flex flex-col gap-1"><label className="text-[11.5px] font-medium text-[#4a5568]">Start</label><input type="time" value={slotForm.startTime} onChange={e => setSlotForm({...slotForm, startTime: e.target.value})} className={inputCls} /></div>
                    <div className="flex flex-col gap-1"><label className="text-[11.5px] font-medium text-[#4a5568]">End</label><input type="time" value={slotForm.endTime} onChange={e => setSlotForm({...slotForm, endTime: e.target.value})} className={inputCls} /></div>
                    <div className="flex flex-col gap-1"><label className="text-[11.5px] font-medium text-[#4a5568]">Session Type</label>
                      <select value={profileForm.serviceType === 'both' ? slotForm.sessionType : profileForm.serviceType}
                        onChange={e => setSlotForm({...slotForm, sessionType: e.target.value})}
                        disabled={profileForm.serviceType !== 'both'}
                        className={inputCls}>
                        <option value="in-person">In-Person</option>
                        <option value="telemedicine">Telemedicine</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-1"><label className="text-[11.5px] font-medium text-[#4a5568]">Hospital</label><input type="text" value={slotForm.hospital} onChange={e => setSlotForm({...slotForm, hospital: e.target.value})} className={inputCls} placeholder="Hospital name" /></div>
                    <div className="flex flex-col gap-1"><label className="text-[11.5px] font-medium text-[#4a5568]">Patient Limit</label><input type="number" min="1" value={slotForm.maxPatients} onChange={e => setSlotForm({...slotForm, maxPatients: Number(e.target.value) || 1})} className={inputCls} /></div>
                    <button type="submit" className="h-10 bg-[#0d5f3a] text-white rounded-lg border-none cursor-pointer text-[13px] font-medium">{editingSlotId ? 'Update Slot' : 'Add Slot'}</button>
                    {editingSlotId && (
                      <button type="button" onClick={cancelEditSlot} className="h-10 bg-[#e5e7eb] text-[#1e2a3a] rounded-lg border-none cursor-pointer text-[13px] font-medium">
                        Cancel Edit
                      </button>
                    )}
                  </form>
                </div>
                <div className="bg-white rounded-xl p-4 border border-[#e8edf2] flex flex-wrap items-end gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[12px] text-[#6b7b8d]">Search</label>
                    <input
                      type="text"
                      value={availabilityFilters.search}
                      onChange={(e) => setAvailabilityFilters({ ...availabilityFilters, search: e.target.value })}
                      placeholder="Day, time, hospital"
                      className="h-10 px-3 rounded-lg border border-[#d0d8e0] text-[13px] outline-none focus:border-[#0d5f3a] min-w-[220px]"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[12px] text-[#6b7b8d]">Day</label>
                    <select value={availabilityFilters.day} onChange={(e) => setAvailabilityFilters({ ...availabilityFilters, day: e.target.value })} className="h-10 px-3 rounded-lg border border-[#d0d8e0] text-[13px] outline-none focus:border-[#0d5f3a]">
                      <option value="all">All</option>
                      {days.map((day) => <option key={day} value={day}>{day}</option>)}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[12px] text-[#6b7b8d]">Session</label>
                    <select value={availabilityFilters.sessionType} onChange={(e) => setAvailabilityFilters({ ...availabilityFilters, sessionType: e.target.value })} className="h-10 px-3 rounded-lg border border-[#d0d8e0] text-[13px] outline-none focus:border-[#0d5f3a]">
                      <option value="all">All</option>
                      <option value="in-person">In-Person</option>
                      <option value="telemedicine">Telemedicine</option>
                    </select>
                  </div>
                  <button onClick={() => setAvailabilityFilters({ search: '', day: 'all', sessionType: 'all' })} className="h-10 px-4 rounded-lg border border-[#d0d8e0] bg-white text-[#4a5568] text-[13px] cursor-pointer hover:bg-[#f8fbfd]">
                    Clear
                  </button>
                </div>
                <div className="text-[12px] text-[#6b7b8d]">Showing {filteredAvailability.length} of {availability.length} slots</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {filteredAvailability.map(s => (
                    <div key={s._id} className="bg-white rounded-xl p-4 border border-[#e8edf2] shadow-sm flex items-start justify-between">
                      <div>
                        <div className="font-semibold text-[14px] text-[#1e2a3a]">{s.dayOfWeek}</div>
                        <div className="text-[13px] text-[#5a9ec4]">{s.startTime} — {s.endTime}</div>
                        <div className="text-[12px] text-[#6b7b8d] mt-1">{(s.sessionType || 'in-person') === 'telemedicine' ? 'Telemedicine' : 'In-Person'}</div>
                        <div className="text-[12px] text-[#6b7b8d] mt-1">Limit: {s.maxPatients || 20} patient(s)</div>
                        {s.hospital && <div className="text-[12.5px] text-[#6b7b8d] mt-1">{s.hospital}</div>}
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => startEditSlot(s)} className="px-2 py-1 text-[#0d5f3a] hover:text-[#0b4f31] bg-green-50 border border-green-200 rounded-md cursor-pointer text-[11px] font-medium">Edit</button>
                        <button onClick={() => deleteSlot(s._id)} className="text-red-400 hover:text-red-600 bg-transparent border-none cursor-pointer text-sm">✕</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tab === 'prescriptions' && (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl p-6 border border-[#e8edf2] shadow-sm">
                  <h3 className="text-[15px] font-bold text-[#1e2a3a] mb-4">Issue Prescription</h3>
                  <form onSubmit={issueRx} className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <input type="text" placeholder="Patient ID, email, or phone" value={rxForm.patientId} onChange={e => setRxForm({...rxForm, patientId: e.target.value})} className={inputCls} required />
                      <input type="text" placeholder="Patient Name (optional)" value={rxForm.patientName} onChange={e => setRxForm({...rxForm, patientName: e.target.value})} className={inputCls} />
                    </div>
                    <input type="text" placeholder="Diagnosis" value={rxForm.diagnosis} onChange={e => setRxForm({...rxForm, diagnosis: e.target.value})} className={inputCls} required />
                    <div className="grid grid-cols-4 gap-3">
                      <input type="text" placeholder="Medication" value={rxForm.medName} onChange={e => setRxForm({...rxForm, medName: e.target.value})} className={inputCls} required />
                      <input type="text" placeholder="Dosage" value={rxForm.medDosage} onChange={e => setRxForm({...rxForm, medDosage: e.target.value})} className={inputCls} required />
                      <input type="text" placeholder="Frequency" value={rxForm.medFrequency} onChange={e => setRxForm({...rxForm, medFrequency: e.target.value})} className={inputCls} required />
                      <input type="text" placeholder="Duration" value={rxForm.medDuration} onChange={e => setRxForm({...rxForm, medDuration: e.target.value})} className={inputCls} required />
                    </div>
                    <textarea placeholder="Notes" value={rxForm.notes} onChange={e => setRxForm({...rxForm, notes: e.target.value})} rows={2} className="px-3 py-2 rounded-lg border border-[#d0d8e0] text-[13.5px] outline-none focus:border-[#0d5f3a] resize-none w-full" />
                    <button type="submit" className="h-10 px-6 bg-[#0d5f3a] text-white rounded-lg border-none cursor-pointer text-[13px] font-medium">Issue Prescription</button>
                  </form>
                </div>
                <div className="bg-white rounded-xl p-4 border border-[#e8edf2] flex flex-wrap items-end gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[12px] text-[#6b7b8d]">Search Prescriptions</label>
                    <input
                      type="text"
                      value={prescriptionSearch}
                      onChange={(e) => setPrescriptionSearch(e.target.value)}
                      placeholder="Patient, diagnosis, medicine"
                      className="h-10 px-3 rounded-lg border border-[#d0d8e0] text-[13px] outline-none focus:border-[#0d5f3a] min-w-[240px]"
                    />
                  </div>
                  <button onClick={() => setPrescriptionSearch('')} className="h-10 px-4 rounded-lg border border-[#d0d8e0] bg-white text-[#4a5568] text-[13px] cursor-pointer hover:bg-[#f8fbfd]">
                    Clear
                  </button>
                </div>
                <div className="text-[12px] text-[#6b7b8d]">Showing {filteredPrescriptions.length} of {prescriptions.length} prescriptions</div>
                <div className="space-y-3">
                  {filteredPrescriptions.map(rx => (
                    <div key={rx._id} className="bg-white rounded-xl p-5 border border-[#e8edf2] shadow-sm">
                      <div className="flex items-center justify-between">
                        <div className="font-semibold text-[14px] text-[#1e2a3a]">{rx.patientName}</div>
                        <span className="text-[12px] text-[#8a9bae]">{new Date(rx.issuedAt).toLocaleDateString()}</span>
                      </div>
                      <div className="text-[13px] text-[#5a9ec4] mt-1">Diagnosis: {rx.diagnosis}</div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {rx.medications?.map((m, i) => <span key={i} className="px-3 py-1 bg-[#f0f7fc] text-[#1a6fa0] rounded-full text-[12px]">{m.name} - {m.dosage}</span>)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tab === 'profile' && (
              <div className="bg-white rounded-2xl p-6 border border-[#e8edf2] shadow-sm">
                <h3 className="text-[15px] font-bold text-[#1e2a3a] mb-4">Edit Profile</h3>
                <form onSubmit={saveProfile} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-[12px] font-medium text-[#4a5568]">First Name</label>
                    <input type="text" value={profileForm.firstName} onChange={e => setProfileForm({ ...profileForm, firstName: e.target.value })} className={inputCls} required />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[12px] font-medium text-[#4a5568]">Last Name</label>
                    <input type="text" value={profileForm.lastName} onChange={e => setProfileForm({ ...profileForm, lastName: e.target.value })} className={inputCls} required />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[12px] font-medium text-[#4a5568]">Phone</label>
                    <input type="text" value={profileForm.phone} onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })} className={inputCls} required />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[12px] font-medium text-[#4a5568]">Specialization</label>
                    <input type="text" value={profileForm.specialization} onChange={e => setProfileForm({ ...profileForm, specialization: e.target.value })} className={inputCls} required />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[12px] font-medium text-[#4a5568]">Hospital Affiliation</label>
                    <input type="text" value={profileForm.hospitalAffiliation} onChange={e => setProfileForm({ ...profileForm, hospitalAffiliation: e.target.value })} className={inputCls} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[12px] font-medium text-[#4a5568]">Consultation Fee</label>
                    <input type="number" min="0" value={profileForm.consultationFee} onChange={e => setProfileForm({ ...profileForm, consultationFee: e.target.value })} className={inputCls} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[12px] font-medium text-[#4a5568]">Service Type</label>
                    <select value={profileForm.serviceType} onChange={(e) => setProfileForm({ ...profileForm, serviceType: e.target.value })}
                      className={inputCls}>
                      <option value="in-person">In-Person Only</option>
                      <option value="telemedicine">Telemedicine Only</option>
                      <option value="both">Both</option>
                    </select>
                  </div>
                  <div className="md:col-span-2 flex flex-col gap-1">
                    <label className="text-[12px] font-medium text-[#4a5568]">Bio</label>
                    <textarea value={profileForm.bio} onChange={e => setProfileForm({ ...profileForm, bio: e.target.value })}
                      rows={3} className="px-3 py-2 rounded-lg border border-[#d0d8e0] text-[13.5px] outline-none focus:border-[#0d5f3a] resize-none w-full" />
                  </div>
                  <div className="md:col-span-2 flex flex-col gap-1">
                    <label className="text-[12px] font-medium text-[#4a5568]">Profile Image URL</label>
                    <input type="url" value={profileForm.profileImage} onChange={e => setProfileForm({ ...profileForm, profileImage: e.target.value })} className={inputCls} placeholder="https://..." />
                  </div>
                  <div className="md:col-span-2 flex items-center justify-between mt-1">
                    <p className={`text-[13px] ${profileMessage.includes('successfully') ? 'text-green-600' : 'text-red-500'}`}>{profileMessage}</p>
                    <button type="submit" disabled={savingProfile} className="h-10 px-5 bg-[#0d5f3a] text-white rounded-lg border-none cursor-pointer text-[13px] font-medium disabled:opacity-60">
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

export default DoctorDashboardPage;
