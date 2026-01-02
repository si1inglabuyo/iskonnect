// src/components/NotificationDropdown.jsx
import { useEffect, useState } from 'react';
import api from '../lib/api';
import NotificationItem from './NotificationItem';

export default function NotificationDropdown({ onClose }) {
  const [notifications, setNotifications] = useState([]);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/api/notifications');
      setNotifications(res.data);
    } catch (err) {
      console.error('Failed to fetch notifications');
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  return (
    <div className="max-h-96 overflow-y-auto">
      <div className="p-3 border-b flex justify-between items-center">
        <h3 className="font-semibold">Notifications</h3>
        {notifications.length > 0 && (
          <button
            onClick={async () => {
              await api.patch('/api/notifications');
              setNotifications(notifications.map(n => ({ ...n, is_read: true })));
            }}
            className="text-sm text-indigo-600 hover:text-indigo-800"
          >
            Mark all as read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <p className="p-4 text-gray-500 text-center">No notifications</p>
      ) : (
        notifications.map(notification => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            onClose={onClose}
          />
        ))
      )}
    </div>
  );
}