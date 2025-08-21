import { supabase } from '@/lib/supabase';
import { 
  AuditLogFormatted, 
  AuditHistoryEntry, 
  RecentAuditActivity, 
  AuditFilters,
  AuditSummary 
} from '@/types/audit';

export class AuditService {
  /**
   * Get audit history for a specific record
   */
  static async getAuditHistory(
    tableName: string, 
    recordId: string, 
    limit: number = 50
  ): Promise<AuditHistoryEntry[]> {
    const { data, error } = await supabase.rpc('get_audit_history', {
      p_table_name: tableName,
      p_record_id: recordId,
      p_limit: limit
    });

    if (error) {
      console.error('Error fetching audit history:', error);
      throw new Error('Failed to fetch audit history');
    }

    return data || [];
  }

  /**
   * Get recent audit activity across all tables
   */
  static async getRecentActivity(
    hours: number = 24, 
    limit: number = 100
  ): Promise<RecentAuditActivity[]> {
    const { data, error } = await supabase.rpc('get_recent_audit_activity', {
      p_hours: hours,
      p_limit: limit
    });

    if (error) {
      console.error('Error fetching recent audit activity:', error);
      throw new Error('Failed to fetch recent audit activity');
    }

    return data || [];
  }

  /**
   * Get filtered audit log entries
   */
  static async getAuditLog(
    filters: AuditFilters = {},
    limit: number = 100,
    offset: number = 0
  ): Promise<AuditLogFormatted[]> {
    let query = supabase
      .from('audit_log_formatted')
      .select('*');

    // Apply filters
    if (filters.table_name) {
      query = query.eq('table_name', filters.table_name);
    }

    if (filters.operation) {
      query = query.eq('operation', filters.operation);
    }

    if (filters.user_id) {
      query = query.eq('changed_by', filters.user_id);
    }

    if (filters.date_from) {
      query = query.gte('changed_at', filters.date_from);
    }

    if (filters.date_to) {
      query = query.lte('changed_at', filters.date_to);
    }

    if (filters.search) {
      query = query.or(`change_description.ilike.%${filters.search}%,user_display_name.ilike.%${filters.search}%,table_display_name.ilike.%${filters.search}%`);
    }

    const { data, error } = await query
      .order('changed_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching audit log:', error);
      throw new Error('Failed to fetch audit log');
    }

    return data || [];
  }

  /**
   * Get audit summary statistics
   */
  static async getAuditSummary(): Promise<AuditSummary> {
    // Get total changes
    const { count: totalChanges, error: totalError } = await supabase
      .from('audit_log')
      .select('*', { count: 'exact', head: true });

    if (totalError) {
      console.error('Error getting total changes:', totalError);
      throw new Error('Failed to get audit summary');
    }

    // Get changes today
    const today = new Date().toISOString().split('T')[0];
    const { count: changesToday, error: todayError } = await supabase
      .from('audit_log')
      .select('*', { count: 'exact', head: true })
      .gte('changed_at', today);

    if (todayError) {
      console.error('Error getting today changes:', todayError);
    }

    // Get changes this week
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const { count: changesThisWeek, error: weekError } = await supabase
      .from('audit_log')
      .select('*', { count: 'exact', head: true })
      .gte('changed_at', weekAgo.toISOString());

    if (weekError) {
      console.error('Error getting week changes:', weekError);
    }

    // Get most active user (simplified - just get recent activity)
    const { data: userActivity, error: userError } = await supabase
      .from('audit_log_formatted')
      .select('user_display_name')
      .gte('changed_at', weekAgo.toISOString())
      .limit(1);

    // Get most changed table (simplified)
    const { data: tableActivity, error: tableError } = await supabase
      .from('audit_log_formatted')
      .select('table_display_name')
      .gte('changed_at', weekAgo.toISOString())
      .limit(1);

    // Get recent activity
    const recentActivity = await this.getRecentActivity(24, 10);

    return {
      total_changes: totalChanges || 0,
      changes_today: changesToday || 0,
      changes_this_week: changesThisWeek || 0,
      most_active_user: userActivity?.[0]?.user_display_name || 'N/A',
      most_changed_table: tableActivity?.[0]?.table_display_name || 'N/A',
      recent_activity: recentActivity
    };
  }

  /**
   * Get list of available tables for filtering
   */
  static async getAvailableTables(): Promise<string[]> {
    const { data, error } = await supabase
      .from('audit_log')
      .select('table_name')
      .neq('table_name', null);

    if (error) {
      console.error('Error fetching available tables:', error);
      return [];
    }

    // Get unique table names
    const uniqueTables = [...new Set(data.map(item => item.table_name))];
    return uniqueTables.sort();
  }

  /**
   * Get list of users who have made changes (for filtering)
   */
  static async getAuditUsers(): Promise<Array<{id: string, name: string, role: string}>> {
    const { data, error } = await supabase
      .from('audit_log_formatted')
      .select('changed_by, user_display_name, user_display_role')
      .neq('changed_by', null);

    if (error) {
      console.error('Error fetching audit users:', error);
      return [];
    }

    // Get unique users
    const uniqueUsers = data.reduce((acc: Array<{id: string, name: string, role: string}>, curr) => {
      if (curr.changed_by && !acc.find(u => u.id === curr.changed_by)) {
        acc.push({
          id: curr.changed_by,
          name: curr.user_display_name,
          role: curr.user_display_role
        });
      }
      return acc;
    }, []);

    return uniqueUsers.sort((a, b) => a.name.localeCompare(b.name));
  }
}
