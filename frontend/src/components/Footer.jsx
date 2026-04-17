import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="w-full bg-[#1e2a3a] text-[#c0cdd8] mt-auto">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">

          {/* Brand column */}
          <div className="flex flex-col gap-4">
            <Link to="/" className="flex items-center gap-2 no-underline">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#1a6fa0] to-[#3a8fc2] flex items-center justify-center">
                <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2v8M8 6h8M3 20h18M5 20V10a2 2 0 012-2h10a2 2 0 012 2v10" />
                </svg>
              </div>
              <span className="text-[18px] font-bold text-white tracking-tight">
                Medi<span className="text-[#5ab0d9]">Connect</span>
              </span>
            </Link>
            <p className="text-[13px] leading-relaxed text-[#8a9bae]">
              Connecting patients with healthcare professionals. Book appointments easily and manage your health journey.
            </p>
          </div>

          {/* Quick Links */}
          <div className="flex flex-col gap-3">
            <h4 className="text-[14px] font-semibold text-white uppercase tracking-wider mb-1">Quick Links</h4>
            {['Home', 'Doctors'].map((item) => (
              <Link
                key={item}
                to={item === 'Home' ? '/' : `/${item.toLowerCase()}`}
                className="text-[13.5px] text-[#8a9bae] no-underline transition-colors duration-200 hover:text-[#5ab0d9]"
              >
                {item}
              </Link>
            ))}
          </div>

          {/* Support */}
          <div className="flex flex-col gap-3">
            <h4 className="text-[14px] font-semibold text-white uppercase tracking-wider mb-1">Support</h4>
            {['Help Center', 'Privacy Policy', 'Terms of Service', 'Contact Us'].map((item) => (
              <a
                key={item}
                href={`/${item.toLowerCase().replace(/\s+/g, '-')}`}
                className="text-[13.5px] text-[#8a9bae] no-underline transition-colors duration-200 hover:text-[#5ab0d9]"
              >
                {item}
              </a>
            ))}
          </div>

          {/* Contact Info */}
          <div className="flex flex-col gap-3">
            <h4 className="text-[14px] font-semibold text-white uppercase tracking-wider mb-1">Contact</h4>
            <div className="flex items-start gap-2">
              <svg className="w-4 h-4 mt-0.5 text-[#5ab0d9] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />
              </svg>
              <span className="text-[13px] text-[#8a9bae]">Colombo, Sri Lanka</span>
            </div>
            <div className="flex items-start gap-2">
              <svg className="w-4 h-4 mt-0.5 text-[#5ab0d9] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="2" /><path d="M22 7l-10 7L2 7" />
              </svg>
              <span className="text-[13px] text-[#8a9bae]">info@mediconnect.lk</span>
            </div>
            <div className="flex items-start gap-2">
              <svg className="w-4 h-4 mt-0.5 text-[#5ab0d9] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
              </svg>
              <span className="text-[13px] text-[#8a9bae]">+94 11 234 5678</span>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 pt-6 border-t border-[#2d3d50] flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-[12.5px] text-[#6b7b8d]">
            © 2026 MediConnect. All rights reserved.
          </span>
          <div className="flex items-center gap-4">
            {/* Social icons */}
            {[
              { label: 'Facebook', path: 'M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z' },
              { label: 'Twitter', path: 'M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z' },
              { label: 'LinkedIn', path: 'M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2zM4 6a2 2 0 100-4 2 2 0 000 4z' },
            ].map(({ label, path }) => (
              <a
                key={label}
                href="#"
                aria-label={label}
                className="w-8 h-8 rounded-full bg-[#2d3d50] flex items-center justify-center transition-colors duration-200 hover:bg-[#1a6fa0]"
              >
                <svg className="w-4 h-4 text-[#8a9bae]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d={path} />
                </svg>
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
