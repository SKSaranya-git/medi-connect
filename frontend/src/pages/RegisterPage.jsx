import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { patientApi } from '../services/api';

const RegisterPage = () => {
  const [form, setForm] = useState({
    title: 'Mr', firstName: '', lastName: '', email: '', password: '',
    phone: '', nic: '', area: '', gender: 'Male', dateOfBirth: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (field, value) => setForm({ ...form, [field]: value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await patientApi.register(form);
      login(res.patient, res.token);
      navigate('/patient/dashboard');
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-[#f0f4f8] to-[#e0ecf4] p-6 py-12">
      <div className="w-full max-w-xl">
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-[#e8edf2]">
          <div className="text-center mb-7">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#1a6fa0] to-[#3a8fc2] flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="8.5" cy="7" r="4" /><line x1="20" y1="8" x2="20" y2="14" /><line x1="23" y1="11" x2="17" y2="11" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-[#1e2a3a]">Create Account</h1>
            <p className="text-[13.5px] text-[#6b7b8d] mt-1">Register as a patient</p>
          </div>

          {error && <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-600 text-[13.5px]">{error}</div>}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="grid grid-cols-12 gap-3">
              <div className="flex flex-col gap-1.5 col-span-12 sm:col-span-2">
                <label className="text-[12.5px] font-medium text-[#4a5568]">Title</label>
                <select value={form.title} onChange={(e) => handleChange('title', e.target.value)}
                  className="h-12 px-2 rounded-xl border border-[#d0d8e0] bg-white text-[14px] text-[#1e2a3a] outline-none focus:border-[#1a6fa0]">
                  {['Mr', 'Mrs', 'Ms', 'Dr'].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1.5 col-span-12 sm:col-span-5">
                <label className="text-[12.5px] font-medium text-[#4a5568]">First Name *</label>
                <input type="text" required value={form.firstName} onChange={(e) => handleChange('firstName', e.target.value)}
                  className="h-12 px-4 rounded-xl border border-[#d0d8e0] bg-white text-[14px] text-[#1e2a3a] outline-none focus:border-[#1a6fa0] focus:ring-2 focus:ring-[#1a6fa022] placeholder:text-[#a0aec0]" placeholder="John" />
              </div>
              <div className="flex flex-col gap-1.5 col-span-12 sm:col-span-5">
                <label className="text-[12.5px] font-medium text-[#4a5568]">Last Name *</label>
                <input type="text" required value={form.lastName} onChange={(e) => handleChange('lastName', e.target.value)}
                  className="h-12 px-4 rounded-xl border border-[#d0d8e0] bg-white text-[14px] text-[#1e2a3a] outline-none focus:border-[#1a6fa0] focus:ring-2 focus:ring-[#1a6fa022] placeholder:text-[#a0aec0]" placeholder="Doe" />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[12.5px] font-medium text-[#4a5568]">Email *</label>
              <input type="email" required value={form.email} onChange={(e) => handleChange('email', e.target.value)}
                className="h-12 px-4 rounded-xl border border-[#d0d8e0] bg-white text-[14px] text-[#1e2a3a] outline-none focus:border-[#1a6fa0] focus:ring-2 focus:ring-[#1a6fa022] placeholder:text-[#a0aec0]" placeholder="john@example.com" />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[12.5px] font-medium text-[#4a5568]">Password *</label>
              <input type="password" required minLength={6} value={form.password} onChange={(e) => handleChange('password', e.target.value)}
                className="h-12 px-4 rounded-xl border border-[#d0d8e0] bg-white text-[14px] text-[#1e2a3a] outline-none focus:border-[#1a6fa0] focus:ring-2 focus:ring-[#1a6fa022] placeholder:text-[#a0aec0]" placeholder="Min 6 characters" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-[12.5px] font-medium text-[#4a5568]">Phone *</label>
                <input type="tel" required value={form.phone} onChange={(e) => handleChange('phone', e.target.value)}
                  className="h-12 px-4 rounded-xl border border-[#d0d8e0] bg-white text-[14px] text-[#1e2a3a] outline-none focus:border-[#1a6fa0] focus:ring-2 focus:ring-[#1a6fa022] placeholder:text-[#a0aec0]" placeholder="0771234567" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[12.5px] font-medium text-[#4a5568]">NIC *</label>
                <input type="text" required value={form.nic} onChange={(e) => handleChange('nic', e.target.value)}
                  className="h-12 px-4 rounded-xl border border-[#d0d8e0] bg-white text-[14px] text-[#1e2a3a] outline-none focus:border-[#1a6fa0] focus:ring-2 focus:ring-[#1a6fa022] placeholder:text-[#a0aec0]" placeholder="200012345678" />
              </div>
            </div>

            <div className="grid grid-cols-12 gap-3">
              <div className="flex flex-col gap-1.5 col-span-12 sm:col-span-4">
                <label className="text-[12.5px] font-medium text-[#4a5568]">Gender</label>
                <select value={form.gender} onChange={(e) => handleChange('gender', e.target.value)}
                  className="h-12 px-3 rounded-xl border border-[#d0d8e0] bg-white text-[14px] text-[#1e2a3a] outline-none focus:border-[#1a6fa0]">
                  {['Male', 'Female', 'Other'].map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1.5 col-span-12 sm:col-span-4">
                <label className="text-[12.5px] font-medium text-[#4a5568]">Date of Birth</label>
                <input type="date" value={form.dateOfBirth} onChange={(e) => handleChange('dateOfBirth', e.target.value)}
                  className="h-12 px-3 rounded-xl border border-[#d0d8e0] bg-white text-[14px] text-[#1e2a3a] outline-none focus:border-[#1a6fa0]" />
              </div>
              <div className="flex flex-col gap-1.5 col-span-12 sm:col-span-4">
                <label className="text-[12.5px] font-medium text-[#4a5568]">Area</label>
                <input type="text" value={form.area} onChange={(e) => handleChange('area', e.target.value)}
                  className="h-12 px-4 rounded-xl border border-[#d0d8e0] bg-white text-[14px] text-[#1e2a3a] outline-none focus:border-[#1a6fa0] focus:ring-2 focus:ring-[#1a6fa022] placeholder:text-[#a0aec0]" placeholder="Colombo" />
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="mt-2 h-12 bg-gradient-to-r from-[#1a6fa0] to-[#3a8fc2] text-white font-semibold rounded-xl border-none cursor-pointer transition-all duration-300 hover:shadow-lg disabled:opacity-60 text-[15px]">
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 text-center text-[13.5px] text-[#6b7b8d]">
            Already have an account? <Link to="/login" className="text-[#1a6fa0] font-semibold no-underline hover:underline">Sign In</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
