// src/pages/PublicProfilePage.jsx
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../lib/api';
import { useAuth } from '../contexts/AuthContext'; 
import Avatar from '../components/Avatar';
import { formatTimeAgo } from '../utils/formatTimeAgo';
import PostModal from '../components/PostModal';


export default function PublicProfilePage() {
     const { id } = useParams();
     const { currentUser } = useAuth();
     const [profile, setProfile] = useState(null);
     const [stats, setStats] = useState({ posts: 0, followers: 0, following: 0 });
     const [isFollowing, setIsFollowing] = useState(false);
     const [posts, setPosts] = useState([]);
     const [imagePosts, setImagePosts] = useState([]);
     const [textPosts, setTextPosts] = useState([]);   
     const [loadingPosts, setLoadingPosts] = useState(false);
     const [activeTab, setActiveTab] = useState('posts');
     const [selectedPost, setSelectedPost] = useState(null);
     const [savedPosts, setSavedPosts] = useState([]);
     const [loadingSaved, setLoadingSaved] = useState(false);

     // Fetch profile
     const fetchProfile = async () => {
          try {
               const res = await api.get(`/api/profile/${id}`);
               setProfile(res.data.user);
               setStats(res.data.stats);
          } catch (err) {
               console.error('Failed to fetch profile');
          }
     };


     // Fetch posts
     const fetchPost = async () => {
          if(!id) return;
          setLoadingPosts(true);
          try {
               const res = await api.get(`/api/posts/user/${id}`);
               setPosts(res.data);
          } catch (err) {
               console.error('Failed to fetch posts');
          } finally {
               setLoadingPosts(false);
          }
     };


     // split posts
     useEffect(() => {
          if (posts.length > 0) {
               const images = posts.filter(p => p.image_url);
               const texts = posts.filter(p => !p.image_url && p.content);
               setImagePosts(images);
               setTextPosts(texts);
          }
     }, [posts]);

     // Check if current user follows this profile
     const checkFollowStatus = async () => {
          if (!currentUser || !id) return;
          try {
               const res = await api.get(`/api/follows/me/following/${id}`);
               setIsFollowing(res.data.isFollowing);
          } catch (err) {
               console.error('Failed to check follow status');
          }
     };

     // Follow/unfollow handler
     const handleFollow = async () => {
          if (!currentUser) return;
          try {
               if (isFollowing) {
                    await api.delete(`/api/follows/${id}`);
                    setIsFollowing(false);
               } else {
                    await api.post(`/api/follows`, { following_id: id });
                    setIsFollowing(true);
               }

               // Refresh profile to update follower count
               fetchProfile();
          } catch (err) {
               alert('Failed to update follow status');
          } 
     };

     // Fetch saved posts
     const fetchSavedPosts = async () => {
          if (!currentUser || currentUser.id !== Number(id)) return;
          setLoadingSaved(true);
          try {
               const res = await api.get('/api/saves');
               setSavedPosts(res.data);
          } catch (err) {
               console.error('Failed to fetch saved posts');
          } finally {
               setLoadingSaved(false);
          }
     };

     // Fetch data when id or currentUser changes
     useEffect(() => {
          fetchProfile();
          fetchPost();   
     }, [id]);

     useEffect(() => {
          checkFollowStatus();
     }, [currentUser, id]);

     useEffect(() => {
          if (currentUser && currentUser.id === Number(id)) {
               fetchSavedPosts()
          }
     }, [currentUser, id]);

         // Listen for save/unsave events to update savedPosts immediately
         useEffect(() => {
              const onSaveToggled = (e) => {
                   const detail = e?.detail || {};
                   const postId = detail.postId;
                   const saved = detail.saved;

                   // Only care when viewing own saved tab
                   if (!currentUser || currentUser.id !== Number(id)) return;

                   // If saved tab isn't active, no need to update UI now
                   if (activeTab !== 'saved') return;

                   if (saved) {
                        // A post was saved — refresh the saved list to include it
                        fetchSavedPosts();
                   } else {
                        // A post was unsaved — remove it from the visible saved list
                        setSavedPosts(prev => prev.filter(p => p.id !== postId));
                   }
              };

              window.addEventListener('saveToggled', onSaveToggled);
              return () => window.removeEventListener('saveToggled', onSaveToggled);
         }, [currentUser, id, activeTab]);


     if (!profile) {
          return (
               <div className="flex items-center justify-center min-h-screen bg-gray-50">
                    <div className="text-center">
                         <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-indigo-600 mx-auto mb-4"></div>
                         <p className="text-gray-600">Loading profile...</p>
                    </div>
               </div>
          );
     }

     return (
          <div className="max-w-2xl mx-auto p-4">
               <div className="bg-white rounded-xl shadow p-6 mb-8">
                    <div className="flex flex-col items-center mb-6">
                         <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden mb-4">
                              <Avatar
                                   username={profile.username}
                                   email={profile.email}
                                   size='lg'
                                   src={profile.avatar_url}
                              />
                         </div>
                         <h1 className="text-2xl font-bold mb-1">{profile.username}</h1>
                         {profile.full_name && <div className="text-gray-500">{profile.full_name}</div>}
                    </div>

                    {/* Stats */}
                    <div className="flex justify-center gap-6 mb-8">
                         <div className="text-center">
                              <div className="font-bold text-lg">{stats.posts}</div>
                              <div className="text-gray-500">Posts</div>
                         </div>
                         <div className="text-center">
                              <div className="font-bold text-lg">{stats.followers}</div>
                              <div className="text-gray-500">Followers</div>
                         </div>
                         <div className="text-center">
                              <div className="font-bold text-lg">{stats.following}</div>
                              <div className="text-gray-500">Following</div>
                         </div>
                    </div>


                    {/* Follow Button*/}
                    {currentUser && currentUser.id !== Number(id) && (
                         <div className='mt-4 flex justify-center'>
                              <button 
                                   onClick={handleFollow}
                                   className={`px-4 py-2 rounded-full text-sm font-medium ${
                                        isFollowing
                                             ? 'bg-gray-200 text-gray-700'
                                             : 'bg-indigo-600 text-white hover:bg-indigo-700'
                                   }`}
                              >
                                   {isFollowing ? 'Following' : 'Follow'}
                              </button>
                         </div>
                    )}


                    {/* Bio */}
                    {profile.bio && (
                         <div className="text-center mb-6">
                              <p className="text-gray-700">{profile.bio}</p>
                         </div>
                    )}

                    {/* Website */}
                    {profile.website && (
                         <div className="text-center mb-6">
                              <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-800">
                                   {profile.website}
                              </a>
                         </div>
                    )}
               </div>

                    {/* Tabs (Post and Text Post) */}
                    <div className="border-b border-gray-200 mb-6">
                         <div className='flex space-x-8'>
                              <button
                                   onClick={() => setActiveTab('posts')}
                                   className={`pb-3 font-medium text-sm ${
                                        activeTab === 'posts'
                                             ? 'border-b-2 border-indigo-600 text-indigo-600'
                                             : 'text-gray-500 hover:text-gray-700'
                                   }`}
                              >
                                   Posts
                              </button>
                              <button
                                   onClick={() => setActiveTab('textPosts')}
                                   className={`pb-3 font-medium text-sm ${
                                        activeTab === 'textPosts'
                                             ? 'border-b-2 border-indigo-600 text-indigo-600'
                                             : 'text-gray-500 hover:text-gray-700'
                                   }`}
                              >
                                   Text Posts
                              </button>

                              {/* Saved tab - for current user */}
                              {currentUser && currentUser.id === Number(id) && (
                                   <button
                                        onClick={() => {
                                             setActiveTab('saved');
                                             if(savedPosts.length === 0) fetchSavedPosts();
                                        }}
                                        className={`pb-3 font-medium text-sm ${
                                             activeTab === 'saved'
                                                  ? 'border-b-2 border-indigo-600 text-indigo-600'
                                                  : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                   >
                                        Saved Post
                                   </button>
                              )}
                         </div>
                    </div>
                    {/* Tab Content */}
                    {activeTab === 'posts' && (
                         <div className='space-y-6'>
                              {imagePosts.length > 0 || textPosts.length > 0 ? (
                                   <div className='grid grid-cols-3 gap-3'>
                                        {imagePosts.map(post => (
                                             <div
                                                  key={post.id}
                                                  className='aspect-square overflow-hidden rounded-lg bg-gray-100'
                                                  onClick={() => setSelectedPost(post)}
                                             >
                                                  <img src={post.image_url} alt="" className='w-full h-full object-cover' />
                                             </div>
                                        ))}
                                      
                                   </div>
                              ) : (
                                   <p className='text-gray-500'>No posts yet.</p>
                              )}
                         </div>
                    )}

                    {activeTab === 'textPosts' && (
                         <div className='space-y-4'>
                              {textPosts.length > 0 ? (
                                   textPosts.map(post => (
                                        <div
                                             key={post.id}
                                             className='bg-white rounded-lg p-4 shadow-sm'
                                             onClick={() => setSelectedPost(post)}
                                        >
                                             <div className='flex items-center gap-3 mb-2'>
                                                  <Avatar username={profile.username} size='sm' src={profile.avatar_url} />
                                                  <span className='font-semibold text-sm'>{profile.username}</span>
                                                  <span className="text-xs text-gray-500">{formatTimeAgo(post.created_at)}</span>
                                             </div>
                                             <p className='text-gray-700 whitespace-pre-wrap cursor-pointer'>{post.content}</p>
                                        </div>
                                   ))
                              ) : (
                                   <p className='text-gray-500'>No text posts yet.</p>
                              )}
                         </div>
                    )}

                    {/* Saved tab content */}
                    {activeTab === 'saved' && currentUser && currentUser.id === Number(id) && (
                         <div className='space-y-6'>
                              {loadingSaved ? (
                                   <p className='text-center py-4'>Loading saved posts...</p>
                              ) : savedPosts.length > 0 ? (
                                   <div className='grid grid-cols-3 gap-3'>
                                        {savedPosts.map(post => (
                                             <div
                                                  key={post.id}
                                                  className='aspect-square overflow-hidden rounded-lg bg-gray-100 cursor-pointer relative'
                                                  onClick={() => setSelectedPost(post)}
                                             >
                                                  {post.image_url ? (
                                                       <img
                                                            src={post.image_url}
                                                            alt=''
                                                            className='w-full h-full object-cover'
                                                       />
                                                  ) : (
                                                       <div className='w-full h-full flex items-center justify-center text-gray-500 p-2 text-sm'>
                                                            {post.content?.substring(0, 20)}...
                                                       </div>
                                                  )}

                                                  {/* Author avatar + username */}
                                                  <div className='absolute top-2 left-2 flex items-center gap-1 bg-white/80 backdrop-blur-sm rounded-full px-2 py-1 shadow-sm'>
                                                       <Avatar
                                                            username={post.author_username || 'Anoymous'}
                                                            src={post.author_avatar}
                                                            size='sm'
                                                       />
                                                       <span className='text-xs font-medium text-gray-800 truncate max-w-[80px]'>
                                                            {post.author_username || 'Anonymous'}
                                                       </span>
                                                  </div>
                                             </div>
                                        ))}
                                        
                                   </div>
                              ) : (
                                   <p className='text-gray-500'>No saved posts yet.</p>
                              )}

                         </div>
                    )}

                    {/* Post Modal */}
                    {selectedPost && (
                         <PostModal
                              post={selectedPost}
                              onClose={() => setSelectedPost(null)}
                         />
                    )}
          </div>
     );
}