import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { doctorApi } from '../services/api';

const DoctorLoginPage = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await doctorApi.login(form);
      const token = res?.token || res?.accessToken || res?.data?.token;
      const doctorData = res?.doctor || res?.user || res?.data?.doctor || res?.data?.user;

      if (!token || !doctorData) {
        throw new Error('Login response is missing doctor details.');
      }

      login({ ...doctorData, role: doctorData.role || 'doctor' }, token);
      navigate('/doctor/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-[#f0f4f8] to-[#e0ecf4] p-6">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-[#e8edf2]">
          <div className="text-center mb-7">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#0d5f3a] to-[#1a9960] flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2v8M8 6h8M3 20h18M5 20V10a2 2 0 012-2h10a2 2 0 012 2v10" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-[#1e2a3a]">Doctor Portal</h1>
            <p className="text-[13.5px] text-[#6b7b8d] mt-1">Sign in to your doctor account</p>
          </div>

          {error && <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-600 text-[13.5px]">{error}</div>}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[12.5px] font-medium text-[#4a5568]">Email</label>
              <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="h-12 px-4 rounded-xl border border-[#d0d8e0] bg-white text-[14px] text-[#1e2a3a] outline-none focus:border-[#0d5f3a] focus:ring-2 focus:ring-[#0d5f3a22] placeholder:text-[#a0aec0]" placeholder="doctor@example.com" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[12.5px] font-medium text-[#4a5568]">Password</label>
              <input type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="h-12 px-4 rounded-xl border border-[#d0d8e0] bg-white text-[14px] text-[#1e2a3a] outline-none focus:border-[#0d5f3a] focus:ring-2 focus:ring-[#0d5f3a22] placeholder:text-[#a0aec0]" placeholder="Enter your password" />
            </div>
            <button type="submit" disabled={loading}
              className="mt-2 h-12 bg-gradient-to-r from-[#0d5f3a] to-[#1a9960] text-white font-semibold rounded-xl border-none cursor-pointer transition-all duration-300 hover:shadow-lg disabled:opacity-60 text-[15px]">
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center text-[13.5px] text-[#6b7b8d]">
            New doctor? <Link to="/doctor/register" className="text-[#0d5f3a] font-semibold no-underline hover:underline">Register Here</Link>
          </div>
          <div className="mt-4 pt-4 border-t border-[#e8edf2] text-center text-[12.5px] text-[#8a9bae] flex items-center justify-center gap-3">
            <Link to="/login" className="text-[#1a6fa0] no-underline hover:underline font-medium">Patient Login</Link>
            <span className="text-[#d0d8e0]">|</span>
            <Link to="/admin/login" className="text-[#1a6fa0] no-underline hover:underline font-medium">Admin Portal</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorLoginPage;
