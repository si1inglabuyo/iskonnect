// src/pages/RegisterPage.jsx
import { useNavigate } from 'react-router-dom';
import RegisterForm from '../components/RegisterForm';

export default function RegisterPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center relative bg-black/100 py-12 sm:py-0">
      <div
        className="absolute inset-0 bg-cover bg-center z-0"
        style={{
          backgroundImage: "url('/pup.jpg')",
          opacity: 0.7
        }}
      />
      <div className="w-full max-w-md mx-4 sm:mx-0 p-6 md:p-8 space-y-6 bg-white/95 backdrop-blur-sm rounded-xl shadow-lg z-20">
        <RegisterForm onSwitchToLogin={() => navigate('/login')} />
      </div>
    </div>
  );
}



