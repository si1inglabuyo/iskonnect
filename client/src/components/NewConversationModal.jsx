import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import Avatar from './Avatar';
import { Input } from './ui/input';

export default function NewConversationModal({ isOpen, onClose }) {
     const [searchTerm, setSearchTerm] = useState('');
     const [users, setUsers] = useState([]);
     const [loading, setLoading] = useState(false);
     const [error, setError] = useState('');
     const navigate = useNavigate();

     // Debounced search
     useEffect(() => {
     if (!searchTerm.trim()) {
          setUsers([]);
          return;
     }

     const timer = setTimeout(() => {
          handleSearch();
     }, 300);

     return () => clearTimeout(timer);
     }, [searchTerm]);

     const handleSearch = async () => {
     if (!searchTerm.trim()) return;
     
    setLoading(true);
    setError('');
     try {
          const res = await api.get(`/api/search?q=${encodeURIComponent(searchTerm.trim())}`);
          setUsers(res.data.users || []);
     } catch (err) {
          console.error('Search failed:', err);
          setError('Failed to search users');
     } finally {
          setLoading(false);
     }
     };

     const handleStartConversation = async (userId) => {
     try {
          // Get user details
          const userRes = await api.get(`/api/users/${userId}`);
          const userData = userRes.data;

      // Create conversation without initial message
          const messageRes = await api.post('/api/messages/create', {
          recipient_id: userId
     });

          // Navigate to chat
                         navigate(`/messages/${messageRes.data.conversation_id}`, {
                              state: {
                                   recipient: {
                                        id: userData.id,
                                        username: userData.Profile?.username || userData.email,
                                        avatar: userData.Profile?.avatar_url
                                   }
                              }
                         });

          onClose();
     } catch (err) {
          console.error('Failed to start conversation:', err);
          setError('Could not start conversation. Please try again.');
     }
     };

     if (!isOpen) return null;

     return (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-30">
               <div className="bg-white rounded-lg shadow-lg w-full max-w-md mx-4 max-h-[90vh] flex flex-col">
               {/* Header */}
               <div className="p-4 border-b flex items-center justify-between">
                    <h2 className="text-lg font-bold">New Conversation</h2>
                    <button
                         onClick={onClose}
                         className="text-gray-500 hover:text-gray-700 p-1"
                    >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    </button>
               </div>

               {/* Search Input */}
               <div className="p-4 border-b">
                    <Input
                         type="text"
                         placeholder="Search by username..."
                         value={searchTerm}
                         onChange={(e) => setSearchTerm(e.target.value)}
                         autoFocus
                         className="w-full"
                    />
               </div>

               {/* Users List */}
               <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {error && (
                    <p className="text-red-500 text-sm text-center">{error}</p>
                    )}
                    
                    {loading && (
                    <p className="text-gray-500 text-sm text-center">Searching...</p>
                    )}

                    {!loading && searchTerm && users.length === 0 && (
                    <p className="text-gray-500 text-sm text-center">No users found</p>
                    )}

                    {!loading && !searchTerm && (
                    <p className="text-gray-500 text-sm text-center">Start typing to search for users</p>
                    )}

                    {users.map(user => (
                    <button
                         key={user.id}
                         onClick={() => handleStartConversation(user.id)}
                         className="w-full flex items-center gap-3 p-3 hover:bg-gray-100 rounded-lg transition text-left"
                    >
                    <Avatar
                         username={user.username}
                         src={user.avatar_url}
                         size="md"
                    />
                    <div className="flex-1">
                         <p className="font-semibold">{user.username || user.email}</p>
                         {user.full_name && (
                         <p className="text-sm text-gray-500">{user.full_name}</p>
                         )}
                    </div>
                    </button>
                    ))}
               </div>
               </div>
          </div>
     );
}
