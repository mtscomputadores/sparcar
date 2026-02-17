
import { Wash, Staff, Expense, LoyaltyConfig, ClientProgress } from './types';

const NEON_DB_URL = "postgresql://neondb_owner:npg_Zle4yEaI6BiN@ep-blue-voice-aj19kiu7-pooler.c-3.us-east-2.aws.neon.tech/neondb?sslmode=require";

async function query(sql: string, params: any[] = []) {
  try {
    let response;
    
    // Tentativa 1: Proxy local (Vercel)
    try {
      response = await fetch('/api/sql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: sql, params })
      });
      
      // Se deu erro 500 ou 404, forçamos a ida para a tentativa 2 (direta)
      if (!response.ok) throw new Error("Proxy falhou");
    } catch (e) {
      // Tentativa 2: Conexão Direta via Neon HTTP API (Suporta CORS)
      // O Neon HTTP API não gosta do hostname '-pooler', então limpamos
      const cleanUrl = NEON_DB_URL.replace('-pooler', '');
      
      response = await fetch('https://proxy.neon.tech/sql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Neon-Connection-String': cleanUrl
        },
        body: JSON.stringify({ query: sql, params })
      });
    }

    const result = await response.json();
    if (!response.ok) throw new Error(result.message || result.error || 'Erro na consulta SQL');
    return result;
  } catch (err: any) {
    console.error("Database query error:", err.message);
    throw err;
  }
}

