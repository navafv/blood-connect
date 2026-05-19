import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, Droplet, Loader2, Send } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import api from '../../lib/axios';

export default function ForgotPassword() {
  const [status, setStatus] = useState('idle'); // 'idle' | 'loading' | 'success'
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    setError('');

    try {
      // Send the email to our new Django endpoint
      await api.post('/auth/password-reset-request/', { email });
      
      // Even if the email doesn't exist, it's best practice to show "success" 
      // so hackers can't use this form to guess which emails are registered.
      setStatus('success');
    } catch (err) {
      console.error(err);
      setError('Something went wrong. Please try again later.');
      setStatus('idle');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-rose-600/20 rounded-full blur-[120px] pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="flex justify-center mb-6">
          <Link to="/" className="flex items-center gap-2 text-rose-500 hover:text-rose-400 transition-colors">
            <Droplet className="h-10 w-10 fill-current" />
          </Link>
        </div>
        <h2 className="text-center text-2xl font-bold leading-9 tracking-tight text-white">
          Reset your password
        </h2>
        <p className="mt-2 text-center text-sm text-slate-400">
          Enter your organization email address and we'll send you a link to reset your password.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-120 relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
        <div className="bg-slate-900/80 backdrop-blur-xl px-6 py-10 shadow-2xl sm:rounded-2xl sm:px-12 border border-slate-800">
          
          {status === 'success' ? (
            <div className="text-center animate-in fade-in zoom-in duration-500">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-6">
                <Send className="h-8 w-8 text-emerald-500" />
              </div>
              <h3 className="text-xl font-medium text-white mb-2">Check your email</h3>
              <p className="text-slate-400 text-sm mb-6">
                If an account exists for <span className="text-white font-medium">{email}</span>, we've sent a password reset link.
              </p>
              
              <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 mb-6">
                <p className="text-xs text-slate-500 mb-2">
                  <strong className="text-rose-400">Developer Note:</strong> Check your Django backend terminal! The reset link has been printed there instead of being emailed.
                </p>
              </div>

              <Link to="/login">
                <Button variant="ghost" className="w-full text-slate-400 hover:text-white">
                  Return to login
                </Button>
              </Link>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit}>
              
              {error && (
                <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm p-3 rounded-lg text-center">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Email address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                  <Input 
                    type="email" 
                    placeholder="admin@hospital.com" 
                    className="pl-10 bg-slate-950/50" 
                    required 
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError('');
                    }}
                    disabled={status === 'loading'}
                  />
                </div>
              </div>

              <div>
                <Button 
                  type="submit" 
                  variant="primary" 
                  className="w-full py-5"
                  disabled={status === 'loading'}
                >
                  {status === 'loading' ? (
                    <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Sending Link...</>
                  ) : (
                    'Send Reset Link'
                  )}
                </Button>
              </div>

              <div className="mt-6 text-center">
                <Link to="/login" className="inline-flex items-center text-sm font-medium text-slate-400 hover:text-rose-400 transition-colors">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to login
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}