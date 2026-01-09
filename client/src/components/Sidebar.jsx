// src/components/Sidebar.jsx
import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';

import Avatar from './Avatar';

export default function Sidebar() {
     const { currentUser, logout } = useAuth();
     const navigate = useNavigate();
     const [unreadCount, setUnreadCount] = useState(0);
     const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);

     useEffect(() => {
          if (!currentUser) {
               setUnreadCount(0);
               setUnreadMessagesCount(0);
               return;
          }

          let cancelled = false;

          const load = async () => {
               try {
                    // Fetch notification count (excludes messages)
                    const notifRes = await api.get('/api/notifications');
                    if (cancelled) return;
                    const count = (notifRes.data || []).filter((n) => !n.is_read).length;
                    setUnreadCount(count);

                    // Fetch unread message count
                    const msgRes = await api.get('/api/messages/unread-count');
                    if (cancelled) return;
                    setUnreadMessagesCount(msgRes.data.unread_count || 0);
               } catch (err) {
                    console.error('Failed to fetch counts');
               }
          };

          load();
          const interval = setInterval(load, 10000);

          return () => {
               cancelled = true;
               clearInterval(interval);
          };
     }, [currentUser]);

     return (
          <div className="w-64 bg-[#800201] border-r h-screen fixed left-0 top-0 flex flex-col">
               {/* Logo */}
               <div className=" border-b flex items-center justify-center">
                    <img src="/logo2.png" alt="Iskonnect" className="h-20 object-contain drop-shadow-lg" />
               </div>

               {/* Navigation - Top-Aligned */}
               <nav className="flex-1 p-2 space-y-6 pt-4"> {/* Added pt-4 for spacing below logo */}
                    {/* Feed */}
                    <button
                         onClick={() => navigate('/feed')}
                         className="flex items-center gap-4 w-full p-3 rounded-lg hover:bg-[#ee7c81]"
                    >
                         <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#ffdf07" class="size-6">
                              <path d="M11.47 3.841a.75.75 0 0 1 1.06 0l8.69 8.69a.75.75 0 1 0 1.06-1.061l-8.689-8.69a2.25 2.25 0 0 0-3.182 0l-8.69 8.69a.75.75 0 1 0 1.061 1.06l8.69-8.689Z" />
                              <path d="m12 5.432 8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 0 1-.75-.75v-4.5a.75.75 0 0 0-.75-.75h-3a.75.75 0 0 0-.75.75V21a.75.75 0 0 1-.75.75H5.625a1.875 1.875 0 0 1-1.875-1.875v-6.198a2.29 2.29 0 0 0 .091-.086L12 5.432Z" />
                         </svg>
                         <span className="text-sm font-medium text-[#ffdf07]">Home</span>
                    </button>

                    {/* Search */}
                    <button
                         onClick={() => navigate('/search')}
                         className="flex items-center gap-4 w-full p-3 rounded-lg hover:bg-[#ee7c81]"
                    >
                         <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#ffdf07" class="size-6">
                              <path fill-rule="evenodd" d="M10.5 3.75a6.75 6.75 0 1 0 0 13.5 6.75 6.75 0 0 0 0-13.5ZM2.25 10.5a8.25 8.25 0 1 1 14.59 5.28l4.69 4.69a.75.75 0 1 1-1.06 1.06l-4.69-4.69A8.25 8.25 0 0 1 2.25 10.5Z" clip-rule="evenodd" />
                         </svg>

                         <span className="text-sm font-medium text-[#ffdf07]">Search</span>
                    </button>

                    {/* Messages */}
                    <button
                         onClick={() => navigate('/messages')}
                         className="flex items-center gap-4 w-full p-3 rounded-lg hover:bg-[#ee7c81]"
                    >
                         <div className="relative">
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#ffdf07" class="size-6">
                                   <path fill-rule="evenodd" d="M5.337 21.718a6.707 6.707 0 0 1-.533-.074.75.75 0 0 1-.44-1.223 3.73 3.73 0 0 0 .814-1.686c.023-.115-.022-.317-.254-.543C3.274 16.587 2.25 14.41 2.25 12c0-5.03 4.428-9 9.75-9s9.75 3.97 9.75 9c0 5.03-4.428 9-9.75 9-.833 0-1.643-.097-2.417-.279a6.721 6.721 0 0 1-4.246.997Z" clip-rule="evenodd" />
                              </svg>
                              {unreadMessagesCount > 0 && (
                                   <span className="absolute -top-1 -right-1 bg-yellow-400 text-[#800201] text-[10px] font-bold rounded-full h-5 min-w-[20px] px-1 flex items-center justify-center">
                                        {unreadMessagesCount > 99 ? '99+' : unreadMessagesCount}
                                   </span>
                              )}
                         </div>

                         <span className="text-sm font-medium text-[#ffdf07]">Messages</span>
                    </button>

                         {/* Friends */}
                         <button
                              onClick={() => navigate('/friends')}
                              className="flex items-center gap-4 w-full p-3 rounded-lg hover:bg-[#ee7c81]"
                         >
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#ffdf07" className="size-6">
                                   <path d="M4.5 6.375a4.125 4.125 0 1 1 8.25 0 4.125 4.125 0 0 1-8.25 0ZM14.25 8.625a3.375 3.375 0 1 1 6.75 0 3.375 3.375 0 0 1-6.75 0ZM1.5 19.125a7.125 7.125 0 0 1 14.25 0v.003l-.001.119a.75.75 0 0 1-.363.63 13.067 13.067 0 0 1-6.761 1.873c-2.472 0-4.786-.684-6.76-1.873a.75.75 0 0 1-.364-.63l-.001-.122ZM17.25 19.128l-.001.144a2.25 2.25 0 0 1-.233.96 10.088 10.088 0 0 0 5.06-1.01.75.75 0 0 0 .42-.643 4.875 4.875 0 0 0-6.957-4.611 8.586 8.586 0 0 1 1.71 5.157v.003Z" />
                              </svg>

                              <span className="text-sm font-medium text-[#ffdf07]">Friends</span>
                         </button>

                    {/* Profile */}
                    <button
                         onClick={() => navigate('/profile')}
                         className="flex items-center gap-4 w-full p-3 rounded-lg hover:bg-[#ee7c81]"
                    >
                         <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#ffdf07" class="size-6">
                              <path fill-rule="evenodd" d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z" clip-rule="evenodd" />
                         </svg>

                         <span className="text-sm font-medium text-[#ffdf07]">Profile</span>
                    </button>

                    {/* Notifications */}
                    <button
                         onClick={() => navigate('/notifications')}
                         className="flex items-center gap-4 w-full p-3 rounded-lg hover:bg-[#ee7c81]"
                    >
                         <div className="relative">
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#ffdf07" class="size-6">
                                   <path fill-rule="evenodd" d="M5.25 9a6.75 6.75 0 0 1 13.5 0v.75c0 2.123.8 4.057 2.118 5.52a.75.75 0 0 1-.297 1.206c-1.544.57-3.16.99-4.831 1.243a3.75 3.75 0 1 1-7.48 0 24.585 24.585 0 0 1-4.831-1.244.75.75 0 0 1-.298-1.205A8.217 8.217 0 0 0 5.25 9.75V9Zm4.502 8.9a2.25 2.25 0 1 0 4.496 0 25.057 25.057 0 0 1-4.496 0Z" clip-rule="evenodd" />
                              </svg>
                              {unreadCount > 0 && (
                                   <span className="absolute -top-1 -right-1 bg-yellow-400 text-[#800201] text-[10px] font-bold rounded-full h-5 min-w-[20px] px-1 flex items-center justify-center">
                                        {unreadCount > 99 ? '99+' : unreadCount}
                                   </span>
                              )}
                         </div>

                         <span className="text-sm font-medium text-[#ffdf07]">Notifications</span>
                    </button>
               </nav>

               {/* Bottom Section - Logout + User Info */}
               <div className="p-4 border-t mt-auto space-y-4">
                    {/* Logout Button */}
                    <button
                         onClick={() => {
                         logout();
                         navigate('/');
                         }}
                         className="flex items-center gap-3 w-full p-1 rounded-md hover:bg-[#ee7c81] text-[#ffdf07]"
                    >
                         <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
                              <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 9V5.25A2.25 2.25 0 0 1 10.5 3h6a2.25 2.25 0 0 1 2.25 2.25v13.5A2.25 2.25 0 0 1 16.5 21h-6a2.25 2.25 0 0 1-2.25-2.25V15m-3 0-3-3m0 0 3-3m-3 3H15" />
                         </svg>
                         <span className="text-sm font-medium">Logout</span>
                    </button>

                    {/* Current User Info */}
                    {currentUser && (
                         <div className="flex items-center gap-3 pt-4">
                              <Avatar
                                   username={currentUser.Profile?.username || currentUser.email?.charAt(0).toUpperCase()}
                                   size="sm"
                                   src={currentUser.Profile?.avatar_url}
                              />
                              <div>
                                   <p className="font-semibold text-sm text-white">
                                        {currentUser.Profile?.username || 'User'}
                                   </p>
                              </div>
                         </div>
                    )}
               </div>
          </div>
     );
}