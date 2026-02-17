
import React, { useState, useEffect } from 'react';
import { View, Wash, Staff, Expense, LoyaltyConfig, UserRole, ClientProgress } from './types.ts';
import { db } from './database.ts';
import WashesView from './views/WashesView.tsx';
import DashboardView from './views/DashboardView.tsx';
import FinanceView from './views/FinanceView.tsx';
import LoyaltyView from './views/LoyaltyView.tsx';
import StaffView from './views/StaffView.tsx';
import NewWashView from './views/NewWashView.tsx';
import LoginView from './views/LoginView.tsx';

const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [currentUser, setCurrentUser] = useState<Staff | null>(null);

  const [currentView, setCurrentView] = useState<View>(View.WASHES);
  const [washes, setWashes] = useState<Wash[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loyalty, setLoyalty] = useState<LoyaltyConfig | null>(null);
  const [clientLoyalty, setClientLoyalty] = useState<Record<string, ClientProgress>>({});

  useEffect(() => {
    const initApp = async () => {
      try {
        await db.init();
        const [w, s, e, l, p] = await Promise.all([
          db.getWashes(),
          db.getStaff(),
          db.getExpenses(),
          db.getLoyalty(),
          db.getClientProgress()
        ]);
        setWashes(w);
        setStaff(s);
        setExpenses(e);
        setLoyalty(l);
        setClientLoyalty(p);
      } catch (err: any) {
        console.error("Falha ao iniciar app:", err);
      } finally {
        setIsLoading(false);
      }
    };
    initApp();
  }, []);

  const handleLogin = (role: UserRole, staffMember?: Staff) => {
    setUserRole(role);
    if (staffMember) setCurrentUser(staffMember);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserRole(null);
    setCurrentUser(null);
    setCurrentView(View.WASHES);
  };

  const handleAddWash = async (newWash: Omit<Wash, 'id'>) => {
    setIsSyncing(true);
    try {
      const washWithId = { ...newWash, id: Math.random().toString(36).substr(2, 9) };
      await db.saveWash(washWithId);
      setWashes([washWithId, ...washes]);
      
      const assigned = staff.find(s => s.name === newWash.assignedStaff);
      if (assigned) {
        const maxPos = staff.length > 0 ? Math.max(...staff.map(s => s.queuePosition)) : 0;
        const updatedStaff = { ...assigned, queuePosition: maxPos + 1 };
        await db.saveStaff(updatedStaff);
        
        const freshStaff = await db.getStaff();
        setStaff(freshStaff);
      }
      
      setCurrentView(View.WASHES);
    } catch (e) {
      alert("Erro ao salvar lavagem.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleUpdateWashStatus = async (id: string) => {
    setIsSyncing(true);
    try {
      const wash = washes.find(w => w.id === id);
      if (!wash) return;
      const updated: Wash = { ...wash, status: wash.status === 'PAID' ? 'PENDING' : 'PAID' };
      await db.saveWash(updated);
      setWashes(prev => prev.map(w => w.id === id ? updated : w));
    } catch (e) {
      alert("Erro ao atualizar status.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleFinalizeWash = async (id: string) => {
    setIsSyncing(true);
    try {
      const wash = washes.find(w => w.id === id);
      if (!wash || !loyalty) return;

      const updatedWash = { ...wash, status: 'PAID' as const };
      await db.saveWash(updatedWash);
      setWashes(prev => prev.map(w => w.id === id ? updatedWash : w));

      if (loyalty.isActive) {
        const clientKey = wash.clientPhone || wash.clientName;
        const current = clientLoyalty[clientKey] || { stamps: 0, lastWashDate: '', phone: wash.clientPhone || '' };
        const newStamps = current.stamps + 1;
        const updatedProgress = {
          ...current,
          stamps: newStamps > loyalty.stampsRequired ? 1 : newStamps,
          lastWashDate: wash.date,
          phone: wash.clientPhone || current.phone
        };
        await db.saveClientProgress(clientKey, updatedProgress);
        setClientLoyalty(prev => ({ ...prev, [clientKey]: updatedProgress }));
      }
    } catch (e) {
      alert("Erro ao finalizar.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleAddExpense = async (exp: Omit<Expense, 'id'>) => {
    setIsSyncing(true);
    try {
      const newExp = { ...exp, id: Math.random().toString(36).substr(2, 9) };
      await db.saveExpense(newExp);
      setExpenses([newExp, ...expenses]);
    } catch (e) {
      alert("Erro ao salvar despesa.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleAddStaff = async (name: string, role: string) => {
    setIsSyncing(true);
    try {
      const maxPos = staff.length > 0 ? Math.max(...staff.map(s => s.queuePosition)) : 0;
      const newMember: Staff = {
        id: Math.random().toString(36).substr(2, 9),
        name,
        role,
        daysWorked: 0,
        dailyRate: 45,
        commission: 0,
        unpaid: 0,
        queuePosition: maxPos + 1,
        isActive: true
      };
      await db.saveStaff(newMember);
      setStaff([...staff, newMember].sort((a,b) => a.queuePosition - b.queuePosition));
    } catch (e) {
      alert("Erro ao cadastrar membro.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleUpdateStaffQueue = async (staffId: string, action: 'TOP' | 'BOTTOM' | 'TOGGLE') => {
    setIsSyncing(true);
    try {
      const member = staff.find(s => s.id === staffId);
      if (!member) return;

      let updated = { ...member };
      if (action === 'TOP') {
        const minPos = Math.min(...staff.map(s => s.queuePosition));
        updated.queuePosition = minPos - 1;
      } else if (action === 'BOTTOM') {
        const maxPos = Math.max(...staff.map(s => s.queuePosition));
        updated.queuePosition = maxPos + 1;
      } else if (action === 'TOGGLE') {
        updated.isActive = !member.isActive;
      }

      await db.saveStaff(updated);
      const freshStaff = await db.getStaff();
      setStaff(freshStaff);
    } catch (e) {
      alert("Erro ao atualizar fila.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSaveLoyalty = async (config: LoyaltyConfig) => {
    setIsSyncing(true);
    try {
      await db.saveLoyalty(config);
      setLoyalty(config);
    } catch (e) {
      alert("Erro ao salvar fidelidade.");
    } finally {
      setIsSyncing(false);
    }
  };

  const renderView = () => {
    if (!loyalty) return null;
    switch (currentView) {
      case View.WASHES:
        return <WashesView washes={washes} onAdd={() => setCurrentView(View.NEW_WASH)} onToggleStatus={handleUpdateWashStatus} onFinalize={handleFinalizeWash} loyaltyConfig={loyalty} clientLoyalty={clientLoyalty} userRole={userRole || 'LAVADOR'} />;
      case View.DASHBOARD:
        return <DashboardView washes={washes} expenses={expenses} staff={staff} />;
      case View.FINANCE:
        return <FinanceView expenses={expenses} washes={washes} onAddExpense={handleAddExpense} />;
      case View.LOYALTY:
        return <LoyaltyView config={loyalty} clientProgress={clientLoyalty} onSave={handleSaveLoyalty} />;
      case View.STAFF:
        return <StaffView staff={staff} washes={washes} onAddStaff={handleAddStaff} onUpdateQueue={handleUpdateStaffQueue} onUpdateEarnings={async (id, days, rate, commission) => {
            const s = staff.find(x => x.id === id);
            if (s) {
              const updated = { ...s, daysWorked: days, dailyRate: rate, commission: commission, unpaid: (days * rate) + commission };
              await db.saveStaff(updated);
              setStaff(prev => prev.map(x => x.id === id ? updated : x));
            }
          }} onPay={async (id) => {
            const s = staff.find(x => x.id === id);
            if (s) {
              const updated = { ...s, unpaid: 0, daysWorked: 0, commission: 0 };
              await db.saveStaff(updated);
              setStaff(prev => prev.map(x => x.id === id ? updated : x));
            }
          }} />;
      case View.NEW_WASH:
        return <NewWashView onCancel={() => setCurrentView(View.WASHES)} onConfirm={handleAddWash} staff={staff} loyaltyConfig={loyalty} clientLoyalty={clientLoyalty} />;
      default:
        return null;
    }
  };

  if (isLoading) return <div className="fixed inset-0 bg-primary flex items-center justify-center text-white font-black">CARREGANDO...</div>;
  if (!isAuthenticated) return <LoginView staffList={staff} onLogin={handleLogin} />;

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950 font-display text-slate-900 dark:text-slate-100">
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100]">
        {isSyncing && (
          <div className="bg-slate-900/90 text-white px-6 py-2 rounded-full text-[10px] font-black uppercase flex items-center gap-2 shadow-2xl backdrop-blur-md">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            Sincronizando
          </div>
        )}
      </div>

      <div className="fixed top-6 right-6 z-[60]">
        <button onClick={handleLogout} className="bg-white dark:bg-slate-900 shadow-xl border border-slate-200 dark:border-slate-800 px-4 py-2 rounded-2xl flex items-center gap-3 active:scale-90 transition-all">
          <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
            <img src={userRole === 'ADMIN' ? 'https://picsum.photos/seed/admin/100' : (currentUser?.photo || `https://ui-avatars.com/api/?name=${currentUser?.name}`)} className="w-full h-full object-cover" />
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Status: Online</p>
            <p className="text-sm font-bold text-slate-900 dark:text-white">{userRole === 'ADMIN' ? 'Gerente' : currentUser?.name.split(' ')[0]}</p>
          </div>
          <span className="material-icons text-slate-300">logout</span>
        </button>
      </div>

      <main className="flex-1 pb-32 max-w-5xl mx-auto w-full px-4 sm:px-0">{renderView()}</main>

      {currentView !== View.NEW_WASH && (
        <div className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 z-50">
          <nav className="max-w-2xl mx-auto px-6 py-4 pb-8 flex justify-between items-center">
            {[
              { v: View.WASHES, icon: 'local_car_wash', label: 'Lavagens', roles: ['ADMIN', 'LAVADOR'] },
              { v: View.FINANCE, icon: 'payments', label: 'Finanças', roles: ['ADMIN'] },
              { v: View.DASHBOARD, icon: 'dashboard', label: 'Painel', roles: ['ADMIN'] },
              { v: View.LOYALTY, icon: 'loyalty', label: 'Fidelidade', roles: ['ADMIN'] },
              { v: View.STAFF, icon: 'badge', label: 'Equipe', roles: ['ADMIN'] }
            ].filter(item => item.roles.includes(userRole!)).map(item => (
              <button key={item.v} onClick={() => setCurrentView(item.v)} className={`flex flex-col items-center gap-1.5 transition-all ${currentView === item.v ? 'text-primary' : 'text-slate-400'}`}>
                <div className={`p-2 rounded-xl ${currentView === item.v ? 'bg-primary/10' : 'bg-transparent'}`}>
                   <span className="material-icons">{item.icon}</span>
                </div>
                <span className="text-[10px] font-bold">{item.label}</span>
              </button>
            ))}
          </nav>
        </div>
      )}
    </div>
  );
};

export default App;
