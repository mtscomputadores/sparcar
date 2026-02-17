
import { Wash, Staff, Expense, LoyaltyConfig, ClientProgress } from './types';

const STORAGE_KEY_PREFIX = 'sparcar_pro_v8';

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
  { id: '1', name: 'João Lavador', role: 'Lavador', daysWorked: 0, dailyRate: 50, commission: 0, unpaid: 0, queuePosition: 1, isActive: true },
  { id: '2', name: 'Maria Detailer', role: 'Lavador', daysWorked: 0, dailyRate: 50, commission: 0, unpaid: 0, queuePosition: 2, isActive: true }
];

async function callApi(sql: string, params: any[] = []) {
  const controller = new AbortController();
  // Aumentamos para 45 segundos pois o Neon pode demorar para acordar
  const timeoutId = setTimeout(() => controller.abort(), 45000); 

  try {
    const res = await fetch('/api/sql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: sql, params }),
      signal: controller.signal
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ error: 'Servidor Offline', details: 'A rota /api/sql não respondeu.' }));
      throw new Error(errorData.details || errorData.error || 'Erro na comunicação com o banco.');
    }

    const data = await res.json();
    clearTimeout(timeoutId);
    return data;
  } catch (e: any) {
    clearTimeout(timeoutId);
    if (e.name === 'AbortError') {
      console.error("⏱️ O servidor demorou mais de 45s para responder.");
      throw new Error('Tempo esgotado. Verifique se o banco Neon está ativo.');
    }
    console.error("🔌 Erro de Conexão:", e.message);
    throw e;
  }
}

const storage = {
  get: (key: string) => JSON.parse(localStorage.getItem(`${STORAGE_KEY_PREFIX}_${key}`) || 'null'),
  set: (key: string, val: any) => localStorage.setItem(`${STORAGE_KEY_PREFIX}_${key}`, JSON.stringify(val))
};

