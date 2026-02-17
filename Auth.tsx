
import React, { useState } from 'react';
import { supabase } from '../services/supabase';
import { Goal } from '../types';

const Auth: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [age, setAge] = useState('25');
  const [height, setHeight] = useState('180');
  const [weight, setWeight] = useState('80');

  // Internal helper to create a unique identifier for Supabase
  const getShadowEmail = (username: string) => {
    const cleanName = username.trim().toLowerCase().replace(/\s+/g, '.');
    return `${cleanName}@iron.academy`;
  };

  // Internal helper to create a deterministic password since the UI removed it
  // This satisfies Supabase Auth requirements without asking the user for one.
  const getShadowPassword = (username: string) => {
    return `${username.toLowerCase().trim()}_academy_access_2025`;
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const shadowEmail = getShadowEmail(name);
    const shadowPassword = getShadowPassword(name);
    
    try {
      if (isSignUp) {
        // 1. Create the Auth User with shadow credentials
        const { data: authData, error: signUpError } = await supabase.auth.signUp({
          email: shadowEmail,
          password: shadowPassword,
        });

        if (signUpError) throw signUpError;

        if (authData.user) {
          // 2. Immediately create the profile with metrics
          const { error: profileError } = await supabase.from('profiles').upsert({
            id: authData.user.id,
            name: name,
            weight: Number(weight),
            height: Number(height),
            age: Number(age),
            gender: 'male', 
            goal: Goal.BULK, 
            calories: 2500,  
            protein: 180,
            carbs: 250,
            fats: 70,
            updated_at: new Date()
          });

          if (profileError) throw profileError;
          
          if (!authData.session) {
            setError("Warrior registered. You can now access the academy by entering your name.");
            setIsSignUp(false);
          }
        }
      } else {
        // Sign In logic using only Name (mapping to shadow email/password)
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: shadowEmail,
          password: shadowPassword,
        });
        if (signInError) throw signInError;
      }
    } catch (err: any) {
      if (err.message.includes("Invalid login credentials")) {
        setError("Warrior name not recognized. Ensure you have registered first.");
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
      <div className="max-w-md w-full glass p-8 rounded-2xl border border-zinc-800 shadow-2xl animate-in zoom-in duration-500">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl mx-auto flex items-center justify-center font-oswald text-4xl font-bold italic mb-6 shadow-xl shadow-blue-900/40">A</div>
          <h2 className="text-3xl font-oswald font-bold text-white tracking-tighter uppercase mb-2">Iron Academy</h2>
          <p className="text-blue-300/40 text-[10px] tracking-[0.3em] uppercase font-bold">
            {isSignUp ? 'New Warrior Registration' : 'Secure Entry Terminal'}
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-6">
          {/* Identity */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-zinc-500 block uppercase tracking-widest">Warrior Name</label>
            <input 
              required
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-4 text-white focus:border-blue-600 outline-none transition-all text-lg"
              placeholder="e.g. Abebe"
            />
          </div>

          {/* Metrics (Only shown during Sign Up) */}
          {isSignUp && (
            <div className="grid grid-cols-3 gap-3 animate-in slide-in-from-top duration-300">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-500 block uppercase tracking-widest">Age</label>
                <input 
                  required
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-white focus:border-blue-600 outline-none transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-500 block uppercase tracking-widest">Height</label>
                <input 