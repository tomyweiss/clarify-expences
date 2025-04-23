export interface ResponseData {
  name: string;
  value: number;
  sum: number;
}

export interface Expense {
  name: string;
  price: number;
  date: string;
}

export interface ExpensesModalProps {
  open: boolean;
  onClose: () => void;
  data: ModalData;
  color: string;
} 

export interface Income {
  income_type: string;
  amount: number;
}

export interface ModalData {
  type: string;
  data: Expense[];
}

export interface BoxPanelData {
  allTransactions: string;
  nonMapped: string;
  categories: string;
  lastMonth: string;
}