import React, { useEffect, useMemo, useRef, useState } from 'react';
import { notificationApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

const ROLE_CHANNELS = {
  patient: ['appointment_booked', 'appointment_cancelled', 'appointment_confirmed', 'payment_confirmed', 'consultation_completed', 'general'],
  doctor: ['appointment_confirmed', 'appointment_cancelled', 'consultation_completed', 'general'],
  admin: ['appointment_booked', 'appointment_cancelled', 'appointment_confirmed', 'consultation_completed', 'payment_confirmed', 'doctor_verified', 'general'],
};

const stripHtml = (value = '') => value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

const formatChannelLabel = (channel = 'general') => {
  const labels = {
    appointment_booked: 'Appointment booked',
    appointment_cancelled: 'Appointment cancelled',
    appointment_confirmed: 'Appointment confirmed',
    consultation_completed: 'Consultation completed',
    payment_confirmed: 'Payment confirmed',
    doctor_verified: 'Doctor verified',
    general: 'Notification',
  };

  return labels[channel] || channel.replace(/_/g, ' ');
};

const formatTime = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return '';
  return date.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

const NotificationBell = ({ compact = false }) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [readIds, setReadIds] = useState(new Set());
  const wrapperRef = useRef(null);

  const readKey = user ? `mediconnect_notifications_read_${user._id || user.role}` : '';

  const loadNotifications = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await notificationApi.getAll();
      setNotifications(Array.isArray(data) ? data : []);
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setReadIds(new Set());
      setOpen(false);
      return;
    }

    try {
      const saved = JSON.parse(localStorage.getItem(readKey) || '[]');
      setReadIds(new Set(Array.isArray(saved) ? saved : []));
    } catch {
      setReadIds(new Set());
    }

    loadNotifications();
  }, [user, readKey]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredNotifications = useMemo(() => {
    if (!user) return [];

    const role = user.role || '';
    const isAdminUser = role === 'admin' || role === 'superadmin';

    if (isAdminUser) {
      return notifications;
    }

    const roleChannels = ROLE_CHANNELS[role] || [];

    return notifications.filter((notification) => {
      const recipientMatches = notification.recipientType === role && String(notification.recipientId || '') === String(user._id || '');
      const channelMatches = roleChannels.includes(notification.channel);

      return recipientMatches && (channelMatches || notification.recipientType === role);
    });
  }, [notifications, user]);

  const isNotificationRead = (notification) => {
    const id = String(notification?._id || '');
    if (!id) return false;
    return readIds.has(id);
  };

  const unreadCount = filteredNotifications.filter((notification) => !isNotificationRead(notification)).length;

  const markAsRead = (notificationId) => {
    if (!readKey || !notificationId) return;
    setReadIds((prev) => {
      const next = new Set(prev);
      next.add(String(notificationId));
      localStorage.setItem(readKey, JSON.stringify([...next]));
      return next;
    });
  };

  const toggleOpen = () => {
    if (!open) loadNotifications();
    setOpen((current) => !current);
  };

  if (!user) return null;

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={toggleOpen}
        aria-label="Open notifications"
        className={`relative flex items-center justify-center rounded-full border border-[#d0d8e0] bg-white text-[#1a6fa0] transition-all hover:bg-[#f0f7fc] ${compact ? 'w-10 h-10' : 'w-11 h-11'}`}
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 0 0-5-5.91V4a1 1 0 1 0-2 0v1.09A6 6 0 0 0 6 11v3.2a2 2 0 0 1-.6 1.4L4 17h5" />
          <path d="M9 17a3 3 0 0 0 6 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-[#ef4444] text-white text-[10px] font-bold flex items-center justify-center shadow-sm">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-3 w-[22rem] max-w-[calc(100vw-2rem)] rounded-2xl border border-[#e8edf2] bg-white shadow-xl overflow-hidden z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#eef2f7] bg-[#f8fbfd]">
            <div>
              <h3 className="text-[14px] font-bold text-[#1e2a3a]">Notifications</h3>
              <p className="text-[12px] text-[#6b7b8d]">{user.role} account</p>
            </div>
            <span className="text-[11px] font-semibold text-[#1a6fa0] bg-[#f0f7fc] px-2.5 py-1 rounded-full">
              {filteredNotifications.length} total
            </span>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-6 text-center text-[13px] text-[#6b7b8d]">Loading notifications...</div>
            ) : filteredNotifications.length === 0 ? (
              <div className="p-6 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#f0f7fc] text-[#1a6fa0]">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 0 0-5-5.91V4a1 1 0 1 0-2 0v1.09A6 6 0 0 0 6 11v3.2a2 2 0 0 1-.6 1.4L4 17h5" />
                    <path d="M9 17a3 3 0 0 0 6 0" />
                  </svg>
                </div>
                <p className="text-[13px] font-medium text-[#1e2a3a]">No notifications for your role yet.</p>
                <p className="text-[12px] text-[#6b7b8d] mt-1">You will see updates here when they are sent to {user.role} accounts.</p>
              </div>
            ) : (
              filteredNotifications.map((notification) => {
                const preview = stripHtml(notification.message || notification.subject || '').slice(0, 120);
                const createdLabel = formatTime(notification.createdAt);
                const isRead = isNotificationRead(notification);

                return (
                  <div key={notification._id} className={`px-4 py-3 border-b border-[#eef2f7] last:border-b-0 hover:bg-[#fafcfe] transition-colors ${isRead ? 'opacity-80' : ''}`}>
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#f0f7fc] text-[#1a6fa0]">
                        <svg className="w-4.5 h-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 0 0-5-5.91V4a1 1 0 1 0-2 0v1.09A6 6 0 0 0 6 11v3.2a2 2 0 0 1-.6 1.4L4 17h5" />
                          <path d="M9 17a3 3 0 0 0 6 0" />
                        </svg>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-[13px] font-semibold text-[#1e2a3a] truncate">
                            {notification.subject || formatChannelLabel(notification.channel)}
                          </p>
                          {createdLabel && <span className="shrink-0 text-[11px] text-[#8a9bae]">{createdLabel}</span>}
                        </div>
                        {preview && <p className="mt-1 text-[12px] leading-5 text-[#5f6f80]">{preview}</p>}
                        <div className="mt-2 flex items-center gap-2 text-[11px] text-[#8a9bae]">
                          <span className="rounded-full bg-[#f8fbfd] px-2 py-0.5 font-medium text-[#1a6fa0]">
                            {notification.recipientType}
                          </span>
                          <span>{formatChannelLabel(notification.channel)}</span>
                          {!isRead ? (
                            <button
                              type="button"
                              onClick={() => markAsRead(notification._id)}
                              className="ml-auto rounded-md border border-[#c4dced] bg-[#f0f7fc] px-2 py-0.5 text-[11px] font-medium text-[#1a6fa0] hover:bg-[#e2f0fb]"
                            >
                              Mark as Read
                            </button>
                          ) : (
                            <span className="ml-auto rounded-md border border-[#d8e2ea] bg-[#f8fbfd] px-2 py-0.5 text-[11px] font-medium text-[#6b7b8d]">
                              Read
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;