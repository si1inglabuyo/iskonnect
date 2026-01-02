// src/components/NotificationBell.jsx
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';

export default function NotificationBell() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadCount = useCallback(async () => {
    if (!currentUser) return 0;
    try {
      const res = await api.get('/api/notifications');
      return res.data.filter(n => !n.is_read).length;
    } catch (err) {
      console.error('Failed to fetch notification count');
      return 0;
    }
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    const load = async () => {
      const count = await fetchUnreadCount();
      setUnreadCount(count);
    };
    load();
    const interval = setInterval(load, 10000);
    return () => clearInterval(interval);
  }, [currentUser, fetchUnreadCount]);

  const handleBellClick = () => {
    navigate('/notifications');
  };

  return (
    <button
      onClick={handleBellClick}
      className="p-2 rounded-full hover:bg-gray-100 relative"
      aria-label="Notifications"
    >
      {/* 🔔 Bell Icon */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        strokeWidth="1.5"
        fill="none"
        stroke="currentColor"
        className={`h-6 w-6 ${unreadCount > 0 ? 'text-red-500' : 'text-gray-700'}`}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
        />
      </svg>

      {/* 🔴 Badge */}
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </button>
  );
}