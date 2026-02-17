
import React, { useState } from 'react';
import { Wash, UserRole, LoyaltyConfig, ClientProgress } from '../types';

interface WashesViewProps {
  washes: Wash[];
  onAdd: () => void;
  onToggleStatus: (id: string) => void;
  onFinalize: (id: string) => void;
  loyaltyConfig: LoyaltyConfig;
  clientLoyalty: Record<string, ClientProgress>;
  userRole?: UserRole;
}

const WashesView: React.FC<WashesViewProps> = ({ washes, onAdd, onToggleStatus, onFinalize, loyaltyConfig, clientLoyalty, userRole = 'ADMIN' }) => {
  const [filter, setFilter] = useState<'ONGOING' | 'COMPLETED'>('ONGOING');
  const [search, setSearch] = useState('');
  const [sharingWash, setSharingWash] = useState<Wash | null>(null);

  const filteredWashes = washes.filter(w => {
    const matchesStatus = filter === 'ONGOING' ? w.status !== 'PAID' : w.status === 'PAID';
    const matchesSearch = w.clientName.toLowerCase().includes(search.toLowerCase()) || 
                          w.plate.toLowerCase().includes(search.toLowerCase()) ||
                          (w.model && w.model.toLowerCase().includes(search.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  const handleCompleteAndShare = (wash: Wash) => {
    onFinalize(wash.id);
    setSharingWash(wash);
  };

  const sendWhatsApp = (wash: Wash) => {
    const clientKey = wash.clientPhone || wash.clientName;
    const progress = clientLoyalty[clientKey] || { stamps: 0 };
    const nextStamps = progress.stamps;
    
    const visualProgress = "■".repeat(nextStamps) + "□".repeat(loyaltyConfig.stampsRequired - nextStamps);
    const vehicleDesc = wash.model ? `${wash.model} (${wash.plate})` : wash.plate;
    const message = `Olá ${wash.clientName}! 🚗\n\nSua lavagem do ${vehicleDesc} no *${loyaltyConfig.companyName}* está pronta!\n\n✨ *FIDELIDADE:* Você ganhou +1 selo!\n📊 *PROGRESSO:* [${visualProgress}] ${nextStamps}/${loyaltyConfig.stampsRequired}\n🎁 *PRÊMIO:* ${loyaltyConfig.rewardDescription}\n\nAgradecemos a preferência!`;
    
    const encodedMsg = encodeURIComponent(message);
    const phone = wash.clientPhone?.replace(/\D/g, '');
    window.open(`https://wa.me/55${phone}?text=${encodedMsg}`, '_blank');
  };

  const themes: Record<string, string> = {
    blue: 'bg-primary',
    green: 'bg-emerald-600',
    gold: 'bg-amber-600',
    black: 'bg-slate-900',
    red: 'bg-rose-600',
    purple: 'bg-indigo-700',
    'grad-ocean': 'bg-gradient-to-br from-blue-600 to-indigo-900',
    'grad-forest': 'bg-gradient-to-br from-emerald-500 to-teal-800',
    'grad-sunset': 'bg-gradient-to-br from-amber-400 to-orange-600',
    'grad-stealth': 'bg-gradient-to-br from-slate-800 to-black',
    'grad-galaxy': 'bg-gradient-to-br from-purple-600 to-pink-700',
  };

  return (
    <div className="w-full min-h-screen">
      <header className="pt-12 pb-6 px-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white">Lavagens</h1>
            <p className="text-sm text-slate-500 font-medium">Controle seu pátio em tempo real.</p>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="relative group">
            <span className="material-icons absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">search</span>
            <input 
              className="w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-900 border-none rounded-2xl shadow-sm focus:ring-2 focus:ring-primary text-sm font-bold transition-all" 
              placeholder="Buscar por placa, modelo ou cliente..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2 p-1.5 bg-slate-200/50 dark:bg-slate-800 rounded-2xl">
            <button 
              onClick={() => setFilter('ONGOING')}
              className={`flex-1 py-3 text-[10px] font-black rounded-xl transition-all uppercase tracking-widest ${filter === 'ONGOING' ? 'bg-white dark:bg-slate-700 shadow-md text-primary' : 'text-slate-500'}`}
            >
              No Pátio
            </button>
            <button 
              onClick={() => setFilter('COMPLETED')}
              className={`flex-1 py-3 text-[10px] font-black rounded-xl transition-all uppercase tracking-widest ${filter === 'COMPLETED' ? 'bg-white dark:bg-slate-700 shadow-md text-primary' : 'text-slate-500'}`}
            >
              Concluídas
            </button>
          </div>
        </div>
      </header>

      <main className="px-6 pb-32">
        <div className="grid grid-cols-1 gap-6">
          {filteredWashes.map(wash => (
            <div key={wash.id} className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 shadow-sm border border-slate-100 dark:border-slate-800 animate-in fade-in slide-in-from-bottom-4">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <span className="material-icons text-primary text-3xl">
                      {wash.vehicleType === 'moto' ? 'two_wheeler' : wash.vehicleType === 'caminhao' ? 'local_shipping' : 'directions_car'}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-black text-xl leading-none mb-2">{wash.clientName}</h3>
                    <div className="flex flex-wrap items-center gap-2">
                       <span className="text-[10px] font-mono font-black bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-lg text-primary">{wash.plate}</span>
                       {wash.model && <span className="text-[10px] font-bold text-slate-500 uppercase">{wash.model}</span>}
                       <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">• {wash.assignedStaff.split(' ')[0]}</span>
                    </div>
                  </div>
                </div>
                <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                    wash.status === 'PAID' ? 'bg-emerald-100 text-emerald-600' : 'bg-orange-100 text-orange-600'
                  }`}>
                  {wash.status === 'PAID' ? 'Pago' : 'Pendente'}
                </div>
              </div>
              
              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 mb-6">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Serviço Selecionado</p>
                <p className="font-bold text-slate-700 dark:text-slate-300">{wash.type}</p>
              </div>

              <div className="flex items-center justify-between">
                <div>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Valor</p>
                   <p className="text-2xl font-black text-primary">R$ {wash.price.toFixed(2)}</p>
                </div>
                {wash.status === 'PENDING' && (
                  <button 
                    onClick={() => handleCompleteAndShare(wash)}
                    className="bg-primary text-white px-8 py-4 rounded-2xl font-black text-xs shadow-xl shadow-primary/30 active:scale-95 transition-all flex items-center gap-2"
                  >
                    <span className="material-icons text-sm">check_circle</span>
                    FINALIZAR
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {filteredWashes.length === 0 && (
          <div className="py-24 text-center">
            <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="material-icons text-4xl text-slate-300">history</span>
            </div>
            <p className="font-bold text-slate-400">Nenhum registro para exibir.</p>
          </div>
        )}
      </main>

      <button 
        onClick={onAdd}
        className="fixed bottom-32 right-8 w-18 h-18 bg-primary text-white rounded-[1.5rem] shadow-2xl shadow-primary/40 flex items-center justify-center z-40 hover:scale-110 active:scale-90 transition-all"
      >
        <span className="material-icons text-4xl">add</span>
      </button>

      {sharingWash && (
        <div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-6">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-t-[2.5rem] sm:rounded-[2.5rem] overflow-hidden shadow-2xl animate-in slide-in-from-bottom-20">
            <div className="p-10 text-center">
              <div className="w-20 h-20 bg-emerald-100 text-emerald-500 rounded-3xl flex items-center justify-center mx-auto mb-6 rotate-12">
                <span className="material-icons text-4xl">verified</span>
              </div>
              <h2 className="text-3xl font-black tracking-tight">Pronto para Entrega!</h2>
              <p className="text-sm text-slate-500 mt-2 font-medium">A lavagem foi concluída e o ponto fidelidade foi creditado.</p>
            </div>

            <div className="px-10 pb-12 space-y-4">
              <button 
                onClick={() => sendWhatsApp(sharingWash)}
                className="w-full bg-emerald-500 text-white py-5 rounded-2xl font-black shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-3 active:scale-95 transition-all"
              >
                <span className="material-icons">whatsapp</span>
                NOTIFICAR CLIENTE
              </button>
              <button 
                onClick={() => setSharingWash(null)}
                className="w-full py-4 text-slate-400 font-black text-xs uppercase tracking-widest"
              >
                FECHAR JANELA
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WashesView;
