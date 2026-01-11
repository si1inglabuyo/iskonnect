import { useState } from 'react';
import { Button } from './ui/button';
import api from '../lib/api';
import { useNavigate } from 'react-router-dom';
import { Input } from '../components/ui/input';

export default function RegisterForm({ onSwitchToLogin }) {
     const [email, setEmail] = useState('');
     const [username, setUsername] = useState('')
     const [full_name, setFullName] = useState('');
     const [password, setPassword] = useState('');
     const [loading, setLoading] = useState(false);
     const [emailError, setEmailError] = useState('');
     const navigate = useNavigate();

     // Validate email domain
     const validateEmail = (emailValue) => {
          const requiredDomain = '@iskolarngbayan.pup.edu.ph';
          if (!emailValue.endsWith(requiredDomain)) {
               setEmailError(`Email must end with ${requiredDomain}`);
               return false;
          }
          setEmailError('');
          return true;
     };

     const handleSubmit = async (e) => {
          e.preventDefault();
          if(!email || !username || !full_name || !password) {
               alert('All fields are required');
               return;
          }

          // Validate email domain before submit
          if (!validateEmail(email)) {
               return;
          }
          
          setLoading(true);
          try {
               await api.post('/api/auth/register', {
                    email, 
                    username,
                    full_name,
                    password
               });

               // login if signed up
               const loginRes = await api.post('/api/auth/login', { email, password });
               localStorage.setItem('token', loginRes.data.token);
               localStorage.setItem('user', JSON.stringify(loginRes.data.user));
               navigate('/feed');
          
          } catch (err) {
               const message = err.response?.data?.error || 'Failed to create account';
               alert(message);

          } finally {
               setLoading(false);
          }
     };

     return (
          
          <div className='w-full max-w-md space-y-4 z-10'>
               <div className='text-center'>
                    <h1 className='text-2xl font-bold'>Create Account</h1>
                    <p className='text-gray-500 mt-1 '>Join ISKOnnect Today</p>
               </div>

               <form onSubmit={handleSubmit} className='space-y-4'>

                    <Input
                         type="text"
                         placeholder="Full Name"
                         value={full_name}
                         onChange={(e) => setFullName(e.target.value)}
                         required
                    />

                    <Input
                         type="text"
                         placeholder="Username"
                         value={username}
                         onChange={(e) => setUsername(e.target.value)}
                         required
                    />


                    <Input
                         type="email"
                         placeholder="Email"
                         value={email}
                         onChange={(e) => {
                              setEmail(e.target.value);
                              validateEmail(e.target.value);
                         }}
                         required
                    />
                    {emailError && <p className='text-red-500 text-sm'>{emailError}</p>}

                    <Input
                         type="password"
                         placeholder="Password"
                         value={password}
                         onChange={(e) => setPassword(e.target.value)}
                         required
                    />
                             
                    <Button type='submit' disable={loading} className='w-full bg-[#800201] text-white'>
                         {loading ? 'Creating Account...' : 'Sign Up'}
                    </Button>
               </form>
               <div className="text-center pt-4">
                    <button
                         type='button'
                         onClick={onSwitchToLogin}
                         className='text-[#a51d28] hover:text-[#df333c] font-medium'
                    >
                         Already have an account? Sign in
                    </button>
               </div>
          </div>
     );
}