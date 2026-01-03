import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom'; // ✅ Import useLocation
import Avatar from './Avatar';
import { useEffect, useRef } from 'react';

export default function MobileSidebar({ isOpen, onClose }) {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation(); 
  
  useEffect(() => {
    if (isOpen) {
      onClose();
    }
  }, [location, onClose]);

     // Close when clicking outside
  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e) => e.key === 'Escape' && onClose();
    const handleClickOutside = (e) => {
      if (e.target.classList.contains('mobile-sidebar-overlay')) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    window.addEventListener('click', handleClickOutside);
    return () => {
      window.removeEventListener('keydown', handleEsc);
      window.removeEventListener('click', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const navItems = [
    { name: 'Home', icon: 'M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25', path: '/feed' },
    { name: 'Search', icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z', path: '/search' },
    { name: 'Messages', icon: 'M5.337 21.718a6.707 6.707 0 0 1-.533-.074.75.75 0 0 1-.44-1.223 3.73 3.73 0 0 0 .814-1.686c.023-.115-.022-.317-.254-.543C3.274 16.587 2.25 14.41 2.25 12c0-5.03 4.428-9 9.75-9s9.75 3.97 9.75 9c0 5.03-4.428 9-9.75 9-.833 0-1.643-.097-2.417-.279a6.721 6.721 0 0 1-4.246.997Z', path: '/messages' },
    { name: 'Profile', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 017 7h-14a7 7 0 017-7z', path: '/profile' },
    { name: 'Discover', icon: 'M15 19l-7-7 7-7', path: '/discover' },
    { name: 'Friends', icon: 'M4.5 6.375a4.125 4.125 0 1 1 8.25 0 4.125 4.125 0 0 1-8.25 0ZM14.25 8.625a3.375 3.375 0 1 1 6.75 0 3.375 3.375 0 0 1-6.75 0ZM1.5 19.125a7.125 7.125 0 0 1 14.25 0v.003l-.001.119a.75.75 0 0 1-.363.63 13.067 13.067 0 0 1-6.761 1.873c-2.472 0-4.786-.684-6.76-1.873a.75.75 0 0 1-.364-.63l-.001-.122ZM17.25 19.128l-.001.144a2.25 2.25 0 0 1-.233.96 10.088 10.088 0 0 0 5.06-1.01.75.75 0 0 0 .42-.643 4.875 4.875 0 0 0-6.957-4.611 8.586 8.586 0 0 1 1.71 5.157v.003Z', path: '/friends' },
    { name: 'Notifications', icon: 'M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0', path: '/notifications' }
  ];

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div className="mobile-sidebar-overlay fixed inset-0 bg-black bg-opacity-50 z-40" onClick={onClose} />
      )}
      
      {/* Sidebar */}
      <div 
        className={`fixed left-0 top-0 h-screen w-64 bg-white border-r transform transition-transform duration-300 ease-in-out z-50 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo */}
        <div className="p-4 border-b">
          <h1 className="text-xl font-bold text-gray-800">Iskonnect</h1>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-2 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.name}
              onClick={() => {
                navigate(item.path);
                onClose();
              }}
              className="flex items-center gap-4 w-full p-3 rounded-lg hover:bg-gray-100"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
              </svg>
              <span className="text-sm font-medium">{item.name}</span>
            </button>
          ))}
        </nav>

        {/* Bottom Section */}
        <div className="p-4 border-t mt-auto space-y-4">
          {/* Logout Button */}
          <button
            onClick={() => {
              logout();
              navigate('/');
              onClose();
            }}
            className="flex items-center gap-3 w-full p-2 rounded-md hover:bg-gray-100 text-red-600"
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
                <p className="font-semibold text-sm">
                  {currentUser.Profile?.username || 'User'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}