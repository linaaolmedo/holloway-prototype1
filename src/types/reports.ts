export interface Report {
  id: number;
  name: string;
  type: ReportType;
  description: string | null;
  status: ReportStatus;
  file_url: string | null;
  file_size: number | null;
  filters: ReportFilters;
  scheduled: boolean;
  schedule_frequency: ScheduleFrequency | null;
  next_run: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export type ReportType = 'loads' | 'carriers' | 'fleet' | 'customers';
export type ReportStatus = 'pending' | 'generating' | 'completed' | 'failed';
export type ScheduleFrequency = 'daily' | 'weekly' | 'monthly' | 'quarterly';
export type ExportFormat = 'csv' | 'pdf';

export interface ReportFilters {
  date_from?: string;
  date_to?: string;
  status_filter?: string[];
  customer_ids?: number[];
  carrier_ids?: number[];
  equipment_type_ids?: number[];
  custom_filters?: Record<string, unknown>;
}

export interface CreateReportData {
  name: string;
  type: ReportType;
  description?: string;
  filters: ReportFilters;
  format: ExportFormat;
  scheduled?: boolean;
  schedule_frequency?: ScheduleFrequency;
}

export interface UpdateReportData {
  name?: string;
  description?: string;
  filters?: ReportFilters;
  scheduled?: boolean;
  schedule_frequency?: ScheduleFrequency;
  status?: ReportStatus;
  file_url?: string;
  file_size?: number;
}

export interface ReportGenerationRequest {
  type: ReportType;
  filters: ReportFilters;
  format: ExportFormat;
  name: string;
}

export interface LoadReportData extends Record<string, unknown> {
  id: number;
  load_number: string;
  customer_name: string;
  origin_city: string;
  origin_state: string;
  destination_city: string;
  destination_state: string;
  equipment_type: string;
  commodity: string;
  weight: number;
  status: string;
  pickup_date: string;
  delivery_date: string;
  carrier_name: string;
  driver_name: string;
  truck_number: string;
  trailer_number: string;
  customer_rate: number;
  carrier_rate: number;
  margin: number;
  margin_percent: number;
  pod_uploaded: boolean;
  created_at: string;
}

export interface CarrierReportData extends Record<string, unknown> {
  id: number;
  name: string;
  mc_number: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  operating_states: string;
  equipment_types: string;
  total_loads: number;
  active_loads: number;
  total_revenue: number;
  average_rate: number;
  on_time_percentage: number;
  dnu_flag: boolean;
  created_at: string;
}

export interface FleetReportData extends Record<string, unknown> {
  id: number;
  type: 'truck' | 'trailer' | 'driver';
  identifier: string; // truck_number, trailer_number, or driver name
  license_plate: string;
  equipment_type: string;
  status: string;
  current_load_id: number;
  utilization_rate: number;
  maintenance_due: string;
  total_miles: number;
  revenue_generated: number;
  last_assignment: string;
  created_at: string;
}

export interface CustomerReportData extends Record<string, unknown> {
  id: number;
  name: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  credit_limit: number;
  payment_terms: number;
  total_loads: number;
  active_loads: number;
  total_revenue: number;
  average_rate: number;
  outstanding_invoices: number;
  outstanding_amount: number;
  payment_history_score: number;
  locations_count: number;
  created_at: string;
}

export interface ReportTableProps {
  reports: Report[];
  loading?: boolean;
  onEdit: (report: Report) => void;
  onDelete: (report: Report) => void;
  onGenerate: (report: Report) => void;
  onDownload: (report: Report) => void;
  onView: (report: Report) => void;
}

export interface ReportFormProps {
  report?: Report;
  onSubmit: (data: CreateReportData | UpdateReportData) => void;
  onCancel: () => void;
  loading?: boolean;
}

export interface ReportFiltersProps {
  onFiltersChange: (filters: ReportSearchFilters) => void;
  loading?: boolean;
}

export interface ReportSearchFilters {
  type?: ReportType;
  status?: ReportStatus;
  created_from?: string;
  created_to?: string;
  search?: string;
}
