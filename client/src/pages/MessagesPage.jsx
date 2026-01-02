import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import Avatar from '../components/Avatar';
import { formatTimeAgo } from '../utils/formatTimeAgo';
import NewConversationModal from '../components/NewConversationModal';
import CreateGroupModal from '../components/CreateGroupModal';

export default function MessagesPage() {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewConversation, setShowNewConversation] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const navigate = useNavigate();

  const fetchConversations = async () => {
    try {
      const res = await api.get('/api/messages');
      setConversations(res.data);
    } catch (err) {
      console.error('Failed to fetch messages');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
    const interval = setInterval(fetchConversations, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleGroupCreated = (group) => {
    fetchConversations();
    navigate(`/messages/${group.conversation_id}`);
  };

  return (
    <div className='p-2 md:p-4 h-screen flex flex-col'>
      <h1 className='text-2xl font-bold mb-6 hidden md:block'>Messages</h1>
      <div className="flex justify-between items-center mb-4 gap-2">
        <h1 className="text-xl font-bold flex-shrink-0">Your Conversations</h1>
        <div className="flex gap-2 flex-shrink-0">
          {/* Create Group Button */}
          <button 
            onClick={() => setShowCreateGroup(true)}
            className="bg-[#a51d28] text-white p-2 rounded-full hover:bg-[#91000c] transition"
            title="Create Group"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-6">
              <path fillRule="evenodd" d="M8.25 6.75a3.75 3.75 0 1 1 7.5 0 3.75 3.75 0 0 1-7.5 0ZM15.75 9.75a3 3 0 1 1 6 0 3 3 0 0 1-6 0ZM2.25 9.75a3 3 0 1 1 6 0 3 3 0 0 1-6 0ZM6.31 15.117A6.745 6.745 0 0 1 12 12a6.745 6.745 0 0 1 6.709 7.498.75.75 0 0 1-.372.568A12.696 12.696 0 0 1 12 21.75c-2.305 0-4.47-.612-6.337-1.684a.75.75 0 0 1-.372-.568 6.787 6.787 0 0 1 1.019-4.38Z" clipRule="evenodd" />
              <path d="M5.082 14.254a8.287 8.287 0 0 0-1.308 5.135 9.687 9.687 0 0 1-1.764-.44l-.115-.04a.563.563 0 0 1-.373-.487l-.01-.121a3.75 3.75 0 0 1 3.57-4.047ZM20.226 19.389a8.287 8.287 0 0 0-1.308-5.135 3.75 3.75 0 0 1 3.57 4.047l-.01.121a.563.563 0 0 1-.373.486l-.115.04c-.567.2-1.156.349-1.764.441Z" />
            </svg>

          </button>
          {/* New Conversation Button */}
          <button 
            onClick={() => setShowNewConversation(true)}
            className="bg-[#a51d28] text-white p-2 rounded-full hover:bg-[#91000c] transition"
            title="New Conversation"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    
      {conversations.length === 0 ? (
        <p className='text-center py-10'>No conversations yet</p>
      ) : (
        <div className='space-y-2 overflow-y-auto flex-1'>
          {conversations.map(conv => (
            <div 
              key={conv.id}
              onClick={() => navigate(`/messages/${conv.id}`)}
              className='flex items-center gap-3 p-3 hover:bg-gray-100 rounded-lg cursor-pointer relative w-full pr-2'
            >
              {/* Avatar or Group Icon */}
              {conv.is_group ? (
                conv.group_avatar_url ? (
                  <img
                    src={conv.group_avatar_url}
                    alt="Group"
                    className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6 text-white">
                      <path fillRule="evenodd" d="M8.25 6.75a3.75 3.75 0 1 1 7.5 0 3.75 3.75 0 0 1-7.5 0ZM15.75 9.75a3 3 0 1 1 6 0 3 3 0 0 1-6 0ZM2.25 9.75a3 3 0 1 1 6 0 3 3 0 0 1-6 0ZM6.31 15.117A6.745 6.745 0 0 1 12 12a6.745 6.745 0 0 1 6.709 7.498.75.75 0 0 1-.372.568A12.696 12.696 0 0 1 12 21.75c-2.305 0-4.47-.612-6.337-1.684a.75.75 0 0 1-.372-.568 6.787 6.787 0 0 1 1.019-4.38Z" clipRule="evenodd" />
                      <path d="M5.082 14.254a8.287 8.287 0 0 0-1.308 5.135 9.687 9.687 0 0 1-1.764-.44l-.115-.04a.563.563 0 0 1-.373-.487l-.01-.121a3.75 3.75 0 0 1 3.57-4.047ZM20.226 19.389a8.287 8.287 0 0 0-1.308-5.135 3.75 3.75 0 0 1 3.57 4.047l-.01.121a.563.563 0 0 1-.373.486l-.115.04c-.567.2-1.156.349-1.764.441Z" />
                    </svg>
                  </div>
                )
              ) : (
                <Avatar
                  username={conv.other_username}
                  src={conv.other_avatar}
                  size='md'
                />
              )}
              
              <div className='flex-1 min-w-0'>
                <div className='flex justify-between gap-2 items-center'>
                  <p className='font-semibold truncate'>
                    {conv.is_group ? conv.group_name : conv.other_username}
                  </p>
                  <div className='flex items-center gap-2 flex-shrink-0'>
                    {conv.last_message_at && (
                      <span className='text-xs text-gray-500'>
                        {formatTimeAgo(conv.last_message_at)}
                      </span>
                    )}
                    {conv.unread_count > 0 && (
                      <span className="bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center flex-shrink-0">
                        {conv.unread_count > 9 ? '9+' : conv.unread_count}
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Last message */}
                {conv.last_message && (
                  <p className={`text-sm truncate ${conv.unread_count > 0 ? 'font-medium' : 'text-gray-600'}`}>
                      {conv.is_group && !conv.is_own_message && `${(conv.sender_username && conv.sender_username !== 'undefined') ? conv.sender_username : ((conv.other_username && conv.other_username !== 'undefined') ? conv.other_username : 'Someone')}: `}
                      {conv.is_own_message ? 'You: ' : ''}
                    {conv.last_message}
                  </p>
                )}
              </div>
              
              {/* Unread badge - removed from here */}
            </div>
          ))}
        </div>
      )}

      <NewConversationModal 
        isOpen={showNewConversation}
        onClose={() => setShowNewConversation(false)}
      />
      
      <CreateGroupModal 
        isOpen={showCreateGroup}
        onClose={() => setShowCreateGroup(false)}
        onGroupCreated={handleGroupCreated}
      />
    </div>
  ); 
}
