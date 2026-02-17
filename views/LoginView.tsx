
import React, { useState } from 'react';
import { UserRole, Staff } from '../types';

interface LoginViewProps {
  staffList: Staff[];
  onLogin: (role: UserRole, staffMember?: Staff) => void;
}

const LoginView: React.FC<LoginViewProps> = ({ staffList, onLogin }) => {
  const [step, setStep] = useState<'ROLE' | 'STAFF' | 'ADMIN_PASS'>('ROLE');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const ADMIN_PASSWORD = '1234'; // Senha padrão solicitada

  const handleAdminAuth = () => {
    if (password === ADMIN_PASSWORD) {
      onLogin('ADMIN');
    } else {
      setError(true);
      setPassword('');
      setTimeout(() => setError(false), 500);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6 overflow-y-auto">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-12 animate-in fade-in zoom-in duration-700">
          <div className="w-24 h-24 bg-primary rounded-[2rem] shadow-2xl shadow-primary/30 flex items-center justify-center mx-auto mb-6 transform -rotate-12">
            <span className="material-icons text-white text-5xl">local_car_wash</span>
          </div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white">Lava Jato <span className="text-primary">Pro</span></h1>
          <p className="text-slate-500 font-medium mt-2">Sistema de Gestão Inteligente</p>
        </div>

        {/* Step: Role Selection */}
        {step === 'ROLE' && (
          <div className="space-y-4 animate-in slide-in-from-bottom-8 duration-500">
            <button 
              onClick={() => setStep('ADMIN_PASS')}
              className="w-full bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-xl border border-slate-200 dark:border-slate-800 flex items-center gap-6 group hover:border-primary transition-all active:scale-95"
            >
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                <span className="material-icons text-3xl">admin_panel_settings</span>
              </div>
              <div className="text-left">
                <h2 className="text-xl font-black text-slate-900 dark:text-white">Administrador</h2>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Acesso Total & Finanças</p>
              </div>
            </button>

            <button 
              onClick={() => setStep('STAFF')}
              className="w-full bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-xl border border-slate-200 dark:border-slate-800 flex items-center gap-6 group hover:border-emerald-500 transition-all active:scale-95"
            >
              <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                <span className="material-icons text-3xl">handyman</span>
              </div>
              <div className="text-left">
                <h2 className="text-xl font-black text-slate-900 dark:text-white">Lavador</h2>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Entradas & Produção</p>
              </div>
            </button>
          </div>
        )}

        {/* Step: Staff Selection */}
        {step === 'STAFF' && (
          <div className="space-y-6 animate-in slide-in-from-right-8 duration-500">
            <div className="flex items-center gap-4 mb-4">
              <button onClick={() => setStep('ROLE')} className="text-primary"><span className="material-icons">arrow_back</span></button>
              <h2 className="text-xl font-black">Quem está entrando?</h2>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {staffList.map(s => (
                <button 
                  key={s.id}
                  onClick={() => onLogin('LAVADOR', s)}
                  className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 flex flex-col items-center gap-3 active:scale-95 transition-all hover:border-primary shadow-lg"
                >
                  <img src={s.photo || `https://ui-avatars.com/api/?name=${s.name}&background=random`} className="w-16 h-16 rounded-2xl object-cover shadow-md" />
                  <span className="font-bold text-sm text-center line-clamp-1">{s.name.split(' ')[0]}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step: Admin Password */}
        {step === 'ADMIN_PASS' && (
          <div className="space-y-8 animate-in slide-in-from-left-8 duration-500">
            <div className="flex items-center gap-4 mb-2">
              <button onClick={() => setStep('ROLE')} className="text-primary"><span className="material-icons">arrow_back</span></button>
              <h2 className="text-xl font-black">Acesso Restrito</h2>
            </div>
            
            <div className={`space-y-6 bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl border ${error ? 'border-rose-500 animate-shake' : 'border-slate-200 dark:border-slate-800'}`}>
              <div className="text-center">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Digite sua senha PIN</p>
                <div className="flex justify-center gap-4 mb-8">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className={`w-4 h-4 rounded-full border-2 transition-all ${password.length > i ? 'bg-primary border-primary scale-125' : 'border-slate-300 dark:border-slate-700'}`}></div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
                  <button 
                    key={n}
                    onClick={() => password.length < 4 && setPassword(prev => prev + n)}
                    className="h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 text-2xl font-black hover:bg-primary hover:text-white transition-all active:scale-90"
                  >{n}</button>
                ))}
                <button onClick={() => setPassword('')} className="h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 font-bold text-xs uppercase">Limpar</button>
                <button onClick={() => password.length < 4 && setPassword(prev => prev + '0')} className="h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 text-2xl font-black hover:bg-primary hover:text-white transition-all">0</button>
                <button 
                  onClick={handleAdminAuth}
                  className={`h-16 rounded-2xl flex items-center justify-center transition-all active:scale-90 ${password.length === 4 ? 'bg-primary text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed'}`}
                >
                  <span className="material-icons">login</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-10px); }
          75% { transform: translateX(10px); }
        }
        .animate-shake { animation: shake 0.2s ease-in-out 0s 2; }
      `}</style>
    </div>
  );
};

export default LoginView;
