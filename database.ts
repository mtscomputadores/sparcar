
import { Wash, Staff, Expense, LoyaltyConfig, ClientProgress } from './types';

const DEFAULT_LOYALTY: LoyaltyConfig = {
  theme: 'grad-ocean',
  stampsRequired: 10,
  rewardDescription: 'Lavagem Completa Grátis',
  isActive: true,
  companyName: 'Sparcar Lava Jato',
  companySubtitle: 'Estética Automotiva de Elite',
  stampIcon: 'water_drop'
};

const DEFAULT_STAFF: Staff[] = [
  { id: '1', name: 'Carlos Silva', role: 'Lavador', daysWorked: 0, dailyRate: 50, commission: 0, unpaid: 0, queuePosition: 1, isActive: true },
  { id: '2', name: 'Roberto Santos', role: 'Lavador', daysWorked: 0, dailyRate: 50, commission: 0, unpaid: 0, queuePosition: 2, isActive: true }
];

async function callApi(sql: string, params: any[] = []) {
  const res = await fetch('/api/sql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: sql, params }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.details || data.error || "Falha na API");
  return data;
}

const storage = {
  get: (key: string) => JSON.parse(localStorage.getItem(`sparcar_v3_${key}`) || 'null'),
  set: (key: string, val: any) => localStorage.setItem(`sparcar_v3_${key}`, JSON.stringify(val))
};

export const db = {
  async init() {
    console.log("🛠️ Tentando conectar ao Neon...");
    try {
      // Criação sequencial para evitar sobrecarga e garantir ordem
      await callApi(`CREATE TABLE IF NOT EXISTS washes (id TEXT PRIMARY KEY, clientName TEXT, clientPhone TEXT, plate TEXT, model TEXT, type TEXT, status TEXT, assignedStaff TEXT, price NUMERIC, services TEXT, vehicleType TEXT, date TEXT);`);
      await callApi(`CREATE TABLE IF NOT EXISTS staff (id TEXT PRIMARY KEY, name TEXT, role TEXT, photo TEXT, daysWorked INTEGER DEFAULT 0, dailyRate NUMERIC DEFAULT 45, commission NUMERIC DEFAULT 0, unpaid NUMERIC DEFAULT 0, queuePosition INTEGER, isActive BOOLEAN DEFAULT true);`);
      await callApi(`CREATE TABLE IF NOT EXISTS loyalty_config (id INTEGER PRIMARY KEY CHECK (id = 1), theme TEXT, stampsRequired INTEGER, rewardDescription TEXT, isActive BOOLEAN, companyName TEXT, companySubtitle TEXT, companyLogo TEXT, stampIcon TEXT);`);
      await callApi(`CREATE TABLE IF NOT EXISTS client_progress (clientKey TEXT PRIMARY KEY, stamps INTEGER, lastWashDate TEXT, phone TEXT);`);
      await callApi(`CREATE TABLE IF NOT EXISTS expenses (id TEXT PRIMARY KEY, category TEXT, description TEXT, amount NUMERIC, date TEXT, status TEXT, paymentMethod TEXT, installments INTEGER, operator TEXT, brand TEXT);`);
      
      console.log("✅ Banco Neon Remoto: CONECTADO E SINCRONIZADO");
      return true;
    } catch (e: any) {
      console.error("❌ Erro ao conectar ao Neon:", e.message);
      console.log("ℹ️ O App continuará funcionando em modo LOCAL (Offline).");
      return false;
    }
  },

  async getWashes(): Promise<Wash[]> {
    try {
      const res = await callApi("SELECT * FROM washes ORDER BY date DESC, id DESC");
      const data = (res.rows || []).map((r: any) => ({ ...r, services: JSON.parse(r.services || '[]'), price: parseFloat(r.price) }));
      storage.set('washes', data);
      return data;
    } catch { return storage.get('washes') || []; }
  },

  async saveWash(wash: Wash): Promise<void> {
    const current = await this.getWashes();
    storage.set('washes', [wash, ...current.filter(w => w.id !== wash.id)]);
    try {
      await callApi(`INSERT INTO washes (id, clientName, clientPhone, plate, model, type, status, assignedStaff, price, services, vehicleType, date) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, price = EXCLUDED.price`, 
      [wash.id, wash.clientName, wash.clientPhone, wash.plate, wash.model, wash.type, wash.status, wash.assignedStaff, wash.price, JSON.stringify(wash.services), wash.vehicleType, wash.date]);
    } catch {}
  },

  async getStaff(): Promise<Staff[]> {
    try {
      const res = await callApi("SELECT * FROM staff ORDER BY queuePosition ASC");
      const data = (res.rows || []).map((r: any) => ({ ...r, dailyRate: parseFloat(r.dailyrate || r.dailyRate || 0), commission: parseFloat(r.commission || 0), unpaid: parseFloat(r.unpaid || 0) }));
      storage.set('staff', data);
      return data;
    } catch { return storage.get('staff') || DEFAULT_STAFF; }
  },

  async saveStaff(s: Staff): Promise<void> {
    const current = await this.getStaff();
    storage.set('staff', current.map(x => x.id === s.id ? s : x));
    try {
      await callApi(`INSERT INTO staff (id, name, role, photo, daysWorked, dailyRate, commission, unpaid, queuePosition, isActive) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) ON CONFLICT (id) DO UPDATE SET queuePosition = EXCLUDED.queuePosition, isActive = EXCLUDED.isActive, unpaid = EXCLUDED.unpaid, dailyRate = EXCLUDED.dailyRate, daysWorked = EXCLUDED.daysWorked`, 
      [s.id, s.name, s.role, s.photo, s.daysWorked, s.dailyRate, s.commission, s.unpaid, s.queuePosition, s.isActive]);
    } catch {}
  },

  async getLoyalty(): Promise<LoyaltyConfig> {
    try {
      const res = await callApi("SELECT * FROM loyalty_config WHERE id = 1");
      const data = res.rows && res.rows.length > 0 ? res.rows[0] : DEFAULT_LOYALTY;
      storage.set('loyalty', data);
      return data;
    } catch { return storage.get('loyalty') || DEFAULT_LOYALTY; }
  },

  async saveLoyalty(config: LoyaltyConfig): Promise<void> {
    storage.set('loyalty', config);
    try {
      await callApi(`INSERT INTO loyalty_config (id, theme, stampsRequired, rewardDescription, isActive, companyName, companySubtitle, companyLogo, stampIcon) VALUES (1, $1, $2, $3, $4, $5, $6, $7, $8) ON CONFLICT (id) DO UPDATE SET theme = EXCLUDED.theme, isActive = EXCLUDED.isActive, rewardDescription = EXCLUDED.rewardDescription, stampsRequired = EXCLUDED.stampsRequired`, 
      [config.theme, config.stampsRequired, config.rewardDescription, config.isActive, config.companyName, config.companySubtitle, config.companyLogo, config.stampIcon]);
    } catch {}
  },

  async getClientProgress(): Promise<Record<string, ClientProgress>> {
    try {
      const res = await callApi("SELECT * FROM client_progress");
      const progress: any = {};
      (res.rows || []).forEach((r: any) => progress[r.clientkey || r.clientKey] = { stamps: r.stamps, lastWashDate: r.lastwashdate || r.lastWashDate, phone: r.phone });
      storage.set('progress', progress);
      return progress;
    } catch { return storage.get('progress') || {}; }
  },

  async saveClientProgress(key: string, p: ClientProgress): Promise<void> {
    const current = await this.getClientProgress();
    storage.set('progress', { ...current, [key]: p });
    try {
      await callApi(`INSERT INTO client_progress (clientKey, stamps, lastWashDate, phone) VALUES ($1, $2, $3, $4) ON CONFLICT (clientKey) DO UPDATE SET stamps = EXCLUDED.stamps, lastWashDate = EXCLUDED.lastWashDate`, [key, p.stamps, p.lastWashDate, p.phone]);
    } catch {}
  },

  async getExpenses(): Promise<Expense[]> {
    try {
      const res = await callApi("SELECT * FROM expenses ORDER BY date DESC, id DESC");
      const data = (res.rows || []).map((r: any) => ({ ...r, amount: parseFloat(r.amount), installments: r.installments ? parseInt(r.installments) : undefined }));
      storage.set('expenses', data);
      return data;
    } catch { return storage.get('expenses') || []; }
  },

  async saveExpense(e: Expense): Promise<void> {
    const current = await this.getExpenses();
    storage.set('expenses', [e, ...current.filter(x => x.id !== e.id)]);
    try {
      await callApi(`INSERT INTO expenses (id, category, description, amount, date, status, paymentMethod, installments, operator, brand) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) ON CONFLICT (id) DO UPDATE SET amount = EXCLUDED.amount, status = EXCLUDED.status`, 
      [e.id, e.category, e.description, e.amount, e.date, e.status, e.paymentMethod, e.installments, e.operator, e.brand]);
    } catch {}
  }
};
