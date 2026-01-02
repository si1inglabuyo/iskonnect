import { useCallback, useEffect, useState } from "react";
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';
import Avatar from "../components/Avatar";
import { Button } from "../components/ui/button";

export default function DiscoverPage() {
     const [users, setUsers] = useState([]);
     const [loading, setLoading] = useState(true);
     const { currentUser } = useAuth();
     const [followingStatus, setFollowingStatus] = useState({});
     
     const fetchUsers = async () => {
          setLoading(true);
          try {
               const res = await api.get('/api/users');
               setUsers(res.data);
          } catch (err) {
               console.error('Failed to fetch users:', err);
          } finally {
               setLoading(false);
          }
     };

     const handleFollowChange = useCallback(() => {
          if (currentUser) fetchUsers();
     }, [currentUser]);

     useEffect(() => {
          if (currentUser) {
               fetchUsers();
          }

          window.addEventListener('followStatusChanged', handleFollowChange);
          return () => window.removeEventListener('followStatusChanged', handleFollowChange);
     }, [currentUser,  handleFollowChange]);

     const handleFollow = async (userId) => {
          try {
               const isFollowing = followingStatus[userId];
               if (isFollowing) {
                    await api.delete(`/api/follows/${userId}`);
               } else {
                    await api.post('/api/follows', { following_id: userId });
               }
               setFollowingStatus(prev => ({
                    ...prev,
                    [userId]: !isFollowing
               }));
               // Refetch to update mutual counts
               fetchUsers();
          } catch (err) {
               console.error('Follow error:', err);
          }
     };
     

     return (
          <div className="max-w-2xl mx-auto p-4">
               <h1 className="text-2xl font-bold mb-6">Suggested Isko/Iska</h1>

               {loading ? (
                    <p className="text-center py-6">Loading users...</p>
               ) : users.length === 0 ? (
                    <p className="text-center py-10 text-gray-500">No other users found.</p>
               ) : (
                    <div className="space-y-3">
                         {users.map(user => (
                              <div key={user.id} className="flex items-center justify-between gap-2 p-3 bg-white rounded-lg hover:bg-gray-50 transition-colors border">
                                   <div className="flex items-center gap-3 flex-1 min-w-0">
                                        <Avatar 
                                             username={user.Profile?.username}
                                             src={user.Profile?.avatar_url}
                                             size="md"
                                        />
                                        <div className="min-w-0 flex-1">
                                             <p className="font-semibold text-sm text-gray-900 truncate">{user.Profile?.username || 'Anonymous'}</p>
                                             {user.Profile?.full_name && (
                                                  <p className="text-xs text-gray-500 truncate">{user.Profile.full_name}</p>
                                             )}
                                             <p className="text-xs text-gray-500 truncate">
                                                  {user.mutual_count > 0 && user.mutual_username
                                                       ? user.mutual_count > 1
                                                            ? `Followed by ${user.mutual_username} + ${user.mutual_count - 1} more`
                                                            : `Followed by ${user.mutual_username}`
                                                       : 'No mutuals yet'
                                                  }
                                             </p>
                                        </div>
                                   </div>
                                   <div className="flex-shrink-0">
                                        <Button
                                             size="sm"
                                             variant={followingStatus[user.id] ? "secondary" : "default"}
                                             onClick={() => handleFollow(user.id)}
                                        >
                                             {followingStatus[user.id] ? 'Following' : 'Follow'}
                                        </Button>
                                   </div>
                              </div>
                         ))}
                    </div>
               )}
          </div>
     );
};