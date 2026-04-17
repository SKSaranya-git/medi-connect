import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { adminApi } from '../services/api';

const AdminLoginPage = () => {
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
      const res = await adminApi.login(form);
      const token = res?.token || res?.accessToken || res?.data?.token;
      const adminData = res?.admin || res?.user || res?.data?.admin || res?.data?.user;

      if (!token || !adminData) {
        throw new Error('Login response is missing admin details.');
      }

      const normalizedRole = adminData.role || 'admin';
      login({ ...adminData, role: normalizedRole }, token);
      navigate('/admin/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-[#1a1a2e] to-[#16213e] p-6">
      <div className="w-full max-w-md">
        <div className="bg-[#1f2937]/90 backdrop-blur rounded-2xl shadow-2xl p-8 border border-white/10">
          <div className="text-center mb-7">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#f59e0b] to-[#d97706] flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            </div>
            <h1 className="text-2xl font-bold text-white">Admin Portal</h1>
            <p className="text-[13.5px] text-gray-400 mt-1">Platform management access</p>
          </div>
          {error && <div className="mb-5 p-3.5 bg-red-900/30 border border-red-500/30 rounded-xl text-red-400 text-[13.5px]">{error}</div>}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[12.5px] font-medium text-gray-400">Email</label>
              <input type="email" required value={form.email} onChange={e => setForm({...form, email: e.target.value})}
                className="h-12 px-4 rounded-xl border border-white/10 bg-white/5 text-[14px] text-white outline-none focus:border-[#f59e0b] placeholder:text-gray-500" placeholder="admin@mediconnect.lk" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[12.5px] font-medium text-gray-400">Password</label>
              <input type="password" required value={form.password} onChange={e => setForm({...form, password: e.target.value})}
                className="h-12 px-4 rounded-xl border border-white/10 bg-white/5 text-[14px] text-white outline-none focus:border-[#f59e0b] placeholder:text-gray-500" placeholder="Enter your password" />
            </div>
            <button type="submit" disabled={loading}
              className="mt-2 h-12 bg-gradient-to-r from-[#f59e0b] to-[#d97706] text-white font-semibold rounded-xl border-none cursor-pointer transition-all hover:shadow-lg disabled:opacity-60 text-[15px]">
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
          <div className="mt-4 text-center text-[13.5px] text-gray-400">
            No admin account?{' '}
            <Link to="/admin/register" className="text-[#f59e0b] font-semibold no-underline hover:underline">
              Create one
            </Link>
          </div>
          <div className="mt-6 pt-4 border-t border-white/5 text-center text-[12.5px] text-gray-500 flex items-center justify-center gap-3">
            <Link to="/login" className="text-[#f59e0b] no-underline hover:underline font-medium">Patient Login</Link>
            <span className="text-white/10">|</span>
            <Link to="/doctor/login" className="text-[#f59e0b] no-underline hover:underline font-medium">Doctor Portal</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginPage;
