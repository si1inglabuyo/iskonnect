// src/App.jsx
import { useState, useCallback, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Sidebar from './components/Sidebar';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import FeedPage from './pages/FeedPage';
import ProfilePage from './pages/ProfilePage';
import MessagesPage from './pages/MessagesPage';
import ChatPage from './pages/ChatPage';
import SearchPage from './pages/SearchPage';
import PublicProfilePage from './pages/PublicProfilePage';
import NotificationsPage from './pages/NotificationsPage';
import DiscoverPage from './pages/DiscoverPage';
import FriendsPage from './pages/FriendsPage';
import MobileHeader from './components/MobileHeader'; // ✅ Import new component
import MobileSidebar from './components/MobileSidebar'; // ✅ Import MobileSidebar


// Protect routes that require auth
function ProtectedRoute({ children }) {
  const { currentUser } = useAuth();
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

// Layout for authenticated users (with responsive sidebar)
function AuthenticatedLayout({ children }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { currentUser } = useAuth();

  const handleCloseMenu = useCallback(() => {
    setIsMenuOpen(false);
  }, []);

  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? 'hidden' : 'auto';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isMenuOpen]);

  return (
    <div className={`min-h-screen ${isMenuOpen ? 'overflow-hidden' : ''}`}>
      {/* Mobile header - positioned outside flex for sticky to work */}
      <div className="md:hidden sticky top-0 z-30">
        <MobileHeader isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} onClose={handleCloseMenu} />
      </div>
      <div className="flex relative">
        {/* Sidebar - hidden on mobile */}
        <div className="hidden md:block">
          <Sidebar key={currentUser?.id} />
        </div>

        {/* Main content area */}
        <div className="w-full md:ml-64 relative z-10">
          {children}
        </div>
      </div>

      {/* Mobile Sidebar - positioned outside sticky header for proper z-index */}
      <MobileSidebar isOpen={isMenuOpen} onClose={handleCloseMenu} />
    </div>
  );
}

// Layout for public pages (no sidebar)
function PublicLayout({ children }) {
  return <div className="min-h-screen">{children}</div>;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route
          path="/login"
          element={
            <PublicLayout>
              <LoginPage />
            </PublicLayout>
          }
        />
        <Route
          path="/register"
          element={
            <PublicLayout>
              <RegisterPage />
            </PublicLayout>
          }
        />

        {/* Authenticated Routes */}
        <Route
          path="/feed"
          element={
            <ProtectedRoute>
              <AuthenticatedLayout>
                <FeedPage />
              </AuthenticatedLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <AuthenticatedLayout>
                <ProfilePage />
              </AuthenticatedLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/messages"
          element={
            <ProtectedRoute>
              <AuthenticatedLayout>
                <MessagesPage />
              </AuthenticatedLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/messages/:id"
          element={
            <ProtectedRoute>
              <AuthenticatedLayout>
                <ChatPage />
              </AuthenticatedLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/search"
          element={
            <ProtectedRoute>
              <AuthenticatedLayout>
                <SearchPage />
              </AuthenticatedLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile/:id"
          element={
            <ProtectedRoute>
              <AuthenticatedLayout>
                <PublicProfilePage />
              </AuthenticatedLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <AuthenticatedLayout>
                <NotificationsPage />
              </AuthenticatedLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/discover"
          element={
            <ProtectedRoute>
              <AuthenticatedLayout>
                <DiscoverPage />
              </AuthenticatedLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/friends"
          element={
            <ProtectedRoute>
              <AuthenticatedLayout>
                <FriendsPage />
              </AuthenticatedLayout>
            </ProtectedRoute>
          }
        />

        {/* Redirect root */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Navigate to="/feed" replace />
            </ProtectedRoute>
          }
        />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;