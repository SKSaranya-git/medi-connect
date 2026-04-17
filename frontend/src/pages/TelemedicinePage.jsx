import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { telemedicineApi } from '../services/api';
import { Video, CircleCheck } from 'lucide-react';

const TelemedicinePage = () => {
  const { sessionId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [joined, setJoined] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await telemedicineApi.getSession(sessionId);
        setSession(data);
      } catch (err) {
        setError(err.message || 'Session not found');
      } finally {
        setLoading(false);
      }
    };
    if (sessionId) load();
    else setLoading(false);
  }, [sessionId]);

  const handleStartSession = async () => {
    try {
      await telemedicineApi.startSession(sessionId);
      setSession(prev => ({ ...prev, status: 'active' }));
    } catch { /* */ }
  };

  const handleEndSession = async () => {
    try {
      await telemedicineApi.endSession(sessionId, '');
      setSession(prev => ({ ...prev, status: 'completed' }));
      setJoined(false);
    } catch { /* */ }
  };

  const joinCall = () => {
    if (session?.jitsiUrl) {
      setJoined(true);
    }
  };

  if (loading) return <div className="flex-1 flex items-center justify-center"><div className="w-8 h-8 border-3 border-[#1a6fa0] border-t-transparent rounded-full animate-spin" /></div>;
  if (error) return <div className="flex-1 flex items-center justify-center"><p className="text-red-500">{error}</p></div>;
  if (!session) return (
    <div className="flex-1 bg-[#f0f4f8] flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-xl p-12 text-center max-w-md border border-[#e8edf2]">
        <div className="flex justify-center mb-4"><Video size={56} className="text-[#1a6fa0]" /></div>
        <h2 className="text-xl font-bold text-[#1e2a3a]">Video Consultation</h2>
        <p className="text-[#6b7b8d] mt-2 text-[14px]">Sessions are created when an appointment is confirmed. Check your appointments for the session link.</p>
      </div>
    </div>
  );

  return (
    <div className="flex-1 bg-[#0f172a] text-white">
      {/* Session Info Bar */}
      <div className="bg-[#1e293b] border-b border-white/5 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h2 className="font-bold text-[16px] flex items-center gap-2"><Video size={16} /> Video Consultation</h2>
            <p className="text-gray-400 text-[13px]">Room: {session.roomName} • Status: {session.status}</p>
          </div>
          <div className="flex gap-3">
            {user?.role === 'doctor' && session.status === 'scheduled' && (
              <button onClick={handleStartSession} className="px-5 py-2 bg-green-600 text-white rounded-lg border-none cursor-pointer text-[13px] font-medium hover:bg-green-500 transition-all">Start Session</button>
            )}
            {session.status === 'active' && !joined && (
              <button onClick={joinCall} className="px-5 py-2 bg-[#1a6fa0] text-white rounded-lg border-none cursor-pointer text-[13px] font-medium hover:bg-[#2580b5] transition-all">Join Call</button>
            )}
            {user?.role === 'doctor' && session.status === 'active' && (
              <button onClick={handleEndSession} className="px-5 py-2 bg-red-600 text-white rounded-lg border-none cursor-pointer text-[13px] font-medium hover:bg-red-500 transition-all">End Session</button>
            )}
          </div>
        </div>
      </div>

      {/* Video Area */}
      <div className="flex-1 flex items-center justify-center p-6" style={{ minHeight: 'calc(100vh - 200px)' }}>
        {joined && session.jitsiUrl ? (
          <iframe
            src={session.jitsiUrl}
            allow="camera; microphone; fullscreen; display-capture"
            className="w-full h-full min-h-[500px] rounded-2xl border border-white/10"
            title="Video Consultation"
          />
        ) : session.status === 'completed' ? (
          <div className="text-center">
            <div className="flex justify-center mb-4"><CircleCheck size={56} className="text-green-400" /></div>
            <h2 className="text-xl font-bold">Consultation Completed</h2>
            <p className="text-gray-400 mt-2">Duration: {session.duration || 0} minutes</p>
            <button onClick={() => navigate(-1)} className="mt-6 px-6 py-2.5 bg-[#1a6fa0] text-white rounded-xl border-none cursor-pointer font-medium">Go Back</button>
          </div>
        ) : (
          <div className="text-center">
            <div className="flex justify-center mb-4"><Video size={56} className="text-[#1a6fa0]" /></div>
            <h2 className="text-xl font-bold">Waiting for Session</h2>
            <p className="text-gray-400 mt-2">
              {session.status === 'scheduled' ? 'The doctor will start the session shortly.' : 'Click "Join Call" to enter the video consultation.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TelemedicinePage;
