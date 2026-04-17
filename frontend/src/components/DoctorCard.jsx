import React from 'react';

const DoctorCard = ({ doctor }) => {
  const {
    name = 'Dr Jayani Tennakoon Jayaweera',
    gender = 'Female',
    specialty = 'Consultant Clinical Nutrition Physician',
    imageUrl = null,
  } = doctor || {};

  const getInitials = (name) => {
    const parts = name.replace(/^Dr\.?\s*/i, '').trim().split(/\s+/);
    return parts.length > 0 ? parts[0][0].toUpperCase() : '?';
  };

  return (
    <div className="relative flex flex-col items-center w-[260px] bg-white rounded-2xl shadow-md overflow-hidden pb-7 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
      {/* Top gradient strip */}
      <div className="w-full h-20 bg-gradient-to-br from-[#d6e9f5] to-[#e8f2fa] shrink-0" />

      {/* Avatar */}
      <div className="-mt-11 w-[90px] h-[90px] rounded-full bg-white flex items-center justify-center shadow-md z-10">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={name}
            className="w-[82px] h-[82px] rounded-full object-cover"
          />
        ) : (
          <div className="w-[82px] h-[82px] rounded-full bg-gradient-to-br from-[#c4dced] to-[#a8c8de] flex items-center justify-center">
            <span className="font-serif text-4xl italic text-white drop-shadow-sm select-none">
              {getInitials(name)}
            </span>
          </div>
        )}
      </div>

      {/* Gender label */}
      <span className="mt-3 text-[13px] text-[#5a9ec4] tracking-wide">
        {gender}
      </span>

      {/* Doctor name */}
      <h3 className="mt-2 mx-5 text-[15px] font-bold text-[#1e3a5f] text-center uppercase leading-tight tracking-wide">
        {name}
      </h3>

      {/* Specialty */}
      <p className="mt-2 mx-5 text-[11.5px] text-[#8a9bae] text-center uppercase leading-snug tracking-wide">
        {specialty}
      </p>

      {/* View Profile button */}
      <button
        className="mt-5 px-9 py-2.5 border-[1.5px] border-[#3a7cbf] rounded-3xl bg-transparent text-[#1e3a5f] text-sm font-semibold cursor-pointer tracking-wide transition-all duration-250 hover:bg-[#3a7cbf] hover:text-white hover:shadow-lg active:scale-[0.97]"
        id={`view-profile-${name.replace(/\s+/g, '-').toLowerCase()}`}
      >
        View Profile
      </button>
    </div>
  );
};

export default DoctorCard;