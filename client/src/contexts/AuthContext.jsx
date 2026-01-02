import { createContext, useContext, useEffect, useState } from "react";
import api from '../lib/api';
import { set } from "date-fns";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
     const [currentUser, setCurrentUser] = useState(null);
     const [loading, setLoading] = useState(true);

     useEffect(() => {
          const token = localStorage.getItem('token');
          if (!token) {
              setLoading(false);
              return
          } 

          // Verify token and fetch user
          api.get('/api/auth/me')
               .then(res => {
                    setCurrentUser(res.data);
               })
               .catch(err => {
                    console.error('Session invalid', err);
                    localStorage.removeItem('token');
               })
               .finally(() => {
                    setLoading(false);
               })
     }, []);

     const login = async (email, password) => {
          const res = await api.post('/api/auth/login', { email, password });
          localStorage.setItem('token', res.data.token);
          
          const userRes = await api.get('/api/auth/me');
          setCurrentUser(userRes.data);
          return res.data;
     };

     const refetchUser = async () => {
          const res = await api.get('/api/auth/me');
          setCurrentUser(res.data);
     };


     const logout = () => {
          localStorage.removeItem('token');
          setCurrentUser(null);
     };

     const value = { currentUser, login, logout, refetchUser };

     if (loading) {
          return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
     }

     return (
          <AuthContext.Provider value={value}>
               { children }
          </AuthContext.Provider>
     );
};