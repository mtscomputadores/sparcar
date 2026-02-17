
import React from 'react';
import { Wash, Expense, Staff } from '../types';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, PieChart, Pie, Tooltip } from 'recharts';

interface DashboardViewProps {
  washes: Wash[];
  expenses: Expense[];
  staff: Staff[];
}

const DashboardView: React.FC<DashboardViewProps> = ({ washes, expenses, staff }) => {
  const revenueTotal = washes.reduce((acc, curr) => acc + curr.price, 0);
  const totalWashes = washes.length;
  const totalExpenses = expenses.reduce((acc, curr) => acc + curr.amount, 0);
  const profit = revenueTotal - totalExpenses;

  const chartData = [
    { name: 'Seg', rev: 1200, exp: 400 },
    { name: 'Ter', rev: 900, exp: 300 },
    { name: 'Qua', rev: 1100, exp: 250 },
    { name: 'Qui', rev: 800, exp: 200 },
    { name: 'Sex', rev: 1050, exp: 500 },
    { name: 'Sab', rev: 1400, exp: 450 },
    { name: 'Hoje', rev: revenueTotal, exp: totalExpenses / 30 },
  ];

  const pieData = [
    { name: 'Carro', value: washes.filter(w => w.vehicleType === 'carro').length || 1, color: '#1152d4' },
    { name: 'Moto', value: washes.filter(w => w.vehicleType === 'moto').length || 1, color: '#10b981' },
    { name: 'Caminhão', value: washes.filter(w => w.vehicleType === 'caminhao').length || 1, color: '#f59e0b' },
  ];

  return (
    <div className="bg-slate-50 dark:bg-slate-950 font-display text-slate-800 dark:text-slate-100 min-h-screen p-4 sm:p-8">
      <header className="mb-8 pt-4">
        <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white">Painel de Controle</h1>
        <p className="text-sm text-slate-500 font-medium italic">Monitoramento em tempo real do seu negócio.</p>
        {/* Bloco de perfil removido para evitar sobreposição no mobile */}
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Receita', value: `R$ ${revenueTotal.toFixed(2)}`, icon: 'payments', color: 'bg-primary' },
          { label: 'Lucro Líquido', value: `R$ ${profit.toFixed(2)}`, icon: 'account_balance_wallet', color: 'bg-emerald-500' },
          { label: 'Lavagens', value: totalWashes, icon: 'local_car_wash', color: 'bg-indigo-500' },
          { label: 'Ticket Médio', value: `R$ ${(revenueTotal / (totalWashes || 1)).toFixed(2)}`, icon: 'analytics', color: 'bg-amber-500' }
        ].map((card, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 p-5 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 hover:shadow-md transition-all">
            <div className={`w-10 h-10 ${card.color} text-white rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-${card.color.split('-')[1]}/20`}>
              <span className="material-icons text-xl">{card.icon}</span>
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{card.label}</p>
            <p className="text-xl font-black tracking-tight">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800">
          <div className="flex justify-between items-center mb-8">
            <h3 className="font-black text-xl">Faturamento Semanal</h3>
            <div className="flex gap-2">
              <span className="flex items-center gap-1 text-[10px] font-bold text-primary"><div className="w-2 h-2 bg-primary rounded-full"></div> Receita</span>
              <span className="flex items-center gap-1 text-[10px] font-bold text-slate-300"><div className="w-2 h-2 bg-slate-300 rounded-full"></div> Custos</span>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold'}} />
                <Tooltip cursor={{fill: 'transparent'}} />
                <Bar dataKey="rev" fill="#1152d4" radius={[6, 6, 0, 0]} barSize={25} />
                <Bar dataKey="exp" fill="#e2e8f0" radius={[6, 6, 0, 0]} barSize={25} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800">
          <h3 className="font-black text-xl mb-6">Mix de Veículos</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-1 gap-3 mt-4">
            {pieData.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{backgroundColor: item.color}}></div>
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-400">{item.name}</span>
                </div>
                <span className="text-xs font-black">{item.value} unid.</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pb-32">
        <section className="bg-primary/5 dark:bg-primary/10 p-8 rounded-3xl border border-primary/20">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-2xl font-black text-primary">Performance</h3>
              <p className="text-xs font-bold text-primary/60 uppercase tracking-widest">Ranking de Colaboradores</p>
            </div>
            <span className="material-icons text-primary text-4xl opacity-20">military_tech</span>
          </div>
          {staff.slice(0, 3).map((s, i) => (
            <div key={s.id} className="flex items-center gap-4 mb-4 bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm">
              <div className="relative">
                <img className="w-12 h-12 rounded-xl object-cover" src={s.photo || `https://ui-avatars.com/api/?name=${s.name}`} />
                <div className={`absolute -top-2 -right-2 w-6 h-6 ${i === 0 ? 'bg-yellow-400' : 'bg-slate-300'} text-white rounded-full flex items-center justify-center text-[10px] font-black border-2 border-white`}>{i+1}</div>
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-sm">{s.name}</h4>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-2">
                  <div className="bg-primary h-full rounded-full" style={{width: `${100 - i*20}%`}}></div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs font-black">98%</p>
                <p className="text-[9px] font-bold text-slate-400">SCORE</p>
              </div>
            </div>
          ))}
        </section>

        <section className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-slate-800">
          <h3 className="text-xl font-black mb-6">Metas Mensais</h3>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Lavagens (Meta 500)</span>
                <span className="text-xs font-black">120/500</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden">
                <div className="bg-primary h-full rounded-full" style={{width: '24%'}}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Faturamento (Meta R$ 20k)</span>
                <span className="text-xs font-black">R$ 5.4k/20k</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full" style={{width: '27%'}}></div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default DashboardView;
