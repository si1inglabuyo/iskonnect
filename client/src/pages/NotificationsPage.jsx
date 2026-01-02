// src/pages/NotificationsPage.jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import Avatar from '../components/Avatar';
import PostModal from '../components/PostModal';
import { formatTimeAgo } from '../utils/formatTimeAgo';

const actionMessages = {
     follow: 'followed you',
     like: 'liked your post',
     comment: 'commented on your post',
     message: 'sent you a message'
};

export default function NotificationsPage() {
     const [notifications, setNotifications] = useState([]);
     const [loading, setLoading] = useState(true);
     const [selectedPost, setSelectedPost] = useState(null);
     const navigate = useNavigate();

     const fetchNotifications = async () => {
     try {
          const res = await api.get('/api/notifications');
          setNotifications(res.data);
     } catch (err) {
          console.error('Failed to fetch notifications');
     } finally {
          setLoading(false);
     }
     };

     const markAllAsRead = async () => {
     try {
          await api.patch('/api/notifications');
          setNotifications(notifications.map(n => ({ ...n, is_read: true })));
     } catch (err) {
          console.error('Failed to mark all as read');
     }
     };

     useEffect(() => {
     fetchNotifications();
     }, []);

     const handleNotificationClick = (notification) => {
     // Mark as read
     api.patch(`/api/notifications/${notification.id}`);

     // Navigate based on type
     if (notification.action_type === 'message') {
          navigate(`/messages/${notification.conversation_id}`);
          } else if (notification.post_id) {
               // Fetch the full post and open in modal
               (async () => {
                    try {
                         const res = await api.get(`/api/posts/${notification.post_id}`);
                         setSelectedPost(res.data);
                    } catch (err) {
                         console.error('Failed to fetch post for notification', err);
                         // fallback to feed
                         navigate('/feed');
                    }
               })();
     }
     // For 'follow', just stay on page
     };

     if (loading) return <div className="p-4">Loading...</div>;

     return (
          <div className="max-w-2xl mx-auto p-4">
                    <div className="flex justify-between items-center mb-6">
                         <h1 className="text-2xl font-bold">Notifications</h1>
                         {notifications.length > 0 && (
                              <button
                                   onClick={markAllAsRead}
                                   className="text-sm text-indigo-600 hover:text-indigo-800"
                              >
                                   Mark all as read
                              </button>
                    )}
               </div>

               {notifications.length === 0 ? (
               <p className="text-center py-10 text-gray-500">No notifications</p>
               ) : (
               <div className="space-y-3">
                    {notifications.map(notification => (
                    <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`p-3 flex items-start gap-3 hover:bg-gray-50 cursor-pointer rounded-lg ${
                         !notification.is_read ? 'bg-blue-50' : ''
                    }`}
                    >
                    <Avatar
                         username={notification.actor_username}
                         src={notification.actor_avatar}
                         size="sm"
                    />
                    <div className="flex-1 min-w-0">
                         <p className="text-sm">
                         <span className="font-semibold">{notification.actor_username || 'Someone'}</span>{' '}
                         {actionMessages[notification.action_type] || `performed ${notification.action_type}`}
                         </p>
                         <p className="text-xs text-gray-500 mt-1">{formatTimeAgo(notification.created_at)}</p>
                    </div>
                    </div>
                    ))}
               </div>
               )}
                    {selectedPost && (
                         <PostModal post={selectedPost} onClose={() => setSelectedPost(null)} />
                    )}
          </div>
     );
}