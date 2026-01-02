import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Avatar from './Avatar';


export default function MobileHeader({ isMenuOpen, setIsMenuOpen, onClose }) {
     const { currentUser } = useAuth();
     const navigate = useNavigate();
     const location = useLocation();

     // Get current page title
     const getPageTitle = () => {
          if (location.pathname === '/feed') return 'Home';
          if (location.pathname === '/search') return 'Search';
          if (location.pathname === '/messages') return 'Messages';
          if (location.pathname === '/profile') return 'Profile';
          if (location.pathname === '/discover') return 'Discover';
          if (location.pathname === '/notifications') return 'Notifications';
          return 'SocialFeed';
     };

     return (
          <>
               <div className="bg-[#800201] border-b z-40 px-2 sm:px-3 py-2 sm:py-3 flex items-center justify-between gap-2 shadow-md w-full">
                    {/* Left: Hamburger menu button */}
                    <button
                         onClick={() => setIsMenuOpen(true)}
                         className="p-1 flex-shrink-0"
                         aria-label="Open menu"
                    >
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6 text-[#ffdf07]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                         </svg>
                    </button>
                    
                    {/* Center: Page title */}
                    <div className="font-bold text-sm sm:text-lg text-[#ffdf07] flex-1 text-center truncate">
                         {getPageTitle()}
                    </div>
                    
                    {/* Right: Profile avatar */}
                    {currentUser && (
                         <button 
                              onClick={() => navigate('/profile')}
                              className="p-1 flex-shrink-0"
                         >
                         <Avatar 
                              username={currentUser.Profile?.username} 
                              src={currentUser.Profile?.avatar_url}
                              size="sm"
                         />
                         </button>
                    )}

               </div>
          </>
     );
}
