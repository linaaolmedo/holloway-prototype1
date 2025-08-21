export interface Invoice {
  id: number;
  invoice_number: string | null;
  customer_id: number;
  date_created: string;
  due_date: string | null;
  total_amount: number | null;
  is_paid: boolean;
  paid_date: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export interface Customer {
  id: number;
  name: string;
  primary_contact_name: string | null;
  primary_contact_email: string | null;
  primary_contact_phone: string | null;
  credit_limit: number | null;
  payment_terms: number | null;
  consolidated_invoicing: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export interface InvoiceWithDetails extends Invoice {
  customer?: Customer;
  loads?: LoadForInvoice[];
}

export interface LoadForInvoice {
  id: number;
  customer_id: number;
  commodity: string | null;
  pickup_date: string | null;
  delivery_date: string | null;
  rate_customer: number | null;
  status: string;
  origin_location?: {
    id: number;
    location_name: string | null;
    city: string | null;
    state: string | null;
  };
  destination_location?: {
    id: number;
    location_name: string | null;
    city: string | null;
    state: string | null;
  };
}

export interface LoadReadyForInvoice extends LoadForInvoice {
  customer?: Customer;
  days_since_delivery: number;
}

export interface CreateInvoiceData {
  customer_id: number;
  load_ids: number[];
  due_date?: string;
  notes?: string;
}

export interface UpdateInvoiceData {
  invoice_number?: string;
  due_date?: string;
  total_amount?: number;
  is_paid?: boolean;
  paid_date?: string;
}

export interface BillingFilters {
  customer_id?: number;
  invoice_number?: string;
  date_from?: string;
  date_to?: string;
  is_paid?: boolean;
  search?: string;
}

export interface BillingTab {
  id: 'ready' | 'outstanding' | 'paid';
  label: string;
  count: number;
}

export interface BillingSummary {
  ready_to_invoice: {
    count: number;
    amount: number;
  };
  outstanding_invoices: {
    count: number;
    amount: number;
  };
  paid_last_30_days: {
    count: number;
    amount: number;
  };
}

export interface BillingTableProps {
  activeTab: 'ready' | 'outstanding' | 'paid';
  data: (LoadReadyForInvoice | InvoiceWithDetails)[];
  loading?: boolean;
  selectedItems: number[];
  onSelectionChange: (ids: number[]) => void;
  onCreateInvoice?: (loads: LoadReadyForInvoice[]) => void;
  onViewInvoice?: (invoice: InvoiceWithDetails) => void;
  onMarkPaid?: (invoice: InvoiceWithDetails) => void;
}

export interface CreateInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateInvoiceData) => void;
  selectedLoads: LoadReadyForInvoice[];
  loading?: boolean;
}

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue';
