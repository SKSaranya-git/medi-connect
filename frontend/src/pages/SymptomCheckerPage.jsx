import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { symptomApi } from '../services/api';
import { BrainCircuit, TriangleAlert } from 'lucide-react';

const SymptomCheckerPage = () => {
  const [symptoms, setSymptoms] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('male');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!symptoms.trim()) return;
    setError('');
    setLoading(true);
    setResult(null);
    try {
      const data = await symptomApi.check({
        symptoms: symptoms.split(',').map(s => s.trim()).filter(Boolean),
        age: Number(age) || undefined,
        gender,
      });
      setResult(data);
    } catch (err) {
      setError(err.message || 'Failed to analyze symptoms');
    } finally {
      setLoading(false);
    }
  };

  const probColors = { high: 'text-red-600 bg-red-50', medium: 'text-amber-600 bg-amber-50', moderate: 'text-amber-600 bg-amber-50', low: 'text-green-600 bg-green-50' };

  return (
    <div className="flex-1 bg-[#f0f4f8]">
      <div className="bg-gradient-to-r from-[#6c3fa0] to-[#9b59b6] text-white py-12 px-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold flex items-center gap-3"><BrainCircuit size={32} /> AI Symptom Checker</h1>
          <p className="mt-2 text-white/80 text-[15px]">Describe your symptoms and get preliminary health suggestions</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-8">
          {/* Input */}
          <div className="bg-white rounded-2xl shadow-md border border-[#e8edf2] p-7">
            <h2 className="text-[17px] font-bold text-[#1e2a3a] mb-5">Enter Your Symptoms</h2>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[12.5px] font-medium text-[#4a5568]">Symptoms (comma separated) *</label>
                <textarea value={symptoms} onChange={e => setSymptoms(e.target.value)} rows={4} required
                  className="px-4 py-3 rounded-xl border border-[#d0d8e0] bg-white text-[14px] text-[#1e2a3a] outline-none focus:border-[#6c3fa0] focus:ring-2 focus:ring-[#6c3fa022] resize-none placeholder:text-[#a0aec0]"
                  placeholder="e.g., headache, fever, body pain" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12.5px] font-medium text-[#4a5568]">Age</label>
                  <input type="number" value={age} onChange={e => setAge(e.target.value)}
                    className="h-11 px-4 rounded-xl border border-[#d0d8e0] bg-white text-[14px] outline-none focus:border-[#6c3fa0]" placeholder="30" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12.5px] font-medium text-[#4a5568]">Gender</label>
                  <select value={gender} onChange={e => setGender(e.target.value)}
                    className="h-11 px-3 rounded-xl border border-[#d0d8e0] bg-white text-[14px] outline-none focus:border-[#6c3fa0]">
                    <option value="male">Male</option><option value="female">Female</option><option value="other">Other</option>
                  </select>
                </div>
              </div>
              <button type="submit" disabled={loading}
                className="h-12 bg-gradient-to-r from-[#6c3fa0] to-[#9b59b6] text-white font-semibold rounded-xl border-none cursor-pointer transition-all duration-300 hover:shadow-lg disabled:opacity-60 text-[15px] mt-1">
                {loading ? 'Analyzing...' : 'Analyze Symptoms'}
              </button>
            </form>
            {error && <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-[13.5px]">{error}</div>}
          </div>

          {/* Results */}
          <div>
            {result ? (
              <div className="space-y-5">
                {/* Suggestions */}
                <div className="bg-white rounded-2xl shadow-md border border-[#e8edf2] p-7">
                  <h2 className="text-[17px] font-bold text-[#1e2a3a] mb-4">Possible Conditions</h2>
                  <div className="flex flex-col gap-3">
                    {result.suggestions?.map((s, i) => (
                      <div key={i} className="p-4 bg-[#f8fbfd] rounded-xl border border-[#e8edf2]">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-[14px] text-[#1e2a3a]">{s.condition}</span>
                          <span className={`text-[12px] font-medium px-2.5 py-0.5 rounded-full ${probColors[s.probability] || 'text-[#6b7b8d] bg-gray-50'}`}>{s.probability}</span>
                        </div>
                        <p className="text-[13px] text-[#6b7b8d] mt-2 leading-relaxed">{s.description}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recommended Specialties */}
                {result.recommendedSpecialties?.length > 0 && (
                  <div className="bg-white rounded-2xl shadow-md border border-[#e8edf2] p-7">
                    <h2 className="text-[17px] font-bold text-[#1e2a3a] mb-4">Recommended Specialists</h2>
                    <div className="flex flex-wrap gap-2">
                      {result.recommendedSpecialties.map((s, i) => (
                        <Link key={i} to={`/doctors?specialization=${encodeURIComponent(s)}`}
                          className="px-4 py-2 bg-[#f0f7fc] text-[#1a6fa0] rounded-full text-[13px] font-medium no-underline hover:bg-[#1a6fa0] hover:text-white transition-all duration-200">
                          {s}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Disclaimer */}
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
                  <p className="text-[13px] text-amber-700 leading-relaxed flex gap-2"><TriangleAlert size={15} className="shrink-0 mt-0.5" /> {result.disclaimer}</p>
                  {result.source && <p className="text-[11px] text-amber-500 mt-2">Source: {result.source}</p>}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-md border border-[#e8edf2] p-12 text-center">
                <div className="flex justify-center mb-4"><BrainCircuit size={56} className="text-[#c8a8e0]" /></div>
                <p className="text-[15px] text-[#6b7b8d]">Enter your symptoms to get AI-powered health suggestions</p>
                <p className="text-[13px] text-[#8a9bae] mt-2">Our AI will analyze your symptoms and recommend specialists</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SymptomCheckerPage;
