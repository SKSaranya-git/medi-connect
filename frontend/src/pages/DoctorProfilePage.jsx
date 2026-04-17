import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doctorApi } from '../services/api';
import { GraduationCap, Sparkles, Building2, Users, NotebookPen, Star } from 'lucide-react';

const DoctorProfilePage = () => {
  const { id } = useParams();
  const [doctor, setDoctor] = useState(null);
  const [availability, setAvailability] = useState([]);
  const [sessionFilter, setSessionFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [doc, slots] = await Promise.all([doctorApi.getById(id), doctorApi.getAvailability(id)]);
        setDoctor(doc);
        setAvailability(Array.isArray(slots) ? slots : []);
      } catch { /* */ }
      finally { setLoading(false); }
    };
    load();
  }, [id]);

  if (loading) return <div className="flex-1 flex items-center justify-center p-10"><div className="w-8 h-8 border-3 border-[#1a6fa0] border-t-transparent rounded-full animate-spin" /></div>;
  if (!doctor) return <div className="flex-1 flex items-center justify-center p-10"><p className="text-[#6b7b8d]">Doctor not found.</p></div>;

  const initials = (doctor.firstName?.[0] || '?').toUpperCase();
  const filteredAvailability = availability.filter((slot) => {
    if (sessionFilter === 'all') return true;
    const mode = slot.sessionType || 'in-person';
    return mode === sessionFilter;
  });

  const toDateParam = (dateObj) => {
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const d = String(dateObj.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };
  
  // Calculate next dates for availability slots for realism
  const getNextDateForDay = (dayName) => {
    const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    const target = days.indexOf(dayName) || 0;
    const now = new Date();
    const current = now.getDay();
    let diff = target - current;
    if (diff <= 0) diff += 7;
    now.setDate(now.getDate() + diff);
    return now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className="flex-1 bg-[#f4f7f9] pb-12">
      <div className="max-w-6xl mx-auto px-6 py-10">
        
        {/* Top Profile Section */}
        <div className="flex flex-col lg:flex-row gap-6 mb-8">
          
          {/* Left Column - Doctor Identity */}
          <div className="w-full lg:w-[280px] bg-white rounded-2xl border border-[#e8edf2] p-8 flex flex-col items-center shadow-sm">
            <div className="w-[120px] h-[120px] rounded-full bg-[#9bbad1] flex items-center justify-center shadow-inner relative overflow-hidden mb-4">
              <span className="text-[#eff4f8] text-[90px] font-sans -mt-8 opacity-50 block text-center">@</span>
              <span className="absolute inset-0 flex items-center justify-center font-bold text-4xl text-white italic">{initials}</span>
            </div>
            <span className="text-[12px] text-[#8a9bae] font-medium">{doctor.gender || 'Male'}</span>
            <h1 className="text-[18px] font-bold text-[#1a3a4a] text-center uppercase mt-1">DR {doctor.firstName} {doctor.lastName}</h1>
            <span className="text-[12px] text-[#8a9bae] font-semibold uppercase mt-1 tracking-wide">{doctor.specialization}</span>
          </div>

          {/* Right Column - Stats Grid */}
          <div className="flex-1 bg-[#efeff1] rounded-2xl border border-[#e8edf2] p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-8">
              
              <div>
                <div className="flex items-center gap-2 text-[#0b5d94]">
                  <Star size={17} />
                  <span className="font-semibold text-[14px]">Other Specializations</span>
                </div>
                <div className="text-[14px] text-[#6b7b8d] mt-2 ml-7">NA</div>
              </div>

              <div>
                <div className="flex items-center gap-2 text-[#0b5d94]">
                  <GraduationCap size={17} />
                  <span className="font-semibold text-[14px]">Qualifications</span>
                </div>
                {doctor.qualifications?.length > 0 ? (
                  <div className="text-[14px] text-[#6b7b8d] mt-2 ml-7 flex gap-1 flex-wrap">
                    {doctor.qualifications.map((q, i) => <span key={i} className="text-[#0b5d94]">✓ {q}</span>)}
                  </div>
                ) : (
                  <div className="text-[14px] text-[#6b7b8d] mt-2 ml-7">✓ NA</div>
                )}
              </div>

              <div>
                <div className="flex items-center gap-2 text-[#0b5d94]">
                  <Sparkles size={17} />
                  <span className="font-semibold text-[14px]">Experience</span>
                </div>
                <div className="text-[14px] text-[#6b7b8d] mt-2 ml-7 flex items-center gap-1">
                  {doctor.experience > 0 ? <><span className="text-[#0b5d94]">✓</span> {doctor.experience} Years</> : <><span className="text-[#0b5d94]">✓</span> NA</>}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 text-[#0b5d94]">
                  <Building2 size={17} />
                  <span className="font-semibold text-[14px]">Practising Government Hospitals</span>
                </div>
                <div className="text-[14px] text-[#6b7b8d] mt-2 ml-7 flex items-center gap-1">
                  <span className="text-[#0b5d94]">✓</span> NA
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 text-[#0b5d94]">
                  <Users size={17} />
                  <span className="font-semibold text-[14px]">Registration</span>
                </div>
                <div className="text-[14px] text-[#6b7b8d] mt-2 ml-7">{doctor.registrationNumber || 'NA'}</div>
              </div>

              <div>
                <div className="flex items-center gap-2 text-[#0b5d94]">
                  <NotebookPen size={17} />
                  <span className="font-semibold text-[14px]">Special Note</span>
                </div>
                <div className="text-[13px] text-[#8a9bae] mt-2 ml-7 uppercase">{doctor.specialization}</div>
                {doctor.bio && <div className="text-[13px] text-[#6b7b8d] mt-1 ml-7">{doctor.bio}</div>}
              </div>

            </div>
          </div>
        </div>

        {/* Sessions Section */}
        {availability.length > 0 && (
          <div className="bg-[#0b5d94] rounded-t-xl px-6 py-4 flex justify-between items-center text-white">
            <div>
              <div className="font-bold uppercase tracking-wide">{doctor.specialization}</div>
              <div className="text-[13px] text-white/80 mt-0.5">Sessions: {filteredAvailability.length}</div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setSessionFilter('all')} className={`px-3 py-1 rounded-md text-[12px] border ${sessionFilter === 'all' ? 'bg-white text-[#0b5d94] border-white' : 'bg-transparent text-white border-white/50'}`}>All</button>
              <button onClick={() => setSessionFilter('in-person')} className={`px-3 py-1 rounded-md text-[12px] border ${sessionFilter === 'in-person' ? 'bg-white text-[#0b5d94] border-white' : 'bg-transparent text-white border-white/50'}`}>In-Person</button>
              <button onClick={() => setSessionFilter('telemedicine')} className={`px-3 py-1 rounded-md text-[12px] border ${sessionFilter === 'telemedicine' ? 'bg-white text-[#0b5d94] border-white' : 'bg-transparent text-white border-white/50'}`}>Telemedicine</button>
            </div>
          </div>
        )}

        <div className="bg-transparent space-y-8 mt-6">
          {filteredAvailability.length === 0 ? (
            <div className="bg-white p-6 rounded-xl text-center text-[#6b7b8d] border border-[#e8edf2]">No sessions available at the moment.</div>
          ) : (
            filteredAvailability.map((s, index) => {
              const fallbackDate = new Date(getNextDateForDay(s.dayOfWeek));
              const slotDate = s.date ? new Date(s.date) : fallbackDate;
              const effectiveDate = Number.isNaN(slotDate.valueOf()) ? fallbackDate : slotDate;
              const dateLabel = effectiveDate.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' });
              const dateParam = toDateParam(effectiveDate);
              return (
                <div key={s._id || index} className="animate-fade-in">
                  <h3 className="text-[16px] font-semibold text-[#4a5568] mb-3 ml-2">{dateLabel}</h3>
                  <div className="bg-white rounded-xl border border-[#e8edf2] p-5 flex flex-col md:flex-row items-center justify-between gap-6 relative shadow-sm hover:shadow-md transition-shadow">
                    
                    {/* Left Accent Bar */}
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-12 bg-[#4caf50] rounded-r-md"></div>

                    {/* Hospital & Doc Info */}
                    <div className="flex items-center gap-4 flex-1 pl-4">
                      <div className="w-[50px] h-[50px] rounded-xl bg-[#9bbad1] flex items-center justify-center shrink-0">
                        <span className="text-white text-2xl font-bold italic">{initials}</span>
                      </div>
                      <div>
                        <div className="font-bold text-[#1a3a4a] text-[14.5px] leading-snug">{s.hospital || doctor.hospitalAffiliation || 'Private Clinic'}</div>
                        <div className="text-[12.5px] text-[#8a9bae]">{doctor.area || 'Remote'}</div>
                        <div className="font-bold text-[#0b5d94] text-[12px] uppercase mt-1">{doctor.specialization}</div>
                      </div>
                    </div>

                    {/* Time */}
                    <div className="text-center w-24">
                      <div className="font-bold text-[#0b5d94] text-[14px]">{s.startTime}</div>
                      <div className="text-[#8a9bae] text-[12px]">{(s.sessionType || 'in-person') === 'telemedicine' ? 'Video Session' : 'In-Person Session'}</div>
                    </div>

                    {/* Patients */}
                    <div className="text-center w-20">
                      <div className="font-bold text-[#4a5568] text-[15px]">{s.currentPatients || 0}</div>
                      <div className="text-[#8a9bae] text-[12px]">Patients</div>
                    </div>

                    {/* Fee */}
                    <div className="text-left w-48 text-[12px] text-[#4a5568]">
                      <div><span className="font-semibold text-green-600">Rs {(doctor.consultationFee || 0).toLocaleString()}.00</span> + Booking Fee</div>
                      <div className="text-[#8a9bae] mt-0.5">Channelling Fee</div>
                    </div>

                    {/* Action */}
                    <div className="shrink-0">
                      <Link to={`/appointments?doctorId=${doctor._id}&doctorName=Dr. ${doctor.firstName} ${doctor.lastName}&specialization=${doctor.specialization}&fee=${doctor.consultationFee}&hospital=${s.hospital || doctor.hospitalAffiliation || ''}&date=${dateParam}&time=${s.startTime}&sessionType=${s.sessionType || 'in-person'}`}
                        className="px-8 py-2.5 bg-[#0b5d94] hover:bg-[#094d7c] text-white text-[13.5px] font-medium rounded-lg no-underline transition-colors block text-center shadow-sm">
                        Available
                      </Link>
                    </div>

                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>
    </div>
  );
};

export default DoctorProfilePage;
