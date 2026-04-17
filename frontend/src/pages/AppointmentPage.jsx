import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { appointmentApi, doctorApi, telemedicineApi } from '../services/api';
import { MapPin } from 'lucide-react';

const AppointmentPage = () => {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Parse date safely
  let initialDate = '';
  if (searchParams.get('date')) {
    const d = new Date(searchParams.get('date'));
    if (!isNaN(d.valueOf())) initialDate = d.toISOString().split('T')[0];
  }

  const [form, setForm] = useState({
    patientTitle: user?.title || 'Mr',
    patientName: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : '',
    patientEmail: user?.email || '',
    patientPhone: user?.phone || '',
    patientNIC: user?.nic || '',
    patientArea: user?.area || '',
    appointmentType: searchParams.get('sessionType') || 'in-person',
    doctorId: searchParams.get('doctorId') || '',
    doctorName: searchParams.get('doctorName') || '',
    specialization: searchParams.get('specialization') || '',
    hospitalName: searchParams.get('hospital') || '',
    appointmentDate: initialDate,
    appointmentTime: searchParams.get('time') || '',
    doctorFee: Number(searchParams.get('fee')) || 0,
    hospitalFee: 0,
    eChannellingFee: 399, // Our mocked booking fee
  });

  const [doctors, setDoctors] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const hasPreselectedSession = !!(searchParams.get('doctorId') && searchParams.get('date') && searchParams.get('time'));

  useEffect(() => {
    if (!form.doctorId) {
      doctorApi.getAll('verified=true').then(d => setDoctors(Array.isArray(d) ? d : [])).catch(() => {});
    }
  }, []);

  const h = (f, v) => setForm({ ...form, [f]: v });

  const selectDoctor = (d) => {
    setForm({
      ...form,
      doctorId: d._id,
      doctorName: `Dr. ${d.firstName} ${d.lastName}`,
      specialization: d.specialization,
      hospitalName: d.hospitalAffiliation || '',
      doctorFee: d.consultationFee || 0,
    });
  };

  const totalFee = (form.doctorFee || 0) + (form.hospitalFee || 0) + (form.eChannellingFee || 399);

  const buildScheduledAt = (dateValue, timeValue) => {
    if (!dateValue) return new Date().toISOString();
    const safeTime = timeValue || '00:00';
    const iso = new Date(`${dateValue}T${safeTime}:00`);
    if (Number.isNaN(iso.valueOf())) return new Date(dateValue).toISOString();
    return iso.toISOString();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await appointmentApi.create({
        ...form,
        patientId: user?._id || '',
        totalFee,
      });

      const appointmentId = result?._id || result?.id || '';
      let telemedicineSessionId = '';
      let telemedicineNotice = '';

      if (appointmentId && (result?.appointmentType || form.appointmentType) === 'telemedicine') {
        try {
          const telemedicineResponse = await telemedicineApi.createSession({
            appointmentId,
            doctorId: result?.doctorId || form.doctorId || '',
            patientId: result?.patientId || user?._id || '',
            scheduledAt: buildScheduledAt(result?.appointmentDate || form.appointmentDate, result?.appointmentTime || form.appointmentTime),
          });
          telemedicineSessionId = telemedicineResponse?.session?._id || telemedicineResponse?.session?.id || '';
        } catch (sessionErr) {
          if (sessionErr?.status === 409 && sessionErr?.data?.session?._id) {
            telemedicineSessionId = sessionErr.data.session._id;
          }
        }

        if (telemedicineSessionId) {
          telemedicineNotice = 'Video consultation room is ready and will appear after payment is completed.';
        }
      }

      const [firstName, ...restNames] = (form.patientName || '').trim().split(' ').filter(Boolean);
      const lastName = restNames.join(' ');

      const qs = new URLSearchParams({
        appointmentId,
        doctorId: result?.doctorId || form.doctorId || '',
        patientId: result?.patientId || user?._id || '',
        doctorName: result?.doctorName || form.doctorName || '',
        appointmentDate: result?.appointmentDate || form.appointmentDate || '',
        appointmentTime: result?.appointmentTime || form.appointmentTime || '',
        appointmentType: result?.appointmentType || form.appointmentType || 'in-person',
        totalFee: String(result?.totalFee ?? totalFee),
        doctorFee: String(result?.doctorFee ?? form.doctorFee ?? 0),
        hospitalFee: String(result?.hospitalFee ?? form.hospitalFee ?? 0),
        eChannellingFee: String(result?.eChannellingFee ?? form.eChannellingFee ?? 399),
        sessionId: telemedicineSessionId,
      }).toString();

      navigate(`/payments/checkout?${qs}`, {
        state: {
          appointment: result,
          telemedicineSessionId,
          telemedicineNotice,
          bookingNotice: 'Appointment reserved. Complete payment to confirm it.',
          customerInfo: {
            firstName: firstName || 'Patient',
            lastName: lastName || '',
            email: form.patientEmail || user?.email || '',
            phone: form.patientPhone || user?.phone || '',
            address: form.patientArea || 'N/A',
            city: form.patientArea || 'N/A',
            country: 'Sri Lanka',
          },
        },
      });
    } catch (err) {
      setError(err.message || 'Failed to book appointment');
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "h-11 px-4 rounded-lg border border-[#c5d2dc] bg-white text-[13.5px] text-[#1e2a3a] outline-none focus:border-[#0b5d94] focus:ring-1 focus:ring-[#0b5d94] placeholder:text-[#a0aec0] w-full";
  const labelCls = "text-[12px] font-semibold text-[#4a5568] mb-1.5 ml-0.5";

  return (
    <div className="flex-1 bg-[#f4f7f9] min-h-screen pb-12">
      <div className="bg-[#1a3a4a] text-white py-12 px-6">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-bold">Secure Checkout</h1>
          <p className="mt-2 text-[#a0d8ef] text-[14px]">Complete your booking details below</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        
        {/* Doctor Selection (only if not pre-selected) */}
        {!form.doctorId && doctors.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-[#e8edf2] p-6 mb-6">
            <h2 className="text-[16px] font-bold text-[#1e2a3a] mb-4">Select a target specialist for generic booking</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-64 overflow-y-auto">
              {doctors.map(d => (
                <button key={d._id} onClick={() => selectDoctor(d)}
                  className="p-4 bg-[#f8fbfd] rounded-xl border border-[#e8edf2] text-left cursor-pointer hover:border-[#0b5d94] transition-all">
                  <div className="font-semibold text-[14px] text-[#1e2a3a]">Dr. {d.firstName} {d.lastName}</div>
                  <div className="text-[12.5px] text-[#5a9ec4] mt-0.5">{d.specialization}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Two Column Layout for Checkout */}
        <div className="flex flex-col md:flex-row gap-6">
          
          {/* Left Column: Form */}
          <div className="flex-[2] bg-white rounded-2xl shadow-sm border border-[#e8edf2] p-8">
            {error && <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg text-red-700 text-[13.5px]">{error}</div>}

            <form onSubmit={handleSubmit}>
              <h3 className="text-[16px] font-bold text-[#1a3a4a] border-b border-[#e8edf2] pb-3 mb-5">Patient Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-[100px_1fr] gap-4 mb-4">
                <div className="flex flex-col">
                  <label className={labelCls}>Title</label>
                  <select value={form.patientTitle} onChange={e => h('patientTitle', e.target.value)} className={inputCls} required>
                    {['Mr','Mrs','Ms','Dr','Rev'].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div className="flex flex-col">
                  <label className={labelCls}>Full Name *</label>
                  <input required value={form.patientName} onChange={e => h('patientName', e.target.value)} className={inputCls} placeholder="John Doe" />
                </div>
              </div>

              <div className="mb-6 p-3.5 rounded-xl bg-[#f0f7fc] border border-[#c4dced] text-[13px] text-[#1a3a4a]">
                Appointment Mode: <strong>{form.appointmentType === 'telemedicine' ? 'Telemedicine Session' : 'In-Person Session'}</strong>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                <div className="flex flex-col">
                  <label className={labelCls}>NIC/Passport *</label>
                  <input required value={form.patientNIC} onChange={e => h('patientNIC', e.target.value)} className={inputCls} placeholder="National ID" />
                </div>
                <div className="flex flex-col">
                  <label className={labelCls}>Area/City</label>
                  <input value={form.patientArea} onChange={e => h('patientArea', e.target.value)} className={inputCls} placeholder="Colombo" />
                </div>
              </div>

              {!hasPreselectedSession && form.doctorId && (
                <>
                  <h3 className="text-[16px] font-bold text-[#1a3a4a] border-b border-[#e8edf2] pb-3 mb-5">Session Details</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                    <div className="flex flex-col">
                      <label className={labelCls}>Date *</label>
                      <input type="date" required value={form.appointmentDate} onChange={e => h('appointmentDate', e.target.value)} min={new Date().toISOString().split('T')[0]} className={inputCls} />
                    </div>
                    <div className="flex flex-col">
                      <label className={labelCls}>Time *</label>
                      <input type="time" required value={form.appointmentTime} onChange={e => h('appointmentTime', e.target.value)} className={inputCls} />
                    </div>
                  </div>
                </>
              )}
            </form>
          </div>

          {/* Right Column: Checkout Summary Sidebar */}
          <div className="flex-1">
            <div className="bg-white rounded-2xl shadow-sm border border-[#e8edf2] p-6 lg:sticky lg:top-24">
              <h3 className="text-[16px] font-bold text-[#1a3a4a] mb-5">Appointment Summary</h3>
              
              {form.doctorId ? (
                <div className="space-y-4">
                  <div className="bg-[#f8fbfd] p-4 rounded-xl border border-[#e8edf2]">
                    <div className="font-bold text-[#1a3a4a] text-[15px] leading-snug">{form.doctorName}</div>
                    <div className="text-[13px] text-[#0b5d94] mt-1">{form.specialization}</div>
                    <div className="text-[12px] text-[#6b7b8d] mt-2 font-medium flex items-center gap-1"><MapPin size={12} /> {form.hospitalName || 'Private Clinic'}</div>
                  </div>
                  
                  {form.appointmentDate && form.appointmentTime && (
                    <div className="flex justify-between items-center text-[13px] text-[#4a5568]">
                      <span>Session:</span>
                      <strong className="text-[#1a3a4a]">
                        {new Date(form.appointmentDate).toLocaleDateString('en-GB', {day: 'numeric', month: 'short'})} at {form.appointmentTime}
                      </strong>
                    </div>
                  )}

                  <hr className="border-[#e8edf2] my-4" />

                  <div className="space-y-2 text-[13.5px] text-[#6b7b8d]">
                    <div className="flex justify-between items-center">
                      <span>Doctor Fee</span>
                      <span className="text-[#1a3a4a] font-medium">Rs {(form.doctorFee || 0).toLocaleString()}.00</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Hospital Fee</span>
                      <span className="text-[#1a3a4a] font-medium">Rs {(form.hospitalFee || 0).toLocaleString()}.00</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Booking Fee</span>
                      <span className="text-[#1a3a4a] font-medium">Rs {(form.eChannellingFee || 399).toLocaleString()}.00</span>
                    </div>
                  </div>

                  <div className="bg-[#f0f7fc] p-4 rounded-xl mt-4 flex justify-between items-center border border-[#c4dced]">
                    <span className="font-bold text-[#0b5d94]">Total Booking</span>
                    <span className="font-bold text-[#1a6fa0] text-[18px]">Rs {totalFee.toLocaleString()}.00</span>
                  </div>

                  <button 
                    onClick={handleSubmit} 
                    disabled={loading || !form.doctorId || !form.appointmentDate || !form.appointmentTime}
                    className="w-full mt-6 h-12 bg-[#1e3068] hover:bg-[#162452] text-white font-bold rounded-lg border-none cursor-pointer transition-colors shadow-none text-[15px] disabled:opacity-60 flex items-center justify-center gap-2">
                    {loading ? 'Processing...' : (
                      <>
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                          <path d="M7 11V7a5 5 0 0110 0v4" />
                        </svg>
                        Pay
                      </>
                    )}
                  </button>
                  <p className="text-center text-[11.5px] text-[#8a9bae] mt-3">Payment is required to confirm your appointment.</p>
                </div>
              ) : (
                <div className="text-center py-8 text-[#6b7b8d] text-[13px]">
                  Please select a doctor to begin booking.
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default AppointmentPage;