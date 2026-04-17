import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { doctorApi } from '../services/api';

const DoctorsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [searchName, setSearchName] = useState(searchParams.get('name') || '');
  const [searchSpec, setSearchSpec] = useState(searchParams.get('specialization') || '');
  const [searchHospital, setSearchHospital] = useState(searchParams.get('hospital') || '');
  const [searchDate, setSearchDate] = useState(searchParams.get('date') || '');
  const [searchServiceType, setSearchServiceType] = useState(searchParams.get('serviceType') || '');

  const [doctors, setDoctors] = useState([]);
  const [specializations, setSpecializations] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const docsQuery = new URLSearchParams();
      if (searchServiceType) docsQuery.set('serviceType', searchServiceType);
      const docs = await doctorApi.getAll(docsQuery.toString());
      setDoctors(Array.isArray(docs) ? docs : []);
      
      const specs = await doctorApi.getSpecializations();
      setSpecializations(Array.isArray(specs) ? specs : []);

      if (Array.isArray(docs)) {
        const h = [...new Set(docs.map(d => d.hospitalAffiliation).filter(Boolean))];
        setHospitals(h);
      }
    } catch { 
      setDoctors([]); 
    } finally { 
      setLoading(false); 
    }
  };

  const handleSearch = (e) => {
    if(e) e.preventDefault();
    const params = new URLSearchParams();
    if (searchName) params.set('name', searchName);
    if (searchSpec) params.set('specialization', searchSpec);
    if (searchHospital) params.set('hospital', searchHospital);
    if (searchDate) params.set('date', searchDate);
    if (searchServiceType) params.set('serviceType', searchServiceType);
    setSearchParams(params);
  };

  // Sync state if URL changes
  useEffect(() => {
    setSearchName(searchParams.get('name') || '');
    setSearchSpec(searchParams.get('specialization') || '');
    setSearchHospital(searchParams.get('hospital') || '');
    setSearchDate(searchParams.get('date') || '');
    setSearchServiceType(searchParams.get('serviceType') || '');
  }, [searchParams]);

  useEffect(() => {
    loadData();
  }, [searchServiceType]);

  const filtered = doctors.filter(d => {
    const name = `${d.firstName} ${d.lastName}`.toLowerCase();
    const matchName = !searchName || name.includes(searchName.toLowerCase());
    const matchSpec = !searchSpec || d.specialization === searchSpec;
    const matchHosp = !searchHospital || d.hospitalAffiliation === searchHospital;
    const matchService = !searchServiceType ||
      (searchServiceType === 'telemedicine' && ['telemedicine', 'both'].includes(d.serviceType || 'both')) ||
      (searchServiceType === 'in-person' && ['in-person', 'both'].includes(d.serviceType || 'both'));
    // Date filtering isn't implemented in backend availability yet, but we'll mock it for UI
    return matchName && matchSpec && matchHosp && matchService;
  });

  const getInitials = (d) => (d.firstName?.[0] || '?').toUpperCase();

  return (
    <div className="flex-1 bg-[#f4f7f9] min-h-screen pb-12">
      <div className="max-w-7xl mx-auto px-6 pt-8">
        
        {/* eChannelling Style Top Header Text */}
        {searchSpec && (
          <div className="mb-4">
            <Link to="/" className="text-[#6b7b8d] text-[13px] no-underline hover:underline flex items-center gap-1">
              <span className="text-lg">‹</span> Search results for
            </Link>
            <h1 className="text-2xl font-semibold text-[#1a6fa0] mt-1">{searchSpec}</h1>
          </div>
        )}
        {!searchSpec && (
          <div className="mb-4">
            <h1 className="text-2xl font-semibold text-[#1a6fa0]">Find top specialists</h1>
            <p className="text-[#6b7b8d] text-[13.5px] mt-1">Book your medical consultation with MediConnect.</p>
          </div>
        )}

        {/* eChannelling Search Bar */}
        <form onSubmit={handleSearch} className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr_1fr_1fr_auto] gap-3 items-end">
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] text-[#6b7b8d] pl-1">Doctor name</label>
              <input type="text" value={searchName} onChange={e => setSearchName(e.target.value)} placeholder="Search Doctor Name"
                className="h-11 px-4 rounded-lg bg-white border border-[#c5d2dc] text-[13.5px] text-[#1e2a3a] outline-none focus:border-[#4caf50]" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] text-[#6b7b8d] pl-1">Specialization</label>
              <select value={searchSpec} onChange={e => setSearchSpec(e.target.value)}
                className="h-11 px-3 rounded-lg bg-white border border-[#c5d2dc] text-[13.5px] text-[#1e2a3a] outline-none focus:border-[#4caf50] cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%236b7b8d%22%20stroke-width%3D%222.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[right_12px_center]">
                <option value="">Select Specialization</option>
                {specializations.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] text-[#6b7b8d] pl-1">Hospital</label>
              <select value={searchHospital} onChange={e => setSearchHospital(e.target.value)}
                className="h-11 px-3 rounded-lg bg-white border border-[#c5d2dc] text-[13.5px] text-[#1e2a3a] outline-none focus:border-[#4caf50] cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%236b7b8d%22%20stroke-width%3D%222.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[right_12px_center]">
                <option value="">Select Hospital</option>
                {hospitals.map((h) => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] text-[#6b7b8d] pl-1">Date</label>
              <input type="date" value={searchDate} onChange={e => setSearchDate(e.target.value)}
                className="h-11 px-4 rounded-lg bg-white border border-[#c5d2dc] text-[13.5px] text-[#1e2a3a] outline-none focus:border-[#4caf50]" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] text-[#6b7b8d] pl-1">Consultation Mode</label>
              <select value={searchServiceType} onChange={e => setSearchServiceType(e.target.value)}
                className="h-11 px-3 rounded-lg bg-white border border-[#c5d2dc] text-[13.5px] text-[#1e2a3a] outline-none focus:border-[#4caf50] cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%236b7b8d%22%20stroke-width%3D%222.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[right_12px_center]">
                <option value="">All Modes</option>
                <option value="in-person">In-Person</option>
                <option value="telemedicine">Telemedicine</option>
              </select>
            </div>
            <button type="submit" className="h-11 px-8 bg-[#4caf50] hover:bg-[#43a047] text-white font-medium rounded-lg border-none cursor-pointer transition-colors text-[14px]">
              Search
            </button>
          </div>
        </form>

        <div className="text-right text-[13px] text-[#6b7b8d] mb-4">{filtered.length} Results Found</div>

        {/* Results Grid - eChannelling style cards */}
        {loading ? (
          <div className="text-center py-16"><div className="w-8 h-8 border-3 border-[#1a6fa0] border-t-transparent rounded-full animate-spin mx-auto" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-[#e8edf2] shadow-sm">
            <p className="text-[#6b7b8d] text-[15px]">No doctors found matching your criteria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filtered.map(d => (
              <div key={d._id} className="bg-[#fafbfc] rounded-xl border border-[#e8edf2] overflow-hidden flex flex-col items-center hover:shadow-lg transition-shadow duration-300">
                <div className="pt-8 pb-3 flex flex-col items-center w-full">
                  <div className="w-[84px] h-[84px] rounded-full bg-[#9bbad1] flex items-center justify-center shadow-inner relative overflow-hidden">
                    <span className="text-[#eff4f8] text-[60px] font-sans -mt-4 opacity-50 block text-center">@</span>
                    <span className="absolute inset-0 flex items-center justify-center font-bold text-3xl text-white italic">{getInitials(d)}</span>
                  </div>
                  
                  <span className="text-[11px] text-[#8a9bae] mt-2 mb-1">{d.gender || 'Male'}</span>
                  
                  <h3 className="text-[14px] font-bold text-[#1a3a4a] text-center uppercase px-3 leading-snug">
                    DR {d.firstName} {d.lastName}
                  </h3>
                  
                  <span className="text-[10px] text-[#8a9bae] font-semibold uppercase mt-1 tracking-wide">{d.specialization}</span>
                </div>
                
                <div className="w-full mt-auto p-4 pt-1">
                  <Link to={`/doctors/${d._id}`} className="block w-full py-2.5 bg-[#0b5d94] hover:bg-[#094d7c] text-white text-center rounded-lg text-[13px] font-medium no-underline transition-colors">
                    Book Now
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorsPage;

