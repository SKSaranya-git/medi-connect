import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { adminApi } from '../services/api';

const AdminRegisterPage = () => {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    inviteCode: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        password: form.password,
        inviteCode: form.inviteCode,
      };

      const res = await adminApi.register(payload);
      login(res.admin, res.token);
      navigate('/admin/dashboard');
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const inputCls = 'h-12 px-4 rounded-xl border border-white/10 bg-white/5 text-[14px] text-white outline-none focus:border-[#f59e0b] placeholder:text-gray-500';

  return (
    <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-[#1a1a2e] to-[#16213e] p-6 py-12">
      <div className="w-full max-w-md">
        <div className="bg-[#1f2937]/90 backdrop-blur rounded-2xl shadow-2xl p-8 border border-white/10">
          <div className="text-center mb-7">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#f59e0b] to-[#d97706] flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="8.5" cy="7" r="4" />
                <line x1="20" y1="8" x2="20" y2="14" />
                <line x1="23" y1="11" x2="17" y2="11" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white">Admin Signup</h1>
            <p className="text-[13.5px] text-gray-400 mt-1">Create an administrator account</p>
          </div>

          {error && (
            <div className="mb-5 p-3.5 bg-red-900/30 border border-red-500/30 rounded-xl text-red-400 text-[13.5px]">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-[12.5px] font-medium text-gray-400">First Name *</label>
                <input
                  type="text"
                  required
                  value={form.firstName}
                  onChange={(e) => handleChange('firstName', e.target.value)}
                  className={inputCls}
                  placeholder="Jane"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[12.5px] font-medium text-gray-400">Last Name *</label>
                <input
                  type="text"
                  required
                  value={form.lastName}
                  onChange={(e) => handleChange('lastName', e.target.value)}
                  className={inputCls}
                  placeholder="Doe"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[12.5px] font-medium text-gray-400">Email *</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => handleChange('email', e.target.value)}
                className={inputCls}
                placeholder="admin@mediconnect.lk"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-[12.5px] font-medium text-gray-400">Password *</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={form.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  className={inputCls}
                  placeholder="Min 6 characters"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[12.5px] font-medium text-gray-400">Confirm Password *</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={form.confirmPassword}
                  onChange={(e) => handleChange('confirmPassword', e.target.value)}
                  className={inputCls}
                  placeholder="Repeat password"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[12.5px] font-medium text-gray-400">Admin Invite Code *</label>
              <input
                type="password"
                required
                value={form.inviteCode}
                onChange={(e) => handleChange('inviteCode', e.target.value)}
                className={inputCls}
                placeholder="Enter the invite code"
              />
              <p className="text-[11.5px] text-gray-500">Contact the system owner to obtain the invite code.</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 h-12 bg-gradient-to-r from-[#f59e0b] to-[#d97706] text-white font-semibold rounded-xl border-none cursor-pointer transition-all hover:shadow-lg disabled:opacity-60 text-[15px]"
            >
              {loading ? 'Creating Account...' : 'Create Admin Account'}
            </button>
          </form>

          <div className="mt-6 text-center text-[13.5px] text-gray-400">
            Already have an account?{' '}
            <Link to="/admin/login" className="text-[#f59e0b] font-semibold no-underline hover:underline">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminRegisterPage;
