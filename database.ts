
import { Wash, Staff, Expense, LoyaltyConfig, ClientProgress } from './types';

const STORAGE_KEY_PREFIX = 'sparcar_api_v2';

const storage = {
  get: (key: string) => JSON.parse(localStorage.getItem(`${STORAGE_KEY_PREFIX}_${key}`) || 'null'),
  set: (key: string, val: any) => localStorage.setItem(`${STORAGE_KEY_PREFIX}_${key}`, JSON.stringify(val))
};

async function request(path: string, method = 'GET', body?: any) {
  try {
    const res = await fetch(path, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined
    });
    
    const data = await res.json();
    if (!res.ok) {
      console.error(`❌ Erro na API (${path}):`, data.error || 'Erro desconhecido');
      throw new Error(data.error || 'Falha na API');
    }
    return data;
  } catch (e: any) {
    console.error(`🔥 Falha crítica ao acessar ${path}:`, e.message);
    throw e;
  }
}

export const db = {
  async init() {
    console.log("🚀 Sparcar: Sincronizando tabelas...");
    try {
      // Tenta inicializar lavagens e equipe (as duas tabelas críticas)
      await Promise.all([
        request('/api/washes'),
        request('/api/staff')
      ]);
      console.log("✅ API e Tabelas prontas.");
      return true;
    } catch (e: any) {
      console.warn("⚠️ Operando em modo offline:", e.message);
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
    try {
      await request('/api/washes', 'POST', wash);
    } catch (e) {
      console.error("Erro ao salvar lavagem remotamente:", e);
    }
  },

  async getStaff(): Promise<Staff[]> {
    try {
      const data = await request('/api/staff');
      const formatted = data.map((s: any) => ({
        ...s,
        dailyRate: parseFloat(s.dailyRate || s.dailyrate || 50),
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
    try {
      await request('/api/staff', 'POST', s);
    } catch {}
  },

  async getLoyalty(): Promise<LoyaltyConfig> {
    try {
      const rows = await request('/api/loyalty?type=config');
      const data = rows[0] || { theme: 'grad-ocean', stampsRequired: 10, rewardDescription: 'Grátis', isActive: true, companyName: 'Sparcar', stampIcon: 'water_drop' };
      storage.set('loyalty', data);
      return data;
    } catch { return storage.get('loyalty'); }
  },

  async saveLoyalty(config: LoyaltyConfig): Promise<void> {
    storage.set('loyalty', config);
    try {
      await request('/api/loyalty?type=config', 'POST', config);
    } catch {}
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
    try {
      await request('/api/loyalty?type=progress', 'POST', { clientKey: key, ...p });
    } catch {}
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
    try {
      await request('/api/expenses', 'POST', e);
    } catch {}
  }
};