export const db = {
  isLocal: false,

  async init() {
    console.log("🚀 Iniciando conexão com Neon...");
    
    try {
      await query(`CREATE TABLE IF NOT EXISTS washes (id TEXT PRIMARY KEY, clientName TEXT, clientPhone TEXT, plate TEXT, model TEXT, type TEXT, status TEXT, assignedStaff TEXT, price NUMERIC, services TEXT, vehicleType TEXT, date TEXT);`);
      await query(`CREATE TABLE IF NOT EXISTS staff (id TEXT PRIMARY KEY, name TEXT, role TEXT, photo TEXT, daysWorked INTEGER DEFAULT 0, dailyRate NUMERIC DEFAULT 45, commission NUMERIC DEFAULT 0, unpaid NUMERIC DEFAULT 0, queuePosition INTEGER, isActive BOOLEAN DEFAULT true);`);
      await query(`CREATE TABLE IF NOT EXISTS expenses (id TEXT PRIMARY KEY, category TEXT, description TEXT, amount NUMERIC, date TEXT, status TEXT, paymentMethod TEXT, installments INTEGER DEFAULT 1, operator TEXT, brand TEXT);`);
      await query(`CREATE TABLE IF NOT EXISTS loyalty_config (id INTEGER PRIMARY KEY CHECK (id = 1), theme TEXT, stampsRequired INTEGER, rewardDescription TEXT, isActive BOOLEAN, companyName TEXT, companySubtitle TEXT, companyLogo TEXT, stampIcon TEXT);`);
      await query(`CREATE TABLE IF NOT EXISTS client_progress (clientKey TEXT PRIMARY KEY, stamps INTEGER, lastWashDate TEXT, phone TEXT);`);

      const staffRes = await query("SELECT count(*) as count FROM staff");
      if (parseInt(staffRes.rows[0].count) === 0) {
        await this.saveStaff({ id: '1', name: 'João Silva', role: 'Lavador', daysWorked: 0, dailyRate: 45, commission: 0, unpaid: 0, queuePosition: 1, isActive: true });
        await this.saveStaff({ id: '2', name: 'Maria Souza', role: 'Lavador', daysWorked: 0, dailyRate: 45, commission: 0, unpaid: 0, queuePosition: 2, isActive: true });
      }

      const loyaltyRes = await query("SELECT count(*) as count FROM loyalty_config");
      if (parseInt(loyaltyRes.rows[0].count) === 0) {
        await this.saveLoyalty({
          theme: 'grad-ocean',
          stampsRequired: 10,
          rewardDescription: 'Lavagem Especial Grátis',
          isActive: true,
          companyName: 'Lava Jato Pro',
          companySubtitle: 'Qualidade em cada detalhe',
          stampIcon: 'water_drop'
        });
      }

      console.log("✅ Banco de Dados Neon conectado com sucesso!");
    } catch (e: any) {
      console.error("❌ Falha crítica ao iniciar banco:", e.message);
    }
  },

  async getWashes(): Promise<Wash[]> {
    const res = await query("SELECT * FROM washes ORDER BY date DESC, id DESC");
    return (res.rows || []).map((r: any) => ({
      ...r,
      services: JSON.parse(r.services || '[]'),
      price: parseFloat(r.price)
    }));
  },

  async saveWash(wash: Wash): Promise<void> {
    await query(`
      INSERT INTO washes (id, clientName, clientPhone, plate, model, type, status, assignedStaff, price, services, vehicleType, date)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      ON CONFLICT (id) DO UPDATE SET
        clientName = EXCLUDED.clientName, clientPhone = EXCLUDED.clientPhone, plate = EXCLUDED.plate,
        model = EXCLUDED.model, type = EXCLUDED.type, status = EXCLUDED.status,
        assignedStaff = EXCLUDED.assignedStaff, price = EXCLUDED.price, services = EXCLUDED.services,
        vehicleType = EXCLUDED.vehicleType, date = EXCLUDED.date
    `, [wash.id, wash.clientName, wash.clientPhone, wash.plate, wash.model, wash.type, wash.status, wash.assignedStaff, wash.price, JSON.stringify(wash.services), wash.vehicleType, wash.date]);
  },

  async getStaff(): Promise<Staff[]> {
    const res = await query("SELECT * FROM staff ORDER BY queuePosition ASC");
    return (res.rows || []).map((r: any) => ({
      ...r,
      dailyRate: parseFloat(r.dailyrate || r.dailyRate || 0),
      commission: parseFloat(r.commission || 0),
      unpaid: parseFloat(r.unpaid || 0)
    }));
  },

  async saveStaff(s: Staff): Promise<void> {
    await query(`
      INSERT INTO staff (id, name, role, photo, daysWorked, dailyRate, commission, unpaid, queuePosition, isActive)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name, role = EXCLUDED.role, photo = EXCLUDED.photo,
        daysWorked = EXCLUDED.daysWorked, dailyRate = EXCLUDED.dailyRate,
        commission = EXCLUDED.commission, unpaid = EXCLUDED.unpaid,
        queuePosition = EXCLUDED.queuePosition, isActive = EXCLUDED.isActive
    `, [s.id, s.name, s.role, s.photo, s.daysWorked, s.dailyRate, s.commission, s.unpaid, s.queuePosition, s.isActive]);
  },

  async getExpenses(): Promise<Expense[]> {
    const res = await query("SELECT * FROM expenses ORDER BY date DESC");
    return (res.rows || []).map((r: any) => ({
      ...r,
      amount: parseFloat(r.amount)
    }));
  },

  async saveExpense(exp: Expense): Promise<void> {
    await query(`
      INSERT INTO expenses (id, category, description, amount, date, status, paymentMethod, installments, operator, brand)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT (id) DO UPDATE SET
        category = EXCLUDED.category, description = EXCLUDED.description, amount = EXCLUDED.amount,
        date = EXCLUDED.date, status = EXCLUDED.status, paymentMethod = EXCLUDED.paymentMethod,
        installments = EXCLUDED.installments, operator = EXCLUDED.operator, brand = EXCLUDED.brand
    `, [exp.id, exp.category, exp.description, exp.amount, exp.date, exp.status, exp.paymentMethod, exp.installments, exp.operator, exp.brand]);
  },

  async getLoyalty(): Promise<LoyaltyConfig | null> {
    const res = await query("SELECT * FROM loyalty_config WHERE id = 1");
    return res.rows && res.rows.length > 0 ? res.rows[0] : null;
  },

  async saveLoyalty(config: LoyaltyConfig): Promise<void> {
    await query(`
      INSERT INTO loyalty_config (id, theme, stampsRequired, rewardDescription, isActive, companyName, companySubtitle, companyLogo, stampIcon)
      VALUES (1, $1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (id) DO UPDATE SET
        theme = EXCLUDED.theme, stampsRequired = EXCLUDED.stampsRequired, rewardDescription = EXCLUDED.rewardDescription,
        isActive = EXCLUDED.isActive, companyName = EXCLUDED.companyName, companySubtitle = EXCLUDED.companySubtitle,
        companyLogo = EXCLUDED.companyLogo, stampIcon = EXCLUDED.stampIcon
    `, [config.theme, config.stampsRequired, config.rewardDescription, config.isActive, config.companyName, config.companySubtitle, config.companyLogo, config.stampIcon]);
  },

  async getClientProgress(): Promise<Record<string, ClientProgress>> {
    const res = await query("SELECT * FROM client_progress");
    const progress: Record<string, ClientProgress> = {};
    (res.rows || []).forEach((r: any) => {
      progress[r.clientkey || r.clientKey] = {
        stamps: r.stamps,
        lastWashDate: r.lastwashdate || r.lastWashDate,
        phone: r.phone
      };
    });
    return progress;
  },

  async saveClientProgress(clientKey: string, p: ClientProgress): Promise<void> {
    await query(`
      INSERT INTO client_progress (clientKey, stamps, lastWashDate, phone)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (clientKey) DO UPDATE SET
        stamps = EXCLUDED.stamps, lastWashDate = EXCLUDED.lastWashDate, phone = EXCLUDED.phone
    `, [clientKey, p.stamps, p.lastWashDate, p.phone]);
  }
};
