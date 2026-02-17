
import React, { useState } from 'react';
import { Wash, Staff, LoyaltyConfig, ClientProgress } from '../types';

interface NewWashViewProps {
  onCancel: () => void;
  onConfirm: (wash: Omit<Wash, 'id'>) => void;
  staff: Staff[];
  loyaltyConfig: LoyaltyConfig;
  clientLoyalty: Record<string, ClientProgress>;
}

const NewWashView: React.FC<NewWashViewProps> = ({ onCancel, onConfirm, staff, loyaltyConfig, clientLoyalty }) => {
  const nextInLine = staff.filter(s => s.isActive).sort((a,b) => a.queuePosition - b.queuePosition)[0];

  const [formData, setFormData] = useState({
    clientName: '',
    phone: '',
    vehicleType: 'carro' as Wash['vehicleType'],
    plate: '',
    model: '',
    washType: 'Interna & Externa (R$ 45)',
    assignedStaff: nextInLine ? nextInLine.name : '',
    price: 45
  });

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm({
      clientName: formData.clientName || 'Cliente Avulso',
      clientPhone: formData.phone,
      plate: formData.plate || 'SEM-PLACA',
      model: formData.model,
      type: formData.washType,
      status: 'PENDING',
      assignedStaff: formData.assignedStaff || 'Sem Atribuição',
      price: formData.price,
      services: [formData.washType],
      vehicleType: formData.vehicleType,
      date: new Date().toISOString().split('T')[0]
    });
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-950 min-h-screen">
      <header className="px-6 py-10 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white">Nova Entrada</h1>
          <p className="text-sm text-slate-500 font-medium">Cadastre um novo veículo agora.</p>
        </div>
        <button onClick={onCancel} className="w-14 h-14 flex items-center justify-center rounded-2xl bg-white dark:bg-slate-900 shadow-sm border border-slate-100 dark:border-slate-800 text-rose-500 active:scale-90 transition-all">
          <span className="material-icons">close</span>
        </button>
      </header>

      <main className="px-6 pb-40">
        <form onSubmit={handleRegister} className="max-w-xl mx-auto space-y-10">
          
          <div className="space-y-4">
            <h2 className="text-xs font-black text-primary uppercase tracking-[0.2em] ml-1">Tipo de Veículo</h2>
            <div className="flex gap-4">
              {[
                { id: 'carro', icon: 'directions_car', label: 'Carro' },
                { id: 'moto', icon: 'two_wheeler', label: 'Moto' },
                { id: 'caminhao', icon: 'local_shipping', label: 'Pesado' }
              ].map((v) => (
                <button 
                  key={v.id} 
                  type="button" 
                  onClick={() => setFormData({...formData, vehicleType: v.id as any})} 
                  className={`flex-1 flex flex-col items-center justify-center gap-3 py-6 rounded-[2rem] border-2 transition-all ${
                    formData.vehicleType === v.id 
                    ? 'bg-primary text-white border-primary shadow-xl shadow-primary/20 scale-105' 
                    : 'bg-white dark:bg-slate-900 border-transparent text-slate-400'
                  }`}
                >
                  <span className="material-icons text-3xl">{v.icon}</span>
                  <span className="text-[10px] font-black uppercase tracking-widest">{v.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-6 bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm">
            <h2 className="text-xs font-black text-primary uppercase tracking-[0.2em] ml-1">Dados do Veículo</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Placa</label>
                <input 
                  className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl py-5 px-6 font-black uppercase text-xl tracking-widest focus:ring-2 focus:ring-primary text-primary" 
                  placeholder="ABC-1234" 
                  value={formData.plate} 
                  onChange={e => setFormData({...formData, plate: e.target.value.toUpperCase()})} 
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Modelo</label>
                <input 
                  className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl py-5 px-6 font-bold focus:ring-2 focus:ring-primary" 
                  placeholder="Ex: Civic G10" 
                  value={formData.model} 
                  onChange={e => setFormData({...formData, model: e.target.value})} 
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Cliente / Nome</label>
              <input 
                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl py-5 px-6 font-bold focus:ring-2 focus:ring-primary" 
                placeholder="Nome do cliente" 
                value={formData.clientName} 
                onChange={e => setFormData({...formData, clientName: e.target.value})} 
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">WhatsApp</label>
              <input 
                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl py-5 px-6 font-bold focus:ring-2 focus:ring-primary" 
                placeholder="(00) 00000-0000" 
                type="tel" 
                value={formData.phone} 
                onChange={e => setFormData({...formData, phone: e.target.value})} 
              />
            </div>
          </div>

          <div className="space-y-6 bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tipo de Serviço</label>
              <select 
                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl py-5 px-6 font-bold focus:ring-2 focus:ring-primary" 
                value={formData.washType} 
                onChange={e => setFormData({...formData, washType: e.target.value})}
              >
                <option>Exterior Padrão (R$ 25)</option>
                <option>Interna & Externa (R$ 45)</option>
                <option>Detalhamento Premium (R$ 85)</option>
                <option>Lavagem de Motor (R$ 30)</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Lavador (Responsável)</label>
              <select 
                className="w-full bg-primary/5 dark:bg-slate-800 border-2 border-primary/20 rounded-2xl py-5 px-6 font-black text-primary focus:ring-2 focus:ring-primary appearance-none" 
                value={formData.assignedStaff} 
                onChange={e => setFormData({...formData, assignedStaff: e.target.value})}
              >
                <option value="">-- Selecione --</option>
                {staff.filter(s => s.isActive).map(s => (
                  <option key={s.id} value={s.name}>
                    {s.name} {s.id === nextInLine?.id ? '⭐' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2 text-center pt-4">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Preço Final</p>
               <div className="relative inline-block">
                 <span className="absolute -left-8 top-1/2 -translate-y-1/2 font-black text-slate-400">R$</span>
                 <input 
                  type="number"
                  className="bg-transparent border-none text-5xl font-black text-primary text-center focus:ring-0 w-48"
                  value={formData.price}
                  onChange={e => setFormData({...formData, price: Number(e.target.value)})}
                 />
               </div>
            </div>
          </div>

          <button 
            type="submit" 
            className="w-full bg-primary text-white font-black py-6 rounded-[2rem] shadow-2xl shadow-primary/40 active:scale-95 transition-all text-xl flex items-center justify-center gap-4"
          >
            <span className="material-icons text-3xl">offline_pin</span>
            CADASTRAR LAVAGEM
          </button>
        </form>
      </main>
    </div>
  );
};

export default NewWashView;
