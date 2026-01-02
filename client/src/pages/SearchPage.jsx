import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../lib/api';
import Avatar from '../components/Avatar';
import PostModal from '../components/PostModal'; 
import { useAuth } from '../contexts/AuthContext';

export default function SearchPage() {
     const [searchTerm, setSearchTerm] = useState('');
     const { currentUser } = useAuth();
     const [results, setResults] = useState({ users: [], posts: [] });
     const [loading, setLoading] = useState(false);
     const [selectedPost, setSelectedPost] = useState(null);
     const [searchHistory, setSearchHistory] = useState([]);
     const navigate = useNavigate();
     const [params] = useSearchParams();
     const mode = params.get('mode');

     // Load search history from localStorage
     useEffect(() => {
          const history = JSON.parse(localStorage.getItem('searchHistory') || '[]');
          setSearchHistory(history);
     }, []);

     // Load initial search term from URL (if any)
     useEffect(() => {
          const q = params.get('q');
          if (q) {
               setSearchTerm(q);
               handleSearch(q);
          }
     }, [params]);

     const handleSearch = async (term = searchTerm) => {
          if (!term.trim()) return;
          setLoading(true);
          try {
               const res = await api.get(`/api/search?q=${encodeURIComponent(term.trim())}`);
               setResults(res.data);
               
               // Add to search history
               const updatedHistory = [term.trim(), ...searchHistory.filter(item => item !== term.trim())].slice(0, 10);
               setSearchHistory(updatedHistory);
               localStorage.setItem('searchHistory', JSON.stringify(updatedHistory));
          } catch (err) {
               console.error('Search failed:', err);
          } finally {
               setLoading(false);
          }
     };

     const handleKeyDown = (e) => {
          if (e.key === 'Enter') {
               handleSearch();
               navigate(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
          }
     };

     const deleteFromHistory = (term) => {
          const updatedHistory = searchHistory.filter(item => item !== term);
          setSearchHistory(updatedHistory);
          localStorage.setItem('searchHistory', JSON.stringify(updatedHistory));
     };

     const handleStartConversation = async (recipientId) => {
          try {
          // Create new conversation
               const res = await api.post('/api/messages', {
                    recipient_id: recipientId,
                    content: 'Hello' 
          });

          // Navigate to chat
          navigate(`/messages/${res.data.conversation_id}`, {
               state: {
                    recipient: res.data.other_user
               }
          });
          } catch (err) {
               console.error('Failed to start conversation');
               alert('Could not start conversation');
          }
     };

     return (
          <div className='max-w-2xl mx-auto p-4'>
               {/* Header */}
               <div className='mb-6'>
                    <h1 className='text-2xl font-bold'>Search</h1>
                    <div className='relative mt-3'>
                         <div className='absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none'>
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                              </svg>
                         </div>
                         <input 
                              type="text" 
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}        
                              onKeyDown={handleKeyDown}
                              placeholder='Search' 
                              className='w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-full focus:outline-none focus:ring-1 focus:ring-indigo-500'                
                         />
                         {searchTerm && (
                              <button
                                   onClick={() => {
                                        setSearchTerm('');
                                        setResults({ users: [], posts: [] });
                                        navigate('/search');
                                   }}
                                   className='absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600'
                              >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                   </svg>

                              </button>
                         )}
                    </div>
               </div>
               {/* Results */}
               {loading? (
                    <p>Loading...</p>
               ) : !searchTerm ? (
                    // Show search history when no search term
                    <div>
                         {searchHistory.length > 0 && (
                              <div>
                                   <h2 className='text-lg font-semibold mb-3'>Recent Searches</h2>
                                   <div className='space-y-2'>
                                        {searchHistory.map((term, index) => (
                                             <div
                                                  key={index}
                                                  className='flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg group'
                                             >
                                                  <button
                                                       onClick={() => {
                                                            setSearchTerm(term);
                                                            handleSearch(term);
                                                            navigate(`/search?q=${encodeURIComponent(term)}`);
                                                       }}
                                                       className='flex-1 text-left flex items-center gap-2 text-gray-700 hover:text-gray-900'
                                                  >
                                                       <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                                       </svg>
                                                       <span>{term}</span>
                                                  </button>
                                                  <button
                                                       onClick={() => deleteFromHistory(term)}
                                                       className='ml-2 p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity'
                                                  >
                                                       <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                       </svg>
                                                  </button>
                                             </div>
                                        ))}
                                   </div>
                              </div>
                         )}
                    </div>
               ) : (
                    <>
                    {/* Users Section */}
                    {results.users.length > 0 && (
                         <div className='mb-8'>
                              <h2 className='text-lg font-semibold mb-3'>Users</h2>
                              <div className='space-y-3'>
                                   {results.users.map(user => (
               
                                        <div
                                             key={user.id}
                                             onClick={() => {
                                                  if (mode === 'message') {
                                                       handleStartConversation(user.id);
                                                  } else {
                                                       navigate(`/profile/${user.id}`);
                                                  }
                                             }}
                                             className='flex items-center gap-3 p-2 hover:bg-gray-50 cursor-pointer'
                                        >
                                             <Avatar
                                                  username={user.username}
                                                  src={user.avatar_url}
                                                  size='md'
                                             />
                                             <div>
                                                  <p className='font-semibold'>{user.username}</p>
                                                  {user.full_name && <p className='text-sm text-gray-500'>{user.full_name}</p>}
                                             </div>
                                        </div>
                                   ))}
                              </div>
                         </div>
                    )}
                    {/* Posts Section */}
                    {results.posts.length > 0 && (
                         <div>
                              <h2 className='text-lg font-semibold mb-3'>Posts</h2>
                              <div className='grid grid-cols-3 gap-3'>
                                   {results.posts.map(post => (
                                        <div
                                             key={post.id}
                                             onClick={() => setSelectedPost(post)} // TODO
                                             className='aspect-square overflow-hidden rounded-lg bg-gray-100 cursor-pointer relative'
                                        >
                                             {/* Post content */}
                                             {post.image_url ? (
                                                  <img src={post.image_url} alt="" className='w-full h-full object-cover' />
                                             ) : (
                                                  <div className='w-full h-full flex items-center justify-center text-gray-500'>
                                                       {post.content?.substring(0,20)}...
                                                  </div>
                                             )}

                                             {/* Author avatar and username */}
                                             <div className='absolute top-2 left-2 flex items-center gap-1 bg-white/80 backdrop-blur-sm rounded-full px-2 py-1 shadow-sm'>
                                                  <Avatar
                                                       username={post.author_username || 'Anonymous'}
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
                         </div>
                    )}
                    {results.users.length === 0 && results.posts.length === 0 && searchTerm && (
                         <p className='text-gray-500'> No results found.</p>
                    )}

                    {/* Post Modal */}
                    {selectedPost && (
                         <PostModal
                              post={selectedPost}
                              onClose={() => setSelectedPost(null)}
                         />
                    )}

                    </>
               )}
          </div>
     );
}