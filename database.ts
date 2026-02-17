
import { Wash, Staff, Expense, LoyaltyConfig, ClientProgress } from './types';

const STORAGE_KEY_PREFIX = 'sparcar_v1';

const storage = {
  get: (key: string) => JSON.parse(localStorage.getItem(`${STORAGE_KEY_PREFIX}_${key}`) || 'null'),
  set: (key: string, val: any) => localStorage.setItem(`${STORAGE_KEY_PREFIX}_${key}`, JSON.stringify(val))
};

async function request(path: string, method = 'GET', body?: any) {
  const url = path.startsWith('/') ? path : `/${path}`;
  try {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined
    });
    
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Erro ${res.status}: ${errorText || 'Falha na requisição'}`);
    }

    return await res.json();
  } catch (e: any) {
    throw e;
  }
}

export const db = {
  async init() {
    try {
      await request('/api/washes');
      return true;
    } catch {
      return false;
    }
  },

  async getWashes(): Promise<Wash[]> {
    try {
      const data = await request('/api/washes');
      const formatted = data.map((w: any) => ({
        ...w,
        services: typeof w.services === 'string' ? JSON.parse(w.services) : (w.services || []),
        price: parseFloat(w.price || 0)
      }));
      storage.set('washes', formatted);
      return formatted;
    } catch { return storage.get('washes') || []; }
  },

  async saveWash(wash: Wash): Promise<void> {
    const current = await this.getWashes();
    storage.set('washes', [wash, ...current.filter(w => w.id !== wash.id)]);
    await request('/api/washes', 'POST', wash).catch(() => {});
  },

  async getStaff(): Promise<Staff[]> {
    try {
      const data = await request('/api/staff');
      const formatted = data.map((s: any) => ({
        ...s,
        dailyRate: parseFloat(s.dailyRate || s.dailyrate || 0),
        commission: parseFloat(s.commission || 0),
        unpaid: parseFloat(s.unpaid || 0),
        isActive: Boolean(s.isActive ?? s.isactive ?? true)
      }));
      storage.set('staff', formatted);
      return formatted;
    } catch { return storage.get('staff') || []; }
  },

  async saveStaff(s: Staff): Promise<void> {
    const current = await this.getStaff();
    storage.set('staff', current.map(x => x.id === s.id ? s : x));
    await request('/api/staff', 'POST', s).catch(() => {});
  },

  async getLoyalty(): Promise<LoyaltyConfig> {
    try {
      const rows = await request('/api/loyalty?type=config');
      const data = rows[0] || { theme: 'grad-ocean', stampsRequired: 10, rewardDescription: 'Lavagem Grátis', isActive: true, companyName: 'Sparcar', stampIcon: 'water_drop' };
      storage.set('loyalty', data);
      return data;
    } catch { return storage.get('loyalty'); }
  },

  async saveLoyalty(config: LoyaltyConfig): Promise<void> {
    storage.set('loyalty', config);
    await request('/api/loyalty?type=config', 'POST', config).catch(() => {});
  },

  async getClientProgress(): Promise<Record<string, ClientProgress>> {
    try {
      const data = await request('/api/loyalty?type=progress');
      const progress: Record<string, ClientProgress> = {};
      data.forEach((r: any) => {
        const key = r.clientkey || r.clientKey;
        if (key) {
          progress[key] = {
            stamps: parseInt(r.stamps || 0),
            lastWashDate: r.lastwashdate || r.lastWashDate || '',
            phone: r.phone || ''
          };
        }
      });
      storage.set('progress', progress);
      return progress;
    } catch { return storage.get('progress') || {}; }
  },

  async saveClientProgress(key: string, p: ClientProgress): Promise<void> {
    const current = await this.getClientProgress();
    storage.set('progress', { ...current, [key]: p });
    await request('/api/loyalty?type=progress', 'POST', { clientKey: key, ...p }).catch(() => {});
  },

  async getExpenses(): Promise<Expense[]> {
    try {
      const data = await request('/api/expenses');
      const formatted = data.map((e: any) => ({ ...e, amount: parseFloat(e.amount || 0) }));
      storage.set('expenses', formatted);
      return formatted;
    } catch { return storage.get('expenses') || []; }
  },

  async saveExpense(e: Expense): Promise<void> {
    const current = await this.getExpenses();
    storage.set('expenses', [e, ...current.filter(x => x.id !== e.id)]);
    await request('/api/expenses', 'POST', e).catch(() => {});
  }
};
