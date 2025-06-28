export interface ResponseData {
  name: string;
  value: number;
  sum: number;
}

export interface Expense {
  name: string;
  price: number;
  date: string;
  category?: string;
  identifier?: string;
  vendor?: string;
}

export interface ExpensesModalProps {
  open: boolean;
  onClose: () => void;
  data: ModalData;
  color: string;
  setModalData?: (data: ModalData) => void;
  currentMonth?: string;
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