import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import api from '../lib/api';
import Avatar from '../components/Avatar';

export default function ProfilePage() {
     const { currentUser, refetchUser } = useAuth();
     const [profile, setProfile] = useState(null);
     const [stats, setStats] = useState({ posts: 0, followers: 0, following: 0 });
     const [loading, setLoading] = useState(true);
     const [saving, setSaving] = useState(false);
     const [file, setFile] = useState(null);
     const [previewUrl, setPreviewUrl] = useState('');
     

     const fetchProfile = async() => {
          try {
               const res = await api.get('/api/profile');
               setProfile(res.data.user);
               setStats(res.data.stats);
               setPreviewUrl(res.data.user.avatar_url || ''); 
          } catch (err) {
               console.error('Failed to fetch profile:', err);
          } finally {
               setLoading(false);
          }
     };

     useEffect(() => {
          if(currentUser) fetchProfile();

          const handleFollowStatusChange = (e) => {
               const detail = e?.detail || {};
               
               // If this profile page is for the user whose followers changed
               if (detail.userId && profile?.id && detail.userId === profile.id) {
                    setStats(prev => ({ ...prev, followers: detail.followers_count }));
                    return; // ✅ no need to refetch
               }

               // If the current user performed the action, update their following count
               if (currentUser && detail.following_count != null) {
                    setStats(prev => ({ ...prev, following: detail.following_count }));
                    return;
               }

               // Fallback: refetch (e.g., if profile user liked a post, etc.)
               fetchProfile();
          };

               window.addEventListener('followStatusChanged', handleFollowStatusChange);

               return () => {
                    window.removeEventListener('followStatusChanged', handleFollowStatusChange);
               };
     }, [currentUser]);

     const handleFileChange = (e) => {
          const selected = e.target.files[0];
          if(selected && selected.type.startsWith('image/')) {
               setFile(selected);
               setPreviewUrl(URL.createObjectURL(selected));
          }
     };

     const handleSave = async (e) => {
          e.preventDefault();
          setSaving(true);

          let avatar_url = profile?.avatar_url;

          // Upload new image if selected
          if(file) {
               const formData = new FormData();
               formData.append('image', file);
               try {
                    const uploadRes = await api.post('/api/upload', formData);
                    avatar_url = uploadRes.data.url;
               } catch (err) {
                    alert('Image upload failed');
                    setSaving(false);
                    return;
               }
          }
          
          try {
               await api.put('/api/profile', {
                    username: profile.username?.trim() || null,
                    full_name: profile.full_name,
                    bio: profile.bio,
                    website: profile.website,
                    avatar_url
               });
               fetchProfile();
               await refetchUser();
               alert('Profile updated!');
          } catch (err) {
               alert(err.response?.data?.error || 'Failed to update profile.');
          } finally {
               setSaving(false);
          }
     };



     if(loading) return <div className='max-w-2xl mx-auto p-4'>Loading...</div>;

     return (
          <div className='max-w-2xl mx-auto p-4'>
               <h1 className='text-2xl font-bold mb-6'>Your Profile</h1>
               <div className='bg-white rounded-xl shadow p-6 mb-8'>
                    {/* Avatar Upload */}
                    <div className='flex flex-col items-center mb-6'>
                         <div className='w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden mb-4'>
                              <Avatar
                                   username={profile?.username}
                                   email={profile?.email}
                                   size='lg'
                                   src={previewUrl}
                              />
                         </div>
                         <h2 className='font-bold text-xl'>{profile.username}</h2>
                         <input
                              type='file'
                              accept='image/*'
                              onChange={handleFileChange}
                              className="block text-sm text-gray-500 mt-3 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700"
                        />
                        
                       
                    </div>
                    {/* Stats */}
                    <div className='flex justify-center gap-6 mb-8'>
                         <div className='text-center'>
                              <div className='font-bold text-lg'>{stats.posts}</div>
                              <div className='text-gray-500'>Posts</div>
                         </div>
                         <div className='text-center'>
                              <div className='font-bold text-lg'>{stats.followers}</div>
                              <div className='text-gray-500'>Followers</div>
                         </div>
                         <div className='text-center'>
                              <div className='font-bold text-lg'>{stats.following}</div>
                              <div className='text-gray-500'>Following</div>
                         </div>
                    </div>

                    {/* Edit Form */}
                    <form onSubmit={handleSave} className='space-y-4'>
                         <div>
                              <label className='block text-sm font-medium mb-1'>Username</label>
                              <Input
                                   value={profile?.username || ''}
                                   onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                                   className=''
                              />
                              
                         </div>
                         <div>
                              <label className='block text-sm font-medium mb-1'>Full Name</label>
                              <Input
                                   value={profile?.full_name || ''}
                                   onChange={(e) => setProfile({...profile, full_name: e.target.value })}
                              />
                         </div>
                         <div>
                              <label className='block text-sm font-medium mb-1'>Bio</label>
                              <textarea 
                                   value={profile?.bio || ''}
                                   onChange={(e) => {
                                        if (e.target.value.length <= 365) {
                                             setProfile({...profile, bio: e.target.value });
                                        }
                                   }}
                                   className='w-full p-2 border border-gray-300 rounded-md resize-none'
                                   rows='3'    
                              />
                              <div className="text-xs text-gray-500 mt-1 select-none">
                                   {(profile?.bio?.length || 0)}/365
                              </div>
                         </div>
                         <div>
                              <label className='block text-sm font-medium mb-1'>Website</label>
                              <Input
                                   value={profile?.website || ''}
                                   onChange={(e) => setProfile({...profile, website: e.target.value })}
                              />
                         </div>
                         
                         <Button 
                              type='submit' 
                              disabled={saving} 
                              className='w-full'
                         >
                              {saving ? 'Saving...' : 'Save Changes'}               
                         </Button>
                    </form>
               </div>
          </div>
     );
}
