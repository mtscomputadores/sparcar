
import { Wash, Staff, Expense, LoyaltyConfig, ClientProgress } from './types';

// Função auxiliar para chamadas SQL via proxy API
async function query(sql: string, params: any[] = []) {
  const response = await fetch('/api/sql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: sql, params })
  });
  
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'Erro na consulta SQL');
  return result;
}

export const db = {
  isLocal: false,

  async init() {
    console.log("🚀 Inicializando Banco de Dados Neon...");
    
    try {
      // Criar tabelas se não existirem
      await query(`
        CREATE TABLE IF NOT EXISTS washes (
          id TEXT PRIMARY KEY,
          clientName TEXT,
          clientPhone TEXT,
          plate TEXT,
          model TEXT,
          type TEXT,
          status TEXT,
          assignedStaff TEXT,
          price NUMERIC,
          services TEXT,
          vehicleType TEXT,
          date TEXT
        );
      `);

      await query(`
        CREATE TABLE IF NOT EXISTS staff (
          id TEXT PRIMARY KEY,
          name TEXT,
          role TEXT,
          photo TEXT,
          daysWorked INTEGER DEFAULT 0,
          dailyRate NUMERIC DEFAULT 45,
          commission NUMERIC DEFAULT 0,
          unpaid NUMERIC DEFAULT 0,
          queuePosition INTEGER,
          isActive BOOLEAN DEFAULT true
        );
      `);

      await query(`
        CREATE TABLE IF NOT EXISTS expenses (
          id TEXT PRIMARY KEY,
          category TEXT,
          description TEXT,
          amount NUMERIC,
          date TEXT,
          status TEXT,
          paymentMethod TEXT,
          installments INTEGER DEFAULT 1,
          operator TEXT,
          brand TEXT
        );
      `);

      await query(`
        CREATE TABLE IF NOT EXISTS loyalty_config (
          id INTEGER PRIMARY KEY CHECK (id = 1),
          theme TEXT,
          stampsRequired INTEGER,
          rewardDescription TEXT,
          isActive BOOLEAN,
          companyName TEXT,
          companySubtitle TEXT,
          companyLogo TEXT,
          stampIcon TEXT
        );
      `);

      await query(`
        CREATE TABLE IF NOT EXISTS client_progress (
          clientKey TEXT PRIMARY KEY,
          stamps INTEGER,
          lastWashDate TEXT,
          phone TEXT
        );
      `);

      // Inicializar Staff padrão se vazio
      const currentStaff = await this.getStaff();
      if (currentStaff.length === 0) {
        await this.saveStaff({ id: '1', name: 'João Silva', role: 'Lavador', daysWorked: 0, dailyRate: 45, commission: 0, unpaid: 0, queuePosition: 1, isActive: true });
        await this.saveStaff({ id: '2', name: 'Maria Souza', role: 'Lavador', daysWorked: 0, dailyRate: 45, commission: 0, unpaid: 0, queuePosition: 2, isActive: true });
      }

      // Inicializar Loyalty padrão se vazio
      const currentLoyalty = await this.getLoyalty();
      if (!currentLoyalty) {
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

    } catch (e) {
      console.error("Erro ao inicializar tabelas:", e);
    }
  },

  async getWashes(): Promise<Wash[]> {
    const res = await query("SELECT * FROM washes ORDER BY date DESC, id DESC");
    return res.rows.map((r: any) => ({
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
        clientName = EXCLUDED.clientName,
        clientPhone = EXCLUDED.clientPhone,
        plate = EXCLUDED.plate,
        model = EXCLUDED.model,
        type = EXCLUDED.type,
        status = EXCLUDED.status,
        assignedStaff = EXCLUDED.assignedStaff,
        price = EXCLUDED.price,
        services = EXCLUDED.services,
        vehicleType = EXCLUDED.vehicleType,
        date = EXCLUDED.date
    `, [
      wash.id, wash.clientName, wash.clientPhone, wash.plate, wash.model, 
      wash.type, wash.status, wash.assignedStaff, wash.price, 
      JSON.stringify(wash.services), wash.vehicleType, wash.date
    ]);
  },

  async getStaff(): Promise<Staff[]> {
    const res = await query("SELECT * FROM staff ORDER BY queuePosition ASC");
    return res.rows.map((r: any) => ({
      ...r,
      dailyRate: parseFloat(r.dailyrate),
      commission: parseFloat(r.commission),
      unpaid: parseFloat(r.unpaid)
    }));
  },

  async saveStaff(s: Staff): Promise<void> {
    await query(`
      INSERT INTO staff (id, name, role, photo, daysWorked, dailyRate, commission, unpaid, queuePosition, isActive)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        role = EXCLUDED.role,
        photo = EXCLUDED.photo,
        daysWorked = EXCLUDED.daysWorked,
        dailyRate = EXCLUDED.dailyRate,
        commission = EXCLUDED.commission,
        unpaid = EXCLUDED.unpaid,
        queuePosition = EXCLUDED.queuePosition,
        isActive = EXCLUDED.isActive
    `, [s.id, s.name, s.role, s.photo, s.daysWorked, s.dailyRate, s.commission, s.unpaid, s.queuePosition, s.isActive]);
  },

  async getExpenses(): Promise<Expense[]> {
    const res = await query("SELECT * FROM expenses ORDER BY date DESC");
    return res.rows.map((r: any) => ({
      ...r,
      amount: parseFloat(r.amount)
    }));
  },

  async saveExpense(exp: Expense): Promise<void> {
    await query(`
      INSERT INTO expenses (id, category, description, amount, date, status, paymentMethod, installments, operator, brand)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT (id) DO UPDATE SET
        category = EXCLUDED.category,
        description = EXCLUDED.description,
        amount = EXCLUDED.amount,
        date = EXCLUDED.date,
        status = EXCLUDED.status,
        paymentMethod = EXCLUDED.paymentMethod,
        installments = EXCLUDED.installments,
        operator = EXCLUDED.operator,
        brand = EXCLUDED.brand
    `, [exp.id, exp.category, exp.description, exp.amount, exp.date, exp.status, exp.paymentMethod, exp.installments, exp.operator, exp.brand]);
  },

  async getLoyalty(): Promise<LoyaltyConfig | null> {
    const res = await query("SELECT * FROM loyalty_config WHERE id = 1");
    return res.rows[0] || null;
  },

  async saveLoyalty(config: LoyaltyConfig): Promise<void> {
    await query(`
      INSERT INTO loyalty_config (id, theme, stampsRequired, rewardDescription, isActive, companyName, companySubtitle, companyLogo, stampIcon)
      VALUES (1, $1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (id) DO UPDATE SET
        theme = EXCLUDED.theme,
        stampsRequired = EXCLUDED.stampsRequired,
        rewardDescription = EXCLUDED.rewardDescription,
        isActive = EXCLUDED.isActive,
        companyName = EXCLUDED.companyName,
        companySubtitle = EXCLUDED.companySubtitle,
        companyLogo = EXCLUDED.companyLogo,
        stampIcon = EXCLUDED.stampIcon
    `, [config.theme, config.stampsRequired, config.rewardDescription, config.isActive, config.companyName, config.companySubtitle, config.companyLogo, config.stampIcon]);
  },

  async getClientProgress(): Promise<Record<string, ClientProgress>> {
    const res = await query("SELECT * FROM client_progress");
    const progress: Record<string, ClientProgress> = {};
    res.rows.forEach((r: any) => {
      progress[r.clientkey] = {
        stamps: r.stamps,
        lastWashDate: r.lastwashdate,
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
        stamps = EXCLUDED.stamps,
        lastWashDate = EXCLUDED.lastWashDate,
        phone = EXCLUDED.phone
    `, [clientKey, p.stamps, p.lastWashDate, p.phone]);
  }
};
