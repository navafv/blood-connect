import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Droplet, Mail, Lock, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import api from '../../lib/axios'; 
import { jwtDecode } from 'jwt-decode'; 

export default function Login() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(''); // Clear error when user types
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // 1. Send credentials to Django
      // FIX: Django SimpleJWT expects the key to be "username" by default, 
      // even if the user is typing an email address.
      const response = await api.post('/auth/login/', {
        username: formData.email, 
        password: formData.password
      });

      // 2. Save the tokens to LocalStorage
      const { access, refresh } = response.data;
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);

      // 3. Decode the JWT to find out the user's role 
      // (Ensure you ran `npm install jwt-decode` in your terminal)
      const decodedToken = jwtDecode(access);
      
      // Temporary check: route to SuperAdmin if email contains 'superadmin', otherwise normal Admin
      const isSuperAdmin = formData.email.includes('superadmin'); 

      if (isSuperAdmin) {
        navigate('/superadmin');
      } else {
        navigate('/admin');
      }

    } catch (err) {
      console.error(err);
      
      // Better error handling for Django's default messages
      if (err.response?.status === 401) {
        setError('Invalid email or password. Please try again.');
      } else {
        setError(
          err.response?.data?.detail || 
          'An error occurred during login. Please try again later.'
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-rose-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-5%] w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="flex justify-center">
          <Link to="/" className="flex items-center gap-2 text-rose-500 hover:text-rose-400 transition-colors">
            <Droplet className="h-10 w-10 fill-current" />
            <span className="text-3xl font-bold text-white tracking-tight">BloodConnect</span>
          </Link>
        </div>
        <h2 className="mt-6 text-center text-2xl font-bold leading-9 tracking-tight text-white">
          Sign in to your account
        </h2>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-120 relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
        <div className="bg-slate-900/80 backdrop-blur-xl px-6 py-12 shadow-2xl sm:rounded-2xl sm:px-12 border border-slate-800">
          
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm p-3 rounded-lg text-center animate-in fade-in zoom-in duration-300">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Email address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                <Input 
                  name="email"
                  type="email" 
                  placeholder="admin@hospital.com" 
                  className="pl-10 bg-slate-950/50" 
                  required 
                  value={formData.email}
                  onChange={handleChange}
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-slate-300">Password</label>
                <Link to="/forgot-password" className="text-sm font-semibold text-rose-500 hover:text-rose-400 transition-colors">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                <Input 
                  name="password"
                  type="password" 
                  placeholder="••••••••" 
                  className="pl-10 bg-slate-950/50" 
                  required 
                  value={formData.password}
                  onChange={handleChange}
                  disabled={isLoading}
                />
              </div>
            </div>

            <div>
              <Button 
                type="submit" 
                variant="primary" 
                className="w-full flex justify-center items-center py-5 text-base"
                disabled={isLoading}
              >
                {isLoading ? (
                  <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Authenticating...</>
                ) : (
                  <><span className="mr-2">Sign in securely</span> <ArrowRight className="h-5 w-5" /></>
                )}
              </Button>
            </div>
          </form>

          <div className="mt-8 text-center text-sm text-slate-400">
            Not a registered organization?{' '}
            <Link to="/register-org" className="font-semibold leading-6 text-rose-500 hover:text-rose-400 transition-colors">
              Join the network
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}