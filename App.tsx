
import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import WorkoutDisplay from './components/WorkoutDisplay';
import Macros from './components/Macros';
import Chat from './components/Chat';
import Settings from './components/Settings';
import Progress from './components/Progress';
import LandingPage from './components/LandingPage';
import Auth from './components/Auth';
import { WorkoutPlan, Macros as MacroType, WatchData, UserMetrics, Goal } from './types';
import { bluetoothManager } from './services/bluetoothService';
import { supabase } from './services/supabase';

// Helper component for background effects
const BackgroundForge: React.FC = () => {
  const embers = Array.from({ length: 15 });
  return (
    <div className="bg-forge">
      <div className="glow-blob glow-1"></div>
      <div className="glow-blob glow-2"></div>
      <div className="glow-blob glow-3"></div>
      <div className="forge-grid"></div>
      {embers.map((_, i) => (
        <div 
          key={i} 
          className="ember" 
          style={{ 
            left: `${Math.random() * 100}%`, 
            animationDelay: `${Math.random() * 15}s`,
            animationDuration: `${10 + Math.random() * 10}s`
          }}
        ></div>
      ))}
    </div>
  );
};

const App: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [showLanding, setShowLanding] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [userName, setUserName] = useState(() => localStorage.getItem('iron_cached_name') || 'Warrior');
  const [workout, setWorkout] = useState<WorkoutPlan | null>(() => {
    const cached = localStorage.getItem('iron_cached_workout');
    return cached ? JSON.parse(cached) : null;
  });
  const [macros, setMacros] = useState<MacroType | null>(() => {
    const cached = localStorage.getItem('iron_cached_macros');
    return cached ? JSON.parse(cached) : null;
  });
  const [loading, setLoading] = useState(true);
  
  const [metrics, setMetrics] = useState<UserMetrics>(() => {
    const cached = localStorage.getItem('iron_cached_metrics');
    return cached ? JSON.parse(cached) : {
      weight: 80, height: 180, age: 25, gender: 'male' as const, activityLevel: 1.55, goal: Goal.BULK,
    };
  });

  const [watchData, setWatchData] = useState<WatchData>({
    heartRate: null, caloriesBurned: 0, deviceName: null, isConnected: false
  });

  const lastUpdateRef = useRef<number>(Date.now());
  const metricsRef = useRef(metrics);
  const isFetchingRef = useRef<boolean>(false);

  useEffect(() => {
    metricsRef.current = metrics;
    localStorage.setItem('iron_cached_metrics', JSON.stringify(metrics));
  }, [metrics]);

  useEffect(() => { if (userName) localStorage.setItem('iron_cached_name', userName); }, [userName]);
  useEffect(() => { if (workout) localStorage.setItem('iron_cached_workout', JSON.stringify(workout)); }, [workout]);
  useEffect(() => { if (macros) localStorage.setItem('iron_cached_macros', JSON.stringify(macros)); }, [macros]);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        await fetchUserData(currentUser.id);
      } else {
        setLoading(false);
      }
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        await fetchUserData(currentUser.id);
      } else {
        localStorage.clear();
        setLoading(false);
        setActiveTab('dashboard');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserData = async (userId: string) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    try {
      const [profileRes, workoutRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', userId).single(),
        supabase.from('workouts').select('plan_data').eq('user_id', userId).order('created_at', { ascending: false }).limit(1)
      ]);

      if (profileRes.data) {
        const p = profileRes.data;
        setUserName(p.name);
        setMetrics({ weight: p.weight, height: p.height, age: p.age, gender: p.gender, activityLevel: p.activityLevel, goal: p.goal as Goal });
        setMacros({ calories: p.calories, protein: p.protein, carbs: p.carbs, fats: p.fats });
      }

      if (workoutRes.data?.[0]) {
        setWorkout(workoutRes.data[0].plan_data);
      }
    } catch (err) {
      console.error('Sync Error:', err);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  };

  const handleStartApp = () => setShowLanding(false);

  const handleSetWorkout = async (plan: WorkoutPlan) => {
    setWorkout(plan);
    if (user) await supabase.from('workouts').insert({ user_id: user.id, plan_data: plan });
  };

  const handleSetMacros = async (m: MacroType) => {
    setMacros(m);
    if (user) await supabase.from('profiles').update({ calories: m.calories, protein: m.protein, carbs: m.carbs, fats: m.fats }).eq('id', user.id);
  };

  const handleSetMetrics = async (m: UserMetrics) => {
    setMetrics(m);
    if (user) await supabase.from('profiles').update({ weight: m.weight, height: m.height, age: m.age, gender: m.gender, activityLevel: m.activityLevel, goal: m.goal }).eq('id', user.id);
  };

  const handleSetUserName = async (name: string) => {
    setUserName(name);
    if (user) await supabase.from('profiles').update({ name }).eq('id', user.id);
  };

  const calculateCalorieStep = (hr: number): number => {
    const now = Date.now();
    const diff = (now - lastUpdateRef.current) / (1000 * 60);
    lastUpdateRef.current = now;
    const { weight, age, gender } = metricsRef.current;
    let burnRate = 0;
    if (hr > 40) {
      if (gender === 'male') burnRate = (-55.0969 + (0.6309 * hr) + (0.1988 * weight) + (0.2017 * age)) / 4.184;
      else burnRate = (-20.4022 + (0.4472 * hr) - (0.1263 * weight) + (0.074 * age)) / 4.184;
    }
    return Math.max(0, burnRate * diff);
  };

  const connectWatch = async () => {
    try {
      lastUpdateRef.current = Date.now();
      const name = await bluetoothManager.requestWatchConnection((hr) => {
        setWatchData(prev => ({ ...prev, heartRate: hr, caloriesBurned: prev.caloriesBurned + calculateCalorieStep(hr) }));
      });
      setWatchData(prev => ({ ...prev, deviceName: name, isConnected: true }));
    } catch (err) { alert("Bluetooth connection failed."); }
  };

  const disconnectWatch = async () => {
    await bluetoothManager.disconnect();
    setWatchData(p => ({ ...p, isConnected: false, heartRate: null }));
  };

  const handleLogout = async () => {
    localStorage.clear();
    await supabase.auth.signOut();
  };

  if (showLanding) return <LandingPage onStart={handleStartApp} />;
  if (!user) return <Auth />;
  if (loading) return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center">
      <BackgroundForge />
      <div className="w-16 h-16 bg-blue-600 rounded-2xl animate-pulse shadow-[0_0_40px_rgba(37,99,235,0.4)]"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#050505] text-blue-50 flex flex-col selection:bg-blue-600 selection:text-white">
      <BackgroundForge />
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-8 py-8 animate-in fade-in duration-300">
        {activeTab === 'dashboard' && <Dashboard workout={workout} macros={macros} userName={userName} watchData={watchData} />}
        {activeTab === 'workout' && <WorkoutDisplay workout={workout} setWorkout={handleSetWorkout} />}
        {activeTab === 'nutrition' && <Macros macros={macros} setMacros={handleSetMacros} metrics={metrics} setMetrics={handleSetMetrics} />}
        {activeTab === 'progress' && <Progress />}
        {activeTab === 'chat' && <Chat />}
        {activeTab === 'settings' && (
          <Settings 
            userName={userName} 
            setUserName={handleSetUserName} 
            watchData={watchData} 
            onConnectWatch={connectWatch} 
            onDisconnectWatch={disconnectWatch} 
            onResetCalories={() => setWatchData(p => ({ ...p, caloriesBurned: 0 }))} 
            onLogout={handleLogout} 
          />
        )}
      </main>
      <footer className="py-6 border-t border-zinc-900 text-center text-blue-900 text-[10px] font-bold tracking-widest uppercase">
        IRON MIND ACADEMY | FORGED BY YOHANES MULUNEH
      </footer>
    </div>
  );
};

export default App;
