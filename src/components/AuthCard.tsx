import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, Lock, Shield, ArrowRight, UserPlus, LogIn, AlertCircle } from 'lucide-react';

interface AuthCardProps {
  onAuthSuccess: (user: any, token: string) => void;
}

export default function AuthCard({ onAuthSuccess }: AuthCardProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'user' | 'admin'>('user');
  
  // State for loading, validation errors
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateForm = () => {
    setError(null);
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address');
      return false;
    }
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/signup';
    const payload = isLogin ? { email, password } : { email, password, role };

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      // Success
      onAuthSuccess(data.user, data.token);
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto" id="auth-container">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
        className="backdrop-blur-xl bg-white/75 dark:bg-zinc-950/80 border border-white/50 dark:border-zinc-900/45 rounded-3xl p-8 shadow-[0_20px_50px_rgba(0,0,0,0.06)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)] relative overflow-hidden"
      >
        {/* Subtle decorative absolute blurred orb to give elegant ambient glows */}
        <div className="absolute -top-12 -left-12 w-32 h-32 bg-blue-500/10 dark:bg-blue-400/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-emerald-500/10 dark:bg-emerald-400/5 rounded-full blur-3xl pointer-events-none" />

        <div className="text-center mb-6">
          <div className="inline-flex p-3 rounded-2xl bg-neutral-100/80 dark:bg-zinc-900/60 border border-neutral-200/20 dark:border-zinc-800/20 text-neutral-800 dark:text-neutral-100 shadow-sm mb-4">
            <Shield className="w-6 h-6 stroke-[1.5]" />
          </div>
          <h2 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-white font-sans">
            {isLogin ? 'Sign In' : 'Create Account'}
          </h2>
          <p className="text-neutral-400 dark:text-zinc-500 text-xs mt-1.5 font-light">
            {isLogin 
              ? 'Enter credentials to access workspace taskboards' 
              : 'Join the platform to align and deliver objectives'}
          </p>
        </div>

        {/* Tab switchers in Apple-styled Segmented Control pill */}
        <div className="flex p-1 bg-neutral-100/70 dark:bg-zinc-900/60 border border-neutral-200/10 dark:border-zinc-800/10 rounded-2xl mb-6">
          <button
            id="auth-tab-login"
            type="button"
            className={`flex-1 py-2 text-xs font-medium rounded-xl transition-all duration-300 ${
              isLogin 
                ? 'bg-white dark:bg-zinc-800 text-neutral-900 dark:text-white shadow-sm font-semibold' 
                : 'text-neutral-550 dark:text-zinc-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
            onClick={() => {
              setIsLogin(true);
              setError(null);
            }}
          >
            Sign In
          </button>
          <button
            id="auth-tab-signup"
            type="button"
            className={`flex-1 py-2 text-xs font-medium rounded-xl transition-all duration-300 ${
              !isLogin 
                ? 'bg-white dark:bg-zinc-800 text-neutral-900 dark:text-white shadow-sm font-semibold' 
                : 'text-neutral-550 dark:text-zinc-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
            onClick={() => {
              setIsLogin(false);
              setError(null);
            }}
          >
            Create Account
          </button>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mb-5 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/15 flex items-start gap-2.5 text-rose-500 dark:text-rose-400 text-xs"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="font-sans leading-tight">{error}</span>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-semibold text-neutral-400 dark:text-zinc-500 mb-1.5 uppercase tracking-wider font-sans">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
                <Mail className="w-3.5 h-3.5 opacity-60" />
              </span>
              <input
                id="auth-email-input"
                type="email"
                required
                className="block w-full pl-10 pr-4 py-2.5 bg-neutral-100/40 dark:bg-zinc-900/40 border border-neutral-200/40 dark:border-zinc-800/50 rounded-2xl text-xs text-neutral-900 dark:text-zinc-100 placeholder-neutral-400/75 focus:outline-none focus:ring-1 focus:ring-blue-500/50 dark:focus:ring-blue-400/50 focus:border-blue-500/50 dark:focus:border-blue-400/50 transition-all duration-200"
                placeholder="you@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-neutral-400 dark:text-zinc-500 mb-1.5 uppercase tracking-wider font-sans">
              Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
                <Lock className="w-3.5 h-3.5 opacity-60" />
              </span>
              <input
                id="auth-password-input"
                type="password"
                required
                className="block w-full pl-10 pr-4 py-2.5 bg-neutral-100/40 dark:bg-zinc-900/40 border border-neutral-200/40 dark:border-zinc-800/50 rounded-2xl text-xs text-neutral-900 dark:text-zinc-100 placeholder-neutral-400/75 focus:outline-none focus:ring-1 focus:ring-blue-500/50 dark:focus:ring-blue-400/50 focus:border-blue-500/50 dark:focus:border-blue-400/50 transition-all duration-200"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {!isLogin && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="pt-1"
            >
              <label className="block text-[10px] font-semibold text-neutral-400 dark:text-zinc-500 mb-2 uppercase tracking-wider font-sans">
                Organizational Role
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  id="role-user-selector"
                  onClick={() => setRole('user')}
                  className={`flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold border rounded-2xl transition-all duration-300 ${
                    role === 'user'
                      ? 'border-blue-500 bg-blue-500/5 text-blue-600 dark:text-blue-400 font-bold'
                      : 'border-neutral-200/40 dark:border-zinc-800/50 bg-transparent text-neutral-550 dark:text-zinc-400 hover:text-neutral-900 dark:hover:text-white'
                  }`}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  Contributor
                </button>
                <button
                  type="button"
                  id="role-admin-selector"
                  onClick={() => setRole('admin')}
                  className={`flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold border rounded-2xl transition-all duration-300 ${
                    role === 'admin'
                      ? 'border-blue-500 bg-blue-500/5 text-blue-600 dark:text-blue-400 font-bold'
                      : 'border-neutral-200/40 dark:border-zinc-800/50 bg-transparent text-neutral-550 dark:text-zinc-400 hover:text-neutral-900 dark:hover:text-white'
                  }`}
                >
                  <Shield className="w-3.5 h-3.5" />
                  Overseer
                </button>
              </div>
            </motion.div>
          )}

          <button
            type="submit"
            id="auth-submit-button"
            disabled={loading}
            className="w-full mt-6 bg-[#0071e3] hover:bg-[#0077ed] text-white font-medium text-xs py-2.5 px-4 rounded-2xl shadow-sm hover:shadow transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 select-none"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                {isLogin ? (
                  <>
                    Sign In <LogIn className="w-3.5 h-3.5" />
                  </>
                ) : (
                  <>
                    Create Account <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center text-[10px] text-neutral-400 dark:text-zinc-500 leading-normal">
          <span>Enterprise Secure Sync. Admins manage and view all user schedules.</span>
          <div className="mt-1.5 p-1 px-2.5 inline-block bg-neutral-100/65 dark:bg-zinc-900/60 rounded-xl border border-neutral-200/10 dark:border-zinc-800/10">
            Default sandbox admin: <span className="font-semibold text-neutral-700 dark:text-zinc-300">ybandharapu@gmail.com</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
