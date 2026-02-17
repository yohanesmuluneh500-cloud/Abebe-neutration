
import React, { useState } from 'react';
import { supabase } from '../services/supabase';

const Auth: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        alert('Verification email sent! Check your inbox.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      <div className="max-w-md w-full glass p-8 rounded-2xl border border-zinc-800 shadow-2xl animate-in zoom-in duration-500">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-orange-600 rounded-2xl mx-auto flex items-center justify-center font-oswald text-4xl font-bold italic mb-6 shadow-xl shadow-orange-900/40">A</div>
          <h2 className="text-3xl font-oswald font-bold text-white tracking-tighter uppercase mb-2">Iron Academy</h2>
          <p className="text-zinc-500 text-xs tracking-widest uppercase font-bold">Secure your data, Forge your legacy</p>
        </div>

        <form onSubmit={handleAuth} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-500 block uppercase tracking-widest">Email Address</label>
            <input 
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-4 text-white focus:border-orange-600 outline-none transition-all"
              placeholder="warrior@gym.com"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-500 block uppercase tracking-widest">Password</label>
            <input 
              required
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-4 text-white focus:border-orange-600 outline-none transition-all"
              placeholder="••••••••"
            />
          </div>

          {error && <div className="p-3 bg-red-900/20 border border-red-900/50 text-red-500 text-xs font-bold rounded-lg">{error}</div>}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-4 bg-orange-600 hover:bg-orange-700 disabled:bg-zinc-800 text-white font-bold rounded-lg transition-all font-oswald tracking-widest uppercase shadow-lg shadow-orange-900/20"
          >
            {loading ? 'PROCESSING...' : (isSignUp ? 'CREATE ACCOUNT' : 'SECURE SIGN IN')}
          </button>
        </form>

        <div className="mt-8 text-center">
          <button 
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-[10px] text-zinc-500 hover:text-orange-500 font-bold uppercase tracking-[0.2em] transition-colors"
          >
            {isSignUp ? 'ALREADY A WARRIOR? SIGN IN' : 'NEW TO THE ACADEMY? JOIN NOW'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;
