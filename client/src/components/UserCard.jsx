import { useState } from 'react';
import { Button } from './ui/button';
import api from '../lib/api';
import Avatar from './Avatar';

export default function UserCard({ user, OnFollowChange }) {
     const [isFollowing, setIsFollowing] = useState(false);
     const [loading, setLoading] = useState(false);

     const handleFollow = async () => {
          setLoading(true);

          try {
               if(!isFollowing) {
                    await api.post('/api/follows', { following_id: user.id });
                    setIsFollowing(true);
               } else {
                    await api.delete(`/api/follows/${user.id}`);
                    setIsFollowing(false);
               }
               if(OnFollowChange) OnFollowChange(user.id, !isFollowing);
          } catch (err) {
               console.error('Follow error:', err);
               alert('Failed to update follow status');
          } finally {
               setLoading(false);
          }
     
     };

     return (
          <div className='flex items-center justify-between p-4 border rounded-lg hover:shadow'>
               <div className='flex items-center gap-3'>
                    <Avatar 
                         username={user.Profile?.username}
                         src={user.Profile?.avatar_url}
                         size="md"
                    />
                    <div>
                         <div className='font-semibold'>{user.Profile?.username || 'Anonymous'}</div>
                         {user.Profile?.full_name && (
                              <div className='text-sm text-gray-500'>{user.Profile.full_name}</div>
                         )}
                    </div>
               </div>

               <Button
                    size="sm"
                    variant={isFollowing ? "secondary" : "default"}
                    onClick={handleFollow}
                    disabled={loading}
               >
                    {loading ? '...' : isFollowing ? 'Following' : 'Follow'}
               </Button>
          </div>
     );
}