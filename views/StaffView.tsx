
import React, { useState } from 'react';
import { Staff, Wash } from '../types';

interface StaffViewProps {
  staff: Staff[];
  washes: Wash[];
  onPay: (id: string) => void;
  onAddStaff: (name: string, role: string) => void;
  onUpdateQueue: (id: string, action: 'TOP' | 'BOTTOM' | 'TOGGLE') => void;
  onUpdateEarnings: (id: string, days: number, rate: number, commission: number) => void;
}

const StaffView: React.FC<StaffViewProps> = ({ staff, washes, onPay, onAddStaff, onUpdateQueue, onUpdateEarnings }) => {
  const [staffFilter, setStaffFilter] = useState<'ALL' | 'PENDING' | 'PAID'>('ALL');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState<Staff | null>(null);
  
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('');
  
  const [editDays, setEditDays] = useState(0);
  const [editRate, setEditRate] = useState(0);
  const [editCommission, setEditCommission] = useState(0);

  const activeStaff = staff.filter(s => s.isActive);
  const inactiveStaff = staff.filter(s => !s.isActive);

  return (
    <div className="bg-background-light dark:bg-background-dark min-h-screen p-4 sm:p-8">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Lista da Vez</h1>
          <p className="text-sm text-slate-500 font-medium italic">A ordem de trabalho justa da sua equipe.</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-primary text-white w-12 h-12 rounded-2xl shadow-lg shadow-primary/30 flex items-center justify-center active:scale-95 transition-all"
        >
          <span className="material-icons">person_add</span>
        </button>
      </header>

      {/* Fila Ativa da Vez */}
      <section className="mb-12">
        <h2 className="text-xs font-black uppercase tracking-[0.2em] text-primary mb-6 flex items-center gap-2">
          <span className="material-icons text-sm">play_arrow</span>
          Em serviço agora
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeStaff.map((s, index) => (
            <div key={s.id} className={`relative group bg-white dark:bg-slate-900 rounded-[2rem] p-6 border-2 transition-all hover:shadow-2xl ${index === 0 ? 'border-primary shadow-xl shadow-primary/10' : 'border-slate-100 dark:border-slate-800'}`}>
              {index === 0 && (
                <div className="absolute -top-3 -right-3 bg-primary text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg animate-bounce">
                  Próximo
                </div>
              )}
              
              <div className="flex items-center gap-4 mb-6">
                <div className="relative">
                  <img className="w-16 h-16 rounded-2xl object-cover shadow-inner" src={s.photo || `https://ui-avatars.com/api/?name=${s.name}&background=random`} />
                  <div className="absolute -bottom-2 -right-2 bg-white dark:bg-slate-950 p-1 rounded-lg border border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] font-black text-primary">#{index + 1}</span>
                  </div>
                </div>
                <div>
                  <h3 className="font-black text-lg text-slate-900 dark:text-white leading-tight">{s.name}</h3>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{s.role}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl">
                   <p className="text-[9px] font-bold text-slate-400 uppercase">A Pagar</p>
                   <p className="text-sm font-black text-primary">R$ {s.unpaid.toFixed(2)}</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl">
                   <p className="text-[9px] font-bold text-slate-400 uppercase">Status</p>
                   <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Ativo</p>
                </div>
              </div>

              <div className="flex gap-2">
                <button 
                  onClick={() => onUpdateQueue(s.id, 'BOTTOM')}
                  className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
                >
                  <span className="material-icons text-sm">last_page</span>
                  Pular vez
                </button>
                <button 
                  onClick={() => onUpdateQueue(s.id, 'TOGGLE')}
                  className="w-12 bg-rose-50 dark:bg-rose-900/20 text-rose-500 rounded-xl flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all"
                  title="Pausar Lavador"
                >
                  <span className="material-icons">pause</span>
                </button>
                <button 
                  onClick={() => {
                    setEditDays(s.daysWorked);
                    setEditRate(s.dailyRate);
                    setEditCommission(s.commission);
                    setShowEditModal(s);
                  }}
                  className="w-12 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-xl flex items-center justify-center hover:text-primary transition-all"
                >
                  <span className="material-icons text-sm">edit</span>
                </button>
              </div>
            </div>
          ))}
          {activeStaff.length === 0 && (
            <div className="col-span-full py-12 text-center text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2rem]">
               Nenhum lavador ativo na fila.
            </div>
          )}
        </div>
      </section>

      {/* Fora da Fila */}
      {inactiveStaff.length > 0 && (
        <section>
          <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-6 flex items-center gap-2">
            <span className="material-icons text-sm">pause</span>
            Pausados ou Ausentes
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {inactiveStaff.map(s => (
              <div key={s.id} className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-100 dark:border-slate-800 flex items-center justify-between opacity-60 hover:opacity-100 transition-opacity">
                <div className="flex items-center gap-3">
                  <img className="w-10 h-10 rounded-xl grayscale" src={s.photo || `https://ui-avatars.com/api/?name=${s.name}`} />
                  <div>
                    <h4 className="font-bold text-sm text-slate-700 dark:text-slate-300">{s.name.split(' ')[0]}</h4>
                    <p className="text-[9px] font-black text-rose-400 uppercase">Ausente</p>
                  </div>
                </div>
                <button 
                  onClick={() => onUpdateQueue(s.id, 'TOGGLE')}
                  className="bg-primary/10 text-primary w-8 h-8 rounded-lg flex items-center justify-center hover:bg-primary hover:text-white transition-all"
                >
                  <span className="material-icons text-sm">play_arrow</span>
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Modais de Cadastro/Edição mantidos */}
      {showEditModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95">
            <h2 className="text-2xl font-black mb-6">Ajustar Ganhos</h2>
            <div className="space-y-4">
              <input type="number" className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-xl p-4 font-bold" placeholder="Dias" value={editDays} onChange={e => setEditDays(Number(e.target.value))} />
              <input type="number" className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-xl p-4 font-bold" placeholder="Diária" value={editRate} onChange={e => setEditRate(Number(e.target.value))} />
              <input type="number" className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-xl p-4 font-bold" placeholder="Comissão" value={editCommission} onChange={e => setEditCommission(Number(e.target.value))} />
              <div className="bg-primary/5 p-4 rounded-xl border border-primary/10">
                 <p className="text-[10px] font-black text-primary uppercase">Novo Saldo Devedor</p>
                 <p className="text-2xl font-black text-primary">R$ {((editDays * editRate) + editCommission).toFixed(2)}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setShowEditModal(null)} className="flex-1 py-4 font-bold text-slate-400">Cancelar</button>
                <button onClick={() => { onUpdateEarnings(showEditModal.id, editDays, editRate, editCommission); setShowEditModal(null); }} className="flex-[2] bg-primary text-white rounded-xl font-black">Salvar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95">
            <h2 className="text-2xl font-black mb-6">Novo Membro</h2>
            <div className="space-y-4">
              <input className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-xl p-4 font-bold" placeholder="Nome" value={newName} onChange={e => setNewName(e.target.value)} />
              <select className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-xl p-4 font-bold" value={newRole} onChange={e => setNewRole(e.target.value)}>
                <option value="">Função</option>
                <option value="Lavador">Lavador</option>
                <option value="Detailer">Detailer</option>
                <option value="Atendimento">Atendimento</option>
              </select>
              <div className="flex gap-2">
                <button onClick={() => setShowAddModal(false)} className="flex-1 py-4 font-bold text-slate-400">Cancelar</button>
                <button onClick={() => { onAddStaff(newName, newRole); setShowAddModal(false); }} className="flex-[2] bg-primary text-white rounded-xl font-black">Adicionar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffView;
