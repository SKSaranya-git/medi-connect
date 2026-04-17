import React, { useState } from 'react';

const AppointmentForm = ({ user = null }) => {
  const [formData, setFormData] = useState({
    title: user?.title || 'Mr',
    name: user?.name || '',
    email: user?.email || '',
    countryCode: '+94',
    number: user?.phone || '',
    area: user?.area || '',
    idType: 'nic',
    idNumber: user?.nic || '',
  });

  const [errors, setErrors] = useState({});
  const isLoggedIn = !!user;

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.number.trim()) newErrors.number = 'Number is required';
    if (!formData.idNumber.trim()) newErrors.idNumber = `${formData.idType === 'nic' ? 'NIC' : 'Passport'} Number is required`;
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      console.log('Form submitted:', formData);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">

      {/* Login as member section
      {!isLoggedIn && (
        <div className="flex items-center justify-between bg-white rounded-xl p-5 mb-6 shadow-sm border border-[#e8edf2]">
          <div>
            <h3 className="text-[15px] font-bold text-[#1e2a3a] m-0">Login as a member</h3>
            <p className="text-[13px] text-[#6b7b8d] mt-1 m-0">
              Become an eChannelling member and enjoy the benefits / Rewards.
            </p>
          </div>
          <button className="px-7 py-2.5 bg-[#3a5bc7] text-white text-[14px] font-semibold rounded-lg border-none cursor-pointer transition-all duration-200 hover:bg-[#2d4ab3] hover:shadow-md shrink-0 ml-4">
            Sign in
          </button>
        </div>
      )} */}

      {/* Continue as guest / form section */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-[#e8edf2]">
        <h3 className="text-[15px] font-bold text-[#1e2a3a] m-0">
          {isLoggedIn ? 'Your Details' : 'Continue as a guest'}
        </h3>
        <p className="text-[13px] text-[#6b7b8d] mt-1 mb-6">
          {isLoggedIn ? 'Your details have been auto-filled from your account.' : 'Channel your doctor conveniently.'}
        </p>

        <form onSubmit={handleSubmit}>
          {/* Row 1: Title, Name, Email */}
          <div className="grid grid-cols-[80px_1fr_1fr] gap-4 mb-5">
            {/* Title */}
            <div className="flex flex-col">
              <label className="text-[12.5px] font-medium text-[#4a5568] mb-1.5">Title</label>
              <select
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                className="h-11 px-3 rounded-lg border border-[#d0d8e0] bg-white text-[14px] text-[#1e2a3a] cursor-pointer outline-none transition-colors duration-200 focus:border-[#3a8fc2] focus:ring-2 focus:ring-[#3a8fc222]"
              >
                <option value="Mr">Mr</option>
                <option value="Mrs">Mrs</option>
                <option value="Ms">Ms</option>
                <option value="Dr">Dr</option>
              </select>
            </div>

            {/* Name */}
            <div className="flex flex-col">
              <label className="text-[12.5px] font-medium text-[#4a5568] mb-1.5">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Enter patient name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className="h-11 px-3 rounded-lg border border-[#d0d8e0] bg-white text-[14px] text-[#1e2a3a] outline-none transition-colors duration-200 focus:border-[#3a8fc2] focus:ring-2 focus:ring-[#3a8fc222] placeholder:text-[#a0aec0]"
              />
              {errors.name && <span className="text-[12px] text-red-500 mt-1">{errors.name}</span>}
            </div>

            {/* Email */}
            <div className="flex flex-col">
              <label className="text-[12.5px] font-medium text-[#4a5568] mb-1.5">Email</label>
              <input
                type="email"
                placeholder="Receipt will send to this email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                className="h-11 px-3 rounded-lg border border-[#d0d8e0] bg-white text-[14px] text-[#1e2a3a] outline-none transition-colors duration-200 focus:border-[#3a8fc2] focus:ring-2 focus:ring-[#3a8fc222] placeholder:text-[#a0aec0]"
              />
            </div>
          </div>

          {/* Row 2: Number, Area */}
          <div className="grid grid-cols-[1fr_1fr] gap-4 mb-5">
            {/* Number */}
            <div className="flex flex-col">
              <label className="text-[12.5px] font-medium text-[#4a5568] mb-1.5">
                Number <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <select
                  value={formData.countryCode}
                  onChange={(e) => handleChange('countryCode', e.target.value)}
                  className="h-11 px-2 rounded-lg border border-[#d0d8e0] bg-white text-[14px] text-[#1e2a3a] cursor-pointer outline-none transition-colors duration-200 focus:border-[#3a8fc2] focus:ring-2 focus:ring-[#3a8fc222] w-[75px]"
                >
                  <option value="+94">+94</option>
                  <option value="+91">+91</option>
                  <option value="+1">+1</option>
                  <option value="+44">+44</option>
                </select>
                <input
                  type="tel"
                  placeholder="7XXXXXXXX"
                  value={formData.number}
                  onChange={(e) => handleChange('number', e.target.value)}
                  className="flex-1 h-11 px-3 rounded-lg border border-[#d0d8e0] bg-white text-[14px] text-[#1e2a3a] outline-none transition-colors duration-200 focus:border-[#3a8fc2] focus:ring-2 focus:ring-[#3a8fc222] placeholder:text-[#a0aec0]"
                />
              </div>
              {errors.number && <span className="text-[12px] text-red-500 mt-1">{errors.number}</span>}
            </div>

            {/* Area */}
            <div className="flex flex-col">
              <label className="text-[12.5px] font-medium text-[#4a5568] mb-1.5">Area</label>
              <input
                type="text"
                placeholder="Please enter your closest city"
                value={formData.area}
                onChange={(e) => handleChange('area', e.target.value)}
                className="h-11 px-3 rounded-lg border border-[#d0d8e0] bg-white text-[14px] text-[#1e2a3a] outline-none transition-colors duration-200 focus:border-[#3a8fc2] focus:ring-2 focus:ring-[#3a8fc222] placeholder:text-[#a0aec0]"
              />
            </div>
          </div>

          {/* ID Type selector */}
          <div className="flex items-center gap-6 mb-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="idType"
                value="nic"
                checked={formData.idType === 'nic'}
                onChange={() => handleChange('idType', 'nic')}
                className="w-4 h-4 accent-[#3a5bc7]"
              />
              <span className="text-[14px] text-[#1e2a3a] font-medium">NIC</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="idType"
                value="passport"
                checked={formData.idType === 'passport'}
                onChange={() => handleChange('idType', 'passport')}
                className="w-4 h-4 accent-[#3a5bc7]"
              />
              <span className="text-[14px] text-[#1e2a3a] font-medium">Passport</span>
            </label>
          </div>

          {/* ID Number */}
          <div className="flex flex-col max-w-sm">
            <label className="text-[12.5px] font-medium text-[#4a5568] mb-1.5">
              {formData.idType === 'nic' ? 'NIC' : 'Passport'} Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder={`Enter ${formData.idType === 'nic' ? 'NIC' : 'Passport'} number`}
              value={formData.idNumber}
              onChange={(e) => handleChange('idNumber', e.target.value)}
              className="h-11 px-3 rounded-lg border border-[#d0d8e0] bg-white text-[14px] text-[#1e2a3a] outline-none transition-colors duration-200 focus:border-[#3a8fc2] focus:ring-2 focus:ring-[#3a8fc222] placeholder:text-[#a0aec0]"
            />
            {errors.idNumber && <span className="text-[12px] text-red-500 mt-1">{errors.idNumber}</span>}
          </div>
        </form>
      </div>
    </div>
  );
};

export default AppointmentForm;
