export type TransactionType = 'INCOME' | 'EXPENSE';
export type TransactionCategory = 'TATTOO' | 'MATERIAL' | 'FIXED' | 'MARKETING' | 'PRO_LABORE' | 'INVESTMENT' | 'OTHER';
export type PaymentMethod = 'PIX' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'BOLETO' | 'CASH';

export interface Transaction {
  id: string;
  tenantId: string;
  type: TransactionType;
  category: TransactionCategory;
  amount: number;          // em centavos
  paymentMethod?: PaymentMethod;
  clientId?: string;
  sessionId?: string;
  description?: string;
  date: string;
  createdAt: string;
  updatedAt: string;
  client?: { id: string; name: string };
}

export interface FinancialSummary {
  totalIncome: number;   // em centavos
  totalExpense: number;  // em centavos
  balance: number;       // em centavos
}

export interface CreateTransactionData {
  type: TransactionType;
  category: TransactionCategory;
  amount: number;
  paymentMethod?: PaymentMethod;
  clientId?: string;
  description?: string;
  date: string;
}

export type UpdateTransactionData = Partial<CreateTransactionData>;
