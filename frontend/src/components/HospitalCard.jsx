import React from 'react';

const HospitalCard = ({ appointment }) => {
  const {
    hospitalName = 'Asiri Surgical Hospital - Kirimandala Mw - Colombo 05',
    location = 'Colombo 5',
    sessionDate = '11 April 2026',
    sessionTime = '01:30 PM',
    appointmentNo = 2,
    estimatedTime = '1:40 PM',
    logoUrl = null,
  } = appointment || {};

  return (
    <div className="relative flex flex-col items-center w-[260px] bg-white rounded-2xl shadow-md overflow-hidden pb-7 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">

      {/* Hospital logo area */}
      <div className="w-full h-[160px] bg-gradient-to-br from-[#e8f2fa] to-[#f0f6fb] flex items-center justify-center p-6">
        {logoUrl ? (
          <img
            src={logoUrl}
            alt={hospitalName}
            className="max-h-full max-w-full object-contain"
          />
        ) : (
          <div className="flex flex-col items-center gap-1">
            {/* Placeholder hospital icon */}
            <svg className="w-14 h-14 text-[#1a6fa0]" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="18" y="8" width="28" height="48" rx="4" stroke="currentColor" strokeWidth="2.5" fill="none" />
              <rect x="26" y="16" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="2" fill="rgba(26,111,160,0.15)" />
              <line x1="32" y1="16" x2="32" y2="28" stroke="currentColor" strokeWidth="2" />
              <line x1="26" y1="22" x2="38" y2="22" stroke="currentColor" strokeWidth="2" />
              <rect x="27" y="40" width="10" height="16" rx="1.5" stroke="currentColor" strokeWidth="2" fill="rgba(26,111,160,0.1)" />
            </svg>
            <span className="text-[#1a6fa0] font-bold text-sm tracking-wide">HOSPITAL</span>
          </div>
        )}
      </div>

      {/* Card content */}
      <div className="flex flex-col px-6 pt-5 pb-6">

        {/* Hospital name */}
        <h3 className="text-[17px] font-bold text-[#1e2a3a] leading-snug">
          {hospitalName}
        </h3>

        {/* Location */}
        <span className="mt-1 text-[13.5px] text-[#6b7b8d]">
          {location}
        </span>

        {/* Divider */}
        <div className="w-full h-px bg-[#e8edf2] my-4" />

        {/* Session date */}
        <span className="text-[13px] font-semibold text-[#3a8fc2] tracking-wide">
          Session date
        </span>
        <span className="mt-0.5 text-[14.5px] font-medium text-[#1e2a3a]">
          {sessionDate}
        </span>

        {/* Session time */}
        <span className="mt-4 text-[13px] font-semibold text-[#3a8fc2] tracking-wide">
          Session time
        </span>
        <span className="mt-0.5 text-[14.5px] font-bold text-[#1e2a3a]">
          {sessionTime}
        </span>

        {/* Appointment no */}
        <span className="mt-4 text-[13px] font-semibold text-[#3a8fc2] tracking-wide">
          Appointment no
        </span>
        <span className="mt-0.5 text-[14.5px] font-bold text-[#1e2a3a]">
          {appointmentNo}
        </span>

        {/* Divider */}
        <div className="w-full h-px bg-[#e8edf2] my-4" />

        {/* Estimated time note */}
        <p className="text-[12.5px] text-[#6b7b8d] leading-relaxed">
          Your estimated appointment time is{' '}
          <span className="font-bold text-[#3a8fc2]">{estimatedTime}</span>.
          This time is depending on the time spend with patients / applicants ahead of you
        </p>
      </div>
    </div>
  );
};

export default HospitalCard;
