
export enum View {
  WASHES = 'WASHES',
  DASHBOARD = 'DASHBOARD',
  FINANCE = 'FINANCE',
  LOYALTY = 'LOYALTY',
  STAFF = 'STAFF',
  NEW_WASH = 'NEW_WASH'
}

export type UserRole = 'ADMIN' | 'LAVADOR';

export type WashStatus = 'PENDING' | 'PAID' | 'COMPLETED';

export interface Wash {
  id: string;
  clientName: string;
  clientPhone?: string;
  plate: string;
  model?: string;
  type: string;
  status: WashStatus;
  assignedStaff: string;
  price: number;
  services: string[];
  vehicleType: 'carro' | 'moto' | 'caminhao';
  date: string;
}

export interface ClientProgress {
  stamps: number;
  lastWashDate: string;
  phone: string;
}

export interface Staff {
  id: string;
  name: string;
  role: string;
  photo?: string;
  daysWorked: number;
  dailyRate: number;
  commission: number;
  unpaid: number;
  queuePosition: number;
  isActive: boolean;
}

export interface Expense {
  id: string;
  category: string;
  description: string;
  amount: number;
  date: string;
  status: 'PAID' | 'PENDING';
  paymentMethod: 'Dinheiro' | 'PIX' | 'Cartão de Crédito' | 'Cartão de Débito';
  installments?: number;
  operator?: string;
  brand?: string;
}

export interface LoyaltyConfig {
  theme: string;
  stampsRequired: number;
  rewardDescription: string;
  isActive: boolean;
  companyName: string;
  companySubtitle: string;
  companyLogo?: string;
  stampIcon: string;
}
