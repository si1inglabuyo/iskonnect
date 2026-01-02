import { useNavigate } from 'react-router-dom';
import Avatar from './Avatar';
import api from '../lib/api';
import { formatTimeAgo } from '../utils/formatTimeAgo';


const actionMessages = {
     follow: 'followed you',
     like: 'liked your post',
     comment: 'commented on your post',
     message: 'sent you a message'
};

export default function NotificationItem({ notification, onClose }) {
     const navigate = useNavigate();
     const { actor_username, actor_avatar, action_type, created_at } = notification;

     const handleClick = () => {
          onClose();
          if (action_type === 'message') {
               navigate(`/messages/${notification.conversation_id}`);
          } else if (notification.post_id) {
               navigate('/feed');
          }
          // Mark as read on click
          api.patch(`/api/notifications/${notification.id}`);
     };

     return (
          <div
               onClick={handleClick}
               className={`p-3 flex items-start gap-3 hover:bg-gray-50 cursor-pointer ${
               !notification.is_read ? 'bg-blue-50' : ''
               }`}
          >
               <Avatar
                    username={actor_username}
                    src={actor_avatar}
                    size="sm"
               />
               <div className="flex-1 min-w-0">
                    <p className="text-sm">
                         <span className="font-semibold">{actor_username || 'Someone'}</span>{' '}
                         {actionMessages[action_type] || `performed ${action_type}`}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{formatTimeAgo(created_at)}</p>
               </div>
          </div>
     );
}