export const db = {
  async init() {
    console.log("🚀 Sparcar: Verificando banco de dados...");
    try {
      // Teste simples para ver se a API está lá
      await callApi("SELECT 1");

      const queries = [
        `CREATE TABLE IF NOT EXISTS washes (id TEXT PRIMARY KEY, clientName TEXT, clientPhone TEXT, plate TEXT, model TEXT, type TEXT, status TEXT, assignedStaff TEXT, price NUMERIC, services TEXT, vehicleType TEXT, date TEXT);`,
        `CREATE TABLE IF NOT EXISTS staff (id TEXT PRIMARY KEY, name TEXT, role TEXT, photo TEXT, daysWorked INTEGER DEFAULT 0, dailyRate NUMERIC DEFAULT 50, commission NUMERIC DEFAULT 0, unpaid NUMERIC DEFAULT 0, queuePosition INTEGER, isActive BOOLEAN DEFAULT true);`,
        `CREATE TABLE IF NOT EXISTS loyalty_config (id INTEGER PRIMARY KEY CHECK (id = 1), theme TEXT, stampsRequired INTEGER, rewardDescription TEXT, isActive BOOLEAN, companyName TEXT, companySubtitle TEXT, companyLogo TEXT, stampIcon TEXT);`,
        `CREATE TABLE IF NOT EXISTS client_progress (clientKey TEXT PRIMARY KEY, stamps INTEGER, lastWashDate TEXT, phone TEXT);`,
        `CREATE TABLE IF NOT EXISTS expenses (id TEXT PRIMARY KEY, category TEXT, description TEXT, amount NUMERIC, date TEXT, status TEXT, paymentMethod TEXT, installments INTEGER, operator TEXT, brand TEXT);`
      ];

      for (const q of queries) {
        await callApi(q);
      }

      const checkStaff = await callApi("SELECT COUNT(*) FROM staff");
      if (parseInt(checkStaff.rows[0].count) === 0) {
        for (const s of DEFAULT_STAFF) {
          await this.saveStaff(s);
        }
      }

      console.log("✅ Sincronizado com Neon.");
      return true;
    } catch (e: any) {
      console.warn("⚠️ Banco remoto não disponível. Motivo:", e.message);
      return false;
    }
  },

  async getWashes(): Promise<Wash[]> {
    try {
      const res = await callApi("SELECT * FROM washes ORDER BY date DESC, id DESC LIMIT 200");
      const data = (res.rows || []).map((r: any) => ({ 
        ...r, 
        services: JSON.parse(r.services || '[]'), 
        price: parseFloat(r.price) 
      }));
      storage.set('washes', data);
      return data;
    } catch { return storage.get('washes') || []; }
  },

  async saveWash(wash: Wash): Promise<void> {
    const current = await this.getWashes();
    storage.set('washes', [wash, ...current.filter(w => w.id !== wash.id)]);
    try {
      await callApi(`INSERT INTO washes (id, clientName, clientPhone, plate, model, type, status, assignedStaff, price, services, vehicleType, date) 
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) 
                    ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, price = EXCLUDED.price`, 
      [wash.id, wash.clientName, wash.clientPhone, wash.plate, wash.model, wash.type, wash.status, wash.assignedStaff, wash.price, JSON.stringify(wash.services), wash.vehicleType, wash.date]);
    } catch {}
  },

  async getStaff(): Promise<Staff[]> {
    try {
      const res = await callApi("SELECT * FROM staff ORDER BY queuePosition ASC");
      const data = (res.rows || []).map((r: any) => ({ 
        ...r, 
        dailyRate: parseFloat(r.dailyrate || r.dailyRate || 50), 
        commission: parseFloat(r.commission || 0), 
        unpaid: parseFloat(r.unpaid || 0) 
      }));
      storage.set('staff', data);
      return data;
    } catch { return storage.get('staff') || DEFAULT_STAFF; }
  },

  async saveStaff(s: Staff): Promise<void> {
    const current = await this.getStaff();
    storage.set('staff', current.map(x => x.id === s.id ? s : x));
    try {
      await callApi(`INSERT INTO staff (id, name, role, photo, daysWorked, dailyRate, commission, unpaid, queuePosition, isActive) 
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
                    ON CONFLICT (id) DO UPDATE SET queuePosition = EXCLUDED.queuePosition, isActive = EXCLUDED.isActive, unpaid = EXCLUDED.unpaid, daysWorked = EXCLUDED.daysWorked, commission = EXCLUDED.commission`, 
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
      await callApi(`INSERT INTO loyalty_config (id, theme, stampsRequired, rewardDescription, isActive, companyName, companySubtitle, companyLogo, stampIcon) 
                    VALUES (1, $1, $2, $3, $4, $5, $6, $7, $8) 
                    ON CONFLICT (id) DO UPDATE SET theme = EXCLUDED.theme, isActive = EXCLUDED.isActive, rewardDescription = EXCLUDED.rewardDescription, stampsRequired = EXCLUDED.stampsRequired`, 
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
      await callApi(`INSERT INTO client_progress (clientKey, stamps, lastWashDate, phone) 
                    VALUES ($1, $2, $3, $4) 
                    ON CONFLICT (clientKey) DO UPDATE SET stamps = EXCLUDED.stamps, lastWashDate = EXCLUDED.lastWashDate`, 
                    [key, p.stamps, p.lastWashDate, p.phone]);
    } catch {}
  },

  async getExpenses(): Promise<Expense[]> {
    try {
      const res = await callApi("SELECT * FROM expenses ORDER BY date DESC, id DESC LIMIT 200");
      const data = (res.rows || []).map((r: any) => ({ 
        ...r, 
        amount: parseFloat(r.amount) 
      }));
      storage.set('expenses', data);
      return data;
    } catch { return storage.get('expenses') || []; }
  },

  async saveExpense(e: Expense): Promise<void> {
    const current = await this.getExpenses();
    storage.set('expenses', [e, ...current.filter(x => x.id !== e.id)]);
    try {
      await callApi(`INSERT INTO expenses (id, category, description, amount, date, status, paymentMethod, installments, operator, brand) 
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
                    ON CONFLICT (id) DO UPDATE SET amount = EXCLUDED.amount, status = EXCLUDED.status`, 
      [e.id, e.category, e.description, e.amount, e.date, e.status, e.paymentMethod, e.installments, e.operator, e.brand]);
    } catch {}
  }
};
