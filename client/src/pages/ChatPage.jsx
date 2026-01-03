// src/pages/ChatPage.jsx
import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import api from '../lib/api';
import Avatar from '../components/Avatar';
import { formatTimeAgo, formatSeparator } from '../utils/formatTimeAgo';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { useAuth } from '../contexts/AuthContext';
import MessageActions from '../components/MessageActions';
import GroupSettingsModal from '../components/GroupSettingsModal';

export default function ChatPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [conversation, setConversation] = useState(null);
  const [hoveredMessageId, setHoveredMessageId] = useState(null);
  const [showActions, setShowActions] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);
  const [showMembers, setShowMembers] = useState(false);
  const [showGroupSettings, setShowGroupSettings] = useState(false);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  // Close actions menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (messagesContainerRef.current && !messagesContainerRef.current.contains(e.target)) {
        setShowActions(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchMessages = async () => {
    try {
      const res = await api.get(`/api/messages/${id}`);
      setMessages(res.data);

      // Check if it's a group or 1-on-1 conversation
      // Try to get group info first
      try {
        const groupRes = await api.get(`/api/messages/group/${id}`);
        setConversation(prev => ({
          id: groupRes.data.id,
          is_group: true,
          group_name: groupRes.data.group_name,
          group_avatar_url: groupRes.data.group_avatar_url || prev?.group_avatar_url,
          members: groupRes.data.members
        }));
      } catch (groupErr) {
        // Not a group, try to get 1-on-1 info
        try {
          const infoRes = await api.get(`/api/messages/${id}/info`);
          const other = infoRes.data;
          setConversation({
            id: id,
            is_group: false,
            username: other.username,
            avatar: other.avatar_url,
            userId: other.id
          });
        } catch (infoErr) {
          console.error('Failed to fetch conversation info:', infoErr);
        }
      }
    } catch (err) {
      console.error('Failed to fetch messages:', err);
      alert('Failed to load chat. Returning to messages.');
      navigate('/messages');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!id) {
      navigate('/messages');
      return;
    }
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      await api.post('/api/messages', {
        conversation_id: conversation?.id,
        recipient_id: conversation?.is_group ? null : conversation?.userId,
        content: newMessage,
        parent_message_id: replyingTo?.id || null
      });
      setNewMessage('');
      setReplyingTo(null);
      fetchMessages();
    } catch (err) {
      console.error('Failed to send message:', err);
      alert('Failed to send message. Please try again.');
    }
  };

  const handleDeleteMessage = async (messageId) => {
    if (!window.confirm('Delete this message?')) return;

    try {
      await api.delete(`/api/messages/${messageId}`);
      setShowActions(null);
      fetchMessages();
    } catch (err) {
      console.error('Failed to delete message:', err);
      alert('Failed to delete message');
    }
  };

  const handleReplyMessage = (messageId) => {
    const msg = messages.find(m => m.id === messageId);
    if (msg) {
      setReplyingTo(msg);
      setShowActions(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading conversation...</p>
        </div>
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="p-4 text-center">
        <p className="text-gray-500">Unable to load chat</p>
        <button 
          onClick={() => navigate('/messages')}
          className="mt-4 text-indigo-600 hover:text-indigo-800"
        >
          ← Back to Messages
        </button>
      </div>
    );
  }

  const isGroup = conversation?.is_group;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-white border-b p-3 flex items-center gap-3 sticky top-0 z-10">
        <button 
          onClick={() => navigate('/messages')} 
          className="p-1 text-gray-600 hover:text-gray-900"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Avatar or Group Icon */}
        {isGroup ? (
          conversation?.group_avatar_url ? (
            <img
              src={conversation.group_avatar_url}
              alt="Group"
              className="w-10 h-10 rounded-full object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 text-white">
                <path fillRule="evenodd" d="M8.25 6.75a3.75 3.75 0 1 1 7.5 0 3.75 3.75 0 0 1-7.5 0ZM15.75 9.75a3 3 0 1 1 6 0 3 3 0 0 1-6 0ZM2.25 9.75a3 3 0 1 1 6 0 3 3 0 0 1-6 0ZM6.31 15.117A6.745 6.745 0 0 1 12 12a6.745 6.745 0 0 1 6.709 7.498.75.75 0 0 1-.372.568A12.696 12.696 0 0 1 12 21.75c-2.305 0-4.47-.612-6.337-1.684a.75.75 0 0 1-.372-.568 6.787 6.787 0 0 1 1.019-4.38Z" clipRule="evenodd" />
                <path d="M5.082 14.254a8.287 8.287 0 0 0-1.308 5.135 9.687 9.687 0 0 1-1.764-.44l-.115-.04a.563.563 0 0 1-.373-.487l-.01-.121a3.75 3.75 0 0 1 3.57-4.047ZM20.226 19.389a8.287 8.287 0 0 0-1.308-5.135 3.75 3.75 0 0 1 3.57 4.047l-.01.121a.563.563 0 0 1-.373.486l-.115.04c-.567.2-1.156.349-1.764.441Z" />
              </svg>
            </div>
          )
        ) : (
          <Avatar 
            username={conversation.username} 
            src={conversation.avatar} 
            size="md" 
          />
        )}

        <div className="flex-1">
          <h2 className="font-semibold truncate">
            {isGroup ? conversation.group_name : conversation.username}
          </h2>
          {isGroup && (
            <p className="text-xs text-gray-500">
              {conversation.members?.length} members
            </p>
          )}
          {isGroup && (
            <div className="flex gap-2 mt-1">
              <button
                onClick={() => setShowMembers(true)}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                View Members
              </button>
            </div>
          )}
        </div>

        {isGroup && (
          <button
            onClick={() => setShowGroupSettings(true)}
            className="p-2 text-gray-600 hover:text-gray-900"
            title="Group Settings"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        )}
      </div>

      {/* Messages */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-4 bg-gray-50 pb-24">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <p className="text-lg">Start messaging now</p>
          </div>
        ) : (
          (() => {
            const elems = [];
            for (let i = 0; i < messages.length; i++) {
              const msg = messages[i];
              const prev = messages[i - 1];

              // Insert separator if gap between messages >= 1 hour (3600 seconds)
              if (prev) {
                const diffSec = Math.abs(new Date(msg.created_at) - new Date(prev.created_at)) / 1000;
                if (diffSec >= 3600) {
                  elems.push(
                    <div key={`sep-${msg.id}`} className="flex justify-center">
                      <span className="text-xs text-gray-400 px-3 py-1 rounded-md">
                        {formatSeparator(msg.created_at)}
                      </span>
                    </div>
                  );
                }
              }

              const isOwn = currentUser ? msg.sender_id === currentUser.id : false;

              // Handle system messages differently
              if (msg.is_system_message) {
                elems.push(
                  <div key={msg.id} className="flex justify-center">
                    <span className="text-xs text-gray-400 px-3 py-1 rounded-md">
                      {msg.content}
                    </span>
                  </div>
                );
                continue;
              }

              elems.push(
                <div
                  key={msg.id}
                  className={`flex ${isOwn ? 'justify-end' : 'justify-start'} relative group`}
                  onMouseEnter={() => setHoveredMessageId(msg.id)}
                  onMouseLeave={() => setHoveredMessageId(null)}
                >
                  <div className={`flex items-start gap-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
                    {/* Show sender avatar in group chats */}
                    {showMembers && (
                       <div className="fixed inset-0 bg-black bg-opacity-10 flex items-center justify-center z-30">
                        <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[80vh] overflow-y-auto">
                          <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold">Members</h3>
                            <button onClick={() => setShowMembers(false)} className="text-gray-500">×</button>
                          </div>
                          <div className="divide-y">
                            {conversation.members?.map(m => (
                              <div key={m.id} className="flex items-center gap-3 p-3">
                                <Avatar username={m.username} src={m.avatar_url} size="sm" />
                                <div>
                                  <div className="font-medium">{m.username}</div>
                                  <div className="text-xs text-gray-500">{m.bio || ''}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                    {!isOwn && (
                      <Avatar
                        username={msg.sender_username || conversation.username}
                        src={msg.sender_avatar || conversation.avatar}
                        size="sm"
                      />
                    )}

                    <div className={`max-w-xs md:max-w-md p-3 rounded-lg ${isOwn ? 'bg-[#b40101] text-white' : 'bg-white border border-gray-200 text-gray-800'}`}>
                      {/* Show sender name in group chats */}
                      {isGroup && !isOwn && (
                        <p className="text-xs font-semibold text-indigo-600 mb-1">
                          {msg.sender_username}
                        </p>
                      )}

                      {/* Show parent message context if replying */}
                      {msg.parent_message_id && msg.parent_content && (
                        <div className="mb-2 pb-2 border-b border-gray-300 opacity-75">
                          <p className="text-xs opacity-75 mb-1">↪ Replied to {msg.parent_sender_id === currentUser?.id ? 'yourself' : msg.parent_sender_username}</p>
                          <p className="text-xs italic">{msg.parent_content}</p>
                        </div>
                      )}
                      <p style={{ wordBreak: 'break-all' }}>{msg.content}</p>
                      <p className={`text-xs mt-1 ${isOwn ? 'text-[#ffdf07]' : 'text-gray-500'}`}>
                        {formatTimeAgo(msg.created_at)}
                      </p>
                    </div>

                    {/* Action button on hover - positioned right next to message */}
                    {hoveredMessageId === msg.id && (
                      <button
                        onClick={() => setShowActions(showActions === msg.id ? null : msg.id)}
                        className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded transition relative"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                          <circle cx="10" cy="5" r="1.5" fill="currentColor" />
                          <circle cx="10" cy="10" r="1.5" fill="currentColor" />
                          <circle cx="10" cy="15" r="1.5" fill="currentColor" />
                        </svg>

                        {/* Actions popup - positioned below the button */}
                        {showActions === msg.id && (
                          <div className="absolute top-full mt-1 bg-gray-700 text-white rounded-lg shadow-lg py-2 z-20 w-32">
                            {/* Reply Button */}
                            <button
                              onClick={() => {
                                handleReplyMessage(msg.id);
                                setShowActions(null);
                              }}
                              className="w-full text-left px-4 py-2 hover:bg-gray-600 flex items-center gap-2 text-sm"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                                <path fillRule="evenodd" d="M9.53 2.47a.75.75 0 0 1 0 1.06L4.81 8.25H15a6.75 6.75 0 0 1 0 13.5h-3a.75.75 0 0 1 0-1.5h3a5.25 5.25 0 1 0 0-10.5H4.81l4.72 4.72a.75.75 0 1 1-1.06 1.06l-6-6a.75.75 0 0 1 0-1.06l6-6a.75.75 0 0 1 1.06 0Z" clipRule="evenodd" />
                              </svg>

                              Reply
                            </button>

                            {/* Delete Button - Only for own messages */}
                            {isOwn && (
                              <button
                                onClick={() => {
                                  handleDeleteMessage(msg.id);
                                  setShowActions(null);
                                }}
                                className="w-full text-left px-4 py-2 hover:bg-red-600 flex items-center gap-2 text-sm text-red-300"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                Delete
                              </button>
                            )}
                          </div>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            }
            return elems;
          })()
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="sticky bottom-0 z-20 border-t bg-white p-3">
        {/* Reply context - styled as message bubble */}
        {replyingTo && (
          <div className="mb-3 flex items-start gap-2">
            <div className="flex-1">
              <div className="flex items-center gap-1 text-xs text-gray-600 mb-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6-6m-6 6l-6-6" />
                </svg>
                Replying to {replyingTo.sender_id === currentUser?.id ? 'yourself' : isGroup ? replyingTo.sender_username : conversation?.username}
              </div>
              <div className="bg-[#ee7c81] text-white p-3 rounded-lg">
                <p className="text-sm">{replyingTo.content}</p>
              </div>
            </div>
            <button
              onClick={() => setReplyingTo(null)}
              className="text-gray-500 hover:text-gray-700 p-1 flex-shrink-0 mt-1"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        <form onSubmit={handleSend} className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1"
          />
          <Button 
            type="submit" 
            disabled={!newMessage.trim()}
            className="bg-[#800201] hover:bg-[#b40101] text-[#ffdf07] disabled:opacity-50"
          >
            Send
          </Button>
        </form>
      </div>

      {/* Group Settings Modal */}
      <GroupSettingsModal
        isOpen={showGroupSettings}
        onClose={() => setShowGroupSettings(false)}
        conversation={conversation}
        onUpdate={(updatedData) => {
          setConversation(prev => ({ ...prev, ...updatedData }));
        }}
        onLeave={() => {
          navigate('/messages');
        }}
      />
    </div>
  );
}
