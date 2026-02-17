
import React, { useState, useRef } from 'react';
import { LoyaltyConfig, ClientProgress } from '../types';

interface LoyaltyViewProps {
  config: LoyaltyConfig;
  clientProgress: Record<string, ClientProgress>;
  onSave: (config: LoyaltyConfig) => void;
}

interface PrintSettings {
  mode: 'CARDS' | 'STAMPS';
  quantity: number;
  width: number;
  height: number;
}

const LoyaltyView: React.FC<LoyaltyViewProps> = ({ config, clientProgress, onSave }) => {
  const [localConfig, setLocalConfig] = useState(config);
  const [isPrinting, setIsPrinting] = useState(false);
  const [searchClient, setSearchClient] = useState('');
  const [printSettings, setPrintSettings] = useState<PrintSettings>({
    mode: 'CARDS',
    quantity: 10,
    width: 85, 
    height: 54 
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpdate = (updates: Partial<LoyaltyConfig>) => {
    setLocalConfig(prev => ({ ...prev, ...updates }));
  };

  const searchKey = searchClient.trim().toLowerCase();
  const matchedClientKey = searchKey ? Object.keys(clientProgress).find(key => {
    const progress = clientProgress[key];
    return key.toLowerCase().includes(searchKey) || 
           (progress.phone && progress.phone.includes(searchClient));
  }) : null;

  const clientData = matchedClientKey ? {
    name: matchedClientKey,
    stamps: clientProgress[matchedClientKey].stamps
  } : null;

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        handleUpdate({ companyLogo: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const themes: Record<string, string> = {
    // Sólidos
    blue: 'bg-primary',
    green: 'bg-emerald-600',
    gold: 'bg-amber-600',
    black: 'bg-slate-900',
    red: 'bg-rose-600',
    purple: 'bg-indigo-700',
    orange: 'bg-orange-500',
    pink: 'bg-pink-600',
    slate: 'bg-slate-700',
    // Degradês (Gradients)
    'grad-ocean': 'bg-gradient-to-br from-blue-600 to-indigo-900',
    'grad-forest': 'bg-gradient-to-br from-emerald-500 to-teal-800',
    'grad-sunset': 'bg-gradient-to-br from-amber-400 to-orange-600',
    'grad-stealth': 'bg-gradient-to-br from-slate-800 to-black',
    'grad-galaxy': 'bg-gradient-to-br from-purple-600 to-pink-700',
    'grad-fire': 'bg-gradient-to-br from-rose-500 to-orange-600',
    'grad-midnight': 'bg-gradient-to-br from-gray-900 via-slate-900 to-black',
    'grad-deepsea': 'bg-gradient-to-br from-cyan-600 to-blue-800',
  };

  const availableIcons = ['water_drop', 'local_car_wash', 'star', 'check_circle', 'verified', 'favorite', 'brightness_high', 'shield'];

  const renderCard = (isForPrint = false, forcedStamps?: number) => {
    const stampsToShow = forcedStamps !== undefined ? forcedStamps : (clientData ? clientData.stamps : 0);
    const displayName = clientData ? clientData.name : localConfig.companyName;

    return (
      <div 
        style={isForPrint ? { 
          width: `${printSettings.width}mm`, 
          height: `${printSettings.height}mm`,
          '--card-width': `${printSettings.width}mm` 
        } as any : {}}
        className={`relative overflow-hidden flex flex-col justify-between transition-all duration-500 ${themes[localConfig.theme] || themes.blue} ${
          isForPrint ? 'rounded-lg p-4' : 'min-h-[240px] w-full rounded-[2.5rem] p-8 shadow-2xl shadow-primary/20'
        }`}
      >
        <div className="absolute inset-0 opacity-10 pointer-events-none overflow-hidden">
          <span className={`material-icons absolute -right-6 -bottom-6 rotate-12 ${isForPrint ? 'text-6xl' : 'text-9xl'}`}>
            {localConfig.stampIcon}
          </span>
        </div>

        <div className="relative z-10 h-full flex flex-col justify-between text-white">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div className={`bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/30 shadow-inner ${isForPrint ? 'w-8 h-8' : 'w-14 h-14'}`}>
                {localConfig.companyLogo ? (
                  <img src={localConfig.companyLogo} className="w-full h-full object-cover rounded-xl" alt="Logo" />
                ) : (
                  <span className={`material-icons ${isForPrint ? 'text-lg' : 'text-3xl'}`}>local_car_wash</span>
                )}
              </div>
              <div className="text-left">
                <h3 className={`font-black leading-tight ${isForPrint ? 'text-[10px]' : 'text-xl'}`}>{displayName}</h3>
                <p className={`font-bold opacity-70 uppercase tracking-widest ${isForPrint ? 'text-[6px]' : 'text-[10px]'}`}>
                  {clientData ? 'Cartão Fidelidade Digital' : localConfig.companySubtitle}
                </p>
              </div>
            </div>
            <div className={`bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 ${isForPrint ? 'p-1' : 'p-2'}`}>
              <span className={`material-icons text-white ${isForPrint ? 'text-sm' : 'text-xl'}`}>verified</span>
            </div>
          </div>

          <div className={`grid grid-cols-5 ${isForPrint ? 'gap-2 my-2' : 'gap-4 my-6'}`}>
            {[...Array(localConfig.stampsRequired)].map((_, i) => (
              <div key={i} className={`aspect-square rounded-full border-2 transition-all flex items-center justify-center ${
                i < stampsToShow 
                ? 'bg-white text-slate-900 border-white shadow-lg scale-110 z-10' 
                : 'bg-black/10 border-dashed border-white/30'
              }`}>
                {i < stampsToShow ? (
                  <span className={`material-icons ${isForPrint ? 'text-xs' : 'text-2xl'} ${localConfig.theme.includes('grad') ? 'text-primary' : ''}`}>
                    {localConfig.stampIcon}
                  </span>
                ) : i === localConfig.stampsRequired - 1 ? (
                  <span className={`material-icons text-amber-400 ${isForPrint ? 'text-xs' : 'text-xl'} opacity-60`}>card_giftcard</span>
                ) : null}
              </div>
            ))}
          </div>

          <div className={`flex justify-between items-end border-t border-white/10 ${isForPrint ? 'pt-2' : 'pt-4'}`}>
            <div className="text-left">
              <p className={`font-bold opacity-60 uppercase ${isForPrint ? 'text-[6px]' : 'text-[10px]'}`}>Prêmio ao completar</p>
              <p className={`font-black italic ${isForPrint ? 'text-[8px]' : 'text-sm'}`}>{localConfig.rewardDescription}</p>
            </div>
            {!isForPrint && clientData && (
               <p className="text-[10px] font-black bg-white/20 px-3 py-1 rounded-full">{stampsToShow}/{localConfig.stampsRequired} Selos</p>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-950 min-h-screen pb-32">
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md pt-12 pb-6 px-6 border-b border-slate-200 dark:border-slate-800">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white">Fidelidade</h1>
            <p className="text-sm text-slate-500 font-medium">Gestão de recompensas e clientes.</p>
          </div>
          
          <div className="flex flex-col items-end gap-2">
            <span className={`text-[10px] font-black uppercase tracking-widest ${localConfig.isActive ? 'text-emerald-500' : 'text-rose-500'}`}>
              {localConfig.isActive ? 'Campanha Ativa' : 'Campanha Pausada'}
            </span>
            <button 
              onClick={() => handleUpdate({ isActive: !localConfig.isActive })}
              className={`w-14 h-7 rounded-full p-1 transition-all flex items-center shadow-inner ${localConfig.isActive ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`}
            >
              <div className={`w-5 h-5 bg-white rounded-full shadow-lg transform transition-all ${localConfig.isActive ? 'translate-x-7' : 'translate-x-0'}`}></div>
            </button>
          </div>
        </div>

        <div className="relative group">
          <span className={`material-icons absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${searchClient ? 'text-primary' : 'text-slate-400'}`}>
            {searchClient ? 'person_search' : 'search'}
          </span>
          <input 
            className="w-full pl-12 pr-12 py-4 bg-slate-100 dark:bg-slate-800 border-none rounded-2xl shadow-sm focus:ring-2 focus:ring-primary text-sm font-bold transition-all" 
            placeholder="Buscar Cliente pelo Nome ou WhatsApp..." 
            value={searchClient}
            onChange={e => setSearchClient(e.target.value)}
          />
          {searchClient && (
            <button onClick={() => setSearchClient('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-500">
              <span className="material-icons">cancel</span>
            </button>
          )}
        </div>
      </header>

      <main className="px-6 mt-8 space-y-10">
        <section>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400">
              {searchClient ? (clientData ? 'Cartão do Cliente' : 'Nenhum resultado') : 'Modelo de Cartão'}
            </h2>
            <button 
              onClick={() => setIsPrinting(true)}
              className="text-[10px] font-black bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-primary hover:text-white transition-all shadow-sm"
            >
              <span className="material-icons text-xs">print</span> PRODUÇÃO FÍSICA
            </button>
          </div>
          
          <div className="max-w-md mx-auto sm:mx-0">
            {renderCard()}
          </div>
          
          {searchClient && !clientData && (
             <div className="mt-4 p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 max-w-md">
                <span className="material-icons">info</span>
                <p className="text-xs font-bold">Cliente não encontrado na base de dados.</p>
             </div>
          )}
        </section>

        <section className="space-y-8 pb-10">
           <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 border-b border-slate-200 dark:border-slate-800 pb-2">Personalização</h2>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-8">
                 <div>
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 block">Estilos em Degradê (Escalada)</label>
                   <div className="grid grid-cols-4 gap-3">
                     {Object.keys(themes).filter(k => k.startsWith('grad-')).map((t) => (
                       <button 
                         key={t}
                         onClick={() => handleUpdate({ theme: t })}
                         className={`h-12 rounded-xl transition-all border-2 flex items-center justify-center ${
                           localConfig.theme === t ? 'border-primary shadow-lg scale-110 z-10' : 'border-transparent'
                         } ${themes[t]}`}
                       >
                         {localConfig.theme === t && <span className="material-icons text-white text-xs">check</span>}
                       </button>
                     ))}
                   </div>
                 </div>

                 <div>
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 block">Cores Sólidas</label>
                   <div className="grid grid-cols-5 gap-3">
                     {Object.keys(themes).filter(k => !k.startsWith('grad-')).map((t) => (
                       <button 
                         key={t}
                         onClick={() => handleUpdate({ theme: t })}
                         className={`h-10 rounded-lg transition-all border-2 flex items-center justify-center ${
                           localConfig.theme === t ? 'border-primary shadow-md scale-105' : 'border-transparent'
                         } ${themes[t]}`}
                       >
                         {localConfig.theme === t && <span className="material-icons text-white text-xs">check</span>}
                       </button>
                     ))}
                   </div>
                 </div>

                 <div>
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Marca de Carimbo</label>
                   <div className="flex flex-wrap gap-2 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
                     {availableIcons.map(icon => (
                       <button 
                         key={icon}
                         onClick={() => handleUpdate({ stampIcon: icon })}
                         className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
                           localConfig.stampIcon === icon ? 'bg-primary text-white scale-110 shadow-md' : 'bg-slate-50 dark:bg-slate-800 text-slate-400 hover:bg-slate-100'
                         }`}
                       >
                         <span className="material-icons text-sm">{icon}</span>
                       </button>
                     ))}
                   </div>
                 </div>
              </div>

              <div className="space-y-6">
                 <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
                    <div className="space-y-2">
                       <span className="text-[10px] font-black text-slate-400 uppercase">Qual o Prêmio?</span>
                       <input 
                         className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl p-4 text-sm font-bold text-primary" 
                         value={localConfig.rewardDescription} 
                         onChange={e => handleUpdate({ rewardDescription: e.target.value })} 
                       />
                    </div>
                    <div className="flex items-center justify-between">
                       <span className="text-[10px] font-black text-slate-400 uppercase">Total de Selos</span>
                       <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800 rounded-xl p-1">
                          <button onClick={() => handleUpdate({ stampsRequired: Math.max(5, localConfig.stampsRequired - 1)})} className="w-8 h-8 bg-white dark:bg-slate-700 rounded-lg shadow-sm font-black active:scale-90">-</button>
                          <span className="text-sm font-black w-6 text-center">{localConfig.stampsRequired}</span>
                          <button onClick={() => handleUpdate({ stampsRequired: Math.min(10, localConfig.stampsRequired + 1)})} className="w-8 h-8 bg-white dark:bg-slate-700 rounded-lg shadow-sm font-black active:scale-90">+</button>
                       </div>
                    </div>
                 </div>

                 <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center gap-4">
                       <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden flex items-center justify-center cursor-pointer group" onClick={() => fileInputRef.current?.click()}>
                          {localConfig.companyLogo ? (
                             <img src={localConfig.companyLogo} className="w-full h-full object-cover group-hover:opacity-50 transition-opacity" alt="Logo" />
                          ) : (
                             <span className="material-icons text-slate-300">add_a_photo</span>
                          )}
                       </div>
                       <div className="flex-1">
                          <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Logotipo</p>
                          <button onClick={() => fileInputRef.current?.click()} className="text-[10px] font-black text-primary bg-primary/10 px-3 py-1.5 rounded-lg hover:bg-primary hover:text-white transition-all">ALTERAR LOGO</button>
                          <input type="file" ref={fileInputRef} onChange={handleLogoUpload} className="hidden" accept="image/*" />
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        </section>
      </main>

      <button 
        onClick={() => onSave(localConfig)}
        className="fixed bottom-28 right-8 w-16 h-16 bg-primary text-white rounded-2xl shadow-2xl shadow-primary/40 flex items-center justify-center z-40 hover:scale-110 active:scale-90 transition-all group"
      >
        <span className="material-icons text-3xl">save</span>
        <div className="absolute -top-12 right-0 bg-slate-900 text-white text-[10px] font-black px-4 py-2 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none uppercase tracking-widest">
           Salvar Alterações
        </div>
      </button>

      {/* MODAL DE IMPRESSÃO - SELOS INDIVIDUAIS AJUSTADOS PARA 14MM */}
      {isPrinting && (
        <div className="print-modal-container fixed inset-0 z-[100] bg-white dark:bg-slate-950 flex flex-col items-center overflow-y-auto animate-in fade-in duration-300">
          <div className="no-print sticky top-0 w-full z-[110] bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 p-4 flex items-center justify-between px-8">
             <div className="flex items-center gap-4">
                <button onClick={() => setIsPrinting(false)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800">
                   <span className="material-icons">close</span>
                </button>
                <h3 className="font-black text-xl tracking-tight">Preparar Impressão</h3>
             </div>
             <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl">
                   <button onClick={() => setPrintSettings({...printSettings, mode: 'CARDS'})} className={`px-4 py-2 rounded-xl text-[10px] font-black ${printSettings.mode === 'CARDS' ? 'bg-primary text-white shadow-md' : 'text-slate-400'}`}>CARTÕES</button>
                   <button onClick={() => setPrintSettings({...printSettings, mode: 'STAMPS', quantity: 48})} className={`px-4 py-2 rounded-xl text-[10px] font-black ${printSettings.mode === 'STAMPS' ? 'bg-primary text-white shadow-md' : 'text-slate-400'}`}>SELOS</button>
                </div>
                <button onClick={() => window.print()} className="bg-primary text-white px-8 py-3 rounded-2xl font-black flex items-center gap-2 shadow-lg shadow-primary/20 active:scale-95 transition-all">
                   <span className="material-icons">print</span> IMPRIMIR
                </button>
             </div>
          </div>

          <div className="py-12 flex justify-center w-full">
            <div className="a4-sheet bg-white shadow-2xl p-8" style={{ width: '210mm', minHeight: '297mm' }}>
              <div className="print-grid" style={{ 
                display: 'grid', 
                gridTemplateColumns: printSettings.mode === 'STAMPS' ? 'repeat(auto-fill, 14mm)' : `repeat(auto-fill, ${printSettings.width}mm)`,
                gap: printSettings.mode === 'STAMPS' ? '5mm' : '5mm',
                justifyContent: 'center'
              }}>
                {[...Array(printSettings.quantity)].map((_, i) => (
                  <React.Fragment key={i}>
                    {printSettings.mode === 'CARDS' ? renderCard(true, 0) : (
                      <div 
                        style={{ width: '14mm', height: '14mm' }} 
                        className={`rounded-full flex items-center justify-center ${themes[localConfig.theme] || themes.blue} shadow-sm aspect-square border border-white/20`}
                      >
                        <span className="material-icons text-white" style={{ fontSize: '7mm' }}>{localConfig.stampIcon}</span>
                      </div>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoyaltyView;
