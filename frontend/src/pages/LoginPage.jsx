import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { patientApi } from '../services/api';

const LoginPage = () => {
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
      const res = await patientApi.login(form);
      login(res.patient, res.token);
      navigate('/patient/dashboard');
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
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#1a6fa0] to-[#3a8fc2] flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-[#1e2a3a]">Welcome Back</h1>
            <p className="text-[13.5px] text-[#6b7b8d] mt-1">Sign in to your patient account</p>
          </div>

          {error && (
            <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-600 text-[13.5px]">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[12.5px] font-medium text-[#4a5568]">Email</label>
              <input
                type="email" required value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="h-12 px-4 rounded-xl border border-[#d0d8e0] bg-white text-[14px] text-[#1e2a3a] outline-none transition-all duration-200 focus:border-[#1a6fa0] focus:ring-2 focus:ring-[#1a6fa022] placeholder:text-[#a0aec0]"
                placeholder="you@example.com"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[12.5px] font-medium text-[#4a5568]">Password</label>
              <input
                type="password" required value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="h-12 px-4 rounded-xl border border-[#d0d8e0] bg-white text-[14px] text-[#1e2a3a] outline-none transition-all duration-200 focus:border-[#1a6fa0] focus:ring-2 focus:ring-[#1a6fa022] placeholder:text-[#a0aec0]"
                placeholder="Enter your password"
              />
            </div>
            <button
              type="submit" disabled={loading}
              className="mt-2 h-12 bg-gradient-to-r from-[#1a6fa0] to-[#3a8fc2] text-white font-semibold rounded-xl border-none cursor-pointer transition-all duration-300 hover:shadow-lg hover:shadow-[#1a6fa033] disabled:opacity-60 text-[15px]"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center text-[13.5px] text-[#6b7b8d]">
            Don't have an account?{' '}
            <Link to="/register" className="text-[#1a6fa0] font-semibold no-underline hover:underline">Sign Up</Link>
          </div>
          <div className="mt-4 pt-4 border-t border-[#e8edf2] text-center text-[12.5px] text-[#8a9bae] flex items-center justify-center gap-3">
            <Link to="/doctor/login" className="text-[#1a6fa0] no-underline hover:underline font-medium">Doctor Login</Link>
            <span className="text-[#d0d8e0]">|</span>
            <Link to="/admin/login" className="text-[#1a6fa0] no-underline hover:underline font-medium">Admin Portal</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
