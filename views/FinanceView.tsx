
import React, { useState } from 'react';
import { Expense, Wash } from '../types';

interface FinanceViewProps {
  expenses: Expense[];
  washes: Wash[];
  onAddExpense: (exp: Omit<Expense, 'id'>) => void;
}

const FinanceView: React.FC<FinanceViewProps> = ({ expenses, washes, onAddExpense }) => {
  const today = new Date().toISOString().split('T')[0];
  const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

  const [startDate, setStartDate] = useState(firstDayOfMonth);
  const [endDate, setEndDate] = useState(today);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'ENTRADAS' | 'SAIDAS'>('ENTRADAS');
  
  const [newExp, setNewExp] = useState<Omit<Expense, 'id' | 'status'>>({
    description: '',
    amount: 0,
    category: 'Operacional',
    date: today,
    paymentMethod: 'Dinheiro',
    installments: 1,
    operator: '',
    brand: ''
  });

  // Filtros aplicados
  const filteredExpenses = expenses.filter(e => e.date >= startDate && e.date <= endDate);
  const filteredWashes = washes.filter(w => w.date >= startDate && w.date <= endDate && w.status === 'PAID');

  const totalSpent = filteredExpenses.reduce((acc, curr) => acc + curr.amount, 0);
  const totalIncome = filteredWashes.reduce((acc, curr) => acc + curr.price, 0);
  const balance = totalIncome - totalSpent;

  const handleSubmit = () => {
    onAddExpense({
      ...newExp,
      status: 'PAID'
    });
    setShowModal(false);
    setNewExp({
      description: '',
      amount: 0,
      category: 'Operacional',
      date: today,
      paymentMethod: 'Dinheiro',
      installments: 1,
      operator: '',
      brand: ''
    });
  };

  return (
    <div className="bg-background-light dark:bg-background-dark min-h-screen max-w-5xl mx-auto px-4 sm:px-8 pb-32">
      <header className="sticky top-0 z-40 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md pt-12 pb-6 border-b border-slate-200 dark:border-slate-800">
        <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white">Finanças</h1>
        <p className="text-sm text-slate-500 font-medium">Controle de entradas, saídas e fluxo de caixa.</p>
        
        {/* Filtro de Período */}
        <div className="mt-6 flex flex-wrap items-center gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Início</label>
            <input 
              type="date" 
              className="bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-xs font-bold px-3 py-2 focus:ring-2 focus:ring-primary"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Fim</label>
            <input 
              type="date" 
              className="bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-xs font-bold px-3 py-2 focus:ring-2 focus:ring-primary"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <div className="ml-auto bg-primary/10 px-4 py-2 rounded-xl border border-primary/20">
            <p className="text-[9px] font-black text-primary uppercase leading-none mb-1 text-center">Saldo Período</p>
            <p className="text-sm font-black text-primary">R$ {balance.toFixed(2)}</p>
          </div>
        </div>
      </header>

      <main className="mt-8">
        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <button 
            onClick={() => setActiveTab('ENTRADAS')}
            className={`p-6 rounded-3xl border transition-all text-left relative overflow-hidden group ${
              activeTab === 'ENTRADAS' 
              ? 'bg-emerald-500 border-emerald-400 shadow-xl shadow-emerald-500/20 text-white' 
              : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-400'
            }`}
          >
            <p className={`text-xs font-bold uppercase tracking-widest ${activeTab === 'ENTRADAS' ? 'text-emerald-100' : 'text-slate-400'}`}>Entradas (Lavagens)</p>
            <h2 className={`text-3xl font-black mt-1 tracking-tight ${activeTab === 'ENTRADAS' ? 'text-white' : 'text-slate-900 dark:text-white'}`}>R$ {totalIncome.toFixed(2)}</h2>
            <span className={`material-icons absolute -right-2 -bottom-2 text-6xl opacity-20 transition-transform group-hover:scale-110 ${activeTab === 'ENTRADAS' ? 'text-white' : 'text-slate-200 dark:text-slate-800'}`}>add_chart</span>
          </button>

          <button 
            onClick={() => setActiveTab('SAIDAS')}
            className={`p-6 rounded-3xl border transition-all text-left relative overflow-hidden group ${
              activeTab === 'SAIDAS' 
              ? 'bg-rose-500 border-rose-400 shadow-xl shadow-rose-500/20 text-white' 
              : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-400'
            }`}
          >
            <p className={`text-xs font-bold uppercase tracking-widest ${activeTab === 'SAIDAS' ? 'text-rose-100' : 'text-slate-400'}`}>Saídas (Despesas)</p>
            <h2 className={`text-3xl font-black mt-1 tracking-tight ${activeTab === 'SAIDAS' ? 'text-white' : 'text-slate-900 dark:text-white'}`}>R$ {totalSpent.toFixed(2)}</h2>
            <span className={`material-icons absolute -right-2 -bottom-2 text-6xl opacity-20 transition-transform group-hover:scale-110 ${activeTab === 'SAIDAS' ? 'text-white' : 'text-slate-200 dark:text-slate-800'}`}>data_exploration</span>
          </button>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-2">
            {activeTab === 'ENTRADAS' ? `Receitas no Período (${filteredWashes.length})` : `Despesas no Período (${filteredExpenses.length})`}
          </h3>
          {activeTab === 'SAIDAS' && (
            <button 
              onClick={() => setShowModal(true)}
              className="w-full sm:w-auto bg-primary text-white px-6 py-3 rounded-2xl font-black text-sm shadow-xl shadow-primary/20 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <span className="material-icons">add_circle</span>
              NOVO GASTO
            </button>
          )}
        </div>

        {/* Listagens */}
        <div className="grid grid-cols-1 gap-4">
          {activeTab === 'SAIDAS' ? (
            filteredExpenses.map(expense => (
              <div key={expense.id} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between hover:shadow-md transition-all">
                <div className="flex items-center space-x-5">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner bg-rose-100 text-rose-600 dark:bg-rose-900/30`}>
                    <span className="material-icons text-2xl">
                      {expense.paymentMethod === 'PIX' ? 'qr_code' : 
                       expense.paymentMethod === 'Dinheiro' ? 'payments' : 'credit_card'}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-black text-slate-900 dark:text-white leading-tight">{expense.description}</h4>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">
                      {expense.category} • {expense.date}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-black text-rose-500 text-lg">- R$ {expense.amount.toFixed(2)}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{expense.paymentMethod}</p>
                </div>
              </div>
            ))
          ) : (
            filteredWashes.map(wash => (
              <div key={wash.id} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between hover:shadow-md transition-all">
                <div className="flex items-center space-x-5">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30">
                    <span className="material-icons text-2xl">
                      {wash.vehicleType === 'moto' ? 'two_wheeler' : wash.vehicleType === 'caminhao' ? 'local_shipping' : 'directions_car'}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-black text-slate-900 dark:text-white leading-tight">{wash.clientName}</h4>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">
                      {wash.type} • {wash.date}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-black text-emerald-500 text-lg">+ R$ {wash.price.toFixed(2)}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{wash.plate}</p>
                </div>
              </div>
            ))
          )}

          {((activeTab === 'SAIDAS' && filteredExpenses.length === 0) || (activeTab === 'ENTRADAS' && filteredWashes.length === 0)) && (
            <div className="py-20 text-center text-slate-400">
              <span className="material-icons text-6xl opacity-20 mb-4">
                {activeTab === 'SAIDAS' ? 'account_balance_wallet' : 'local_car_wash'}
              </span>
              <p className="font-bold">Nenhum registro encontrado neste período.</p>
            </div>
          )}
        </div>
      </main>

      {/* Modal Nova Despesa (Mantido conforme anterior) */}
      {showModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-950 w-full max-w-lg rounded-3xl p-8 shadow-2xl animate-in zoom-in-95 duration-300 overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Novo Gasto</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <span className="material-icons">close</span>
              </button>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase ml-1">Data</label>
                  <input 
                    type="date"
                    className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-xl py-4 px-4 text-slate-900 dark:text-white font-bold"
                    value={newExp.date}
                    onChange={e => setNewExp({...newExp, date: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase ml-1">Categoria</label>
                  <select 
                    className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-xl py-4 px-4 text-slate-900 dark:text-white font-bold"
                    value={newExp.category}
                    onChange={e => setNewExp({...newExp, category: e.target.value})}
                  >
                    <option>Operacional</option>
                    <option>Equipamentos</option>
                    <option>Marketing</option>
                    <option>Folha de Pagamento</option>
                    <option>Manutenção</option>
                    <option>Outros</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase ml-1">Descrição do Gasto</label>
                <input 
                  className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-xl py-4 px-4 text-slate-900 dark:text-white font-bold"
                  placeholder="Ex: Compra de Shampoo Automotivo"
                  value={newExp.description}
                  onChange={e => setNewExp({...newExp, description: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase ml-1">Valor Total (R$)</label>
                  <input 
                    type="number"
                    className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-xl py-4 px-4 font-black text-slate-900 dark:text-white"
                    placeholder="0.00"
                    value={newExp.amount || ''}
                    onChange={e => setNewExp({...newExp, amount: Number(e.target.value)})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase ml-1">Forma de Pagamento</label>
                  <select 
                    className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-xl py-4 px-4 text-slate-900 dark:text-white font-bold"
                    value={newExp.paymentMethod}
                    onChange={e => setNewExp({...newExp, paymentMethod: e.target.value as any})}
                  >
                    <option>Dinheiro</option>
                    <option>PIX</option>
                    <option>Cartão de Crédito</option>
                    <option>Cartão de Débito</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  onClick={() => setShowModal(false)} 
                  className="flex-1 py-4 text-sm font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-all"
                >
                  CANCELAR
                </button>
                <button 
                  onClick={handleSubmit} 
                  disabled={!newExp.description || !newExp.amount}
                  className="flex-[2] py-4 bg-primary text-white rounded-2xl text-sm font-black shadow-xl shadow-primary/20 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale"
                >
                  CONFIRMAR GASTO
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinanceView;
