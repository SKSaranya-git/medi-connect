import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { doctorApi } from '../services/api';
import { Stethoscope, CalendarDays, BrainCircuit, Video, Pill, CreditCard, Building2 } from 'lucide-react';

import TeleMedicineImg from '../assets/TeleMedicine.png';

const HomePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Doctor search bar state
  const [searchName, setSearchName] = useState('');
  const [searchSpec, setSearchSpec] = useState('');
  const [searchHospital, setSearchHospital] = useState('');
  const [searchDate, setSearchDate] = useState('');
  const [specializations, setSpecializations] = useState([]);
  const [hospitals, setHospitals] = useState([]);

  useEffect(() => {
    doctorApi.getSpecializations().then(d => setSpecializations(Array.isArray(d) ? d : [])).catch(() => {});
    doctorApi.getAll().then(docs => {
      if (Array.isArray(docs)) {
        const h = [...new Set(docs.map(d => d.hospitalAffiliation).filter(Boolean))];
        setHospitals(h);
      }
    }).catch(() => {});
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchName) params.set('name', searchName);
    if (searchSpec) params.set('specialization', searchSpec);
    if (searchHospital) params.set('hospital', searchHospital);
    if (searchDate) params.set('date', searchDate);
    navigate(`/doctors?${params.toString()}`);
  };

  const features = [
    { icon: <Stethoscope size={28} className="text-[#1a6fa0]" />, title: 'Find Doctors', desc: 'Browse specialists by category and book instantly', link: '/doctors' },
    { icon: <CalendarDays size={28} className="text-[#1a6fa0]" />, title: 'Book Appointments', desc: 'Schedule visits with your preferred doctor anytime', link: '/appointments' },
    { icon: <BrainCircuit size={28} className="text-[#1a6fa0]" />, title: 'AI Symptom Checker', desc: 'Get preliminary health suggestions powered by AI', link: '/symptom-checker' },
    { icon: <Video size={28} className="text-[#1a6fa0]" />, title: 'Video Consultations', desc: 'Connect with doctors from the comfort of your home', link: '/doctors' },
    { icon: <Pill size={28} className="text-[#1a6fa0]" />, title: 'Digital Prescriptions', desc: 'Access your prescriptions and medical records online', link: user ? '/patient/dashboard' : '/login' },
    { icon: <CreditCard size={28} className="text-[#1a6fa0]" />, title: 'Secure Payments', desc: 'Pay consultation fees safely through PayHere', link: '/appointments' },
  ];

  const stats = [
    { value: '500+', label: 'Doctors' },
    { value: '50K+', label: 'Patients' },
    { value: '100K+', label: 'Appointments' },
    { value: '98%', label: 'Satisfaction' },
  ];

  return (
    <div className="flex-1">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0f2027] via-[#1a3a4a] to-[#1a6fa0] text-white">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-[#5ab0d9] rounded-full blur-[120px]" />
          <div className="absolute bottom-10 right-20 w-96 h-96 bg-[#3a8fc2] rounded-full blur-[150px]" />
        </div>
        <div className="max-w-7xl mx-auto px-6 py-20 md:py-28 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="max-w-2xl">
              <span className="inline-block px-4 py-1.5 bg-white/10 backdrop-blur-sm rounded-full text-[13px] font-medium tracking-wide text-[#a0d8ef] mb-6 border border-white/10 flex items-center gap-2 w-fit">
                <Building2 size={14} /> Sri Lanka's Smart Healthcare Platform
              </span>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight">
                Your Health,{' '}
                <span className="bg-gradient-to-r from-[#5ab0d9] to-[#a0d8ef] bg-clip-text text-transparent">
                  Connected
                </span>
              </h1>
              <p className="mt-5 text-[17px] text-[#b0c8d8] leading-relaxed max-w-lg">
                Book appointments, consult doctors via video, get AI-powered health suggestions, and manage your complete healthcare journey — all in one place.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  to="/doctors"
                  className="px-7 py-3.5 bg-gradient-to-r from-[#1a6fa0] to-[#3a8fc2] text-white font-semibold rounded-xl no-underline transition-all duration-300 hover:shadow-lg hover:shadow-[#1a6fa055] hover:scale-[1.03] text-[15px]"
                >
                  Find a Doctor
                </Link>
                <Link
                  to="/symptom-checker"
                  className="px-7 py-3.5 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-xl border border-white/20 no-underline transition-all duration-300 hover:bg-white/20 text-[15px]"
                >
                  Check Symptoms
                </Link>
              </div>
            </div>
            <div className="hidden lg:block relative">
              <div className="absolute -inset-4 bg-gradient-to-tr from-[#5ab0d9]/20 to-transparent rounded-full blur-3xl animate-pulse" />
              <img 
                src={TeleMedicineImg} 
                alt="Telemedicine Service" 
                className="relative w-full h-auto drop-shadow-2xl rounded-2xl animate-float transition-all duration-500 hover:scale-[1.02]"
                style={{ filter: 'drop-shadow(0 20px 50px rgba(0,0,0,0.3))' }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Doctor Search Bar */}
      <section className="relative z-20 -mt-9 px-6">
        <form
          onSubmit={handleSearch}
          className="max-w-6xl mx-auto bg-gradient-to-r from-[#0b5d94] to-[#1476b5] rounded-2xl shadow-2xl shadow-[#0b5d9433] px-6 py-6 md:py-5"
        >
          <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr_1fr_auto] gap-4 items-end">
            {/* Doctor Name */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[12.5px] font-semibold text-[#a0d8ef] tracking-wide">Doctor name</label>
              <input
                type="text"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                placeholder="Search Doctor Name"
                className="h-11 px-4 rounded-lg bg-white text-[13.5px] text-[#1e2a3a] border-none outline-none placeholder:text-[#9cb0c0]"
              />
            </div>

            {/* Specialization */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[12.5px] font-semibold text-[#a0d8ef] tracking-wide">Specialization</label>
              <select
                value={searchSpec}
                onChange={(e) => setSearchSpec(e.target.value)}
                className="h-11 px-3 rounded-lg bg-white text-[13.5px] text-[#1e2a3a] border-none outline-none cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%236b7b8d%22%20stroke-width%3D%222.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[right_12px_center]"
              >
                <option value="">Select Specialization</option>
                {specializations.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* Hospital */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[12.5px] font-semibold text-[#a0d8ef] tracking-wide">Hospital</label>
              <select
                value={searchHospital}
                onChange={(e) => setSearchHospital(e.target.value)}
                className="h-11 px-3 rounded-lg bg-white text-[13.5px] text-[#1e2a3a] border-none outline-none cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%236b7b8d%22%20stroke-width%3D%222.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[right_12px_center]"
              >
                <option value="">Select Hospital</option>
                {hospitals.map((h) => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
            </div>

            {/* Date */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[12.5px] font-semibold text-[#a0d8ef] tracking-wide">Date</label>
              <input
                type="date"
                value={searchDate}
                onChange={(e) => setSearchDate(e.target.value)}
                className="h-11 px-4 rounded-lg bg-white text-[13.5px] text-[#1e2a3a] border-none outline-none"
              />
            </div>

            {/* Search Button */}
            <button
              type="submit"
              className="h-11 px-8 bg-[#e0e7ed] hover:bg-white text-[#1e2a3a] font-semibold rounded-lg border-none cursor-pointer transition-all duration-200 text-[14px] shadow-sm hover:shadow-md whitespace-nowrap"
            >
              Search
            </button>
          </div>
        </form>
      </section>

      {/* Stats Bar */}
      <section className="bg-white border-b border-[#e8edf2] shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-3xl font-extrabold text-[#1a6fa0]">{s.value}</div>
              <div className="text-[13px] text-[#6b7b8d] mt-1 font-medium tracking-wide uppercase">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Grid */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-[#1e2a3a]">Everything You Need</h2>
          <p className="text-[#6b7b8d] mt-2 text-[15px]">A complete digital healthcare ecosystem at your fingertips</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => (
            <Link
              to={f.link}
              key={f.title}
              className="group p-7 bg-white rounded-2xl border border-[#e8edf2] no-underline transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-[#1a6fa033]"
            >
              <div className="w-12 h-12 rounded-xl bg-[#f0f7fc] flex items-center justify-center mb-4">{f.icon}</div>
              <h3 className="text-[17px] font-bold text-[#1e2a3a] group-hover:text-[#1a6fa0] transition-colors">{f.title}</h3>
              <p className="mt-2 text-[13.5px] text-[#6b7b8d] leading-relaxed">{f.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-[#1a6fa0] to-[#3a8fc2] py-16">
        <div className="max-w-3xl mx-auto px-6 text-center text-white">
          <h2 className="text-3xl font-bold">Ready to Get Started?</h2>
          <p className="mt-3 text-white/80 text-[15px]">Join thousands of patients and doctors already using MediConnect</p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link to="/register" className="px-8 py-3.5 bg-white text-[#1a6fa0] font-semibold rounded-xl no-underline transition-all duration-300 hover:shadow-lg text-[15px]">
              Sign Up as Patient
            </Link>
            <Link to="/doctor/register" className="px-8 py-3.5 bg-white/10 text-white font-semibold rounded-xl border border-white/30 no-underline transition-all duration-300 hover:bg-white/20 text-[15px]">
              Join as Doctor
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
