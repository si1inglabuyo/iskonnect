// src/pages/LoginPage.jsx
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { useNavigate } from 'react-router-dom';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      navigate('/feed');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative backdrop-blur-sm bg-black/100 py-12 sm:py-100">
      
      <div
        className="absolute inset-0 bg-cover bg-center z-0"
        style={{
          backgroundImage: "url('/pup.jpg')",
          opacity: 0.7
        }}
      />
      
      <div className="w-full max-w-md mx-4 sm:mx-0 p-8 space-y-6 bg-white rounded-lg shadow z-10">
        <h2 className="text-2xl font-bold text-center">Login</h2>
        {error && <p className="text-red-500 text-center">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <Button type="submit" className="w-full bg-[#800201] text-white mt-4">Login</Button>
          <button
            type="button"
            onClick={() => navigate('/register')}
            className="text-[#800201] hover:text-[#a51d28] font-medium w-full"
          >
            Don't have an account? Sign up
          </button>
        </form>
      </div>
    </div>
  );
}
