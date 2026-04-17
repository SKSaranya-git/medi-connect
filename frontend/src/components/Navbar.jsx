import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';
import { Stethoscope, ShieldCheck, User } from 'lucide-react';

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, logout, isPatient, isDoctor, isAdmin } = useAuth();

  const navItems = [
    { label: 'Home', to: '/' },
    { label: 'Doctors', to: '/doctors' },
    { label: 'Symptom Checker', to: '/symptom-checker' },
  ];

  const getDashboardLink = () => {
    if (isAdmin) return '/admin/dashboard';
    if (isDoctor) return '/doctor/dashboard';
    return '/patient/dashboard';
  };

  return (
    <nav className="w-full bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-16">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 no-underline">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#1a6fa0] to-[#3a8fc2] flex items-center justify-center">
            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v8M8 6h8M3 20h18M5 20V10a2 2 0 012-2h10a2 2 0 012 2v10" />
            </svg>
          </div>
          <span className="text-[18px] font-bold text-[#1e2a3a] tracking-tight">
            Medi<span className="text-[#1a6fa0]">Connect</span>
          </span>
        </Link>

        {/* Desktop nav links */}
        <ul className="hidden md:flex items-center gap-1 list-none m-0 p-0">
          {navItems.map((item) => (
            <li key={item.label}>
              <Link
                to={item.to}
                className="px-4 py-2 text-[14px] font-medium text-[#4a5568] rounded-lg no-underline transition-colors duration-200 hover:text-[#1a6fa0] hover:bg-[#f0f7fc]"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>

        {/* Right side actions */}
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                <NotificationBell />
                <Link
                  to={getDashboardLink()}
                  className="px-4 py-2 text-[13.5px] font-medium text-[#1a6fa0] rounded-lg no-underline hover:bg-[#f0f7fc] transition-all flex items-center gap-1.5"
                >
                  {isDoctor ? <Stethoscope size={15} /> : isAdmin ? <ShieldCheck size={15} /> : <User size={15} />} Dashboard
                </Link>
                <button
                  onClick={logout}
                  className="px-5 py-2 text-[13.5px] font-semibold text-[#4a5568] border border-[#d0d8e0] rounded-full bg-transparent cursor-pointer transition-all duration-200 hover:bg-[#f0f4f8]"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="px-5 py-2 text-[13.5px] font-semibold text-[#1a6fa0] border border-[#1a6fa0] rounded-full no-underline transition-all duration-200 hover:bg-[#1a6fa0] hover:text-white">
                  Log In
                </Link>
                <Link to="/register" className="px-5 py-2 text-[13.5px] font-semibold text-white bg-gradient-to-r from-[#1a6fa0] to-[#3a8fc2] border-none rounded-full no-underline transition-all duration-200 hover:shadow-lg hover:shadow-[#1a6fa033]">
                  Sign Up
                </Link>
              </>
            )}
          </div>

          <div className="md:hidden flex items-center gap-2">
            {user && <NotificationBell compact />}
            <button
              className="flex flex-col gap-[5px] bg-transparent border-none cursor-pointer p-2"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle menu"
            >
              <span className={`block w-5 h-[2px] bg-[#1e2a3a] rounded transition-all duration-300 ${menuOpen ? 'rotate-45 translate-y-[7px]' : ''}`} />
              <span className={`block w-5 h-[2px] bg-[#1e2a3a] rounded transition-all duration-300 ${menuOpen ? 'opacity-0' : ''}`} />
              <span className={`block w-5 h-[2px] bg-[#1e2a3a] rounded transition-all duration-300 ${menuOpen ? '-rotate-45 -translate-y-[7px]' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={`md:hidden overflow-hidden transition-all duration-300 ${menuOpen ? 'max-h-96' : 'max-h-0'}`}>
        <div className="flex flex-col px-6 pb-4 gap-1">
          {navItems.map((item) => (
            <Link
              key={item.label}
              to={item.to}
              className="py-2.5 px-3 text-[14px] font-medium text-[#4a5568] rounded-lg no-underline transition-colors duration-200 hover:text-[#1a6fa0] hover:bg-[#f0f7fc]"
              onClick={() => setMenuOpen(false)}
            >
              {item.label}
            </Link>
          ))}
          <div className="flex gap-3 mt-2">
            {user ? (
              <>
                <Link to={getDashboardLink()} onClick={() => setMenuOpen(false)}
                  className="flex-1 py-2 text-center text-[13.5px] font-semibold text-[#1a6fa0] border border-[#1a6fa0] rounded-full no-underline">
                  Dashboard
                </Link>
                <button onClick={() => { logout(); setMenuOpen(false); }}
                  className="flex-1 py-2 text-[13.5px] font-semibold text-[#4a5568] border border-[#d0d8e0] rounded-full bg-transparent cursor-pointer">
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setMenuOpen(false)}
                  className="flex-1 py-2 text-center text-[13.5px] font-semibold text-[#1a6fa0] border border-[#1a6fa0] rounded-full no-underline">
                  Log In
                </Link>
                <Link to="/register" onClick={() => setMenuOpen(false)}
                  className="flex-1 py-2 text-center text-[13.5px] font-semibold text-white bg-gradient-to-r from-[#1a6fa0] to-[#3a8fc2] border-none rounded-full no-underline">
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
