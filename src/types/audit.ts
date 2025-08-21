// =====================================================================
// AUDIT TRAIL TYPES - TypeScript interfaces for audit log functionality
// =====================================================================

export interface AuditLogEntry {
  id: number;
  table_name: string;
  record_id: string;
  operation: 'INSERT' | 'UPDATE' | 'DELETE';
  field_name?: string;
  old_value?: string;
  new_value?: string;
  changed_at: string;
  changed_by?: string;
  user_email?: string;
  user_name?: string;
  user_role?: string;
  ip_address?: string;
  user_agent?: string;
}

export interface AuditLogFormatted {
  id: number;
  table_name: string;
  record_id: string;
  operation: 'INSERT' | 'UPDATE' | 'DELETE';
  field_name?: string;
  old_value?: string;
  new_value?: string;
  changed_at: string;
  changed_by?: string;
  user_display_name: string;
  user_display_email: string;
  user_display_role: string;
  change_description: string;
  table_display_name: string;
}

export interface AuditHistoryEntry {
  id: number;
  operation: 'INSERT' | 'UPDATE' | 'DELETE';
  field_name?: string;
  old_value?: string;
  new_value?: string;
  change_description: string;
  changed_at: string;
  user_display_name: string;
  user_display_role: string;
}

export interface RecentAuditActivity {
  id: number;
  table_display_name: string;
  record_id: string;
  operation: 'INSERT' | 'UPDATE' | 'DELETE';
  change_description: string;
  changed_at: string;
  user_display_name: string;
  user_display_role: string;
}

export interface AuditFilters {
  table_name?: string;
  operation?: 'INSERT' | 'UPDATE' | 'DELETE';
  user_id?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
}

export interface AuditSummary {
  total_changes: number;
  changes_today: number;
  changes_this_week: number;
  most_active_user: string;
  most_changed_table: string;
  recent_activity: RecentAuditActivity[];
}
